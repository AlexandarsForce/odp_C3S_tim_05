import { useParams } from "react-router-dom";

// TODO: Add full post detail UI (content, comments, likes)
export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <main className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-white/30 text-sm">Post #{id}</p>
        <p className="text-white/20 text-xs mt-2">Detail view coming soon.</p>
      </div>
    </main>
  );
}
