export class AuditDto {
public constructor(
    public id: number = 0,
    public userId: number = 0,
    public username: string = "",
    public action: string = "",
    public details: string = "",
    public ipAddress: string = "",
    public createdAt: Date = new Date()
  ) {}
}