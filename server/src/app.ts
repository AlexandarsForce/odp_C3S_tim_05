import "dotenv/config";
import express from "express";
import cors from "cors";

import { ConsoleLoggerService } from "./Services/logger/ConsoleLoggerService";
import { DbManager } from "./Database/connection/DbConnectionPool";

import { AuditRepository } from "./Database/repositories/audits/AuditRepository";
import { UserRepository }   from "./Database/repositories/users/UserRepository";
import { CommunityRepository } from "./Database/repositories/communities/CommunityRepository";
import { CommunityMemberRepository } from "./Database/repositories/communities/CommunityMemberRepository";
import { PostRepository } from "./Database/repositories/posts/PostRepository";
import { PostTagRepository } from "./Database/repositories/posts/PostTagRepository";
import { PostLikeRepository } from "./Database/repositories/posts/PostLikeRepository";

import { AuditService } from "./Services/audit/AuditService";
import { AuthService }   from "./Services/auth/AuthService";
import { UserService }   from "./Services/users/UserService";
import { CommunityService } from "./Services/communities/CommunityService";
import { CommunityMemberService } from "./Services/communities/CommunityMemberService";
import { PostService } from "./Services/posts/PostService";
import { PostTagService } from "./Services/posts/PostTagService";
import { PostLikeService } from "./Services/posts/PostLikeService";

import { AuthController }   from "./WebAPI/controllers/AuthController";
import { UserController }   from "./WebAPI/controllers/UserController";
import { CommunityController } from "./WebAPI/controllers/CommunityController";
import { PostController } from "./WebAPI/controllers/PostController";

export const logger = new ConsoleLoggerService();
export const db     = new DbManager(logger);

// Repositories
const userRepo   = new UserRepository(db, logger);
const communityRepo = new CommunityRepository(db, logger);
const communityMemberRepo = new CommunityMemberRepository(db, logger);
const auditRepo = new AuditRepository(db, logger);
const postRepo = new PostRepository(db, logger);
const postTagRepo = new PostTagRepository(db, logger);
const postLikeRepo = new PostLikeRepository(db, logger);

// Services
const auditService   = new AuditService(auditRepo);
const authService   = new AuthService(userRepo);
const userService   = new UserService(userRepo);
const communityService = new CommunityService(communityRepo, auditService);
const communityMemberService = new CommunityMemberService(communityMemberRepo, auditService);
const postService = new PostService(postRepo, auditService);
const postTagService = new PostTagService(postTagRepo, auditService);
const postLikeService = new PostLikeService(postLikeRepo, auditService);

// Express
const app = express();
app.use(cors({ origin: process.env.CLIENT_URL ?? "*" }));
app.use(express.json());

app.use("/api/v1", new AuthController(authService).getRouter());
app.use("/api/v1", new UserController(userService).getRouter());
app.use("/api/v1", new CommunityController(communityService, communityMemberService, auditService).getRouter());
app.use("/api/v1", new PostController(postService, postLikeService, postTagService, auditService).getRouter());

export default app;
