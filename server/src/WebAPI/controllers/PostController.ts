import { Request, Response, Router } from "express";
import { IPostService } from "../../Domain/services/posts/IPostService";
import { IPostLikeService } from "../../Domain/services/posts/IPostLikeService";
import { IPostTagService } from "../../Domain/services/posts/IPostTagService";
import { ICommentService } from "../../Domain/services/comments/ICommentService";
import { ICommunityMemberService } from "../../Domain/services/communities/ICommunityMemberService";
import { IAuditService } from "../../Domain/services/audit/IAuditService";
import { authenticate } from "../../Middlewares/authentification/AuthMiddleware";
import { authorize } from "../../Middlewares/authorization/AuthorizeMiddleware";
import { UserRole } from "../../Domain/enums/UserRole";
import { CommunityAccessResult } from "../../Domain/enums/CommunityAccessResult";
import { CreatePostDto } from "../../Domain/DTOs/posts/CreatePostDto";
import { CreatePostTagDto } from "../../Domain/DTOs/posts/CreatePostTagDto";
import { CreatePostLikeDto } from "../../Domain/DTOs/posts/CreatePostLikeDto";
import { UpdatePostDto } from "../../Domain/DTOs/posts/UpdatePostDto";
import { validateCreatePost, validateUpdatePost } from "../validators/posts/ValidatePost";
import { likesSSE } from "../../Services/posts/LikesSSEBroadcaster";

export class PostController {
    private readonly router = Router();
    public constructor(
        private readonly postService: IPostService,
        private readonly postLikeService: IPostLikeService,
        private readonly postTagService: IPostTagService,
        private readonly auditService: IAuditService,
        private readonly commentService: ICommentService,
        private readonly communityMemberService: ICommunityMemberService
    ) {

        this.router.get("/posts/community/:communityId", authenticate, this.getAllPosts.bind(this));
        this.router.get("/posts/feed", authenticate, this.getFeed.bind(this));
        this.router.get("/posts/admin/all", authenticate, authorize(UserRole.ADMIN), this.adminGetAllPosts.bind(this));
        this.router.delete("/posts/admin/:id", authenticate, authorize(UserRole.ADMIN), this.adminDeletePost.bind(this));
        this.router.post("/posts",authenticate, this.createPost.bind(this));
        this.router.get("/posts/:id", authenticate, this.getPostDetails.bind(this));
        this.router.put("/posts/:id", authenticate, this.updatePost.bind(this));
        this.router.delete("/posts/:id", authenticate, this.deletePost.bind(this));

        this.router.get("/posts/:id/likes/stream", this.streamLikes.bind(this));
        this.router.post("/posts/:id/like", authenticate, this.likePost.bind(this));
        this.router.delete("/posts/:id/like", authenticate, this.unlikePost.bind(this));

        this.router.post("/posts/:id/tags", authenticate, this.addPostTag.bind(this));
        this.router.delete("/posts/:id/tags/:tagId", authenticate, this.removePostTag.bind(this));
    }

    public getRouter(): Router { return this.router; }

    private async getAllPosts(req: Request, res: Response): Promise<void> {
        const communityId = parseInt(req.params.communityId as string, 10);
        if (isNaN(communityId)) { res.status(400).json({ success: false, message: "Invalid community ID" }); return; }

        // Private-community gate: non-admin, non-member users cannot list posts of a private community.
        const isAdmin = req.user!.role === UserRole.ADMIN;
        const access = await this.communityMemberService.canViewPrivateContent(req.user!.id, communityId, isAdmin);
        if (access === CommunityAccessResult.NotFound) { res.status(404).json({ success: false, message: "Community not found" }); return; }
        if (access === CommunityAccessResult.Forbidden) { res.status(403).json({ success: false, message: "This is a private community — join it to see its posts" }); return; }

        const page = parseInt(String(req.query.page ?? "1"), 10);
        const limit = Math.min(parseInt(String(req.query.limit ?? "20"), 10), 100);
        const validSortBy = ['createdAt', 'title', 'likesCount', 'commentsCount'];
        const sortByRaw = String(req.query.sortBy ?? 'createdAt');
        const sortBy = validSortBy.includes(sortByRaw) ? sortByRaw : 'createdAt';
        const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';
        const tagId = req.query.tagId ? parseInt(String(req.query.tagId), 10) : undefined;
        const authorId = req.query.authorId ? parseInt(String(req.query.authorId), 10) : undefined;
        const result = await this.postService.getAllPosts(communityId, page, limit, {
            sortBy: sortBy as 'createdAt' | 'title' | 'likesCount' | 'commentsCount',
            sortOrder: sortOrder as 'asc' | 'desc',
            tagId,
            authorId,
        });
        res.status(200).json({ success: true, data: result });
    }

    private async getFeed(req: Request, res: Response): Promise<void> {
        const page = parseInt(String(req.query.page ?? "1"), 10);
        const limit = Math.min(parseInt(String(req.query.limit ?? "20"), 10), 100);
        const result = await this.postService.getFeed(req.user!.id, page, limit);
        res.status(200).json({ success: true, data: result });
    }

    private async createPost(req: Request, res: Response): Promise<void> {
        // authorId is intentionally NOT read from the body — author is always the
        // authenticated user. communityId, title, content, media, tags come from body.
        const { communityId, title, content, mediaAttachment, tagIds } = req.body as CreatePostDto;
        const safeTagIds = Array.isArray(tagIds) ? tagIds.filter((id) => Number.isInteger(id) && id > 0) : [];
        const dto = new CreatePostDto(communityId, title, content, mediaAttachment, safeTagIds);
        const validationResult = validateCreatePost(dto);
        if (!validationResult.valid) {
            res.status(400).json({ success: false, message: validationResult.message });
            return;
        }
        const post = await this.postService.createPost(req.user!.id, dto);
        res.status(201).json({ success: true, data: post });
    }

