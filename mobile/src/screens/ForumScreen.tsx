import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { AppButton } from '../components/AppButton'
import { AppCard } from '../components/AppCard'
import { AppScreen } from '../components/AppScreen'
import { AppText } from '../components/AppText'
import { AppTextInput } from '../components/AppTextInput'
import { colors, radii, spacing } from '../constants/colors'

type Discussion = {
  id: string
  title: string
  author: string
  category: string
  isPrivate: boolean
  excerpt: string
  replies: number
  likes: number
}

const filters = ['Todos', 'Públicos', 'Privados', 'Os meus']
const categories = ['Todas', 'Economia', 'História', 'Sociedade', 'Tecnologia', 'Turismo']
const popularTopics = [
  { name: 'Diversificação Económica', count: 45 },
  { name: 'História Colonial', count: 38 },
  { name: 'Petróleo', count: 32 },
  { name: 'Agricultura', count: 28 },
]

const discussions: Discussion[] = [
  {
    id: '1',
    title: 'Exportação de petróleo: dependência económica',
    author: 'Joel Carlos M.',
    category: 'Economia',
    isPrivate: false,
    excerpt:
      'Angola continua altamente dependente das exportações de petróleo, que representam grande parte das receitas do país.',
    replies: 24,
    likes: 124,
  },
  {
    id: '2',
    title: 'O Caminho de Ferro de Benguela e a circulação regional',
    author: 'Jor Manuel K.',
    category: 'Sociedade',
    isPrivate: true,
    excerpt:
      'O CFB foi uma infraestrutura crucial para o comércio regional e continua a ser estratégico para o corredor do Lobito.',
    replies: 2,
    likes: 12,
  },
  {
    id: '3',
    title: 'Agricultura: o futuro da economia angolana?',
    author: 'Pedro Mendes',
    category: 'Economia',
    isPrivate: false,
    excerpt:
      'Angola tem terras aráveis, clima favorável e recursos hídricos, mas ainda importa grande parte dos alimentos.',
    replies: 31,
    likes: 58,
  },
]

