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
    profile_picture TEXT NULL,
    role            ENUM('user','admin') NOT NULL DEFAULT 'user',
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    INDEX idx_username (username)
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
    FOREIGN KEY (owner_id) REFERENCES users(user_id)
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
    FOREIGN KEY (community_id) REFERENCES communities(community_id)
);