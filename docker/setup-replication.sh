#!/bin/sh
# Run INSIDE the master container:
#   docker cp docker/setup-replication.sh project_master:/setup.sh
#   docker exec project_master sh /setup.sh
#
# STRATEGY:
#   1. Create schema on Master
#   2. Lock Master, read binlog position, dump schema
#   3. Import schema dump DIRECTLY into each Slave (bypassing replication)
#   4. Configure Slaves to start replication FROM current position
#   => Slaves have the schema already, replication only handles new data

ROOT_PASS="root1234"
REPL_USER="replicator"
REPL_PASS="repl1234"

# TODO: Replace "project_db" with your actual database name
DB_NAME="pulse_net"

M="mysql  -h127.0.0.1    -P3306 -uroot -p${ROOT_PASS} --protocol=TCP --connect-timeout=5"
S1="mysql -hmysql-slave1 -P3306 -uroot -p${ROOT_PASS} --protocol=TCP --connect-timeout=5"
S2="mysql -hmysql-slave2 -P3306 -uroot -p${ROOT_PASS} --protocol=TCP --connect-timeout=5"

SCHEMA_FILE="/tmp/project_schema.sql"

echo ""
echo "========================================================"
echo "  Project -- MySQL Replication Setup"
echo "========================================================"

# ── 1. Wait for all nodes ─────────────────────────────────────
wait_mysql() {
  HOST=$1; NAME=$2
  printf "  Waiting for %s" "$NAME"
  i=0
  while [ $i -lt 30 ]; do
    mysql -h"$HOST" -P3306 -uroot -p"$ROOT_PASS" --protocol=TCP \
      --connect-timeout=3 -e "SELECT 1" > /dev/null 2>&1 \
      && echo " OK" && return 0
    printf "."; sleep 3; i=$((i+1))
  done
  echo " TIMEOUT"; exit 1
}

echo ""
echo "[ 1/5 ] Checking node availability..."
wait_mysql "127.0.0.1"    "Master"
wait_mysql "mysql-slave1" "Slave1"
wait_mysql "mysql-slave2" "Slave2"
sleep 2

# ── 2. Create schema on Master ────────────────────────────────
echo ""
echo "[ 2/5 ] Creating schema on Master..."

$M -e "DROP DATABASE IF EXISTS ${DB_NAME};"
$M -e "CREATE DATABASE ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# TODO: Replace the SQL below with your actual table definitions
$M ${DB_NAME} << 'SQL'

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
SQL

