import { Request, Response, Router } from 'express';
import { IHealthService } from '../../Domain/services/health/IHealthService';
import { IAuditService } from '../../Domain/services/audit/IAuditService';
import { UserRole } from '../../Domain/enums/UserRole';
import { authenticate } from '../../Middlewares/authentification/AuthMiddleware';
import { authorize } from '../../Middlewares/authorization/AuthorizeMiddleware';

export class HealthController {
    private readonly router = Router();

    public constructor(
        private readonly healthService: IHealthService,
        private readonly auditService: IAuditService
    ) {
        this.router.get("/health", this.getPublicHealth.bind(this));
        this.router.get("/health/db", authenticate, authorize(UserRole.ADMIN), this.getAllNodes.bind(this));
        this.router.post("/health/failover",authenticate, authorize(UserRole.ADMIN), this.startFailover.bind(this));
    }

    public getRouter(): Router { return this.router; }

    private async getPublicHealth(req: Request, res: Response): Promise<void> {
        const result = { status: "healthy", timestamp: process.uptime() };
        res.status(200).json({ success: true, data: result });
    }

    private async getAllNodes(req: Request, res: Response): Promise<void> {
        const result = this.healthService.getHealthStatus();
        res.status(200).json({ success: true, data: result });
    }

    private async startFailover(req: Request, res: Response): Promise<void> {
        const { idx } = req.body as { idx?: number };
        if (idx === undefined) { res.status(400).json({ success: false, message: "Missing idx in request body" }); return; }
        if (idx !== 0 && idx !== 1) { res.status(400).json({ success: false, message: "Invalid idx value, must be 0 or 1" }); return; }
        const result = await this.healthService.promoteSlaveToMaster(idx as 0 | 1);
        if(!result.success) { res.status(500).json({ success: false, message: result.message }); return; }
        await this.auditService.log({
            userId: req.user?.id,
            action: "Promote slave",
            details: `Promoted slave with index ${idx}. Result: ${result.message}`,
            ipAddress: req.ip
        });
        res.status(200).json({ success: true, message: result.message });
    }

}