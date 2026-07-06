/**
 * AdminController
 * Rotas exclusivas de administradores: estatísticas, gestão de utilizadores,
 * moderação de conteúdos e exportação.
 */
import type { Request, Response } from 'express'
import type { RowDataPacket, ResultSetHeader } from 'mysql2'
import { pool } from '../config/database.js'
import { toPublicUser, type UserRecord } from '../types/index.js'
import { criarNotificacao } from '../services/notificacao.service.js'

// ── GET /api/admin/stats ──────────────────────────────────────────────────────
export async function getDashboardStats(_req: Request, res: Response) {
  const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT
      (SELECT COUNT(*) FROM utilizador WHERE ativo = 1)                    AS total_utilizadores,
      (SELECT COUNT(*) FROM utilizador WHERE tipo = 'admin')               AS total_admins,
      (SELECT COUNT(*) FROM utilizador WHERE tipo = 'subscrito')           AS total_subscritores,
      (SELECT COUNT(*) FROM conteudo)                                      AS total_conteudos,
      (SELECT COUNT(*) FROM quiz WHERE ativo = 1)                          AS total_quizzes,
      (SELECT COUNT(*) FROM quiz_pergunta)                                 AS total_perguntas_quiz,
      (SELECT COUNT(*) FROM topico_forum)                                  AS total_topicos,
      (SELECT COUNT(*) FROM resposta_forum)                                AS total_respostas_forum,
      (SELECT COUNT(*) FROM resposta_quiz_usuario)                         AS total_tentativas_quiz,
      (SELECT COUNT(*) FROM utilizador WHERE DATE(criado_em) = CURDATE())  AS novos_hoje
  `)
  res.json(rows[0])
}

// ── GET /api/admin/relatorio?inicio=YYYY-MM-DD&fim=YYYY-MM-DD ────────────────
// Dados agregados para o relatório em PDF do painel de administração.
// Devolve um resumo do período pedido + totais gerais + rankings (top
// conteúdos, utilizadores mais activos, tópicos mais populares) dentro
// desse período. A geração do PDF em si acontece no frontend.
const DATA_REGEX = /^\d{4}-\d{2}-\d{2}$/

export async function getRelatorio(req: Request, res: Response) {
  const inicioStr = String(req.query['inicio'] ?? '')
  const fimStr     = String(req.query['fim'] ?? '')

  if (!DATA_REGEX.test(inicioStr) || !DATA_REGEX.test(fimStr)) {
    return res.status(400).json({ message: 'Parâmetros "inicio" e "fim" são obrigatórios, no formato YYYY-MM-DD.' })
  }
  if (fimStr < inicioStr) {
    return res.status(400).json({ message: 'A data final não pode ser anterior à data inicial.' })
  }

  const inicio = `${inicioStr} 00:00:00`
  const fim    = `${fimStr} 23:59:59`
  const p2     = [inicio, fim]

  const [[resumoRows], [totaisRows], [porTipoRows], [topConteudosRows], [utilizadoresRows], [topicosRows]] =
    await Promise.all([
      pool.query<RowDataPacket[]>(
        `SELECT
           (SELECT COUNT(*) FROM utilizador          WHERE criado_em       BETWEEN ? AND ?) AS novos_utilizadores,
           (SELECT COUNT(*) FROM conteudo             WHERE publicado_em    BETWEEN ? AND ?) AS novos_conteudos,
           (SELECT COUNT(*) FROM topico_forum         WHERE criado_em       BETWEEN ? AND ?) AS novos_topicos,
           (SELECT COUNT(*) FROM resposta_forum       WHERE publicado_em    BETWEEN ? AND ?) AS novas_respostas_forum,
           (SELECT COUNT(*) FROM resposta_quiz_usuario WHERE data_realizacao BETWEEN ? AND ?) AS tentativas_quiz,
           (SELECT COUNT(*) FROM quiz                 WHERE criado_em       BETWEEN ? AND ?) AS quizzes_criados,
           (SELECT COUNT(DISTINCT subscrito_id) FROM progresso_utilizador
             WHERE ultima_visualizacao BETWEEN ? AND ?)                                       AS utilizadores_ativos`,
        [...p2, ...p2, ...p2, ...p2, ...p2, ...p2, ...p2],
      ),
      pool.query<RowDataPacket[]>(
        `SELECT
           (SELECT COUNT(*) FROM utilizador WHERE ativo = 1)                          AS total_utilizadores,
           (SELECT COUNT(*) FROM utilizador WHERE tipo IN ('admin','superadmin'))     AS total_admins,
           (SELECT COUNT(*) FROM conteudo)                                            AS total_conteudos,
           (SELECT COUNT(*) FROM quiz WHERE ativo = 1)                                AS total_quizzes,
           (SELECT COUNT(*) FROM topico_forum)                                        AS total_topicos`,
      ),
      pool.query<RowDataPacket[]>(
        `SELECT tipo, COUNT(*) AS quantidade FROM conteudo
          WHERE publicado_em BETWEEN ? AND ? GROUP BY tipo ORDER BY quantidade DESC`,
        p2,
      ),
      pool.query<RowDataPacket[]>(
        `SELECT c.titulo, c.tipo, c.categoria, c.visualizacoes,
                (SELECT COUNT(*) FROM conteudo_reacao cr WHERE cr.conteudo_id = c.id AND cr.tipo = 'like') AS likes,
                (SELECT COUNT(*) FROM comentario_conteudo cc WHERE cc.conteudo_id = c.id)                  AS comentarios
           FROM conteudo c
          WHERE c.publicado_em BETWEEN ? AND ?
          ORDER BY c.visualizacoes DESC, likes DESC
          LIMIT 10`,
        p2,
      ),
      pool.query<RowDataPacket[]>(
        `SELECT u.nome, u.email, u.provincia,
                COUNT(DISTINCT rqu.id) AS quizzes_feitos,
                COUNT(DISTINCT rf.id)  AS respostas_forum,
                COUNT(DISTINCT pu.id)  AS conteudos_lidos
           FROM utilizador u
           LEFT JOIN resposta_quiz_usuario rqu ON rqu.usuario_id   = u.id AND rqu.data_realizacao   BETWEEN ? AND ?
           LEFT JOIN resposta_forum        rf  ON rf.autor_id      = u.id AND rf.publicado_em        BETWEEN ? AND ?
           LEFT JOIN progresso_utilizador  pu  ON pu.subscrito_id  = u.id AND pu.ultima_visualizacao BETWEEN ? AND ?
          WHERE u.ativo = 1
          GROUP BY u.id
         HAVING (quizzes_feitos + respostas_forum + conteudos_lidos) > 0
          ORDER BY (quizzes_feitos + respostas_forum + conteudos_lidos) DESC
          LIMIT 10`,
        [...p2, ...p2, ...p2],
      ),
      pool.query<RowDataPacket[]>(
        `SELECT t.titulo, t.categoria, t.votos, t.respostas, t.visualizacoes, u.nome AS autor_nome
           FROM topico_forum t
           JOIN utilizador u ON u.id = t.criado_por
          WHERE t.criado_em BETWEEN ? AND ?
          ORDER BY t.votos DESC, t.visualizacoes DESC
          LIMIT 10`,
        p2,
      ),
    ])

  res.json({
    periodo: { inicio: inicioStr, fim: fimStr },
    geradoEm: new Date().toISOString(),
    resumoPeriodo: resumoRows[0],
    totaisGerais: totaisRows[0],
    conteudosPorTipo: porTipoRows,
    topConteudos: topConteudosRows,
    utilizadoresMaisAtivos: utilizadoresRows,
    topicosPopulares: topicosRows,
  })
}

// ── GET /api/admin/utilizadores ───────────────────────────────────────────────
export async function listAllUsers(req: Request, res: Response) {
  const search = req.query['q']     ? `%${req.query['q']}%`   : null
  const tipo   = req.query['tipo']  as string | undefined
  const limit  = Math.min(Number(req.query['limit']  ?? 50),  200)
  const offset = Number(req.query['offset'] ?? 0)

  const where: string[] = ['1=1']
  const params: unknown[] = []

  if (search) {
    where.push('(u.nome LIKE ? OR u.email LIKE ?)')
    params.push(search, search)
  }
  if (tipo) {
    where.push('u.tipo = ?')
    params.push(tipo)
  }

  params.push(limit, offset)

  const [rows] = await pool.query<UserRecord[]>(
    `SELECT * FROM utilizador u WHERE ${where.join(' AND ')} ORDER BY criado_em DESC LIMIT ? OFFSET ?`,
    params,
  )

  const [count] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM utilizador u WHERE ${where.join(' AND ')}`,
    params.slice(0, -2),
  )

  res.json({ utilizadores: rows.map(toPublicUser), total: (count as RowDataPacket[])[0]?.['total'] ?? 0 })
}

