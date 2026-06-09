import { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Heart, MessageCircle, ArrowLeft, Flag, Reply as ReplyIcon } from "lucide-react";
import { postApi, type RestrictedPostInfo } from "../../api_services/posts/PostAPIService";
import { commentApi, type CommentDto } from "../../api_services/comments/CommentAPIService";
import { communityApi } from "../../api_services/communities/CommunityAPIService";
import { MarkdownRenderer } from "../../components/ui/MarkdownRenderer";
import { useAuth } from "../../hooks/auth/useAuthHook";
import { useLiveLikes } from "../../hooks/posts/useLiveLikesHook";
import { AppNavbar } from "../../components/layout/AppNavbar";
import { CommentAvatar } from "../../components/comments/CommentAvatar";
import type { PostDto } from "../../types/post/PostTypes";

type CommentSortKey = "newest" | "oldest" | "mostLiked";
const COMMENT_SORTS: { key: CommentSortKey; label: string }[] = [
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "Oldest" },
  { key: "mostLiked", label: "Most liked" },
];

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
};

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState<PostDto | null>(null);
  const [comments, setComments] = useState<CommentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [restricted, setRestricted] = useState<RestrictedPostInfo | null>(null);
  const [joinPending, setJoinPending] = useState(false);
  const [joinMessage, setJoinMessage] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [commentLikes, setCommentLikes] = useState<Set<number>>(new Set());
  const [reportedComments, setReportedComments] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [commentSort, setCommentSort] = useState<CommentSortKey>("newest");
  const [inputFocused, setInputFocused] = useState(false);
  const commentInputRef = useRef<HTMLTextAreaElement | null>(null);

  const startReply = (parentCommentId: number, mentionUsername?: string) => {
    setReplyingTo(parentCommentId);
    if (mentionUsername) {
      setNewComment((current) =>
        current.trim().length === 0 ? `@${mentionUsername} ` : current
      );
    }
    setTimeout(() => commentInputRef.current?.focus(), 0);
  };

  const postId = id ? Number(id) : 0;

  const liveLikesCount = useLiveLikes(postId, post?.likesCount ?? 0);

  useEffect(() => {
    if (!postId) return;
    Promise.all([
      postApi.getById(postId),
      commentApi.getPostComments(postId),
    ]).then(([postRes, commRes]) => {
      if (postRes.success && postRes.data) {
        setPost(postRes.data);
        if ((postRes as any).isLiked) setLiked(true);
      } else if (postRes.restricted && postRes.community && postRes.post) {
        setRestricted({ community: postRes.community, post: postRes.post });
      } else {
        setNotFound(true);
      }
      if (commRes.success && commRes.data) {
        setComments(commRes.data.items);
      }
      setLoading(false);
    });
  }, [postId]);

  const handleJoinCommunity = async () => {
    if (!restricted) return;
    setJoinPending(true);
    const r = await communityApi.join(restricted.community.id);
    setJoinPending(false);
    if (r.success) {
      setJoinMessage(restricted.community.type === "public" ? "Joined — refreshing…" : "Request sent — moderators will review it.");
      if (restricted.community.type === "public") {
        setTimeout(() => window.location.reload(), 600);
      }
    } else {
      setJoinMessage(r.message || "Could not send join request");
    }
  };

  const sortedComments = [...comments].sort((a, b) => {
    if (commentSort === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (commentSort === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return b.likesCount - a.likesCount;
  });

  const handleLike = async () => {
    if (!user || !postId) return;
    if (liked) {
      const r = await postApi.unlike(postId);
      if (r.success) setLiked(false);
    } else {
      const r = await postApi.like(postId);
      if (r.success) setLiked(true);
    }
  };

  const handleDelete = async () => {
    if (!user || !postId || !window.confirm("Delete this post permanently?")) return;
    setDeleting(true);
    const r = await postApi.delete(postId);
    setDeleting(false);
    if (r.success) navigate("/feed");
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim() || !user || !postId) return;
    setSubmitting(true);
    setError("");
    const r = await commentApi.create(postId, newComment.trim(), replyingTo || undefined);
    setSubmitting(false);
    if (r.success && r.data) {
      setComments([...comments, r.data]);
      setNewComment("");
      setReplyingTo(null);
    } else {
      setError(r.message || "Failed to post comment");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-pn-bg flex items-center justify-center">
        <div className="text-pn-muted">Loading...</div>
      </div>
    );
  }

  if (restricted) {
    const initial = restricted.community.name?.charAt(0)?.toUpperCase() || "C";
    const isPrivate = restricted.community.type === "private";
    return (
      <div className="min-h-screen bg-pn-bg font-['DM_Sans',sans-serif] text-pn-navy">
        <AppNavbar />
        <div className="max-w-[680px] mx-auto px-6 py-12">
          <Link to="/feed" className="inline-flex items-center gap-2 text-pn-steel font-semibold mb-6 hover:text-pn-navy">
            <ArrowLeft className="w-4 h-4" /> Back to feed
          </Link>

          <div className="relative bg-pn-white border border-pn-border rounded-[22px] p-8 shadow-[0_10px_30px_rgba(53,88,114,0.07)] overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-pn-sky/15 blur-3xl pointer-events-none" />

            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-pn-sky to-pn-steel flex items-center justify-center text-[1.25rem] font-bold text-white shrink-0">
                {initial}
              </div>
              <div>
                <div className="text-[0.7rem] font-bold uppercase tracking-wider text-pn-lm leading-none">
                  {isPrivate ? "Private community" : "Community"}
                </div>
                <div className="font-['Cormorant_Garamond',serif] text-[1.4rem] font-semibold text-pn-navy leading-tight mt-[2px]">
                  {restricted.community.name}
                </div>
              </div>
            </div>

            <h1 className="font-['Cormorant_Garamond',serif] text-[1.55rem] font-bold text-pn-navy leading-tight mb-2">
              {restricted.post.title}
            </h1>
            <div className="text-[0.82rem] text-pn-muted mb-6">
              by <span className="font-semibold text-pn-steel">@{restricted.post.authorUsername || "unknown"}</span> · {timeAgo(restricted.post.createdAt)}
            </div>

            <div className="relative bg-pn-bg border border-pn-border rounded-xl p-5 mb-6 select-none">
              <div className="space-y-2">
                <div className="h-3 rounded bg-pn-border/60 w-[92%]" />
                <div className="h-3 rounded bg-pn-border/60 w-[78%]" />
                <div className="h-3 rounded bg-pn-border/60 w-[85%]" />
                <div className="h-3 rounded bg-pn-border/60 w-[64%]" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent via-pn-bg/40 to-pn-bg/95 rounded-xl">
                <div className="text-center">
                  <div className="text-[0.7rem] font-bold uppercase tracking-wider text-pn-lm mb-1">Members only</div>
                  <div className="text-[0.9rem] text-pn-muted">Join {restricted.community.name} to read the full post and comments.</div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleJoinCommunity}
                disabled={joinPending}
                className="inline-flex items-center gap-2 bg-pn-steel hover:bg-[#2a4760] text-white font-semibold text-[0.9rem] px-6 py-[10px] rounded-xl shadow-[0_6px_18px_rgba(53,88,114,0.22)] disabled:opacity-50 cursor-pointer transition-all"
              >
                {joinPending ? "Sending…" : (isPrivate ? "+ Request to Join" : "+ Join Community")}
              </button>
              <Link
                to={`/community/${restricted.community.id}`}
                className="inline-flex items-center gap-2 text-pn-steel font-semibold text-[0.88rem] px-5 py-[10px] rounded-xl border border-pn-border hover:border-pn-sky transition-all"
              >
                View community →
              </Link>
            </div>

            {joinMessage && (
              <div className="mt-4 text-[0.82rem] text-pn-steel bg-[rgba(122,170,206,0.12)] border border-[rgba(122,170,206,0.3)] rounded-lg px-4 py-2">
                {joinMessage}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-pn-bg font-['DM_Sans',sans-serif] text-pn-navy">
        <AppNavbar />
        <div className="max-w-[800px] mx-auto px-6 py-16 text-center">
          <h1 className="text-2xl font-bold text-pn-navy mb-3">Post not found</h1>
          <Link to="/feed" className="inline-flex items-center gap-2 text-pn-steel font-semibold hover:text-pn-navy">
            <ArrowLeft className="w-4 h-4" /> Back to feed
          </Link>
        </div>
      </div>
    );
  }

  const isAuthor = user?.id === post.authorId;
  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-screen bg-pn-bg font-['DM_Sans',sans-serif] text-pn-navy">
      <AppNavbar />

      <div className="max-w-[800px] mx-auto px-6 py-8">
        <Link to="/feed" className="inline-flex items-center gap-2 text-pn-steel font-semibold mb-6 hover:text-pn-navy">
          <ArrowLeft className="w-4 h-4" /> Back to feed
        </Link>

        {/* Post */}
        <div className="bg-pn-white border border-pn-border rounded-[20px] p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-pn-steel text-white flex items-center justify-center font-bold">
                {post.authorUsername?.charAt(0)?.toUpperCase() ?? "U"}
              </div>
              <div>
                <div className="font-semibold text-pn-navy">{post.authorUsername ?? `User #${post.authorId}`}</div>
                <div className="text-sm text-pn-lm">{timeAgo(post.createdAt)}</div>
              </div>
            </div>
            {(isAuthor || isAdmin) && (
              <div className="flex gap-2">
                <Link to={`/posts/${postId}/edit`} className="text-sm font-semibold text-pn-steel px-3 py-1 rounded-lg border border-pn-border hover:border-pn-sky">
                  Edit
                </Link>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-sm font-semibold text-red-600 px-3 py-1 rounded-lg border border-red-200 hover:bg-red-50 disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            )}
          </div>

          <h1 className="text-2xl font-bold text-pn-navy mb-4 leading-[1.3]">{post.title}</h1>
          <MarkdownRenderer content={post.content} variant="light" className="text-[0.95rem] leading-[1.75]" />

          {post.mediaAttachment && (
            <img src={post.mediaAttachment} alt="Post media" className="w-full rounded-[12px] mb-4 max-h-[400px] object-cover" />
          )}

          {post.tags && post.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-4">
              {post.tags.map((t) => (
                <span key={t} className="text-xs font-semibold text-pn-steel bg-[rgba(53,88,114,0.08)] px-3 py-1 rounded-full">
                  {t}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-6 pt-4 border-t border-pn-border">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-lg transition-all ${
                liked
                  ? "text-red-600 bg-[rgba(220,38,38,0.1)]"
                  : "text-pn-muted hover:text-red-600 hover:bg-[rgba(220,38,38,0.05)]"
              }`}
            >
              <Heart className="w-4 h-4" fill={liked ? "currentColor" : "none"} />
              {liveLikesCount}
            </button>
            <div className="flex items-center gap-2 text-sm font-semibold text-pn-muted">
              <MessageCircle className="w-4 h-4" />
              {comments.length}
            </div>
          </div>
        </div>

        {/* Comments */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-pn-navy">Comments ({comments.length})</h2>
            <div
              role="tablist"
              aria-label="Sort comments"
              className="inline-flex items-center gap-[3px] bg-pn-white border border-pn-border rounded-[10px] p-[3px]"
            >
              {COMMENT_SORTS.map((opt) => {
                const active = commentSort === opt.key;
                return (
                  <button
                    key={opt.key}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setCommentSort(opt.key)}
                    className={`text-[0.75rem] font-semibold px-[10px] py-[5px] rounded-[7px] transition-all ${
                      active
                        ? "bg-pn-steel text-white"
                        : "text-pn-muted hover:text-pn-steel cursor-pointer"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comment input */}
          <div
            className={`bg-pn-white border rounded-[16px] p-3 mb-5 transition-all ${
              inputFocused || newComment.length > 0 || replyingTo
                ? "border-pn-sky shadow-[0_2px_14px_rgba(122,170,206,0.18)]"
                : "border-pn-border"
            }`}
          >
            {replyingTo && (
              <div className="flex items-center justify-between mb-2 px-1 text-[0.72rem] text-pn-muted">
                <span className="inline-flex items-center gap-1.5">
                  <ReplyIcon className="w-3 h-3 text-pn-sky" />
                  Replying to thread
                </span>
                <button
                  onClick={() => { setReplyingTo(null); setNewComment(""); }}
                  className="text-pn-lm hover:text-pn-navy font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
            <div className="flex gap-2 items-end">
              <CommentAvatar
                username={user?.username}
                profilePicture={user?.profilePicture}
                size="sm"
                linkable={false}
              />
              <textarea
                ref={commentInputRef}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder={replyingTo ? "Write a reply…" : "Share your thoughts…"}
                className={`flex-1 bg-transparent text-[0.95rem] text-pn-navy placeholder-pn-lm outline-none resize-none py-2 leading-[1.55] transition-all ${
                  inputFocused || newComment.length > 0 ? "min-h-[84px]" : "min-h-[40px]"
                }`}
              />
            </div>
            {error && <div className="mt-2 ml-11 text-[0.78rem] text-red-600">{error}</div>}
            <div className="flex items-center justify-between mt-2 ml-11">
              <span className={`text-[0.7rem] transition-opacity ${newComment.length > 0 ? "text-pn-lm opacity-100" : "opacity-0"}`}>
                Use <span className="font-semibold text-pn-steel">@</span> to mention someone
              </span>
              <button
                onClick={handleCommentSubmit}
                disabled={submitting || !newComment.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-[7px] text-[0.82rem] font-semibold text-white bg-pn-sky hover:bg-pn-steel rounded-lg shadow-[0_2px_8px_rgba(122,170,206,0.35)] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {submitting ? "Posting…" : (replyingTo ? "Reply" : "Post")}
              </button>
            </div>
          </div>

          {/* Comments list */}
          {sortedComments.length === 0 ? (
            <div className="text-center py-10 text-pn-muted">
              <p className="text-sm">No comments yet. Be the first!</p>
            </div>
          ) : (
            <div className="space-y-5">
              {sortedComments
                .filter((c) => !c.parentId)
                .map((comment) => {
                  const replies = sortedComments.filter((c) => c.parentId === comment.id);
                  return (
                    <div key={comment.id} className="relative">
                      <CommentBubble
                        comment={comment}
                        depth={0}
                        liked={commentLikes.has(comment.id)}
                        reported={comment.reported || reportedComments.has(comment.id)}
                        isPostAuthor={comment.authorId === post.authorId}
                        onReply={() => startReply(comment.id, comment.authorUsername)}
                        onToggleLike={() => toggleCommentLike(comment.id)}
                        onReport={() => handleReport(comment.id)}
                      />

                      {replies.length > 0 && (
                        <div className="mt-3 ml-5 space-y-3 relative">
                          {/* shared vertical thread line behind all replies */}
                          <span
                            aria-hidden="true"
                            className="absolute left-0 top-0 bottom-7 w-px bg-pn-border"
                          />
                          {replies.map((reply) => (
                            <div key={reply.id} className="relative pl-7">
                              {/* curved hook connecting thread line to this reply */}
                              <span
                                aria-hidden="true"
                                className="absolute left-0 top-0 w-6 h-6 border-l border-b border-pn-border rounded-bl-[12px]"
                              />
                              <CommentBubble
                                comment={reply}
                                depth={1}
                                liked={commentLikes.has(reply.id)}
                                reported={reply.reported || reportedComments.has(reply.id)}
                                isPostAuthor={reply.authorId === post.authorId}
                                onReply={() => startReply(comment.id, reply.authorUsername)}
                                onToggleLike={() => toggleCommentLike(reply.id)}
                                onReport={() => handleReport(reply.id)}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  function toggleCommentLike(id: number) {
    const isLiked = commentLikes.has(id);
    const action = isLiked ? commentApi.unlike(id) : commentApi.like(id);
    action.then((r) => {
      if (!r.success) return;
      const next = new Set(commentLikes);
      if (isLiked) next.delete(id); else next.add(id);
      setCommentLikes(next);
      setComments((prev) =>
        prev.map((c) => (c.id === id ? { ...c, likesCount: c.likesCount + (isLiked ? -1 : 1) } : c))
      );
    });
  }

  async function handleReport(id: number) {
    const r = await commentApi.report(id);
    if (r.success) setReportedComments(new Set([...reportedComments, id]));
  }
}

/* ─────────────────────────────  Comment bubble  ───────────────────────────── */

type CommentBubbleProps = {
  comment: CommentDto;
  depth: 0 | 1;
  liked: boolean;
  reported: boolean;
  isPostAuthor: boolean;
  onReply: () => void;
  onToggleLike: () => void;
  onReport: () => void;
};

const MENTION_RE = /(@[a-zA-Z0-9_-]+)/g;

function renderCommentBody(content: string, mentions: { username: string; userId: number }[] = []) {
  const map = new Map(mentions.map((m) => [m.username.toLowerCase(), m.userId]));
  const parts = content.split(MENTION_RE);
  return parts.map((part, i) => {
    if (part.startsWith("@")) {
      const name = part.slice(1).toLowerCase();
      const userId = map.get(name);
      if (userId) {
        return (
          <Link
            key={i}
            to={`/users/${userId}`}
            className="text-pn-sky hover:text-pn-steel font-semibold transition-colors"
          >
            {part}
          </Link>
        );
      }
      return (
        <span key={i} className="text-pn-sky font-semibold">
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function CommentBubble({
  comment,
  depth,
  liked,
  reported,
  isPostAuthor,
  onReply,
  onToggleLike,
  onReport,
}: CommentBubbleProps) {
  const isReply = depth === 1;
  const username = comment.authorUsername || `user${comment.authorId}`;
  const hasLikes = comment.likesCount > 0;

  return (
    <div
      className={`group/comment relative flex gap-3 bg-pn-white border border-pn-border rounded-[18px] px-4 py-3 transition-all hover:border-pn-sky/60 hover:bg-[rgba(122,170,206,0.04)] hover:shadow-[0_4px_18px_rgba(53,88,114,0.08)] ${
        isReply ? "rounded-tl-[6px]" : ""
      }`}
    >
      <CommentAvatar
        username={comment.authorUsername}
        profilePicture={comment.authorProfilePicture}
        userId={comment.authorId}
        size={isReply ? "sm" : "md"}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <Link
            to={`/users/${comment.authorId}`}
            className={`font-semibold text-pn-navy hover:text-pn-steel transition-colors leading-tight ${
              isReply ? "text-[0.88rem]" : "text-[0.95rem]"
            }`}
          >
            @{username}
          </Link>
          {isPostAuthor && (
            <span className="text-[0.6rem] font-bold uppercase tracking-wider text-pn-steel bg-[rgba(122,170,206,0.18)] border border-[rgba(122,170,206,0.35)] px-[7px] py-[1px] rounded-full leading-[1.4]">
              Author
            </span>
          )}
          <span className="text-pn-border leading-none">·</span>
          <span className={`text-pn-lm ${isReply ? "text-[0.7rem]" : "text-[0.72rem]"}`}>
            {timeAgo(comment.createdAt)}
          </span>
          {reported && (
            <span className="ml-auto text-[0.65rem] font-semibold uppercase tracking-wider text-orange-600 bg-orange-50 border border-orange-200 px-2 py-[1px] rounded-full">
              Reported
            </span>
          )}
        </div>

        <p
          className={`mt-1 leading-[1.6] whitespace-pre-wrap ${
            comment.deleted ? "text-pn-lm italic" : "text-pn-navy"
          } ${isReply ? "text-[0.92rem]" : "text-[1rem]"}`}
        >
          {comment.deleted ? comment.content : renderCommentBody(comment.content, comment.mentions)}
        </p>

        <div className="flex items-center gap-1 mt-2 -ml-2">
          <button
            onClick={onToggleLike}
            className={`group/like flex items-center gap-1.5 text-[0.75rem] font-semibold px-2 py-1 rounded-md transition-all cursor-pointer ${
              liked
                ? "text-red-600 bg-[rgba(220,38,38,0.08)]"
                : hasLikes
                  ? "text-red-500/80 hover:text-red-600 hover:bg-[rgba(220,38,38,0.06)]"
                  : "text-pn-muted hover:text-red-600 hover:bg-[rgba(220,38,38,0.06)]"
            }`}
            aria-label={liked ? "Unlike" : "Like"}
          >
            <Heart
              className={`w-4 h-4 transition-transform ${liked ? "scale-110" : "group-hover/like:scale-110"}`}
              fill={liked ? "currentColor" : "none"}
            />
            {hasLikes && <span>{comment.likesCount}</span>}
          </button>
          <button
            onClick={onReply}
            className="flex items-center gap-1.5 text-[0.75rem] font-semibold text-pn-muted hover:text-pn-steel px-2 py-1 rounded-md hover:bg-[rgba(53,88,114,0.06)] transition-all cursor-pointer"
          >
            <ReplyIcon className="w-3.5 h-3.5" />
            Reply
          </button>
          <button
            onClick={onReport}
            disabled={reported}
            className={`flex items-center gap-1.5 text-[0.75rem] font-semibold px-2 py-1 rounded-md transition-all ${
              reported
                ? "text-orange-600/60 cursor-not-allowed"
                : "text-pn-muted hover:text-orange-600 hover:bg-[rgba(234,88,12,0.06)] cursor-pointer"
            }`}
          >
            <Flag className="w-3 h-3" />
            Report
          </button>
        </div>
      </div>
    </div>
  );
}
