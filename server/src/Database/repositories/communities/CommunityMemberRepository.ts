import { RowDataPacket, ResultSetHeader } from "mysql2";
import { ICommunityMemberRepository } from "../../../Domain/repositories/communities/ICommunityMemberRepository";
import { CommunityMember } from "../../../Domain/models/CommunityMember";
import { CommunityMemberRole } from "../../../Domain/enums/CommunityMemberRole";
import { CommunityMemberStatus } from "../../../Domain/enums/CommunityMemberStatus";
import { DbManager } from "../../connection/DbConnectionPool";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";

const safeInt = (n: number): number => Math.max(0, Math.floor(n));

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
                `INSERT INTO community_members (user_id, community_id, role, status, joined_at) VALUES (?, ?, ?, ?, ?)`,
                [findUserId, communityId, member.role, member.status, member.joinedAt]
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

    async findCommunityMemberByRole(communityId: number, role: CommunityMemberRole, page: number, limit: number): Promise<{ members: CommunityMember[], totalAmount: number }> {
        const res = await this.db.getReadConnection();
        if (!res) return { members: [], totalAmount: 0 };
        const offset = safeInt((page - 1) * limit);
        const lim = safeInt(limit);
        try {
                type CountRow = RowDataPacket & { total: number | string };
                const [countRows] = await res.conn.execute<RowDataPacket[]>(`SELECT COUNT(*) as total FROM community_members WHERE community_id = ? AND role = ?`, [communityId, role]);
                const totalAmount = Number((countRows as CountRow[])[0]?.total ?? 0);
                const [rows] = await res.conn.execute<RowDataPacket[]>(`SELECT * FROM community_members WHERE community_id = ? AND role = ? LIMIT ${lim} OFFSET ${offset}`, [communityId, role]);
                return {
                    members: rows.map((row) => this.mapCommunityMember(row)),
                    totalAmount
                };
        }
        catch (err) {
            this.logger.error("CommunityMemberRepository", "findCommunityMemberByRole failed", err);
            return { members: [], totalAmount: 0 };
        }
        finally { res.conn.release(); }
    }

    async findCommunityMemberByStatus(communityId: number, status: CommunityMemberStatus, page: number, limit: number): Promise<{ members: CommunityMember[], totalAmount: number }> {
        const res = await this.db.getReadConnection();
        if (!res) return { members: [], totalAmount: 0 };
        const offset = safeInt((page - 1) * limit);
        const lim = safeInt(limit);
        try {
            type CountRow = RowDataPacket & { total: number | string };
            const [countRows] = await res.conn.execute<RowDataPacket[]>(`SELECT COUNT(*) as total FROM community_members WHERE community_id = ? AND status = ?`, [communityId, status]);
            const totalAmount = Number((countRows as CountRow[])[0]?.total ?? 0);
            const [rows] = await res.conn.execute<RowDataPacket[]>(`SELECT * FROM community_members WHERE community_id = ? AND status = ? LIMIT ${lim} OFFSET ${offset}`, [communityId, status]);
            return {
                members: rows.map((row) => this.mapCommunityMember(row)),
                totalAmount
            };
        }
        catch (err) {
            this.logger.error("CommunityMemberRepository", "findCommunityMemberByStatus failed", err);
            return { members: [], totalAmount: 0 };
        }
        finally { res.conn.release(); }
    }

    async findAllCommunityMembers(communityId: number, page: number, limit: number): Promise<{ members: CommunityMember[], totalAmount: number }> {
        const res = await this.db.getReadConnection();
        if (!res) return { members: [], totalAmount: 0 };
        const offset = safeInt((page - 1) * limit);
        const lim = safeInt(limit);
        try {
            type CountRow = RowDataPacket & { total: number | string };
            const [countRows] = await res.conn.execute<RowDataPacket[]>(`SELECT COUNT(*) as total FROM community_members WHERE community_id = ?`, [communityId]);
            const totalAmount = Number((countRows as CountRow[])[0]?.total ?? 0);
            const [rows] = await res.conn.execute<RowDataPacket[]>(`SELECT * FROM community_members WHERE community_id = ? LIMIT ${lim} OFFSET ${offset}`, [communityId]);
            return {
                members: rows.map((row) => this.mapCommunityMember(row)),
                totalAmount
            };
        }
        catch (err) {
        this.logger.error("CommunityMemberRepository", "findAllCommunityMembers failed", err);
        return { members: [], totalAmount: 0 };
        }
        finally { res.conn.release(); }
    }

    async updateCommunityMember(communityId: number, member: CommunityMember): Promise<boolean> {
        const res = await this.db.getWriteConnection();
        if (!res) return false;
        try {
            const [result] = await res.conn.execute<ResultSetHeader>(
                `UPDATE community_members SET role = ?, status = ?, joined_at = ? WHERE community_id = ? AND user_id = ?`,
                [member.role, member.status, member.joinedAt, communityId, member.userId]
            );
            return result.affectedRows > 0;
        }
        catch (err) {
            this.logger.error("CommunityMemberRepository", "updateCommunityMember failed", err);
            return false;
        }
        finally { res.conn.release(); }
    }

    async updateMemberStatus(communityId: number, memberId: number, status: CommunityMemberStatus): Promise<boolean> {
        const res = await this.db.getWriteConnection();
        if (!res) return false;
        try {
            const [result] = await res.conn.execute<ResultSetHeader>(
                `UPDATE community_members SET status = ? WHERE community_id = ? AND user_id = ?`,
                [status, communityId, memberId]
            );
            return result.affectedRows > 0;
        }
        catch (err) {
            this.logger.error("CommunityMemberRepository", "updateMemberStatus failed", err);
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
            this.logger.error("CommunityMemberRepository", "removeCommunityMember failed", err);
            return false;
        }
        finally { res.conn.release(); }
    }
}