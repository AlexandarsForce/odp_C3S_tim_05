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
import { validateCreateCommunity, validateUpdateCommunity } from '../validators/communities/ValidateCommunity';
import { CreateCommunityResult } from '../../Domain/enums/CreateCommunityResult';
import { UpdateMemberRoleResult } from '../../Domain/enums/UpdateMemberRoleResult';
import { RequestJoinResult } from '../../Domain/enums/RequestJoinResult';
import { LeaveCommunityResult } from '../../Domain/enums/LeaveCommunityResult';
import { CommunityMemberRole } from '../../Domain/enums/CommunityMemberRole';

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

        this.router.put("/communities/:id/admin", authenticate, authorize(UserRole.ADMIN), this.adminUpdateCommunity.bind(this));
        this.router.delete("/communities/:id/admin", authenticate, authorize(UserRole.ADMIN), this.adminDeleteCommunity.bind(this));

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
        const validationResult = validateCreateCommunity(new CreateCommunityDto(req.user!.id, name, description, rules, avatarPicture,type));
        if (!validationResult.valid) {
            res.status(400).json({ success: false, message: validationResult.message });
            return;
        }
        const { result, community } = await this.communityService.createCommunity(req.user!.id, new CreateCommunityDto(req.user!.id, name, description, rules, avatarPicture, type));
        if (result === CreateCommunityResult.DuplicateName) { res.status(409).json({ success: false, message: "Community with this name already exists" }); return; }
        if (result === CreateCommunityResult.Unavailable || !community) { res.status(503).json({ success: false, message: "Service temporarily unavailable" }); return; }
        res.status(201).json({ success: true, data: community });
    }

    private async getCommunityDetails(req: Request, res: Response): Promise<void> {
        const id = parseInt(req.params.id as string, 10);
        if (isNaN(id)) { res.status(400).json({ success: false, message: "Invalid ID" }); return; }
        const community = await this.communityService.getCommunityDetails(id);
        if (community.id === 0) { res.status(404).json({ success: false, message: "Community not found" }); return; }

        // viewerMembership lets the client render the right CTA (Join / Pending / Leave)
        // without a second request. Null = no record at all.
        const viewerMembership = await this.communityMemberService.getViewerMembership(req.user!.id, id);

        // Member list is sensitive — only active members of the community (or admins) get it
        const isAdmin = req.user!.role === UserRole.ADMIN;
        const isMember = isAdmin || (viewerMembership?.status === "active");
        if (!isMember) {
            res.status(200).json({
                success: true,
                data: community,
                members: { items: [], total: 0, page: 1, limit: 0 },
                viewerMembership,
                message: "Join this community to see its members",
            });
            return;
        }

        const page = parseInt(String(req.query.page ?? "1"), 10);
        const limit = Math.min(parseInt(String(req.query.limit ?? "5"), 10), 20);
        const MemberList = await this.communityMemberService.getCommunityMembers(req.user!.id, id, page, limit);
        res.status(200).json({ success: true, data: community, members: MemberList, viewerMembership });
    }

    private async updateCommunity(req: Request, res: Response): Promise<void> {
        const id = parseInt(req.params.id as string, 10);
        const { name, description, rules, avatarPicture,type } = req.body as UpdateCommunityDto;
        if (isNaN(id)) { res.status(400).json({ success: false, message: "Invalid ID" }); return; }
        const isMod = req.user!.role === UserRole.ADMIN || await this.communityMemberService.isModerator(req.user!.id, id);
        if (!isMod) { res.status(403).json({ success: false, message: "Only moderators or admins can update a community" }); return; }
        const validationResult = validateUpdateCommunity(new UpdateCommunityDto(name, description, rules, avatarPicture,type));
        if (!validationResult.valid) {
            res.status(400).json({ success: false, message: validationResult.message });
            return;
        }
        const ok = await this.communityService.updateCommunity(req.user!.id, id, new UpdateCommunityDto(name, description, rules, avatarPicture,type));
        if (!ok) { res.status(404).json({ success: false, message: "Community not found" }); return; }
        res.status(200).json({ success: true, message: "Community updated" });
    }

    private async deleteCommunity(req: Request, res: Response): Promise<void> {
        const id = parseInt(req.params.id as string, 10);
        if (isNaN(id)) { res.status(400).json({ success: false, message: "Invalid ID" }); return; }
        const ok = await this.communityService.deleteCommunity(req.user!.id, id);
        if (!ok) { res.status(404).json({ success: false, message: "Community not found or unauthorized" }); return; }
        res.status(200).json({ success: true, message: "Community deleted" });
    }

    private async adminUpdateCommunity(req: Request, res: Response): Promise<void> {
        const id = parseInt(req.params.id as string, 10);
        const { name, description, rules, avatarPicture, type } = req.body as UpdateCommunityDto;
        if (isNaN(id)) { res.status(400).json({ success: false, message: "Invalid ID" }); return; }
        const validationResult = validateUpdateCommunity(new UpdateCommunityDto(name, description, rules, avatarPicture, type));
        if (!validationResult.valid) {
            res.status(400).json({ success: false, message: validationResult.message });
            return;
        }
        const ok = await this.communityService.adminUpdateCommunity(req.user!.id, id, new UpdateCommunityDto(name, description, rules, avatarPicture, type));
        if (!ok) { res.status(404).json({ success: false, message: "Community not found" }); return; }
        res.status(200).json({ success: true, message: "Community updated" });
    }

    private async adminDeleteCommunity(req: Request, res: Response): Promise<void> {
        const id = parseInt(req.params.id as string, 10);
        if (isNaN(id)) { res.status(400).json({ success: false, message: "Invalid ID" }); return; }
        const ok = await this.communityService.adminDeleteCommunity(req.user!.id, id);
        if (!ok) { res.status(404).json({ success: false, message: "Community not found" }); return; }
        res.status(200).json({ success: true, message: "Community deleted" });
    }

    private async requestJoinCommunity(req: Request, res: Response): Promise<void> {
        const id = parseInt(req.params.id as string, 10);
        if (isNaN(id)) { res.status(400).json({ success: false, message: "Invalid ID" }); return; }
        const result = await this.communityMemberService.requestJoinCommunity(req.user!.id, id);
        switch (result) {
            case RequestJoinResult.NotFound:
                res.status(404).json({ success: false, message: "Community not found" }); return;
            case RequestJoinResult.AlreadyMember:
                res.status(409).json({ success: false, message: "You are already a member of this community" }); return;
            case RequestJoinResult.AlreadyPending:
                res.status(409).json({ success: false, message: "You already have a pending join request" }); return;
            case RequestJoinResult.Banned:
                res.status(403).json({ success: false, message: "You are banned from this community" }); return;
            case RequestJoinResult.Unavailable:
                res.status(503).json({ success: false, message: "Service temporarily unavailable" }); return;
            case RequestJoinResult.Joined:
                res.status(200).json({ success: true, message: "Joined community" }); return;
            case RequestJoinResult.Success:
                res.status(200).json({ success: true, message: "Join request sent" }); return;
        }
    }

    private async leaveCommunity(req: Request, res: Response): Promise<void> {
        const id = parseInt(req.params.id as string, 10);
        if (isNaN(id)) { res.status(400).json({ success: false, message: "Invalid ID" }); return; }
        const result = await this.communityMemberService.leaveCommunity(req.user!.id, id);
        switch (result) {
            case LeaveCommunityResult.NotFound:
                res.status(404).json({ success: false, message: "You are not a member of this community" }); return;
            case LeaveCommunityResult.LastModerator:
                res.status(409).json({ success: false, message: "You are the last moderator. Promote another member before leaving." }); return;
            case LeaveCommunityResult.Success:
                res.status(200).json({ success: true, message: "Left community" }); return;
        }
    }

    private async updateCommunityMemberRole(req: Request, res: Response): Promise<void> {
        const communityId = parseInt(req.params.id as string, 10);
        const memberId = parseInt(req.params.userId as string, 10);
        const { role } = req.body as UpdateCommunityMemberRoleDto;
        if (isNaN(communityId) || isNaN(memberId)) { res.status(400).json({ success: false, message: "Invalid ID" }); return; }
        // Runtime enum guard — only "member" and "moderator" are valid community roles.
        // Members cannot promote themselves; promotion is controlled by the isMod check below.
        if (!role || !Object.values(CommunityMemberRole).includes(role)) {
            res.status(400).json({ success: false, message: "Invalid role. Allowed values: 'member', 'moderator'" });
            return;
        }
        const actorRole = req.user!.role;
        const isMod = actorRole === UserRole.ADMIN || await this.communityMemberService.isModerator(req.user!.id, communityId);
        if (!isMod) { res.status(403).json({ success: false, message: "Only moderators or admins can change member roles" }); return; }
        const result = await this.communityMemberService.updateCommunityMemberRole(req.user!.id, memberId, communityId, new UpdateCommunityMemberRoleDto(role));
        if (result === UpdateMemberRoleResult.NotFound) { res.status(404).json({ success: false, message: "Community or member not found" }); return; }
        if (result === UpdateMemberRoleResult.LastModerator) { res.status(409).json({ success: false, message: "Community must have at least one moderator" }); return; }
        res.status(200).json({ success: true, message: "Member role updated" });
    }

    private async responseJoinCommunity(req: Request, res: Response): Promise<void> {
        const communityId = parseInt(req.params.id as string, 10);
        const targetUserId = parseInt(req.params.userId as string, 10);
        const { accepted } = req.body as ResponseCommunityDto;
        if (isNaN(communityId) || isNaN(targetUserId)) { res.status(400).json({ success: false, message: "Invalid ID" }); return; }
        const actorRole = req.user!.role;
        const isMod = actorRole === UserRole.ADMIN || await this.communityMemberService.isModerator(req.user!.id, communityId);
        if (!isMod) { res.status(403).json({ success: false, message: "Only moderators or admins can respond to join requests" }); return; }
        const ok = await this.communityMemberService.responseJoinCommunity(req.user!.id, communityId, targetUserId, new ResponseCommunityDto(accepted));
        if (!ok) { res.status(404).json({ success: false, message: "Pending request not found for that user" }); return; }
        res.status(200).json({ success: true, message: accepted ? "Join request accepted" : "Join request rejected" });
    }

    private async removeCommunityMember(req: Request, res: Response): Promise<void> {
        const communityId = parseInt(req.params.id as string, 10);
        const memberId = parseInt(req.params.userId as string, 10);
        if (isNaN(communityId) || isNaN(memberId)) { res.status(400).json({ success: false, message: "Invalid ID" }); return; }
        const actorRole = req.user!.role;
        const isAdmin = actorRole === UserRole.ADMIN;
        const isMod = isAdmin || await this.communityMemberService.isModerator(req.user!.id, communityId);
        if (!isMod) { res.status(403).json({ success: false, message: "Only moderators or admins can remove members" }); return; }

        // Owner protection: the community creator (owner_id) can ONLY be removed by an admin.
        // The owner can still leave on their own via DELETE /communities/:id/leave.
        const community = await this.communityService.getCommunityDetails(communityId);
        if (community.id === 0) { res.status(404).json({ success: false, message: "Community not found" }); return; }
        if (community.ownerId === memberId && !isAdmin) {
            res.status(403).json({ success: false, message: "The community owner can only be removed by an admin" });
            return;
        }

        const ok = await this.communityMemberService.removeCommunityMember(req.user!.id, memberId, communityId);
        if (!ok) { res.status(404).json({ success: false, message: "Member not found" }); return; }
        res.status(200).json({ success: true, message: "Member removed from community" });
    }
}