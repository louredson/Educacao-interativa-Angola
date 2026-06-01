import { Pressable, StyleSheet, View } from 'react-native'
import type { ContentItem } from '../types/api'
import { colors, radii, spacing } from '../constants/colors'
import { AppText } from './AppText'
import { formatDate } from '../utils/format'

interface ContentCardProps {
  content: ContentItem
  onPress?: () => void
}

export function ContentCard({ content, onPress }: ContentCardProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.row}>
        <AppText variant="label">{content.tipo.replace('_', ' ')}</AppText>
        {content.categoria ? <AppText variant="muted">{content.categoria}</AppText> : null}
      </View>
      <AppText variant="subtitle">{content.titulo}</AppText>
      {content.descricao ? <AppText variant="muted">{content.descricao}</AppText> : null}
      <AppText variant="muted">{formatDate(content.publicado_em)}</AppText>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
})

