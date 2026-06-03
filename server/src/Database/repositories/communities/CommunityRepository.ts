import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { ICommunityRepository } from "../../../Domain/repositories/communities/ICommunityRepository";
import { Community } from "../../../Domain/models/Community";
import { CommunityType } from '../../../Domain/enums/CommunityType';
import { DbManager } from "../../connection/DbConnectionPool";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";

const safeInt = (n: number): number => Math.max(0, Math.floor(n));

export class CommunityRepository implements ICommunityRepository {
  public constructor(
    private readonly db: DbManager,
    private readonly logger: ILoggerService,
  ) {}

  private mapCommunity(r: RowDataPacket): Community {
    return new Community(
      r.community_id,
      r.owner_id,
      r.name,
      r.description ?? null,
      r.rules ?? null,
      r.avatar_picture ?? null,
      r.type as CommunityType,
      r.created_at ? new Date(r.created_at) : new Date(),
      r.updated_at ? new Date(r.updated_at) : new Date(),
    );
  }

  async createCommunity(community: Community): Promise<Community> {
    const res = await this.db.getWriteConnection();
    if (!res) return new Community();
    try {
        const [result] = await res.conn.execute<ResultSetHeader>(
          `INSERT INTO communities (owner_id, name, description, rules, avatar_picture, type) VALUES (?, ?, ?, ?, ?, ?)`,
          [community.ownerId, community.name, community.description, community.rules, community.avatarPicture, community.type]
        );
        if (result.insertId === 0) return new Community();
        return new Community(result.insertId, community.ownerId, community.name, community.description, community.rules, community.avatarPicture, community.type);
    }
    catch (err) {
        this.logger.error("CommunityRepository", "createCommunity failed", err);
        return new Community();
    }
    finally { res.conn.release(); }
  }

  async findCommunityById(communityId: number): Promise<Community> {
    const res = await this.db.getReadConnection();
    if (!res) return new Community();
    try {
    const [rows] = await res.conn.execute<RowDataPacket[]>(`SELECT * FROM communities WHERE community_id = ?`, [communityId]);
    return rows.length > 0 ? this.mapCommunity(rows[0]) : new Community();
    }
    catch (err) {
    this.logger.error("CommunityRepository", "findCommunityById failed", err);
    return new Community();
    }
    finally { res.conn.release(); }
  }

