import { RowDataPacket, ResultSetHeader } from "mysql2";
import { IPostRepository, PostFilters } from "../../../Domain/repositories/posts/IPostRepository";
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
            Number(r.likes_count ?? 0),
            Number(r.comments_count ?? 0),
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async attachTagIds(conn: any, posts: Post[]): Promise<void> {
        if (posts.length === 0) return;
        const ids = posts.map(p => p.id);
        const placeholders = ids.map(() => '?').join(',');
        try {
            const [tagRows] = await conn.execute(
                `SELECT post_id, tag_id FROM post_tags WHERE post_id IN (${placeholders})`,
                ids
            ) as [RowDataPacket[], unknown];
            const map = new Map<number, number[]>();
            for (const row of tagRows) {
                const arr = map.get(row.post_id) ?? [];
                arr.push(row.tag_id);
                map.set(row.post_id, arr);
            }
            for (const post of posts) {
                post.tagIds = map.get(post.id) ?? [];
            }
        } catch { /* non-critical */ }
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

    async findPostsByCommunityId(communityId: number, page: number, limit: number, filters?: PostFilters): Promise<{ posts: Post[], totalAmount: number }> {
        const res = await this.db.getReadConnection();
        if (!res) return { posts: [], totalAmount: 0 };
        const offset = safeInt((page - 1) * limit);
        const lim = safeInt(limit);
        const sortDir = filters?.sortOrder === 'asc' ? 'ASC' : 'DESC';

        // Build ORDER BY clause
        let orderBy: string;
        switch (filters?.sortBy) {
            case 'title':       orderBy = `p.title ${sortDir}`; break;
            case 'likesCount':  orderBy = `likes_count ${sortDir}`; break;
            case 'commentsCount': orderBy = `comments_count ${sortDir}`; break;
            default:            orderBy = `p.created_at ${sortDir}`; break;
        }

        // Common subqueries for counts (always included so mapPost can read them)
        const countSubqueries = `
            (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.post_id) AS likes_count,
            (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.post_id) AS comments_count
        `;

        try {
            type CountRow = RowDataPacket & { total: number | string };

            // Where clause
            const whereParams: number[] = [communityId];
            let baseWhere = `p.community_id = ?`;
            if (filters?.authorId) { baseWhere += ` AND p.author_id = ?`; whereParams.push(filters.authorId); }

            if (filters?.tagId) {
                const countParams = [...whereParams, filters.tagId];
                const [countRows] = await res.conn.execute<RowDataPacket[]>(
                    `SELECT COUNT(DISTINCT p.post_id) as total FROM posts p JOIN post_tags pt ON p.post_id = pt.post_id WHERE ${baseWhere} AND pt.tag_id = ?`,
                    countParams
                );
                const totalAmount = Number((countRows as CountRow[])[0]?.total ?? 0);

                const dataParams = [...whereParams, filters.tagId];
                const [rows] = await res.conn.execute<RowDataPacket[]>(
                    `SELECT DISTINCT p.*, ${countSubqueries}
                     FROM posts p JOIN post_tags pt ON p.post_id = pt.post_id
                     WHERE ${baseWhere} AND pt.tag_id = ?
                     ORDER BY ${orderBy} LIMIT ${lim} OFFSET ${offset}`,
                    dataParams
                );
                const posts = rows.map(r => this.mapPost(r));
                await this.attachTagIds(res.conn, posts);
                return { posts, totalAmount };
            } else {
                const [countRows] = await res.conn.execute<RowDataPacket[]>(
                    `SELECT COUNT(*) as total FROM posts p WHERE ${baseWhere}`,
                    whereParams
                );
                const totalAmount = Number((countRows as CountRow[])[0]?.total ?? 0);

                const [rows] = await res.conn.execute<RowDataPacket[]>(
                    `SELECT p.*, ${countSubqueries} FROM posts p WHERE ${baseWhere} ORDER BY ${orderBy} LIMIT ${lim} OFFSET ${offset}`,
                    whereParams
                );
                const posts = rows.map(r => this.mapPost(r));
                await this.attachTagIds(res.conn, posts);
                return { posts, totalAmount };
            }
        }
        catch (err) {
            this.logger.error("PostRepository", "findPostsByCommunityId failed", err);
            return { posts: [], totalAmount: 0 };
        }
        finally { res.conn.release(); }
    }

    async findFeedPosts(userId: number, page: number, limit: number): Promise<{ posts: Post[], totalAmount: number }> {
        const res = await this.db.getReadConnection();
        if (!res) return { posts: [], totalAmount: 0 };
        const offset = safeInt((page - 1) * limit);
        const lim = safeInt(limit);
        const feedWhere = `(
            p.community_id IN (SELECT community_id FROM community_members WHERE user_id = ? AND status = 'active')
            OR p.author_id IN (SELECT following_id FROM user_follows WHERE follower_id = ?)
        )`;
        try {
            type CountRow = RowDataPacket & { total: number | string };
            const [countRows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT COUNT(DISTINCT p.post_id) as total FROM posts p WHERE ${feedWhere}`,
                [userId, userId]
            );
            const totalAmount = Number((countRows as CountRow[])[0]?.total ?? 0);
            const [rows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT DISTINCT p.* FROM posts p WHERE ${feedWhere} ORDER BY p.created_at DESC LIMIT ${lim} OFFSET ${offset}`,
                [userId, userId]
            );
            return { posts: rows.map(r => this.mapPost(r)), totalAmount };
        }
        catch (err) {
            this.logger.error("PostRepository", "findFeedPosts failed", err);
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

    async findAllPosts(page: number, limit: number): Promise<{ posts: Post[], totalAmount: number }> {
        const res = await this.db.getReadConnection();
        if (!res) return { posts: [], totalAmount: 0 };
        const offset = safeInt((page - 1) * limit);
        const lim = safeInt(limit);
        try {
            type CountRow = RowDataPacket & { total: number | string };
            const countSubqueries = `
                (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.post_id) AS likes_count,
                (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.post_id) AS comments_count
            `;
            const [countRows] = await res.conn.execute<RowDataPacket[]>(`SELECT COUNT(*) as total FROM posts`);
            const totalAmount = Number((countRows as CountRow[])[0]?.total ?? 0);
            const [rows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT p.*, ${countSubqueries} FROM posts p ORDER BY p.created_at DESC LIMIT ${lim} OFFSET ${offset}`
            );
            const posts = rows.map(r => this.mapPost(r));
            await this.attachTagIds(res.conn, posts);
            return { posts, totalAmount };
        } catch (err) {
            this.logger.error("PostRepository", "findAllPosts failed", err);
            return { posts: [], totalAmount: 0 };
        } finally { res.conn.release(); }
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