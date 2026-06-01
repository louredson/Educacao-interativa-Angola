import { useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { AppButton } from '../components/AppButton'
import { AppCard } from '../components/AppCard'
import { AppScreen } from '../components/AppScreen'
import { AppText } from '../components/AppText'
import { AngolaMap } from '../components/home/AngolaMap'
import { colors, radii, spacing } from '../constants/colors'

const inflacaoImage = require('../assets/inflacao_bna.png')
const forestImage = require('../assets/florestas.png')

const quizzes = [
  {
    title: 'Quiz de Economia',
    description: 'Teste os seus conhecimentos sobre a economia angolana.',
    icon: 'trending-up' as const,
    color: '#2563EB',
  },
  {
    title: 'Quiz de História',
    description: 'Explore a história económica e social de Angola.',
    icon: 'school' as const,
    color: '#DC2626',
  },
  {
    title: 'Quiz Provincial',
    description: 'Perguntas sobre províncias, capitais e contexto territorial.',
    icon: 'map' as const,
    color: '#16A34A',
  },
]

const ranking = [
  { name: 'Maria Santos', score: 920, province: 'Luanda' },
  { name: 'João Pedro', score: 840, province: 'Benguela' },
  { name: 'Ana Silva', score: 790, province: 'Huambo' },
  { name: 'Carlos Nunes', score: 760, province: 'Cabinda' },
]

export function ResourcesScreen() {
  const [selectedQuiz, setSelectedQuiz] = useState(0)

  return (
    <AppScreen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <AppCard>
          <AppText variant="label">Recursos</AppText>
          <AppText variant="title">Quiz, mapa e gráficos</AppText>
          <AppText variant="muted">
            Esta secção reúne os recursos visuais e interactivos que ajudam a compreender Angola.
          </AppText>
        </AppCard>

        <AppCard>
          <View style={styles.sectionHeader}>
            <View style={styles.badge}>
              <Ionicons name="game-controller-outline" size={12} color={colors.primary} />
              <AppText style={styles.badgeText}>Quizzes</AppText>
            </View>
            <AppText variant="subtitle">Testar conhecimentos</AppText>
            <AppText variant="muted">
              Os quizzes do mobile seguem a mesma estrutura conceptual da web, mas adaptados para toque.
            </AppText>
          </View>

          <View style={styles.quizList}>
            {quizzes.map((quiz, index) => {
              const active = selectedQuiz === index
              return (
                <Pressable
                  key={quiz.title}
                  onPress={() => setSelectedQuiz(index)}
                  style={[styles.quizCard, active && styles.quizCardActive]}
                >
                  <View style={[styles.quizIcon, { backgroundColor: quiz.color }]}>
                    <Ionicons name={quiz.icon} size={18} color="#FFF" />
                  </View>
                  <View style={styles.quizText}>
                    <AppText variant="subtitle" style={styles.quizTitle}>
                      {quiz.title}
                    </AppText>
                    <AppText variant="muted">{quiz.description}</AppText>
                  </View>
                  <Ionicons name={active ? 'chevron-up' : 'chevron-forward'} size={18} color={colors.textMuted} />
                </Pressable>
              )
            })}
          </View>

          <View style={styles.quizActions}>
            <AppButton label="Iniciar Quiz" />
            <AppButton label="Ver Ranking" variant="secondary" />
            <AppButton label="Voltar ao Menu" variant="ghost" />
          </View>
        </AppCard>

        <AngolaMap />

        <View style={styles.grid}>
          <VisualCard image={inflacaoImage} title="Inflação vs M2" />
          <VisualCard image={forestImage} title="Exploração florestal" />
        </View>

        <AppCard>
          <AppText variant="subtitle">Ranking local</AppText>
          <View style={styles.rankingList}>
            {ranking.map((item, index) => (
              <View key={item.name} style={styles.rankingRow}>
                <View style={styles.rankBadge}>
                  <AppText style={styles.rankText}>{index + 1}</AppText>
                </View>
                <View style={styles.rankingText}>
                  <AppText style={styles.rankingName}>{item.name}</AppText>
                  <AppText variant="muted">{item.province}</AppText>
                </View>
                <AppText style={styles.rankingScore}>{item.score} pts</AppText>
              </View>
            ))}
          </View>
        </AppCard>
      </ScrollView>
    </AppScreen>
  )
}

function VisualCard({ image, title }: { image: any; title: string }) {
  return (
    <AppCard>
      <Image source={image} style={styles.mediaImage} />
      <AppText variant="subtitle">{title}</AppText>
      <AppText variant="muted">
        Recurso visual da plataforma para explicar os dados com a mesma linha gráfica da web.
      </AppText>
    </AppCard>
  )
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  sectionHeader: {
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  quizList: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  quizCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quizCardActive: {
    borderColor: colors.primary,
    backgroundColor: '#FFF1F2',
  },
  quizIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quizText: {
    flex: 1,
    gap: 2,
  },
  quizTitle: {
    marginBottom: 0,
  },
  quizActions: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  grid: {
    gap: spacing.md,
  },
  mediaImage: {
    width: '100%',
    height: 200,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surfaceAlt,
  },
  rankingList: {
    gap: spacing.sm,
  },
  rankingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  rankText: {
    color: '#FFF',
    fontWeight: '800',
  },
  rankingText: {
    flex: 1,
  },
  rankingName: {
    fontWeight: '700',
    color: colors.text,
  },
  rankingScore: {
    fontWeight: '800',
    color: colors.primary,
  },
})
