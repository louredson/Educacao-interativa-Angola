import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { resolveUploadUrl } from '../services/api'
import { cn } from './ui/utils'

interface UserAvatarProps {
  /** Caminho do avatar devolvido pelo backend (ex: avatar_url / autor_avatar). Pode ser relativo ("/uploads/...") ou absoluto. */
  avatarUrl?: string | null
  /** Nome do utilizador, usado para gerar as iniciais de fallback. */
  nome?: string | null
  /** Tamanho em pixels (largura = altura). Default: 40. */
  size?: number
  className?: string
}

function iniciais(nome?: string | null): string {
  if (!nome) return '?'
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase()
}

/**
 * Avatar de utilizador partilhado por toda a aplicação — sempre que alguém
 * é identificado (fórum, salas, comentários, ranking, admin, navbar, perfil),
 * deve usar-se este componente para que a foto de perfil apareça de forma
 * consistente, com fallback automático para iniciais quando não há foto.
 */
export default function UserAvatar({ avatarUrl, nome, size = 40, className }: UserAvatarProps) {
  const src = resolveUploadUrl(avatarUrl)
  return (
    <Avatar className={cn(className)} style={{ width: size, height: size }}>
      {src ? <AvatarImage src={src} alt={nome ?? 'Utilizador'} className="object-cover" /> : null}
      <AvatarFallback
        className="font-semibold text-white"
        style={{ backgroundColor: '#800020', fontSize: Math.max(11, size * 0.38) }}
      >
        {iniciais(nome)}
      </AvatarFallback>
    </Avatar>
  )
}
