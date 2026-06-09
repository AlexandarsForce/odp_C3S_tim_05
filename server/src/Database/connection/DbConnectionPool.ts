import mysql, { Pool, PoolConnection } from "mysql2/promise";
import dotenv from "dotenv";
import { DbNode } from "../../Domain/models/DbNode";
import { NodeStatus } from "../../Domain/enums/NodeStatus";
import { HEALTH_CHECK_TIMEOUT } from "../../Domain/constants/Constants";
import { ILoggerService } from "../../Domain/services/logger/ILoggerService";
import { IHealthService } from "../../Domain/services/health/IHealthService";
import { IAuditService } from "../../Domain/services/audit/IAuditService";
import { DbAuditIntegration } from "./DbAuditIntegration";
import { DbReplicationMonitor } from "./DbReplicationMonitor";
import { DbFailoverService } from "./DbFailoverService";
import { DbWriteAvailability } from "./DbWriteAvailability";

dotenv.config();

const DB_NAME = process.env.DB_NAME ?? "project_db";

// ─────────────────────────── POOL SETUP ────────────────────────────

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

// ────────────────────── SHARED CLUSTER TYPES ───────────────────────

export interface NodeInfo {
  name: string;
  pool: Pool;
  node: DbNode;
  exReads?: boolean;
  orgMaster?: boolean;
}

/**
 * Mutable cluster state shared by reference across all services.
 * DbConnectionPool owns it; monitor/failover/availability read & mutate it.
 */
export interface ClusterState {
  master: NodeInfo;
  slaves: NodeInfo[];
  slaveRrIndex: number;
  failoverInProgress: boolean;
}

// ──────────────────────────── FACADE ───────────────────────────────

export class DbManager implements IHealthService {
  private readonly state: ClusterState;
  private healthTimer?: NodeJS.Timeout;

  private readonly audit: DbAuditIntegration;
  private readonly monitor: DbReplicationMonitor;
  private readonly failover: DbFailoverService;
  private readonly availability: DbWriteAvailability;

  public constructor(private readonly logger: ILoggerService) {
    const master: NodeInfo = {
      name: "master",
      pool: masterPool,
      node: new DbNode("master", process.env.DB_MASTER_HOST ?? "localhost", parseInt(process.env.DB_MASTER_PORT ?? "3306", 10)),
      orgMaster: true,
    };
    const slaves: NodeInfo[] = [
      { name: "slave1", pool: slave1Pool, node: new DbNode("slave1", process.env.DB_SLAVE1_HOST ?? "localhost", parseInt(process.env.DB_SLAVE1_PORT ?? "3307", 10)) },
      { name: "slave2", pool: slave2Pool, node: new DbNode("slave2", process.env.DB_SLAVE2_HOST ?? "localhost", parseInt(process.env.DB_SLAVE2_PORT ?? "3308", 10)) },
    ];

    this.state = {
      master,
      slaves,
      slaveRrIndex: 0,
      failoverInProgress: false,
    };

    this.audit        = new DbAuditIntegration();
    this.monitor      = new DbReplicationMonitor(this.state, logger);
    this.failover     = new DbFailoverService(this.state, logger, this.audit);
    this.availability = new DbWriteAvailability(this.state);
  }

  // ───────────────────── DELEGATIONS / WIRING ─────────────────────

  public setAuditService(service: IAuditService): void {
    this.audit.setAuditService(service);
  }

  public isWriteAvailable(): boolean {
    return this.availability.isWriteAvailable();
  }

  public getHealthStatus(): DbNode[] {
    return this.monitor.getHealthStatus();
  }

  public async promoteSlaveToMaster(idx: number): Promise<{ success: boolean; message: string }> {
    return this.failover.promoteSlaveToMaster(idx);
  }

  public getSlaveRrIndex(): number {
    return this.state.slaveRrIndex;
  }

  // ─────────────────────────── LIFECYCLE ──────────────────────────

  private async runHealthCheck(): Promise<void> {
    await this.monitor.checkAllNodes();
    await this.failover.autoPromoteSlave();
    await this.failover.autoRestoreMaster();
    this.logger.info(
      "DB",
      [this.state.master, ...this.state.slaves]
        .map((n) => `${n.name}=${n.node.status}`)
        .join(" | "),
    );
  }

  public async startHealthCheck(intervalMs: number): Promise<void> {
    await this.runHealthCheck();
    this.healthTimer = setInterval(() => void this.runHealthCheck(), intervalMs);
  }

  public stop(): void {
    if (this.healthTimer) clearInterval(this.healthTimer);
  }

  // ──────────────────────── CONNECTION API ────────────────────────

  public async getWriteConnection(): Promise<{ conn: PoolConnection; nodeName: string }> {
    if (this.state.master.node.status === NodeStatus.UNREACHABLE) {
      this.logger.error("DB", "Master is UNREACHABLE — write not possible");
      return { conn: new PoolConnection(), nodeName: this.state.master.name };
    }
    try {
      const conn = await this.state.master.pool.getConnection();
      this.state.master.node.successfulWrites++;
      return { conn, nodeName: this.state.master.name };
    } catch (err) {
      this.state.master.node.status = NodeStatus.UNREACHABLE;
      this.state.master.node.failedWrites++;
      this.logger.error("DB", "Failed to connect to master", err);
      return { conn: new PoolConnection(), nodeName: this.state.master.name };
    }
  }

  public async getReadConnection(): Promise<{ conn: PoolConnection; nodeName: string }> {
    const n = this.state.slaves.length;
    for (let i = 0; i < n; i++) {
      const idx = (this.state.slaveRrIndex + i) % n;
      const info = this.state.slaves[idx];
      if (info.node.status === NodeStatus.UNREACHABLE || info.exReads) continue;
      try {
        const conn = await info.pool.getConnection();
        this.state.slaveRrIndex = (idx + 1) % n;
        info.node.successfulWrites++;
        return { conn, nodeName: info.name };
      } catch (err) {
        info.node.status = NodeStatus.UNREACHABLE;
        info.node.failedWrites++;
        this.logger.warn("DB", `Slave ${info.name} unreachable, trying next`);
      }
    }
    this.logger.warn("DB", "All slaves unreachable — falling back to master for read");
    if (this.state.master.node.status === NodeStatus.UNREACHABLE) {
      this.logger.error("DB", "Master also unreachable — read not possible");
      return { conn: new PoolConnection(), nodeName: this.state.master.name };
    }
    try {
      const conn = await this.state.master.pool.getConnection();
      this.state.master.node.successfulWrites++;
      return { conn, nodeName: this.state.master.name };
    } catch (err) {
      this.state.master.node.status = NodeStatus.UNREACHABLE;
      this.logger.error("DB", "Failed to connect to master for fallback read", err);
      return { conn: new PoolConnection(), nodeName: this.state.master.name };
    }
  }
}
