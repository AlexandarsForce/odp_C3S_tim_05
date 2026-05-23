import { Request, Response, Router } from 'express';
import { ICommunityService } from '../../Domain/services/communities/ICommunityService';
import { ICommunityMemberService } from '../../Domain/services/communities/ICommunityMemberService';
import { IAuditService } from '../../Domain/services/audit/IAuditService';
import { authenticate } from '../../Middlewares/authentification/AuthMiddleware';
import { authorize } from '../../Middlewares/authorization/AuthorizeMiddleware';
import { UserRole } from '../../Domain/enums/UserRole';
import { CreateCommunityDto } from "../../Domain/DTOs/communities/CreateCommunityDto";
import { UpdateCommunityDto } from "../../Domain/DTOs/communities/UpdateCommunityDto";
import { UpdateCommunityMemberRoleDto } from '../../Domain/DTOs/communities/UpdateCommunityMemberRoleDto';
import { ResponseCommunityDto } from '../../Domain/DTOs/communities/ResponseCommunityDto';

export class CommunityController {
  private readonly router = Router()
    public constructor(
    private readonly communityService: ICommunityService,
    private readonly communityMemberService: ICommunityMemberService,
    private readonly auditService: IAuditService)
    {
        this.router.get("/communities", authenticate, this.getPublicCommunities.bind(this));
        this.router.get("/communities/mine", authenticate, this.getMyCommunities.bind(this));
        this.router.get("/communities/all", authenticate, authorize(UserRole.ADMIN), this.getAllCommunities.bind(this));
        this.router.post("/communities", authenticate, this.createCommunity.bind(this));
        this.router.get("/communities/:id", authenticate, this.getCommunityDetails.bind(this));
        this.router.put("/communities/:id", authenticate, this.updateCommunity.bind(this));
        this.router.delete("/communities/:id", authenticate, this.deleteCommunity.bind(this));

        this.router.post("/communities/:id/join", authenticate, this.requestJoinCommunity.bind(this));
        this.router.delete("/communities/:id/leave", authenticate, this.leaveCommunity.bind(this));
        this.router.patch("/communities/:id/members/:userId/role", authenticate, this.updateCommunityMemberRole.bind(this));
        this.router.patch("/communities/:id/members/:userId/status", authenticate, this.responseJoinCommunity.bind(this));
        this.router.delete("/communities/:id/members/:userId", authenticate, this.removeCommunityMember.bind(this));
    }

    public getRouter(): Router { return this.router; }

    private async getPublicCommunities(req: Request, res: Response): Promise<void> {
        const page = parseInt(String(req.query.page ?? "1"), 10);
        const limit = Math.min(parseInt(String(req.query.limit ?? "20"), 10), 100);
        const result = await this.communityService.getPublicCommunities(page, limit);
        res.status(200).json({ success: true, data: result });
    }

    private async getMyCommunities(req: Request, res: Response): Promise<void> {
        const page = parseInt(String(req.query.page ?? "1"), 10);
        const limit = Math.min(parseInt(String(req.query.limit ?? "20"), 10), 100);
        const result = await this.communityService.getCommunityByMemberId(req.user!.id, page, limit);
        res.status(200).json({ success: true, data: result });
    }

    private async getAllCommunities(req: Request, res: Response): Promise<void> {
        const page = parseInt(String(req.query.page ?? "1"), 10);
        const limit = Math.min(parseInt(String(req.query.limit ?? "20"), 10), 100);
        const result = await this.communityService.getAllCommunities(page, limit, true);
        res.status(200).json({ success: true, data: result });
    }

    private async createCommunity(req: Request, res: Response): Promise<void> {
        const { ownerId, name, description, rules, avatarPicture,type} = req.body as CreateCommunityDto;
        const community = await this.communityService.createCommunity(req.user!.id, new CreateCommunityDto(ownerId, name, description, rules, avatarPicture,type));
        res.status(201).json({ success: true, data: community });
    }

    private async getCommunityDetails(req: Request, res: Response): Promise<void> {
        const id = parseInt(req.params.id as string, 10);
        if (isNaN(id)) { res.status(400).json({ success: false, message: "Invalid ID" }); return; }
        const community = await this.communityService.getCommunityDetails(id);
        if (community.id === 0) { res.status(404).json({ success: false, message: "Community not found" }); return; }
        const page = parseInt(String(req.query.page ?? "1"), 10);
        const limit = Math.min(parseInt(String(req.query.limit ?? "5"), 10), 20);
        const MemberList = await this.communityMemberService.getCommunityMembers(req.user!.id, id, page, limit);
        res.status(200).json({ success: true, data: community, members: MemberList });
    }

