/**
 * notificacao.service.ts
 *
 * Ponto único de criação de notificações in-app. Antes, cada controller
 * fazia o seu próprio `INSERT INTO notificacao` — 16 cópias do mesmo SQL
 * espalhadas por 7 ficheiros. Centralizar aqui reduz o acoplamento dos
 * controllers ao schema da tabela e garante consistência (ex: truncagem
 * de mensagens, envio em lote para admins).
 */
import { pool } from '../config/database.js'
import type { RowDataPacket } from 'mysql2'

export interface NovaNotificacao {
  usuarioId: number
  tipo: string
  entidadeId?: number | null
  titulo: string
  mensagem: string
  link?: string | null
}

/** Cria uma notificação para um utilizador. Nunca lança — notificações são
 *  best-effort e não devem falhar a operação principal. */
export async function criarNotificacao(n: NovaNotificacao): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO notificacao (usuario_id, tipo, entidade_id, titulo, mensagem, link_destino)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        n.usuarioId,
        n.tipo,
        n.entidadeId ?? null,
        n.titulo.slice(0, 150),
        n.mensagem.slice(0, 255),
        n.link ?? null,
      ],
    )
  } catch {
    // best-effort: um falhanço na notificação não deve travar a ação principal
  }
}

/** Cria a mesma notificação para todos os administradores ativos. */
export async function notificarAdmins(n: Omit<NovaNotificacao, 'usuarioId'>): Promise<void> {
  try {
    const [admins] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM utilizador WHERE tipo IN ('admin', 'superadmin') AND ativo = 1`,
    )
    await Promise.all(
      (admins as RowDataPacket[]).map(admin =>
        criarNotificacao({ ...n, usuarioId: Number(admin['id']) }),
      ),
    )
  } catch {
    // best-effort
  }
}
