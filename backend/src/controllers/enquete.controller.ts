/**
 * enquete.controller.ts
 *
 * Enquetes do fórum — criadas pelo dono do tópico, dentro de tópicos
 * públicos ou privados. Uma enquete por tópico, máx. 6 opções.
 *
 * Endpoints:
 *  POST   /api/topicos/:id/enquete          — criar enquete (dono do tópico)
 *  GET    /api/topicos/:id/enquete          — ver enquete + resultados
 *  POST   /api/topicos/:id/enquete/votar    — votar (qualquer autenticado com acesso)
 *  PATCH  /api/topicos/:id/enquete/encerrar — encerrar (dono ou admin)
 *  DELETE /api/topicos/:id/enquete          — apagar (dono ou admin)
 */
import type { Request, Response } from 'express'
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise'
import { pool } from '../config/database.js'

// ─────────────────────────────────────────────────────────────────────────────
// Helper: verifica se o utilizador tem acesso ao tópico (público ou com acesso aprovado)
// ─────────────────────────────────────────────────────────────────────────────

async function verificarAcessoTopico(topicoId: number, userId: number, role: string): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT tipo_privacidade, criado_por FROM topico_forum WHERE id = ? LIMIT 1',
    [topicoId],
  )
  const topico = rows[0]
  if (!topico) return false
  if (topico['tipo_privacidade'] === 'publico') return true
  if (role === 'admin' || role === 'superadmin') return true
  if (topico['criado_por'] === userId) return true

  // Tópico privado: verificar acesso aprovado
  const [acesso] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM topico_privado_acesso
     WHERE topico_id = ? AND subscrito_id = ? AND status = 'aprovado' LIMIT 1`,
    [topicoId, userId],
  )
  return (acesso as RowDataPacket[]).length > 0
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/topicos/:id/enquete
// Cria enquete no tópico. Só o dono do tópico pode criar.
// Body: { pergunta, opcoes: string[], encerra_em?: string (ISO date) }
// ─────────────────────────────────────────────────────────────────────────────

export async function criarEnquete(req: Request, res: Response) {
  const topicoId = Number(req.params.id)
  const userId   = req.user!.userId
  const role     = req.user!.role
  const { pergunta, opcoes, encerra_em } = req.body ?? {}

  // Verificar dono do tópico
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT criado_por FROM topico_forum WHERE id = ? LIMIT 1',
    [topicoId],
  )
  const topico = rows[0]
  if (!topico) return res.status(404).json({ message: 'Tópico não encontrado.' })

  if (topico['criado_por'] !== userId && role !== 'admin' && role !== 'superadmin') {
    return res.status(403).json({ message: 'Só o criador do tópico pode adicionar uma enquete.' })
  }

  // Validação
  if (!pergunta?.trim()) {
    return res.status(400).json({ message: 'O campo "pergunta" é obrigatório.' })
  }
  if (!Array.isArray(opcoes) || opcoes.length < 2) {
    return res.status(400).json({ message: 'Uma enquete precisa de pelo menos 2 opções.' })
  }
  if (opcoes.length > 6) {
    return res.status(400).json({ message: 'Uma enquete pode ter no máximo 6 opções.' })
  }
  const opcoesLimpas = opcoes.map((o: unknown) => String(o ?? '').trim()).filter(Boolean)
  if (opcoesLimpas.length !== opcoes.length) {
    return res.status(400).json({ message: 'Todas as opções devem ter texto.' })
  }

  // Verificar se já existe enquete neste tópico
  const [existente] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM forum_enquete WHERE topico_id = ? LIMIT 1',
    [topicoId],
  )
  if ((existente as RowDataPacket[]).length > 0) {
    return res.status(409).json({ message: 'Este tópico já tem uma enquete. Apaga-a primeiro para criar outra.' })
  }

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    const [ins] = await conn.query<ResultSetHeader>(
      `INSERT INTO forum_enquete (topico_id, pergunta, encerra_em)
       VALUES (?, ?, ?)`,
      [topicoId, pergunta.trim(), encerra_em ?? null],
    )
    const enqueteId = ins.insertId

    for (let i = 0; i < opcoesLimpas.length; i++) {
      await conn.query(
        'INSERT INTO forum_enquete_opcao (enquete_id, texto, ordem) VALUES (?, ?, ?)',
        [enqueteId, opcoesLimpas[i], i + 1],
      )
    }

    await conn.commit()

    const enquete = await _carregarEnquete(enqueteId, null)
    return res.status(201).json(enquete)
  } catch (err: unknown) {
    await conn.rollback()
    console.error('[criarEnquete] rollback:', err)
    return res.status(500).json({ message: 'Não foi possível criar a enquete.' })
  } finally {
    conn.release()
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/topicos/:id/enquete
// Devolve a enquete do tópico com resultados e voto do utilizador (se votou).
// ─────────────────────────────────────────────────────────────────────────────

export async function getEnquete(req: Request, res: Response) {
  const topicoId = Number(req.params.id)
  const userId   = req.user?.userId ?? null
  const role     = req.user?.role   ?? 'visitante'

  // Verificar acesso ao tópico
  if (userId !== null) {
    const temAcesso = await verificarAcessoTopico(topicoId, userId, role)
    if (!temAcesso) return res.status(403).json({ message: 'Não tens acesso a este tópico.' })
  }

  const [enqueteRows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM forum_enquete WHERE topico_id = ? LIMIT 1',
    [topicoId],
  )
  const enquete = enqueteRows[0]
  if (!enquete) return res.status(404).json({ message: 'Este tópico não tem enquete.' })

  const resultado = await _carregarEnquete(enquete['id'], userId)
  return res.json(resultado)
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/topicos/:id/enquete/votar
// Body: { opcao_id: number }
// ─────────────────────────────────────────────────────────────────────────────

export async function votarEnquete(req: Request, res: Response) {
  const topicoId = Number(req.params.id)
  const userId   = req.user!.userId
  const role     = req.user!.role
  const { opcao_id } = req.body ?? {}

  if (!opcao_id) return res.status(400).json({ message: 'opcao_id é obrigatório.' })

  // Verificar acesso ao tópico
  const temAcesso = await verificarAcessoTopico(topicoId, userId, role)
  if (!temAcesso) return res.status(403).json({ message: 'Não tens acesso a este tópico.' })

  // Carregar enquete
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM forum_enquete WHERE topico_id = ? LIMIT 1',
    [topicoId],
  )
  const enquete = rows[0]
  if (!enquete) return res.status(404).json({ message: 'Este tópico não tem enquete.' })

  if (enquete['encerrada']) {
    return res.status(409).json({ message: 'Esta enquete já foi encerrada.' })
  }

  // Verificar prazo
  if (enquete['encerra_em'] && new Date(enquete['encerra_em']) < new Date()) {
    // Fechar automaticamente
    await pool.query('UPDATE forum_enquete SET encerrada = 1 WHERE id = ?', [enquete['id']])
    return res.status(409).json({ message: 'O prazo desta enquete expirou.' })
  }

  // Verificar se a opção pertence à enquete
  const [opcaoRows] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM forum_enquete_opcao WHERE id = ? AND enquete_id = ? LIMIT 1',
    [opcao_id, enquete['id']],
  )
  if ((opcaoRows as RowDataPacket[]).length === 0) {
    return res.status(400).json({ message: 'Opção inválida para esta enquete.' })
  }

  try {
    await pool.query(
      'INSERT INTO forum_enquete_voto (enquete_id, opcao_id, usuario_id) VALUES (?, ?, ?)',
      [enquete['id'], opcao_id, userId],
    )
  } catch (err: any) {
    // UNIQUE constraint — já votou
    if (err?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Já votaste nesta enquete.' })
    }
    throw err
  }

  const resultado = await _carregarEnquete(enquete['id'], userId)
  return res.json(resultado)
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/topicos/:id/enquete/encerrar
// Encerra a enquete (dono do tópico ou admin).
// ─────────────────────────────────────────────────────────────────────────────

export async function encerrarEnquete(req: Request, res: Response) {
  const topicoId = Number(req.params.id)
  const userId   = req.user!.userId
  const role     = req.user!.role

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT e.*, t.criado_por AS dono_topico
     FROM forum_enquete e
     JOIN topico_forum t ON t.id = e.topico_id
     WHERE e.topico_id = ? LIMIT 1`,
    [topicoId],
  )
  const enquete = rows[0]
  if (!enquete) return res.status(404).json({ message: 'Enquete não encontrada.' })

  if (enquete['dono_topico'] !== userId && role !== 'admin' && role !== 'superadmin') {
    return res.status(403).json({ message: 'Não tens permissão para encerrar esta enquete.' })
  }

  await pool.query('UPDATE forum_enquete SET encerrada = 1 WHERE id = ?', [enquete['id']])
  return res.json({ message: 'Enquete encerrada.' })
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/topicos/:id/enquete
// Apaga a enquete (dono do tópico ou admin).
// ─────────────────────────────────────────────────────────────────────────────

