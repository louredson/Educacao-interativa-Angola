import { useMemo, useState } from 'react'
import { Modal, Pressable, StyleSheet, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { colors, radii, spacing } from '../constants/colors'
import { useAuth } from '../context/AuthContext'
import { AppText } from './AppText'

type MenuItem = {
  label: string
  route: string
}

export function AppHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigation = useNavigation<any>()
  const { isAuthenticated, signOut } = useAuth()

  const menuItems = useMemo<MenuItem[]>(
    () =>
      isAuthenticated
        ? [
            { label: 'Início', route: 'HomeTab' },
            { label: 'Explorar', route: 'ExploreTab' },
            { label: 'Recursos', route: 'ResourcesTab' },
            { label: 'Conteúdos', route: 'ContentsTab' },
            { label: 'Fórum', route: 'ForumTab' },
            { label: 'Notificações', route: 'NotificationsTab' },
            { label: 'Perfil', route: 'ProfileTab' },
            { label: 'Sobre', route: 'AboutTab' },
          ]
        : [
            { label: 'Login', route: 'Login' },
            { label: 'Registo', route: 'Register' },
            { label: 'Recuperar senha', route: 'ForgotPassword' },
          ],
    [isAuthenticated],
  )

  const goTo = (route: string) => {
    setMenuOpen(false)
    const parent = navigation.getParent?.()
    if (parent) {
      parent.navigate(route)
      return
    }
    navigation.navigate(route)
  }

  return (
    <>
      <View style={styles.header}>
        <Pressable onPress={() => setMenuOpen(true)} style={styles.menuButton} accessibilityRole="button">
          <Ionicons name="menu" size={26} color={colors.text} />
        </Pressable>

        <View style={styles.brandWrap}>
          <View style={styles.brandMark}>
            <Ionicons name="book" size={16} color="#FFF" />
          </View>
          <View style={styles.brandTextWrap}>
            <AppText style={styles.brandName}>Economia com História</AppText>
            <AppText style={styles.brandSubtitle}>Plataforma móvel</AppText>
          </View>
        </View>
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

            <View style={styles.sheetList}>
              {menuItems.map((item) => (
                <Pressable key={item.route} onPress={() => goTo(item.route)} style={styles.menuRow}>
                  <AppText style={styles.menuLabel}>{item.label}</AppText>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </Pressable>
              ))}
            </View>

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
            ) : null}
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
  },
  menuButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
  },
  brandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginLeft: 'auto',
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
    alignItems: 'flex-end',
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
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetList: {
    gap: 4,
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
  menuLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  logoutRow: {
    backgroundColor: '#FFF1F2',
  },
  logoutLabel: {
    color: colors.danger,
  },
})
