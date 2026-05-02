import { UserRole } from "../enums/UserRole";

export class User {
  constructor(
    public id: number        = 0,
    public username: string  = "",
    public fullname: string  = "",
    public email: string     = "",
    public passwordHash: string = "",
    public bio: string       = "",
    public profilePicture: string = "",
    public role: UserRole    = UserRole.USER,
    public createdAt: Date    = new Date(),
    public updatedAt: Date    = new Date(),
    public isActive: number  = 1,
  ) {}
}
