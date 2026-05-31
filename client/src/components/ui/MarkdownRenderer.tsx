import ReactMarkdown from "react-markdown";

interface Props {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = "" }: Props) {
  return (
    <div className={`prose prose-invert prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h1 className="text-xl font-bold text-white mt-4 mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-semibold text-white mt-3 mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-semibold text-white/90 mt-2 mb-1">{children}</h3>,
          p:  ({ children }) => <p className="text-white/70 leading-relaxed mb-3">{children}</p>,
          strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
          em: ({ children }) => <em className="text-white/80 italic">{children}</em>,
          code: ({ children, className: cls }) => {
            const isBlock = cls?.includes("language-");
            return isBlock
              ? <code className="block bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white/80 font-mono overflow-x-auto my-3">{children}</code>
              : <code className="bg-white/8 text-white/80 font-mono text-xs px-1.5 py-0.5 rounded">{children}</code>;
          },
          pre: ({ children }) => <pre className="bg-transparent">{children}</pre>,
          ul: ({ children }) => <ul className="list-disc list-inside text-white/70 space-y-1 mb-3">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside text-white/70 space-y-1 mb-3">{children}</ol>,
          li: ({ children }) => <li className="text-white/70">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-white/20 pl-4 text-white/50 italic my-3">{children}</blockquote>
          ),
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-white/60 underline hover:text-white transition-colors">{children}</a>
          ),
          hr: () => <hr className="border-white/10 my-4" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
