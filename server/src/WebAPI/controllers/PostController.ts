import { Request, Response, Router } from "express";
import { IPostService } from "../../Domain/services/posts/IPostService";
import { IPostLikeService } from "../../Domain/services/posts/IPostLikeService";
import { IPostTagService } from "../../Domain/services/posts/IPostTagService";
import { IAuditService } from "../../Domain/services/audit/IAuditService";
import { authenticate } from "../../Middlewares/authentification/AuthMiddleware";
import { authorize } from "../../Middlewares/authorization/AuthorizeMiddleware";
import { CreatePostDto } from "../../Domain/DTOs/posts/CreatePostDto";
import { CreatePostTagDto } from "../../Domain/DTOs/posts/CreatePostTagDto";
import { CreatePostLikeDto } from "../../Domain/DTOs/posts/CreatePostLikeDto";
import { UpdatePostDto } from "../../Domain/DTOs/posts/UpdatePostDto";

export class PostController {
    private readonly router = Router();
    public constructor(
        private readonly postService: IPostService,
        private readonly postLikeService: IPostLikeService,
        private readonly postTagService: IPostTagService,
        private readonly auditService: IAuditService
    ) {

        this.router.get("/posts/community/:communityId", authenticate, this.getAllPosts.bind(this));
        this.router.get("/posts/feed", authenticate, this.getFeed.bind(this));
        this.router.post("/posts",authenticate, this.createPost.bind(this));
        this.router.get("/posts/:id", authenticate, this.getPostDetails.bind(this));
        this.router.put("/posts/:id", authenticate, this.updatePost.bind(this));
        this.router.delete("/posts/:id", authenticate, this.deletePost.bind(this));

        this.router.post("/posts/:id/like", authenticate, this.likePost.bind(this));
        this.router.delete("/posts/:id/like", authenticate, this.unlikePost.bind(this));
        
        this.router.post("/posts/:id/tags", authenticate, this.addPostTag.bind(this));
        this.router.delete("/posts/:id/tags/:tagId", authenticate, this.removePostTag.bind(this));
    }

    public getRouter(): Router { return this.router; }

    private async getAllPosts(req: Request, res: Response): Promise<void> {
        const communityId = parseInt(req.params.communityId as string, 10);
        const page = parseInt(String(req.query.page ?? "1"), 10);
        const limit = Math.min(parseInt(String(req.query.limit ?? "20"), 10), 100);
        const result = await this.postService.getAllPosts(communityId, page, limit);
        res.status(200).json({ success: true, data: result });
    }

    private async getFeed(req: Request, res: Response): Promise<void> {
        const page = parseInt(String(req.query.page ?? "1"), 10);
        const limit = Math.min(parseInt(String(req.query.limit ?? "20"), 10), 100);
        const result = await this.postService.getFeed(req.user!.id, page, limit);
        res.status(200).json({ success: true, data: result });
    }

    private async createPost(req: Request, res: Response): Promise<void> {
        const { authorId,communityId, title, content, mediaAttachment } = req.body as CreatePostDto;
        const post = await this.postService.createPost(req.user!.id, new CreatePostDto(authorId,communityId, title, content, mediaAttachment));
        res.status(201).json({ success: true, data: post });
    }

    private async getPostDetails(req: Request, res: Response): Promise<void> {
        const postId = parseInt(req.params.id as string, 10);
        const post = await this.postService.getPostDetails(postId);
        if (post.id === 0) {
            res.status(404).json({ success: false, message: "Post not found" });
            return;
        }
        res.status(200).json({ success: true, data: post });
    }

    private async updatePost(req: Request, res: Response): Promise<void> {
        const postId = parseInt(req.params.id as string, 10);
        const { authorId, communityId, title, content, mediaAttachment } = req.body as UpdatePostDto;
        const success = await this.postService.updatePost(req.user!.id, postId, new UpdatePostDto(authorId, communityId, title, content, mediaAttachment));
        if (!success) {
            res.status(404).json({ success: false, message: "Post not found" });
            return;
        }
        res.status(200).json({ success: true, message: "Post updated successfully" });
    }

    private async deletePost(req: Request, res: Response): Promise<void> {
        const postId = parseInt(req.params.id as string, 10);
        const success = await this.postService.deletePost(req.user!.id, postId);
        if (!success) {
            res.status(404).json({ success: false, message: "Post not found" });
            return;
        }
        res.status(200).json({ success: true, message: "Post deleted successfully" });
    }

    private async likePost(req: Request, res: Response): Promise<void> {
        const postId = parseInt(req.params.id as string, 10);
        const success = await this.postLikeService.likePost(req.user!.id, postId, new CreatePostLikeDto(1));
        if (!success) {
            res.status(400).json({ success: false, message: "Unable to like post" });
            return;
        }
        res.status(200).json({ success: true, message: "Post liked successfully" });
    }

    private async unlikePost(req: Request, res: Response): Promise<void> {
        const postId = parseInt(req.params.id as string, 10);
        const success = await this.postLikeService.unlikePost(req.user!.id, postId);
        if (!success) {
            res.status(400).json({ success: false, message: "Unable to unlike post" });
            return;
        }
        res.status(200).json({ success: true, message: "Post unliked successfully" });
    }

    private async addPostTag(req: Request, res: Response): Promise<void> {
        const postId = parseInt(req.params.id as string, 10);
        const { tagId } = req.body as CreatePostTagDto;
        const success = await this.postTagService.addPostTag(req.user!.id, postId, new CreatePostTagDto(tagId));
        if (!success) {
            res.status(400).json({ success: false, message: "Unable to add tag to post" });
            return;
        }
        res.status(200).json({ success: true, message: "Tag added to post successfully" });
    }

    private async removePostTag(req: Request, res: Response): Promise<void> {
        const postId = parseInt(req.params.id as string, 10);
        const tagId = parseInt(req.params.tagId as string, 10);
        const success = await this.postTagService.removePostTag(req.user!.id, postId, tagId);
        if (!success) {
            res.status(400).json({ success: false, message: "Unable to remove tag from post" });
            return;
        }
        res.status(200).json({ success: true, message: "Tag removed from post successfully" });
    }
}