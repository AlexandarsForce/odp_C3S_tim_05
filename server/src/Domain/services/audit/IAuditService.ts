import { AuditDto } from "../../DTOs/audit/AuditDto";
import { PaginatedListDto } from "../../DTOs/utils/PaginatedListDto";

export interface IAuditService {
  log(params: {
    userId?: number;
    action: string;
    details?: string;
    ipAddress?: string;
  }): Promise<void>;
  getAllLogs(page: number, limit: number): Promise<PaginatedListDto<AuditDto>>;
}
