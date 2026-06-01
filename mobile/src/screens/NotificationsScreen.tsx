import { useEffect, useMemo, useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { AppButton } from '../components/AppButton'
import { AppCard } from '../components/AppCard'
import { AppScreen } from '../components/AppScreen'
import { AppText } from '../components/AppText'
import { EmptyState } from '../components/EmptyState'
import { ErrorBanner } from '../components/ErrorBanner'
import { NotificationCard } from '../components/NotificationCard'
import { colors, radii, spacing } from '../constants/colors'
import { listNotifications } from '../services/notifications'
import type { NotificationItem } from '../types/api'
import { getFriendlyError } from '../utils/errors'

export function NotificationsScreen() {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const unreadCount = useMemo(() => items.filter((item) => item.lida === 0).length, [items])

  const load = async () => {
    try {
      setError(null)
      const response = await listNotifications()
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
        <AppCard>
          <View style={styles.header}>
            <View style={styles.badge}>
              <Ionicons name="notifications-outline" size={12} color={colors.primary} />
              <AppText style={styles.badgeText}>Notificações</AppText>
            </View>
            <AppText variant="title">Avisos e atualizações</AppText>
            <AppText variant="muted">
              Mantenha-se a par das novidades da plataforma, como no layout da web.
            </AppText>
            {unreadCount > 0 ? (
              <View style={styles.countPill}>
                <AppText style={styles.countText}>
                  {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                </AppText>
              </View>
            ) : null}
          </View>
        </AppCard>

        {error ? <ErrorBanner message={error} /> : null}
        {loading ? (
          <AppCard>
            <AppText variant="muted">A carregar notificações...</AppText>
          </AppCard>
        ) : items.length === 0 ? (
          <EmptyState title="Nenhuma notificação" description="Quando houver novidades, elas aparecerão aqui." />
        ) : (
          <>
            <View style={styles.actionsRow}>
              <AppButton label="Marcar todas como lidas" variant="secondary" />
              <AppButton label="Atualizar" variant="ghost" onPress={load} />
            </View>
            {items.map((item) => (
              <NotificationCard key={item.id} item={item} />
            ))}
          </>
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
  header: {
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
  countPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  countText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  actionsRow: {
    gap: spacing.sm,
  },
})

