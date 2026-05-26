import { RowDataPacket, ResultSetHeader } from "mysql2";
import { IPostRepository } from "../../../Domain/repositories/posts/IPostRepository";
import { Post } from "../../../Domain/models/Post";
import { DbManager } from "../../connection/DbConnectionPool";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";

const safeInt = (n: number): number => Math.max(0, Math.floor(n));

export class PostRepository implements IPostRepository {
    public constructor(
        private readonly db: DbManager, 
        private readonly logger: ILoggerService
    ) {}

    private mapPost(r: RowDataPacket): Post {
        return new Post(
            r.post_id,
            r.author_id,
            r.community_id,
            r.title,
            r.content,
            r.media_attachment ?? null,
            r.deleted,
            r.created_at ? new Date(r.created_at) : new Date(),
        );
    }

    async createPost(post: Post): Promise<Post> {
        const res = await this.db.getWriteConnection();
        if (!res) return new Post();
        try {
            const [result] = await res.conn.execute<ResultSetHeader>(
                `INSERT INTO posts (author_id, community_id, title, content, media_attachment) VALUES (?, ?, ?, ?, ?)`,
                [post.authorId, post.communityId, post.title, post.content, post.mediaAttachment]
            );
            if (result.insertId === 0) return new Post();
            return new Post(result.insertId, post.authorId, post.communityId, post.title, post.content, post.mediaAttachment);
        }
        catch (err) {
            this.logger.error("PostRepository", "createPost failed", err);
            return new Post();
        }
        finally { res.conn.release(); }
    }

    async findPostById(postId: number): Promise<Post> {
        const res = await this.db.getReadConnection();
        if (!res) return new Post();
        try {
            const [rows] = await res.conn.execute<RowDataPacket[]>(`SELECT * FROM posts WHERE post_id = ?`, [postId]);
            return rows.length > 0 ? this.mapPost(rows[0]) : new Post();
        }
        catch (err) {
            this.logger.error("PostRepository", "findPostById failed", err);
            return new Post();
        }
        finally { res.conn.release(); }
    }

    async findPostsByCommunityId(communityId: number, page: number, limit: number): Promise<{ posts: Post[], totalAmount: number }> {
        const res = await this.db.getReadConnection();
        if (!res) return { posts: [], totalAmount: 0 };
        const offset = safeInt((page - 1) * limit);
        const lim = safeInt(limit);
        try {
                type CountRow = RowDataPacket & { total: number | string };
                const [countRows] = await res.conn.execute<RowDataPacket[]>(`SELECT COUNT(*) as total FROM posts WHERE community_id = ?`, [communityId]);
                const totalAmount = Number((countRows as CountRow[])[0]?.total ?? 0);
                const [rows] = await res.conn.execute<RowDataPacket[]>(`SELECT * FROM posts WHERE community_id = ? LIMIT ${lim} OFFSET ${offset}`, [communityId]);
                return { posts: rows.map(r => this.mapPost(r)), totalAmount };
        }
        catch (err) {
            this.logger.error("PostRepository", "findPostsByCommunityId failed", err);
            return { posts: [], totalAmount: 0 };
        }
        finally { res.conn.release(); }
    }

    async findPostsByAuthorId(authorId: number, page: number, limit: number): Promise<{ posts: Post[], totalAmount: number }> {
        const res = await this.db.getReadConnection();
        if (!res) return { posts: [], totalAmount: 0 };
        const offset = safeInt((page - 1) * limit);
        const lim = safeInt(limit);
        try {
            type CountRow = RowDataPacket & { total: number | string };
            const [countRows] = await res.conn.execute<RowDataPacket[]>(`SELECT COUNT(*) as total FROM posts WHERE author_id = ?`, [authorId]);
            const totalAmount = Number((countRows as CountRow[])[0]?.total ?? 0);
            const [rows] = await res.conn.execute<RowDataPacket[]>(`SELECT * FROM posts WHERE author_id = ? LIMIT ${lim} OFFSET ${offset}`, [authorId]);
            return { posts: rows.map(r => this.mapPost(r)), totalAmount };
        }
        catch (err) {
            this.logger.error("PostRepository", "findPostsByAuthorId failed", err);
            return { posts: [], totalAmount: 0 };
        }
        finally { res.conn.release(); }
    }