// ── PATCH /api/admin/utilizadores/:id/tipo ────────────────────────────────────
export async function changeUserRole(req: Request, res: Response) {
  const { tipo } = req.body ?? {}
  if (!['visitante', 'subscrito', 'professor', 'admin', 'superadmin'].includes(tipo)) {
    return res.status(400).json({ message: 'tipo inválido. Use: visitante, subscrito, professor, admin ou superadmin.' })
  }

  const [result] = await pool.query<ResultSetHeader>(
    'UPDATE utilizador SET tipo = ? WHERE id = ?',
    [tipo, req.params.id],
  )
  if (result.affectedRows === 0) return res.status(404).json({ message: 'Utilizador não encontrado.' })

  res.json({ message: `Papel alterado para ${tipo}.` })
}


// ── PATCH /api/admin/utilizadores/:id/quiz-permissao ─────────────────────────
/**
 * Atribui ou revoga a permissão de criação de quizzes do Explorar a um utilizador.
 * Só o admin (ou superadmin) pode fazer isto.
 * Body: { pode_criar_quiz: boolean }
 */
export async function toggleQuizPermissao(req: Request, res: Response) {
  const { pode_criar_quiz } = req.body ?? {}

  if (typeof pode_criar_quiz !== 'boolean') {
    return res.status(400).json({ message: 'pode_criar_quiz deve ser true ou false.' })
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id, nome, tipo FROM utilizador WHERE id = ? LIMIT 1',
    [req.params.id],
  )
  const utilizador = (rows as RowDataPacket[])[0]
  if (!utilizador) return res.status(404).json({ message: 'Utilizador não encontrado.' })

  // Admins já têm permissão implícita — não faz sentido atribuir/revogar
  if (utilizador['tipo'] === 'admin' || utilizador['tipo'] === 'superadmin') {
    return res.status(422).json({
      message: 'Administradores já têm permissão de criação de quizzes por defeito.',
    })
  }

  await pool.query(
    'UPDATE utilizador SET pode_criar_quiz = ? WHERE id = ?',
    [pode_criar_quiz ? 1 : 0, req.params.id],
  )

  res.json({
    message: pode_criar_quiz
      ? `Permissão de criação de quizzes atribuída a ${utilizador['nome']}.`
      : `Permissão de criação de quizzes revogada a ${utilizador['nome']}.`,
    pode_criar_quiz,
  })
}

