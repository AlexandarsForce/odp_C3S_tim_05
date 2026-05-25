import { RowDataPacket, ResultSetHeader } from "mysql2";
import { IUserFollowerRepository } from "../../../Domain/repositories/users/IUserFollowerRepository";
import { UserFollower } from "../../../Domain/models/UserFollower";
import { DbManager } from "../../connection/DbConnectionPool";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";

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
                `INSERT INTO user_followers (user_id, follower_id, created_at) VALUES (?, ?, ?)`,
                [userId, followerId, new Date()]
            );
            return result.affectedRows > 0;
        } catch (err) {
            this.logger.error("UserFollowerRepository", "addFollower failed", err);
            return false;
        } finally { res.conn.release(); }
    }

    async findAllFollowers(userId: number): Promise<{ followers: UserFollower[], totalAmount: number }> {
        const res = await this.db.getReadConnection();
        if (!res) return { followers: [], totalAmount: 0 };
        try {
            const [rows] = await res.conn.execute<RowDataPacket[]>(`SELECT * FROM user_followers WHERE user_id = ?`, [userId]);
            const followers = rows.map(r => new UserFollower(r.user_id, r.follower_id));
            return { followers, totalAmount: followers.length };
        } catch (err) {
            this.logger.error("UserFollowerRepository", "findAllFollowers failed", err);
            return { followers: [], totalAmount: 0 };
        } finally { res.conn.release(); }
    }

    async findAllFollowing(userId: number): Promise<{ following: UserFollower[], totalAmount: number }> {
        const res = await this.db.getReadConnection();
        if (!res) return { following: [], totalAmount: 0 };
        try {
            const [rows] = await res.conn.execute<RowDataPacket[]>(`SELECT * FROM user_followers WHERE follower_id = ?`, [userId]);
            const following = rows.map(r => new UserFollower(r.user_id, r.follower_id));
            return { following, totalAmount: following.length };
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
                `DELETE FROM user_followers WHERE user_id = ? AND follower_id = ?`,
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
                `DELETE FROM user_followers WHERE follower_id = ? AND user_id = ?`,
                [userId, followingId]
            );
            return result.affectedRows > 0;
        } catch (err) {
            this.logger.error("UserFollowerRepository", "deleteFollowing failed", err);
            return false;
        } finally { res.conn.release(); }
    }
}