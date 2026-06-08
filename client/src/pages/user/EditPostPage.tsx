import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { postApi } from "../../api_services/posts/PostAPIService";
import { tagApi } from "../../api_services/tags/TagAPIService";
import { useAuth } from "../../hooks/auth/useAuthHook";
import { AppNavbar } from "../../components/layout/AppNavbar";
import type { TagDto } from "../../types/tag/TagTypes";

export default function EditPostPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const TAG_LIMIT = 5;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaAttachment, setMediaAttachment] = useState("");
  const [allTags, setAllTags] = useState<TagDto[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [tagSearch, setTagSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [notAuthorized, setNotAuthorized] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!id) return;
    postApi.getById(Number(id)).then((r) => {
      if (r.success && r.data) {
        // Authorization: only the post author or an admin can edit
        const isOwner = user?.id === r.data.authorId;
        const isAdmin = user?.role === "admin";
        if (user && !isOwner && !isAdmin) {
          setNotAuthorized(true);
          setLoading(false);
          return;
        }
        setTitle(r.data.title);
        setContent(r.data.content);
        setMediaAttachment(r.data.mediaAttachment ?? "");
        if (Array.isArray(r.data.tagIds)) setSelectedTagIds(r.data.tagIds);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    });
  }, [id, user]);

  useEffect(() => {
    setTagsLoading(true);
    tagApi.getAll().then((r) => {
      if (r.success && r.data) setAllTags(r.data);
      setTagsLoading(false);
    });
  }, []);

  const toggleTagId = (tagId: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((t) => t !== tagId)
        : prev.length < TAG_LIMIT
        ? [...prev, tagId]
        : prev
    );
  };

  const visibleTags = tagSearch.trim()
    ? allTags.filter((t) => t.name.toLowerCase().includes(tagSearch.trim().toLowerCase()))
    : allTags;

  const handleSave = async () => {
    if (!id || !title || !content) return;
    setSubmitting(true);
    setErrorMsg("");
    const r = await postApi.update(Number(id), {
      title,
      content,
      mediaAttachment: mediaAttachment || undefined,
      tagIds: selectedTagIds,
    });
    setSubmitting(false);
    if (r.success) {
      navigate(`/posts/${id}`);
    } else {
      setErrorMsg(r.message || "Failed to save changes");
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm("Delete this post permanently?")) return;
    const r = await postApi.delete(Number(id));
    if (r.success) navigate("/feed");
    else setErrorMsg(r.message || "Failed to delete post");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-pn-bg flex items-center justify-center">
        <div className="text-pn-muted text-sm">Loading...</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-pn-bg font-['DM_Sans',sans-serif] text-pn-navy">
        <AppNavbar />
        <div className="max-w-[800px] mx-auto px-6 py-16 text-center text-pn-muted">
          <p className="text-lg mb-3">Post not found</p>
          <Link to="/feed" className="text-pn-steel font-semibold">Back to feed</Link>
        </div>
      </div>
    );
  }

  if (notAuthorized) {
    return (
      <div className="min-h-screen bg-pn-bg font-['DM_Sans',sans-serif] text-pn-navy">
        <AppNavbar />
        <div className="max-w-[800px] mx-auto px-6 py-16 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[rgba(180,60,60,0.1)] text-[#9B3A3A] text-2xl mb-5">
            &#128683;
          </div>
          <h1 className="text-xl font-bold text-pn-navy mb-2">Access Denied</h1>
          <p className="text-sm text-pn-muted mb-6">You can only edit posts that you authored.</p>
          <Link to="/feed" className="inline-flex items-center gap-2 text-sm font-semibold text-pn-steel px-5 py-2 rounded-lg border border-pn-border hover:border-pn-sky">
            Back to feed
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pn-bg font-['DM_Sans',sans-serif] text-pn-navy">
      <AppNavbar />

      <div className="max-w-[800px] mx-auto px-6 py-9 pb-20">
        <div className="flex items-center gap-[6px] text-[0.78rem] text-pn-lm mb-[18px]">
          <Link to="/feed" className="text-pn-lm hover:text-pn-steel">Feed</Link>
          <span>›</span>
          <Link to={`/posts/${id}`} className="text-pn-lm hover:text-pn-steel">Post</Link>
          <span>›</span>
          <span className="text-pn-steel font-semibold">Edit</span>
        </div>

        <div className="bg-[rgba(53,88,114,0.06)] border border-[rgba(53,88,114,0.15)] rounded-[14px] px-[18px] py-3 mb-5 flex items-center gap-[10px]">
          <span className="text-[1rem]">✎</span>
          <span className="text-[0.83rem] text-pn-steel font-medium">
            You are editing your post. Changes will be visible to all community members.{' '}
            <Link to={`/posts/${id}`} className="text-pn-steel font-bold">Discard and go back →</Link>
          </span>
        </div>

        <div className="inline-flex items-center gap-2 bg-[rgba(195,150,40,0.1)] border border-[rgba(195,150,40,0.2)] rounded-full px-4 py-[6px] text-[0.75rem] font-semibold text-[#7A6020] uppercase tracking-wider mb-5">
          <span className="w-[7px] h-[7px] rounded-full bg-[#B87E20]" />
          Edit Post
        </div>
        <h1 className="font-['Cormorant_Garamond',serif] text-[clamp(1.8rem,4vw,2.4rem)] font-bold text-pn-navy mb-[6px]">Edit Post</h1>

        <div className="bg-pn-white border border-pn-border rounded-[24px] p-9 max-sm:p-5 shadow-[0_10px_32px_rgba(53,88,114,0.07)] mt-5">
          <div className="font-['Cormorant_Garamond',serif] text-[1.3rem] font-semibold text-pn-navy mb-1">Post Content</div>
          <p className="text-[0.82rem] text-pn-muted mb-6">All fields are pre-filled with the current post content. Edit and save when ready.</p>

          <div className="mb-5">
            <label className="flex items-center justify-between text-[0.82rem] font-semibold text-pn-steel mb-2">
              Title <span className="text-[0.72rem] font-normal text-pn-lm">{title.length} / 200</span>
            </label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value.slice(0, 200))}
              className="w-full px-4 py-3 bg-pn-bg border-[1.5px] border-pn-border rounded-xl text-[0.95rem] text-pn-navy outline-none focus:border-pn-sky transition-colors" />
          </div>

          <div className="mb-5">
            <label className="flex items-center justify-between text-[0.82rem] font-semibold text-pn-steel mb-2">
              Content <span className="text-[0.72rem] font-normal text-pn-lm">{content.length} / 10,000</span>
            </label>
            <textarea value={content} onChange={(e) => setContent(e.target.value.slice(0, 10000))}
              className="w-full min-h-[240px] px-4 py-[14px] bg-pn-bg border-[1.5px] border-pn-border rounded-xl outline-none focus:border-pn-sky text-[0.9rem] text-pn-navy leading-[1.7] resize-y transition-colors" />
          </div>

          <div className="h-px bg-pn-surface my-6" />

          <div className="mb-5">
            <label className="text-[0.82rem] font-semibold text-pn-steel mb-2 flex items-center gap-1">
              Image URL <span className="text-[0.72rem] font-normal text-pn-lm">Optional</span>
            </label>
            <input type="url" value={mediaAttachment} onChange={(e) => setMediaAttachment(e.target.value)}
              className="w-full px-4 py-3 bg-pn-bg border-[1.5px] border-pn-border rounded-xl text-[0.95rem] text-pn-navy outline-none focus:border-pn-sky transition-colors"
              placeholder="https://example.com/image.png" />
          </div>

          <div className="h-px bg-pn-surface my-6" />

          <div className="mb-5">
            <label className="text-[0.82rem] font-semibold text-pn-steel mb-2 flex items-center gap-1">
              Tags <span className="text-[0.72rem] font-normal text-pn-lm">Optional — up to {TAG_LIMIT}</span>
            </label>
            <div className="bg-pn-bg border-[1.5px] border-pn-border rounded-xl p-[14px]">
              <div className="flex items-center justify-between gap-3 mb-3">
                <span className="text-[0.78rem] text-pn-lm">
                  <strong className="text-pn-steel font-semibold">{selectedTagIds.length}</strong> / {TAG_LIMIT} selected
                </span>
                {selectedTagIds.length > 0 && (
                  <button type="button" onClick={() => setSelectedTagIds([])}
                    className="text-[0.75rem] font-semibold text-pn-steel hover:text-pn-navy cursor-pointer">
                    Clear all
                  </button>
                )}
              </div>

              {allTags.length > 8 && (
                <input
                  type="text"
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  placeholder="Filter tags…"
                  className="w-full bg-pn-white border border-pn-border rounded-lg px-3 py-[7px] text-[0.82rem] text-pn-navy outline-none placeholder:text-pn-lm focus:border-pn-sky transition-colors mb-3"
                />
              )}

              {tagsLoading ? (
                <div className="text-[0.78rem] text-pn-lm italic py-2">Loading tags…</div>
              ) : allTags.length === 0 ? (
                <div className="text-[0.78rem] text-pn-lm italic py-2">No tags available yet.</div>
              ) : visibleTags.length === 0 ? (
                <div className="text-[0.78rem] text-pn-lm italic py-2">No tags match "{tagSearch}".</div>
              ) : (
                <div className="flex flex-wrap gap-[7px]">
                  {visibleTags.map((tag) => {
                    const active = selectedTagIds.includes(tag.id);
                    const atCap = !active && selectedTagIds.length >= TAG_LIMIT;
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTagId(tag.id)}
                        disabled={atCap}
                        className={`text-[0.78rem] font-semibold px-[13px] py-[5px] rounded-full transition-all border ${
                          active
                            ? "bg-pn-steel text-white border-pn-steel shadow-[0_2px_6px_rgba(53,88,114,0.18)]"
                            : atCap
                            ? "text-pn-lm bg-pn-white border-pn-border opacity-50 cursor-not-allowed"
                            : "text-pn-muted bg-pn-white border-pn-border hover:border-pn-sky hover:text-pn-steel cursor-pointer"
                        }`}
                      >
                        {active && <span className="mr-[5px]">✓</span>}
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {errorMsg && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-[rgba(180,60,60,0.07)] border border-[rgba(180,60,60,0.18)] text-[#9B3A3A] text-[0.85rem]">
              {errorMsg}
            </div>
          )}

          <div className="flex gap-3 mt-7 flex-wrap">
            <button onClick={handleSave} disabled={submitting || !title || !content}
              className="inline-flex items-center justify-center gap-[7px] bg-pn-steel text-white font-semibold text-[0.95rem] px-7 py-[13px] rounded-xl shadow-[0_6px_18px_rgba(53,88,114,0.22)] hover:bg-[#2a4760] disabled:opacity-50 cursor-pointer transition-all">
              {submitting ? "Saving..." : "Save Changes"}
            </button>
            <Link to={`/posts/${id}`}
              className="inline-flex items-center justify-center gap-[7px] bg-pn-white text-pn-steel font-semibold text-[0.95rem] px-6 py-[12px] rounded-xl border-[1.5px] border-pn-border hover:border-pn-sky transition-all">
              Cancel
            </Link>
            <button onClick={handleDelete}
              className="inline-flex items-center justify-center gap-[7px] bg-[rgba(180,60,60,0.07)] text-[#9B3A3A] font-semibold text-[0.875rem] px-5 py-[11px] rounded-xl border border-[rgba(180,60,60,0.18)] ml-auto cursor-pointer hover:bg-[rgba(180,60,60,0.14)] transition-all">
              Delete Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
