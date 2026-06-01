import { useMemo, useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { AppButton } from '../components/AppButton'
import { AppCard } from '../components/AppCard'
import { AppScreen } from '../components/AppScreen'
import { AppText } from '../components/AppText'
import { AppTextInput } from '../components/AppTextInput'
import { colors, radii, spacing } from '../constants/colors'
import { demoContents } from '../mocks/data'

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
  const [selectedFilter, setSelectedFilter] = useState('Tudo')
  const [selectedBook, setSelectedBook] = useState(0)
  const [commentText, setCommentText] = useState('')

  const currentBook = livrosDoDia[selectedBook]

  const filteredContents = useMemo(() => {
    if (selectedFilter === 'Tudo') return demoContents
    return demoContents.filter((item) => {
      const text = `${item.titulo} ${item.categoria ?? ''} ${item.tema ?? ''}`.toLowerCase()
      return text.includes(selectedFilter.toLowerCase())
    })
  }, [selectedFilter])

  const addComment = () => {
    setCommentText('')
  }

  return (
    <AppScreen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <AppCard>
          <AppText variant="label">Explorar</AppText>
          <AppText variant="title">Biblioteca em destaque</AppText>
          <AppText variant="muted">
            Conteúdos educativos, economia, história, textos, vídeo e leitura, exactamente na linha da web.
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

        <View style={styles.bookCarousel}>
          <Image source={bookImages[selectedBook]} style={styles.bookImage} />
          <View style={styles.bookControls}>
            <Pressable onPress={() => setSelectedBook((prev) => (prev === 0 ? livrosDoDia.length - 1 : prev - 1))} style={styles.iconButton}>
              <Ionicons name="chevron-back" size={20} color={colors.text} />
            </Pressable>
            <Pressable onPress={() => setSelectedBook((prev) => (prev === livrosDoDia.length - 1 ? 0 : prev + 1))} style={styles.iconButton}>
              <Ionicons name="chevron-forward" size={20} color={colors.text} />
            </Pressable>
          </View>
          <View style={styles.bookMeta}>
            <AppText style={styles.bookGenre}>{currentBook.genre}</AppText>
            <AppText variant="subtitle">{currentBook.title}</AppText>
            <AppText variant="muted">
              {currentBook.author} • {currentBook.year}
            </AppText>
            <AppText variant="body">{currentBook.summary}</AppText>
          </View>
          <View style={styles.bookActions}>
            <AppButton label="Ler mais" />
            <AppButton label="Favoritar" variant="secondary" />
          </View>
        </View>

        <AppCard>
          <View style={styles.sectionHeading}>
            <View style={styles.badge}>
              <Ionicons name="library-outline" size={12} color={colors.primary} />
              <AppText style={styles.badgeText}>Conteúdos em destaque</AppText>
            </View>
            <AppText variant="subtitle">Publicações recentes</AppText>
          </View>

          <View style={styles.contentList}>
            {filteredContents.map((item) => (
              <View key={item.id} style={styles.contentItem}>
                <View style={styles.contentBullet} />
                <View style={styles.contentBody}>
                  <AppText style={styles.contentTitle}>{item.titulo}</AppText>
                  <AppText variant="muted">{item.descricao ?? 'Sem descrição disponível'}</AppText>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </View>
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
            <AppTextInput label="Novo comentário" value={commentText} onChangeText={setCommentText} placeholder="Escreva a sua opinião..." />
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
  bookCarousel: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  bookImage: {
    width: '100%',
    height: 220,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
  },
  bookControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  bookMeta: {
    gap: 4,
  },
  bookGenre: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  bookActions: {
    gap: spacing.sm,
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
  contentList: {
    gap: spacing.sm,
  },
  contentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  contentBullet: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
    backgroundColor: colors.primary,
  },
  contentBody: {
    flex: 1,
    gap: 2,
  },
  contentTitle: {
    fontWeight: '700',
    color: colors.text,
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

