import { Request, Response, Router } from "express";
import { IUserService } from "../../Domain/services/users/IUserService";
import { IUserFollowerService } from "../../Domain/services/users/IUserFollowerService";
import { authenticate } from "../../Middlewares/authentification/AuthMiddleware";
import { authorize } from "../../Middlewares/authorization/AuthorizeMiddleware";
import { UpdateUserDto } from "../../Domain/DTOs/users/UpdateUserDto";
import { UserRole } from "../../Domain/enums/UserRole";

export class UserController {
  private readonly router = Router();

  public constructor(
    private readonly userService: IUserService, 
    private readonly userFollowerService: IUserFollowerService) 
    {
    this.router.get("/users/search", authenticate, this.searchUser.bind(this));
    this.router.get("/users/all",          authenticate, authorize(UserRole.ADMIN), this.getAll.bind(this));
    this.router.get("/users/:id",      authenticate, authorize(UserRole.ADMIN), this.getById.bind(this));
    this.router.patch("/users/:id/deactivate", authenticate, authorize(UserRole.ADMIN), this.deactivate.bind(this));
    this.router.put("/users/me",        authenticate, this.updateMe.bind(this));
    this.router.put("/users/:id/role", authenticate, authorize(UserRole.ADMIN), this.updateUserRole.bind(this));

    this.router.get("/users/:id/followers", authenticate, this.getFollowers.bind(this));
    this.router.get("/users/:id/following", authenticate, this.getFollowing.bind(this));
    this.router.post("/users/:id/follow", authenticate, this.followUser.bind(this));
    this.router.delete("/users/:id/follow", authenticate, this.unfollowUser.bind(this));
  }

  private async getAll(req: Request, res: Response): Promise<void> {
    const users = await this.userService.getAll();
    res.status(200).json({ success: true, data: users });
  }

  private async getById(req: Request, res: Response): Promise<void> {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) { res.status(400).json({ success: false, message: "Invalid id" }); return; }
    const user = await this.userService.getById(id);
    if (!user) { res.status(404).json({ success: false, message: "User not found" }); return; }
    res.status(200).json({ success: true, data: user });
  }

  private async deactivate(req: Request, res: Response): Promise<void> {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) { res.status(400).json({ success: false, message: "Invalid id" }); return; }
    const ok = await this.userService.deactivate(id);
    res.status(ok ? 200 : 500).json({ success: ok, message: ok ? "User deactivated" : "Failed to deactivate user" });
  }

  public getRouter(): Router { return this.router; }

  private async searchUser(req: Request, res: Response): Promise<void> {
    const username = req.query.username as string;
    if (!username) { res.status(400).json({ success: false, message: "Username query parameter is required" }); return; }
    const user = await this.userService.findByUsername(username);
    if (!user) { res.status(404).json({ success: false, message: "User not found" }); return; }
    res.status(200).json({ success: true, data: user });
  }

  private async updateMe(req: Request, res: Response): Promise<void> {
    const userId = parseInt(req.params.id as string, 10);
    const { username, fullname, email, bio, profilePicture, role } = req.body as UpdateUserDto;
    const ok = await this.userService.updateUser(userId, new UpdateUserDto(username, fullname, email, bio, profilePicture, role));
    res.status(ok ? 200 : 500).json({ success: ok, message: ok ? "User updated" : "Failed to update user" });
  }

  private async updateUserRole(req: Request, res: Response): Promise<void> {
    const id = parseInt(req.params.id as string, 10);
    const { role } = req.body;
    if (isNaN(id) || !role) { res.status(400).json({ success: false, message: "Invalid id or role" }); return; }
    const ok = await this.userService.updateUserRole(id, role);
    res.status(ok ? 200 : 500).json({ success: ok, message: ok ? "User role updated" : "Failed to update user role" });
  }

  private async getFollowers(req: Request, res: Response): Promise<void> {
    const userId = parseInt(req.params.id as string, 10);
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    if (isNaN(userId)) { res.status(400).json({ success: false, message: "Invalid user id" }); return; }
    const followers = await this.userFollowerService.getFollowers(userId, page, limit);
    res.status(200).json({ success: true, data: followers });
  }

  private async getFollowing(req: Request, res: Response): Promise<void> {
    const userId = parseInt(req.params.id as string, 10);
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    if (isNaN(userId)) { res.status(400).json({ success: false, message: "Invalid user id" }); return; }
    const following = await this.userFollowerService.getFollowing(userId, page, limit);
    res.status(200).json({ success: true, data: following });
  }

  private async followUser(req: Request, res: Response): Promise<void> {
    const userId = parseInt(req.params.id as string, 10);
    const followUserId = parseInt(req.params.followId as string, 10);
    if (isNaN(userId) || isNaN(followUserId)) { res.status(400).json({ success: false, message: "Invalid user ids" }); return; }
    const ok = await this.userFollowerService.followUser(userId, followUserId);
    res.status(ok ? 200 : 500).json({ success: ok, message: ok ? "User followed" : "Failed to follow user" });
  }

  private async unfollowUser(req: Request, res: Response): Promise<void> {
    const userId = parseInt(req.params.id as string, 10);
    const unfollowUserId = parseInt(req.params.unfollowId as string, 10);
    if (isNaN(userId) || isNaN(unfollowUserId)) { res.status(400).json({ success: false, message: "Invalid user ids" }); return; }
    const ok = await this.userFollowerService.unfollowUser(userId, unfollowUserId);
    res.status(ok ? 200 : 500).json({ success: ok, message: ok ? "User unfollowed" : "Failed to unfollow user" });
  }
}