  async findCommunityByName(name: string): Promise<Community> {
    const res = await this.db.getReadConnection();
    if (!res) return new Community();
    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(`SELECT * FROM communities WHERE name = ?`, [name]);
      return rows.length > 0 ? this.mapCommunity(rows[0]) : new Community();
    }
    catch (err) {
      this.logger.error("CommunityRepository", "findCommunityByName failed", err);
      return new Community();
    }
    finally { res.conn.release(); }
  }

  async findCommunityByType(type: CommunityType, page: number, limit: number): Promise<{ communities: Community[], totalAmount: number }> {
    const res = await this.db.getReadConnection();
    if (!res) return { communities: [], totalAmount: 0 };
    const offset = safeInt((page - 1) * limit);
    const lim = safeInt(limit);
    try {
      type CountRow = RowDataPacket & { total: number | string };
      const [countRows] = await res.conn.execute<RowDataPacket[]>(`SELECT COUNT(*) as total FROM communities WHERE type = ?`, [type]);
      const totalAmount = Number((countRows as CountRow[])[0]?.total ?? 0);
      const [rows] = await res.conn.execute<RowDataPacket[]>(`SELECT * FROM communities WHERE type = ? ORDER BY name ASC LIMIT ${lim} OFFSET ${offset}`, [type]);
      return {
        communities: rows.map((row) => this.mapCommunity(row)),
        totalAmount
      };
    }
    catch (err) {
      this.logger.error("CommunityRepository", "findCommunityByType failed", err);
      return { communities: [], totalAmount: 0 };
    }
    finally { res.conn.release(); }
  }

  async findCommunityByOwnerId(ownerId: number, page: number, limit: number): Promise<{ communities: Community[], totalAmount: number }> {
    const res = await this.db.getReadConnection();
    if (!res) return { communities: [], totalAmount: 0 };
    const offset = safeInt((page - 1) * limit);
    const lim = safeInt(limit);
    try {
      type CountRow = RowDataPacket & { total: number | string };
      const [countRows] = await res.conn.execute<RowDataPacket[]>(`SELECT COUNT(*) as total FROM communities WHERE owner_id = ?`, [ownerId]);
      const totalAmount = Number((countRows as CountRow[])[0]?.total ?? 0);
      const [rows] = await res.conn.execute<RowDataPacket[]>(`SELECT * FROM communities WHERE owner_id = ? ORDER BY name ASC LIMIT ${lim} OFFSET ${offset}`, [ownerId]);
      return {
        communities: rows.map((row) => this.mapCommunity(row)),
        totalAmount
      };
    }
    catch (err) {
      this.logger.error("CommunityRepository", "findCommunityByOwnerId failed", err);
      return { communities: [], totalAmount: 0 };
    }
    finally { res.conn.release(); }
  }

  async findCommunityByMemberId(memberId: number, page: number, limit: number): Promise<{ communities: Community[], totalAmount: number }> {
    const resReadMembers = await this.db.getReadConnection();
    if (!resReadMembers) return { communities: [], totalAmount: 0 };
    let communityIds: number[] = [];
    const offset = safeInt((page - 1) * limit);
    const lim = safeInt(limit);
    try {
      const [rows] = await resReadMembers.conn.execute<RowDataPacket[]>(`SELECT community_id FROM community_members WHERE user_id = ? LIMIT ${lim} OFFSET ${offset}`, [memberId]);
      communityIds = rows.map((row) => row.community_id);
      if (communityIds.length === 0) return { communities: [], totalAmount: 0 };
    }
    catch (err) {
      this.logger.error("CommunityRepository", "findCommunityByMemberId failed fetching member communities", err);
      return { communities: [], totalAmount: 0 };
    }
    finally { resReadMembers.conn.release(); }

    const resReadCommunities = await this.db.getReadConnection();
    if (!resReadCommunities) return { communities: [], totalAmount: 0 };
    try {
      const placeholders = communityIds.map(() => '?').join(',');
      const sql = `SELECT * FROM communities WHERE community_id IN (${placeholders}) ORDER BY name ASC`;
      type CountRow = RowDataPacket & { total: number | string };
      const countSql = `SELECT COUNT(*) as total FROM communities WHERE community_id IN (${placeholders})`;
      const [countRows] = await resReadCommunities.conn.execute<RowDataPacket[]>(countSql, communityIds);
      const totalAmount = Number((countRows as CountRow[])[0]?.total ?? 0);
      const [rows] = await resReadCommunities.conn.execute<RowDataPacket[]>(sql, communityIds);
      return {
        communities: rows.map((row) => this.mapCommunity(row)),
        totalAmount
      };
    }
    catch (err) {
      this.logger.error("CommunityRepository", "findCommunityByMemberId failed fetching communities", err);
      return { communities: [], totalAmount: 0 };
    }
    finally { resReadCommunities.conn.release(); }
  }

  async findAllCommunities(page: number, limit: number): Promise<{ communities: Community[]; totalAmount: number; }> {
    const res = await this.db.getReadConnection();
    if (!res) return { communities: [], totalAmount: 0 };
    const offset = safeInt((page - 1) * limit);
    const lim = safeInt(limit);
    try {
      type CountRow = RowDataPacket & { total: number | string };
      const [countRows] = await res.conn.execute<RowDataPacket[]>(`SELECT COUNT(*) as total FROM communities`);
      const totalAmount = Number((countRows as CountRow[])[0]?.total ?? 0);
      const [rows] = await res.conn.execute<RowDataPacket[]>(`SELECT * FROM communities ORDER BY name ASC LIMIT ${lim} OFFSET ${offset}`);
      return {
        communities: rows.map((row) => this.mapCommunity(row)),
        totalAmount
      };
    }
    catch (err) {
      this.logger.error("CommunityRepository", "findAllCommunities failed", err);
      return { communities: [], totalAmount: 0 };
    }
    finally { res.conn.release(); }
  }

  async updateCommunity(communityId: number, community: Community): Promise<boolean> {
    const res = await this.db.getWriteConnection();
    if (!res) return false;
    try {
      const [result] = await res.conn.execute<ResultSetHeader>(
        `UPDATE communities SET name = ?, description = ?, rules = ?, avatar_picture = ?, type = ? WHERE community_id = ?`,
        [community.name, community.description, community.rules, community.avatarPicture, community.type, communityId]
      );
      return result.affectedRows > 0;
    }
    catch (err) {
      this.logger.error("CommunityRepository", "updateCommunity failed", err);
      return false;
    }
    finally { res.conn.release(); }
  }

  async deleteCommunity(communityId: number): Promise<boolean> {
      const res = await this.db.getWriteConnection();
      if (!res) return false;
      try {
        const [result] = await res.conn.execute<ResultSetHeader>(`DELETE FROM communities WHERE community_id = ?`, [communityId]);
        return result.affectedRows > 0;
      }
      catch (err) {
        this.logger.error("CommunityRepository", "deleteCommunity failed", err);
        return false;
      }
      finally { res.conn.release(); }
  }
}