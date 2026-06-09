export type AuditDto = {
  id: number;
  userId: number;
  action: string;
  details: string;
  ipAddress: string;
  createdAt: string;
  username?: string;
};

export type DbNodeDto = {
  name: string;
  host: string;
  port: number;
  status: "healthy" | "degraded" | "unreachable";
  lastCheck: string;
  successfulWrites: number;
  failedWrites: number;
  repLagMs: number;
};
