import { RowDataPacket, ResultSetHeader } from "mysql2";
import { IPostRepository } from "../../../Domain/repositories/posts/IPostRepository";
import { Post } from "../../../Domain/models/Post";
import { PostLike } from "../../../Domain/models/PostLike";
import { DbManager } from "../../connection/DbConnectionPool";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";

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
        );
    }

    private mapPostLike(r: RowDataPacket): PostLike {
        return new PostLike(
            r.user_id,
            r.post_id,
            r.liked,
            r.liked_at ? new Date(r.liked_at) : new Date(),
        );
    }

}