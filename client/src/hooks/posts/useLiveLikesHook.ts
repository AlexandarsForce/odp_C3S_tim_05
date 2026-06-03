import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL ?? "";

export function useLiveLikes(postId: number, initialCount: number): number {
  const [likesCount, setLikesCount] = useState(initialCount);

  useEffect(() => {
    setLikesCount(initialCount);
  }, [initialCount]);

  useEffect(() => {
    if (!postId) return;
    const url = `${API}posts/${postId}/likes/stream`;
    const es = new EventSource(url);

    es.onmessage = (event) => {
      try {
        const { likesCount: count } = JSON.parse(event.data) as { postId: number; likesCount: number };
        setLikesCount(count);
      } catch { /* ignore malformed */ }
    };

    es.onerror = () => es.close();

    return () => es.close();
  }, [postId]);

  return likesCount;
}
