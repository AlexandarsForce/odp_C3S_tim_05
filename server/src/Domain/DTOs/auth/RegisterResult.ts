import { AuthUserDto } from "./AuthUserDto";

export type RegisterReason =
  | "ok"
  | "username_taken"
  | "email_taken"
  | "hash_failed"
  | "create_failed";

export class RegisterResult {
  constructor(
    public reason: RegisterReason,
    public user: AuthUserDto = new AuthUserDto(),
  ) {}
}