// ── PATCH /api/admin/utilizadores/:id/toggle ─────────────────────────────────
export async function toggleUserActive(req: Request, res: Response) {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT ativo FROM utilizador WHERE id = ? LIMIT 1',
    [req.params.id],
  )
  const user = rows[0]
  if (!user) return res.status(404).json({ message: 'Utilizador não encontrado.' })

  const novoEstado = user['ativo'] ? 0 : 1
  await pool.query('UPDATE utilizador SET ativo = ? WHERE id = ?', [novoEstado, req.params.id])

  res.json({ ativo: Boolean(novoEstado), message: novoEstado ? 'Conta activada.' : 'Conta suspensa.' })
}

// ── GET /api/admin/conteudos ──────────────────────────────────────────────────
export async function listAllConteudos(req: Request, res: Response) {
  const search = req.query['q']      ? `%${req.query['q']}%` : null
  const tipo   = req.query['tipo']   as string | undefined
  const limit  = Math.min(Number(req.query['limit']  ?? 50), 200)
  const offset = Number(req.query['offset'] ?? 0)

  const where: string[] = ['1=1']
  const params: unknown[] = []

  if (search) { where.push('(c.titulo LIKE ?)'); params.push(search) }
  if (tipo)   { where.push('c.tipo = ?');         params.push(tipo)   }

  params.push(limit, offset)

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT c.*, u.nome AS autor_nome
     FROM conteudo c LEFT JOIN utilizador u ON u.id = c.publicado_por
     WHERE ${where.join(' AND ')} ORDER BY c.publicado_em DESC LIMIT ? OFFSET ?`,
    params,
  )

  const [count] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM conteudo c WHERE ${where.join(' AND ')}`,
    params.slice(0, -2),
  )

  res.json({ conteudos: rows, total: (count as RowDataPacket[])[0]?.['total'] ?? 0 })
}

