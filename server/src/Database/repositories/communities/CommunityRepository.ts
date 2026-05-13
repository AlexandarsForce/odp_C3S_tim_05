import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { ICommunityRepository } from "../../../Domain/repositories/communities/ICommunityRepository";
import { Community } from "../../../Domain/models/Community";
import { CommunityMember } from '../../../Domain/models/CommunityMember';
import { CommunityType } from '../../../Domain/enums/CommunityType';
import { CommunityMemberRole } from '../../../Domain/enums/CommunityMemberRole';
import { CommunityMemberStatus } from '../../../Domain/enums/CommunityMemberStatus';
import { DbManager } from "../../connection/DbConnectionPool";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";

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

  private mapCommunityMember(r: RowDataPacket): CommunityMember {
    return new CommunityMember(
      r.user_id,
      r.community_id,
      r.role as CommunityMemberRole,
      r.status as CommunityMemberStatus,
      r.joined_at ? new Date(r.joined_at) : new Date(),
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

  async addCommunityMember(communityId: number, member: CommunityMember): Promise<boolean> {
    const resRead = await this.db.getReadConnection();
    if (!resRead) return false;
    
    let findUserId : number;
    try {
        const [rows] = await resRead.conn.execute<RowDataPacket[]>(`SELECT user_id FROM users WHERE user_id = ?`, [member.userId]);
        if (rows.length === 0) return false;
        findUserId = rows[0].user_id;
    } catch (err) {
        this.logger.error("CommunityRepository", "addCommunityMember failed user id doesnt exist", err);
        return false;
    }
    finally { resRead.conn.release(); }

    const resWrite = await this.db.getWriteConnection();
    if (!resWrite) return false;

    try {
        const [result] = await resWrite.conn.execute<ResultSetHeader>(
            `INSERT INTO community_members (user_id, community_id, role, status) VALUES (?, ?, ?, ?)`,
            [findUserId, communityId, member.role, member.status]
        );
        return true;
    }
    catch (err) {
        this.logger.error("CommunityRepository", "addCommunityMember failed", err);
        return false;
    }
    finally { resWrite.conn.release(); }
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

  async findCommunityByType(type: CommunityType): Promise<{ communities: Community[], totalAmount: number }> {
    const res = await this.db.getReadConnection();
    if (!res) return { communities: [], totalAmount: 0 };
    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(`SELECT * FROM communities WHERE type = ? ORDER BY name ASC`, [type]);
      return {
        communities: rows.map((row) => this.mapCommunity(row)),
        totalAmount: rows.length
      };
    }
    catch (err) {
      this.logger.error("CommunityRepository", "findCommunityByType failed", err);
      return { communities: [], totalAmount: 0 };
    }
    finally { res.conn.release(); }
  }

  async findCommunityByOwnerId(ownerId: number): Promise<{ communities: Community[], totalAmount: number }> {
    const res = await this.db.getReadConnection();
    if (!res) return { communities: [], totalAmount: 0 };
    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(`SELECT * FROM communities WHERE owner_id = ? ORDER BY name ASC`, [ownerId]);
      return {
        communities: rows.map((row) => this.mapCommunity(row)),
        totalAmount: rows.length
      };
    }
    catch (err) {
      this.logger.error("CommunityRepository", "findCommunityByOwnerId failed", err);
      return { communities: [], totalAmount: 0 };
    }
    finally { res.conn.release(); }
  }

  async findCommunityByMemberId(memberId: number): Promise<{ communities: Community[], totalAmount: number }> {
    const resReadMembers = await this.db.getReadConnection();
    if (!resReadMembers) return { communities: [], totalAmount: 0 };
    let communityIds: number[] = [];
    try {
      const [rows] = await resReadMembers.conn.execute<RowDataPacket[]>(`SELECT community_id FROM community_members WHERE user_id = ?`, [memberId]);
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
      const [rows] = await resReadCommunities.conn.execute<RowDataPacket[]>(`SELECT * FROM communities WHERE community_id IN (?) ORDER BY name ASC`, [communityIds]);
      return {
        communities: rows.map((row) => this.mapCommunity(row)),
        totalAmount: rows.length
      };
    }
    catch (err) {
      this.logger.error("CommunityRepository", "findCommunityByMemberId failed fetching communities", err);
      return { communities: [], totalAmount: 0 };
    }
    finally { resReadCommunities.conn.release(); }
  }

  async findCommunityMemberById(communityId: number, memberId: number): Promise<CommunityMember> {
    const res = await this.db.getReadConnection();
    if (!res) return new CommunityMember();
    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(`SELECT * FROM community_members WHERE community_id = ? AND user_id = ?`, [communityId, memberId]);
      return rows.length > 0 ? this.mapCommunityMember(rows[0]) : new CommunityMember();
    }
    catch (err) {
      this.logger.error("CommunityRepository", "findCommunityMemberById failed", err);
      return new CommunityMember();
    }
    finally { res.conn.release(); }
  }

  async findAllCommunityMembers(communityId: number): Promise<{ members: CommunityMember[], totalAmount: number }> {
    const res = await this.db.getReadConnection();
    if (!res) return { members: [], totalAmount: 0 };
    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(`SELECT * FROM community_members WHERE community_id = ?`, [communityId]);
      return {
        members: rows.map((row) => this.mapCommunityMember(row)),
        totalAmount: rows.length
      };
    }
    catch (err) {
      this.logger.error("CommunityRepository", "findAllCommunityMembers failed", err);
      return { members: [], totalAmount: 0 };
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

  async removeCommunityMember(communityId: number, memberId: number): Promise<boolean> {
    const res = await this.db.getWriteConnection();
    if (!res) return false;
    try {
        const [result] = await res.conn.execute<ResultSetHeader>(`DELETE FROM community_members WHERE community_id = ? AND user_id = ?`, [communityId, memberId]);
        return result.affectedRows > 0;
    }
    catch (err) {
        this.logger.error("CommunityRepository", "removeCommunityMember failed", err);
        return false;
    }
    finally { res.conn.release(); }
  }
}