/**
 * forumVote.service.ts
 *
 * Lógica de votação (↑/↓) partilhada por tópicos e respostas do fórum.
 *
 * Garantias:
 *  - Um voto por utilizador por entidade (UNIQUE na BD).
 *  - Toggle: votar de novo no mesmo sentido remove o voto.
 *  - Mudar de sentido actualiza o voto existente.
 *  - O score (`votos`) é denormalizado na tabela-alvo, recalculado por SUM
 *    dentro da mesma transacção — a tabela de votos é a fonte de verdade.
 */
import type { RowDataPacket } from 'mysql2/promise'
import { pool } from '../config/database.js'

interface VotoConfig {
  /** Tabela de votos: 'voto_topico' | 'voto_resposta' */
  votoTabela: 'voto_topico' | 'voto_resposta'
  /** Coluna que referencia a entidade: 'topico_id' | 'resposta_id' */
  idColuna: 'topico_id' | 'resposta_id'
  /** Tabela-alvo onde o score é denormalizado: 'topico_forum' | 'resposta_forum' */
  alvoTabela: 'topico_forum' | 'resposta_forum'
}

export interface ResultadoVoto {
  votos: number
  /** Nº de likes (valor = 1). */
  likes: number
  /** Nº de dislikes (valor = -1). */
  dislikes: number
  /** Voto actual do utilizador após a operação: 1 (like), -1 (dislike) ou 0 (sem voto). */
  meu_voto: number
}

export async function registarVoto(
  cfg: VotoConfig,
  alvoId: number,
  userId: number,
  valor: number,
): Promise<ResultadoVoto> {
  const v = Number(valor)
  if (v !== 1 && v !== -1) {
    throw new Error('valor deve ser 1 (positivo) ou -1 (negativo).')
  }

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT valor FROM ${cfg.votoTabela} WHERE ${cfg.idColuna} = ? AND utilizador_id = ? LIMIT 1`,
      [alvoId, userId],
    )
    const existente = rows[0]?.['valor'] as number | undefined

    let meuVoto: number
    if (existente === v) {
      // Mesmo sentido → remove (toggle)
      await conn.query(
        `DELETE FROM ${cfg.votoTabela} WHERE ${cfg.idColuna} = ? AND utilizador_id = ?`,
        [alvoId, userId],
      )
      meuVoto = 0
    } else if (existente !== undefined) {
      // Muda de sentido
      await conn.query(
        `UPDATE ${cfg.votoTabela} SET valor = ? WHERE ${cfg.idColuna} = ? AND utilizador_id = ?`,
        [v, alvoId, userId],
      )
      meuVoto = v
    } else {
      // Primeiro voto
      await conn.query(
        `INSERT INTO ${cfg.votoTabela} (${cfg.idColuna}, utilizador_id, valor) VALUES (?, ?, ?)`,
        [alvoId, userId, v],
      )
      meuVoto = v
    }

    const [agg] = await conn.query<RowDataPacket[]>(
      `SELECT
         COALESCE(SUM(valor), 0)         AS total,
         COALESCE(SUM(valor = 1), 0)     AS likes,
         COALESCE(SUM(valor = -1), 0)    AS dislikes
       FROM ${cfg.votoTabela} WHERE ${cfg.idColuna} = ?`,
      [alvoId],
    )
    const votos    = Number(agg[0]?.['total'] ?? 0)
    const likes    = Number(agg[0]?.['likes'] ?? 0)
    const dislikes = Number(agg[0]?.['dislikes'] ?? 0)

    await conn.query(`UPDATE ${cfg.alvoTabela} SET votos = ? WHERE id = ?`, [votos, alvoId])

    await conn.commit()
    return { votos, likes, dislikes, meu_voto: meuVoto }
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}
