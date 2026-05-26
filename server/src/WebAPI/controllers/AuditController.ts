import { Request, Response, Router } from 'express';
import { IAuditService } from '../../Domain/services/audit/IAuditService';
import { UserRole } from '../../Domain/enums/UserRole';
import { authenticate } from '../../Middlewares/authentification/AuthMiddleware';
import { authorize } from '../../Middlewares/authorization/AuthorizeMiddleware';

export class AuditController {
    private readonly router = Router();

    public constructor(private readonly auditService: IAuditService) {
        this.router.get("/audits/logs", authenticate, authorize(UserRole.ADMIN), this.getAllLogs.bind(this));
    }

    public getRouter(): Router { return this.router; }

    private async getAllLogs(req: Request, res: Response): Promise<void> {
        const page  = parseInt(req.query.page  as string ?? "1",  10);
        const limit = parseInt(req.query.limit as string ?? "20", 10);
        const result = await this.auditService.getAllLogs(page, limit);
        res.status(200).json({ success: true, data: result });
    }
}