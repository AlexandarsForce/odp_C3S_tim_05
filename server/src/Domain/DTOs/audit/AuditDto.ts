export class AuditDto {
public constructor(
    public id: number = 0,
    public userId: number | null = null,
    public username: string | null = null,
    public action: string = "",
    public details: string | null = null,
    public ipAddress: string | null = null,
    public createdAt: Date = new Date()
  ) {}
}