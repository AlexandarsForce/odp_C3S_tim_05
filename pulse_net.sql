CREATE DATABASE IF NOT EXISTS pulse_net;
USE pulse_net;

CREATE TABLE IF NOT EXISTS users 
(
    user_id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username        VARCHAR(40)  NOT NULL UNIQUE,
    full_name       VARCHAR(150) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    password        VARCHAR(300) NOT NULL,
    bio             VARCHAR(300) NULL,
    profile_picture LONGTEXT NULL,
    role            ENUM('user','admin') NOT NULL DEFAULT 'user',
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email)
);

CREATE TABLE IF NOT EXISTS communities
(
    community_id   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    owner_id       INT UNSIGNED NOT NULL,
    name           VARCHAR(80) NOT NULL UNIQUE,
    description    VARCHAR(500) NULL,
    rules          VARCHAR(200) NULL,
    avatar_picture TEXT NULL,
    type           ENUM('public','private') NOT NULL DEFAULT 'private',
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(user_id),
    INDEX idx_name (name)
);

CREATE TABLE IF NOT EXISTS posts
(
    post_id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    author_id        INT UNSIGNED NOT NULL,
    community_id     INT UNSIGNED NOT NULL,
    title            VARCHAR(200) NOT NULL,
    content          VARCHAR(10000) NOT NULL,
    media_attachment TEXT NULL,
    deleted          TINYINT(1) DEFAULT 0,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(user_id),
    FOREIGN KEY (community_id) REFERENCES communities(community_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS comments
(
    comment_id   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    post_id      INT UNSIGNED NOT NULL,
    author_id    INT UNSIGNED NOT NULL,
    parent_id    INT UNSIGNED NULL,
    content      VARCHAR(2000) NOT NULL,
    deleted      TINYINT(1) DEFAULT 0,
    reported     TINYINT(1) DEFAULT 0,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(user_id),
    FOREIGN KEY (parent_id) REFERENCES comments(comment_id)
);

-- Migration: add reported column if running against an existing database
ALTER TABLE comments ADD COLUMN IF NOT EXISTS reported TINYINT(1) DEFAULT 0;

CREATE TABLE IF NOT EXISTS tags
(
    tag_id   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name     VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS community_members
(
    user_id      INT UNSIGNED NOT NULL,
    community_id INT UNSIGNED NOT NULL,
    role         ENUM('member','moderator') NOT NULL DEFAULT 'member',
    status       ENUM('active','pending','banned') NOT NULL DEFAULT 'pending',
    joined_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, community_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (community_id) REFERENCES communities(community_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS post_likes
(
    user_id     INT UNSIGNED NOT NULL,
    post_id     INT UNSIGNED NOT NULL,
    liked       TINYINT(1) SIGNED DEFAULT 0,
    liked_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, post_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS comment_likes
(
    user_id     INT UNSIGNED NOT NULL,
    comment_id  INT UNSIGNED NOT NULL,
    liked       TINYINT(1) SIGNED DEFAULT 0,
    liked_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, comment_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (comment_id) REFERENCES comments(comment_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS post_tags
(
    post_id     INT UNSIGNED NOT NULL,
    tag_id      INT UNSIGNED NOT NULL,
    PRIMARY KEY (post_id, tag_id),
    FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(tag_id)
);

CREATE TABLE IF NOT EXISTS user_follows
(
    follower_id     INT UNSIGNED NOT NULL,
    following_id    INT UNSIGNED NOT NULL,
    followed_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, following_id),
    FOREIGN KEY (follower_id) REFERENCES users(user_id),
    FOREIGN KEY (following_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS audits (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED NULL,
    action      VARCHAR(255) NOT NULL,
    details     TEXT,
    ip_address  VARCHAR(45),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_created (created_at)
);