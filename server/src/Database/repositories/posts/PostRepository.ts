import { RowDataPacket, ResultSetHeader, FieldPacket } from "mysql2";
import { PoolConnection } from "mysql2/promise";
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
            r.media_attachment,
            r.deleted,
            r.created_at ? new Date(r.created_at) : new Date(),
            Number(r.likes_count ?? 0),
            Number(r.comments_count ?? 0),
            [],         // tagIds — populated later by attachTagIds
            [],         // tags — populated later by attachTagIds
            r.author_username ?? "",
            r.community_name ?? "",
        );
    }

    private async attachTagIds(conn: PoolConnection, posts: Post[]): Promise<void> {
        if (posts.length === 0) return;
        const ids = posts.map(p => p.id);
        const placeholders = ids.map(() => '?').join(',');
        try {
            const [tagRows] = await conn.execute(
                `SELECT pt.post_id, pt.tag_id, t.name AS tag_name
                 FROM post_tags pt
                 JOIN tags t ON pt.tag_id = t.tag_id
                 WHERE pt.post_id IN (${placeholders})`,
                ids
            ) as [RowDataPacket[], FieldPacket[]];
            const idMap = new Map<number, number[]>();
            const nameMap = new Map<number, string[]>();
            for (const row of tagRows) {
                const arr = idMap.get(row.post_id) ?? [];
                arr.push(row.tag_id);
                idMap.set(row.post_id, arr);
                const names = nameMap.get(row.post_id) ?? [];
                names.push(row.tag_name);
                nameMap.set(row.post_id, names);
            }
            for (const post of posts) {
                post.tagIds = idMap.get(post.id) ?? [];
                post.tags = nameMap.get(post.id) ?? [];
            }
        } catch { /* non-critical */ }
    }

    private async writePostTags(conn: PoolConnection, postId: number, tagIds: number[]): Promise<void> {
        const unique = Array.from(new Set(tagIds.filter((id) => Number.isInteger(id) && id > 0)));
        if (unique.length === 0) return;
        const placeholders = unique.map(() => '(?, ?)').join(', ');
        const params: number[] = [];
        for (const tagId of unique) { params.push(postId, tagId); }
        try {
            await conn.execute<ResultSetHeader>(
                `INSERT IGNORE INTO post_tags (post_id, tag_id) VALUES ${placeholders}`,
                params
            );
        } catch (err) {
            this.logger.error("PostRepository", "writePostTags failed", err);
        }
    }

    private async clearPostTags(conn: PoolConnection, postId: number): Promise<void> {
        try {
            await conn.execute<ResultSetHeader>(`DELETE FROM post_tags WHERE post_id = ?`, [postId]);
        } catch (err) {
            this.logger.error("PostRepository", "clearPostTags failed", err);
        }
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
            if (post.tagIds && post.tagIds.length > 0) {
                await this.writePostTags(res.conn, result.insertId, post.tagIds);
            }
            const [infoRows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT u.username AS author_username, c.name AS community_name
                 FROM users u, communities c
                 WHERE u.user_id = ? AND c.community_id = ?`,
                [post.authorId, post.communityId]
            );
            const info = infoRows[0];
            const created = new Post(result.insertId, post.authorId, post.communityId, post.title, post.content, post.mediaAttachment);
            created.authorUsername = info?.author_username ?? "";
            created.communityName = info?.community_name ?? "";
            await this.attachTagIds(res.conn, [created]);
            return created;
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
            const countSubqueries = `
                (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.post_id) AS likes_count,
                (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.post_id AND c.deleted = 0) AS comments_count
            `;
            const [rows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT p.*, ${countSubqueries}, u.username AS author_username, c.name AS community_name
                 FROM posts p
                 LEFT JOIN users u ON p.author_id = u.user_id
                 LEFT JOIN communities c ON p.community_id = c.community_id
                 WHERE p.post_id = ? AND p.deleted = 0`,
                [postId]
            );
            if (rows.length === 0) return new Post();
            const post = this.mapPost(rows[0]);
            await this.attachTagIds(res.conn, [post]);
            return post;
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

        let orderBy: string;
        switch (filters?.sortBy) {
            case 'title':       orderBy = `p.title ${sortDir}`; break;
            case 'likesCount':  orderBy = `likes_count ${sortDir}`; break;
            case 'commentsCount': orderBy = `comments_count ${sortDir}`; break;
            default:            orderBy = `p.created_at ${sortDir}`; break;
        }

        const countSubqueries = `
            (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.post_id) AS likes_count,
            (SELECT COUNT(*) FROM comments cm WHERE cm.post_id = p.post_id AND cm.deleted = 0) AS comments_count
        `;

        try {
            type CountRow = RowDataPacket & { total: number | string };

            const whereParams: number[] = [communityId];
            let baseWhere = `p.community_id = ? AND p.deleted = 0`;
            if (filters?.authorId) { baseWhere += ` AND p.author_id = ?`; whereParams.push(filters.authorId); }

            const userCommunityJoin = `LEFT JOIN users u ON p.author_id = u.user_id LEFT JOIN communities c ON p.community_id = c.community_id`;
            const selectCols = `p.*, ${countSubqueries}, u.username AS author_username, c.name AS community_name`;

            if (filters?.tagId) {
                const countParams = [...whereParams, filters.tagId];
                const [countRows] = await res.conn.execute<RowDataPacket[]>(
                    `SELECT COUNT(DISTINCT p.post_id) as total FROM posts p JOIN post_tags pt ON p.post_id = pt.post_id WHERE ${baseWhere} AND pt.tag_id = ?`,
                    countParams
                );
                const totalAmount = Number((countRows as CountRow[])[0]?.total ?? 0);

                const dataParams = [...whereParams, filters.tagId];
                const [rows] = await res.conn.execute<RowDataPacket[]>(
                    `SELECT DISTINCT ${selectCols}
                     FROM posts p JOIN post_tags pt ON p.post_id = pt.post_id
                     ${userCommunityJoin}
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
                    `SELECT ${selectCols} FROM posts p ${userCommunityJoin} WHERE ${baseWhere} ORDER BY ${orderBy} LIMIT ${lim} OFFSET ${offset}`,
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
            OR p.community_id IN (SELECT community_id FROM communities WHERE type = 'public')
        ) AND p.deleted = 0`;
        const countSubqueries = `
            (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.post_id) AS likes_count,
            (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.post_id AND c.deleted = 0) AS comments_count
        `;
        try {
            type CountRow = RowDataPacket & { total: number | string };
            const [countRows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT COUNT(DISTINCT p.post_id) as total FROM posts p WHERE ${feedWhere}`,
                [userId, userId]
            );
            const totalAmount = Number((countRows as CountRow[])[0]?.total ?? 0);
            const [rows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT DISTINCT p.*, ${countSubqueries}, u.username AS author_username, c.name AS community_name
                 FROM posts p
                 LEFT JOIN users u ON p.author_id = u.user_id
                 LEFT JOIN communities c ON p.community_id = c.community_id
                 WHERE ${feedWhere} ORDER BY p.created_at DESC LIMIT ${lim} OFFSET ${offset}`,
                [userId, userId]
            );
            const posts = rows.map(r => this.mapPost(r));
            await this.attachTagIds(res.conn, posts);
            return { posts, totalAmount };
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
            const [countRows] = await res.conn.execute<RowDataPacket[]>(`SELECT COUNT(*) as total FROM posts WHERE author_id = ? AND deleted = 0`, [authorId]);
            const totalAmount = Number((countRows as CountRow[])[0]?.total ?? 0);
            const [rows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT p.*,
                    (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.post_id) AS likes_count,
                    (SELECT COUNT(*) FROM comments cm WHERE cm.post_id = p.post_id AND cm.deleted = 0) AS comments_count,
                    u.username AS author_username, c.name AS community_name
                 FROM posts p
                 LEFT JOIN users u ON p.author_id = u.user_id
                 LEFT JOIN communities c ON p.community_id = c.community_id
                 WHERE p.author_id = ? AND p.deleted = 0
                 ORDER BY p.created_at DESC
                 LIMIT ${lim} OFFSET ${offset}`,
                [authorId]
            );
            const posts = rows.map(r => this.mapPost(r));
            await this.attachTagIds(res.conn, posts);
            return { posts, totalAmount };
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
            const sql = `SELECT p.*,
                    (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.post_id) AS likes_count,
                    (SELECT COUNT(*) FROM comments cm WHERE cm.post_id = p.post_id AND cm.deleted = 0) AS comments_count,
                    u.username AS author_username, c.name AS community_name
                 FROM posts p
                 LEFT JOIN users u ON p.author_id = u.user_id
                 LEFT JOIN communities c ON p.community_id = c.community_id
                 WHERE p.post_id IN (${placeholders}) ORDER BY p.created_at DESC`;
            const [rows] = await resReadPosts.conn.execute<RowDataPacket[]>(sql, postIds);
            const posts = rows.map(r => this.mapPost(r));
            await this.attachTagIds(resReadPosts.conn, posts);
            return { posts, totalAmount };
        }
        catch (err) {
            this.logger.error("PostRepository", "findPostsByTagId failed at fetching posts", err);
            return { posts: [], totalAmount: 0 };
        }
        finally { resReadPosts.conn.release(); }
    }

    async findPostsByTagName(tagName: string, page: number, limit: number): Promise<{ posts: Post[], totalAmount: number }> {
        const res = await this.db.getReadConnection();
        if (!res) return { posts: [], totalAmount: 0 };
        const offset = safeInt((page - 1) * limit);
        const lim = safeInt(limit);
        try {
            type CountRow = RowDataPacket & { total: number | string };
            const [countRows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT COUNT(DISTINCT p.post_id) as total FROM posts p
                 JOIN post_tags pt ON p.post_id = pt.post_id
                 JOIN tags t ON pt.tag_id = t.tag_id
                 WHERE t.name = ?`,
                [tagName]
            );
            const totalAmount = Number((countRows as CountRow[])[0]?.total ?? 0);

            const [rows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT DISTINCT p.*,
                    (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.post_id) AS likes_count,
                    (SELECT COUNT(*) FROM comments cm WHERE cm.post_id = p.post_id AND cm.deleted = 0) AS comments_count,
                    u.username AS author_username, c.name AS community_name
                 FROM posts p
                 JOIN post_tags pt ON p.post_id = pt.post_id
                 JOIN tags t ON pt.tag_id = t.tag_id
                 LEFT JOIN users u ON p.author_id = u.user_id
                 LEFT JOIN communities c ON p.community_id = c.community_id
                 WHERE t.name = ?
                 ORDER BY p.created_at DESC
                 LIMIT ${lim} OFFSET ${offset}`,
                [tagName]
            );
            const posts = rows.map(r => this.mapPost(r));
            await this.attachTagIds(res.conn, posts);
            return { posts, totalAmount };
        }
        catch (err) {
            this.logger.error("PostRepository", "findPostsByTagName failed", err);
            return { posts: [], totalAmount: 0 };
        }
        finally { res.conn.release(); }
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
                (SELECT COUNT(*) FROM comments cm WHERE cm.post_id = p.post_id AND cm.deleted = 0) AS comments_count
            `;
            const [countRows] = await res.conn.execute<RowDataPacket[]>(`SELECT COUNT(*) as total FROM posts WHERE deleted = 0`);
            const totalAmount = Number((countRows as CountRow[])[0]?.total ?? 0);
            const [rows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT p.*, ${countSubqueries}, u.username AS author_username, c.name AS community_name
                 FROM posts p
                 LEFT JOIN users u ON p.author_id = u.user_id
                 LEFT JOIN communities c ON p.community_id = c.community_id
                 WHERE p.deleted = 0 ORDER BY p.created_at DESC LIMIT ${lim} OFFSET ${offset}`
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
            const ok = result.affectedRows > 0;
            // Tags can change without other columns changing — always reconcile when caller passes them.
            if (Array.isArray(post.tagIds)) {
                await this.clearPostTags(res.conn, postId);
                if (post.tagIds.length > 0) {
                    await this.writePostTags(res.conn, postId, post.tagIds);
                }
            }
            return ok;
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
                `UPDATE posts SET deleted = 1 WHERE post_id = ?`,
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