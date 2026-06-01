/**
 * QuizController
 *
 * Regras de negócio:
 *  - Um utilizador só pode responder ao mesmo quiz uma vez por dia (429)
 *  - Um quiz só pode ser publicado com ≥ 5 perguntas
 *  - Pontuação = (respostas correctas / total) × 100
 */
import type { Request, Response } from 'express'
import type { RowDataPacket, ResultSetHeader } from 'mysql2'
import { pool } from '../config/database.js'
import { checkQuizAchievements } from '../services/achievement.service.js'

// ── GET /api/quizzes ─────────────────────────────────────────────────────────
export async function listQuizzes(_req: Request, res: Response) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT q.*, u.nome AS criado_por_nome,
            COUNT(p.id) AS total_perguntas
     FROM quiz q
     LEFT JOIN utilizador u ON u.id = q.criado_por
     LEFT JOIN quiz_pergunta p ON p.quiz_id = q.id
     GROUP BY q.id
     ORDER BY q.criado_em DESC`,
  )
  res.json(rows)
}

// ── GET /api/quizzes/:id ──────────────────────────────────────────────────────
export async function getQuiz(req: Request, res: Response) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT q.*, u.nome AS criado_por_nome FROM quiz q
     LEFT JOIN utilizador u ON u.id = q.criado_por
     WHERE q.id = ? LIMIT 1`,
    [req.params.id],
  )
  const quiz = rows[0]
  if (!quiz) return res.status(404).json({ message: 'Quiz não encontrado.' })

  const [perguntas] = await pool.query<RowDataPacket[]>(
    `SELECT id, pergunta, opcao_a, opcao_b, opcao_c, opcao_d, explicacao, ordem
     FROM quiz_pergunta WHERE quiz_id = ? ORDER BY ordem`,
    [req.params.id],
  )

  return res.json({ ...quiz, perguntas })
}

