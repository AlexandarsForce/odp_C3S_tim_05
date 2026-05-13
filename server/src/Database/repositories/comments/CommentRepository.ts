import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { ICommentRepository } from "../../../Domain/repositories/comments/ICommentRepository";
import { Comment } from "../../../Domain/models/Comment";
import { DbManager } from "../../connection/DbConnectionPool";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";

export class CommentRepository implements ICommentRepository {
  public constructor(
    private readonly db: DbManager,
    private readonly logger: ILoggerService,
  ) {}

  private mapComment(r: RowDataPacket): Comment {
    return new Comment(
      r.comment_id,
      r.post_id,
      r.author_id,
      r.parent_id ?? null,
      r.content,
      Boolean(r.deleted),
      r.created_at ? new Date(r.created_at) : new Date()
    );
  }

  async createComment(comment: Comment): Promise<Comment> {
    const res = await this.db.getWriteConnection();
    if (!res) return new Comment();
    try {
      const [result] = await res.conn.execute<ResultSetHeader>(
        `INSERT INTO comments (post_id, author_id, parent_id, content, deleted) VALUES (?, ?, ?, ?, ?)`,
        [comment.postId, comment.authorId, comment.parentId ?? null, comment.content, 0]
      );
      if (result.insertId === 0) return new Comment();
      return new Comment(
        result.insertId,
        comment.postId,
        comment.authorId,
        comment.parentId ?? null,
        comment.content,
        false,
        new Date()
      );
    } catch (err) {
      this.logger.error("CommentRepository", "createComment failed", err);
      return new Comment();
    } finally { 
      res.conn.release(); 
    }
  }

  async findCommentById(commentId: number): Promise<Comment> {
    const res = await this.db.getReadConnection();
    if (!res) return new Comment();
    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT * FROM comments WHERE comment_id = ? AND deleted = 0`, 
        [commentId]
      );
      return rows.length > 0 ? this.mapComment(rows[0]) : new Comment();
    } catch (err) {
      this.logger.error("CommentRepository", "findCommentById failed", err);
      return new Comment();
    } finally { 
      res.conn.release(); 
    }
  }

  async findCommentsByPostId(postId: number): Promise<{ comments: Comment[], totalAmount: number }> {
    const res = await this.db.getReadConnection();
    if (!res) return { comments: [], totalAmount: 0 };
    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT * FROM comments WHERE post_id = ? AND deleted = 0 ORDER BY created_at ASC`, 
        [postId]
      );
      return {
        comments: rows.map((row) => this.mapComment(row)),
        totalAmount: rows.length
      };
    } catch (err) {
      this.logger.error("CommentRepository", "findCommentsByPostId failed", err);
      return { comments: [], totalAmount: 0 };
    } finally { 
      res.conn.release(); 
    }
  }

  async findCommentsByAuthorId(authorId: number): Promise<{ comments: Comment[], totalAmount: number }> {
    const res = await this.db.getReadConnection();
    if (!res) return { comments: [], totalAmount: 0 };
    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT * FROM comments WHERE author_id = ? AND deleted = 0 ORDER BY created_at DESC`, 
        [authorId]
      );
      return {
        comments: rows.map((row) => this.mapComment(row)),
        totalAmount: rows.length
      };
    } catch (err) {
      this.logger.error("CommentRepository", "findCommentsByAuthorId failed", err);
      return { comments: [], totalAmount: 0 };
    } finally { 
      res.conn.release(); 
    }
  }

  async findCommentsByParentId(parentId: number): Promise<{ comments: Comment[], totalAmount: number }> {
    const res = await this.db.getReadConnection();
    if (!res) return { comments: [], totalAmount: 0 };
    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT * FROM comments WHERE parent_id = ? AND deleted = 0 ORDER BY created_at ASC`, 
        [parentId]
      );
      return {
        comments: rows.map((row) => this.mapComment(row)),
        totalAmount: rows.length
      };
    } catch (err) {
      this.logger.error("CommentRepository", "findCommentsByParentId failed", err);
      return { comments: [], totalAmount: 0 };
    } finally { 
      res.conn.release(); 
    }
  }

  async updateComment(commentId: number, comment: Comment): Promise<boolean> {
    const res = await this.db.getWriteConnection();
    if (!res) return false;
    try {
      const [result] = await res.conn.execute<ResultSetHeader>(
        `UPDATE comments SET content = ? WHERE comment_id = ? AND deleted = 0`,
        [comment.content, commentId]
      );
      return result.affectedRows > 0;
    } catch (err) {
      this.logger.error("CommentRepository", "updateComment failed", err);
      return false;
    } finally { 
      res.conn.release(); 
    }
  }

  async deleteComment(commentId: number): Promise<boolean> {
    const res = await this.db.getWriteConnection();
    if (!res) return false;
    try {
      const [result] = await res.conn.execute<ResultSetHeader>(
        `UPDATE comments SET deleted = 1 WHERE comment_id = ?`, 
        [commentId]
      );
      return result.affectedRows > 0;
    } catch (err) {
      this.logger.error("CommentRepository", "deleteComment failed", err);
      return false;
    } finally { 
      res.conn.release(); 
    }
  }
}