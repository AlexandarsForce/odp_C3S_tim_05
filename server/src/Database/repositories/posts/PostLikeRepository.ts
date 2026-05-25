import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { IPostLikeRepository } from "../../../Domain/repositories/posts/IPostLikeRepository";
import { PostLike } from "../../../Domain/models/PostLike";
import { DbManager } from "../../connection/DbConnectionPool";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";

const safeInt = (n: number): number => Math.max(0, Math.floor(n));

export class PostLikeRepository implements IPostLikeRepository {
  public constructor(
    private readonly db: DbManager,
    private readonly logger: ILoggerService,
  ) {}

private mapPostLike(r: RowDataPacket): PostLike {
    return new PostLike(
      r.user_id,
      r.post_id,
      Number(r.liked),
      r.liked_at ? new Date(r.liked_at) : new Date(),
    );
  }

  async addPostLike(postId: number, like: PostLike): Promise<PostLike> {
    const res = await this.db.getWriteConnection();
    if (!res) return new PostLike(0, 0, 0, new Date());

    try {
      const [result] = await res.conn.execute<ResultSetHeader>(
        `INSERT INTO post_likes (user_id, post_id, liked, liked_at)
         VALUES (?, ?, ?, ?)`,
        [
          like.userId,
          postId,
          like.liked,
          like.likedAt
        ]
      );

      if (result.affectedRows === 0) return new PostLike(0, 0, 0, new Date());

      return like;
    }
    catch (err) {
      this.logger.error("PostLikeRepository", "addPostLike failed", err);
      return new PostLike(0, 0, 0, new Date());
    }
    finally {
      res.conn.release();
    }
  }

  async findPostLikesByPostId(postId: number, page: number, limit: number): Promise<{ likes: PostLike[], totalAmount: number }> {
    const res = await this.db.getReadConnection();
    if (!res) return { likes: [], totalAmount: 0 };

    const offset = safeInt((page - 1) * limit);
    const lim = safeInt(limit);

    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT *
         FROM post_likes
         WHERE post_id = ?
         ORDER BY liked_at DESC
         LIMIT ? OFFSET ?`,
        [postId, lim, offset]
      );

      return {
        likes: rows.map((row) => this.mapPostLike(row)),
        totalAmount: rows.length
      };
    }
    catch (err) {
      this.logger.error("PostLikeRepository", "findPostLikesByPostId failed", err);

      return {
        likes: [],
        totalAmount: 0
      };
    }
    finally {
      res.conn.release();
    }
  }

  async isLikedByUser(postId: number, userId: number): Promise<boolean> {
    const res = await this.db.getReadConnection();
    if (!res) return false;

    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT *
         FROM post_likes
         WHERE post_id = ?
         AND user_id = ?`,
        [postId, userId]
      );

      return rows.length > 0;
    }
    catch (err) {
      this.logger.error("PostLikeRepository", "isLikedByUser failed", err);
      return false;
    }
    finally {
      res.conn.release();
    }
  }

  async updatePostLike(postId: number, like: PostLike): Promise<boolean> {
    const res = await this.db.getWriteConnection();
    if (!res) return false;

    try {
      const [result] = await res.conn.execute<ResultSetHeader>(
        `UPDATE post_likes
         SET liked = ?
         WHERE post_id = ?
         AND user_id = ?`,
        [
          like.liked,
          postId,
          like.userId
        ]
      );

      return result.affectedRows > 0;
    }
    catch (err) {
      this.logger.error("PostLikeRepository", "updatePostLike failed", err);
      return false;
    }
    finally {
      res.conn.release();
    }
  }

  async deletePostLike(postId: number, userId: number): Promise<boolean> {
    const res = await this.db.getWriteConnection();
    if (!res) return false;

    try {
      const [result] = await res.conn.execute<ResultSetHeader>(
        `DELETE FROM post_likes
         WHERE post_id = ?
         AND user_id = ?`,
        [postId, userId]
      );

      return result.affectedRows > 0;
    }
    catch (err) {
      this.logger.error("PostLikeRepository", "deletePostLike failed", err);
      return false;
    }
    finally {
      res.conn.release();
    }
  }
}