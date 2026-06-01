import { useMemo, useState } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute } from '@react-navigation/native'
import { colors, radii, spacing } from '../constants/colors'
import { useAuth } from '../context/AuthContext'
import { navigateToTopLevel } from '../utils/navigation'
import { AppText } from './AppText'

type MenuItem = {
  label: string
  route: string
}

export function AppHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigation = useNavigation<any>()
  const route = useRoute()
  const { isAuthenticated, signOut } = useAuth()

  const menuItems = useMemo<MenuItem[]>(
    () => [
      { label: 'Início', route: 'HomeTab' },
      { label: 'Explorar', route: 'ExploreTab' },
      { label: 'Recursos', route: 'ResourcesTab' },
      { label: 'Conteúdos', route: 'ContentsTab' },
      { label: 'Fórum', route: 'ForumTab' },
      { label: 'Notificações', route: 'NotificationsTab' },
      { label: 'Perfil', route: 'ProfileTab' },
      { label: 'Sobre', route: 'AboutTab' },
    ],
    [],
  )

  const goTo = (route: string) => {
    setMenuOpen(false)
    navigateToTopLevel(navigation, route)
  }

  const goHome = () => {
    navigateToTopLevel(navigation, 'HomeTab')
  }

  const activeRoute = useMemo(() => {
    switch (route.name) {
      case 'Home':
      case 'HomeTab':
        return 'HomeTab'
      case 'ExploreTab':
        return 'ExploreTab'
      case 'ResourcesTab':
        return 'ResourcesTab'
      case 'ContentList':
      case 'ContentDetail':
        return 'ContentsTab'
      case 'ForumTab':
        return 'ForumTab'
      case 'NotificationsTab':
        return 'NotificationsTab'
      case 'Profile':
      case 'Settings':
        return 'ProfileTab'
      case 'AboutTab':
        return 'AboutTab'
      default:
        return null
    }
  }, [route.name])

  return (
    <>
      <View style={styles.header}>
        <View style={styles.leftArea}>
          {navigation.canGoBack?.() ? (
            <Pressable onPress={() => navigation.goBack()} style={styles.backButton} accessibilityRole="button">
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </Pressable>
          ) : null}

          <Pressable onPress={goHome} style={styles.brandWrap} accessibilityRole="button">
            <View style={styles.brandMark}>
              <Ionicons name="book" size={16} color="#FFF" />
            </View>
            <View style={styles.brandTextWrap}>
              <AppText style={styles.brandName}>Economia com História</AppText>
              <AppText style={styles.brandSubtitle}>Plataforma móvel</AppText>
            </View>
          </Pressable>
        </View>

        <Pressable onPress={() => setMenuOpen(true)} style={styles.menuButton} accessibilityRole="button">
          <Ionicons name="menu" size={26} color={colors.text} />
        </Pressable>
      </View>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => null}>
            <View style={styles.sheetHeader}>
              <AppText variant="subtitle">Menu</AppText>
              <Pressable onPress={() => setMenuOpen(false)}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={styles.sheetContent}
              showsVerticalScrollIndicator={false}
            >
              {menuItems.map((item) => (
                <Pressable
                  key={item.route}
                  onPress={() => goTo(item.route)}
                  style={[styles.menuRow, activeRoute === item.route && styles.menuRowActive]}
                >
                  <AppText style={[styles.menuLabel, activeRoute === item.route && styles.menuLabelActive]}>
                    {item.label}
                  </AppText>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </Pressable>
              ))}
              {isAuthenticated ? (
                <Pressable
                  onPress={() => {
                    setMenuOpen(false)
                    void signOut()
                  }}
                  style={[styles.menuRow, styles.logoutRow]}
                >
                  <AppText style={[styles.menuLabel, styles.logoutLabel]}>Terminar sessão</AppText>
                  <Ionicons name="log-out-outline" size={18} color={colors.danger} />
                </Pressable>
              ) : (
                <View style={styles.authActions}>
                  <Pressable onPress={() => goTo('Auth')} style={[styles.menuRow, styles.authRow]}>
                    <AppText style={styles.menuLabel}>Entrar</AppText>
                    <Ionicons name="log-in-outline" size={18} color={colors.primary} />
                  </Pressable>
                  <Pressable
                    onPress={() => goTo('Auth')}
                    style={[styles.menuRow, styles.authRowSecondary]}
                  >
                    <AppText style={styles.menuLabel}>Criar conta gratuita</AppText>
                    <Ionicons name="person-add-outline" size={18} color={colors.text} />
                  </Pressable>
                </View>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  header: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  menuButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
  },
  leftArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    flexShrink: 0,
  },
  brandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
    minWidth: 0,
  },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  brandTextWrap: {
    alignItems: 'flex-start',
    flexShrink: 1,
    minWidth: 0,
  },
  brandName: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  brandSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.42)',
    justifyContent: 'flex-start',
  },
  sheet: {
    margin: spacing.lg,
    marginTop: 72,
    maxHeight: '82%',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.md,
    overflow: 'hidden',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetScroll: {
    flexGrow: 0,
  },
  sheetContent: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  menuRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
  },
  menuRowActive: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  menuLabelActive: {
    color: colors.primary,
  },
  logoutRow: {
    backgroundColor: '#FFF1F2',
  },
  logoutLabel: {
    color: colors.danger,
  },
  authActions: {
    gap: spacing.sm,
  },
  authRow: {
    backgroundColor: '#FFF1F2',
  },
  authRowSecondary: {
    backgroundColor: colors.surfaceAlt,
  },
})
