import { useMemo } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { AppButton } from '../components/AppButton'
import { AppCard } from '../components/AppCard'
import { AuthPromptCard } from '../components/AuthPromptCard'
import { AppScreen } from '../components/AppScreen'
import { AppText } from '../components/AppText'
import { colors, radii, spacing } from '../constants/colors'
import { useAuth } from '../context/AuthContext'
import type { ProfileStackParamList } from '../types/navigation'
import { formatRole } from '../utils/format'
import { navigateToTopLevel } from '../utils/navigation'

type Props = NativeStackScreenProps<ProfileStackParamList, 'Profile'>

const localArticles = [
  {
    id: 1,
    title: 'O Impacto da Diversificação Económica em Angola',
    date: '15 Mar 2026',
    views: 245,
    category: 'Economia',
  },
  {
    id: 2,
    title: 'Análise do Sector Agrícola Angolano',
    date: '10 Mar 2026',
    views: 189,
    category: 'Agricultura',
  },
  {
    id: 3,
    title: 'Perspectivas para o Investimento Estrangeiro',
    date: '5 Mar 2026',
    views: 312,
    category: 'Investimento',
  },
]

const localTopics = [
  {
    id: 1,
    title: 'Estratégias para o Desenvolvimento Sustentável',
    replies: 12,
    date: '20 Mar 2026',
    category: 'Sustentabilidade',
  },
  {
    id: 2,
    title: 'O Papel da Tecnologia na Economia Angolana',
    replies: 8,
    date: '18 Mar 2026',
    category: 'Tecnologia',
  },
  {
    id: 3,
    title: 'Desafios da Educação em Angola',
    replies: 15,
    date: '15 Mar 2026',
    category: 'Educação',
  },
]

export function ProfileScreen({ navigation }: Props) {
  const { user, signOut, refreshProfile, isAuthenticated } = useAuth()

  const classification = useMemo(() => {
    if (!isAuthenticated) return { label: 'Visitante', accent: colors.textMuted }
    const role = formatRole(user?.role)
    return { label: role, accent: colors.primary }
  }, [isAuthenticated, user?.role])

  const stats = useMemo(
    () => [
      { label: 'Tipo', value: classification.label },
      { label: 'Província', value: user?.province ?? 'Luanda' },
      { label: 'Instituição', value: user?.institution ?? '-' },
      { label: 'Curso', value: user?.course ?? '-' },
    ],
    [classification.label, user?.course, user?.institution, user?.province],
  )

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {isAuthenticated ? (
          <>
            <AppCard>
              <View style={styles.headerRow}>
                <View style={styles.avatar}>
                  <AppText style={styles.avatarText}>{getInitials(user?.name ?? 'Utilizador')}</AppText>
                </View>
                <View style={styles.headerCopy}>
                  <View style={styles.badge}>
                    <AppText style={styles.badgeText}>Perfil</AppText>
                  </View>
                  <AppText variant="title">{user?.name ?? 'Utilizador'}</AppText>
                  <AppText variant="muted">{user?.email ?? '-'}</AppText>
                  <View style={[styles.rolePill, { borderColor: classification.accent }]}>
                    <AppText style={[styles.roleText, { color: classification.accent }]}>{classification.label}</AppText>
                  </View>
                </View>
              </View>

              <View style={styles.statsGrid}>
                {stats.map((item) => (
                  <Stat key={item.label} label={item.label} value={item.value} />
                ))}
              </View>
            </AppCard>

            <AppCard>
              <AppText variant="subtitle">Conta</AppText>
              <AppButton label="Atualizar perfil" variant="secondary" onPress={refreshProfile} />
              <AppButton label="Definições" variant="secondary" onPress={() => navigation.navigate('Settings')} />
              <AppButton label="Terminar sessão" variant="danger" onPress={signOut} />
            </AppCard>

            <AppCard>
              <AppText variant="subtitle">Os meus artigos</AppText>
              <View style={styles.list}>
                {localArticles.map((article) => (
                  <View key={article.id} style={styles.listItem}>
                    <View style={styles.listItemTop}>
                      <AppText style={styles.listItemTitle}>{article.title}</AppText>
                      <AppText style={styles.listItemMeta}>{article.views} views</AppText>
                    </View>
                    <AppText variant="muted">
                      {article.category} • {article.date}
                    </AppText>
                  </View>
                ))}
              </View>
            </AppCard>

            <AppCard>
              <AppText variant="subtitle">Os meus tópicos</AppText>
              <View style={styles.list}>
                {localTopics.map((topic) => (
                  <View key={topic.id} style={styles.listItem}>
                    <View style={styles.listItemTop}>
                      <AppText style={styles.listItemTitle}>{topic.title}</AppText>
                      <AppText style={styles.listItemMeta}>{topic.replies} respostas</AppText>
                    </View>
                    <AppText variant="muted">
                      {topic.category} • {topic.date}
                    </AppText>
                  </View>
                ))}
              </View>
            </AppCard>
          </>
        ) : (
          <>
            <AppCard>
              <View style={styles.badge}>
                <AppText style={styles.badgeText}>Perfil público</AppText>
              </View>
              <AppText variant="title">Explora a plataforma sem conta</AppText>
              <AppText variant="muted">
                Podes navegar por conteúdos, mapa, fórum e recursos sem iniciar sessão. O login só é necessário para
                secções restritas.
              </AppText>
            </AppCard>

            <AuthPromptCard
              title="A tua conta ainda não está ativa"
              description="Entra para guardar progresso, desbloquear conteúdos reservados e sincronizar a tua experiência."
              onLogin={() => navigateToTopLevel(navigation, 'Auth')}
              onRegister={() => navigateToTopLevel(navigation, 'Auth')}
            />
          </>
        )}
      </ScrollView>
    </AppScreen>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBox}>
      <AppText style={styles.statLabel}>{label}</AppText>
      <AppText style={styles.statValue}>{value}</AppText>
    </View>
  )
}

function getInitials(name: string) {
  const parts = name.split(' ').filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
  },
  headerCopy: {
    flex: 1,
    gap: 6,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFF1F2',
  },
  badgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  rolePill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '800',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  statBox: {
    flexBasis: '48%',
    flexGrow: 1,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: '800',
  },
  statValue: {
    fontWeight: '700',
    color: colors.text,
  },
  list: {
    gap: spacing.sm,
  },
  listItem: {
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  listItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  listItemTitle: {
    flex: 1,
    color: colors.text,
    fontWeight: '700',
  },
  listItemMeta: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
})
