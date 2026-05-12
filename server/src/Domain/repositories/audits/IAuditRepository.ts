import { Audit } from "../../models/Audit";
import { AuditDto } from "../../DTOs/audit/AuditDTO";
import { PaginatedListDto } from "../../DTOs/entity/PaginatedListDto";

export interface IAuditRepository {
  create(log: Audit): Promise<Audit>;
  findAll(page: number, limit: number): Promise<PaginatedListDto<AuditDto>>;
}