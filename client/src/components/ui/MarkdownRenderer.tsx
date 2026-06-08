import ReactMarkdown from "react-markdown";

interface Props {
  content: string;
  className?: string;
  variant?: "dark" | "light";
}

export function MarkdownRenderer({ content, className = "", variant = "dark" }: Props) {
  const isLight = variant === "light";
  const tone = {
    h1: isLight ? "text-pn-navy" : "text-white",
    h2: isLight ? "text-pn-navy" : "text-white",
    h3: isLight ? "text-pn-steel" : "text-white/90",
    body: isLight ? "text-pn-muted" : "text-white/70",
    strong: isLight ? "text-pn-navy" : "text-white",
    em: isLight ? "text-pn-steel" : "text-white/80",
    code: isLight ? "bg-pn-bg border-pn-border text-pn-steel" : "bg-white/5 border-white/10 text-white/80",
    inlineCode: isLight ? "bg-pn-bg text-pn-steel" : "bg-white/8 text-white/80",
    quote: isLight ? "border-pn-border text-pn-muted" : "border-white/20 text-white/50",
    link: isLight ? "text-pn-steel" : "text-white/60",
    linkHover: isLight ? "hover:text-pn-navy" : "hover:text-white",
    hr: isLight ? "border-pn-border" : "border-white/10",
  };

  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h1 className={`text-xl font-bold ${tone.h1} mt-4 mb-2`}>{children}</h1>,
          h2: ({ children }) => <h2 className={`text-lg font-semibold ${tone.h2} mt-3 mb-2`}>{children}</h2>,
          h3: ({ children }) => <h3 className={`text-base font-semibold ${tone.h3} mt-2 mb-1`}>{children}</h3>,
          p:  ({ children }) => <p className={`${tone.body} leading-relaxed mb-3`}>{children}</p>,
          strong: ({ children }) => <strong className={`${tone.strong} font-semibold`}>{children}</strong>,
          em: ({ children }) => <em className={`${tone.em} italic`}>{children}</em>,
          code: ({ children, className: cls }) => {
            const isBlock = cls?.includes("language-");
            return isBlock
              ? <code className={`block border rounded-lg px-4 py-3 text-sm font-mono overflow-x-auto my-3 ${tone.code}`}>{children}</code>
              : <code className={`${tone.inlineCode} font-mono text-xs px-1.5 py-0.5 rounded`}>{children}</code>;
          },
          pre: ({ children }) => <pre className="bg-transparent">{children}</pre>,
          ul: ({ children }) => <ul className={`list-disc list-inside ${tone.body} space-y-1 mb-3`}>{children}</ul>,
          ol: ({ children }) => <ol className={`list-decimal list-inside ${tone.body} space-y-1 mb-3`}>{children}</ol>,
          li: ({ children }) => <li className={tone.body}>{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className={`border-l-2 pl-4 italic my-3 ${tone.quote}`}>{children}</blockquote>
          ),
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className={`${tone.link} ${tone.linkHover} underline transition-colors`}>{children}</a>
          ),
          hr: () => <hr className={`${tone.hr} my-4`} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
