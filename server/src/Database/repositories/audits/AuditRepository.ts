import { RowDataPacket, ResultSetHeader } from "mysql2";
import { IAuditRepository } from "../../../Domain/repositories/audits/IAuditRepository";
import { Audit } from "../../../Domain/models/Audit";
import { AuditDto } from "../../../Domain/DTOs/audit/AuditDto";
import { PaginatedListDto } from "../../../Domain/DTOs/entity/PaginatedListDto";
import { DbManager } from "../../connection/DbConnectionPool";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";

export class AuditRepository implements IAuditRepository {
  public constructor(
    private readonly db: DbManager,
    private readonly logger: ILoggerService
  ) {}

  async create(log: Audit): Promise<Audit> {
    const res = await this.db.getWriteConnection();
    if (!res) return new Audit();
    try {
      const [result] = await res.conn.execute<ResultSetHeader>(
        `INSERT INTO audits (userId, action, details, ipAddress, createdAt)
         VALUES (?, ?, ?, ?, ?)`,
        [log.userId ?? null, log.action, log.details ?? null, log.ipAddress ?? null, new Date()]
      );
      if (result.insertId === 0) return new Audit();
      return new Audit(result.insertId, log.userId, log.action,
        log.details, log.ipAddress, new Date());
    } catch (err) {
      this.logger.error("AuditRepository", "create failed", err);
      return new Audit();
    } finally { res.conn.release(); }
  }

  async findAll(page: number, limit: number): Promise<PaginatedListDto<AuditDto>> {
    const res = await this.db.getReadConnection();
    if (!res) return new PaginatedListDto([], 0, page, limit);
    const offset = Math.max(0, Math.floor((page - 1) * limit));
    const lim    = Math.max(1, Math.floor(limit));
    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT al.*, u.username
         FROM audits al
         LEFT JOIN users u ON al.userId = u.id
         ORDER BY al.createdAt DESC
         LIMIT ${lim} OFFSET ${offset}`,
        []
      );
      const [cnt] = await res.conn.execute<RowDataPacket[]>(
        `SELECT COUNT(*) as total FROM audits`
      );
      const items = rows.map(
        (l) => new AuditDto(
          l.id, l.userId ?? null, l.username ?? null,
          l.action, l.details ?? null,
          l.ipAddress ?? null, new Date(l.createdAt as string)
        )
      );
      return new PaginatedListDto(items, cnt[0]?.total ?? 0, page, limit);
    } catch (err) {
      this.logger.error("AuditRepository", "findAll failed", err);
      return new PaginatedListDto([], 0, page, limit);
    } finally { res.conn.release(); }
  }
}
