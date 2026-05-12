export class AuditDto {
public constructor(
    public id: number = 0,
    public userId: number | null = null,
    public username: string | null = null,
    public action: string = "",
    public entity: string | null = null,
    public entityId: number | null = null,
    public meta: Record<string, unknown> | null = null,
    public ipAddress: string | null = null,
    public createdAt: Date = new Date()
  ) {}
}