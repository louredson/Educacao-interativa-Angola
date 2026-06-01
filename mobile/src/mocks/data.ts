import type { AuthResponse, ContentItem, NotificationItem, User } from '../types/api'

export const demoToken = 'demo-token'

export const demoUser: User = {
  id: 1,
  name: 'Utilizador Demo',
  email: 'utilizador@example.com',
  phone: '+244 900 000 000',
  province: 'Luanda',
  institution: 'Instituto Demo',
  course: 'Economia',
  role: 'subscrito',
  avatarUrl: null,
  isActive: true,
  createdAt: new Date('2026-01-01T08:00:00.000Z').toISOString(),
  lastAccess: new Date().toISOString(),
  isAdmin: false,
}

export const demoAdmin: User = {
  ...demoUser,
  id: 99,
  name: 'Administrador Demo',
  email: 'admin@example.com',
  role: 'admin',
  isAdmin: true,
}

export const demoAuthResponse: AuthResponse = {
  user: demoUser,
  accessToken: demoToken,
}

export const demoContents: ContentItem[] = [
  {
    id: 1,
    titulo: 'A origem da economia em Angola',
    descricao: 'Uma introdução visual à história económica do país.',
    conteudo_completo: 'Conteúdo completo de demonstração para testar o layout, a navegação e os estados da tela.',
    tipo: 'texto_normal',
    categoria: 'História',
    tema: 'Economia Angolana',
    duracao: '08 min',
    url_recurso: 'https://example.com',
    recurso_filename: null,
    imagem_filename: null,
    video_filename: null,
    apresentador: null,
    categoria_podcast: null,
    cache_offline: 1,
    publicado_por: 99,
    publicado_em: new Date('2026-02-15T10:00:00.000Z').toISOString(),
  },
  {
    id: 2,
    titulo: 'Colonização e comércio',
    descricao: 'Conteúdo de demonstração sobre rotas comerciais e impacto histórico.',
    conteudo_completo: 'Texto de demonstração para simular um conteúdo mais longo na aplicação mobile.',
    tipo: 'video',
    categoria: 'História',
    tema: 'Período Colonial',
    duracao: '12 min',
    url_recurso: null,
    recurso_filename: null,
    imagem_filename: null,
    video_filename: null,
    apresentador: 'Equipe Demo',
    categoria_podcast: null,
    cache_offline: 1,
    publicado_por: 99,
    publicado_em: new Date('2026-03-01T08:30:00.000Z').toISOString(),
  },
  {
    id: 3,
    titulo: 'Política monetária básica',
    descricao: 'Uma aula curta para testar cards e detalhes.',
    conteudo_completo: 'Outro conteúdo de exemplo para preencher a lista da home e do detalhe.',
    tipo: 'texto_jindungo',
    categoria: 'Economia',
    tema: 'Moeda e Inflação',
    duracao: '05 min',
    url_recurso: 'https://example.com/resource',
    recurso_filename: null,
    imagem_filename: null,
    video_filename: null,
    apresentador: null,
    categoria_podcast: null,
    cache_offline: 0,
    publicado_por: 1,
    publicado_em: new Date('2026-03-14T14:10:00.000Z').toISOString(),
  },
]

export const demoNotifications: NotificationItem[] = [
  {
    id: 1,
    usuario_id: 1,
    tipo: 'conteudo_novo',
    entidade_id: 1,
    titulo: 'Novo conteúdo disponível',
    mensagem: 'Já tens um conteúdo novo para explorar na área de economia.',
    link_destino: '/conteudos/1',
    lida: 0,
    lida_em: null,
    criada_em: new Date('2026-03-15T09:00:00.000Z').toISOString(),
  },
  {
    id: 2,
    usuario_id: 1,
    tipo: 'perfil_atualizado',
    entidade_id: null,
    titulo: 'Perfil sincronizado',
    mensagem: 'Os teus dados foram sincronizados com sucesso.',
    link_destino: '/perfil',
    lida: 1,
    lida_em: new Date('2026-03-15T10:00:00.000Z').toISOString(),
    criada_em: new Date('2026-03-15T08:00:00.000Z').toISOString(),
  },
]

export function buildDemoAuthResponse(name?: string, email?: string): AuthResponse {
  return {
    user: {
      ...demoUser,
      name: name?.trim() || demoUser.name,
      email: email?.trim() || demoUser.email,
      lastAccess: new Date().toISOString(),
    },
    accessToken: demoToken,
  }
}
