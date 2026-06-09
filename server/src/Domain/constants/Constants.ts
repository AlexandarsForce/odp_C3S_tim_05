export const HEALTH_CHECK_TIMEOUT      = 2000;
export const HEALTH_CHECK_INTERVAL_MS  = 10000;

// Single source of truth for soft-deleted comment content.
// Both the repository (when soft-deleting) and the service (when validating
// updates) must reference this constant — never the literal string.
export const SOFT_DELETED_COMMENT_CONTENT = "[comment deleted]";

// Maximum nesting depth allowed for a new comment, counted as ancestors
// from the comment itself. 0 = root, 1 = reply, 2 = reply-to-reply.
// Anything strictly deeper than this is rejected by CommentService.
export const COMMENT_MAX_DEPTH = 2;