    private async getPostDetails(req: Request, res: Response): Promise<void> {
        const postId = parseInt(req.params.id as string, 10);
        const page = parseInt(String(req.query.page ?? "1"), 10);
        const limit = Math.min(parseInt(String(req.query.limit ?? "20"), 10), 100);
        const post = await this.postService.getPostDetails(postId);
        if (post.id === 0) {
            res.status(404).json({ success: false, message: "Post not found" });
            return;
        }

        // Private-community gate (post + its comments hidden from non-members)
        const isAdmin = req.user!.role === UserRole.ADMIN;
        const access = await this.communityMemberService.canViewPrivateContent(req.user!.id, post.communityId, isAdmin);
        if (access === CommunityAccessResult.Forbidden) {
            // 403 here means the community is private and the user isn't a member.
            // Return basic info so the client can render a "request to join" preview.
            res.status(403).json({
                success: false,
                message: "This post is in a private community — join it to see the content",
                restricted: true,
                community: {
                    id: post.communityId,
                    name: post.communityName,
                    type: "private",
                },
                post: {
                    id: post.id,
                    title: post.title,
                    authorUsername: post.authorUsername,
                    createdAt: post.createdAt,
                },
            });
            return;
        }

        // Single source of truth for likesCount is `data.likesCount` (already on `post`).
        // We no longer emit a duplicate top-level `likesCount` field, and we skip the
        // redundant getPostLikes round-trip — the count is already computed in findPostById.
        const isLiked = await this.postLikeService.isLikedByUser(req.user!.id, postId);
        const comments = await this.commentService.getPostComments(postId, page, limit);
        res.status(200).json({ success: true, data: post, isLiked, comments });
    }

    private async updatePost(req: Request, res: Response): Promise<void> {
        const postId = parseInt(req.params.id as string, 10);
        // communityId is intentionally NOT in UpdatePostDto — moving a post between
        // communities is not supported. Author can't be changed either.
        const { title, content, mediaAttachment, tagIds } = req.body as UpdatePostDto;
        const safeTagIds = Array.isArray(tagIds) ? tagIds.filter((id) => Number.isInteger(id) && id > 0) : [];
        const dto = new UpdatePostDto(title, content, mediaAttachment, safeTagIds);
        const validationResult = validateUpdatePost(dto);
        if (!validationResult.valid) {
            res.status(400).json({ success: false, message: validationResult.message });
            return;
        }
        const success = await this.postService.updatePost(req.user!.id, postId, dto);
        if (!success) {
            res.status(403).json({ success: false, message: "Post not found or insufficient permissions" });
            return;
        }
        res.status(200).json({ success: true, message: "Post updated successfully" });
    }

    private async deletePost(req: Request, res: Response): Promise<void> {
        const postId = parseInt(req.params.id as string, 10);
        const success = await this.postService.deletePost(req.user!.id, postId);
        if (!success) {
            res.status(403).json({ success: false, message: "Post not found or insufficient permissions" });
            return;
        }
        res.status(200).json({ success: true, message: "Post deleted successfully" });
    }

    private async adminGetAllPosts(req: Request, res: Response): Promise<void> {
        const page = parseInt(String(req.query.page ?? "1"), 10);
        const limit = Math.min(parseInt(String(req.query.limit ?? "20"), 10), 100);
        const result = await this.postService.adminGetAllPosts(page, limit);
        res.status(200).json({ success: true, data: result });
    }

    private async adminDeletePost(req: Request, res: Response): Promise<void> {
        const postId = parseInt(req.params.id as string, 10);
        if (isNaN(postId)) { res.status(400).json({ success: false, message: "Invalid post ID" }); return; }
        const success = await this.postService.adminDeletePost(postId);
        if (!success) { res.status(404).json({ success: false, message: "Post not found" }); return; }
        res.status(200).json({ success: true, message: "Post deleted by admin" });
    }

    private streamLikes(req: Request, res: Response): void {
        const postId = parseInt(req.params.id as string, 10);
        if (isNaN(postId)) { res.status(400).end(); return; }
        res.set({ "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no" });
        res.flushHeaders();
        res.write(": connected\n\n");
        likesSSE.subscribe(postId, res);
    }

    private async likePost(req: Request, res: Response): Promise<void> {
        const postId = parseInt(req.params.id as string, 10);
        const result = await this.postLikeService.likePost(req.user!.id, postId, new CreatePostLikeDto(1));
        if (!result.success) {
            if (result.reason === 'DUPLICATE') {
                res.status(409).json({ success: false, message: "You have already liked this post" });
            } else if (result.reason === 'OWN_POST') {
                res.status(403).json({ success: false, message: "You cannot like your own post" });
            } else {
                res.status(400).json({ success: false, message: "Unable to like post" });
            }
            return;
        }
        const likes = await this.postLikeService.getPostLikes(req.user!.id, postId, 1, 1);
        likesSSE.broadcast(postId, likes.total);
        res.status(200).json({ success: true, message: "Post liked successfully", likesCount: likes.total });
    }

    private async unlikePost(req: Request, res: Response): Promise<void> {
        const postId = parseInt(req.params.id as string, 10);
        const success = await this.postLikeService.unlikePost(req.user!.id, postId);
        if (!success) {
            res.status(400).json({ success: false, message: "Unable to unlike post" });
            return;
        }
        const likes = await this.postLikeService.getPostLikes(req.user!.id, postId, 1, 1);
        likesSSE.broadcast(postId, likes.total);
        res.status(200).json({ success: true, message: "Post unliked successfully", likesCount: likes.total });
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
