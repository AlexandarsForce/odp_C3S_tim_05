import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { postApi } from "../../api_services/posts/PostAPIService";
import { communityApi } from "../../api_services/communities/CommunityAPIService";
import { tagApi } from "../../api_services/tags/TagAPIService";
import { AppNavbar } from "../../components/layout/AppNavbar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../../components/ui/dropdown-menu";
import type { CommunityDto } from "../../types/community/CommunityTypes";
import type { TagDto } from "../../types/tag/TagTypes";

export default function CreatePostPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedCommunity = searchParams.get("community");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaAttachment, setMediaAttachment] = useState("");
  const [communityId, setCommunityId] = useState<number>(0);
  const [myCommunities, setMyCommunities] = useState<CommunityDto[]>([]);
  const [allTags, setAllTags] = useState<TagDto[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [tagSearch, setTagSearch] = useState("");
  const [creatingTag, setCreatingTag] = useState(false);
  const [tagError, setTagError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const TAG_LIMIT = 5;

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

  useEffect(() => {
    setTagsLoading(true);
    tagApi.getAll().then((r) => {
      if (r.success && r.data) setAllTags(r.data);
      setTagsLoading(false);
    });
  }, []);

  const toggleTagId = (id: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(id)
        ? prev.filter((t) => t !== id)
        : prev.length < TAG_LIMIT
        ? [...prev, id]
        : prev
    );
  };

  const trimmedSearch = tagSearch.trim();
  const visibleTags = trimmedSearch
    ? allTags.filter((t) => t.name.toLowerCase().includes(trimmedSearch.toLowerCase()))
    : allTags;
  const canCreateTag =
    trimmedSearch.length >= 2 &&
    !allTags.some((t) => t.name.toLowerCase() === trimmedSearch.toLowerCase()) &&
    selectedTagIds.length < TAG_LIMIT;

  const handleCreateTag = async () => {
    if (!canCreateTag || creatingTag) return;
    setCreatingTag(true);
    setTagError("");
    const r = await tagApi.create(trimmedSearch);
    setCreatingTag(false);
    if (r.success && r.data) {
      setAllTags((prev) => [...prev, r.data!]);
      setSelectedTagIds((prev) => (prev.includes(r.data!.id) ? prev : [...prev, r.data!.id]));
      setTagSearch("");
    } else {
      setTagError(r.message || "Failed to create tag");
    }
  };

  const handleSubmit = async () => {
    if (!title || !content || !communityId) return;
    setSubmitting(true);
    setErrorMsg("");
    const r = await postApi.create({
      communityId,
      title,
      content,
      mediaAttachment: mediaAttachment || undefined,
      tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
    });
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
        <div className="inline-flex items-center gap-2 bg-pn-white border border-pn-border rounded-full px-5 py-[9px] text-[0.9rem] font-semibold text-pn-steel uppercase tracking-wider mb-4">
          <span className="w-[9px] h-[9px] rounded-full bg-pn-sky" />
          New Post
        </div>

        <p className="font-['Cormorant_Garamond',serif] italic text-[1rem] text-pn-navy/85 leading-[1.5] mb-5 max-w-[560px]">
          Write something <span className="text-pn-steel">valuable</span> for the community — no pressure, just the good stuff.
        </p>

        <div className="flex items-center gap-[6px] flex-wrap text-[0.9rem] text-pn-muted mb-7">
          <span>Posting in</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-[6px] bg-pn-white border border-pn-border rounded-lg px-3 py-[6px] text-[0.85rem] font-semibold text-pn-steel hover:border-pn-sky hover:bg-[rgba(122,170,206,0.06)] focus:outline-none focus:border-pn-sky focus:shadow-[0_0_0_4px_rgba(122,170,206,0.18)] transition-all cursor-pointer"
              >
                {communityId > 0
                  ? myCommunities.find((c) => c.id === communityId)?.name ?? "Select a community"
                  : "Select a community"}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="min-w-[220px] bg-pn-white border border-pn-border rounded-xl p-[6px] shadow-[0_12px_30px_rgba(53,88,114,0.14)] z-50"
            >
              {myCommunities.length === 0 && (
                <div className="px-3 py-2 text-[0.82rem] text-pn-lm italic">No communities yet</div>
              )}
              {myCommunities.map((c) => {
                const active = c.id === communityId;
                return (
                  <DropdownMenuItem
                    key={c.id}
                    onSelect={() => setCommunityId(c.id)}
                    className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-[0.86rem] cursor-pointer outline-none transition-colors ${
                      active
                        ? "bg-[rgba(122,170,206,0.16)] text-pn-navy font-semibold"
                        : "text-pn-muted hover:bg-pn-bg hover:text-pn-navy"
                    }`}
                  >
                    <span className="truncate">{c.name}</span>
                    {active && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-pn-steel shrink-0">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          {communityId > 0 && <span>· Visible to all members</span>}
        </div>

        <div className="bg-pn-white border border-pn-border rounded-[24px] p-9 max-sm:p-5 shadow-[0_10px_32px_rgba(53,88,114,0.07)]">

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
              Tags <span className="text-[0.72rem] font-normal text-pn-lm">Optional — select up to {TAG_LIMIT}</span>
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

              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={tagSearch}
                  onChange={(e) => { setTagSearch(e.target.value); setTagError(""); }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && canCreateTag) {
                      e.preventDefault();
                      handleCreateTag();
                    }
                  }}
                  placeholder="Search tags or type a new one…"
                  className="flex-1 bg-pn-white border border-pn-border rounded-lg px-3 py-[7px] text-[0.82rem] text-pn-navy outline-none placeholder:text-pn-lm focus:border-pn-sky transition-colors"
                />
                {canCreateTag && (
                  <button
                    type="button"
                    onClick={handleCreateTag}
                    disabled={creatingTag}
                    className="inline-flex items-center gap-1.5 px-3 py-[7px] text-[0.78rem] font-semibold text-white bg-pn-sky hover:bg-pn-steel rounded-lg shadow-[0_2px_6px_rgba(122,170,206,0.3)] disabled:opacity-50 cursor-pointer transition-all whitespace-nowrap"
                  >
                    {creatingTag ? "Creating…" : `+ Create "${trimmedSearch}"`}
                  </button>
                )}
              </div>

              {tagError && (
                <div className="text-[0.76rem] text-pn-red mb-2">{tagError}</div>
              )}

              {tagsLoading ? (
                <div className="text-[0.78rem] text-pn-lm italic py-2">Loading tags…</div>
              ) : allTags.length === 0 && !trimmedSearch ? (
                <div className="text-[0.78rem] text-pn-lm italic py-2">No tags yet — type above to create the first one.</div>
              ) : visibleTags.length === 0 ? (
                <div className="text-[0.78rem] text-pn-lm italic py-2">
                  No tags match "{tagSearch}".{canCreateTag && " Press Enter or click the button to create it."}
                </div>
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
