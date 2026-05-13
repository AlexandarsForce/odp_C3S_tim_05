import { RowDataPacket, ResultSetHeader } from "mysql2";
import { ICommunityMemberRepository } from "../../../Domain/repositories/communities/ICommunityMemberRepository";
import { CommunityMember } from "../../../Domain/models/CommunityMember";
import { CommunityMemberRole } from "../../../Domain/enums/CommunityMemberRole";
import { CommunityMemberStatus } from "../../../Domain/enums/CommunityMemberStatus";
import { DbManager } from "../../connection/DbConnectionPool";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";

export class CommunityMemberRepository implements ICommunityMemberRepository {
    public constructor(
        private readonly db: DbManager,
         private readonly logger: ILoggerService
    ) {}

    private mapCommunityMember(r: RowDataPacket): CommunityMember {
        return new CommunityMember(
            r.user_id,
            r.community_id,
            r.role as CommunityMemberRole,
            r.status as CommunityMemberStatus,
            r.joined_at ? new Date(r.joined_at) : new Date(),
        );
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
            this.logger.error("CommunityMemberRepository", "addCommunityMember failed user id doesnt exist", err);
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
            this.logger.error("CommunityMemberRepository", "addCommunityMember failed", err);
            return false;
        }
        finally { resWrite.conn.release(); }
    }

    async findCommunityMemberById(communityId: number, memberId: number): Promise<CommunityMember> {
        const res = await this.db.getReadConnection();
        if (!res) return new CommunityMember();
        try {
            const [rows] = await res.conn.execute<RowDataPacket[]>(`SELECT * FROM community_members WHERE community_id = ? AND user_id = ?`, [communityId, memberId]);
            return rows.length > 0 ? this.mapCommunityMember(rows[0]) : new CommunityMember();
        }
        catch (err) {
            this.logger.error("CommunityMemberRepository", "findCommunityMemberById failed", err);
            return new CommunityMember();
        }
        finally { res.conn.release(); }
    }

    async findCommunityMemberByRole(communityId: number, role: CommunityMemberRole): Promise<{ members: CommunityMember[], totalAmount: number }> {
        const res = await this.db.getReadConnection();
        if (!res) return { members: [], totalAmount: 0 };
        try {
            const [rows] = await res.conn.execute<RowDataPacket[]>(`SELECT * FROM community_members WHERE community_id = ? AND role = ?`, [communityId, role]);
            return {
                members: rows.map((row) => this.mapCommunityMember(row)),
                totalAmount: rows.length
            };
        }
        catch (err) {
            this.logger.error("CommunityMemberRepository", "findCommunityMemberByRole failed", err);
            return { members: [], totalAmount: 0 };
        }
        finally { res.conn.release(); }
    }

    async findCommunityMemberByStatus(communityId: number, status: CommunityMemberStatus): Promise<{ members: CommunityMember[], totalAmount: number }> {
        const res = await this.db.getReadConnection();
        if (!res) return { members: [], totalAmount: 0 };
        try {
            const [rows] = await res.conn.execute<RowDataPacket[]>(`SELECT * FROM community_members WHERE community_id = ? AND status = ?`, [communityId, status]);
            return {
                members: rows.map((row) => this.mapCommunityMember(row)),
                totalAmount: rows.length
            };
        }
        catch (err) {
            this.logger.error("CommunityMemberRepository", "findCommunityMemberByStatus failed", err);
            return { members: [], totalAmount: 0 };
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
        this.logger.error("CommunityMemberRepository", "findAllCommunityMembers failed", err);
        return { members: [], totalAmount: 0 };
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
            this.logger.error("CommunityMemberRepository", "removeCommunityMember failed", err);
            return false;
        }
        finally { res.conn.release(); }
    }
}