// ── GET /api/admin/denuncias-conteudo ─────────────────────────────────────────
// Denúncias de conteúdos inteiros (vídeo/texto/podcast/jindungo) — distintas
// das denúncias do fórum (tabela `denuncia`) e das denúncias de comentários
// (coluna `comentario_conteudo.denunciado`, já geridas via notificações).
export async function listDenunciasConteudo(_req: Request, res: Response) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT dc.id, dc.conteudo_id, dc.motivo, dc.descricao_detalhada, dc.status, dc.criada_em,
            u.nome AS denunciado_por_nome, u.email AS denunciado_por_email,
            c.titulo AS conteudo_titulo, c.tipo AS conteudo_tipo
     FROM denuncia_conteudo dc
     JOIN utilizador u ON u.id = dc.denunciado_por
     JOIN conteudo   c ON c.id = dc.conteudo_id
     WHERE dc.status = 'pendente'
     ORDER BY dc.id DESC`,
  )
  res.json(rows)
}

// ── PATCH /api/admin/denuncias-conteudo/:id ───────────────────────────────────
// Corpo: { status: 'ignorada' | 'removida', observacoes? }
// 'removida' elimina o conteúdo denunciado (e, em cascata, as suas denúncias,
// comentários, reacções, etc. — tal como já acontece ao eliminar conteúdo
// a partir do painel "Conteúdos").
export async function resolveDenunciaConteudo(req: Request, res: Response) {
  const adminId = req.user!.userId
  const { status, observacoes = null } = req.body ?? {}

  if (!['ignorada', 'removida'].includes(status)) {
    return res.status(400).json({ message: 'status deve ser: ignorada ou removida.' })
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT conteudo_id FROM denuncia_conteudo WHERE id = ? LIMIT 1',
    [req.params.id],
  )
  const denuncia = rows[0]
  if (!denuncia) return res.status(404).json({ message: 'Denúncia não encontrada.' })

  if (status === 'removida') {
    // Elimina o conteúdo — a denúncia desaparece em cascata (FK ON DELETE CASCADE).
    await pool.query('DELETE FROM conteudo WHERE id = ?', [denuncia['conteudo_id']])
  } else {
    await pool.query(
      `UPDATE denuncia_conteudo SET status = ?, admin_acao = ?, observacoes_moderacao = ?, resolvido_em = NOW()
       WHERE id = ?`,
      [status, adminId, observacoes, req.params.id],
    )
  }

  res.json({ message: status === 'removida' ? 'Conteúdo removido.' : 'Denúncia ignorada.' })
}

// ── GET /api/admin/denuncias ──────────────────────────────────────────────────
export async function listDenuncias(_req: Request, res: Response) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT d.*, u.nome AS denunciado_por_nome,
            rf.conteudo AS resposta_conteudo,
            tf.titulo AS topico_titulo
     FROM denuncia d
     JOIN utilizador u ON u.id = d.denunciado_por
     LEFT JOIN resposta_forum rf ON rf.id = d.resposta_forum_id
     LEFT JOIN topico_forum tf ON tf.id = d.topico_forum_id
     WHERE d.status = 'pendente'
     ORDER BY d.id DESC`,
  )
  res.json(rows)
}

