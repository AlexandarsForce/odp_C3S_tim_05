import { Link } from "react-router-dom";

interface Mention {
  username: string;
  userId: number;
}

interface Props {
  content: string;
  mentions: Mention[];
}

export function CommentRenderer({ content, mentions }: Props) {
  if (mentions.length === 0) {
    return <span className="text-white/70 text-sm whitespace-pre-wrap">{content}</span>;
  }

  const mentionMap = new Map<string, number>(
    mentions.map(m => [m.username.toLowerCase(), m.userId])
  );

  const parts = content.split(/(@[a-zA-Z0-9-]+)/g);

  return (
    <span className="text-white/70 text-sm whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (part.startsWith("@")) {
          const name = part.slice(1).toLowerCase();
          const userId = mentionMap.get(name);
          if (userId !== undefined) {
            return (
              <Link
                key={i}
                to={`/users/${userId}`}
                className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
              >
                {part}
              </Link>
            );
          }
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}
