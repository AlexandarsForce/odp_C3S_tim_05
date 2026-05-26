import { RowDataPacket, ResultSetHeader } from "mysql2";
import { ITagRepository } from "../../../Domain/repositories/tags/ITagRepository";
import { Tag } from "../../../Domain/models/Tag";
import { DbManager } from "../../connection/DbConnectionPool";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";

export class TagRepository implements ITagRepository {
    public constructor(
        private readonly db: DbManager,
        private readonly logger: ILoggerService
    ) {}

    private mapTag(r: RowDataPacket): Tag {
        return new Tag(r.tag_id, r.name);
    }

    async createTag(tag: Tag): Promise<Tag> {
        const res = await this.db.getWriteConnection();
        if (!res) return new Tag();
        try {
            const [result] = await res.conn.execute<ResultSetHeader>(
                `INSERT INTO tags (name) VALUES (?)`,
                [tag.name]
            );
            if (result.insertId === 0) return new Tag();
            return new Tag(result.insertId, tag.name);
        }
        catch (err) {
            this.logger.error("TagRepository", "createTag failed", err);
            return new Tag();
        }
        finally { res.conn.release(); }
    }

    async findAllTags(): Promise<Tag[]> {
        const res = await this.db.getReadConnection();
        if (!res) return [];
        try {
            const [rows] = await res.conn.execute<RowDataPacket[]>(`SELECT * FROM tags`);
            return rows.map(r => this.mapTag(r));
        }
        catch (err) {
            this.logger.error("TagRepository", "findAllTags failed", err);
            return [];
        }
        finally { res.conn.release(); }
    }

    async findTagById(tagId: number): Promise<Tag> {
        const res = await this.db.getReadConnection();
        if (!res) return new Tag();
        try {
            const [rows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT * FROM tags WHERE tag_id = ?`,
                [tagId]
            );
            return rows.length > 0 ? this.mapTag(rows[0]) : new Tag();
        }
        catch (err) {
            this.logger.error("TagRepository", "findTagById failed", err);
            return new Tag();
        }
        finally { res.conn.release(); }
    }

    async findTagsByName(name: string): Promise<{ tags: Tag[], totalAmount: number }> {
        const res = await this.db.getReadConnection();
        if (!res) return { tags: [], totalAmount: 0 };
        try {
            type CountRow = RowDataPacket & { total: number | string };
            const [countRows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT COUNT(*) as total FROM tags WHERE name LIKE ?`,
                [`%${name}%`]
            );
            const totalAmount = Number((countRows as CountRow[])[0]?.total ?? 0);
            const [rows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT * FROM tags WHERE name LIKE ?`,
                [`%${name}%`]
            );
            return { tags: rows.map(r => this.mapTag(r)), totalAmount };
        }
        catch (err) {
            this.logger.error("TagRepository", "findTagsByName failed", err);
            return { tags: [], totalAmount: 0 };
        }
        finally { res.conn.release(); }
    }

    async deleteTag(tagId: number): Promise<boolean> {
        const res = await this.db.getWriteConnection();
        if (!res) return false;
        try {
            const [result] = await res.conn.execute<ResultSetHeader>(
                `DELETE FROM tags WHERE tag_id = ?`,
                [tagId]
            );
            return result.affectedRows > 0;
        }
        catch (err) {
            this.logger.error("TagRepository", "deleteTag failed", err);
            return false;
        }
        finally { res.conn.release(); }
    }
}
