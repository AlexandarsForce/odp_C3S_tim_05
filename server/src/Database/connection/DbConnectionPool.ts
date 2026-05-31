import mysql, { Pool, PoolConnection } from "mysql2/promise";
import dotenv from "dotenv";
import { DbNode } from "../../Domain/models/DbNode";
import { NodeStatus } from "../../Domain/enums/NodeStatus";
import { HEALTH_CHECK_TIMEOUT } from "../../Domain/constants/Constants";
import { ILoggerService } from "../../Domain/services/logger/ILoggerService";
import { IHealthService } from "../../Domain/services/health/IHealthService";
import { IAuditService } from "../../Domain/services/audit/IAuditService";

dotenv.config();

const DB_NAME = process.env.DB_NAME ?? "project_db";

const masterPool: Pool = mysql.createPool({
  host:     process.env.DB_MASTER_HOST     ?? "localhost",
  port:     parseInt(process.env.DB_MASTER_PORT ?? "3306", 10),
  user:     process.env.DB_MASTER_USER     ?? "root",
  password: process.env.DB_MASTER_PASSWORD ?? "",
  database: process.env.DB_MASTER_NAME     ?? DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  connectTimeout: HEALTH_CHECK_TIMEOUT,
});

const slave1Pool: Pool = mysql.createPool({
  host:     process.env.DB_SLAVE1_HOST     ?? "localhost",
  port:     parseInt(process.env.DB_SLAVE1_PORT ?? "3307", 10),
  user:     process.env.DB_SLAVE1_USER     ?? "root",
  password: process.env.DB_SLAVE1_PASSWORD ?? "",
  database: process.env.DB_SLAVE1_NAME     ?? DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  connectTimeout: HEALTH_CHECK_TIMEOUT,
});

const slave2Pool: Pool = mysql.createPool({
  host:     process.env.DB_SLAVE2_HOST     ?? "localhost",
  port:     parseInt(process.env.DB_SLAVE2_PORT ?? "3308", 10),
  user:     process.env.DB_SLAVE2_USER     ?? "root",
  password: process.env.DB_SLAVE2_PASSWORD ?? "",
  database: process.env.DB_SLAVE2_NAME     ?? DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  connectTimeout: HEALTH_CHECK_TIMEOUT,
});

interface NodeInfo { name: string; pool: Pool; node: DbNode; exReads?: boolean; orgMaster?: boolean}

type ReplicaStatusRow = {
  Seconds_Behind_Master: number | null;
}

export class DbManager implements IHealthService {
  private master: NodeInfo;
  private slaves: NodeInfo[];
  private slaveRrIndex: number = 0;
  private healthTimer: NodeJS.Timeout | null = null;
  private failoverInProgress: boolean = false;
  private auditService: IAuditService | null = null;

  public setAuditService(service: IAuditService): void {
    this.auditService = service;
  }

  public isWriteAvailable(): boolean {
    return this.master.node.status !== NodeStatus.UNREACHABLE && !this.failoverInProgress;
  }

  public constructor(private readonly logger: ILoggerService) {
    this.master = {
      name: "master", pool: masterPool,
      node: new DbNode("master", process.env.DB_MASTER_HOST ?? "localhost", parseInt(process.env.DB_MASTER_PORT ?? "3306", 10)),
      orgMaster: true,
    };
    this.slaves = [
      { name: "slave1", pool: slave1Pool, node: new DbNode("slave1", process.env.DB_SLAVE1_HOST ?? "localhost", parseInt(process.env.DB_SLAVE1_PORT ?? "3307", 10)) },
      { name: "slave2", pool: slave2Pool, node: new DbNode("slave2", process.env.DB_SLAVE2_HOST ?? "localhost", parseInt(process.env.DB_SLAVE2_PORT ?? "3308", 10)) },
    ];
  }

