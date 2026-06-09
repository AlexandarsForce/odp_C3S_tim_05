import { Audit } from "../../models/Audit";
import { AuditDto } from "../../DTOs/audit/AuditDto";
import { PaginatedListDto } from "../../DTOs/utils/PaginatedListDto";

export interface IAuditRepository {
  create(log: Audit): Promise<Audit>;
  findAll(page: number, limit: number): Promise<PaginatedListDto<AuditDto>>;
}