import type { Request, Response } from 'express'
import { pool } from '../config/database.js'
import type { RowDataPacket, ResultSetHeader } from 'mysql2'
import { enviarEmailConvite } from '../services/email.service.js'
import { criarNotificacao } from '../services/notificacao.service.js'

function gerarCodigo(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

// ── POST /api/convites ────────────────────────────────────────────────────────
// Cria um convite (por código e/ou email) para uma sala ou tópico privado
export async function criarConvite(req: Request, res: Response) {
  const userId = req.user!.userId
  const { tipo, entidade_id, email_destino, max_usos = 1, validade_horas } = req.body ?? {}

  if (!['sala', 'topico'].includes(tipo) || !entidade_id) {
    return res.status(400).json({ message: 'tipo (sala|topico) e entidade_id são obrigatórios.' })
  }

  // Verifica que o utilizador é dono da entidade
  if (tipo === 'sala') {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, titulo, criador_id FROM sala_discussao WHERE id = ?', [entidade_id],
    )
    if (!rows[0]) return res.status(404).json({ message: 'Sala não encontrada.' })
    if (rows[0].criador_id !== userId) return res.status(403).json({ message: 'Apenas o criador pode convidar membros.' })
  } else {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, titulo, criado_por FROM topico_forum WHERE id = ?', [entidade_id],
    )
    if (!rows[0]) return res.status(404).json({ message: 'Tópico não encontrado.' })
    if (rows[0].criado_por !== userId) return res.status(403).json({ message: 'Apenas o autor pode convidar.' })
  }

  const codigo = gerarCodigo()
  const expira = validade_horas
    ? new Date(Date.now() + validade_horas * 3600 * 1000).toISOString().slice(0, 19).replace('T', ' ')
    : null

  await pool.query<ResultSetHeader>(
    `INSERT INTO convite (tipo, entidade_id, criador_id, codigo, email_destino, max_usos, expira_em)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [tipo, entidade_id, userId, codigo, email_destino ?? null, max_usos, expira],
  )

  // Envia email e, se o email corresponder a um utilizador já registado,
  // também cria uma notificação in-app com o convite — para poder ser
  // aceite directamente a partir das notificações (web e mobile), sem
  // precisar de abrir o email.
  if (email_destino) {
    let nomeEntidade = ''
    if (tipo === 'sala') {
      const [rows] = await pool.query<RowDataPacket[]>('SELECT titulo FROM sala_discussao WHERE id = ?', [entidade_id])
      nomeEntidade = rows[0]?.titulo ?? ''
    } else {
      const [rows] = await pool.query<RowDataPacket[]>('SELECT titulo FROM topico_forum WHERE id = ?', [entidade_id])
      nomeEntidade = rows[0]?.titulo ?? ''
    }

    const [utilizadorRows] = await pool.query<RowDataPacket[]>(
      'SELECT id, nome FROM utilizador WHERE email = ? LIMIT 1',
      [String(email_destino).toLowerCase()],
    )
    const destinatario = utilizadorRows[0]

    await enviarEmailConvite(
      email_destino,
      destinatario?.nome ?? 'Utilizador',
      nomeEntidade,
      tipo === 'sala' ? 'Sala de Discussão' : 'Tópico Privado',
      codigo,
    )

    if (destinatario && destinatario.id !== userId) {
      await criarNotificacao({
        usuarioId: destinatario.id,
        tipo: tipo === 'sala' ? 'convite_sala' : 'convite_topico',
        entidadeId: entidade_id,
        titulo: tipo === 'sala' ? 'Convite para uma sala de discussão' : 'Convite para um tópico privado',
        mensagem: `Foste convidado(a) para ${tipo === 'sala' ? 'a sala' : 'o tópico'} "${nomeEntidade}".`,
        link: `/salas?codigo=${codigo}`,
      })
    }
  }

  res.status(201).json({ codigo, message: 'Convite criado.' })
}

// ── POST /api/convites/usar ───────────────────────────────────────────────────
// Utilizador usa um código de convite para entrar numa sala ou tópico privado
export async function usarConvite(req: Request, res: Response) {
  const userId = req.user!.userId
  const { codigo } = req.body ?? {}

  if (!codigo?.trim()) {
    return res.status(400).json({ message: 'Código de convite em falta.' })
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM convite WHERE codigo = ? AND (expira_em IS NULL OR expira_em > NOW())
     AND (max_usos IS NULL OR usos < max_usos)`,
    [codigo.trim().toUpperCase()],
  )
  const convite = rows[0]
  if (!convite) {
    return res.status(404).json({ message: 'Código inválido, expirado ou já esgotado.' })
  }

  if (convite.tipo === 'sala') {
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT aprovado FROM sala_membro WHERE sala_id = ? AND utilizador_id = ?',
      [convite.entidade_id, userId],
    )
    if (existing[0]?.aprovado) return res.status(409).json({ message: 'Já és membro desta sala.' })

    if (existing[0]) {
      await pool.query(
        'UPDATE sala_membro SET aprovado = 1, pode_comentar = 1 WHERE sala_id = ? AND utilizador_id = ?',
        [convite.entidade_id, userId],
      )
    } else {
      await pool.query(
        'INSERT INTO sala_membro (sala_id, utilizador_id, aprovado, pode_comentar) VALUES (?, ?, 1, 1)',
        [convite.entidade_id, userId],
      )
    }
  } else {
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT estado FROM topico_privado_acesso WHERE topico_id = ? AND utilizador_id = ?',
      [convite.entidade_id, userId],
    )
    if (existing[0]?.estado === 'aprovado') return res.status(409).json({ message: 'Já tens acesso a este tópico.' })

    if (existing[0]) {
      await pool.query(
        "UPDATE topico_privado_acesso SET estado = 'aprovado' WHERE topico_id = ? AND utilizador_id = ?",
        [convite.entidade_id, userId],
      )
    } else {
      await pool.query(
        "INSERT INTO topico_privado_acesso (topico_id, utilizador_id, estado) VALUES (?, ?, 'aprovado')",
        [convite.entidade_id, userId],
      )
    }
  }

  // Incrementa usos
  await pool.query('UPDATE convite SET usos = usos + 1 WHERE id = ?', [convite.id])

  // Notifica o criador da sala quando alguém entra
  if (convite.tipo === 'sala') {
    const [salaRows] = await pool.query<RowDataPacket[]>(
      'SELECT criador_id, titulo FROM sala_discussao WHERE id = ?',
      [convite.entidade_id],
    )
    const sala = salaRows[0]
    if (sala && sala['criador_id'] !== userId) {
      const [membroRows] = await pool.query<RowDataPacket[]>(
        'SELECT nome FROM utilizador WHERE id = ? LIMIT 1',
        [userId],
      )
      const membroNome = membroRows[0]?.['nome'] ?? 'Um utilizador'
      await criarNotificacao({
        usuarioId: sala['criador_id'],
        tipo: 'membro_entrou_sala',
        entidadeId: convite.entidade_id,
        titulo: 'Novo membro na sala',
        mensagem: `${membroNome} entrou na sala "${(sala['titulo'] as string).slice(0, 60)}".`,
        link: '/salas',
      })
    }
  }

  res.json({
    message: 'Convite aceite com sucesso.',
    tipo: convite.tipo,
    entidade_id: convite.entidade_id,
  })
}

// ── GET /api/convites/meus ────────────────────────────────────────────────────
// Lista convites criados pelo utilizador
export async function listarConvites(req: Request, res: Response) {
  const userId = req.user!.userId
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT c.*,
       CASE WHEN c.tipo='sala' THEN (SELECT titulo FROM sala_discussao WHERE id=c.entidade_id)
            ELSE (SELECT titulo FROM topico_forum WHERE id=c.entidade_id)
       END AS entidade_titulo
     FROM convite c WHERE c.criador_id = ? ORDER BY c.criado_em DESC`,
    [userId],
  )
  res.json({ convites: rows })
}
