import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { ICommentLikeRepository } from "../../../Domain/repositories/comments/ICommentLikeRepository";
import { CommentLike } from "../../../Domain/models/CommentLike";
import { DbManager } from "../../connection/DbConnectionPool";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";

export class CommentLikeRepository implements ICommentLikeRepository {
  public constructor(
    private readonly db: DbManager,
    private readonly logger: ILoggerService,
  ) {}

  private mapCommentLike(r: RowDataPacket): CommentLike {
    return new CommentLike(
      r.user_id,
      r.comment_id,
      r.liked,
      r.liked_at ? new Date(r.liked_at) : new Date()
    );
  }

  async addCommentLike(commentId: number, like: CommentLike): Promise<CommentLike> {
    const res = await this.db.getWriteConnection();
    if (!res) return new CommentLike();
    try {
      const [result] = await res.conn.execute<ResultSetHeader>(
        `INSERT INTO comment_likes (user_id, comment_id, liked) VALUES (?, ?, ?)`,
        [like.userId, commentId, like.liked]
      );
      return new CommentLike(like.userId, commentId, like.liked, new Date());
    } catch (err) {
      this.logger.error("CommentLikeRepository", "addCommentLike failed", err);
      return new CommentLike();
    } finally { 
      res.conn.release(); 
    }
  }

  async findCommentLikesByCommentId(commentId: number): Promise<{ likes: CommentLike[], totalAmount: number }> {
    const res = await this.db.getReadConnection();
    if (!res) return { likes: [], totalAmount: 0 };
    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT * FROM comment_likes WHERE comment_id = ? ORDER BY liked_at DESC`, 
        [commentId]
      );
      return {
        likes: rows.map((row) => this.mapCommentLike(row)),
        totalAmount: rows.length
      };
    } catch (err) {
      this.logger.error("CommentLikeRepository", "findCommentLikesByCommentId failed", err);
      return { likes: [], totalAmount: 0 };
    } finally { 
      res.conn.release(); 
    }
  }

  async findCommentLikesByUserId(userId: number): Promise<{ likes: CommentLike[], totalAmount: number }> {
    const res = await this.db.getReadConnection();
    if (!res) return { likes: [], totalAmount: 0 };
    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT * FROM comment_likes WHERE user_id = ? ORDER BY liked_at DESC`, 
        [userId]
      );
      return {
        likes: rows.map((row) => this.mapCommentLike(row)),
        totalAmount: rows.length
      };
    } catch (err) {
      this.logger.error("CommentLikeRepository", "findCommentLikesByUserId failed", err);
      return { likes: [], totalAmount: 0 };
    } finally { 
      res.conn.release(); 
    }
  }

  async isLikedByUser(commentId: number, userId: number): Promise<boolean> {
    const res = await this.db.getReadConnection();
    if (!res) return false;
    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT COUNT(*) as count FROM comment_likes WHERE comment_id = ? AND user_id = ?`,
        [commentId, userId]
      );
      return rows[0].count > 0;
    } catch (err) {
      this.logger.error("CommentLikeRepository", "isLikedByUser failed", err);
      return false;
    } finally { 
      res.conn.release(); 
    }
  }

  async updateCommentLike(commentId: number, like: CommentLike): Promise<boolean> {
    const res = await this.db.getWriteConnection();
    if (!res) return false;
    try {
      const [result] = await res.conn.execute<ResultSetHeader>(
        `UPDATE comment_likes SET liked = ? WHERE comment_id = ? AND user_id = ?`,
        [like.liked, commentId, like.userId]
      );
      return result.affectedRows > 0;
    } catch (err) {
      this.logger.error("CommentLikeRepository", "updateCommentLike failed", err);
      return false;
    } finally { 
      res.conn.release(); 
    }
  }

  async deleteCommentLike(commentId: number, userId: number): Promise<boolean> {
    const res = await this.db.getWriteConnection();
    if (!res) return false;
    try {
      const [result] = await res.conn.execute<ResultSetHeader>(
        `DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?`, 
        [commentId, userId]
      );
      return result.affectedRows > 0;
    } catch (err) {
      this.logger.error("CommentLikeRepository", "deleteCommentLike failed", err);
      return false;
    } finally { 
      res.conn.release(); 
    }
  }
}