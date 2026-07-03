import { apiRequest } from './api'

export interface PerfilRaw {
  nome: string
  email: string
  provincia: string | null
  instituicao: string | null
  curso: string | null
  avatar_url?: string | null
  stats?: {
    conteudos_lidos: number
    quizzes_feitos: number
    respostas_forum: number
    favoritos: number
    pontuacao_total: number
  }
}

export function getMyProfile() {
  return apiRequest<PerfilRaw>('/perfil')
}

export interface CamposEditaveisPerfil {
  nome?: string
  telemovel?: string
  provincia?: string
  instituicao?: string
  curso?: string
  password?: string
}

export function updateMyProfile(campos: CamposEditaveisPerfil) {
  return apiRequest<PerfilRaw>('/perfil', { method: 'PUT', json: campos })
}

/**
 * Envia uma nova foto de perfil (multipart/form-data). `fileUri` é o URI local
 * devolvido pelo expo-image-picker (ex: "file:///.../foto.jpg").
 * Devolve o utilizador atualizado (já com o novo avatar_url).
 */
export function uploadAvatar(fileUri: string, mimeType = 'image/jpeg') {
  const ext = mimeType.split('/')[1] || 'jpg'
  const filename = fileUri.split('/').pop() || `avatar.${ext}`
  const fd = new FormData()
  // O React Native FormData aceita este formato de objeto para ficheiros —
  // o DOM FormData "normal" não tem este tipo, daí o `as any`.
  fd.append('avatar', { uri: fileUri, name: filename, type: mimeType } as any)
  return apiRequest<PerfilRaw>('/perfil/avatar', { method: 'POST', formData: fd })
}
