import { NodeStatus } from "../enums/NodeStatus";

export class DbNode {
  public status: NodeStatus    = NodeStatus.UNREACHABLE;
  public lastCheck: Date       = new Date();
  public successfulWrites: number = 0;
  public failedWrites: number  = 0;
  public repLagMs: number | null = null;

  constructor(
    public readonly name: string,
    public readonly host: string,
    public readonly port: number,
  ) {}
}
