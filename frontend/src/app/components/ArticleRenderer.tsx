/**
 * ArticleRenderer — renderiza o conteúdo de um artigo como blocos tipográficos.
 * Suporta o formato JSON de blocos e retrocompatibilidade com texto plano.
 */

export type ArticleBlock =
  | { type: 'paragraph'; content: string }
  | { type: 'heading'; content: string; level?: 2 | 3 }
  | { type: 'image'; url: string; caption?: string; align?: 'left' | 'center' | 'right' | 'wide' }
  | { type: 'quote'; content: string; author?: string }
  | { type: 'divider' };

function parseBlocks(raw: string): ArticleBlock[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as ArticleBlock[];
  } catch {
    // not JSON — treat as plain text
  }
  // Retrocompatibilidade: texto plano → um bloco por parágrafo
  return raw
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => ({ type: 'paragraph', content: p }));
}

function ParagraphBlock({ content }: { content: string }) {
  return (
    <p
      className="text-slate-700 leading-[1.85] text-[1.0625rem] mb-0"
      // suporta \n simples dentro de um parágrafo
      style={{ whiteSpace: 'pre-line' }}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}

function HeadingBlock({ content, level = 2 }: { content: string; level?: 2 | 3 }) {
  if (level === 3) {
    return (
      <h3 className="text-xl font-bold text-slate-800 mt-2 mb-0 leading-snug">
        {content}
      </h3>
    );
  }
  return (
    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 mb-0 leading-snug border-l-4 border-[#800020] pl-4">
      {content}
    </h2>
  );
}

function ImageBlock({
  url,
  caption,
  align = 'center',
}: {
  url: string;
  caption?: string;
  align?: 'left' | 'center' | 'right' | 'wide';
}) {
  const wrapClass =
    align === 'wide'
      ? 'w-full'
      : align === 'left'
      ? 'float-left mr-6 mb-2 max-w-xs'
      : align === 'right'
      ? 'float-right ml-6 mb-2 max-w-xs'
      : 'mx-auto max-w-2xl';

  return (
    <figure className={`my-0 ${wrapClass}`}>
      <img
        src={url}
        alt={caption || ''}
        className="w-full rounded-xl shadow-md object-cover"
        loading="lazy"
      />
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-slate-500 italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

function QuoteBlock({ content, author }: { content: string; author?: string }) {
  return (
    <blockquote className="relative border-l-0 bg-[#800020]/5 rounded-xl px-6 py-5 my-0">
      <span className="absolute top-3 left-4 text-5xl text-[#800020]/20 font-serif leading-none select-none">"</span>
      <p className="text-slate-700 text-lg italic leading-relaxed pl-4 relative z-10">
        {content}
      </p>
      {author && (
        <footer className="mt-2 pl-4 text-sm font-semibold text-[#800020]">
          — {author}
        </footer>
      )}
    </blockquote>
  );
}

function DividerBlock() {
  return (
    <div className="flex items-center gap-4 my-0">
      <div className="flex-1 border-t border-slate-200" />
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className="w-1.5 h-1.5 rounded-full bg-slate-300" />
        ))}
      </div>
      <div className="flex-1 border-t border-slate-200" />
    </div>
  );
}

interface ArticleRendererProps {
  content: string;
  className?: string;
}

export default function ArticleRenderer({ content, className = '' }: ArticleRendererProps) {
  const blocks = parseBlocks(content);

  if (blocks.length === 0) {
    return <p className="text-slate-400 italic">Sem conteúdo.</p>;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'paragraph':
            return <ParagraphBlock key={i} content={block.content} />;
          case 'heading':
            return <HeadingBlock key={i} content={block.content} level={block.level} />;
          case 'image':
            return <ImageBlock key={i} url={block.url} caption={block.caption} align={block.align} />;
          case 'quote':
            return <QuoteBlock key={i} content={block.content} author={block.author} />;
          case 'divider':
            return <DividerBlock key={i} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
