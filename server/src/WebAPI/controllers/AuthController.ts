import { Request, Response, Router, NextFunction } from "express";
import multer from "multer";
import jwt from "jsonwebtoken";
import { IAuthService } from "../../Domain/services/auth/IAuthService";
import { IAuditService } from "../../Domain/services/audit/IAuditService";
import { authenticate } from "../../Middlewares/authentification/AuthMiddleware";
import { upload, MAX_UPLOAD_BYTES } from "../../Middlewares/upload/UploadMiddleware";
import { ValidationResult } from "../../Domain/types/ValidationResult";
import { RegisterResult } from "../../Domain/DTOs/auth/RegisterResult";
import { validateLogin } from "../validators/auth/validateLogin";
import { validateRegister } from "../validators/auth/validateRegister";

const MAX_MB = Math.round(MAX_UPLOAD_BYTES / (1024 * 1024));

function uploadSingle(field: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    upload.single(field)(req, res, (err) => {
      if (!err) return next();
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        res.status(413).json({ success: false, field: "profilePicture", message: `Image must be ${MAX_MB} MB or less` });
        return;
      }
      const msg = err instanceof Error ? err.message : "Upload failed";
      res.status(400).json({ success: false, field: "profilePicture", message: msg });
    });
  };
}

export class AuthController {
  private readonly router = Router();

  public constructor(
    private readonly authService: IAuthService,
    private readonly auditService: IAuditService
  ) {
    this.router.post("/auth/login", this.login.bind(this));
    this.router.post("/auth/register", this.register.bind(this));
    this.router.post("/auth/register/multipart", uploadSingle("profilePicture"), this.registerMultipart.bind(this));
    this.router.post("/auth/upload-image", authenticate, uploadSingle("image"), this.uploadImage.bind(this));
    this.router.post("/auth/logout", authenticate, this.logout.bind(this));
  }

  private async login(req: Request, res: Response): Promise<void> {
    const { username, password } = req.body as { username?: string; password?: string };
    const v: ValidationResult = validateLogin(username ?? "", password ?? "");
    if (!v.valid) { res.status(400).json({ success: false, message: v.message }); return; }
    const result = await this.authService.login(username!, password!);
    if (result.id === 0) { res.status(401).json({ success: false, message: "Invalid username or password" }); return; }
    const token = jwt.sign(
      { id: result.id, username: result.username, role: result.role },
      process.env.JWT_SECRET ?? "",
      { expiresIn: "24h" }
    );
    res.status(200).json({ success: true, message: "Login successful", data: token });
  }

  private async register(req: Request, res: Response): Promise<void> {
    const { username, fullname, email, password, bio, profilePicture, role } = req.body as { username?: string; fullname?: string; email?: string; password?: string; bio?: string; profilePicture?: string; role?: string };
    await this.doRegister(res, username ?? "", fullname ?? "", email ?? "", password ?? "", bio ?? "", profilePicture ?? "", role ?? "user");
  }

  private async registerMultipart(req: Request, res: Response): Promise<void> {
    const { username, fullname, email, password, bio, role } = req.body as { username?: string; fullname?: string; email?: string; password?: string; bio?: string; role?: string };
    let profilePicture = "";
    if (req.file) {
      const b64 = req.file.buffer.toString("base64");
      profilePicture = `data:${req.file.mimetype};base64,${b64}`;
    } else if (typeof (req.body as { profilePicture?: string }).profilePicture === "string") {
      profilePicture = (req.body as { profilePicture?: string }).profilePicture ?? "";
    }
    await this.doRegister(res, username ?? "", fullname ?? "", email ?? "", password ?? "", bio ?? "", profilePicture, role ?? "user");
  }

  private async doRegister(
    res: Response,
    username: string,
    fullname: string,
    email: string,
    password: string,
    bio: string,
    profilePicture: string,
    role: string,
  ): Promise<void> {
    const v: ValidationResult = validateRegister(username, email, password, bio, fullname);
    if (!v.valid) { res.status(400).json({ success: false, message: v.message }); return; }
    const result: RegisterResult = await this.authService.register(username, fullname, email, password, bio, profilePicture, role);
    if (result.reason === "username_taken") {
      res.status(409).json({ success: false, field: "username", message: "Username is already taken" });
      return;
    }
    if (result.reason === "email_taken") {
      res.status(409).json({ success: false, field: "email", message: "Email is already taken" });
      return;
    }
    if (result.reason !== "ok") {
      res.status(500).json({ success: false, message: "Registration failed. Please try again." });
      return;
    }
    const token = jwt.sign(
      { id: result.user.id, username: result.user.username, role: result.user.role },
      process.env.JWT_SECRET ?? "",
      { expiresIn: "24h" }
    );
    res.status(201).json({ success: true, message: "Registration successful", data: token });
  }

  private uploadImage(req: Request, res: Response): void {
    if (!req.file) { res.status(400).json({ success: false, message: "No image file provided" }); return; }
    const b64 = req.file.buffer.toString("base64");
    const dataUrl = `data:${req.file.mimetype};base64,${b64}`;
    res.status(200).json({ success: true, data: { url: dataUrl } });
  }

  private async logout(req: Request, res: Response): Promise<void> {
    await this.auditService.log({ userId: req.user!.id, action: "USER_LOGOUT", details: "auth", ipAddress: req.ip });
    res.status(200).json({ success: true, message: "Logged out successfully" });
  }

  public getRouter(): Router { return this.router; }
}
