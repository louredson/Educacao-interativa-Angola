import type { Request, Response } from 'express'
import { pool } from '../config/database.js'
import type { RowDataPacket, ResultSetHeader } from 'mysql2'

// ── GET /api/salas ────────────────────────────────────────────────────────────
// Lista salas onde o utilizador é membro aprovado, ou que criou
export async function listSalas(req: Request, res: Response) {
  const userId = req.user!.userId

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT s.id, s.titulo, s.descricao, s.criador_id, s.so_membros_comentam, s.criado_em,
            u.nome AS criador_nome,
            (SELECT COUNT(*) FROM mensagem_sala WHERE sala_id = s.id) AS total_mensagens,
            (SELECT COUNT(*) FROM sala_membro WHERE sala_id = s.id AND aprovado = 1) AS total_membros
     FROM sala_discussao s
     JOIN utilizador u ON u.id = s.criador_id
     WHERE s.criador_id = ?
        OR EXISTS (SELECT 1 FROM sala_membro sm WHERE sm.sala_id = s.id AND sm.utilizador_id = ? AND sm.aprovado = 1)
     ORDER BY s.criado_em DESC`,
    [userId, userId],
  )

  res.json({ salas: rows })
}

// ── POST /api/salas ───────────────────────────────────────────────────────────
// Criar sala — apenas professor, admin ou superadmin
export async function createSala(req: Request, res: Response) {
  const userId = req.user!.userId
  const { titulo, descricao, so_membros_comentam = true, conteudo_id, topico_id } = req.body ?? {}

  if (!titulo?.trim()) {
    return res.status(400).json({ message: 'O título da sala é obrigatório.' })
  }

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO sala_discussao (titulo, descricao, criador_id, so_membros_comentam, conteudo_id, topico_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [titulo.trim(), descricao ?? null, userId, so_membros_comentam ? 1 : 0, conteudo_id ?? null, topico_id ?? null],
  )

  const salaId = result.insertId

  // O criador é automaticamente membro aprovado com permissão de comentar
  await pool.query(
    `INSERT INTO sala_membro (sala_id, utilizador_id, pode_comentar, aprovado) VALUES (?, ?, 1, 1)`,
    [salaId, userId],
  )

  res.status(201).json({ id: salaId, message: 'Sala de discussão criada.' })
}

// ── GET /api/salas/:id ────────────────────────────────────────────────────────
export async function getSala(req: Request, res: Response) {
  const userId = req.user!.userId
  const salaId = req.params.id

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT s.*, u.nome AS criador_nome FROM sala_discussao s
     JOIN utilizador u ON u.id = s.criador_id WHERE s.id = ?`,
    [salaId],
  )
  const sala = rows[0]
  if (!sala) return res.status(404).json({ message: 'Sala não encontrada.' })

  // Verifica acesso: criador ou membro aprovado
  const isCriador = sala.criador_id === userId
  if (!isCriador) {
    const [mem] = await pool.query<RowDataPacket[]>(
      'SELECT aprovado FROM sala_membro WHERE sala_id = ? AND utilizador_id = ?',
      [salaId, userId],
    )
    if (!mem[0]?.aprovado) {
      return res.status(403).json({ message: 'Não tens acesso a esta sala.' })
    }
  }

  res.json({ sala })
}