  private async checkNode(info: NodeInfo): Promise<void> {
    const start = Date.now();
    let conn: PoolConnection | null = null;
    try {
      conn = await Promise.race([
        info.pool.getConnection(),
        new Promise<PoolConnection>((_, reject) => setTimeout(() => reject(new Error("Connection timeout")), HEALTH_CHECK_TIMEOUT)),
      ]);

      await conn.query("SELECT 1");
      const ms = Date.now() - start;
      info.node.status = ms > HEALTH_CHECK_TIMEOUT ? NodeStatus.DEGRADED : NodeStatus.HEALTHY;
    } catch (err) {
      info.node.status = NodeStatus.UNREACHABLE;
      info.node.failedWrites++;
      this.logger.warn("DB", `Node ${info.name} failed health check`);
    } finally {
      if (conn) conn.release();
      info.node.lastCheck = new Date();
    }
  }

  private async monitorRepLag(info: NodeInfo): Promise<void> {
    if (info.node.status === NodeStatus.UNREACHABLE) {
      info.node.repLagMs = null;
      return;
    }

    let conn: PoolConnection | null = null;

    try {
      conn = await info.pool.getConnection();

      const [rows] = await conn.query(
        "SHOW SLAVE STATUS"
      ) as [ReplicaStatusRow[], mysql.FieldPacket[]];

      if (Array.isArray(rows) && rows.length > 0) {
        const lag = rows[0].Seconds_Behind_Master;

        info.node.repLagMs =
          typeof lag === "number"
            ? lag * 1000
            : null;
      }
    } catch {
      info.node.repLagMs = null;
    } finally {
      if (conn) conn.release();
    }
  }

  private async autoPromoteSlave(): Promise<void> {
    if (this.master.node.status !== NodeStatus.UNREACHABLE) {
      return;
    }

    const candidate = this.slaves.find(
      (s) =>
        s.node.status !== NodeStatus.UNREACHABLE &&
        !s.exReads
    );

    if (!candidate) {
      this.logger.error("DB", "Master unreachable and no slave available");
      return;
    }

    this.failoverInProgress = true;
    let conn: PoolConnection | null = null;

    try {
      conn = await candidate.pool.getConnection();

      await conn.query("STOP REPLICA");
      await conn.query("RESET REPLICA ALL");
      await conn.query("SET GLOBAL read_only = 0");
    } catch (err) {
      this.logger.error("DB", `Failed to promote ${candidate.name}`, err);
      this.failoverInProgress = false;
      return;
    } finally {
      if (conn) conn.release();
    }

    const oldMaster = this.master;

    this.slaves = this.slaves
      .filter((s) => s.name !== candidate.name)
      .concat({ ...oldMaster, exReads: true });

    this.master = { ...candidate };
    this.slaveRrIndex = 0;
    this.failoverInProgress = false;

    this.logger.warn("DB", `${candidate.name} promoted to master (auto failover)`);
    await this.auditService?.log({
      action: "AUTO_FAILOVER_PROMOTE",
      details: `Auto failover: ${candidate.name} promoted to master. Previous master: ${oldMaster.name}`,
    });
  }

  private async autoRestoreMaster(): Promise<void> {
    if (this.master.orgMaster) {
      return;
    }

    const original = this.slaves.find(
      (s) =>
        s.orgMaster &&
        s.node.status !== NodeStatus.UNREACHABLE
    );

    if (!original) {
      return;
    }

    let conn: PoolConnection | null = null;

    try {
      conn = await original.pool.getConnection();

      await conn.query("SET GLOBAL read_only = 0");
    } catch {
      return;
    } finally {
      if (conn) conn.release();
    }

    const currentMaster = this.master;

    this.slaves = this.slaves
      .filter((s) => s.name !== original.name)
      .concat({
        ...currentMaster,
        exReads: false,
      });

    this.master = {
      ...original,
      orgMaster: true,
    };

    this.slaveRrIndex = 0;

    this.logger.warn("DB", `Original master restored: ${original.name}`);
    await this.auditService?.log({
      action: "AUTO_FAILOVER_RESTORE",
      details: `Original master ${original.name} restored. Demoted: ${currentMaster.name}`,
    });
  }

  public async runHealthCheck(): Promise<void> {
    await Promise.all([this.master, ...this.slaves].map((n) => this.checkNode(n)));
    await Promise.all(this.slaves.map((s) => this.monitorRepLag(s)));

    await this.autoPromoteSlave();

    await this.autoRestoreMaster();
    this.logger.info("DB", [this.master, ...this.slaves].map((n) => `${n.name}=${n.node.status}`).join(" | "));
  }

