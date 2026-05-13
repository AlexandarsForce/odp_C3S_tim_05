import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { IPostTagRepository } from "../../../Domain/repositories/posts/IPostTagRepository";
import { PostTag } from "../../../Domain/models/PostTag";
import { DbManager } from "../../connection/DbConnectionPool";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";

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

  async addPostTag(postId: number, tag: PostTag): Promise<boolean> {
    const res = await this.db.getWriteConnection();
    if (!res) return false;

    try {
      const [result] = await res.conn.execute<ResultSetHeader>(
        `INSERT INTO post_tags (post_id, tag_id)
         VALUES (?, ?)`,
        [
          postId,
          tag.tagId
        ]
      );

      return result.affectedRows > 0;
    }
    catch (err) {
      this.logger.error("PostTagRepository", "addPostTag failed", err);
      return false;
    }
    finally {
      res.conn.release();
    }
  }

  async findPostTagsByPostId(postId: number): Promise<{ tags: PostTag[], totalAmount: number }> {
    const res = await this.db.getReadConnection();
    if (!res) return { tags: [], totalAmount: 0 };

    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT *
         FROM post_tags
         WHERE post_id = ?`,
        [postId]
      );

      return {
        tags: rows.map((row) => this.mapPostTag(row)),
        totalAmount: rows.length
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