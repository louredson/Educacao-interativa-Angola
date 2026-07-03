/**
 * gemini.service.ts
 *
 * Ponto 4 — Geração de quiz via IA.
 *
 * Portagem do GeminiQuizService.php (sistema de quiz) adaptada ao padrão
 * do ia.controller.ts existente no Educacao-interativa-Angola:
 *  - Usa a Groq API (já configurada no projecto) em vez da Gemini
 *  - Resposta JSON estruturada forçada via prompt rígido
 *  - Output normalizado para o formato do schema do Educacao
 *    (pergunta / opcao_a-d / resposta_correta 1-4 / explicacao)
 *
 * Variáveis de ambiente necessárias (já existem no .env):
 *   GROQ_API_KEY   — chave da Groq
 *   GROQ_MODEL     — modelo a usar (ex: llama-3.3-70b-versatile)
 */

const GROQ_URL   = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_KEY   = process.env['GROQ_API_KEY']  ?? ''
const GROQ_MODEL = process.env['GROQ_MODEL']    ?? 'llama-3.3-70b-versatile'

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────

export interface GerarQuizInput {
  tema: string                  // Ex: "Independência de Angola"
  titulo?: string               // Título sugerido (opcional)
  descricao?: string            // Descrição sugerida (opcional)
  categoria?: string            // Ex: "História"
  dificuldade?: 'facil' | 'medio' | 'dificil'
  publico?: string              // Ex: "estudantes do ensino secundário"
  quantidade?: number           // 3–15; padrão 8
}

export interface PerguntaGerada {
  pergunta: string
  opcao_a: string
  opcao_b: string
  opcao_c: string
  opcao_d: string
  resposta_correta: number      // 1 | 2 | 3 | 4
  explicacao: string | null
  ordem: number
}

export interface QuizGerado {
  titulo: string
  descricao: string
  categoria: string
  perguntas: PerguntaGerada[]
}

// Formato interno que a Groq devolve no JSON
interface PerguntaRaw {
  pergunta: string
  opcoes: string[]              // array de 4 strings
  indice_correto: number        // 0-3
  explicacao?: string
}

interface RespostaRaw {
  titulo: string
  descricao: string
  categoria: string
  perguntas: PerguntaRaw[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Geração principal
// ─────────────────────────────────────────────────────────────────────────────

export async function gerarQuizComIA(input: GerarQuizInput): Promise<QuizGerado> {
  if (!GROQ_KEY) {
    throw new Error('GROQ_API_KEY não configurada. Adiciona a chave no ficheiro .env do backend.')
  }

  const quantidade  = Math.max(3, Math.min(15, input.quantidade ?? 8))
  const dificuldade = input.dificuldade ?? 'medio'
  const publico     = input.publico     ?? 'estudantes angolanos do ensino secundário'
  const categoria   = input.categoria   ?? input.tema

  // ── Prompt rígido para garantir JSON limpo ──────────────────────────────
  const sistemPrompt =
    'És um especialista em ECONOMIA E HISTÓRIA ECONÓMICA DE ANGOLA. ' +
    'TODAS as perguntas que geras devem obrigatoriamente abordar dimensões económicas: ' +
    'produção, comércio, finanças, recursos naturais, políticas económicas, desenvolvimento, ' +
    'emprego, moeda, investimento, desigualdade ou impacto económico. ' +
    'Se o tema for uma pessoa famosa, as perguntas devem focar o seu papel e legado ECONÓMICO, ' +
    'não a sua vida pessoal ou feitos militares/políticos isolados. ' +
    'Se o tema for vago, interpreta-o sempre através da lente da economia angolana, ' +
    'podendo incluir também perguntas além do escopo estrito da economia angolana quando relevante. ' +
    'Respondes SEMPRE em JSON puro e válido, sem markdown, sem blocos de código, ' +
    'sem texto fora do JSON. Escreves em Português europeu, tom académico e acessível.'

  const userPrompt =
    `Cria um quiz original com foco ECONÓMICO sobre: "${input.tema}".\n` +
    `Categoria: ${categoria}.\n` +
    `Público-alvo: ${publico}.\n` +
    `Dificuldade: ${dificuldade}.\n` +
    `Quantidade de perguntas: ${quantidade}.\n` +
    (input.titulo    ? `Título sugerido: ${input.titulo}.\n`    : '') +
    (input.descricao ? `Descrição base: ${input.descricao}.\n`  : '') +
    '\nIMPORTANTE: todas as perguntas DEVEM ter relação directa com economia, ' +
    'história económica, políticas económicas ou desenvolvimento económico de Angola.\n' +
    '\nResponde APENAS com este JSON (sem nada fora dele):\n' +
    '{\n' +
    '  "titulo": "string",\n' +
    '  "descricao": "string (1-2 frases)",\n' +
    '  "categoria": "string",\n' +
    '  "perguntas": [\n' +
    '    {\n' +
    '      "pergunta": "string",\n' +
    '      "opcoes": ["opcao A", "opcao B", "opcao C", "opcao D"],\n' +
    '      "indice_correto": 0,\n' +
    '      "explicacao": "string ou null"\n' +
    '    }\n' +
    '  ]\n' +
    '}\n' +
    'Regras: cada pergunta tem exactamente 4 opções curtas; ' +
    'indice_correto é um inteiro de 0 a 3; ' +
    'evita perguntas ambíguas ou repetidas; ' +
    `gera exactamente ${quantidade} perguntas.`

  // ── Chamada à Groq ────────────────────────────────────────────────────────
  const resp = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify({
      model:       GROQ_MODEL,
      max_tokens:  2500,
      temperature: 0.7,
      messages: [
        { role: 'system', content: sistemPrompt },
        { role: 'user',   content: userPrompt   },
      ],
    }),
  })