    async findPostsByTagId(tagId: number, page: number, limit: number): Promise<{ posts: Post[], totalAmount: number }> {
        const resReadTags = await this.db.getReadConnection();
        if (!resReadTags) return { posts: [], totalAmount: 0 };
        let postIds: number[] = [];
        const offset = safeInt((page - 1) * limit);
        const lim = safeInt(limit);
        try {
            const [rows] = await resReadTags.conn.execute<RowDataPacket[]>(`SELECT post_id FROM post_tags WHERE tag_id = ? LIMIT ${lim} OFFSET ${offset}`, [tagId]);
            postIds = rows.map(r => r.post_id);
            if (postIds.length === 0) return { posts: [], totalAmount: 0 };
        }
        catch (err) {
            this.logger.error("PostRepository", "findPostsByTagId failed at fetching post ids", err);
            return { posts: [], totalAmount: 0 };
        }
        finally { resReadTags.conn.release(); }

        const resReadPosts = await this.db.getReadConnection();
        if (!resReadPosts) return { posts: [], totalAmount: 0 };
        try {
            type CountRow = RowDataPacket & { total: number | string };
            const [countRows] = await resReadPosts.conn.execute<RowDataPacket[]>(`SELECT COUNT(*) as total FROM post_tags WHERE tag_id = ?`, [tagId]);
            const totalAmount = Number((countRows as CountRow[])[0]?.total ?? 0);
            const placeholders = postIds.map(() => '?').join(',');
            const sql = `SELECT * FROM posts WHERE post_id IN (${placeholders}) ORDER BY created_at DESC`;
            const [rows] = await resReadPosts.conn.execute<RowDataPacket[]>(sql, postIds);
            return { 
                posts: rows.map(r => this.mapPost(r)),
                totalAmount
            };
        }
        catch (err) {
            this.logger.error("PostRepository", "findPostsByTagId failed at fetching posts", err);
            return { posts: [], totalAmount: 0 };
        }
        finally { resReadPosts.conn.release(); }
    }

    async findPostsByTagName(tagName: string, page: number, limit: number): Promise<{ posts: Post[], totalAmount: number }> {
        const resReadTags = await this.db.getReadConnection();
        if (!resReadTags) return { posts: [], totalAmount: 0 };
        let postIds: number[] = [];
        const offset = safeInt((page - 1) * limit);
        const lim = safeInt(limit);
        try {
            const [rows] = await resReadTags.conn.execute<RowDataPacket[]>(`SELECT post_id FROM post_tags WHERE tag_name = ? LIMIT ${lim} OFFSET ${offset}`, [tagName]);
            postIds = rows.map(r => r.post_id);
            if (postIds.length === 0) return { posts: [], totalAmount: 0 };
        }
        catch (err) {
            this.logger.error("PostRepository", "findPostsByTagName failed at fetching post ids", err);
            return { posts: [], totalAmount: 0 };
        }
        finally { resReadTags.conn.release(); }

        const resReadPosts = await this.db.getReadConnection();
        if (!resReadPosts) return { posts: [], totalAmount: 0 };
        try {
            type CountRow = RowDataPacket & { total: number | string };
            const [countRows] = await resReadPosts.conn.execute<RowDataPacket[]>(`SELECT COUNT(*) as total FROM post_tags WHERE tag_name = ?`, [tagName]);
            const totalAmount = Number((countRows as CountRow[])[0]?.total ?? 0);
            const placeholders = postIds.map(() => '?').join(',');
            const sql = `SELECT * FROM posts WHERE post_id IN (${placeholders}) ORDER BY created_at DESC`;
            const [rows] = await resReadPosts.conn.execute<RowDataPacket[]>(sql, postIds);
            return { 
                posts: rows.map(r => this.mapPost(r)),
                totalAmount
            };
        }
        catch (err) {
            this.logger.error("PostRepository", "findPostsByTagName failed at fetching posts", err);
            return { posts: [], totalAmount: 0 };
        }
        finally { resReadPosts.conn.release(); }
    }

    async updatePost(postId: number, post: Post): Promise<boolean> {
        const res = await this.db.getWriteConnection();
        if (!res) return false;
        try {
            const [result] = await res.conn.execute<ResultSetHeader>(
                `UPDATE posts SET title = ?, content = ?, media_attachment = ? WHERE post_id = ?`,
                [post.title, post.content, post.mediaAttachment, postId]
            );
            return result.affectedRows > 0;
        }
        catch (err) {
            this.logger.error("PostRepository", "updatePost failed", err);
            return false;
        }
        finally { res.conn.release(); }
    }

    async deletePost(postId: number): Promise<boolean> {
        const res = await this.db.getWriteConnection();
        if (!res) return false;
        try {
            const [result] = await res.conn.execute<ResultSetHeader>(
                `DELETE FROM posts WHERE post_id = ?`,
                [postId]
            );
            return result.affectedRows > 0;
        }
        catch (err) {
            this.logger.error("PostRepository", "deletePost failed", err);
            return false;
        }
        finally { res.conn.release(); }
    }
}