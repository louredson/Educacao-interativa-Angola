import { useMemo, useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { AppButton } from '../components/AppButton'
import { AppCard } from '../components/AppCard'
import { AppScreen } from '../components/AppScreen'
import { AppText } from '../components/AppText'
import { AppTextInput } from '../components/AppTextInput'
import { ContentCard } from '../components/ContentCard'
import { colors, radii, spacing } from '../constants/colors'
import { demoContents } from '../mocks/data'
import { navigateToTopLevel } from '../utils/navigation'

const bookImages = [
  require('../assets/comercio_periodo_colonial.jpg'),
  require('../assets/mulheres.png'),
  require('../assets/industria_petroleo.png'),
]

const livrosDoDia = [
  {
    title: 'Mayombe',
    author: 'Pepetela',
    year: '1980',
    genre: 'Romance histórico',
    summary:
      'Montanha mágica, floresta tropical e luta pela liberdade. Um clássico essencial da literatura angolana.',
  },
  {
    title: 'A Geração da Utopia',
    author: 'Pepetela',
    year: '1992',
    genre: 'Romance político',
    summary:
      'Da Casa dos Estudantes do Império ao desencanto pós-independência, um retrato profundo de uma geração.',
  },
  {
    title: 'O Vendedor de Passados',
    author: 'José Eduardo Agualusa',
    year: '2004',
    genre: 'Romance contemporâneo',
    summary:
      'Memória, identidade e narrativas falsas num romance brilhante sobre Angola e a sua história recente.',
  },
]

const filters = ['Tudo', 'História', 'Economia', 'Cultura', 'Provincial']

const comments = [
  { author: 'Maria Santos', text: 'Que trecho maravilhoso. Pepetela continua gigante.' },
  { author: 'Carlos Nunes', text: 'Este livro devia ser lido em todas as escolas.' },
]

export function ExploreScreen() {
  const navigation = useNavigation<any>()
  const [selectedFilter, setSelectedFilter] = useState('Tudo')
  const [selectedBook, setSelectedBook] = useState(0)
  const [commentText, setCommentText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const currentBook = livrosDoDia[selectedBook]

  const filteredContents = useMemo(() => {
    return demoContents.filter((item) => {
      const searchable = `${item.titulo} ${item.descricao ?? ''} ${item.categoria ?? ''} ${item.tema ?? ''}`.toLowerCase()
      const matchesFilter =
        selectedFilter === 'Tudo' || searchable.includes(selectedFilter.toLowerCase())
      const matchesSearch = searchable.includes(searchQuery.toLowerCase())
      return matchesFilter && matchesSearch
    })
  }, [selectedFilter, searchQuery])

  const addComment = () => {
    setCommentText('')
  }

  return (
    <AppScreen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <AppCard>
          <View style={styles.heroTop}>
            <View style={styles.badge}>
              <Ionicons name="search-outline" size={12} color={colors.primary} />
              <AppText style={styles.badgeText}>Explorar</AppText>
            </View>
            <AppText variant="title">Biblioteca em destaque</AppText>
            <AppText variant="muted">
              Conteúdos educativos, economia, história, textos, vídeo e leitura, exactamente na linha da web.
            </AppText>
          </View>

          <AppTextInput
            label="Pesquisar conteúdos"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Pesquisar por título, tema ou categoria"
          />
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

        <AppCard>
          <View style={styles.sectionHeading}>
            <View style={styles.badge}>
              <Ionicons name="book-outline" size={12} color={colors.primary} />
              <AppText style={styles.badgeText}>Livro do dia</AppText>
            </View>
            <AppText variant="subtitle">{currentBook.title}</AppText>
            <AppText variant="muted">
              {currentBook.author} • {currentBook.year} • {currentBook.genre}
            </AppText>
          </View>

          <Image source={bookImages[selectedBook]} style={styles.bookImage} />

          <View style={styles.bookControls}>
            <Pressable
              onPress={() => setSelectedBook((prev) => (prev === 0 ? livrosDoDia.length - 1 : prev - 1))}
              style={styles.iconButton}
            >
              <Ionicons name="chevron-back" size={20} color={colors.text} />
            </Pressable>
            <Pressable
              onPress={() => setSelectedBook((prev) => (prev === livrosDoDia.length - 1 ? 0 : prev + 1))}
              style={styles.iconButton}
            >
              <Ionicons name="chevron-forward" size={20} color={colors.text} />
            </Pressable>
          </View>

          <AppText variant="body">{currentBook.summary}</AppText>

          <View style={styles.bookActions}>
            <AppButton label="Ler mais" onPress={() => navigateToTopLevel(navigation, 'ContentsTab')} />
            <AppButton label="Favoritar" variant="secondary" />
          </View>
        </AppCard>

        <AppCard>
          <View style={styles.sectionHeading}>
            <View style={styles.badge}>
              <Ionicons name="library-outline" size={12} color={colors.primary} />
              <AppText style={styles.badgeText}>Conteúdos em destaque</AppText>
            </View>
            <AppText variant="subtitle">Publicações recentes</AppText>
            <AppText variant="muted">
              Os mesmos conteúdos da web, agora num formato vertical mais confortável para o telemóvel.
            </AppText>
          </View>

          <View style={styles.contentList}>
            {filteredContents.map((item) => (
              <ContentCard
                key={item.id}
                content={item}
                onPress={() => navigateToTopLevel(navigation, 'ContentsTab')}
              />
            ))}
          </View>
        </AppCard>

        <AppCard>
          <View style={styles.sectionHeading}>
            <View style={styles.badge}>
              <Ionicons name="chatbubbles-outline" size={12} color={colors.primary} />
              <AppText style={styles.badgeText}>Comentários do livro do dia</AppText>
            </View>
            <AppText variant="subtitle">Participação da comunidade</AppText>
          </View>

          <View style={styles.commentList}>
            {comments.map((comment) => (
              <View key={comment.author} style={styles.commentItem}>
                <View style={styles.commentAvatar}>
                  <AppText style={styles.commentAvatarText}>{comment.author.slice(0, 2).toUpperCase()}</AppText>
                </View>
                <View style={styles.commentBody}>
                  <AppText style={styles.commentAuthor}>{comment.author}</AppText>
                  <AppText variant="muted">{comment.text}</AppText>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.commentComposer}>
            <AppTextInput
              label="Novo comentário"
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Escreva a sua opinião..."
            />
            <AppButton label="Comentar" onPress={addComment} />
          </View>
        </AppCard>
      </ScrollView>
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  heroTop: {
    gap: 8,
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
  bookImage: {
    width: '100%',
    height: 220,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    marginBottom: spacing.sm,
  },
  bookControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bookActions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  contentList: {
    gap: spacing.sm,
  },
  commentList: {
    gap: spacing.sm,
  },
  commentItem: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  commentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  commentAvatarText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 12,
  },
  commentBody: {
    flex: 1,
    gap: 2,
  },
  commentAuthor: {
    fontWeight: '700',
    color: colors.text,
  },
  commentComposer: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
})
