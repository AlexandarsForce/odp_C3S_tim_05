export type AuditDto = {
  id: number;
  userId: number | null;
  action: string;
  details: string | null;
  ipAddress: string | null;
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
  repLagMs: number | null;
};