// ── GET /api/salas/:id/mensagens ──────────────────────────────────────────────
export async function getMensagens(req: Request, res: Response) {
  const userId = req.user!.userId
  const salaId = req.params.id
  const limite = Math.min(Number(req.query.limite) || 50, 100)
  const antes = req.query.antes as string | undefined

  // Verifica acesso
  const [sala] = await pool.query<RowDataPacket[]>(
    'SELECT criador_id FROM sala_discussao WHERE id = ?', [salaId],
  )
  if (!sala[0]) return res.status(404).json({ message: 'Sala não encontrada.' })

  const isCriador = sala[0].criador_id === userId
  if (!isCriador) {
    const [mem] = await pool.query<RowDataPacket[]>(
      'SELECT aprovado FROM sala_membro WHERE sala_id = ? AND utilizador_id = ?',
      [salaId, userId],
    )
    if (!mem[0]?.aprovado) return res.status(403).json({ message: 'Acesso negado.' })
  }

  const params: (string | number)[] = [String(salaId)]
  let cursor = ''
  if (antes) {
    cursor = 'AND m.id < ?'
    params.push(antes)
  }
  params.push(limite)

  const [mensagens] = await pool.query<RowDataPacket[]>(
    `SELECT m.id, m.mensagem_pai_id, m.mensagem, m.ficheiro_url, m.ficheiro_nome, m.criado_em,
            u.id AS autor_id, u.nome AS autor_nome, u.avatar_url AS autor_avatar,
            pm.mensagem AS pai_mensagem, pm.ficheiro_nome AS pai_ficheiro_nome, pu.nome AS pai_autor_nome
     FROM mensagem_sala m
     JOIN utilizador u ON u.id = m.autor_id
     LEFT JOIN mensagem_sala pm ON pm.id = m.mensagem_pai_id
     LEFT JOIN utilizador pu ON pu.id = pm.autor_id
     WHERE m.sala_id = ? ${cursor}
     ORDER BY m.criado_em DESC
     LIMIT ?`,
    params,
  )

  res.json({ mensagens: mensagens.reverse() })
}

