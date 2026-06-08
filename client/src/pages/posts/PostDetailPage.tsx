import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AppNavbar } from "../../components/layout/AppNavbar";
import { MarkdownRenderer } from "../../components/ui/MarkdownRenderer";
import { postApi } from "../../api_services/posts/PostAPIService";
import { tagApi } from "../../api_services/tags/TagAPIService";
import type { PostDto } from "../../types/post/PostTypes";
import type { TagDto } from "../../types/tag/TagTypes";

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.max(0, Math.floor(diff / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
};

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<PostDto | null>(null);
  const [tags, setTags] = useState<TagDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setNotFound(false);
    setImageFailed(false);

    Promise.all([postApi.getById(Number(id)), tagApi.getAll()]).then(([postRes, tagRes]) => {
      if (postRes.success && postRes.data) {
        setPost(postRes.data);
      } else {
        setNotFound(true);
      }

      if (tagRes.success && tagRes.data) setTags(tagRes.data);
      setLoading(false);
    });
  }, [id]);

  const postTags = useMemo(() => {
    if (!post) return [];
    if (post.tags && post.tags.length > 0) return post.tags;
    return (post.tagIds ?? [])
      .map((tagId) => tags.find((tag) => tag.id === tagId)?.name)
      .filter((tagName): tagName is string => Boolean(tagName));
  }, [post, tags]);

  if (loading) {
    return (
      <div className="min-h-screen bg-pn-bg font-['DM_Sans',sans-serif] text-pn-navy">
        <AppNavbar />
        <main className="max-w-[900px] mx-auto px-6 py-10">
          <div className="bg-pn-white border border-pn-border rounded-[22px] p-7">
            <div className="h-4 w-32 rounded bg-pn-surface animate-pulse mb-5" />
            <div className="h-9 w-3/4 rounded bg-pn-surface animate-pulse mb-4" />
            <div className="h-4 w-full rounded bg-pn-surface animate-pulse mb-2" />
            <div className="h-4 w-5/6 rounded bg-pn-surface animate-pulse" />
          </div>
        </main>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-pn-bg font-['DM_Sans',sans-serif] text-pn-navy">
        <AppNavbar />
        <main className="max-w-[760px] mx-auto px-6 py-16 text-center">
          <div className="bg-pn-white border border-pn-border rounded-[22px] p-9">
            <p className="font-['Cormorant_Garamond',serif] text-[1.45rem] font-semibold text-pn-navy mb-2">Post not found</p>
            <p className="text-[0.9rem] text-pn-muted mb-5">This post is unavailable or you do not have access to it.</p>
            <Link to="/feed" className="inline-flex items-center justify-center bg-pn-steel text-white font-semibold text-[0.9rem] px-5 py-3 rounded-xl">
              Back to feed
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pn-bg font-['DM_Sans',sans-serif] text-pn-navy">
      <AppNavbar />

      <main className="max-w-[900px] mx-auto px-6 py-9 pb-20">
        <div className="flex items-center gap-2 text-[0.82rem] text-pn-lm mb-5">
          <Link to="/feed" className="text-pn-lm hover:text-pn-steel">Feed</Link>
          <span className="text-pn-border">&rsaquo;</span>
          <Link to={`/community/${post.communityId}`} className="text-pn-lm hover:text-pn-steel">
            {post.communityName ?? `Community #${post.communityId}`}
          </Link>
          <span className="text-pn-border">&rsaquo;</span>
          <span className="text-pn-steel font-semibold">Post</span>
        </div>

        <article className="bg-pn-white border border-pn-border rounded-[24px] overflow-hidden shadow-[0_10px_32px_rgba(53,88,114,0.07)]">
          <header className="px-7 pt-7 pb-5 border-b border-pn-surface">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pn-sky to-pn-steel shrink-0 flex items-center justify-center text-[0.9rem] font-bold text-white">
                {post.authorUsername?.charAt(0)?.toUpperCase() ?? "U"}
              </div>
              <div className="min-w-0">
                <div className="text-[0.9rem] font-semibold text-pn-navy">{post.authorUsername ?? `User #${post.authorId}`}</div>
                <div className="text-[0.75rem] text-pn-lm">{timeAgo(post.createdAt)}</div>
              </div>
            </div>

            <h1 className="font-['Cormorant_Garamond',serif] text-[2.25rem] max-sm:text-[1.75rem] font-bold text-pn-navy leading-[1.08] mb-4">
              {post.title}
            </h1>

            {postTags.length > 0 && (
              <div className="flex gap-[7px] flex-wrap">
                {postTags.map((tag) => (
                  <span key={tag} className="text-[0.74rem] font-semibold text-pn-steel bg-[rgba(53,88,114,0.08)] border border-[rgba(53,88,114,0.14)] px-[10px] py-[4px] rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          <div className="px-7 py-7">
            <MarkdownRenderer
              content={post.content}
              variant="light"
              className="text-[0.95rem] leading-[1.75]"
            />

            {post.mediaAttachment && !imageFailed && (
              <figure className="mt-7 overflow-hidden rounded-[18px] border border-pn-border bg-pn-bg">
                <img
                  src={post.mediaAttachment}
                  alt=""
                  onError={() => setImageFailed(true)}
                  className="w-full max-h-[520px] object-cover block"
                />
              </figure>
            )}
          </div>

          <footer className="flex items-center gap-4 px-7 py-4 border-t border-pn-surface text-[0.84rem] text-pn-lm font-medium">
            <span>{post.likesCount} likes</span>
            <span>{post.commentsCount} comments</span>
          </footer>
        </article>
      </main>
    </div>
  );
}
