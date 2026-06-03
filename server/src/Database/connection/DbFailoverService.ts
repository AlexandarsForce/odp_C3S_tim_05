import { PoolConnection } from "mysql2/promise";
import { NodeStatus } from "../../Domain/enums/NodeStatus";
import { ILoggerService } from "../../Domain/services/logger/ILoggerService";
import { ClusterState } from "./DbConnectionPool";
import { DbAuditIntegration } from "./DbAuditIntegration";

/**
 * Decision engine for promoting/demoting nodes.
 * Owns both automatic failover/restore and the manual promotion API.
 */
export class DbFailoverService {
  public constructor(
    private readonly state: ClusterState,
    private readonly logger: ILoggerService,
    private readonly audit: DbAuditIntegration,
  ) {}

  // ─────────────────────────── AUTOMATIC ────────────────────────────

  public async autoPromoteSlave(): Promise<void> {
    if (this.state.master.node.status !== NodeStatus.UNREACHABLE) {
      return;
    }

    const candidate = this.state.slaves.find(
      (s) =>
        s.node.status !== NodeStatus.UNREACHABLE &&
        !s.exReads,
    );

    if (!candidate) {
      this.logger.error("DB", "Master unreachable and no slave available");
      return;
    }

    this.state.failoverInProgress = true;
    let conn: PoolConnection | null = null;

    try {
      conn = await candidate.pool.getConnection();

      await conn.query("STOP REPLICA");
      await conn.query("RESET REPLICA ALL");
      await conn.query("SET GLOBAL read_only = 0");
    } catch (err) {
      this.logger.error("DB", `Failed to promote ${candidate.name}`, err);
      this.state.failoverInProgress = false;
      return;
    } finally {
      if (conn) conn.release();
    }

    const oldMaster = this.state.master;

    this.state.slaves = this.state.slaves
      .filter((s) => s.name !== candidate.name)
      .concat({ ...oldMaster, exReads: true });

    this.state.master = { ...candidate };
    this.state.slaveRrIndex = 0;
    this.state.failoverInProgress = false;

    this.logger.warn("DB", `${candidate.name} promoted to master (auto failover)`);
    await this.audit.log({
      action: "AUTO_FAILOVER_PROMOTE",
      details: `Auto failover: ${candidate.name} promoted to master. Previous master: ${oldMaster.name}`,
    });
  }

  public async autoRestoreMaster(): Promise<void> {
    if (this.state.master.orgMaster) {
      return;
    }

    const original = this.state.slaves.find(
      (s) =>
        s.orgMaster &&
        s.node.status !== NodeStatus.UNREACHABLE,
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

    const currentMaster = this.state.master;

    this.state.slaves = this.state.slaves
      .filter((s) => s.name !== original.name)
      .concat({
        ...currentMaster,
        exReads: false,
      });

    this.state.master = {
      ...original,
      orgMaster: true,
    };

    this.state.slaveRrIndex = 0;

    this.logger.warn("DB", `Original master restored: ${original.name}`);
    await this.audit.log({
      action: "AUTO_FAILOVER_RESTORE",
      details: `Original master ${original.name} restored. Demoted: ${currentMaster.name}`,
    });
  }

  // ───────────────────────────── MANUAL ─────────────────────────────

  public async promoteSlaveToMaster(idx: number): Promise<{ success: boolean; message: string }> {
    if (idx < 0 || idx >= this.state.slaves.length) {
      return {
        success: false,
        message: "Invalid slave index",
      };
    }

    const slave = this.state.slaves[idx];

    if (slave.node.status === NodeStatus.UNREACHABLE) {
      return {
        success: false,
        message: "Slave is unreachable",
      };
    }

    this.state.failoverInProgress = true;
    let conn: PoolConnection | null = null;

    try {
      conn = await slave.pool.getConnection();

      await conn.query("STOP REPLICA");
      await conn.query("RESET REPLICA ALL");
      await conn.query("SET GLOBAL read_only = 0");
    } catch (err) {
      this.logger.error("DB", "Promotion failed", err);
      this.state.failoverInProgress = false;
      return {
        success: false,
        message: "Promotion failed",
      };
    } finally {
      if (conn) conn.release();
    }

    const oldMaster = this.state.master;

    this.state.slaves = this.state.slaves
      .filter((_, i) => i !== idx)
      .concat({ ...oldMaster, exReads: true });

    this.state.master = slave;
    this.state.failoverInProgress = false;

    this.logger.warn("DB", `${slave.name} promoted manually`);

    return {
      success: true,
      message: `${slave.name} promoted to master`,
    };
  }
}