// ── POST /api/salas/:id/mensagens ─────────────────────────────────────────────
export async function postMensagem(req: Request, res: Response) {
  const userId       = req.user!.userId
  const salaId       = req.params.id
  const { mensagem, mensagem_pai_id = null } = req.body ?? {}
  const ficheiro     = (req as any).file as Express.Multer.File | undefined
  const ficheiroUrl  = ficheiro ? `/uploads/forum/${ficheiro.filename}` : null
  const ficheiroNome = ficheiro ? ficheiro.originalname : null

  if (!mensagem?.trim() && !ficheiro) {
    return res.status(400).json({ message: 'Mensagem não pode estar vazia.' })
  }

  // Verifica acesso e permissão de comentar
  const [sala] = await pool.query<RowDataPacket[]>(
    'SELECT criador_id, so_membros_comentam FROM sala_discussao WHERE id = ?', [salaId],
  )
  if (!sala[0]) return res.status(404).json({ message: 'Sala não encontrada.' })

  const isCriador = sala[0].criador_id === userId
  if (!isCriador) {
    const [mem] = await pool.query<RowDataPacket[]>(
      'SELECT aprovado, pode_comentar FROM sala_membro WHERE sala_id = ? AND utilizador_id = ?',
      [salaId, userId],
    )
    if (!mem[0]?.aprovado) return res.status(403).json({ message: 'Não és membro desta sala.' })
    if (sala[0].so_membros_comentam && !mem[0]?.pode_comentar) {
      return res.status(403).json({ message: 'Não tens permissão para comentar nesta sala.' })
    }
  }

  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO mensagem_sala (sala_id, autor_id, mensagem_pai_id, mensagem, ficheiro_url, ficheiro_nome) VALUES (?, ?, ?, ?, ?, ?)',
    [salaId, userId, mensagem_pai_id || null, mensagem?.trim() || '', ficheiroUrl, ficheiroNome],
  )

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT m.id, m.mensagem_pai_id, m.mensagem, m.ficheiro_url, m.ficheiro_nome, m.criado_em,
            u.id AS autor_id, u.nome AS autor_nome, u.avatar_url AS autor_avatar,
            pm.mensagem AS pai_mensagem, pm.ficheiro_nome AS pai_ficheiro_nome, pu.nome AS pai_autor_nome
     FROM mensagem_sala m
     JOIN utilizador u ON u.id = m.autor_id
     LEFT JOIN mensagem_sala pm ON pm.id = m.mensagem_pai_id
     LEFT JOIN utilizador pu ON pu.id = pm.autor_id
     WHERE m.id = ?`,
    [result.insertId],
  )

  res.status(201).json({ mensagem: rows[0] })
}

// ── GET /api/salas/:id/membros ────────────────────────────────────────────────
export async function getMembros(req: Request, res: Response) {
  const userId = req.user!.userId
  const salaId = req.params.id

  const [sala] = await pool.query<RowDataPacket[]>(
    'SELECT criador_id FROM sala_discussao WHERE id = ?', [salaId],
  )
  if (!sala[0]) return res.status(404).json({ message: 'Sala não encontrada.' })
  if (sala[0].criador_id !== userId) return res.status(403).json({ message: 'Apenas o criador pode ver os membros.' })

  const [membros] = await pool.query<RowDataPacket[]>(
    `SELECT u.id, u.nome, u.email, u.avatar_url, sm.aprovado, sm.pode_comentar, sm.entrou_em
     FROM sala_membro sm JOIN utilizador u ON u.id = sm.utilizador_id
     WHERE sm.sala_id = ? ORDER BY sm.entrou_em ASC`,
    [salaId],
  )

  res.json({ membros })
}

// ── PATCH /api/salas/:id/membros/:userId ─────────────────────────────────────
// Aprovar/rejeitar membro ou mudar permissão de comentar — apenas o criador
export async function updateMembro(req: Request, res: Response) {
  const reqUserId = req.user!.userId
  const { id: salaId, userId: membroId } = req.params
  const { aprovado, pode_comentar } = req.body ?? {}

  const [sala] = await pool.query<RowDataPacket[]>(
    'SELECT criador_id FROM sala_discussao WHERE id = ?', [salaId],
  )
  if (!sala[0]) return res.status(404).json({ message: 'Sala não encontrada.' })
  if (sala[0].criador_id !== reqUserId) return res.status(403).json({ message: 'Apenas o criador pode gerir membros.' })

  const updates: string[] = []
  const vals: (number | string)[] = []
  if (aprovado !== undefined) { updates.push('aprovado = ?'); vals.push(aprovado ? 1 : 0) }
  if (pode_comentar !== undefined) { updates.push('pode_comentar = ?'); vals.push(pode_comentar ? 1 : 0) }

  if (!updates.length) return res.status(400).json({ message: 'Nenhum campo para atualizar.' })

  vals.push(String(salaId), String(membroId))
  await pool.query(`UPDATE sala_membro SET ${updates.join(', ')} WHERE sala_id = ? AND utilizador_id = ?`, vals)

  res.json({ message: 'Membro atualizado.' })
}

// ── DELETE /api/salas/:id ─────────────────────────────────────────────────────
export async function deleteSala(req: Request, res: Response) {
  const userId = req.user!.userId
  const role   = req.user!.role
  const salaId = req.params.id

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT criador_id FROM sala_discussao WHERE id = ?', [salaId],
  )
  if (!rows[0]) return res.status(404).json({ message: 'Sala não encontrada.' })

  const isCriador = rows[0].criador_id === userId
  const isAdmin   = role === 'admin' || role === 'superadmin'
  if (!isCriador && !isAdmin) {
    return res.status(403).json({ message: 'Apenas o criador ou um administrador pode apagar esta sala.' })
  }

  await pool.query('DELETE FROM sala_discussao WHERE id = ?', [salaId])
  res.json({ message: 'Sala apagada.' })
}

// ── POST /api/salas/:id/solicitar-acesso ─────────────────────────────────────
export async function solicitarAcesso(req: Request, res: Response) {
  const userId = req.user!.userId
  const salaId = req.params.id

  const [sala] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM sala_discussao WHERE id = ?', [salaId],
  )
  if (!sala[0]) return res.status(404).json({ message: 'Sala não encontrada.' })

  const [existing] = await pool.query<RowDataPacket[]>(
    'SELECT aprovado FROM sala_membro WHERE sala_id = ? AND utilizador_id = ?',
    [salaId, userId],
  )
  if (existing[0]) {
    return res.status(409).json({ message: existing[0].aprovado ? 'Já és membro desta sala.' : 'Pedido de acesso já enviado.' })
  }

  await pool.query(
    'INSERT INTO sala_membro (sala_id, utilizador_id, pode_comentar, aprovado) VALUES (?, ?, 0, 0)',
    [salaId, userId],
  )

  res.status(201).json({ message: 'Pedido de acesso enviado. Aguarda aprovação.' })
}
