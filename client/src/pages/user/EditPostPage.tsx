import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { postApi } from "../../api_services/posts/PostAPIService";
import { AppNavbar } from "../../components/layout/AppNavbar";

export default function EditPostPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaAttachment, setMediaAttachment] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const allTags = ["Browser APIs", "Performance", "React", "DX", "Design Tokens", "Accessibility", "DevOps", "ML / AI"];

  useEffect(() => {
    if (!id) return;
    postApi.getById(Number(id)).then((r) => {
      if (r.success && r.data) {
        setTitle(r.data.title);
        setContent(r.data.content);
        setMediaAttachment(r.data.mediaAttachment ?? "");
        if (r.data.tags) setSelectedTags(r.data.tags);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    });
  }, [id]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : prev.length < 5 ? [...prev, tag] : prev);
  };

  const handleSave = async () => {
    if (!id || !title || !content) return;
    setSubmitting(true);
    setErrorMsg("");
    const r = await postApi.update(Number(id), { title, content, mediaAttachment: mediaAttachment || undefined });
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
              Tags <span className="text-[0.72rem] font-normal text-pn-lm">Optional</span>
            </label>
            <div className="bg-pn-bg border-[1.5px] border-pn-border rounded-xl p-[14px]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[0.78rem] text-pn-lm">{selectedTags.length} selected</span>
                <span onClick={() => setSelectedTags([])} className="text-[0.75rem] font-semibold text-pn-steel cursor-pointer">Clear all</span>
              </div>
              <div className="flex flex-wrap gap-[7px]">
                {allTags.map((tag) => (
                  <span key={tag} onClick={() => toggleTag(tag)}
                    className={`text-[0.78rem] font-semibold px-[13px] py-[5px] rounded-full cursor-pointer transition-all ${
                      selectedTags.includes(tag)
                        ? "bg-pn-steel text-white border-pn-steel border"
                        : "text-pn-muted bg-pn-white border border-pn-border hover:border-pn-sky hover:text-pn-steel"
                    }`}>
                    {tag}
                  </span>
                ))}
              </div>
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
