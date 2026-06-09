import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { ICommentRepository, CommentSortBy, SortOrder } from "../../../Domain/repositories/comments/ICommentRepository";
import { Comment } from "../../../Domain/models/Comment";
import { DbManager } from "../../connection/DbConnectionPool";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";
import { SOFT_DELETED_COMMENT_CONTENT } from "../../../Domain/constants/Constants";

const safeInt = (n: number): number => Math.max(0, Math.floor(n));

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
      r.parent_id || 0,
      r.content,
      Boolean(r.deleted),
      r.created_at ? new Date(r.created_at) : new Date(),
      Boolean(r.reported),
      r.author_username ?? "",
      Number(r.likes_count ?? 0),
      r.author_profile_picture ?? "",
    );
  }

  async createComment(comment: Comment): Promise<Comment> {
    const res = await this.db.getWriteConnection();
    if (!res) return new Comment();
    try {
      const [result] = await res.conn.execute<ResultSetHeader>(
        `INSERT INTO comments (post_id, author_id, parent_id, content, deleted) VALUES (?, ?, NULLIF(?, 0), ?, ?)`,
        [comment.postId, comment.authorId, comment.parentId, comment.content, 0]
      );
      if (result.insertId === 0) return new Comment();
      return new Comment(
        result.insertId,
        comment.postId,
        comment.authorId,
        comment.parentId,
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

  async findCommentById(commentId: number, includeDeleted: boolean = false): Promise<Comment> {
    const res = await this.db.getReadConnection();
    if (!res) return new Comment();
    try {
      const sql = includeDeleted
        ? `SELECT * FROM comments WHERE comment_id = ?`
        : `SELECT * FROM comments WHERE comment_id = ? AND deleted = 0`;
      const [rows] = await res.conn.execute<RowDataPacket[]>(sql, [commentId]);
      return rows.length > 0 ? this.mapComment(rows[0]) : new Comment();
    } catch (err) {
      this.logger.error("CommentRepository", "findCommentById failed", err);
      return new Comment();
    } finally {
      res.conn.release();
    }
  }

  async findCommentsByPostId(postId: number, page: number = 1, limit: number = 100, sortBy: CommentSortBy = 'createdAt', sortOrder: SortOrder = 'asc'): Promise<{ comments: Comment[], totalAmount: number }> {
    const res = await this.db.getReadConnection();
    if (!res) return { comments: [], totalAmount: 0 };
    const dir = sortOrder === 'desc' ? 'DESC' : 'ASC';
    const orderClause = sortBy === 'likesCount'
      ? `likes_count ${dir}`
      : `c.created_at ${dir}`;
    const safeLimit = safeInt(limit);
    const safeOffset = safeInt((page - 1) * limit);
    try {
      type CountRow = RowDataPacket & { total: number };
      const [[countRow]] = await res.conn.execute<RowDataPacket[]>(
        `SELECT COUNT(*) as total FROM comments c WHERE c.post_id = ? AND c.deleted = 0`,
        [postId]
      );
      const totalAmount = Number((countRow as CountRow).total ?? 0);

      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT c.*,
          u.username AS author_username,
          u.profile_picture AS author_profile_picture,
          (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.comment_id) AS likes_count
         FROM comments c
         LEFT JOIN users u ON c.author_id = u.user_id
         WHERE c.post_id = ? AND c.deleted = 0
         ORDER BY ${orderClause}
         LIMIT ${safeLimit} OFFSET ${safeOffset}`,
        [postId]
      );
      return {
        comments: rows.map((row) => this.mapComment(row)),
        totalAmount,
      };
    } catch (err) {
      this.logger.error("CommentRepository", "findCommentsByPostId failed", err);
      return { comments: [], totalAmount: 0 };
    } finally {
      res.conn.release();
    }
  }

  async findCommentsByAuthorId(authorId: number, page: number = 1, limit: number = 20): Promise<{ comments: Comment[], totalAmount: number }> {
    const res = await this.db.getReadConnection();
    if (!res) return { comments: [], totalAmount: 0 };
    const offset = safeInt((page - 1) * limit);
    const lim = safeInt(limit);
    try {
      type CountRow = RowDataPacket & { total: number | string };
      const [countRows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT COUNT(*) as total FROM comments WHERE author_id = ? AND deleted = 0`,
        [authorId]
      );
      const totalAmount = Number((countRows as CountRow[])[0]?.total ?? 0);

      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT * FROM comments
         WHERE author_id = ? AND deleted = 0
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        [authorId, lim, offset]
      );
      return {
        comments: rows.map((row) => this.mapComment(row)),
        totalAmount
      };
    } catch (err) {
      this.logger.error("CommentRepository", "findCommentsByAuthorId failed", err);
      return { comments: [], totalAmount: 0 };
    } finally {
      res.conn.release();
    }
  }

  async findCommentsByParentId(parentId: number, page: number = 1, limit: number = 50, sortBy: CommentSortBy = 'createdAt', sortOrder: SortOrder = 'asc'): Promise<{ comments: Comment[], totalAmount: number }> {
    const res = await this.db.getReadConnection();
    if (!res) return { comments: [], totalAmount: 0 };
    const dir = sortOrder === 'desc' ? 'DESC' : 'ASC';
    const orderClause = sortBy === 'likesCount'
      ? `likes_count ${dir}`
      : `c.created_at ${dir}`;
    const safeLimit = safeInt(limit);
    const safeOffset = safeInt((page - 1) * limit);
    try {
      type CountRow = RowDataPacket & { total: number };
      const [[countRow]] = await res.conn.execute<RowDataPacket[]>(
        `SELECT COUNT(*) as total FROM comments c WHERE c.parent_id = ? AND c.deleted = 0`,
        [parentId]
      );
      const totalAmount = Number((countRow as CountRow).total ?? 0);

      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT c.*,
          u.username AS author_username,
          u.profile_picture AS author_profile_picture,
          (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.comment_id) AS likes_count
         FROM comments c
         LEFT JOIN users u ON c.author_id = u.user_id
         WHERE c.parent_id = ? AND c.deleted = 0
         ORDER BY ${orderClause}
         LIMIT ${safeLimit} OFFSET ${safeOffset}`,
        [parentId]
      );
      return {
        comments: rows.map((row) => this.mapComment(row)),
        totalAmount,
      };
    } catch (err) {
      this.logger.error("CommentRepository", "findCommentsByParentId failed", err);
      return { comments: [], totalAmount: 0 };
    } finally {
      res.conn.release();
    }
  }

  async hasChildComments(commentId: number): Promise<boolean> {
    const res = await this.db.getReadConnection();
    if (!res) return false;
    try {
      type CountRow = RowDataPacket & { total: number | string };
      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT COUNT(*) as total FROM comments WHERE parent_id = ? AND deleted = 0`,
        [commentId]
      );
      return Number((rows as CountRow[])[0]?.total ?? 0) > 0;
    } catch (err) {
      this.logger.error("CommentRepository", "hasChildComments failed", err);
      return false;
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

  async softDeleteComment(commentId: number): Promise<boolean> {
    const res = await this.db.getWriteConnection();
    if (!res) return false;
    try {
      const [result] = await res.conn.execute<ResultSetHeader>(
        `UPDATE comments SET deleted = 1, content = ? WHERE comment_id = ?`,
        [SOFT_DELETED_COMMENT_CONTENT, commentId]
      );
      return result.affectedRows > 0;
    } catch (err) {
      this.logger.error("CommentRepository", "softDeleteComment failed", err);
      return false;
    } finally {
      res.conn.release();
    }
  }

  async reportComment(commentId: number): Promise<boolean> {
    const res = await this.db.getWriteConnection();
    if (!res) return false;
    try {
      const [result] = await res.conn.execute<ResultSetHeader>(
        `UPDATE comments SET reported = TRUE WHERE comment_id = ?`,
        [commentId]
      );
      return result.affectedRows > 0;
    } catch (err) {
      this.logger.error("CommentRepository", "reportComment failed", err);
      return false;
    } finally {
      res.conn.release();
    }
  }
}