import React, { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'

import { getRanking, listQuizzes, type QuizRaw, type RankingRaw } from '../services/quizService'
import { useAuth } from '../contexts/AuthContext'
import { colors } from '../theme/colors'
import { EstadoErro } from '../components/EstadoErro'
import UserAvatar from '../components/UserAvatar'
import type { AppStackParamList } from '../navigation'

type Quiz = QuizRaw
type RankingRow = RankingRaw
type FiltroTipo = 'todos' | 'subscrito' | 'professor'

export function QuizzesScreen() {
  const { isAuthenticated } = useAuth()
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [ranking, setRanking] = useState<RankingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<unknown>(null)
  const [filtroRanking, setFiltroRanking] = useState<FiltroTipo>('todos')

  const carregar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    // NOTA: tal como na web, GET /quizzes e GET /ranking exigem sessão válida
    // (middleware `authenticate`, não `authenticateOptional`) — por isso não
    // passamos `anonymous: true`. Um visitante sem sessão recebe 401 de forma
    // esperada (mostramos como lista vazia, não como erro de rede).
    const [qsResult, rkResult] = await Promise.allSettled([listQuizzes(), getRanking()])

    if (qsResult.status === 'fulfilled') {
      setQuizzes(
        qsResult.value.map((q) => ({
          id: Number(q.id),
          titulo: q.titulo,
          descricao: q.descricao,
          categoria: q.categoria,
        })),
      )
    } else {
      setQuizzes([])
      // Só trata como "erro" a reportar se o utilizador está autenticado —
      // para visitantes, 401 é o comportamento esperado, não uma falha.
      if (isAuthenticated) setErro(qsResult.reason)
    }

    if (rkResult.status === 'fulfilled') {
      setRanking(
        rkResult.value.map((r) => ({
          id: Number(r.id),
          nome: r.nome,
          provincia: r.provincia,
          avatar_url: r.avatar_url,
          tipo: r.tipo ?? 'subscrito',
          pontuacao_total: Number(r.pontuacao_total ?? 0),
          quizzes_completados: Number(r.quizzes_completados ?? 0),
        })),
      )
    } else {
      setRanking([])
    }

    setLoading(false)
  }, [isAuthenticated])

  useFocusEffect(
    useCallback(() => {
      void carregar()
    }, [carregar]),
  )

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (erro && quizzes.length === 0) {
    return <EstadoErro erro={erro} onTentarNovamente={carregar} />
  }

  return (
    <ScrollView style={styles.flex} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.seccao}>Quizzes disponíveis</Text>
      {quizzes.length === 0 ? (
        <Text style={styles.vazio}>
          {isAuthenticated ? 'Ainda não há quizzes.' : 'Inicia sessão para veres os quizzes disponíveis.'}
        </Text>
      ) : (
        quizzes.map((q) => (
          <TouchableOpacity
            key={q.id}
            style={styles.card}
            onPress={() =>
              isAuthenticated
                ? navigation.navigate('QuizPlay', { id: q.id, titulo: q.titulo })
                : navigation.navigate('Login')
            }
          >
            <View style={styles.iconeQuiz}>
              <Ionicons name="help-circle" size={22} color={colors.primary} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.cardTitulo}>{q.titulo}</Text>
              {q.descricao ? (
                <Text style={styles.cardDesc} numberOfLines={2}>
                  {q.descricao}
                </Text>
              ) : null}
              {q.categoria ? <Text style={styles.cardCat}>{q.categoria}</Text> : null}
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </TouchableOpacity>
        ))
      )}

      <Text style={[styles.seccao, { marginTop: 24 }]}>Ranking</Text>
      <View style={styles.filtroLinha}>
        {([
          { v: 'todos', label: 'Todos' },
          { v: 'subscrito', label: 'Alunos' },
          { v: 'professor', label: 'Professores' },
        ] as const).map((f) => (
          <TouchableOpacity
            key={f.v}
            style={[styles.filtroBtn, filtroRanking === f.v && styles.filtroBtnAtivo]}
            onPress={() => setFiltroRanking(f.v)}
          >
            <Text style={[styles.filtroTexto, filtroRanking === f.v && styles.filtroTextoAtivo]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {(() => {
        const rankingFiltrado = ranking.filter((r) => filtroRanking === 'todos' || r.tipo === filtroRanking)
        return rankingFiltrado.length === 0 ? (
          <Text style={styles.vazio}>
            {isAuthenticated ? 'Ainda não há classificações.' : 'Inicia sessão para veres o ranking.'}
          </Text>
        ) : (
          rankingFiltrado.map((r, i) => (
            <View key={r.id} style={styles.rankRow}>
              <Text style={[styles.rankPos, i < 3 && { color: colors.primary }]}>{i + 1}</Text>
              <UserAvatar avatarUrl={r.avatar_url} nome={r.nome} size={32} />
              <View style={styles.flex}>
                <Text style={styles.rankNome}>{r.nome}</Text>
                <Text style={styles.rankMeta}>
                  {r.quizzes_completados} quizzes · {r.provincia ?? '—'}
                </Text>
              </View>
              <Text style={styles.rankPontos}>{r.pontuacao_total} pts</Text>
            </View>
          ))
        )
      })()}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  vazio: { color: colors.muted, marginTop: 8 },
  seccao: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 12 },
  filtroLinha: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  filtroBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  filtroBtnAtivo: { backgroundColor: colors.primary, borderColor: colors.primary },
  filtroTexto: { fontSize: 11, fontWeight: '700', color: colors.muted },
  filtroTextoAtivo: { color: '#fff' },
  card: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
  },
  iconeQuiz: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FBEAEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitulo: { fontSize: 15, fontWeight: '700', color: colors.text },
  cardDesc: { fontSize: 13, color: colors.muted, marginTop: 3 },
  cardCat: { fontSize: 11, color: colors.primary, marginTop: 5, fontWeight: '600' },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 8,
  },
  rankPos: { fontSize: 16, fontWeight: '800', color: colors.muted, width: 24, textAlign: 'center' },
  rankNome: { fontSize: 14, fontWeight: '700', color: colors.text },
  rankMeta: { fontSize: 12, color: colors.muted, marginTop: 2 },
  rankPontos: { fontSize: 14, fontWeight: '800', color: colors.accent },
})
