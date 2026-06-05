import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { postApi } from "../../api_services/posts/PostAPIService";
import { communityApi } from "../../api_services/communities/CommunityAPIService";
import { AppNavbar } from "../../components/layout/AppNavbar";
import type { CommunityDto } from "../../types/community/CommunityTypes";

export default function CreatePostPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedCommunity = searchParams.get("community");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaAttachment, setMediaAttachment] = useState("");
  const [communityId, setCommunityId] = useState<number>(0);
  const [myCommunities, setMyCommunities] = useState<CommunityDto[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const allTags = ["Design Tokens", "Architecture", "Accessibility", "Components", "Figma", "Style Dictionary", "Governance", "Theming", "Documentation", "ML / AI", "RAG", "DevOps", "Performance", "React", "DX", "Browser APIs"];

  useEffect(() => {
    communityApi.getMine(1, 50).then((r) => {
      if (r.success && r.data) {
        setMyCommunities(r.data.items);
        if (preselectedCommunity) {
          const found = r.data.items.find((c) => c.id === Number(preselectedCommunity));
          if (found) setCommunityId(found.id);
        }
      }
    });
  }, [preselectedCommunity]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : prev.length < 5 ? [...prev, tag] : prev);
  };

  const handleSubmit = async () => {
    if (!title || !content || !communityId) return;
    setSubmitting(true);
    setErrorMsg("");
    const r = await postApi.create({ communityId, title, content, mediaAttachment: mediaAttachment || undefined });
    setSubmitting(false);
    if (r.success && r.data?.id) {
      navigate(`/posts/${r.data.id}`);
    } else {
      setErrorMsg(r.message || "Failed to create post");
    }
  };

  return (
    <div className="min-h-screen bg-pn-bg font-['DM_Sans',sans-serif] text-pn-navy">
      <AppNavbar />

      <div className="max-w-[800px] mx-auto px-6 py-9 pb-20">
        <div className="flex items-center gap-[6px] text-[0.78rem] text-pn-lm mb-[18px]">
          <Link to="/feed" className="text-pn-lm hover:text-pn-steel">Feed</Link>
          <span>›</span>
          {communityId ? (
            <Link to={`/community/${communityId}`} className="text-pn-lm hover:text-pn-steel">
              {myCommunities.find((c) => c.id === communityId)?.name ?? "Community"}
            </Link>
          ) : <span className="text-pn-lm">Community</span>}
          <span>›</span>
          <span className="text-pn-steel font-semibold">Create Post</span>
        </div>

        <div className="inline-flex items-center gap-2 bg-pn-white border border-pn-border rounded-full px-4 py-[6px] text-[0.75rem] font-semibold text-pn-steel uppercase tracking-wider mb-5">
          <span className="w-[7px] h-[7px] rounded-full bg-pn-sky" />
          New Post
        </div>
        <h1 className="font-['Cormorant_Garamond',serif] text-[clamp(1.8rem,4vw,2.4rem)] font-bold text-pn-navy mb-[6px]">Create a Post</h1>
        <p className="text-[0.9rem] text-pn-muted mb-7">
          Posting in <select value={communityId} onChange={(e) => setCommunityId(Number(e.target.value))}
            className="text-pn-steel font-semibold bg-transparent border-none outline-none cursor-pointer">
            <option value={0}>Select a community</option>
            {myCommunities.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {communityId > 0 && <> · Visible to all members</>}
        </p>

        <div className="bg-pn-white border border-pn-border rounded-[24px] p-9 max-sm:p-5 shadow-[0_10px_32px_rgba(53,88,114,0.07)]">
          <div className="font-['Cormorant_Garamond',serif] text-[1.3rem] font-semibold text-pn-navy mb-1">Post Content</div>
          <p className="text-[0.82rem] text-pn-muted mb-6">Write something valuable for the community.</p>

          <div className="mb-5">
            <label className="flex items-center justify-between text-[0.82rem] font-semibold text-pn-steel mb-2">
              Title <span className="text-[0.72rem] font-normal text-pn-lm">{title.length} / 200</span>
            </label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value.slice(0, 200))}
              className="w-full px-4 py-3 bg-pn-bg border-[1.5px] border-pn-border rounded-xl text-[0.95rem] text-pn-navy outline-none focus:border-pn-sky transition-colors"
              placeholder="A clear, descriptive title for your post (5–200 characters)" />
            <div className="text-[0.72rem] text-pn-lm mt-1">Minimum 5 characters · Maximum 200 characters</div>
          </div>

          <div className="mb-5">
            <label className="flex items-center justify-between text-[0.82rem] font-semibold text-pn-steel mb-2">
              Content <span className="text-[0.72rem] font-normal text-pn-lm">{content.length} / 10,000</span>
            </label>
            <textarea value={content} onChange={(e) => setContent(e.target.value.slice(0, 10000))}
              className="w-full min-h-[220px] px-4 py-[14px] bg-pn-bg border-[1.5px] border-pn-border rounded-xl outline-none focus:border-pn-sky text-[0.9rem] text-pn-navy leading-[1.7] resize-y transition-colors"
              placeholder="Share your insights, code snippets, or discussion topics... (10–10,000 characters)" />
          </div>

          <div className="h-px bg-pn-surface my-6" />

          <div className="mb-5">
            <label className="text-[0.82rem] font-semibold text-pn-steel mb-2 flex items-center gap-1">
              Image URL <span className="text-[0.72rem] font-normal text-pn-lm">Optional</span>
            </label>
            <input type="url" value={mediaAttachment} onChange={(e) => setMediaAttachment(e.target.value)}
              className="w-full px-4 py-3 bg-pn-bg border-[1.5px] border-pn-border rounded-xl text-[0.95rem] text-pn-navy outline-none focus:border-pn-sky transition-colors"
              placeholder="https://example.com/image.png" />
            <div className="text-[0.72rem] text-pn-lm mt-1">Direct link to an image. Will be displayed below the post content.</div>
          </div>

          <div className="h-px bg-pn-surface my-6" />

          <div className="mb-5">
            <label className="text-[0.82rem] font-semibold text-pn-steel mb-2 flex items-center gap-1">
              Tags <span className="text-[0.72rem] font-normal text-pn-lm">Optional — select up to 5</span>
            </label>
            <div className="bg-pn-bg border-[1.5px] border-pn-border rounded-xl p-[14px]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[0.78rem] text-pn-lm">{selectedTags.length} selected</span>
                <span onClick={() => setSelectedTags([])}
                  className="text-[0.75rem] font-semibold text-pn-steel cursor-pointer">Clear all</span>
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
            <button onClick={handleSubmit} disabled={submitting || !title || !content || !communityId}
              className="inline-flex items-center justify-center gap-[7px] bg-pn-steel text-white font-semibold text-[0.95rem] px-7 py-[13px] rounded-xl shadow-[0_6px_18px_rgba(53,88,114,0.22)] hover:bg-[#2a4760] disabled:opacity-50 cursor-pointer transition-all">
              {submitting ? "Publishing..." : "Publish Post"}
            </button>
            <Link to="/feed"
              className="inline-flex items-center justify-center gap-[7px] bg-pn-white text-pn-steel font-semibold text-[0.95rem] px-6 py-[12px] rounded-xl border-[1.5px] border-pn-border hover:border-pn-sky transition-all">
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
