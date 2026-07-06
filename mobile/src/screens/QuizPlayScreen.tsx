import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'

import { getQuiz, submitQuizAttempt, type PerguntaRaw, type ResultadoAttempt } from '../services/quizService'
import { colors } from '../theme/colors'
import { EstadoErro, mensagemAmigavel } from '../components/EstadoErro'
import type { AppStackParamList } from '../navigation'

type Props = NativeStackScreenProps<AppStackParamList, 'QuizPlay'>

type Pergunta = PerguntaRaw
type Resultado = ResultadoAttempt

const LETRAS = ['A', 'B', 'C', 'D'] as const

export function QuizPlayScreen({ route }: Props) {
  const { id } = route.params
  const [perguntas, setPerguntas] = useState<Pergunta[]>([])
  const [respostas, setRespostas] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(true)
  const [erroCarregar, setErroCarregar] = useState<unknown>(null)
  const [aEnviar, setAEnviar] = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    setErroCarregar(null)
    try {
      const data = await getQuiz(id)
      setPerguntas(data.perguntas ?? [])
    } catch (e) {
      setPerguntas([])
      setErroCarregar(e)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void carregar()
  }, [carregar])

  function escolher(pergunta: Pergunta, valor: number) {
    // Uma vez respondida, a pergunta fica trancada — não se pode mudar de
    // opinião depois de ver a cor certa/errada (evita "tentativa e erro").
    if (respostas[pergunta.id] !== undefined) return
    setRespostas((prev) => ({ ...prev, [pergunta.id]: valor }))
  }

  async function submeter() {
    setErro(null)
    if (Object.keys(respostas).length < perguntas.length) {
      setErro('Responde a todas as perguntas antes de submeter.')
      return
    }
    setAEnviar(true)
    try {
      const payload = perguntas.map((p) => ({
        pergunta_id: p.id,
        resposta_escolhida: respostas[p.id],
      }))
      const r = await submitQuizAttempt(id, payload)
      setResultado(r)
    } catch (e) {
      setErro(mensagemAmigavel(e))
    } finally {
      setAEnviar(false)
    }
  }

  function tentarNovamente() {
    setResultado(null)
    setRespostas({})
    setErro(null)
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (erroCarregar && perguntas.length === 0) {
    return (
      <EstadoErro
        erro={erroCarregar}
        onTentarNovamente={() => {
          setLoading(true)
          void carregar()
        }}
      />
    )
  }

  // ── Ecrã de resultado — com revisão pergunta a pergunta ────────────────────
  if (resultado) {
    const erros = resultado.total - resultado.acertos
    return (
      <ScrollView style={styles.flex} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View style={styles.resHeader}>
          <Ionicons
            name={resultado.percentual >= 50 ? 'trophy' : 'ribbon-outline'}
            size={56}
            color={colors.accent}
          />
          <Text style={styles.resTitulo}>Quiz concluído!</Text>
        </View>

        <View style={styles.resGrid}>
          <View style={styles.resCard}>
            <Text style={[styles.resCardValor, { color: colors.success }]}>{resultado.acertos}</Text>
            <Text style={styles.resCardLabel}>Acertaste</Text>
          </View>
          <View style={styles.resCard}>
            <Text style={[styles.resCardValor, { color: colors.danger }]}>{erros}</Text>
            <Text style={styles.resCardLabel}>Erraste</Text>
          </View>
          <View style={styles.resCard}>
            <Text style={[styles.resCardValor, { color: colors.primary }]}>{resultado.percentual}%</Text>
            <Text style={styles.resCardLabel}>Aproveitamento</Text>
          </View>
        </View>

        <Text style={styles.revisaoTitulo}>Revisão das respostas</Text>
        {perguntas.map((p, idx) => {
          const r = resultado.resultados.find((x) => x.pergunta_id === p.id)
          if (!r) return null
          const opcoes: Record<number, string> = { 1: p.opcao_a, 2: p.opcao_b, 3: p.opcao_c, 4: p.opcao_d }
          return (
            <View key={p.id} style={[styles.revisaoCard, { borderLeftColor: r.correta ? colors.success : colors.danger }]}>
              <View style={styles.revisaoTopo}>
                <View style={[styles.revisaoSelo, { backgroundColor: r.correta ? colors.success : colors.danger }]}>
                  <Ionicons name={r.correta ? 'checkmark' : 'close'} size={14} color="#fff" />
                </View>
                <Text style={styles.revisaoPergunta}>{idx + 1}. {p.pergunta}</Text>
              </View>
              <Text style={[styles.revisaoResposta, { color: r.correta ? colors.success : colors.danger }]}>
                A tua resposta: <Text style={styles.revisaoRespostaForte}>{opcoes[r.resposta_escolhida] ?? '—'}</Text>
              </Text>
              {!r.correta && (
                <Text style={[styles.revisaoResposta, { color: colors.success }]}>
                  Resposta certa: <Text style={styles.revisaoRespostaForte}>{opcoes[r.resposta_correta] ?? '—'}</Text>
                </Text>
              )}
              {p.explicacao ? <Text style={styles.revisaoExplicacao}>{p.explicacao}</Text> : null}
            </View>
          )
        })}

        <TouchableOpacity style={styles.submeter} onPress={tentarNovamente}>
          <Text style={styles.submeterTexto}>Tentar novamente</Text>
        </TouchableOpacity>
      </ScrollView>
    )
  }

  return (
    <ScrollView style={styles.flex} contentContainerStyle={{ padding: 16 }}>
      {perguntas.length === 0 ? (
        <Text style={styles.vazio}>Este quiz ainda não tem perguntas.</Text>
      ) : (
        perguntas.map((p, idx) => {
          const respondida = respostas[p.id] !== undefined
          return (
            <View key={p.id} style={styles.bloco}>
              <Text style={styles.pergunta}>
                {idx + 1}. {p.pergunta}
              </Text>
              {([1, 2, 3, 4] as const).map((valor, i) => {
                const texto = [p.opcao_a, p.opcao_b, p.opcao_c, p.opcao_d][i]
                const escolhida = respostas[p.id] === valor
                // Feedback imediato: assim que a pergunta é respondida, mostra
                // logo a cor certa (verde) e a errada (vermelha), tal como pedido.
                const ehCorreta = respondida && p.resposta_correta === valor
                const ehEscolhidaErrada = respondida && escolhida && p.resposta_correta !== valor

                return (
                  <TouchableOpacity
                    key={valor}
                    style={[
                      styles.opcao,
                      ehCorreta && styles.opcaoCorreta,
                      ehEscolhidaErrada && styles.opcaoErrada,
                      !respondida && escolhida && styles.opcaoEscolhida,
                    ]}
                    onPress={() => escolher(p, valor)}
                    disabled={respondida}
                  >
                    <Ionicons
                      name={
                        ehCorreta ? 'checkmark-circle' : ehEscolhidaErrada ? 'close-circle' : escolhida ? 'radio-button-on' : 'radio-button-off'
                      }
                      size={18}
                      color={ehCorreta ? colors.success : ehEscolhidaErrada ? colors.danger : escolhida ? colors.primary : colors.muted}
                    />
                    <Text
                      style={[
                        styles.opcaoTexto,
                        (escolhida || ehCorreta) && styles.opcaoTextoEscolhida,
                        ehCorreta && { color: colors.success },
                        ehEscolhidaErrada && { color: colors.danger },
                      ]}
                    >
                      {LETRAS[i]}. {texto}
                    </Text>
                  </TouchableOpacity>
                )
              })}
              {respondida && p.explicacao ? <Text style={styles.explicacaoInline}>{p.explicacao}</Text> : null}
            </View>
          )
        })
      )}

      {erro ? <Text style={styles.erro}>{erro}</Text> : null}

      {perguntas.length > 0 ? (
        <TouchableOpacity style={styles.submeter} onPress={submeter} disabled={aEnviar}>
          {aEnviar ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submeterTexto}>Submeter respostas</Text>
          )}
        </TouchableOpacity>
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  vazio: { color: colors.muted, textAlign: 'center', marginTop: 30 },
  bloco: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  pergunta: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 12 },
  opcao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 8,
  },
  opcaoEscolhida: { borderColor: colors.primary, backgroundColor: '#FBEAEA' },
  opcaoCorreta: { borderColor: colors.success, backgroundColor: '#E8F7F1' },
  opcaoErrada: { borderColor: colors.danger, backgroundColor: '#FDECEC' },
  opcaoTexto: { flex: 1, fontSize: 14, color: colors.text },
  opcaoTextoEscolhida: { fontWeight: '700', color: colors.primary },
  explicacaoInline: { fontSize: 12, color: colors.muted, fontStyle: 'italic', marginTop: 2 },
  erro: { color: colors.danger, textAlign: 'center', marginBottom: 8 },
  submeter: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 30,
  },
  submeterTexto: { color: '#fff', fontWeight: '700', fontSize: 16 },

  resHeader: { alignItems: 'center', marginBottom: 20 },
  resTitulo: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 10 },
  resGrid: { flexDirection: 'row', gap: 10, marginBottom: 26 },
  resCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  resCardValor: { fontSize: 26, fontWeight: '800' },
  resCardLabel: { fontSize: 11, color: colors.muted, marginTop: 4 },

  revisaoTitulo: { fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: 12 },
  revisaoCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  revisaoTopo: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  revisaoSelo: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  revisaoPergunta: { flex: 1, fontSize: 13.5, fontWeight: '700', color: colors.text },
  revisaoResposta: { fontSize: 13, marginTop: 2 },
  revisaoRespostaForte: { fontWeight: '700' },
  revisaoExplicacao: { fontSize: 12, color: colors.muted, fontStyle: 'italic', marginTop: 6 },
})
