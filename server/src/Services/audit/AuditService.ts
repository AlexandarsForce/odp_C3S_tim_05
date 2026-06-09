import { IAuditService } from "../../Domain/services/audit/IAuditService";
import { IAuditRepository } from "../../Domain/repositories/audits/IAuditRepository";
import { AuditDto } from "../../Domain/DTOs/audit/AuditDto";
import { PaginatedListDto } from "../../Domain/DTOs/utils/PaginatedListDto";
import { Audit } from "../../Domain/models/Audit";

export class AuditService implements IAuditService {
  public constructor(private readonly auditRepo: IAuditRepository) {}

  async log(params: {
    userId: number;
    action: string;
    details: string;
    ipAddress: string;
  }): Promise<void> {
    const entry = new Audit(
      0,
      params.userId,
      params.action,
      params.details,
      params.ipAddress
    );
    await this.auditRepo.create(entry);
  }

  async getAllLogs(page: number, limit: number): Promise<PaginatedListDto<AuditDto>> {
    return this.auditRepo.findAll(page, limit);
  }
}