// ── POST /api/quizzes ─────────────────────────────────────────────────────────
export async function createQuiz(req: Request, res: Response) {
  const userId = req.user!.userId
  const { titulo, descricao = null, categoria = null, thumbnail_filename = null } = req.body ?? {}

  if (!titulo) return res.status(400).json({ message: 'titulo é obrigatório.' })

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO quiz (titulo, descricao, categoria, thumbnail_filename, criado_por)
     VALUES (?, ?, ?, ?, ?)`,
    [titulo, descricao, categoria, thumbnail_filename, userId],
  )

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM quiz WHERE id = ? LIMIT 1',
    [result.insertId],
  )
  return res.status(201).json(rows[0])
}

// ── PUT /api/quizzes/:id ──────────────────────────────────────────────────────
export async function updateQuiz(req: Request, res: Response) {
  const userId = req.user!.userId
  const role   = req.user!.role

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM quiz WHERE id = ? LIMIT 1',
    [req.params.id],
  )
  const quiz = rows[0]
  if (!quiz) return res.status(404).json({ message: 'Quiz não encontrado.' })

  // Professor só edita os seus próprios quizzes
  if (role !== 'admin' && quiz['criado_por'] !== userId) {
    return res.status(403).json({ message: 'Não tens permissão para editar este quiz.' })
  }

  const allowed  = ['titulo', 'descricao', 'categoria', 'thumbnail_filename', 'ativo'] as const
  const updates: string[] = []
  const values:  unknown[] = []

  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      updates.push(`${key} = ?`)
      values.push(req.body[key])
    }
  }

  // Activar um quiz requer pelo menos 5 perguntas
  if (req.body?.ativo === true || req.body?.ativo === 1) {
    const [cnt] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS total FROM quiz_pergunta WHERE quiz_id = ?',
      [req.params.id],
    )
    if ((cnt[0]?.['total'] ?? 0) < 5) {
      return res.status(422).json({ message: 'Um quiz precisa de pelo menos 5 perguntas para ser activado.' })
    }
  }

  if (!updates.length) return res.status(400).json({ message: 'Nenhum campo para actualizar.' })

  values.push(req.params.id)
  await pool.query(`UPDATE quiz SET ${updates.join(', ')} WHERE id = ?`, values)

  const [updated] = await pool.query<RowDataPacket[]>('SELECT * FROM quiz WHERE id = ? LIMIT 1', [req.params.id])
  return res.json(updated[0])
}

// ── DELETE /api/quizzes/:id ───────────────────────────────────────────────────
export async function deleteQuiz(req: Request, res: Response) {
  const [result] = await pool.query<ResultSetHeader>(
    'DELETE FROM quiz WHERE id = ?',
    [req.params.id],
  )
  if (result.affectedRows === 0) return res.status(404).json({ message: 'Quiz não encontrado.' })
  return res.status(204).send()
}

// ── POST /api/quizzes/:id/perguntas ─────────────────────────────────────────
export async function addPergunta(req: Request, res: Response) {
  const { pergunta, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta, explicacao = null, ordem = 0 } = req.body ?? {}

  if (!pergunta || !opcao_a || !opcao_b || !opcao_c || !opcao_d || resposta_correta == null) {
    return res.status(400).json({ message: 'Todos os campos da pergunta são obrigatórios.' })
  }
  if (![1, 2, 3, 4].includes(Number(resposta_correta))) {
    return res.status(400).json({ message: 'resposta_correta deve ser 1, 2, 3 ou 4.' })
  }

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO quiz_pergunta (quiz_id, pergunta, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta, explicacao, ordem)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.params.id, pergunta, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta, explicacao, ordem],
  )

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM quiz_pergunta WHERE id = ? LIMIT 1',
    [result.insertId],
  )
  return res.status(201).json(rows[0])
}

// ── DELETE /api/quizzes/:id/perguntas/:perguntaId ────────────────────────────
export async function deletePergunta(req: Request, res: Response) {
  const [result] = await pool.query<ResultSetHeader>(
    'DELETE FROM quiz_pergunta WHERE id = ? AND quiz_id = ?',
    [req.params.perguntaId, req.params.id],
  )
  if (result.affectedRows === 0) return res.status(404).json({ message: 'Pergunta não encontrada.' })
  return res.status(204).send()
}

// ── POST /api/quizzes/:id/attempt ─────────────────────────────────────────────
/**
 * Body: { respostas: [{ pergunta_id, resposta_escolhida (1-4) }] }
 */
export async function submitAttempt(req: Request, res: Response) {
  const userId  = req.user!.userId
  const quizId  = Number(req.params.id)
  const { respostas } = req.body ?? {}

  if (!Array.isArray(respostas) || respostas.length === 0) {
    return res.status(400).json({ message: 'respostas é obrigatório.' })
  }

  // Regra: apenas 1 tentativa por dia
  const [tentativaHoje] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM resposta_quiz_usuario
     WHERE usuario_id = ? AND quiz_id = ? AND DATE(data_realizacao) = CURDATE()
     LIMIT 1`,
    [userId, quizId],
  )
  if ((tentativaHoje as RowDataPacket[]).length > 0) {
    return res.status(429).json({ message: 'Já realizaste este quiz hoje. Tenta amanhã.' })
  }

  // Busca as perguntas correctas
  const [perguntas] = await pool.query<RowDataPacket[]>(
    'SELECT id, resposta_correta FROM quiz_pergunta WHERE quiz_id = ?',
    [quizId],
  )
  if ((perguntas as RowDataPacket[]).length === 0) {
    return res.status(404).json({ message: 'Quiz sem perguntas.' })
  }

  const mapaCorretas = new Map<number, number>()
  for (const p of perguntas as RowDataPacket[]) {
    mapaCorretas.set(Number(p['id']), Number(p['resposta_correta']))
  }

  let acertos = 0
  const resultados: { pergunta_id: number; resposta_escolhida: number; correta: boolean }[] = []

  for (const r of respostas) {
    const perguntaId = Number(r.pergunta_id)
    const escolhida  = Number(r.resposta_escolhida)
    const correta    = mapaCorretas.get(perguntaId) === escolhida
    if (correta) acertos++
    resultados.push({ pergunta_id: perguntaId, resposta_escolhida: escolhida, correta })
  }

  const total     = perguntas.length
  const percentual = Math.round((acertos / total) * 100)

  // Regista a tentativa global
  const [ins] = await pool.query<ResultSetHeader>(
    `INSERT INTO resposta_quiz_usuario (usuario_id, quiz_id, pontuacao, total_perguntas, percentual_acerto)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, quizId, acertos, total, percentual],
  )

  // Regista cada resposta individual
  for (const r of resultados) {
    await pool.query(
      `INSERT INTO resposta_quiz (subscrito_id, quiz_id, pergunta_id, resposta_escolhida, correta)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, quizId, r.pergunta_id, String(r.resposta_escolhida), r.correta ? 1 : 0],
    )
  }

  // Verifica conquistas de forma assíncrona
  checkQuizAchievements(userId, percentual).catch(() => null)

  return res.status(201).json({
    tentativaId:   ins.insertId,
    total,
    acertos,
    percentual,
    resultados,
  })
}

// ── GET /api/quizzes/:id/ranking ─────────────────────────────────────────────
export async function quizRanking(req: Request, res: Response) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT u.id AS utilizador_id, u.nome, u.avatar_url,
            MAX(r.percentual_acerto) AS melhor_percentual,
            MIN(r.data_realizacao)   AS primeira_tentativa
     FROM resposta_quiz_usuario r
     JOIN utilizador u ON u.id = r.usuario_id
     WHERE r.quiz_id = ?
     GROUP BY u.id
     ORDER BY melhor_percentual DESC, primeira_tentativa ASC
     LIMIT 20`,
    [req.params.id],
  )
  res.json(rows)
}

// ── GET /api/quizzes/:id/stats (professor/admin) ─────────────────────────────
export async function quizStats(req: Request, res: Response) {
  const [geral] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total_tentativas,
            AVG(percentual_acerto) AS media_percentual,
            MAX(percentual_acerto) AS max_percentual
     FROM resposta_quiz_usuario WHERE quiz_id = ?`,
    [req.params.id],
  )

  const [porPergunta] = await pool.query<RowDataPacket[]>(
    `SELECT p.pergunta, p.id AS pergunta_id,
            COUNT(*) AS total_respostas,
            SUM(r.correta) AS total_correctas,
            ROUND(SUM(r.correta) / COUNT(*) * 100, 1) AS taxa_acerto
     FROM resposta_quiz r
     JOIN quiz_pergunta p ON p.id = r.pergunta_id
     WHERE r.quiz_id = ?
     GROUP BY p.id`,
    [req.params.id],
  )

  res.json({ geral: geral[0], porPergunta })
}