  if (!resp.ok) {
    const erro = await resp.json().catch(() => ({})) as Record<string, unknown>
    const msg  = (erro['error'] as { message?: string } | undefined)?.message
    throw new Error(msg ?? `Groq API erro ${resp.status}`)
  }

  const data = await resp.json() as { choices: { message: { content: string } }[] }
  const raw  = data.choices?.[0]?.message?.content?.trim() ?? ''

  // Limpar possível markdown residual
  const limpo = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

  let parsed: RespostaRaw
  try {
    parsed = JSON.parse(limpo) as RespostaRaw
  } catch {
    throw new Error('A IA devolveu uma resposta inválida. Tenta novamente.')
  }

  return normalizarQuiz(parsed, input)
}

// ─────────────────────────────────────────────────────────────────────────────
// Normalização — converte formato Groq → formato schema do Educacao
// ─────────────────────────────────────────────────────────────────────────────

function normalizarQuiz(raw: RespostaRaw, input: GerarQuizInput): QuizGerado {
  const titulo    = raw.titulo?.trim()    || input.titulo    || 'Quiz gerado por IA'
  const descricao = raw.descricao?.trim() || input.descricao || 'Quiz criado automaticamente.'
  const categoria = raw.categoria?.trim() || input.categoria || input.tema

  const perguntas: PerguntaGerada[] = []

  for (const p of raw.perguntas ?? []) {
    const texto   = p.pergunta?.trim() ?? ''
    const opcoes  = (p.opcoes ?? []).map(o => String(o).trim()).filter(Boolean)
    const idx     = Number(p.indice_correto ?? -1)

    // Valida: precisa de texto, 4 opções e índice correcto
    if (!texto || opcoes.length < 4 || idx < 0 || idx > 3) continue

    perguntas.push({
      pergunta:         texto,
      opcao_a:          opcoes[0],
      opcao_b:          opcoes[1],
      opcao_c:          opcoes[2],
      opcao_d:          opcoes[3],
      // O PHP usa indice_correto 0-3; o nosso schema usa resposta_correta 1-4
      resposta_correta: idx + 1,
      explicacao:       p.explicacao?.trim() || null,
      ordem:            perguntas.length + 1,
    })
  }

  if (perguntas.length === 0) {
    throw new Error('A IA não gerou perguntas válidas. Tenta novamente com um tema diferente.')
  }

  return { titulo, descricao, categoria, perguntas }
}
