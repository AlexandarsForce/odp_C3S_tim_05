import { RowDataPacket, ResultSetHeader } from "mysql2";
import { IUserFollowerRepository } from "../../../Domain/repositories/users/IUserFollowerRepository";
import { UserFollower } from "../../../Domain/models/UserFollower";
import { DbManager } from "../../connection/DbConnectionPool";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";

const safeInt = (n: number): number => Math.max(0, Math.floor(n));

export class UserFollowerRepository implements IUserFollowerRepository {
    public constructor(
        private readonly db: DbManager,
        private readonly logger: ILoggerService,
    ) {}

    async addFollower(userId: number, followerId: number): Promise<boolean> {
        const res = await this.db.getWriteConnection();
        if (!res) return false;
        try {
            const [result] = await res.conn.execute<ResultSetHeader>(
                `INSERT INTO user_follows (follower_id, following_id, followed_at) VALUES (?, ?, ?)`,
                [followerId, userId, new Date()]
            );
            return result.affectedRows > 0;
        } catch (err) {
            this.logger.error("UserFollowerRepository", "addFollower failed", err);
            return false;
        } finally { res.conn.release(); }
    }

    async isFollowing(userId: number, followerId: number): Promise<boolean> {
        const res = await this.db.getReadConnection();
        if (!res) return false;
        try {
            type CountRow = RowDataPacket & { total: number | string };
            const [rows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT COUNT(*) as total FROM user_follows WHERE following_id = ? AND follower_id = ?`,
                [userId, followerId]
            );
            return Number((rows as CountRow[])[0]?.total ?? 0) > 0;
        } catch (err) {
            this.logger.error("UserFollowerRepository", "isFollowing failed", err);
            return false;
        } finally { res.conn.release(); }
    }

    async findAllFollowers(userId: number, page: number, limit: number): Promise<{ followers: UserFollower[], totalAmount: number }> {
        const res = await this.db.getReadConnection();
        if (!res) return { followers: [], totalAmount: 0 };
        const offset = safeInt((page - 1) * limit);
        const lim = safeInt(limit);
        try {
            type CountRow = RowDataPacket & { total: number | string };
            const [countRows] = await res.conn.execute<RowDataPacket[]>(`SELECT COUNT(*) as total FROM user_follows WHERE following_id = ?`, [userId]);
            const totalAmount = Number((countRows as CountRow[])[0]?.total ?? 0);
            const [rows] = await res.conn.execute<RowDataPacket[]>(`SELECT * FROM user_follows WHERE following_id = ? LIMIT ${lim} OFFSET ${offset}`, [userId]);
            const followers = rows.map(r => new UserFollower(r.following_id, r.follower_id));
            return { followers, totalAmount };
        } catch (err) {
            this.logger.error("UserFollowerRepository", "findAllFollowers failed", err);
            return { followers: [], totalAmount: 0 };
        } finally { res.conn.release(); }
    }

    async findAllFollowing(userId: number, page: number, limit: number): Promise<{ following: UserFollower[], totalAmount: number }> {
        const res = await this.db.getReadConnection();
        if (!res) return { following: [], totalAmount: 0 };
        const offset = safeInt((page - 1) * limit);
        const lim = safeInt(limit);
        try {
            type CountRow = RowDataPacket & { total: number | string };
            const [countRows] = await res.conn.execute<RowDataPacket[]>(`SELECT COUNT(*) as total FROM user_follows WHERE follower_id = ?`, [userId]);
            const totalAmount = Number((countRows as CountRow[])[0]?.total ?? 0);
            const [rows] = await res.conn.execute<RowDataPacket[]>(`SELECT * FROM user_follows WHERE follower_id = ? LIMIT ${lim} OFFSET ${offset}`, [userId]);
            const following = rows.map(r => new UserFollower(r.following_id, r.follower_id));
            return { following, totalAmount };
        } catch (err) {
            this.logger.error("UserFollowerRepository", "findAllFollowing failed", err);
            return { following: [], totalAmount: 0 };
        } finally { res.conn.release(); }
    }

    async deleteFollower(userId: number, followerId: number): Promise<boolean> {
        const res = await this.db.getWriteConnection();
        if (!res) return false;
        try {
            const [result] = await res.conn.execute<ResultSetHeader>(
                `DELETE FROM user_follows WHERE following_id = ? AND follower_id = ?`,
                [userId, followerId]
            );
            return result.affectedRows > 0;
        } catch (err) {
            this.logger.error("UserFollowerRepository", "deleteFollower failed", err);
            return false;
        } finally { res.conn.release(); }
    }

    async deleteFollowing(userId: number, followingId: number): Promise<boolean> {
        const res = await this.db.getWriteConnection();
        if (!res) return false;
        try {
            const [result] = await res.conn.execute<ResultSetHeader>(
                `DELETE FROM user_follows WHERE follower_id = ? AND following_id = ?`,
                [userId, followingId]
            );
            return result.affectedRows > 0;
        } catch (err) {
            this.logger.error("UserFollowerRepository", "deleteFollowing failed", err);
            return false;
        } finally { res.conn.release(); }
    }
}