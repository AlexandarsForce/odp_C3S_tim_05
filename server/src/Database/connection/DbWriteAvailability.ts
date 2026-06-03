import { NodeStatus } from "../../Domain/enums/NodeStatus";
import { ClusterState } from "./DbConnectionPool";

/**
 * Pure state evaluation: is write currently possible?
 * Depends on master state + failoverInProgress flag.
 */
export class DbWriteAvailability {
  public constructor(private readonly state: ClusterState) {}

  public isWriteAvailable(): boolean {
    return (
      this.state.master.node.status !== NodeStatus.UNREACHABLE &&
      !this.state.failoverInProgress
    );
  }
}