MASTER_TABLES=$($M -s --skip-column-names \
  -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${DB_NAME}';" 2>/dev/null)
echo "  Master tables: ${MASTER_TABLES}"
if [ "${MASTER_TABLES:-0}" -lt "2" ]; then
  echo "  ERROR: Schema creation failed on Master"
  exit 1
fi

# ── 3. Lock Master, get binlog position, dump schema ─────────
echo ""
echo "[ 3/5 ] Locking Master, reading binlog position, dumping schema..."

$M -e "FLUSH TABLES WITH READ LOCK;" > /dev/null 2>&1

STATUS=$($M --skip-column-names -e "SHOW MASTER STATUS;" 2>/dev/null)
BINLOG_FILE=$(echo "$STATUS" | awk '{print $1}')
BINLOG_POS=$(echo  "$STATUS" | awk '{print $2}')

if [ -z "$BINLOG_FILE" ] || [ -z "$BINLOG_POS" ]; then
  echo "  ERROR: Could not read SHOW MASTER STATUS"
  exit 1
fi
echo "  File     : $BINLOG_FILE"
echo "  Position : $BINLOG_POS"

mysqldump -h127.0.0.1 -P3306 -uroot -p"${ROOT_PASS}" --protocol=TCP \
  --no-data --skip-lock-tables --no-tablespaces \
  ${DB_NAME} > "$SCHEMA_FILE" 2>/dev/null

$M -e "UNLOCK TABLES;" > /dev/null 2>&1

DUMP_LINES=$(wc -l < "$SCHEMA_FILE")
echo "  Schema dump: ${DUMP_LINES} lines"

# ── 4. Import schema into Slaves, then configure replication ──
echo ""
echo "[ 4/5 ] Importing schema into Slave1..."
$S1 -e "DROP DATABASE IF EXISTS ${DB_NAME}; CREATE DATABASE ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
$S1 ${DB_NAME} < "$SCHEMA_FILE"

S1_TABLES=$(mysql -hmysql-slave1 -P3306 -uroot -p"$ROOT_PASS" --protocol=TCP \
  -s --skip-column-names --connect-timeout=5 \
  -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${DB_NAME}';" 2>/dev/null)
echo "  Slave1 tables after import: ${S1_TABLES:-0}"

printf "STOP REPLICA;\nRESET REPLICA ALL;\nCHANGE REPLICATION SOURCE TO SOURCE_HOST='mysql-master', SOURCE_PORT=3306, SOURCE_USER='%s', SOURCE_PASSWORD='%s', SOURCE_LOG_FILE='%s', SOURCE_LOG_POS=%s, GET_SOURCE_PUBLIC_KEY=1;\nSTART REPLICA;\n" \
  "$REPL_USER" "$REPL_PASS" "$BINLOG_FILE" "$BINLOG_POS" | $S1
echo "  Slave1 replication started"

echo "  Importing schema into Slave2..."
$S2 -e "DROP DATABASE IF EXISTS ${DB_NAME}; CREATE DATABASE ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
$S2 ${DB_NAME} < "$SCHEMA_FILE"

S2_TABLES=$(mysql -hmysql-slave2 -P3306 -uroot -p"$ROOT_PASS" --protocol=TCP \
  -s --skip-column-names --connect-timeout=5 \
  -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${DB_NAME}';" 2>/dev/null)
echo "  Slave2 tables after import: ${S2_TABLES:-0}"

printf "STOP REPLICA;\nRESET REPLICA ALL;\nCHANGE REPLICATION SOURCE TO SOURCE_HOST='mysql-master', SOURCE_PORT=3306, SOURCE_USER='%s', SOURCE_PASSWORD='%s', SOURCE_LOG_FILE='%s', SOURCE_LOG_POS=%s, GET_SOURCE_PUBLIC_KEY=1;\nSTART REPLICA;\n" \
  "$REPL_USER" "$REPL_PASS" "$BINLOG_FILE" "$BINLOG_POS" | $S2
echo "  Slave2 replication started"

sleep 3

# ── 5. Verify ─────────────────────────────────────────────────
echo ""
echo "[ 5/5 ] Verifying replication..."
echo ""

check_slave() {
  HOST=$1; NAME=$2
  STATUS=$(mysql -h"$HOST" -P3306 -uroot -p"$ROOT_PASS" \
    --protocol=TCP --connect-timeout=5 \
    -e "SHOW REPLICA STATUS\G" 2>/dev/null)

  IO=$(echo  "$STATUS" | grep "Replica_IO_Running:"  | awk '{print $2}')
  SQL=$(echo "$STATUS" | grep "Replica_SQL_Running:" | awk '{print $2}')
  ERR=$(echo "$STATUS" | grep "Last_Error:" | sed 's/.*Last_Error: //')
  BEHIND=$(echo "$STATUS" | grep "Seconds_Behind_Source:" | awk '{print $2}')

  TABLES=$(mysql -h"$HOST" -P3306 -uroot -p"$ROOT_PASS" --protocol=TCP \
    --connect-timeout=5 -s --skip-column-names \
    -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${DB_NAME}';" \
    2>/dev/null)

  echo "  $NAME:"
  echo "    IO_Running     : ${IO:-N/A}"
  echo "    SQL_Running    : ${SQL:-N/A}"
  echo "    Seconds_Behind : ${BEHIND:-N/A}"
  echo "    Tables         : ${TABLES:-0}"

  if [ "$IO" = "Yes" ] && [ "$SQL" = "Yes" ]; then
    echo "    >>> REPLICATION ACTIVE <<<" 
  else
    echo "    >>> CHECK FAILED <<<"
    [ -n "$ERR" ] && [ "$ERR" != "" ] && echo "    Last_Error: $ERR"
  fi
  echo ""
}

check_slave "mysql-slave1" "Slave1"
check_slave "mysql-slave2" "Slave2"

rm -f "$SCHEMA_FILE"

echo "========================================================"
echo "  Done! Start the server: cd server && npm run dev"
echo "========================================================"
