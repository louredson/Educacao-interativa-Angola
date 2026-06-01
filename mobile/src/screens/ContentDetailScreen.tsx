import { useEffect, useState } from 'react'
import { Linking, ScrollView, StyleSheet, View } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { AppButton } from '../components/AppButton'
import { AppCard } from '../components/AppCard'
import { AppScreen } from '../components/AppScreen'
import { AppText } from '../components/AppText'
import { ErrorBanner } from '../components/ErrorBanner'
import { colors, spacing } from '../constants/colors'
import { getContentById } from '../services/contents'
import type { ContentItem } from '../types/api'
import type { ContentStackParamList, HomeStackParamList } from '../types/navigation'
import { formatDate } from '../utils/format'
import { getFriendlyError } from '../utils/errors'

type Props =
  | NativeStackScreenProps<ContentStackParamList, 'ContentDetail'>
  | NativeStackScreenProps<HomeStackParamList, 'ContentDetail'>

export function ContentDetailScreen({ route }: Props) {
  const [content, setContent] = useState<ContentItem | null>(route.params.content ?? null)
  const [loading, setLoading] = useState(!route.params.content)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      if (content) return
      try {
        const response = await getContentById(route.params.contentId)
        if (mounted) setContent(response)
      } catch (err) {
        if (mounted) setError(getFriendlyError(err))
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void load()

    return () => {
      mounted = false
    }
  }, [content, route.params.contentId])

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {error ? <ErrorBanner message={error} /> : null}
        {loading ? (
          <AppText variant="muted">A carregar detalhe...</AppText>
        ) : content ? (
          <>
            <AppCard>
              <AppText variant="label">{content.tipo.replace('_', ' ')}</AppText>
              <AppText variant="title">{content.titulo}</AppText>
              <AppText variant="muted">{content.descricao ?? 'Sem descrição'}</AppText>
              <View style={styles.meta}>
                <AppText variant="muted">Categoria: {content.categoria ?? '-'}</AppText>
                <AppText variant="muted">Tema: {content.tema ?? '-'}</AppText>
                <AppText variant="muted">Duração: {content.duracao ?? '-'}</AppText>
                <AppText variant="muted">Publicado em: {formatDate(content.publicado_em)}</AppText>
              </View>
            </AppCard>
            <AppCard>
              <AppText variant="subtitle">Conteúdo completo</AppText>
              <AppText variant="body">{content.conteudo_completo ?? 'Este item não tem conteúdo completo associado.'}</AppText>
            </AppCard>
                        <AppButton
              label="Abrir recurso"
              variant="secondary"
              onPress={() => {
                if (content.url_recurso) {
                  void Linking.openURL(content.url_recurso)
                }
              }}
              disabled={!content.url_recurso}
            />
          </>
        ) : null}
      </ScrollView>
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  meta: {
    gap: 6,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
})




