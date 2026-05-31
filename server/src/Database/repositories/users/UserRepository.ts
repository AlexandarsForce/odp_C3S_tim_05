import { RowDataPacket, ResultSetHeader } from "mysql2";
import { IUserRepository } from "../../../Domain/repositories/users/IUserRepository";
import { User } from "../../../Domain/models/User";
import { UserRole } from "../../../Domain/enums/UserRole";
import { DbManager } from "../../connection/DbConnectionPool";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";

export class UserRepository implements IUserRepository {
  public constructor(
    private readonly db: DbManager,
    private readonly logger: ILoggerService,
  ) {}

  private map(r: RowDataPacket): User {
    return new User(r.user_id, r.username, r.full_name, r.email, r.password, r.bio, r.profile_picture, r.role as UserRole, r.created_at, r.updated_at, 1);
  }

  async create(user: User): Promise<User> {
    const res = await this.db.getWriteConnection();
    if (!res) return new User();
    try {
      const [result] = await res.conn.execute<ResultSetHeader>(
        `INSERT INTO users (username, full_name, email, password, bio, profile_picture, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [user.username, user.fullname, user.email, user.passwordHash, user.bio, user.profilePicture, user.role, user.createdAt, user.updatedAt]
      );
      if (result.insertId === 0) return new User();
      return new User(result.insertId, user.username, user.fullname, user.email, user.passwordHash, user.bio, user.profilePicture, user.role, user.createdAt, user.updatedAt);
    } catch (err) {
      this.logger.error("UserRepository", "create failed", err);
      return new User();
    } finally { res.conn.release(); }
  }

  async findById(id: number): Promise<User> {
    const res = await this.db.getReadConnection();
    if (!res) return new User();
    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(`SELECT * FROM users WHERE user_id = ?`, [id]);
      return rows.length > 0 ? this.map(rows[0]) : new User();
    } catch (err) {
      this.logger.error("UserRepository", "findById failed", err);
      return new User();
    } finally { res.conn.release(); }
  }

  async findByUsername(username: string): Promise<User> {
    const res = await this.db.getReadConnection();
    if (!res) return new User();
    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(`SELECT * FROM users WHERE username = ?`, [username]);
      return rows.length > 0 ? this.map(rows[0]) : new User();
    } catch (err) {
      this.logger.error("UserRepository", "findByUsername failed", err);
      return new User();
    } finally { res.conn.release(); }
  }

  async findByEmail(email: string): Promise<User> {
    const res = await this.db.getReadConnection();
    if (!res) return new User();
    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(`SELECT * FROM users WHERE email = ?`, [email]);
      return rows.length > 0 ? this.map(rows[0]) : new User();
    } catch (err) {
      this.logger.error("UserRepository", "findByEmail failed", err);
      return new User();
    } finally { res.conn.release(); }
  }

  async findAll(): Promise<User[]> {
    const res = await this.db.getReadConnection();
    if (!res) return [];
    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(`SELECT * FROM users ORDER BY user_id ASC`);
      return rows.map((r) => this.map(r));
    } catch (err) {
      this.logger.error("UserRepository", "findAll failed", err);
      return [];
    } finally { res.conn.release(); }
  }

  async update(user: User): Promise<boolean> {
    const res = await this.db.getWriteConnection();
    if (!res) return false;
    try {
      const [result] = await res.conn.execute<ResultSetHeader>(
        `UPDATE users SET username = ?, full_name = ?, email = ?, password = ?, bio = ?, profile_picture = ?, role = ?, updated_at = ? WHERE user_id = ?`,
        [user.username, user.fullname, user.email, user.passwordHash, user.bio, user.profilePicture, user.role, user.updatedAt, user.id]
      );
      return result.affectedRows > 0;
    } catch (err) {
      this.logger.error("UserRepository", "update failed", err);
      return false;
    } finally { res.conn.release(); }
  }

  async deactivate(id: number): Promise<boolean> {
    const res = await this.db.getWriteConnection();
    if (!res) return false;
    try {
      const [result] = await res.conn.execute<ResultSetHeader>(
        `UPDATE users SET /* no isActive column in schema; mark updated_at instead */ updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`, [id]
      );
      return result.affectedRows > 0;
    } catch (err) {
      this.logger.error("UserRepository", "deactivate failed", err);
      return false;
    } finally { res.conn.release(); }
  }

  async delete(id: number): Promise<boolean> {
    const res = await this.db.getWriteConnection();
    if (!res) return false;
    try {
      const [result] = await res.conn.execute<ResultSetHeader>(`DELETE FROM users WHERE user_id = ?`, [id]);
      return result.affectedRows > 0;
    } catch (err) {
      this.logger.error("UserRepository", "delete failed", err);
      return false;
    } finally { res.conn.release(); }
  }

  async exists(id: number): Promise<boolean> {
    const res = await this.db.getReadConnection();
    if (!res) return false;
    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT COUNT(*) as cnt FROM users WHERE user_id = ?`, [id]
      );
      return (rows[0]?.cnt ?? 0) > 0;
    } catch (err) {
      this.logger.error("UserRepository", "exists failed", err);
      return false;
    } finally { res.conn.release(); }
  }
}