export async function apagarEnquete(req: Request, res: Response) {
  const topicoId = Number(req.params.id)
  const userId   = req.user!.userId
  const role     = req.user!.role

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT e.id, t.criado_por AS dono_topico
     FROM forum_enquete e
     JOIN topico_forum t ON t.id = e.topico_id
     WHERE e.topico_id = ? LIMIT 1`,
    [topicoId],
  )
  const enquete = rows[0]
  if (!enquete) return res.status(404).json({ message: 'Enquete não encontrada.' })

  if (enquete['dono_topico'] !== userId && role !== 'admin' && role !== 'superadmin') {
    return res.status(403).json({ message: 'Não tens permissão para apagar esta enquete.' })
  }

  await pool.query('DELETE FROM forum_enquete WHERE id = ?', [enquete['id']])
  return res.status(204).send()
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper interno — carrega enquete com contagem de votos e voto do utilizador
// ─────────────────────────────────────────────────────────────────────────────

async function _carregarEnquete(enqueteId: number, userId: number | null) {
  const [meta] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM forum_enquete WHERE id = ? LIMIT 1',
    [enqueteId],
  )

  const [opcoes] = await pool.query<RowDataPacket[]>(
    `SELECT o.id, o.texto, o.ordem,
            COUNT(v.id) AS votos
     FROM forum_enquete_opcao o
     LEFT JOIN forum_enquete_voto v ON v.opcao_id = o.id
     WHERE o.enquete_id = ?
     GROUP BY o.id
     ORDER BY o.ordem`,
    [enqueteId],
  )

  const total_votos = (opcoes as RowDataPacket[]).reduce((acc, o) => acc + Number(o['votos']), 0)

  // Calcular percentagens
  const opcoesComPerc = (opcoes as RowDataPacket[]).map(o => ({
    ...o,
    votos: Number(o['votos']),
    percentagem: total_votos > 0 ? Math.round((Number(o['votos']) / total_votos) * 100) : 0,
  }))

  // Voto do utilizador actual
  let meu_voto: number | null = null
  if (userId !== null) {
    const [voto] = await pool.query<RowDataPacket[]>(
      'SELECT opcao_id FROM forum_enquete_voto WHERE enquete_id = ? AND usuario_id = ? LIMIT 1',
      [enqueteId, userId],
    )
    meu_voto = (voto as RowDataPacket[])[0]?.['opcao_id'] ?? null
  }

  return {
    ...meta[0],
    opcoes: opcoesComPerc,
    total_votos,
    meu_voto,
  }
}
