export class Audit {
public constructor(
    public id: number = 0,
    public userId: number | null = null,
    public action: string = "",
    public entity: string | null = null,
    public entityId: number | null = null,
    public meta: string | null = null,
    public ipAddress: string | null = null,
    public createdAt: Date = new Date()
  ) {}
}