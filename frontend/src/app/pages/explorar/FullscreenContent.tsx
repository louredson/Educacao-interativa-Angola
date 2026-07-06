import React, { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  X, ChevronLeft, ChevronRight, Play, BookOpen, Headphones, Mic,
  FileText, Bookmark, Flame, Eye, Clock, ArrowLeft,
} from 'lucide-react'
import type { Content, PodcastEpisode } from './types'

interface Props {
  content: Content
  allContents: Content[]
  onClose: () => void
  onNavigate: (content: Content) => void
  onSaveToggle: (id: string, title: string) => void
  isSaved: boolean
  onPlayEpisode?: (ep: PodcastEpisode, content: Content) => void
  categoryLabels: Record<string, { label: string; icon: any; color: string }>
  /** Barra de reprodução (PodcastPlayerBar em modo inline) — passada pelo
   *  Explorar.tsx para aparecer dentro deste modal quando o conteúdo é um
   *  podcast, em vez de flutuar por baixo na página. */
  playerBar?: React.ReactNode
}

function isYouTube(url?: string) {
  return !!url && /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(url)
}
function ytEmbed(url: string) {
  const id = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1] ?? ''
  return `https://www.youtube.com/embed/${id}?autoplay=1`
}

export function FullscreenContent({
  content, allContents, onClose, onNavigate, onSaveToggle, isSaved,
  onPlayEpisode, categoryLabels, playerBar,
}: Props) {
  const idx = allContents.findIndex(c => c.id === content.id)
  const prev = idx > 0 ? allContents[idx - 1] : null
  const next = idx < allContents.length - 1 ? allContents[idx + 1] : null
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showNav, setShowNav] = useState(true)
  const hideTimer = useRef<ReturnType<typeof setTimeout>>()

  const resetNavTimer = () => {
    setShowNav(true)
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setShowNav(false), 3000)
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' })
    resetNavTimer()
  }, [content.id])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && prev) onNavigate(prev)
      if (e.key === 'ArrowRight' && next) onNavigate(next)
    }
    window.addEventListener('keydown', handler)
    return () => { window.removeEventListener('keydown', handler); clearTimeout(hideTimer.current) }
  }, [prev, next])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const typeColor =
    content.type === 'texto_jindungo' ? 'text-amber-600'
    : content.type === 'video' ? 'text-[#800020]'
    : content.type === 'podcast' ? 'text-purple-600'
    : 'text-emerald-600'

  const typeLabel =
    content.type === 'video' ? 'Vídeo'
    : content.type === 'podcast' ? 'Podcast'
    : content.type === 'texto_jindungo' ? 'Texto com Jindungo'
    : 'Artigo'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-[100] bg-[#FAFAF8] flex flex-col"
      onMouseMove={resetNavTimer}
      onClick={resetNavTimer}
    >
      {/* ── Barra de topo ─────────────────────────────────────── */}
      <AnimatePresence>
        {showNav && (
          <motion.header
            initial={{ y: -56, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -56, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-white/90 backdrop-blur-md flex-shrink-0"
          >
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>

            <div className="flex items-center gap-3">
              {/* Guardar */}
              <button
                onClick={() => onSaveToggle(content.id, content.title)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  isSaved
                    ? 'bg-amber-50 border-amber-300 text-amber-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" fill={isSaved ? 'currentColor' : 'none'} />
                <span>{isSaved ? 'Guardado' : 'Guardar'}</span>
              </button>

              {/* Fechar */}
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all"
                title="Fechar (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* ── Corpo ─────────────────────────────────────────────── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">

        {/* Capa / hero */}
        {content.thumbnail ? (
          <div className="w-full h-56 sm:h-72 overflow-hidden relative">
            <img
              src={content.thumbnail}
              alt={content.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#FAFAF8]" />
          </div>
        ) : (
          <div className={`w-full h-32 bg-gradient-to-br ${content.imageColor} opacity-20`} />
        )}

        {/* Artigo / Jindungo ─────────────────────────────────── */}
        {(content.type === 'texto_normal' || content.type === 'texto_jindungo') && (
          <article className="max-w-2xl mx-auto px-6 pb-24 -mt-6 relative">
            {/* Tipo */}
            <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest mb-4 ${typeColor}`}>
              {content.type === 'texto_jindungo'
                ? <Flame className="w-3.5 h-3.5" />
                : <FileText className="w-3.5 h-3.5" />
              }
              {typeLabel}
            </div>

            {/* Título */}
            <h1 className="text-3xl sm:text-4xl font-black text-slate-950 leading-tight mb-4">
              {content.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400 mb-6 pb-6 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#800020]/10 text-[#800020] font-black text-xs flex items-center justify-center">
                  {content.author.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <span className="font-semibold text-slate-700">{content.author}</span>
              </div>
              <span>·</span>
              <span>{content.date}</span>
              {content.views > 0 && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{content.views}</span>
                </>
              )}
              {/* Categorias */}
              {content.category.map(cat => (
                <span key={cat} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[11px] font-semibold uppercase tracking-wide">
                  {categoryLabels[cat]?.label || cat}
                </span>
              ))}
            </div>

            {/* Descrição (lead) */}
            {content.description && (
              <p className="text-xl text-slate-500 leading-relaxed mb-8 font-light">
                {content.description}
              </p>
            )}

            {/* Corpo */}
            {content.content ? (
              <div
                className="prose prose-slate prose-lg max-w-none
                  prose-headings:font-black prose-headings:text-slate-950
                  prose-p:text-slate-700 prose-p:leading-[1.85]
                  prose-a:text-[#800020] prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-slate-900
                  prose-blockquote:border-[#800020] prose-blockquote:text-slate-500"
                dangerouslySetInnerHTML={{ __html: content.content.replace(/\n/g, '<br/>') }}
              />
            ) : (
              <p className="text-slate-700 text-lg leading-[1.85]">{content.description}</p>
            )}
          </article>
        )}

        {/* Vídeo ─────────────────────────────────────────────── */}
        {content.type === 'video' && (
          <div className="max-w-4xl mx-auto px-4 pb-24 -mt-4 relative">
            <div className="rounded-2xl overflow-hidden shadow-2xl shadow-slate-900/15 mb-8">
              {content.mediaUrl ? (
                isYouTube(content.mediaUrl) ? (
                  <iframe
                    src={ytEmbed(content.mediaUrl)}
                    className="w-full aspect-video"
                    allowFullScreen
                    allow="autoplay; encrypted-media"
                    title={content.title}
                  />
                ) : (
                  <video src={content.mediaUrl} controls autoPlay className="w-full aspect-video bg-black" />
                )
              ) : content.thumbnail ? (
                <img src={content.thumbnail} alt={content.title} className="w-full aspect-video object-cover" />
              ) : (
                <div className={`w-full aspect-video bg-gradient-to-br ${content.imageColor} flex items-center justify-center`}>
                  {content.imageIcon}
                </div>
              )}
            </div>

            <div className={`text-xs font-bold uppercase tracking-widest mb-3 ${typeColor} flex items-center gap-1.5`}>
              <Play className="w-3.5 h-3.5" /> Vídeo
            </div>
            <h1 className="text-3xl font-black text-slate-950 mb-4">{content.title}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400 mb-6 pb-6 border-b border-slate-200">
              <span className="font-semibold text-slate-700">{content.author}</span>
              <span>·</span><span>{content.date}</span>
              {content.views > 0 && (<><span>·</span><span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{content.views}</span></>)}
              {content.category.map(cat => (
                <span key={cat} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[11px] font-semibold uppercase tracking-wide">
                  {categoryLabels[cat]?.label || cat}
                </span>
              ))}
            </div>
            {content.description && (
              <p className="text-slate-600 text-lg leading-relaxed">{content.description}</p>
            )}
          </div>
        )}

        {/* Podcast ────────────────────────────────────────────── */}
        {content.type === 'podcast' && (
          <div className="max-w-2xl mx-auto px-6 pb-24 -mt-6 relative">
            <div className={`text-xs font-bold uppercase tracking-widest mb-3 ${typeColor} flex items-center gap-1.5`}>
              <Mic className="w-3.5 h-3.5" /> Podcast
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-950 leading-tight mb-3">
              {content.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400 mb-6 pb-6 border-b border-slate-200">
              <span className="font-semibold text-slate-700">{content.author}</span>
              <span>·</span>
              <span>{content.episodes?.length || 0} episódios</span>
              {content.views > 0 && (<><span>·</span><span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{content.views}</span></>)}
            </div>
            {content.description && (
              <p className="text-slate-500 text-lg leading-relaxed mb-8">{content.description}</p>
            )}

            {/* Lista de episódios */}
            <div className="space-y-2">
              {(content.episodes || []).map((ep, i) => (
                <button
                  key={ep.id}
                  onClick={() => onPlayEpisode?.(ep, content)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-200 bg-white hover:border-[#800020]/30 hover:bg-[#800020]/[0.02] transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#800020]/10 text-[#800020] flex items-center justify-center font-black text-sm flex-shrink-0 group-hover:bg-[#800020] group-hover:text-white transition-colors">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm line-clamp-1 group-hover:text-[#800020] transition-colors">{ep.title}</p>
                    <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />{ep.duration}
                      <span className="mx-1">·</span>{ep.date}
                    </p>
                  </div>
                  <Play className="w-4 h-4 text-slate-300 group-hover:text-[#800020] transition-colors flex-shrink-0" />
                </button>
              ))}
            </div>

            {/* Barra de reprodução — fica dentro do modal, não solta na página */}
            {playerBar}
          </div>
        )}
      </div>

      {/* ── Barra de navegação inferior ───────────────────────── */}
      <AnimatePresence>
        {showNav && (
          <motion.nav
            initial={{ y: 56, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 56, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-white/90 backdrop-blur-md flex-shrink-0"
          >
            <button
              onClick={() => prev && onNavigate(prev)}
              disabled={!prev}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900 transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-white"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline max-w-[140px] truncate">{prev ? prev.title : 'Início'}</span>
              <span className="sm:hidden">Anterior</span>
            </button>

            <span className="text-xs font-medium text-slate-400">
              {idx + 1} <span className="text-slate-300">/</span> {allContents.length}
            </span>

            <button
              onClick={() => next && onNavigate(next)}
              disabled={!next}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900 transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-white"
            >
              <span className="hidden sm:inline max-w-[140px] truncate">{next ? next.title : 'Fim'}</span>
              <span className="sm:hidden">Seguinte</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
