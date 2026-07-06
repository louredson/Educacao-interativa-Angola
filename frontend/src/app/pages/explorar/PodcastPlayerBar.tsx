import React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Mic, SkipBack, Play, Pause, SkipForward, Volume2, Badge } from 'lucide-react'
import type { PodcastEpisode } from './types'

interface PodcastPlayerBarProps {
  playingEpisode: PodcastEpisode | null
  playingPodcastTitle: string
  playingPodcastThumbnail: string
  isAudioPlaying: boolean
  audioProgress: number
  audioCurrentTime: number
  audioDuration: number
  isMuted: boolean
  audioRef: React.RefObject<HTMLAudioElement | null>
  onPlayPause: () => void
  onStop: () => void
  onPrev: () => void
  onNext: () => void
  onSeek: (percentage: number) => void
  onMuteToggle: () => void
  formatAudioTime: (seconds: number) => string
  /** Quando true, a barra fica ancorada dentro do próprio contentor (ex: o
   *  modal "Ouvir Podcast"), em vez de fixa ao fundo da janela do browser. */
  inline?: boolean
}

export function PodcastPlayerBar({
  playingEpisode,
  playingPodcastTitle,
  playingPodcastThumbnail,
  isAudioPlaying,
  audioProgress,
  audioCurrentTime,
  audioDuration,
  isMuted,
  audioRef,
  onPlayPause,
  onStop,
  onPrev,
  onNext,
  onSeek,
  onMuteToggle,
  formatAudioTime,
  inline = false,
}: PodcastPlayerBarProps) {
  return (
    <AnimatePresence>
      {playingEpisode && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          className={
            inline
              ? "sticky bottom-0 inset-x-0 bg-slate-950 text-white py-3 px-4 sm:px-8 border-t border-slate-800/80 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-3 rounded-b-2xl"
              : "fixed bottom-0 inset-x-0 bg-slate-950 text-white py-3 px-4 sm:px-8 border-t border-slate-800/80 z-[49] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-3"
          }
        >
          <audio ref={audioRef} src={playingEpisode.audioUrl} preload="metadata" />

          {/* Info do episódio */}
          <div className="flex items-center gap-3 w-full md:w-[35%]">
            <div className="w-12 h-12 rounded-lg bg-orange-600 flex-shrink-0 flex items-center justify-center overflow-hidden">
              {playingPodcastThumbnail ? (
                <img src={playingPodcastThumbnail} alt={playingEpisode.title} className="w-full h-full object-cover" />
              ) : (
                <Mic className="w-6 h-6 text-white" />
              )}
            </div>
            <div className="min-w-0">
              <span className="inline-flex items-center bg-purple-900 text-purple-200 text-[8px] font-extrabold uppercase mb-0.5 px-1.5 rounded">
                No Ar · Podcast
              </span>
              <h5 className="text-xs font-bold truncate text-white">{playingEpisode.title}</h5>
              <p className="text-[10px] text-slate-400 truncate">{playingPodcastTitle}</p>
            </div>
          </div>

          {/* Controlos de reprodução */}
          <div className="flex flex-col items-center gap-1.5 w-full md:w-[45%]">
            <div className="flex items-center gap-4">
              <button onClick={onPrev} aria-label="Reproduzir episódio anterior" className="text-slate-400 hover:text-white transition-colors">
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                onClick={onPlayPause}
                aria-label={isAudioPlaying ? 'Pausar episódio' : 'Reproduzir episódio'}
                className="w-8 h-8 rounded-full bg-white text-slate-950 flex items-center justify-center transform hover:scale-110 active:scale-95 transition-all"
              >
                {isAudioPlaying
                  ? <Pause className="w-4 h-4 text-slate-950 fill-slate-950" />
                  : <Play className="w-4 h-4 text-slate-950 fill-slate-950 ml-0.5" />}
              </button>
              <button onClick={onNext} aria-label="Reproduzir próximo episódio" className="text-slate-400 hover:text-white transition-colors">
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {/* Barra de progresso */}
            <div className="flex items-center gap-2 w-full text-[10px] text-slate-500 font-semibold">
              <span>{formatAudioTime(audioCurrentTime)}</span>
              <div
                role="slider"
                tabIndex={0}
                aria-label="Progresso do áudio"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(audioProgress)}
                className="flex-1 h-1 rounded-sm bg-slate-800 relative cursor-pointer group"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  onSeek(((e.clientX - rect.left) / rect.width) * 100)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowLeft') { e.preventDefault(); onSeek(audioProgress - 5) }
                  if (e.key === 'ArrowRight') { e.preventDefault(); onSeek(audioProgress + 5) }
                }}
              >
                <div
                  className="absolute top-0 bottom-0 left-0 bg-orange-500 rounded-sm group-hover:bg-orange-400 transition-all pointer-events-none"
                  style={{ width: `${audioProgress}%` }}
                />
              </div>
              <span>{audioDuration ? formatAudioTime(audioDuration) : playingEpisode.duration}</span>
            </div>
          </div>

          {/* Volume + Fechar */}
          <div className="flex items-center justify-end gap-3 w-full md:w-[20%] text-slate-400 text-xs font-semibold">
            <button
              onClick={onMuteToggle}
              aria-label={isMuted ? 'Ativar som' : 'Silenciar áudio'}
              className="hover:text-white transition-colors"
            >
              <Volume2 className={`w-4 h-4 ${isMuted ? 'text-[#800020]' : ''}`} />
            </button>
            <span className="hidden sm:inline">Volume {isMuted ? '0%' : '80%'}</span>
            <button
              onClick={onStop}
              className="p-1 px-2 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-[#800020] transition-all"
            >
              Fechar
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
