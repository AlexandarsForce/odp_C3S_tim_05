import { Request, Response, Router } from "express";
import { ICommentService } from "../../Domain/services/comments/ICommentService";
import { ICommentLikeService } from "../../Domain/services/comments/ICommentLikeService";
import { authenticate } from "../../Middlewares/authentification/AuthMiddleware";
import { authorize } from "../../Middlewares/authorization/AuthorizeMiddleware";
import { UserRole } from "../../Domain/enums/UserRole";
import { ICommunityMemberService } from "../../Domain/services/communities/ICommunityMemberService";
import { CreateCommentDto } from "../../Domain/DTOs/comments/CreateCommentDto";
import { UpdateCommentDto } from "../../Domain/DTOs/comments/UpdateCommentDto";
import { CreateCommentLikeDto } from "../../Domain/DTOs/comments/CreateCommentLikeDto";
import { validateCreateComment, validateUpdateComment } from "../validators/comments/ValidateComment";

export class CommentController {
    private readonly router = Router();

    public constructor(
        private readonly commentService: ICommentService,
        private readonly commentLikeService: ICommentLikeService,
        private readonly communityMemberService: ICommunityMemberService,
    ) {
        this.router.get("/posts/:postId/comments", authenticate, this.getPostComments.bind(this));
        this.router.post("/posts/:postId/comments", authenticate, this.createComment.bind(this));

        this.router.put("/comments/:id", authenticate, this.updateComment.bind(this));
        this.router.delete("/comments/:id", authenticate, this.deleteComment.bind(this));

        this.router.get("/comments/:id/replies", authenticate, this.getCommentReplies.bind(this));

        this.router.patch("/comments/:id/report", authenticate, this.reportComment.bind(this));

this.router.post("/comments/:id/like", authenticate, this.likeComment.bind(this));
        this.router.delete("/comments/:id/like", authenticate, this.unlikeComment.bind(this));
    }

    public getRouter(): Router { return this.router; }

    private async getPostComments(req: Request, res: Response): Promise<void> {
        const postId = parseInt(req.params.postId as string, 10);
        if (isNaN(postId)) { res.status(400).json({ success: false, message: "Invalid post ID" }); return; }
        const page = parseInt(String(req.query.page ?? "1"), 10);
        const limit = Math.min(parseInt(String(req.query.limit ?? "20"), 10), 100);
        const sortBy = req.query.sortBy === 'likesCount' ? 'likesCount' : 'createdAt';
        const sortOrder = req.query.sortOrder === 'desc' ? 'desc' : 'asc';
        const result = await this.commentService.getPostComments(postId, page, limit, sortBy, sortOrder);
        res.status(200).json({ success: true, data: result });
    }

    private async createComment(req: Request, res: Response): Promise<void> {
        const postId = parseInt(req.params.postId as string, 10);
        if (isNaN(postId)) { res.status(400).json({ success: false, message: "Invalid post ID" }); return; }
        const { content, parentId } = req.body as { content: string; parentId?: number | null };
        const dto = new CreateCommentDto(postId, req.user!.id, parentId ?? null, content);
        const validationResult = validateCreateComment(dto);
        if (!validationResult.valid) {
            res.status(400).json({ success: false, message: validationResult.message });
            return;
        }
        const comment = await this.commentService.createComment(req.user!.id, dto);
        if (comment.id === 0) {
            res.status(400).json({ success: false, message: "Unable to create comment" });
            return;
        }
        res.status(201).json({ success: true, data: comment });
    }

    private async updateComment(req: Request, res: Response): Promise<void> {
        const commentId = parseInt(req.params.id as string, 10);
        if (isNaN(commentId)) { res.status(400).json({ success: false, message: "Invalid comment ID" }); return; }
        const { content } = req.body as UpdateCommentDto;
        const dto = new UpdateCommentDto(content);
        const validationResult = validateUpdateComment(dto);
        if (!validationResult.valid) {
            res.status(400).json({ success: false, message: validationResult.message });
            return;
        }
        const success = await this.commentService.updateComment(req.user!.id, commentId, dto);
        if (!success) {
            res.status(404).json({ success: false, message: "Comment not found or unauthorized" });
            return;
        }
        res.status(200).json({ success: true, message: "Comment updated successfully" });
    }

    private async deleteComment(req: Request, res: Response): Promise<void> {
        const commentId = parseInt(req.params.id as string, 10);
        if (isNaN(commentId)) { res.status(400).json({ success: false, message: "Invalid comment ID" }); return; }
        const success = await this.commentService.deleteComment(req.user!.id, commentId);
        if (!success) {
            res.status(404).json({ success: false, message: "Comment not found or unauthorized" });
            return;
        }
        res.status(200).json({ success: true, message: "Comment deleted successfully" });
    }

    private async getCommentReplies(req: Request, res: Response): Promise<void> {
        const parentId = parseInt(req.params.id as string, 10);
        if (isNaN(parentId)) { res.status(400).json({ success: false, message: "Invalid comment ID" }); return; }
        const page = parseInt(String(req.query.page ?? "1"), 10);
        const limit = Math.min(parseInt(String(req.query.limit ?? "20"), 10), 100);
        const sortBy = req.query.sortBy === 'likesCount' ? 'likesCount' : 'createdAt';
        const sortOrder = req.query.sortOrder === 'desc' ? 'desc' : 'asc';
        const result = await this.commentService.getCommentReplies(parentId, page, limit, sortBy, sortOrder);
        res.status(200).json({ success: true, data: result });
    }

    private async reportComment(req: Request, res: Response): Promise<void> {
        const commentId = parseInt(req.params.id as string, 10);
        if (isNaN(commentId)) { res.status(400).json({ success: false, message: "Invalid comment ID" }); return; }

        if (req.user!.role === UserRole.ADMIN) {
            const success = await this.commentService.reportComment(req.user!.id, commentId);
            res.status(success ? 200 : 404).json({ success, message: success ? "Comment reported" : "Comment not found" });
            return;
        }

        const success = await this.commentService.reportComment(req.user!.id, commentId);
        if (!success) {
            res.status(403).json({ success: false, message: "Only moderators or admins can report comments" });
            return;
        }
        res.status(200).json({ success: true, message: "Comment reported" });
    }

private async likeComment(req: Request, res: Response): Promise<void> {
        const commentId = parseInt(req.params.id as string, 10);
        if (isNaN(commentId)) { res.status(400).json({ success: false, message: "Invalid comment ID" }); return; }
        const result = await this.commentLikeService.likeComment(req.user!.id, commentId, new CreateCommentLikeDto(1));
        if (result.userId === 0) {
            res.status(400).json({ success: false, message: "Unable to like comment" });
            return;
        }
        res.status(200).json({ success: true, message: "Comment liked successfully" });
    }

    private async unlikeComment(req: Request, res: Response): Promise<void> {
        const commentId = parseInt(req.params.id as string, 10);
        if (isNaN(commentId)) { res.status(400).json({ success: false, message: "Invalid comment ID" }); return; }
        const success = await this.commentLikeService.unlikeComment(req.user!.id, commentId);
        if (!success) {
            res.status(400).json({ success: false, message: "Unable to unlike comment" });
            return;
        }
        res.status(200).json({ success: true, message: "Comment unliked successfully" });
    }
}
