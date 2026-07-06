/**
 * ArticleEditor — editor de blocos para conteúdo de artigos.
 * Guarda/lê o conteúdo como JSON string compatível com ArticleRenderer.
 */
import { useRef } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, Type, Heading2, Image, Quote, Minus, AlignLeft, AlignCenter, AlignRight, Maximize2 } from 'lucide-react';
import type { ArticleBlock } from './ArticleRenderer';

interface ArticleEditorProps {
  value: string;
  onChange: (value: string) => void;
}

function parseBlocks(raw: string): ArticleBlock[] {
  if (!raw) return [{ type: 'paragraph', content: '' }];
  try {
    const p = JSON.parse(raw);
    if (Array.isArray(p) && p.length > 0) return p as ArticleBlock[];
  } catch { /* não é JSON */ }
  // texto plano → migrar para blocos
  return raw
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => ({ type: 'paragraph' as const, content: p }));
}

function serializeBlocks(blocks: ArticleBlock[]): string {
  return JSON.stringify(blocks);
}

export default function ArticleEditor({ value, onChange }: ArticleEditorProps) {
  const blocks = parseBlocks(value);
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({});

  function update(newBlocks: ArticleBlock[]) {
    onChange(serializeBlocks(newBlocks));
  }

  function updateBlock(index: number, partial: Partial<ArticleBlock>) {
    const next = blocks.map((b, i) => (i === index ? { ...b, ...partial } as ArticleBlock : b));
    update(next);
  }

  function addBlock(type: ArticleBlock['type'], afterIndex: number) {
    const newBlock: ArticleBlock =
      type === 'paragraph' ? { type: 'paragraph', content: '' }
      : type === 'heading' ? { type: 'heading', content: '', level: 2 }
      : type === 'image' ? { type: 'image', url: '', caption: '', align: 'center' }
      : type === 'quote' ? { type: 'quote', content: '', author: '' }
      : { type: 'divider' };
    const next = [...blocks];
    next.splice(afterIndex + 1, 0, newBlock);
    update(next);
  }

  function removeBlock(index: number) {
    if (blocks.length === 1) {
      update([{ type: 'paragraph', content: '' }]);
      return;
    }
    update(blocks.filter((_, i) => i !== index));
  }

  function moveBlock(index: number, dir: -1 | 1) {
    const next = [...blocks];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    update(next);
  }

  function handleImageFile(index: number, file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      updateBlock(index, { url: e.target?.result as string } as Partial<ArticleBlock>);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-3">
      {blocks.map((block, i) => (
        <div key={i} className="group relative border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
          {/* Toolbar do bloco */}
          <div className="flex items-center justify-between gap-1 px-3 py-1.5 bg-slate-50 border-b border-slate-100">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide select-none">
              {block.type === 'paragraph' ? 'Parágrafo'
                : block.type === 'heading' ? `Título ${(block as any).level ?? 2}`
                : block.type === 'image' ? 'Imagem'
                : block.type === 'quote' ? 'Citação'
                : 'Separador'}
            </span>
            <div className="flex items-center gap-0.5">
              <button type="button" onClick={() => moveBlock(i, -1)} disabled={i === 0}
                className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 transition-colors" title="Mover para cima">
                <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
              </button>
              <button type="button" onClick={() => moveBlock(i, 1)} disabled={i === blocks.length - 1}
                className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 transition-colors" title="Mover para baixo">
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>
              <button type="button" onClick={() => removeBlock(i)}
                className="p-1 rounded hover:bg-red-100 transition-colors ml-1" title="Remover bloco">
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </button>
            </div>
          </div>

          {/* Conteúdo do bloco */}
          <div className="p-3">
            {block.type === 'paragraph' && (
              <textarea
                value={block.content}
                onChange={(e) => updateBlock(i, { content: e.target.value })}
                placeholder="Escreve o parágrafo aqui..."
                rows={4}
                className="w-full resize-y text-sm text-slate-700 leading-relaxed outline-none placeholder:text-slate-300"
              />
            )}

            {block.type === 'heading' && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  {([2, 3] as const).map((lvl) => (
                    <button key={lvl} type="button"
                      onClick={() => updateBlock(i, { level: lvl } as Partial<ArticleBlock>)}
                      className={`px-3 py-1 rounded text-xs font-semibold border transition-colors ${(block as any).level === lvl ? 'bg-[#800020] text-white border-[#800020]' : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'}`}>
                      H{lvl}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={block.content}
                  onChange={(e) => updateBlock(i, { content: e.target.value })}
                  placeholder="Título da secção..."
                  className={`w-full outline-none placeholder:text-slate-300 font-bold text-slate-900 ${(block as any).level === 3 ? 'text-xl' : 'text-2xl'}`}
                />
              </div>
            )}

            {block.type === 'image' && (
              <div className="space-y-3">
                {/* Preview */}
                {block.url ? (
                  <div className="relative rounded-lg overflow-hidden bg-slate-100">
                    <img src={block.url} alt="preview" className="w-full max-h-64 object-contain" />
                    <button type="button" onClick={() => updateBlock(i, { url: '' } as Partial<ArticleBlock>)}
                      className="absolute top-2 right-2 bg-white/90 hover:bg-white text-slate-700 rounded-full p-1 shadow transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-[#800020] transition-colors">
                    <Image className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500 mb-2">Upload ou URL da imagem</p>
                    <div className="flex gap-2 justify-center">
                      <label className="cursor-pointer px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors">
                        Escolher ficheiro
                        <input type="file" accept="image/*" className="hidden"
                          ref={(el) => { fileRefs.current[i] = el; }}
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(i, f); }} />
                      </label>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 border-t border-slate-200" />
                      <span className="text-xs text-slate-400">ou</span>
                      <div className="flex-1 border-t border-slate-200" />
                    </div>
                    <input type="url" placeholder="https://exemplo.com/imagem.jpg"
                      className="mt-2 w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-[#800020] transition-colors"
                      onChange={(e) => { if (e.target.value) updateBlock(i, { url: e.target.value } as Partial<ArticleBlock>); }} />
                  </div>
                )}

                {/* Legenda */}
                <input type="text" placeholder="Legenda da imagem (opcional)"
                  value={(block as any).caption || ''}
                  onChange={(e) => updateBlock(i, { caption: e.target.value } as Partial<ArticleBlock>)}
                  className="w-full text-sm border-b border-slate-200 outline-none py-1 placeholder:text-slate-300 focus:border-[#800020] transition-colors" />

                {/* Alinhamento */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Posição:</span>
                  {([
                    { value: 'left', icon: AlignLeft, label: 'Esquerda' },
                    { value: 'center', icon: AlignCenter, label: 'Centro' },
                    { value: 'right', icon: AlignRight, label: 'Direita' },
                    { value: 'wide', icon: Maximize2, label: 'Largura total' },
                  ] as const).map(({ value, icon: Icon, label }) => (
                    <button key={value} type="button" title={label}
                      onClick={() => updateBlock(i, { align: value } as Partial<ArticleBlock>)}
                      className={`p-1.5 rounded transition-colors ${(block as any).align === value ? 'bg-[#800020] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {block.type === 'quote' && (
              <div className="space-y-2">
                <textarea
                  value={block.content}
                  onChange={(e) => updateBlock(i, { content: e.target.value })}
                  placeholder="Texto da citação..."
                  rows={3}
                  className="w-full resize-y text-sm italic text-slate-700 outline-none placeholder:text-slate-300 border-l-4 border-[#800020]/30 pl-3"
                />
                <input type="text" placeholder="Autor (opcional)"
                  value={(block as any).author || ''}
                  onChange={(e) => updateBlock(i, { author: e.target.value } as Partial<ArticleBlock>)}
                  className="w-full text-sm border-b border-slate-200 outline-none py-1 placeholder:text-slate-300 focus:border-[#800020] transition-colors" />
              </div>
            )}

            {block.type === 'divider' && (
              <div className="flex items-center gap-3 py-1 opacity-40">
                <div className="flex-1 border-t border-slate-300" />
                <div className="flex gap-1">
                  {[0, 1, 2].map((d) => <span key={d} className="w-1.5 h-1.5 rounded-full bg-slate-400" />)}
                </div>
                <div className="flex-1 border-t border-slate-300" />
              </div>
            )}
          </div>

          {/* Barra "+ adicionar bloco" entre blocos */}
          <div className="px-3 pb-2 pt-1 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-xs text-slate-400 mr-1">+ Adicionar:</span>
              {([
                { type: 'paragraph', icon: Type, label: 'Texto' },
                { type: 'heading', icon: Heading2, label: 'Título' },
                { type: 'image', icon: Image, label: 'Imagem' },
                { type: 'quote', icon: Quote, label: 'Citação' },
                { type: 'divider', icon: Minus, label: 'Separador' },
              ] as const).map(({ type, icon: Icon, label }) => (
                <button key={type} type="button"
                  onClick={() => addBlock(type, i)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border border-slate-200 bg-white text-slate-600 hover:border-[#800020] hover:text-[#800020] transition-colors">
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* Botão inicial se vazio */}
      {blocks.length === 1 && blocks[0].type === 'paragraph' && blocks[0].content === '' && (
        <p className="text-xs text-slate-400 text-center py-1">
          Escreve no bloco acima ou adiciona mais blocos com os botões "+".
        </p>
      )}
    </div>
  );
}
