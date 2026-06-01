import { StyleSheet, View } from 'react-native'
import type { NotificationItem } from '../types/api'
import { colors, radii, spacing } from '../constants/colors'
import { AppText } from './AppText'
import { formatDate } from '../utils/format'

export function NotificationCard({ item }: { item: NotificationItem }) {
  return (
    <View style={[styles.card, !item.lida && styles.unread]}>
      <View style={styles.header}>
        <AppText variant="subtitle">{item.titulo ?? 'Notificação'}</AppText>
        {!item.lida ? <View style={styles.dot} /> : null}
      </View>
      <AppText variant="body">{item.mensagem}</AppText>
      <AppText variant="muted">{formatDate(item.criada_em)}</AppText>
    </View>
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
  unread: {
    borderColor: '#F4A261',
    backgroundColor: '#FFF9F1',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primarySoft,
  },
})

