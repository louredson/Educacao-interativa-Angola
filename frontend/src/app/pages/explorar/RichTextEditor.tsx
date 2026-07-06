import React, { useRef, useState } from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Heading2,
  Italic,
  List as ListBullet,
  ListOrdered,
  Minus,
  MoreHorizontal,
  Underline,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ value, onChange, placeholder, className = "" }: RichTextEditorProps) {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [showAdvancedTools, setShowAdvancedTools] = useState(false);

  const focusEditor = (start: number, end: number = start) => {
    window.setTimeout(() => {
      editorRef.current?.focus();
      editorRef.current?.setSelectionRange(start, end);
    }, 0);
  };

  const replaceSelection = (nextText: string, nextStartOffset = nextText.length, nextEndOffset = nextStartOffset) => {
    const editor = editorRef.current;
    if (!editor) return;

    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const nextValue = `${value.slice(0, start)}${nextText}${value.slice(end)}`;
    onChange(nextValue);
    focusEditor(start + nextStartOffset, start + nextEndOffset);
  };

  const wrapSelection = (before: string, after = before, fallback = "texto") => {
    const editor = editorRef.current;
    if (!editor) return;

    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selectedText = value.slice(start, end) || fallback;
    const nextText = `${before}${selectedText}${after}`;
    const nextValue = `${value.slice(0, start)}${nextText}${value.slice(end)}`;
    onChange(nextValue);

    const selectionStart = start + before.length;
    focusEditor(selectionStart, selectionStart + selectedText.length);
  };

  const prefixCurrentLine = (prefix: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    const start = editor.selectionStart;
    const lineStart = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
    const nextValue = `${value.slice(0, lineStart)}${prefix}${value.slice(lineStart)}`;
    onChange(nextValue);
    focusEditor(start + prefix.length);
  };

  const insertHorizontalRule = () => {
    replaceSelection(`${value.endsWith("\n") || value.length === 0 ? "" : "\n"}---\n`);
  };

  const insertUnorderedList = () => {
    prefixCurrentLine("- ");
  };

  const insertOrderedList = () => {
    prefixCurrentLine("1. ");
  };

  const formatBlock = (block: string) => {
    const prefixes: Record<string, string> = {
      h2: "## ",
      h3: "### ",
      h4: "#### ",
      h5: "##### ",
      h6: "###### ",
      div: "> ",
    };
    prefixCurrentLine(prefixes[block] || "");
  };

  const setAlignment = (align: string) => {
    const labels: Record<string, string> = {
      left: "alinhado à esquerda",
      center: "centralizado",
      right: "alinhado à direita",
      full: "justificado",
    };
    wrapSelection(`[${labels[align] || align}] `, "", "texto");
  };

  const handleToolbarKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, action: () => void, closeAdvanced = false) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      action();
      if (closeAdvanced) setShowAdvancedTools(false);
    }
  };

  return (
    <div className={`border border-slate-200 rounded-lg overflow-hidden ${className}`}>
      <div role="toolbar" aria-label="Ferramentas de formatação do editor" className="flex flex-wrap items-center gap-1.5 p-2 border-b border-slate-200 bg-slate-50 sticky top-0 z-10">
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); wrapSelection("**", "**"); }}
          onKeyDown={(e) => handleToolbarKeyDown(e, () => wrapSelection("**", "**"))}
          className="p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all"
          title="Negrito"
          aria-label="Aplicar negrito"
        >
          <Bold className="w-4 h-4 text-slate-600" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); wrapSelection("*", "*"); }}
          onKeyDown={(e) => handleToolbarKeyDown(e, () => wrapSelection("*", "*"))}
          className="p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all"
          title="Itálico"
          aria-label="Aplicar itálico"
        >
          <Italic className="w-4 h-4 text-slate-600" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); wrapSelection("<u>", "</u>"); }}
          onKeyDown={(e) => handleToolbarKeyDown(e, () => wrapSelection("<u>", "</u>"))}
          className="p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all"
          title="Sublinhado"
          aria-label="Aplicar sublinhado"
        >
          <Underline className="w-4 h-4 text-slate-600" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); formatBlock("h2"); }}
          onKeyDown={(e) => handleToolbarKeyDown(e, () => formatBlock("h2"))}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white hover:shadow-sm transition-all"
          title="Título"
          aria-label="Formatar como título"
        >
          <Heading2 className="w-4 h-4 text-slate-600" />
          <span>Título</span>
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); insertUnorderedList(); }}
          onKeyDown={(e) => handleToolbarKeyDown(e, insertUnorderedList)}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white hover:shadow-sm transition-all"
          title="Lista"
          aria-label="Inserir lista"
        >
          <ListBullet className="w-4 h-4 text-slate-600" />
          <span>Lista</span>
        </button>

        <div className="relative ml-auto">
          <button
            type="button"
            onClick={() => setShowAdvancedTools(prev => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all ${
              showAdvancedTools ? "bg-white text-[#800020] shadow-sm" : "text-slate-600 hover:bg-white hover:shadow-sm"
            }`}
            aria-haspopup="menu"
            aria-expanded={showAdvancedTools}
            title="Mais opções"
          >
            <MoreHorizontal className="w-4 h-4" />
            <span>Mais opções</span>
          </button>
          {showAdvancedTools && (
            <div role="menu" className="absolute right-0 top-9 z-40 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
              <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Estrutura</p>
              <div className="grid grid-cols-2 gap-1">
                {[
                  ["h3", "Título 3"],
                  ["h4", "Título 4"],
                  ["h5", "Título 5"],
                  ["h6", "Título 6"],
                ].map(([block, label]) => (
                  <button
                    key={block}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); formatBlock(block); setShowAdvancedTools(false); }}
                    onKeyDown={(e) => handleToolbarKeyDown(e, () => formatBlock(block), true)}
                    role="menuitem"
                    className="rounded-md px-2 py-1.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); formatBlock("div"); setShowAdvancedTools(false); }}
                onKeyDown={(e) => handleToolbarKeyDown(e, () => formatBlock("div"), true)}
                role="menuitem"
                className="mt-1 w-full rounded-md px-2 py-1.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Subtítulo
              </button>

              <div className="my-2 h-px bg-slate-100" />
              <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Parágrafo</p>
              <div className="grid grid-cols-4 gap-1">
                {[
                  ["left", AlignLeft, "Alinhar à esquerda"],
                  ["center", AlignCenter, "Centralizar"],
                  ["right", AlignRight, "Alinhar à direita"],
                  ["full", AlignJustify, "Justificar"],
                ].map(([align, Icon, title]) => (
                  <button
                    key={align as string}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); setAlignment(align as string); setShowAdvancedTools(false); }}
                    onKeyDown={(e) => handleToolbarKeyDown(e, () => setAlignment(align as string), true)}
                    role="menuitem"
                    className="rounded-md p-1.5 hover:bg-slate-50"
                    title={title as string}
                  >
                    {React.createElement(Icon as React.ElementType, { className: "w-4 h-4 text-slate-600" })}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); insertOrderedList(); setShowAdvancedTools(false); }}
                onKeyDown={(e) => handleToolbarKeyDown(e, insertOrderedList, true)}
                role="menuitem"
                className="mt-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <ListOrdered className="w-4 h-4 text-slate-600" />
                Lista numerada
              </button>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); insertHorizontalRule(); setShowAdvancedTools(false); }}
                onKeyDown={(e) => handleToolbarKeyDown(e, insertHorizontalRule, true)}
                role="menuitem"
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Minus className="w-4 h-4 text-slate-600" />
                Linha horizontal
              </button>
            </div>
          )}
        </div>
      </div>

      <textarea
        ref={editorRef}
        role="textbox"
        aria-label={placeholder || "Editor de texto rico"}
        aria-multiline="true"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-[200px] w-full resize-y p-3 focus:outline-none focus:ring-2 focus:ring-[#800020] prose prose-sm max-w-none bg-white"
        style={{ fontSize: "14px", lineHeight: "1.6" }}
      />
    </div>
  );
}
