import { Request, Response, Router } from "express";
import { ITagService } from "../../Domain/services/tags/ITagService";
import { authenticate } from "../../Middlewares/authentification/AuthMiddleware";
import { authorize } from "../../Middlewares/authorization/AuthorizeMiddleware";
import { UserRole } from "../../Domain/enums/UserRole";
import { CreateTagDto } from "../../Domain/DTOs/tag/CreateTagDto";

export class TagController {
    private readonly router = Router();

    public constructor(private readonly tagService: ITagService) {
        this.router.get("/tags", this.getAllTags.bind(this));
        this.router.post("/tags", authenticate, this.createTag.bind(this));
        this.router.delete("/tags/:id", authenticate, authorize(UserRole.ADMIN), this.deleteTag.bind(this));
    }

    public getRouter(): Router { return this.router; }

    private async getAllTags(req: Request, res: Response): Promise<void> {
        const tags = await this.tagService.getAllTags();
        res.status(200).json({ success: true, data: tags });
    }

    private async createTag(req: Request, res: Response): Promise<void> {
        const { name } = req.body as CreateTagDto;
        if (!name || name.trim() === "") {
            res.status(400).json({ success: false, message: "Tag name is required" });
            return;
        }
        const tag = await this.tagService.createTag(req.user!.id, new CreateTagDto(name));
        if (tag.id === 0) {
            res.status(400).json({ success: false, message: "Unable to create tag" });
            return;
        }
        res.status(201).json({ success: true, data: tag });
    }

    private async deleteTag(req: Request, res: Response): Promise<void> {
        const tagId = parseInt(req.params.id as string, 10);
        if (isNaN(tagId)) {
            res.status(400).json({ success: false, message: "Invalid tag id" });
            return;
        }
        const success = await this.tagService.deleteTag(req.user!.id, tagId);
        if (!success) {
            res.status(404).json({ success: false, message: "Tag not found" });
            return;
        }
        res.status(200).json({ success: true, message: "Tag deleted successfully" });
    }
}
