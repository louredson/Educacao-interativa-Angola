import React from 'react'
import { motion } from 'motion/react'
import {
  Video, Mic, FileText, Play, Headphones, BookOpen, Lock, Edit3, Trash2, RefreshCcw, Bookmark, Flame, Maximize2, ThumbsUp, Eye,
} from 'lucide-react'
import type { Content, AccessRequestInfo, AccessRequestStatus } from './types'
import { AccessStatusPanel } from './StatusPanels'
import { resolveUploadUrl } from '../../services/api'

interface ContentCardProps {
  content: Content
  isSaved: boolean
  isSavingId: string | null
  isLiked: boolean
  isLikingId: string | null
  isCreator: boolean
  accessInfo: AccessRequestInfo | undefined
  isPremiumContent: boolean
  canOpenPremiumContent: boolean
  categoryLabels: Record<string, { label: string; icon: any; color: string }>
  onOpen: (content: Content) => void
  onLike: (id: string) => void
  onOpenFullscreen: (content: Content) => void
  onSaveToggle: (id: string, title: string) => void
  onAccessRequest: (content: Content) => void
  onEditStart: (content: Content) => void
  onDeleteStart: (id: string) => void
  getAccessInfo: (contentId: string) => AccessRequestInfo | undefined
  getAccessStatusLabel: (status?: AccessRequestStatus) => string
  formatDateTime: (value?: string | null) => string
}