// ── PATCH /api/admin/denuncias/:id ────────────────────────────────────────────
// Corpo: { status: 'ignorada' | 'removida' | 'banido' | 'oculto', observacoes? }
//  - ignorada: só marca a denúncia como resolvida
//  - removida: resposta → marcada como denunciada (deixa de ser listada);
//              tópico   → eliminado permanentemente
//  - oculto:   só para tópicos → esconde o tópico do fórum sem o eliminar
//  - banido:   desativa a conta do autor do tópico/resposta denunciado
export async function resolveDenuncia(req: Request, res: Response) {
  const adminId = req.user!.userId
  const { status, observacoes = null } = req.body ?? {}

  if (!['ignorada', 'removida', 'banido', 'oculto'].includes(status)) {
    return res.status(400).json({ message: 'status deve ser: ignorada, removida, banido ou oculto.' })
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT resposta_forum_id, topico_forum_id FROM denuncia WHERE id = ? LIMIT 1',
    [req.params.id],
  )
  const denuncia = rows[0]
  if (!denuncia) return res.status(404).json({ message: 'Denúncia não encontrada.' })

  const rfId = denuncia['resposta_forum_id']
  const tfId = denuncia['topico_forum_id']

  if (status === 'oculto' && !tfId) {
    return res.status(400).json({ message: 'O status "oculto" só se aplica a denúncias de tópicos.' })
  }

  if (status === 'banido') {
    // Encontra o autor do item denunciado e desativa a conta
    let autorId: number | null = null
    if (rfId) {
      const [r] = await pool.query<RowDataPacket[]>('SELECT autor_id FROM resposta_forum WHERE id = ? LIMIT 1', [rfId])
      autorId = (r as RowDataPacket[])[0]?.['autor_id'] ?? null
    } else if (tfId) {
      const [t] = await pool.query<RowDataPacket[]>('SELECT criado_por FROM topico_forum WHERE id = ? LIMIT 1', [tfId])
      autorId = (t as RowDataPacket[])[0]?.['criado_por'] ?? null
    }

    if (!autorId) {
      return res.status(404).json({ message: 'Autor do item denunciado não encontrado.' })
    }

    // Nunca banir contas administrativas
    const [u] = await pool.query<RowDataPacket[]>('SELECT tipo FROM utilizador WHERE id = ? LIMIT 1', [autorId])
    const tipoAutor = (u as RowDataPacket[])[0]?.['tipo']
    if (tipoAutor === 'admin' || tipoAutor === 'superadmin') {
      return res.status(400).json({ message: 'Não é possível banir contas de administração.' })
    }

    await pool.query('UPDATE utilizador SET ativo = 0 WHERE id = ?', [autorId])
  }

  await pool.query(
    `UPDATE denuncia SET status = ?, admin_acao = ?, observacoes_moderacao = ?, resolvido_em = NOW()
     WHERE id = ?`,
    [status, adminId, observacoes, req.params.id],
  )

  if (status === 'removida') {
    if (rfId) {
      // Resposta: marcada como denunciada (deixa de aparecer nas listagens)
      await pool.query('UPDATE resposta_forum SET denunciado = 1 WHERE id = ?', [rfId])
    } else if (tfId) {
      // Tópico: eliminado permanentemente
      await pool.query('DELETE FROM topico_forum WHERE id = ?', [tfId])
    }
  }

  if (status === 'oculto' && tfId) {
    await pool.query('UPDATE topico_forum SET oculto = 1 WHERE id = ?', [tfId])
  }

  const mensagens: Record<string, string> = {
    ignorada: 'Denúncia ignorada.',
    removida: rfId ? 'Resposta removida.' : 'Tópico eliminado.',
    oculto:   'Tópico ocultado do fórum.',
    banido:   'Conta do autor desativada.',
  }
  res.json({ message: mensagens[status] ?? 'Denúncia resolvida.' })
}

