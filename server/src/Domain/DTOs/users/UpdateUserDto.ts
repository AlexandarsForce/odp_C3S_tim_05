import { UserRole } from "../../enums/UserRole";

export class UpdateUserDto {
  constructor(
    public username: string  = "",
    public fullname: string  = "",
    public email: string     = "",
    public bio: string       = "",
    public profilePicture: string = "",
    public role: UserRole    = UserRole.USER,
  ) {}
}