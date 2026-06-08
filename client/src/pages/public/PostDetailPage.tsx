import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Heart, MessageCircle, ArrowLeft } from "lucide-react";
import { postApi } from "../../api_services/posts/PostAPIService";
import { commentApi, type CommentDto } from "../../api_services/comments/CommentAPIService";
import { MarkdownRenderer } from "../../components/ui/MarkdownRenderer";
import { useAuth } from "../../hooks/auth/useAuthHook";
import { useLiveLikes } from "../../hooks/posts/useLiveLikesHook";
import { AppNavbar } from "../../components/layout/AppNavbar";
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
  const [liked, setLiked] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [commentLikes, setCommentLikes] = useState<Set<number>>(new Set());
  const [reportedComments, setReportedComments] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [commentSort, setCommentSort] = useState<CommentSortKey>("newest");

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
      } else {
        setNotFound(true);
      }
      if (commRes.success && commRes.data) {
        setComments(commRes.data.items);
      }
      setLoading(false);
    });
  }, [postId]);

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
    const r = await commentApi.create({
      postId,
      content: newComment.trim(),
      parentId: replyingTo || undefined,
    });
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
          <div className="bg-pn-white border border-pn-border rounded-[14px] p-4 mb-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
              className="w-full bg-pn-bg border border-pn-border rounded-lg px-3 py-2 text-sm text-pn-navy outline-none focus:border-pn-sky resize-none"
              rows={3}
            />
            {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
            <div className="flex gap-2 justify-end mt-3">
              {replyingTo && (
                <button
                  onClick={() => { setReplyingTo(null); setNewComment(""); }}
                  className="px-3 py-2 text-sm font-semibold text-pn-muted hover:text-pn-navy border border-pn-border rounded-lg"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleCommentSubmit}
                disabled={submitting || !newComment.trim()}
                className="px-4 py-2 text-sm font-semibold text-white bg-pn-steel rounded-lg hover:bg-[#2a4760] disabled:opacity-50"
              >
                {submitting ? "Posting..." : "Post"}
              </button>
            </div>
          </div>

          {/* Comments list */}
          {sortedComments.length === 0 ? (
            <div className="text-center py-10 text-pn-muted">
              <p className="text-sm">No comments yet. Be the first!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedComments
                .filter((c) => !c.parentId)
                .map((comment) => (
                  <div key={comment.id} className="bg-pn-white border border-pn-border rounded-[14px] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold text-pn-navy">
                          {comment.authorUsername ?? `User #${comment.authorId}`}
                        </div>
                        <span className="text-xs text-pn-lm">{timeAgo(comment.createdAt)}</span>
                      </div>
                      {(comment.reported || reportedComments.has(comment.id)) && (
                        <span className="text-xs font-semibold text-orange-600">Reported</span>
                      )}
                    </div>
                    <p className={`text-sm ${comment.deleted ? "text-pn-lm italic" : "text-pn-navy"}`}>
                      {comment.content}
                    </p>
                    <div className="flex gap-3 mt-3 text-xs">
                      <button
                        onClick={() => setReplyingTo(comment.id)}
                        className="font-semibold text-pn-steel hover:text-pn-navy"
                      >
                        Reply
                      </button>
                      <button
                        onClick={async () => {
                          const liked = commentLikes.has(comment.id);
                          if (liked) {
                            const r = await commentApi.unlike(comment.id);
                            if (r.success) {
                              const newSet = new Set(commentLikes);
                              newSet.delete(comment.id);
                              setCommentLikes(newSet);
                              const updated = comments.map((c) =>
                                c.id === comment.id ? { ...c, likesCount: c.likesCount - 1 } : c
                              );
                              setComments(updated);
                            }
                          } else {
                            const r = await commentApi.like(comment.id);
                            if (r.success) {
                              commentLikes.add(comment.id);
                              setCommentLikes(new Set(commentLikes));
                              const updated = comments.map((c) =>
                                c.id === comment.id ? { ...c, likesCount: c.likesCount + 1 } : c
                              );
                              setComments(updated);
                            }
                          }
                        }}
                        className={`font-semibold flex items-center gap-1 ${
                          commentLikes.has(comment.id) ? "text-red-600" : "text-pn-lm hover:text-red-600"
                        }`}
                      >
                        <Heart className="w-3 h-3" fill={commentLikes.has(comment.id) ? "currentColor" : "none"} />
                        {comment.likesCount}
                      </button>
                      <button
                        onClick={async () => {
                          const r = await commentApi.report(comment.id);
                          if (r.success) {
                            setReportedComments(new Set([...reportedComments, comment.id]));
                          }
                        }}
                        disabled={reportedComments.has(comment.id)}
                        className={`font-semibold text-xs ${
                          reportedComments.has(comment.id)
                            ? "text-orange-600 opacity-50 cursor-not-allowed"
                            : "text-pn-lm hover:text-orange-600"
                        }`}
                      >
                        Report
                      </button>
                    </div>

                    {/* Replies (max depth 2) */}
                    <div className="mt-3 border-l-2 border-pn-border pl-4 space-y-2">
                      {sortedComments
                        .filter((c) => c.parentId === comment.id)
                        .map((reply) => (
                          <div key={reply.id} className="bg-pn-bg rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-pn-navy">
                                  {reply.authorUsername ?? `User #${reply.authorId}`}
                                </span>
                                <span className="text-xs text-pn-lm">{timeAgo(reply.createdAt)}</span>
                              </div>
                              {(reply.reported || reportedComments.has(reply.id)) && (
                                <span className="text-xs font-semibold text-orange-600">Reported</span>
                              )}
                            </div>
                            <p className={`text-xs ${reply.deleted ? "text-pn-lm italic" : "text-pn-navy"}`}>
                              {reply.content}
                            </p>
                            <div className="flex gap-3 mt-2 text-xs">
                              <button
                                onClick={async () => {
                                  const liked = commentLikes.has(reply.id);
                                  if (liked) {
                                    const r = await commentApi.unlike(reply.id);
                                    if (r.success) {
                                      const newSet = new Set(commentLikes);
                                      newSet.delete(reply.id);
                                      setCommentLikes(newSet);
                                    }
                                  } else {
                                    const r = await commentApi.like(reply.id);
                                    if (r.success) {
                                      commentLikes.add(reply.id);
                                      setCommentLikes(new Set(commentLikes));
                                    }
                                  }
                                }}
                                className={`font-semibold flex items-center gap-1 ${
                                  commentLikes.has(reply.id) ? "text-red-600" : "text-pn-lm hover:text-red-600"
                                }`}
                              >
                                <Heart className="w-2.5 h-2.5" fill={commentLikes.has(reply.id) ? "currentColor" : "none"} />
                                {reply.likesCount}
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
