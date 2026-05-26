import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { IPostTagRepository } from "../../../Domain/repositories/posts/IPostTagRepository";
import { PostTag } from "../../../Domain/models/PostTag";
import { DbManager } from "../../connection/DbConnectionPool";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";

const safeInt = (n: number): number => Math.max(0, Math.floor(n));

export class PostTagRepository implements IPostTagRepository {
  public constructor(
    private readonly db: DbManager,
    private readonly logger: ILoggerService,
  ) {}

  private mapPostTag(r: RowDataPacket): PostTag {
    return new PostTag(
      r.post_id,
      r.tag_id,
    );
  }

  async addPostTag(postId: number, tag: PostTag): Promise<PostTag> {
    const res = await this.db.getWriteConnection();
    if (!res) return new PostTag();

    try {
      const [result] = await res.conn.execute<ResultSetHeader>(
        `INSERT INTO post_tags (post_id, tag_id)
         VALUES (?, ?)`,
        [
          postId,
          tag.tagId
        ]
      );

      return result.affectedRows > 0 ? new PostTag(postId, tag.tagId) : new PostTag();
    }
    catch (err) {
      this.logger.error("PostTagRepository", "addPostTag failed", err);
      return new PostTag();
    }
    finally {
      res.conn.release();
    }
  }

  async findPostTagsByPostId(postId: number, page: number, limit: number): Promise<{ tags: PostTag[], totalAmount: number }> {
    const res = await this.db.getReadConnection();
    if (!res) return { tags: [], totalAmount: 0 };

    const offset = safeInt((page - 1) * limit);
    const lim = safeInt(limit);

    try {
      type CountRow = RowDataPacket & { total: number | string };
      const [countRows] = await res.conn.execute<RowDataPacket[]>(`SELECT COUNT(*) as total FROM post_tags WHERE post_id = ?`, [postId]);
      const totalAmount = Number((countRows as CountRow[])[0]?.total ?? 0);
      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT *
         FROM post_tags
         WHERE post_id = ?
         LIMIT ${lim} OFFSET ${offset}`,
        [postId]
      );

      return {
        tags: rows.map((row) => this.mapPostTag(row)),
        totalAmount
      };
    }
    catch (err) {
      this.logger.error("PostTagRepository", "findPostTagsByPostId failed", err);

      return {
        tags: [],
        totalAmount: 0
      };
    }
    finally {
      res.conn.release();
    }
  }

  async deletePostTag(postId: number, tagId: number): Promise<boolean> {
    const res = await this.db.getWriteConnection();
    if (!res) return false;

    try {
      const [result] = await res.conn.execute<ResultSetHeader>(
        `DELETE FROM post_tags
         WHERE post_id = ?
         AND tag_id = ?`,
        [postId, tagId]
      );

      return result.affectedRows > 0;
    }
    catch (err) {
      this.logger.error("PostTagRepository", "deletePostTag failed", err);
      return false;
    }
    finally {
      res.conn.release();
    }
  }
}