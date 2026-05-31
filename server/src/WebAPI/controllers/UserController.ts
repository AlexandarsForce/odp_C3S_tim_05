import { Request, Response, Router } from "express";
import { IUserService } from "../../Domain/services/users/IUserService";
import { IUserFollowerService } from "../../Domain/services/users/IUserFollowerService";
import { IPostService } from "../../Domain/services/posts/IPostService";
import { ICommentService } from "../../Domain/services/comments/ICommentService";
import { authenticate } from "../../Middlewares/authentification/AuthMiddleware";
import { authorize } from "../../Middlewares/authorization/AuthorizeMiddleware";
import { UpdateUserDto } from "../../Domain/DTOs/users/UpdateUserDto";
import { UserRole } from "../../Domain/enums/UserRole";

export class UserController {
  private readonly router = Router();

  public constructor(
    private readonly userService: IUserService,
    private readonly userFollowerService: IUserFollowerService,
    private readonly postService: IPostService,
    private readonly commentService: ICommentService)
    {
    this.router.get("/users/search", authenticate, this.searchUser.bind(this));
    this.router.get("/users/all",          authenticate, authorize(UserRole.ADMIN), this.getAll.bind(this));
    this.router.get("/users/:id",      authenticate, this.getById.bind(this));
    this.router.patch("/users/:id/deactivate", authenticate, authorize(UserRole.ADMIN), this.deactivate.bind(this));
    this.router.put("/users/me",        authenticate, this.updateMe.bind(this));
    this.router.put("/users/:id/role", authenticate, authorize(UserRole.ADMIN), this.updateUserRole.bind(this));

    this.router.put("/users/:id",           authenticate, authorize(UserRole.ADMIN), this.adminUpdateUser.bind(this));
    this.router.delete("/users/:id",        authenticate, authorize(UserRole.ADMIN), this.deleteUser.bind(this));

    this.router.get("/users/:id/posts",     authenticate, this.getUserPosts.bind(this));
    this.router.get("/users/:id/comments",  authenticate, this.getUserComments.bind(this));

    this.router.get("/users/:id/followers", authenticate, this.getFollowers.bind(this));
    this.router.get("/users/:id/following", authenticate, this.getFollowing.bind(this));
    this.router.post("/users/:id/follow",   authenticate, this.followUser.bind(this));
    this.router.delete("/users/:id/follow", authenticate, this.unfollowUser.bind(this));
    this.router.delete("/users/me/followers/:followerId", authenticate, this.removeFollower.bind(this));
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
    const { username, fullname, email, bio, profilePicture, role } = req.body as UpdateUserDto;
    const ok = await this.userService.updateUser(req.user!.id, new UpdateUserDto(username, fullname, email, bio, profilePicture, role));
    res.status(ok ? 200 : 500).json({ success: ok, message: ok ? "User updated" : "Failed to update user" });
  }

  private async adminUpdateUser(req: Request, res: Response): Promise<void> {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) { res.status(400).json({ success: false, message: "Invalid id" }); return; }
    const { username, fullname, email, bio, profilePicture, role } = req.body as UpdateUserDto;
    const ok = await this.userService.adminUpdateUser(id, new UpdateUserDto(username, fullname, email, bio, profilePicture, role));
    res.status(ok ? 200 : 404).json({ success: ok, message: ok ? "User updated" : "User not found" });
  }

  private async deleteUser(req: Request, res: Response): Promise<void> {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) { res.status(400).json({ success: false, message: "Invalid id" }); return; }
    const ok = await this.userService.deleteUser(id);
    res.status(ok ? 200 : 404).json({ success: ok, message: ok ? "User deleted" : "User not found" });
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
    const targetId = parseInt(req.params.id as string, 10);
    if (isNaN(targetId)) { res.status(400).json({ success: false, message: "Invalid user id" }); return; }
    const result = await this.userFollowerService.followUser(req.user!.id, targetId);
    if (!result.success) {
      if (result.reason === 'SELF_FOLLOW') {
        res.status(400).json({ success: false, message: "You cannot follow yourself" });
      } else if (result.reason === 'ALREADY_FOLLOWING') {
        res.status(409).json({ success: false, message: "You are already following this user" });
      } else {
        res.status(500).json({ success: false, message: "Failed to follow user" });
      }
      return;
    }
    res.status(200).json({ success: true, message: "User followed" });
  }

  private async unfollowUser(req: Request, res: Response): Promise<void> {
    const targetId = parseInt(req.params.id as string, 10);
    if (isNaN(targetId)) { res.status(400).json({ success: false, message: "Invalid user id" }); return; }
    const ok = await this.userFollowerService.unfollowUser(req.user!.id, targetId);
    res.status(ok ? 200 : 500).json({ success: ok, message: ok ? "User unfollowed" : "Failed to unfollow user" });
  }

  private async removeFollower(req: Request, res: Response): Promise<void> {
    const followerToRemoveId = parseInt(req.params.followerId as string, 10);
    if (isNaN(followerToRemoveId)) { res.status(400).json({ success: false, message: "Invalid follower id" }); return; }
    const ok = await this.userFollowerService.removeFollower(req.user!.id, followerToRemoveId);
    res.status(ok ? 200 : 404).json({ success: ok, message: ok ? "Follower removed" : "Follower not found" });
  }

  private async getUserPosts(req: Request, res: Response): Promise<void> {
    const authorId = parseInt(req.params.id as string, 10);
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100);
    if (isNaN(authorId)) { res.status(400).json({ success: false, message: "Invalid user id" }); return; }
    const result = await this.postService.getPostsByAuthor(authorId, page, limit);
    res.status(200).json({ success: true, data: result });
  }

  private async getUserComments(req: Request, res: Response): Promise<void> {
    const authorId = parseInt(req.params.id as string, 10);
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100);
    if (isNaN(authorId)) { res.status(400).json({ success: false, message: "Invalid user id" }); return; }
    const result = await this.commentService.getUserComments(authorId, page, limit);
    res.status(200).json({ success: true, data: result });
  }
}