    private async updateCommunity(req: Request, res: Response): Promise<void> {
        const id = parseInt(req.params.id as string, 10);
        const { name, description, rules, avatarPicture,type } = req.body as UpdateCommunityDto;
        if (isNaN(id)) { res.status(400).json({ success: false, message: "Invalid ID" }); return; }
        const ok = await this.communityService.updateCommunity(req.user!.id, id, new UpdateCommunityDto(name, description, rules, avatarPicture,type));
        if (!ok) { res.status(404).json({ success: false, message: "Community not found or unauthorized" }); return; }
        res.status(200).json({ success: true, message: "Community updated" });
    }

    private async deleteCommunity(req: Request, res: Response): Promise<void> {
        const id = parseInt(req.params.id as string, 10);
        if (isNaN(id)) { res.status(400).json({ success: false, message: "Invalid ID" }); return; }
        const ok = await this.communityService.deleteCommunity(req.user!.id, id);
        if (!ok) { res.status(404).json({ success: false, message: "Community not found or unauthorized" }); return; }
        res.status(200).json({ success: true, message: "Community deleted" });
    }

    private async requestJoinCommunity(req: Request, res: Response): Promise<void> {
        const id = parseInt(req.params.id as string, 10);
        if (isNaN(id)) { res.status(400).json({ success: false, message: "Invalid ID" }); return; }
        const ok = await this.communityMemberService.requestJoinCommunity(req.user!.id, id);
        if (!ok) { res.status(404).json({ success: false, message: "Community not found or already requested" }); return; }
        res.status(200).json({ success: true, message: "Join request sent" });
    }

    private async leaveCommunity(req: Request, res: Response): Promise<void> {
        const id = parseInt(req.params.id as string, 10);
        if (isNaN(id)) { res.status(400).json({ success: false, message: "Invalid ID" }); return; }
        const ok = await this.communityMemberService.leaveCommunity(req.user!.id, id);
        if (!ok) { res.status(404).json({ success: false, message: "Community not found or not a member" }); return; }
        res.status(200).json({ success: true, message: "Left community" });
    }

    private async updateCommunityMemberRole(req: Request, res: Response): Promise<void> {
        const communityId = parseInt(req.params.id as string, 10);
        const memberId = parseInt(req.params.userId as string, 10);
        const { role } = req.body as UpdateCommunityMemberRoleDto;
        if (isNaN(communityId) || isNaN(memberId)) { res.status(400).json({ success: false, message: "Invalid ID" }); return; }
        const ok = await this.communityMemberService.updateCommunityMemberRole(req.user!.id, memberId, communityId, new UpdateCommunityMemberRoleDto(role));
        if (!ok) { res.status(404).json({ success: false, message: "Community or member not found, or unauthorized" }); return; }
        res.status(200).json({ success: true, message: "Member role updated" });
    }

    private async responseJoinCommunity(req: Request, res: Response): Promise<void> {
        const communityId = parseInt(req.params.id as string, 10);
        const memberId = parseInt(req.params.userId as string, 10);
        const { accepted } = req.body as ResponseCommunityDto;
        if (isNaN(communityId) || isNaN(memberId)) { res.status(400).json({ success: false, message: "Invalid ID" }); return; }
        const ok = await this.communityMemberService.responseJoinCommunity(req.user!.id, communityId, new ResponseCommunityDto(accepted));
        if (!ok) { res.status(404).json({ success: false, message: "Community or member not found, or unauthorized" }); return; }
        res.status(200).json({ success: true, message: accepted ? "Join request accepted" : "Join request rejected" });
    }

    private async removeCommunityMember(req: Request, res: Response): Promise<void> {
        const communityId = parseInt(req.params.id as string, 10);
        const memberId = parseInt(req.params.userId as string, 10);
        if (isNaN(communityId) || isNaN(memberId)) { res.status(400).json({ success: false, message: "Invalid ID" }); return; }
        const ok = await this.communityMemberService.removeCommunityMember(req.user!.id, memberId, communityId);
        if (!ok) { res.status(404).json({ success: false, message: "Community or member not found, or unauthorized" }); return; }
        res.status(200).json({ success: true, message: "Member removed from community" });
    }
}