// ── GET /api/admin/export/utilizadores-csv ────────────────────────────────────
export async function exportUsersCsv(_req: Request, res: Response) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, nome, email, tipo, provincia, instituicao, curso, ativo, criado_em, ultimo_acesso
     FROM utilizador ORDER BY criado_em DESC`,
  )

  const header = 'id,nome,email,tipo,provincia,instituicao,curso,ativo,criado_em,ultimo_acesso\n'
  const csv = rows.map((r) =>
    [r['id'], `"${r['nome']}"`, `"${r['email']}"`, r['tipo'], r['provincia'] ?? '',
     `"${r['instituicao'] ?? ''}"`, `"${r['curso'] ?? ''}"`, r['ativo'],
     r['criado_em'], r['ultimo_acesso'] ?? ''].join(','),
  ).join('\n')

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="utilizadores.csv"')
  res.send('\uFEFF' + header + csv) // BOM para compatibilidade com Excel
}

// ── GET /api/admin/export/actividade-csv ──────────────────────────────────────
export async function exportActivityCsv(_req: Request, res: Response) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT u.nome, u.email,
            COUNT(DISTINCT rqu.id)  AS quizzes_feitos,
            COUNT(DISTINCT pu.id)   AS conteudos_lidos,
            COUNT(DISTINCT rf.id)   AS respostas_forum,
            MAX(u.ultimo_acesso)    AS ultimo_acesso
     FROM utilizador u
     LEFT JOIN resposta_quiz_usuario rqu ON rqu.usuario_id  = u.id
     LEFT JOIN progresso_utilizador  pu  ON pu.subscrito_id  = u.id
     LEFT JOIN resposta_forum        rf  ON rf.autor_id       = u.id
     WHERE u.ativo = 1
     GROUP BY u.id
     ORDER BY quizzes_feitos DESC, conteudos_lidos DESC`,
  )

  const header = 'nome,email,quizzes_feitos,conteudos_lidos,respostas_forum,ultimo_acesso\n'
  const csv = rows.map((r) =>
    [`"${r['nome']}"`, `"${r['email']}"`, r['quizzes_feitos'], r['conteudos_lidos'],
     r['respostas_forum'], r['ultimo_acesso'] ?? ''].join(','),
  ).join('\n')

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="actividade.csv"')
  res.send('\uFEFF' + header + csv)
}

// ── GET /api/admin/solicitacoes ───────────────────────────────────────────────
// Lista todas as solicitações pendentes (Jindungo + Tópicos Privados)
export async function listSolicitacoes(_req: Request, res: Response) {
  const [jindungo] = await pool.query<RowDataPacket[]>(
    `SELECT
       s.id, 'jindungo' AS tipo,
       s.status, s.motivo, s.solicitado_em, s.respondido_em, s.observacoes_resposta,
       u.id   AS usuario_id,   u.nome  AS usuario_nome,  u.email AS usuario_email,
       c.id   AS conteudo_id,  c.titulo AS conteudo_titulo
     FROM solicitacao_acesso_jindungo s
     JOIN utilizador u ON u.id = s.subscrito_id
     JOIN conteudo   c ON c.id = s.conteudo_id
     ORDER BY s.solicitado_em DESC`,
  )

  const [topicos] = await pool.query<RowDataPacket[]>(
    `SELECT
       t.id, 'topico' AS tipo,
       t.status, t.motivo, t.solicitado_em, t.respondido_em, NULL AS observacoes_resposta,
       u.id   AS usuario_id,  u.nome  AS usuario_nome, u.email AS usuario_email,
       tf.id  AS conteudo_id, tf.titulo AS conteudo_titulo
     FROM topico_privado_acesso t
     JOIN utilizador   u  ON u.id  = t.subscrito_id
     JOIN topico_forum tf ON tf.id = t.topico_id
     ORDER BY t.solicitado_em DESC`,
  )

  res.json({
    jindungo: jindungo as RowDataPacket[],
    topicos:  topicos  as RowDataPacket[],
    total_pendentes:
      (jindungo as RowDataPacket[]).filter(r => r['status'] === 'pendente').length +
      (topicos  as RowDataPacket[]).filter(r => r['status'] === 'pendente').length,
  })
}

// ── PATCH /api/admin/solicitacoes/jindungo/:id ────────────────────────────────
export async function responderSolicitacaoJindungo(req: Request, res: Response) {
  const adminId = req.user!.userId
  const { status, observacoes = null } = req.body ?? {}

  if (!['aprovado', 'rejeitado'].includes(status)) {
    return res.status(400).json({ message: 'status deve ser: aprovado ou rejeitado.' })
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM solicitacao_acesso_jindungo WHERE id = ? LIMIT 1',
    [req.params['id']],
  )
  const sol = (rows as RowDataPacket[])[0]
  if (!sol) return res.status(404).json({ message: 'Solicitação não encontrada.' })

  await pool.query(
    `UPDATE solicitacao_acesso_jindungo
     SET status = ?, admin_responsavel = ?, observacoes_resposta = ?, respondido_em = NOW()
     WHERE id = ?`,
    [status, adminId, observacoes, req.params['id']],
  )

  // Notifica o utilizador
  if (status === 'aprovado') {
    const [conteudo] = await pool.query<RowDataPacket[]>(
      'SELECT titulo FROM conteudo WHERE id = ? LIMIT 1', [sol['conteudo_id']],
    )
    const titulo = (conteudo as RowDataPacket[])[0]?.['titulo'] ?? 'conteúdo'
    await criarNotificacao({
      usuarioId: sol['subscrito_id'],
      tipo: 'acesso_jindungo_aprovado',
      entidadeId: sol['conteudo_id'],
      titulo: 'Acesso aprovado',
      mensagem: `O teu pedido de acesso a "${titulo}" foi aprovado.`,
      link: '/explorar',
    })
  }

  res.json({ message: `Solicitação Jindungo ${status}.` })
}

