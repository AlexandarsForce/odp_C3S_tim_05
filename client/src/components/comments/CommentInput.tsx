import { useRef, useState, useEffect, useCallback } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL ?? "";
const MENTION_RE = /@([a-zA-Z0-9-]*)$/;

interface UserSuggestion {
  id: number;
  username: string;
}

interface Props {
  token: string;
  onSubmit: (content: string) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
}

export function CommentInput({ token, onSubmit, placeholder = "Write a comment…", disabled = false }: Props) {
  const [content, setContent] = useState("");
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);

    const cursor = e.target.selectionStart ?? val.length;
    const textUpToCursor = val.slice(0, cursor);
    const match = MENTION_RE.exec(textUpToCursor);

    if (match) {
      const query = match[1];
      setSuggestionIndex(0);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => fetchSuggestions(query), 250);
    } else {
      closeSuggestions();
    }
  };

  const fetchSuggestions = async (query: string) => {
    if (query.length === 0) { setSuggestions([]); return; }
    try {
      const res = await axios.get<{ success: boolean; data: UserSuggestion }>(
        `${API}users/search?username=${encodeURIComponent(query)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success && res.data.data) {
        setSuggestions([res.data.data]);
      } else {
        setSuggestions([]);
      }
    } catch {
      setSuggestions([]);
    }
  };

  const closeSuggestions = () => {
    setSuggestions([]);
  };

  const applyMention = useCallback((user: UserSuggestion) => {
    if (!textareaRef.current) return;
    const cursor = textareaRef.current.selectionStart ?? content.length;
    const before = content.slice(0, cursor);
    const after = content.slice(cursor);
    const replaced = before.replace(MENTION_RE, `@${user.username} `);
    setContent(replaced + after);
    closeSuggestions();
    setTimeout(() => {
      if (textareaRef.current) {
        const pos = replaced.length;
        textareaRef.current.setSelectionRange(pos, pos);
        textareaRef.current.focus();
      }
    }, 0);
  }, [content]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestions.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setSuggestionIndex(i => Math.min(i + 1, suggestions.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setSuggestionIndex(i => Math.max(i - 1, 0)); }
    if (e.key === "Enter" || e.key === "Tab") {
      const s = suggestions[suggestionIndex];
      if (s) { e.preventDefault(); applyMention(s); }
    }
    if (e.key === "Escape") closeSuggestions();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || loading) return;
    setLoading(true);
    await onSubmit(content.trim());
    setContent("");
    closeSuggestions();
    setLoading(false);
  };

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  return (
    <form onSubmit={handleSubmit} className="relative">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || loading}
        rows={3}
        className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors resize-none"
      />

      {/* Autocomplete dropdown */}
      {suggestions.length > 0 && (
        <ul className="absolute z-50 left-0 mt-1 w-64 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl overflow-hidden">
          {suggestions.map((user, idx) => (
            <li key={user.id}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); applyMention(user); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
                  idx === suggestionIndex ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5"
                }`}
              >
                <span className="text-white/30 text-xs">@</span>
                <span className="font-medium">{user.username}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex justify-end mt-2">
        <button
          type="submit"
          disabled={!content.trim() || loading || disabled}
          className="bg-white hover:bg-white/90 disabled:opacity-40 text-black text-xs font-semibold rounded-lg px-4 py-2 transition-colors"
        >
          {loading ? "Posting…" : "Post"}
        </button>
      </div>
    </form>
  );
}
