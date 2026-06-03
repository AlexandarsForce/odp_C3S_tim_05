import { PoolConnection, FieldPacket } from "mysql2/promise";
import { NodeStatus } from "../../Domain/enums/NodeStatus";
import { DbNode } from "../../Domain/models/DbNode";
import { HEALTH_CHECK_TIMEOUT } from "../../Domain/constants/Constants";
import { ILoggerService } from "../../Domain/services/logger/ILoggerService";
import { ClusterState, NodeInfo } from "./DbConnectionPool";

type ReplicaStatusRow = {
  Seconds_Behind_Master: number | null;
};

/**
 * Observability layer.
 * Health-checks every node, monitors replication lag, and exposes
 * a consolidated snapshot for the IHealthService API.
 */
export class DbReplicationMonitor {
  public constructor(
    private readonly state: ClusterState,
    private readonly logger: ILoggerService,
  ) {}

  public async checkNode(info: NodeInfo): Promise<void> {
    const start = Date.now();
    let conn: PoolConnection | null = null;
    try {
      conn = await Promise.race([
        info.pool.getConnection(),
        new Promise<PoolConnection>((_, reject) =>
          setTimeout(() => reject("Connection timeout"), HEALTH_CHECK_TIMEOUT),
        ),
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

  public async monitorRepLag(info: NodeInfo): Promise<void> {
    if (info.node.status === NodeStatus.UNREACHABLE) {
      info.node.repLagMs = null;
      return;
    }

    let conn: PoolConnection | null = null;

    try {
      conn = await info.pool.getConnection();

      const [rows] = await conn.query(
        "SHOW SLAVE STATUS",
      ) as [ReplicaStatusRow[], FieldPacket[]];

      if (Array.isArray(rows) && rows.length > 0) {
        const lag = rows[0].Seconds_Behind_Master;
        info.node.repLagMs = typeof lag === "number" ? lag * 1000 : null;
      }
    } catch {
      info.node.repLagMs = null;
    } finally {
      if (conn) conn.release();
    }
  }

  /** Run health-check + lag-check for the whole cluster. */
  public async checkAllNodes(): Promise<void> {
    await Promise.all(
      [this.state.master, ...this.state.slaves].map((n) => this.checkNode(n)),
    );
    await Promise.all(this.state.slaves.map((s) => this.monitorRepLag(s)));
  }

  public getHealthStatus(): DbNode[] {
    return [this.state.master.node, ...this.state.slaves.map((s) => s.node)];
  }
}