// ── PATCH /api/admin/solicitacoes/topico/:id ──────────────────────────────────
export async function responderSolicitacaoTopico(req: Request, res: Response) {
  const adminId = req.user!.userId
  const { status } = req.body ?? {}

  if (!['aprovado', 'rejeitado'].includes(status)) {
    return res.status(400).json({ message: 'status deve ser: aprovado ou rejeitado.' })
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM topico_privado_acesso WHERE id = ? LIMIT 1',
    [req.params['id']],
  )
  const sol = (rows as RowDataPacket[])[0]
  if (!sol) return res.status(404).json({ message: 'Solicitação não encontrada.' })

  await pool.query(
    `UPDATE topico_privado_acesso
     SET status = ?, admin_responsavel = ?, respondido_em = NOW()
     WHERE id = ?`,
    [status, adminId, req.params['id']],
  )

  // Notifica o utilizador
  if (status === 'aprovado') {
    const [topico] = await pool.query<RowDataPacket[]>(
      'SELECT titulo FROM topico_forum WHERE id = ? LIMIT 1', [sol['topico_id']],
    )
    const titulo = (topico as RowDataPacket[])[0]?.['titulo'] ?? 'tópico'
    await criarNotificacao({
      usuarioId: sol['subscrito_id'],
      tipo: 'acesso_topico_aprovado',
      entidadeId: sol['topico_id'],
      titulo: 'Acesso ao tópico aprovado',
      mensagem: `O teu pedido de acesso ao tópico "${titulo}" foi aprovado.`,
      link: `/forum/${sol['topico_id']}`,
    })
  }

  res.json({ message: `Solicitação de tópico ${status}.` })
}

// ── GET /api/admin/comentarios-denunciados ────────────────────────────────────
// Lista todos os comentários denunciados (com pré-visualização do conteúdo),
// para o admin decidir se apaga ou ignora a denúncia.
export async function listarComentariosDenunciados(_req: Request, res: Response) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT cc.id, cc.comentario, cc.publicado_em, cc.conteudo_id,
            u.id AS autor_id, u.nome AS autor_nome, u.email AS autor_email,
            c.titulo AS conteudo_titulo
       FROM comentario_conteudo cc
       JOIN utilizador u ON u.id = cc.autor_id
       JOIN conteudo   c ON c.id = cc.conteudo_id
      WHERE cc.denunciado = TRUE
      ORDER BY cc.publicado_em DESC`,
  )
  res.json({ comentarios: rows })
}

// ── PATCH /api/admin/comentarios-denunciados/:id ──────────────────────────────
// Corpo: { acao: 'apagar' | 'ignorar' }
export async function resolverComentarioDenunciado(req: Request, res: Response) {
  const comentarioId = parseInt(String(req.params['id']))
  const { acao } = req.body ?? {}

  if (isNaN(comentarioId) || !['apagar', 'ignorar'].includes(acao)) {
    return res.status(400).json({ message: 'Pedido inválido — indica acao: "apagar" ou "ignorar".' })
  }

  if (acao === 'apagar') {
    await pool.query('DELETE FROM comentario_conteudo WHERE id = ?', [comentarioId])
  } else {
    await pool.query('UPDATE comentario_conteudo SET denunciado = FALSE WHERE id = ?', [comentarioId])
  }

  res.json({ message: acao === 'apagar' ? 'Comentário apagado.' : 'Denúncia ignorada.' })
}
