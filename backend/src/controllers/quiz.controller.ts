/**
 * quiz.controller.ts
 *
 * Pontos implementados (análise da sessão anterior):
 *
 *  PONTO 1  — listQuizzes         → alunos só vêem quizzes activos; admin vê todos
 *  PONTO 2  — getQuiz             → alunos não recebem resposta_correta/explicacao
 *  PONTO 3  — listMeusQuizzes     → admin lista os seus próprios quizzes (draft + publicados)
 *  PONTO 4  — gerarQuizComIA      → POST /quizzes/gerar-ia  (portagem do GeminiQuizService via Groq)
 *  PONTO 5  — persistQuiz/update  → registo já encapsula transacção replace-all (pontos 9/10 anteriores)
 *  PONTO 8  — ownership           → admin só edita/apaga quizzes que criou; superadmin pode editar todos
 *  PONTO 9  — createQuizComPerguntas → criação atómica em transacção
 *  PONTO 10 — updateQuizComPerguntas → replace-all em transacção
 */
import type { Request, Response } from 'express'
import type { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise'
import { pool }                from '../config/database.js'
import { checkQuizAchievements } from '../services/achievement.service.js'
import { gerarQuizComIA }      from '../services/gemini.service.js'

// ─────────────────────────────────────────────────────────────────────────────
// Tipos locais
// ─────────────────────────────────────────────────────────────────────────────

interface PerguntaInput {
  pergunta: string
  opcao_a: string
  opcao_b: string
  opcao_c: string
  opcao_d: string
  resposta_correta: number   // 1 | 2 | 3 | 4
  explicacao?: string | null
  ordem?: number
}

interface QuizComPerguntasBody {
  titulo: string
  descricao?: string | null
  categoria?: string | null
  thumbnail_filename?: string | null
  ativo?: boolean
  perguntas: PerguntaInput[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers internos
// ─────────────────────────────────────────────────────────────────────────────

function validarPergunta(p: PerguntaInput, idx: number): void {
  const campos: (keyof PerguntaInput)[] = ['pergunta', 'opcao_a', 'opcao_b', 'opcao_c', 'opcao_d']
  for (const campo of campos) {
    if (!String(p[campo] ?? '').trim()) {
      throw new Error(`Pergunta ${idx + 1}: o campo "${campo}" é obrigatório.`)
    }
  }
  if (![1, 2, 3, 4].includes(Number(p.resposta_correta))) {
    throw new Error(`Pergunta ${idx + 1}: resposta_correta deve ser 1, 2, 3 ou 4.`)
  }
}

async function inserirPerguntas(
  conn: PoolConnection,
  quizId: number,
  perguntas: PerguntaInput[],
): Promise<void> {
  for (let i = 0; i < perguntas.length; i++) {
    const p = perguntas[i]
    await conn.query<ResultSetHeader>(
      `INSERT INTO quiz_pergunta
         (quiz_id, pergunta, opcao_a, opcao_b, opcao_c, opcao_d,
          resposta_correta, explicacao, ordem)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        quizId,
        p.pergunta.trim(),
        p.opcao_a.trim(),
        p.opcao_b.trim(),
        p.opcao_c.trim(),
        p.opcao_d.trim(),
        Number(p.resposta_correta),
        p.explicacao?.trim() ?? null,
        p.ordem ?? i + 1,
      ],
    )
  }
}

/**
 * PONTO 8 — Verificação de ownership.
 *
 * Regra: um admin só pode editar/apagar quizzes que ele próprio criou.
 * Excepção: role 'superadmin' pode editar qualquer quiz (para suporte/correcções).
 * 
 * Retorna o quiz se o utilizador tiver permissão, ou envia 403/404 e retorna null.
 */
async function verificarOwnership(
  res: Response,
  quizId: number,
  userId: number,
  role: string,
): Promise<RowDataPacket | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM quiz WHERE id = ? LIMIT 1',
    [quizId],
  )
  const quiz = rows[0]

  if (!quiz) {
    res.status(404).json({ message: 'Quiz não encontrado.' })
    return null
  }

  // Superadmin pode tudo; toda a gente mais só o que é seu
  if (role === 'superadmin') return quiz

  if (quiz['criado_por'] !== userId) {
    res.status(403).json({
      message: 'Não tens permissão para editar este quiz. Só podes editar quizzes que criaste.',
    })
    return null
  }

  return quiz
}

/**
 * Verifica se o utilizador pode CRIAR quizzes do Explorar.
 * Condições (OR):
 *   - role === 'admin' ou 'superadmin'
 *   - pode_criar_quiz = TRUE na tabela utilizador
 *
 * Retorna true se permitido; envia 403 e retorna false caso contrário.
 */
async function verificarPermissaoCriarQuiz(
  res: Response,
  userId: number,
  role: string,
): Promise<boolean> {
  if (role === 'admin' || role === 'superadmin') return true

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT pode_criar_quiz FROM utilizador WHERE id = ? LIMIT 1',
    [userId],
  )
  if (rows[0]?.['pode_criar_quiz']) return true

  res.status(403).json({
    message: 'Não tens permissão para criar quizzes. Pede ao administrador que te atribua esta permissão.',
  })
  return false
}

// ─────────────────────────────────────────────────────────────────────────────
// PONTO 1 — GET /api/quizzes
// Alunos: apenas quizzes activos.  Admin/superadmin: todos (incluindo inactivos).
// ─────────────────────────────────────────────────────────────────────────────

export async function listQuizzes(req: Request, res: Response) {
  const role     = req.user?.role ?? 'user'
  const isStaff  = role === 'admin' || role === 'superadmin'

  // Staff vê todos; alunos só vêem activos
  const whereClause = isStaff ? '' : 'WHERE q.ativo = 1'

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT q.id, q.titulo, q.descricao, q.categoria, q.ativo,
            q.criado_por, q.criado_em,
            u.nome AS criado_por_nome,
            COUNT(p.id) AS total_perguntas
     FROM quiz q
     LEFT JOIN utilizador u ON u.id = q.criado_por
     LEFT JOIN quiz_pergunta p ON p.quiz_id = q.id
     ${whereClause}
     GROUP BY q.id
     ORDER BY q.criado_em DESC`,
  )
  res.json(rows)
}

// ─────────────────────────────────────────────────────────────────────────────
// PONTO 3 — GET /api/quizzes/meus
// Lista os quizzes criados pelo próprio admin (todos os estados).
// ─────────────────────────────────────────────────────────────────────────────

export async function listMeusQuizzes(req: Request, res: Response) {
  const userId = req.user!.userId

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT q.id, q.titulo, q.descricao, q.categoria, q.ativo,
            q.criado_em,
            COUNT(p.id)  AS total_perguntas,
            COUNT(DISTINCT r.id) AS total_tentativas
     FROM quiz q
     LEFT JOIN quiz_pergunta p          ON p.quiz_id = q.id
     LEFT JOIN resposta_quiz_usuario r  ON r.quiz_id = q.id
     WHERE q.criado_por = ?
     GROUP BY q.id
     ORDER BY q.criado_em DESC`,
    [userId],
  )
  res.json(rows)
}

// ─────────────────────────────────────────────────────────────────────────────
// PONTO 2 — GET /api/quizzes/:id
// Alunos: sem resposta_correta nem explicacao.  Admin/superadmin: tudo.
// ─────────────────────────────────────────────────────────────────────────────

export async function getQuiz(req: Request, res: Response) {
  const role    = req.user?.role ?? 'user'
  const isStaff = role === 'admin' || role === 'superadmin'

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT q.*, u.nome AS criado_por_nome FROM quiz q
     LEFT JOIN utilizador u ON u.id = q.criado_por
     WHERE q.id = ? LIMIT 1`,
    [req.params.id],
  )
  const quiz = rows[0]
  if (!quiz) return res.status(404).json({ message: 'Quiz não encontrado.' })

  // Aluno tenta aceder a quiz inactivo → 404
  if (!isStaff && !quiz['ativo']) {
    return res.status(404).json({ message: 'Quiz não encontrado.' })
  }

  // As opções e a resposta correta vêm sempre incluídas — a plataforma dá
  // feedback imediato (verde/vermelho) a cada pergunta respondida, por isso
  // a resposta certa tem de estar disponível assim que o quiz é carregado.
  // A explicação também é sempre incluída, para poder ser mostrada logo
  // após a resposta.
  const camposPerguntas = 'id, pergunta, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta, explicacao, ordem'

  const [perguntas] = await pool.query<RowDataPacket[]>(
    `SELECT ${camposPerguntas} FROM quiz_pergunta WHERE quiz_id = ? ORDER BY ordem`,
    [req.params.id],
  )

  return res.json({ ...quiz, perguntas })
}

// ─────────────────────────────────────────────────────────────────────────────
// PONTO 4 — POST /api/quizzes/gerar-ia
// Gera quiz + perguntas via Groq (portagem do GeminiQuizService.php).
// Devolve o payload pronto para ser enviado ao endpoint /completo sem guardar nada.
// ─────────────────────────────────────────────────────────────────────────────

export async function gerarQuiz(req: Request, res: Response) {
  const { tema, titulo, descricao, categoria, dificuldade, publico, quantidade } = req.body ?? {}

  if (!tema?.trim()) {
    return res.status(400).json({ message: 'O campo "tema" é obrigatório.' })
  }

  try {
    const resultado = await gerarQuizComIA({
      tema,
      titulo,
      descricao,
      categoria,
      dificuldade,
      publico,
      quantidade: quantidade ? Number(quantidade) : undefined,
    })

    // Devolve o quiz gerado sem guardar — o admin revê e confirma via /completo
    return res.json(resultado)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao gerar quiz com IA.'
    return res.status(500).json({ message: msg })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PONTO 9 — POST /api/quizzes/completo
// Cria quiz + perguntas numa única transacção atómica.
// ─────────────────────────────────────────────────────────────────────────────

export async function createQuizComPerguntas(req: Request, res: Response) {
  const userId = req.user!.userId
  const role   = req.user!.role
  const body   = req.body as QuizComPerguntasBody

  // Só admin, superadmin ou utilizadores com pode_criar_quiz podem criar
  const podeCriar = await verificarPermissaoCriarQuiz(res, userId, role)
  if (!podeCriar) return

  if (!body.titulo?.trim()) {
    return res.status(400).json({ message: 'titulo é obrigatório.' })
  }
  if (!Array.isArray(body.perguntas) || body.perguntas.length === 0) {
    return res.status(400).json({ message: 'Inclui pelo menos uma pergunta em "perguntas".' })
  }

  try { body.perguntas.forEach((p, i) => validarPergunta(p, i)) }
  catch (err: unknown) {
    return res.status(400).json({ message: (err as Error).message })
  }

  const querActivar = body.ativo === true
  if (querActivar && body.perguntas.length < 5) {
    return res.status(422).json({
      message: 'Para activar o quiz são necessárias pelo menos 5 perguntas.',
    })
  }

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    const [result] = await conn.query<ResultSetHeader>(
      `INSERT INTO quiz (titulo, descricao, categoria, thumbnail_filename, ativo, criado_por)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        body.titulo.trim(),
        body.descricao?.trim() ?? null,
        body.categoria?.trim() ?? null,
        body.thumbnail_filename?.trim() ?? null,
        querActivar ? 1 : 0,
        userId,
      ],
    )

    const quizId = result.insertId
    await inserirPerguntas(conn, quizId, body.perguntas)
    await conn.commit()

    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT q.*, u.nome AS criado_por_nome, COUNT(p.id) AS total_perguntas
       FROM quiz q
       LEFT JOIN utilizador u ON u.id = q.criado_por
       LEFT JOIN quiz_pergunta p ON p.quiz_id = q.id
       WHERE q.id = ? GROUP BY q.id`,
      [quizId],
    )
    return res.status(201).json(rows[0])
  } catch (err: unknown) {
    await conn.rollback()
    console.error('[createQuizComPerguntas] rollback:', err)
    return res.status(500).json({ message: 'Não foi possível guardar o quiz.', detail: (err as Error).message })
  } finally {
    conn.release()
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PONTO 10 + PONTO 8 — PUT /api/quizzes/:id/completo
// Replace-all com verificação de ownership.
// ─────────────────────────────────────────────────────────────────────────────

export async function updateQuizComPerguntas(req: Request, res: Response) {
  const quizId = Number(req.params.id)
  const userId = req.user!.userId
  const role   = req.user!.role
  const body   = req.body as QuizComPerguntasBody

  // PONTO 8 — ownership
  const quiz = await verificarOwnership(res, quizId, userId, role)
  if (!quiz) return

  if (!body.titulo?.trim()) {
    return res.status(400).json({ message: 'titulo é obrigatório.' })
  }
  if (!Array.isArray(body.perguntas) || body.perguntas.length === 0) {
    return res.status(400).json({ message: 'Inclui pelo menos uma pergunta em "perguntas".' })
  }

  try { body.perguntas.forEach((p, i) => validarPergunta(p, i)) }
  catch (err: unknown) {
    return res.status(400).json({ message: (err as Error).message })
  }

  const querActivar = body.ativo === true
  if (querActivar && body.perguntas.length < 5) {
    return res.status(422).json({
      message: 'Para activar o quiz são necessárias pelo menos 5 perguntas.',
    })
  }

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    await conn.query(
      `UPDATE quiz SET titulo = ?, descricao = ?, categoria = ?, thumbnail_filename = ?, ativo = ?
       WHERE id = ?`,
      [
        body.titulo.trim(),
        body.descricao?.trim() ?? null,
        body.categoria?.trim() ?? null,
        body.thumbnail_filename?.trim() ?? quiz['thumbnail_filename'],
        querActivar ? 1 : (body.ativo === false ? 0 : quiz['ativo']),
        quizId,
      ],
    )

    // Replace-all: apaga todas as perguntas e reinsere
    await conn.query('DELETE FROM quiz_pergunta WHERE quiz_id = ?', [quizId])
    await inserirPerguntas(conn, quizId, body.perguntas)
    await conn.commit()

    const [updated] = await conn.query<RowDataPacket[]>(
      `SELECT q.*, u.nome AS criado_por_nome, COUNT(p.id) AS total_perguntas
       FROM quiz q
       LEFT JOIN utilizador u ON u.id = q.criado_por
       LEFT JOIN quiz_pergunta p ON p.quiz_id = q.id
       WHERE q.id = ? GROUP BY q.id`,
      [quizId],
    )
    return res.json(updated[0])
  } catch (err: unknown) {
    await conn.rollback()
    console.error('[updateQuizComPerguntas] rollback:', err)
    return res.status(500).json({ message: 'Não foi possível actualizar o quiz.', detail: (err as Error).message })
  } finally {
    conn.release()
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/quizzes  (criação simples — só metadados, sem perguntas)
// ─────────────────────────────────────────────────────────────────────────────

export async function createQuiz(req: Request, res: Response) {
  const userId = req.user!.userId
  const role   = req.user!.role
  const { titulo, descricao = null, categoria = null, thumbnail_filename = null } = req.body ?? {}

  // Só admin, superadmin ou utilizadores com pode_criar_quiz podem criar
  const podeCriar = await verificarPermissaoCriarQuiz(res, userId, role)
  if (!podeCriar) return

  if (!titulo) return res.status(400).json({ message: 'titulo é obrigatório.' })

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO quiz (titulo, descricao, categoria, thumbnail_filename, criado_por)
     VALUES (?, ?, ?, ?, ?)`,
    [titulo, descricao, categoria, thumbnail_filename, userId],
  )
  const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM quiz WHERE id = ? LIMIT 1', [result.insertId])
  return res.status(201).json(rows[0])
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/quizzes/:id  (actualização simples de metadados)
// PONTO 8 — ownership aplicado
// ─────────────────────────────────────────────────────────────────────────────

export async function updateQuiz(req: Request, res: Response) {
  const quizId = Number(req.params.id)
  const userId = req.user!.userId
  const role   = req.user!.role

  // PONTO 8 — ownership
  const quiz = await verificarOwnership(res, quizId, userId, role)
  if (!quiz) return

  const allowed  = ['titulo', 'descricao', 'categoria', 'thumbnail_filename', 'ativo'] as const
  const updates: string[] = []
  const values:  unknown[] = []

  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      updates.push(`${key} = ?`)
      values.push(req.body[key])
    }
  }

  if (req.body?.ativo === true || req.body?.ativo === 1) {
    const [cnt] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS total FROM quiz_pergunta WHERE quiz_id = ?',
      [quizId],
    )
    if ((cnt[0]?.['total'] ?? 0) < 5) {
      return res.status(422).json({ message: 'Um quiz precisa de pelo menos 5 perguntas para ser activado.' })
    }
  }

  if (!updates.length) return res.status(400).json({ message: 'Nenhum campo para actualizar.' })

  values.push(quizId)
  await pool.query(`UPDATE quiz SET ${updates.join(', ')} WHERE id = ?`, values)

  const [updated] = await pool.query<RowDataPacket[]>('SELECT * FROM quiz WHERE id = ? LIMIT 1', [quizId])
  return res.json(updated[0])
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/quizzes/:id
// PONTO 8 — ownership aplicado
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteQuiz(req: Request, res: Response) {
  const quizId = Number(req.params.id)
  const userId = req.user!.userId
  const role   = req.user!.role

  // PONTO 8 — ownership
  const quiz = await verificarOwnership(res, quizId, userId, role)
  if (!quiz) return

  await pool.query('DELETE FROM quiz WHERE id = ?', [quizId])
  return res.status(204).send()
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/quizzes/:id/perguntas  (adicionar pergunta individual)
// ─────────────────────────────────────────────────────────────────────────────

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
  const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM quiz_pergunta WHERE id = ? LIMIT 1', [result.insertId])
  return res.status(201).json(rows[0])
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/quizzes/:id/perguntas/:perguntaId
// ─────────────────────────────────────────────────────────────────────────────

export async function deletePergunta(req: Request, res: Response) {
  const [result] = await pool.query<ResultSetHeader>(
    'DELETE FROM quiz_pergunta WHERE id = ? AND quiz_id = ?',
    [req.params.perguntaId, req.params.id],
  )
  if (result.affectedRows === 0) return res.status(404).json({ message: 'Pergunta não encontrada.' })
  return res.status(204).send()
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/quizzes/:id/attempt
// ─────────────────────────────────────────────────────────────────────────────

export async function submitAttempt(req: Request, res: Response) {
  const userId  = req.user!.userId
  const quizId  = Number(req.params.id)
  const { respostas } = req.body ?? {}

  if (!Array.isArray(respostas) || respostas.length === 0) {
    return res.status(400).json({ message: 'respostas é obrigatório.' })
  }

  const [tentativaHoje] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM resposta_quiz_usuario
     WHERE usuario_id = ? AND quiz_id = ? AND DATE(data_realizacao) = CURDATE() LIMIT 1`,
    [userId, quizId],
  )
  if ((tentativaHoje as RowDataPacket[]).length > 0) {
    return res.status(429).json({ message: 'Já realizaste este quiz hoje. Tenta amanhã.' })
  }

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
  const resultados: { pergunta_id: number; resposta_escolhida: number; resposta_correta: number; correta: boolean }[] = []

  for (const r of respostas) {
    const perguntaId = Number(r.pergunta_id)
    const escolhida  = Number(r.resposta_escolhida)
    const correctaId = mapaCorretas.get(perguntaId) ?? 0
    const correta    = correctaId === escolhida
    if (correta) acertos++
    resultados.push({ pergunta_id: perguntaId, resposta_escolhida: escolhida, resposta_correta: correctaId, correta })
  }

  const total      = perguntas.length
  const percentual = Math.round((acertos / total) * 100)

  const [ins] = await pool.query<ResultSetHeader>(
    `INSERT INTO resposta_quiz_usuario (usuario_id, quiz_id, pontuacao, total_perguntas, percentual_acerto)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, quizId, acertos, total, percentual],
  )

  for (const r of resultados) {
    await pool.query(
      `INSERT INTO resposta_quiz (subscrito_id, quiz_id, pergunta_id, resposta_escolhida, correta)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, quizId, r.pergunta_id, String(r.resposta_escolhida), r.correta ? 1 : 0],
    )
  }

  checkQuizAchievements(userId, percentual).catch(() => null)

  return res.status(201).json({ tentativaId: ins.insertId, total, acertos, percentual, resultados })
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/quizzes/:id/ranking
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/quizzes/:id/stats
// ─────────────────────────────────────────────────────────────────────────────

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