export function ContentCard({
  content,
  isSaved,
  isSavingId,
  isLiked,
  isLikingId,
  isCreator,
  accessInfo,
  isPremiumContent,
  canOpenPremiumContent,
  categoryLabels,
  onOpen,
  onOpenFullscreen,
  onLike,
  onSaveToggle,
  onAccessRequest,
  onEditStart,
  onDeleteStart,
  getAccessInfo,
  getAccessStatusLabel,
  formatDateTime,
}: ContentCardProps) {

  const handleCardClick = (e: React.MouseEvent) => {
    // Ignora cliques em botões ou links dentro do card
    if ((e.target as HTMLElement).closest('button, a')) return
    if (isPremiumContent && !canOpenPremiumContent) {
      onAccessRequest(content)
    } else {
      onOpen(content)
    }
  }

  return (
    <article
      onClick={handleCardClick}
      className="bg-white rounded-2xl border border-[#800020]/10 shadow-xs hover:border-[#800020]/25 hover:shadow-xl hover:shadow-[#800020]/[0.06] hover:-translate-y-1.5 transition-all duration-300 overflow-hidden flex flex-col group cursor-pointer"
    >

      {/* Thumbnail / capa */}
      <div className="relative h-48 overflow-hidden bg-slate-950">
        {content.thumbnail ? (
          <img
            src={content.thumbnail}
            alt={`Capa de ${content.title}`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${content.imageColor} flex items-center justify-center`}>
            {content.imageIcon}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

        {/* Overlay de clique rápido no centro */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="bg-slate-950/60 backdrop-blur-sm rounded-full p-3">
            {content.type === 'video'   && <Play      className="w-7 h-7 text-white fill-white" />}
            {content.type === 'podcast' && <Headphones className="w-7 h-7 text-white" />}
            {(content.type === 'texto_normal' || content.type === 'texto_jindungo') && <BookOpen className="w-7 h-7 text-white" />}
          </div>
        </div>

        {/* Badge tipo */}
        <div className="absolute bottom-3 left-3 flex gap-1.5">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase text-white bg-slate-950/80 backdrop-blur-xs">
            {content.type === 'video'           && <Video    className="w-3 h-3 text-[#800020]"     />}
            {content.type === 'podcast'         && <Mic      className="w-3 h-3 text-purple-500"  />}
            {content.type === 'texto_normal'    && <FileText className="w-3 h-3 text-emerald-500" />}
            {content.type === 'texto_jindungo'  && <Flame    className="w-3 h-3 text-amber-400"   />}
            <span>
              {content.type === 'video'          && 'Vídeo'}
              {content.type === 'podcast'        && 'Podcast'}
              {content.type === 'texto_normal'   && 'Texto'}
              {content.type === 'texto_jindungo' && 'Jindungo'}
            </span>
          </span>
        </div>

        {/* Botão guardar */}
        <motion.button
          onClick={(e) => { e.stopPropagation(); onSaveToggle(content.id, content.title) }}
          aria-label={isSaved ? `Remover ${content.title} dos favoritos` : `Adicionar ${content.title} aos favoritos`}
          whileTap={{ scale: 0.92 }}
          animate={isSavingId === content.id ? { scale: [1, 1.16, 1] } : { scale: isSaved ? 1.1 : 1 }}
          transition={{ duration: 0.28 }}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-xs transition-all ${
            isSaved
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30'
              : 'bg-slate-900/40 text-white hover:bg-slate-900/60'
          }`}
        >
          <motion.span
            className="relative flex"
            animate={isSaved ? { rotate: [0, -8, 6, 0] } : { rotate: 0 }}
            transition={{ duration: 0.35 }}
          >
            <Bookmark className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} />
            {isSaved && (
              <motion.span
                className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-white"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
              />
            )}
          </motion.span>
        </motion.button>
      </div>

      {/* Corpo do cartão */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          {/* Categorias */}
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {content.category.map((catKey) => (
              <span
                key={catKey}
                className="text-[10px] uppercase tracking-wider font-extrabold text-[#264653] bg-[#264653]/[0.07] py-0.5 px-2 rounded-md"
              >
                {categoryLabels[catKey]?.label || catKey}
              </span>
            ))}
          </div>

          <h4 className="text-lg font-bold text-slate-950 line-clamp-2 leading-snug group-hover:text-[#800020] transition-colors">
            {content.title}
          </h4>
          <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
            {content.description}
          </p>
        </div>

        {/* Autor + estatísticas */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#800020]/10 text-[#800020] font-bold text-xs flex items-center justify-center flex-shrink-0 overflow-hidden">
              {content.authorAvatar ? (
                <img src={resolveUploadUrl(content.authorAvatar)} alt={content.author} className="w-full h-full object-cover" />
              ) : (
                content.author.split(' ').map(n => n[0]).join('').slice(0, 2)
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-800 line-clamp-1">{content.author}</p>
              <p className="text-[9px] text-slate-400 font-medium">
                {content.date}{content.type !== 'video' && content.type !== 'podcast' && content.duration && ` · ${content.duration}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {content.views > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <Eye className="w-3.5 h-3.5" />
                {content.views}
              </span>
            )}
            <motion.button
              onClick={(e) => { e.stopPropagation(); onLike(content.id) }}
              whileTap={{ scale: 0.88 }}
              animate={isLikingId === content.id ? { scale: [1, 1.22, 1] } : { scale: 1 }}
              transition={{ duration: 0.25 }}
              className={`flex items-center gap-1 text-[11px] font-semibold transition-colors ${
                isLiked ? 'text-[#800020]' : 'text-slate-400 hover:text-[#800020]'
              }`}
              aria-label={isLiked ? 'Remover gosto' : 'Gostei'}
            >
              <ThumbsUp className="w-3.5 h-3.5" fill={isLiked ? 'currentColor' : 'none'} />
              <span>{content.likes || 0}</span>
            </motion.button>
          </div>
        </div>

        {/* Acções */}
        <div className="mt-5">
          {isPremiumContent ? (
            accessInfo ? (
              <div className="space-y-2">
                <AccessStatusPanel
                  content={content}
                  compact
                  getAccessInfo={getAccessInfo}
                  getAccessStatusLabel={getAccessStatusLabel}
                  formatDateTime={formatDateTime}
                />
                {canOpenPremiumContent ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); onOpen(content) }}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-[#800020] text-white hover:bg-[#5C0016] font-bold text-xs transition-colors shadow-xs"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Ler conteúdo aprovado</span>
                  </button>
                ) : accessInfo.status === 'rejeitado' ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); onAccessRequest(content) }}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-white border border-[#FDD5D5] text-[#5C0016] hover:bg-[#FFF2F2] font-bold text-xs transition-colors"
                  >
                    <RefreshCcw className="w-4 h-4" />
                    <span>Solicitar novamente</span>
                  </button>
                ) : null}
              </div>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); onAccessRequest(content) }}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-[#800020] text-white hover:bg-[#5C0016] font-bold text-xs transition-colors shadow-xs"
              >
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Solicitar Acesso</span>
              </button>
            )
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (content.type === 'video') onOpen(content);
                else onOpenFullscreen(content);
              }}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-[#800020] text-white hover:bg-[#5C0016] font-bold text-xs transition-transform transform hover:-translate-y-0.5 active:translate-y-0 shadow-xs group-hover:shadow-md"
            >
              {content.type === 'video'          && <Play       className="w-3.5 h-3.5 fill-current" />}
              {content.type === 'podcast'        && <Headphones className="w-3.5 h-3.5" />}
              {content.type === 'texto_normal'   && <BookOpen   className="w-3.5 h-3.5" />}
              {content.type === 'texto_jindungo' && <BookOpen   className="w-3.5 h-3.5" />}
              <span>
                {content.type === 'video'          && 'Assistir Agora'}
                {content.type === 'podcast'        && 'Ouvir Podcast'}
                {content.type === 'texto_normal'   && 'Ler Agora'}
                {content.type === 'texto_jindungo' && 'Ler Agora'}
              </span>
            </button>
          )}

          {/* Acções de gestão (criador / professor / admin) */}
          {isCreator && (
            <div className="mt-2.5 flex items-center justify-center gap-4 text-[10px] font-bold text-slate-400">
              <button
                onClick={(e) => { e.stopPropagation(); onEditStart(content) }}
                className="flex items-center gap-1 hover:text-orange-600 transition-colors"
              >
                <Edit3 className="w-3 h-3" />
                <span>Editar</span>
              </button>
              <span>·</span>
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteStart(content.id) }}
                className="flex items-center gap-1 hover:text-[#800020] transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                <span>Apagar</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
