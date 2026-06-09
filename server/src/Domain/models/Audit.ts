export class Audit {
public constructor(
    public id: number = 0,
    public userId: number = 0,
    public action: string = "",
    public details: string = "",
    public ipAddress: string = "",
    public createdAt: Date = new Date()
  ) {}
}