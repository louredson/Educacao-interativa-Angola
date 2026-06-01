import { useEffect, useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { AppScreen } from '../components/AppScreen'
import { AppText } from '../components/AppText'
import { ContentCard } from '../components/ContentCard'
import { EmptyState } from '../components/EmptyState'
import { ErrorBanner } from '../components/ErrorBanner'
import { SectionHeader } from '../components/SectionHeader'
import { spacing } from '../constants/colors'
import { listContents } from '../services/contents'
import type { ContentItem } from '../types/api'
import type { ContentStackParamList } from '../types/navigation'
import { getFriendlyError } from '../utils/errors'

type Props = NativeStackScreenProps<ContentStackParamList, 'ContentList'>

export function ContentListScreen({ navigation }: Props) {
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    try {
      setError(null)
      const response = await listContents()
      setItems(response)
    } catch (err) {
      setError(getFriendlyError(err))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <AppScreen>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load() }} />}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader title="Lista de conteúdos" subtitle="Tudo o que está publicado no backend principal" />
        {error ? <ErrorBanner message={error} /> : null}
        {loading ? (
          <AppText variant="muted">A carregar conteúdos...</AppText>
        ) : items.length === 0 ? (
          <EmptyState title="Sem conteúdos" description="Ainda não há publicações para mostrar." />
        ) : (
          items.map((item) => (
            <ContentCard
              key={item.id}
              content={item}
              onPress={() => navigation.navigate('ContentDetail', { contentId: item.id, content: item })}
            />
          ))
        )}
      </ScrollView>
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
})