export function ForumScreen() {
  const [selectedFilter, setSelectedFilter] = useState('Todos')
  const [selectedCategory, setSelectedCategory] = useState('Todas')
  const [searchQuery, setSearchQuery] = useState('')
  const [newPostTitle, setNewPostTitle] = useState('')
  const [newPostContent, setNewPostContent] = useState('')

  const visibleDiscussions = useMemo(() => {
    return discussions.filter((discussion) => {
      const matchesSearch =
        discussion.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        discussion.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'Todas' || discussion.category === selectedCategory
      const matchesFilter =
        selectedFilter === 'Todos' ||
        (selectedFilter === 'Públicos' && !discussion.isPrivate) ||
        (selectedFilter === 'Privados' && discussion.isPrivate) ||
        selectedFilter === 'Os meus'

      return matchesSearch && matchesCategory && matchesFilter
    })
  }, [searchQuery, selectedCategory, selectedFilter])

  return (
    <AppScreen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <AppCard>
          <AppText variant="label">Fórum</AppText>
          <AppText variant="title">Debate público</AppText>
          <AppText variant="muted">
            O espaço de conversa da web, adaptado para mobile com filtros, tópicos populares e publicações.
          </AppText>
        </AppCard>

        <View style={styles.filterRow}>
          {filters.map((filter) => {
            const active = selectedFilter === filter
            return (
              <Pressable
                key={filter}
                onPress={() => setSelectedFilter(filter)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <AppText style={[styles.filterText, active && styles.filterTextActive]}>{filter}</AppText>
              </Pressable>
            )
          })}
        </View>

        <View style={styles.filterRow}>
          {categories.map((category) => {
            const active = selectedCategory === category
            return (
              <Pressable
                key={category}
                onPress={() => setSelectedCategory(category)}
                style={[styles.categoryChip, active && styles.categoryChipActive]}
              >
                <AppText style={[styles.categoryText, active && styles.categoryTextActive]}>{category}</AppText>
              </Pressable>
            )
          })}
        </View>

        <AppCard>
          <View style={styles.sectionHeading}>
            <View style={styles.badge}>
              <Ionicons name="trending-up-outline" size={12} color={colors.primary} />
              <AppText style={styles.badgeText}>Tópicos populares</AppText>
            </View>
            <AppText variant="subtitle">O que a comunidade está a discutir</AppText>
          </View>
          <View style={styles.popularList}>
            {popularTopics.map((topic) => (
              <View key={topic.name} style={styles.popularRow}>
                <AppText style={styles.popularName}>{topic.name}</AppText>
                <AppText style={styles.popularCount}>{topic.count}</AppText>
              </View>
            ))}
          </View>
        </AppCard>

        <AppCard>
          <View style={styles.sectionHeading}>
            <View style={styles.badge}>
              <Ionicons name="create-outline" size={12} color={colors.primary} />
              <AppText style={styles.badgeText}>Nova publicação</AppText>
            </View>
            <AppText variant="subtitle">Criar tópico</AppText>
          </View>
          <AppTextInput label="Título" value={newPostTitle} onChangeText={setNewPostTitle} placeholder="Ex: Diversificação económica" />
          <AppTextInput
            label="Conteúdo"
            value={newPostContent}
            onChangeText={setNewPostContent}
            placeholder="Escreva o seu texto..."
            multiline
            style={styles.multiline}
          />
          <AppButton label="Publicar" />
        </AppCard>

        <View style={styles.discussionsList}>
          {visibleDiscussions.map((discussion) => (
            <AppCard key={discussion.id}>
              <View style={styles.discussionHeader}>
                <View style={styles.statusPill}>
                  <Ionicons name={discussion.isPrivate ? 'lock-closed-outline' : 'globe-outline'} size={12} color={discussion.isPrivate ? '#B45309' : '#2563EB'} />
                  <AppText style={[styles.statusText, discussion.isPrivate && styles.privateStatus]}>
                    {discussion.isPrivate ? 'Privado' : 'Público'}
                  </AppText>
                </View>
                <AppText style={styles.discussionCategory}>{discussion.category}</AppText>
              </View>
              <AppText variant="subtitle">{discussion.title}</AppText>
              <AppText variant="muted">Por {discussion.author}</AppText>
              <AppText variant="body">{discussion.excerpt}</AppText>
              <View style={styles.metaRow}>
                <Meta icon="chatbubble-outline" value={`${discussion.replies}`} />
                <Meta icon="thumbs-up-outline" value={`${discussion.likes}`} />
              </View>
              <View style={styles.actionsRow}>
                <AppButton label="Ler discussão" variant="secondary" />
                <AppButton label="Gostar" variant="ghost" />
              </View>
            </AppCard>
          ))}
        </View>
      </ScrollView>
    </AppScreen>
  )
}

function Meta({ icon, value }: { icon: keyof typeof Ionicons.glyphMap; value: string }) {
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={14} color={colors.textMuted} />
      <AppText style={styles.metaText}>{value}</AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  filterTextActive: {
    color: '#FFF',
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  categoryChipActive: {
    backgroundColor: '#FFF1F2',
    borderColor: colors.primary,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  categoryTextActive: {
    color: colors.primary,
  },
  sectionHeading: {
    gap: 6,
    marginBottom: spacing.sm,
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
  popularList: {
    gap: spacing.sm,
  },
  popularRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  popularName: {
    color: colors.text,
    fontWeight: '700',
  },
  popularCount: {
    color: colors.primary,
    fontWeight: '800',
  },
  multiline: {
    minHeight: 110,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  discussionsList: {
    gap: spacing.md,
  },
  discussionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusText: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  privateStatus: {
    color: '#B45309',
  },
  discussionCategory: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '700',
  },
  actionsRow: {
    gap: spacing.sm,
  },
})

