import { FileText, Download } from 'lucide-react'
import { getApiBase } from '../services/api'

interface Props {
  ficheiroUrl: string
  ficheiroNome?: string | null
  className?: string
}

function resolveUrl(url: string): string {
  if (url.startsWith('http')) return url
  return `${getApiBase().replace('/api', '')}${url}`
}

function tipoMedia(url: string): 'imagem' | 'video' | 'audio' | 'outro' {
  const ext = url.split('?')[0].split('.').pop()?.toLowerCase() ?? ''
  if (['jpg','jpeg','png','gif','webp','svg'].includes(ext)) return 'imagem'
  if (['mp4','webm','ogg','mov'].includes(ext)) return 'video'
  if (['mp3','wav','ogg','aac','m4a'].includes(ext)) return 'audio'
  return 'outro'
}

export default function FicheiroPreview({ ficheiroUrl, ficheiroNome, className = '' }: Props) {
  const src  = resolveUrl(ficheiroUrl)
  const tipo = tipoMedia(ficheiroUrl)
  const nome = ficheiroNome ?? ficheiroUrl.split('/').pop() ?? 'ficheiro'

  if (tipo === 'imagem') {
    return (
      <a href={src} target="_blank" rel="noopener noreferrer" className={`block mt-2 ${className}`}>
        <img
          src={src}
          alt={nome}
          className="max-w-xs max-h-64 rounded-xl object-cover border border-slate-200 hover:opacity-90 transition-opacity cursor-zoom-in"
        />
      </a>
    )
  }

  if (tipo === 'video') {
    return (
      <video
        controls
        className={`mt-2 max-w-sm rounded-xl border border-slate-200 ${className}`}
        style={{ maxHeight: 240 }}
      >
        <source src={src} />
        O teu browser não suporta vídeo.
      </video>
    )
  }

  if (tipo === 'audio') {
    return (
      <audio controls className={`mt-2 w-full max-w-sm ${className}`}>
        <source src={src} />
        O teu browser não suporta áudio.
      </audio>
    )
  }

  // Outros ficheiros — link de download
  return (
    <a
      href={src}
      target="_blank"
      rel="noopener noreferrer"
      download={nome}
      className={`inline-flex items-center gap-2 mt-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 hover:border-[#FBBCB8] hover:text-[#800020] transition-colors ${className}`}
    >
      <FileText className="w-4 h-4 shrink-0" />
      <span className="truncate max-w-[200px]">{nome}</span>
      <Download className="w-3.5 h-3.5 shrink-0 ml-1" />
    </a>
  )
}
