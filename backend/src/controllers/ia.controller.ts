/**
 * ia.controller.ts
 * Integração com a API do Groq (gratuita)
 *
 * Endpoints:
 *  POST /api/ia/assist   — melhora / expande / resume um bloco de texto
 *  POST /api/ia/gerar    — gera um rascunho de artigo completo a partir de um prompt
 *
 * A chave fica guardada no servidor (.env), nunca exposta ao browser.
 */
import type { Request, Response } from 'express'

const GROQ_URL   = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_KEY   = process.env['GROQ_API_KEY']  ?? ''
const GROQ_MODEL = process.env['GROQ_MODEL']    ?? 'llama-3.3-70b-versatile'

// ── Utilitário de chamada à API Groq ─────────────────────────────────────────
async function chamarGroq(
  mensagens: { role: 'system' | 'user' | 'assistant'; content: string }[],
  maxTokens = 1024,
): Promise<string> {
  if (!GROQ_KEY || GROQ_KEY === 'gsk_SUBSTITUI_PELA_TUA_CHAVE') {
    throw new Error('GROQ_API_KEY não configurada. Adiciona a chave no ficheiro .env do backend.')
  }

  const resp = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      max_tokens: maxTokens,
      temperature: 0.7,
      messages: mensagens,
    }),
  })

  if (!resp.ok) {
    const erro = await resp.json().catch(() => ({}))
    const msg  = (erro as Record<string, unknown>)?.['error']
    throw new Error(
      typeof msg === 'object' && msg !== null && 'message' in msg
        ? String((msg as { message: string }).message)
        : `Groq API erro ${resp.status}`,
    )
  }

  const data = await resp.json() as {
    choices: { message: { content: string } }[]
  }

  return data.choices?.[0]?.message?.content?.trim() ?? ''
}

// ── POST /api/ia/assist ───────────────────────────────────────────────────────
/**
 * Melhora, expande, resume ou transforma um bloco de texto existente.
 * Body: { tipo, conteudo, instrucao }
 */
export async function iaAssist(req: Request, res: Response) {
  const { tipo, conteudo, instrucao } = req.body ?? {}

  if (!instrucao?.trim()) {
    return res.status(400).json({ message: 'A instrução é obrigatória.' })
  }

  try {
    const texto = await chamarGroq([
      {
        role: 'system',
        content:
          'És um assistente de escrita especializado em textos educativos sobre economia e história de Angola. ' +
          'Respondes APENAS com o texto pedido, sem prefixos, explicações, aspas nem formatação markdown. ' +
          'Mantém sempre um tom académico, claro e acessível. Escreve em Português europeu.',
      },
      {
        role: 'user',
        content:
          `Tipo de bloco: ${tipo ?? 'parágrafo'}\n` +
          `Conteúdo actual:\n"""\n${conteudo ?? ''}\n"""\n\n` +
          `Instrução: ${instrucao}`,
      },
    ], 800)

    return res.json({ texto })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao contactar a IA.'
    return res.status(500).json({ message: msg })
  }
}

// ── POST /api/ia/gerar ────────────────────────────────────────────────────────
/**
 * Gera um rascunho de artigo completo com título, subtítulo, resumo e blocos.
 * Body: { prompt }
 */
export async function iaGerarArtigo(req: Request, res: Response) {
  const { prompt } = req.body ?? {}

  if (!prompt?.trim()) {
    return res.status(400).json({ message: 'O prompt é obrigatório.' })
  }

  try {
    const raw = await chamarGroq([
      {
        role: 'system',
        content:
          'És um assistente de escrita especializado em artigos educativos sobre economia e história de Angola. ' +
          'Responde SEMPRE em JSON puro e válido, sem markdown, sem blocos de código, sem texto fora do JSON. ' +
          'Escreve em Português europeu com tom académico e acessível.',
      },
      {
        role: 'user',
        content:
          `Cria um rascunho de artigo educativo com base nesta instrução: "${prompt}".\n\n` +
          'Responde APENAS com este JSON (sem nada fora dele):\n' +
          '{\n' +
          '  "titulo": "string",\n' +
          '  "subtitulo": "string",\n' +
          '  "resumo": "string (2-3 frases)",\n' +
          '  "categoria": "Economia|História|Política|Cultura|Sociedade|Tecnologia|Educação|Análise|Opinião",\n' +
          '  "tags": ["tag1", "tag2", "tag3"],\n' +
          '  "blocos": [\n' +
          '    { "tipo": "titulo_secao"|"subtitulo_secao"|"paragrafo"|"citacao"|"destaque"|"lista", "conteudo": "string" }\n' +
          '  ]\n' +
          '}\n\n' +
          'Gera entre 6 e 10 blocos variados. ' +
          'Para listas usa o formato "- Item\\n- Item\\n- Item". ' +
          'Para citações usa uma frase relevante de uma figura histórica ou económica. ' +
          'Para destaques usa um facto ou dado importante.',
      },
    ], 1500)

    // Limpar possível markdown residual
    const limpo = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

    let artigo: unknown
    try {
      artigo = JSON.parse(limpo)
    } catch {
      return res.status(500).json({
        message: 'A IA devolveu uma resposta inválida. Tenta novamente.',
      })
    }

    return res.json(artigo)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao contactar a IA.'
    return res.status(500).json({ message: msg })
  }
}