  public async promoteSlaveToMaster(idx: number): Promise<{ success: boolean; message: string }> {
    if (idx < 0 || idx >= this.slaves.length) {
      return {
        success: false,
        message: "Invalid slave index",
      };
    }

    const slave = this.slaves[idx];

    if (slave.node.status === NodeStatus.UNREACHABLE) {
      return {
        success: false,
        message: "Slave is unreachable",
      };
    }

    this.failoverInProgress = true;
    let conn: PoolConnection | null = null;

    try {
      conn = await slave.pool.getConnection();

      await conn.query("STOP REPLICA");
      await conn.query("RESET REPLICA ALL");
      await conn.query("SET GLOBAL read_only = 0");
    } catch (err) {
      this.logger.error("DB", "Promotion failed", err);
      this.failoverInProgress = false;
      return {
        success: false,
        message: "Promotion failed",
      };
    } finally {
      if (conn) conn.release();
    }

    const oldMaster = this.master;

    this.slaves = this.slaves
      .filter((_, i) => i !== idx)
      .concat({ ...oldMaster, exReads: true });

    this.master = slave;
    this.failoverInProgress = false;

    this.logger.warn("DB", `${slave.name} promoted manually`);

    return {
      success: true,
      message: `${slave.name} promoted to master`,
    };
  }

  public async startHealthCheck(intervalMs: number): Promise<void> {
    await this.runHealthCheck();
    this.healthTimer = setInterval(() => void this.runHealthCheck(), intervalMs);
  }

  /** All writes (INSERT/UPDATE/DELETE) → Master only */
  public async getWriteConnection(): Promise<{ conn: PoolConnection; nodeName: string } | null> {
    if (this.master.node.status === NodeStatus.UNREACHABLE) {
      this.logger.error("DB", "Master is UNREACHABLE — write not possible");
      return null;
    }
    try {
      const conn = await this.master.pool.getConnection();
      this.master.node.successfulWrites++;
      return { conn, nodeName: this.master.name };
    } catch (err) {
      this.master.node.status = NodeStatus.UNREACHABLE;
      this.master.node.failedWrites++;
      this.logger.error("DB", "Failed to connect to master", err);
      return null;
    }
  }

  /** All reads (SELECT) → Round-Robin slaves, fallback to Master */
  public async getReadConnection(): Promise<{ conn: PoolConnection; nodeName: string } | null> {
    const n = this.slaves.length;
    for (let i = 0; i < n; i++) {
      const idx = (this.slaveRrIndex + i) % n;
      const info = this.slaves[idx];
      if (info.node.status === NodeStatus.UNREACHABLE || info.exReads) continue;
      try {
        const conn = await info.pool.getConnection();
        this.slaveRrIndex = (idx + 1) % n;
        info.node.successfulWrites++;
        return { conn, nodeName: info.name };
      } catch (err) {
        info.node.status = NodeStatus.UNREACHABLE;
        info.node.failedWrites++;
        this.logger.warn("DB", `Slave ${info.name} unreachable, trying next`);
      }
    }
    // Fallback to master
    this.logger.warn("DB", "All slaves unreachable — falling back to master for read");
    if (this.master.node.status === NodeStatus.UNREACHABLE) {
      this.logger.error("DB", "Master also unreachable — read not possible");
      return null;
    }
    try {
      const conn = await this.master.pool.getConnection();
      this.master.node.successfulWrites++;
      return { conn, nodeName: this.master.name };
    } catch (err) {
      this.master.node.status = NodeStatus.UNREACHABLE;
      this.logger.error("DB", "Failed to connect to master for fallback read", err);
      return null;
    }
  }

  public getHealthStatus(): DbNode[] { return [this.master.node, ...this.slaves.map((s) => s.node)]; }
  public getSlaveRrIndex(): number { return this.slaveRrIndex; }
  public stop(): void { if (this.healthTimer) clearInterval(this.healthTimer); }
}
