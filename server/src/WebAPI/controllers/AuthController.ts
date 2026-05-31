import { Request, Response, Router } from "express";
import jwt from "jsonwebtoken";
import { IAuthService } from "../../Domain/services/auth/IAuthService";
import { IAuditService } from "../../Domain/services/audit/IAuditService";
import { authenticate } from "../../Middlewares/authentification/AuthMiddleware";
import { upload } from "../../Middlewares/upload/UploadMiddleware";
import { ValidationResult } from "../../Domain/types/ValidationResult";
import { validateLogin } from "../validators/auth/validateLogin";
import { validateRegister } from "../validators/auth/validateRegister";

export class AuthController {
  private readonly router = Router();

  public constructor(
    private readonly authService: IAuthService,
    private readonly auditService: IAuditService
  ) {
    this.router.post("/auth/login", this.login.bind(this));
    this.router.post("/auth/register", this.register.bind(this));
    this.router.post("/auth/register/multipart", upload.single("profilePicture"), this.registerMultipart.bind(this));
    this.router.post("/auth/upload-image", authenticate, upload.single("image"), this.uploadImage.bind(this));
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
    const v: ValidationResult = validateRegister(username ?? "", email ?? "", password ?? "", bio ?? "", fullname ?? "");
    if (!v.valid) { res.status(400).json({ success: false, message: v.message }); return; }
    const result = await this.authService.register(username!, fullname!, email!, password!, bio!, profilePicture!, role ?? "user");
    if (result.id === 0) { res.status(409).json({ success: false, message: "Username or email already taken" }); return; }
    const token = jwt.sign(
      { id: result.id, username: result.username, role: result.role },
      process.env.JWT_SECRET ?? "",
      { expiresIn: "24h" }
    );
    res.status(201).json({ success: true, message: "Registration successful", data: token });
  }

  private async registerMultipart(req: Request, res: Response): Promise<void> {
    const { username, fullname, email, password, bio, role } = req.body as { username?: string; fullname?: string; email?: string; password?: string; bio?: string; role?: string };
    let profilePicture = "";
    if (req.file) {
      const b64 = req.file.buffer.toString("base64");
      profilePicture = `data:${req.file.mimetype};base64,${b64}`;
    }
    const v: ValidationResult = validateRegister(username ?? "", email ?? "", password ?? "", bio ?? "", fullname ?? "");
    if (!v.valid) { res.status(400).json({ success: false, message: v.message }); return; }
    const result = await this.authService.register(username!, fullname ?? "", email!, password!, bio ?? "", profilePicture, role ?? "user");
    if (result.id === 0) { res.status(409).json({ success: false, message: "Username or email already taken" }); return; }
    const token = jwt.sign(
      { id: result.id, username: result.username, role: result.role },
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
