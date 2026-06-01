import { type ReactNode } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, spacing } from '../constants/colors'
import { AppHeader } from './AppHeader'
import { AppText } from './AppText'

interface AppScreenProps {
  children: ReactNode
  scroll?: boolean
  contentStyle?: object
  showHeader?: boolean
  showBack?: boolean
}

export function AppScreen({
  children,
  scroll = true,
  contentStyle,
  showHeader = true,
  showBack = false,
}: AppScreenProps) {
  const navigation = useNavigation<any>()
  const canGoBack = showBack && navigation.canGoBack?.()

  const backRow = canGoBack ? (
    <View style={styles.backRow}>
      <Pressable style={styles.backButtonWrap} onPress={() => navigation.goBack()} accessibilityRole="button">
        <Ionicons name="chevron-back" size={20} color={colors.text} />
      </Pressable>
      <AppText style={styles.backText}>Voltar</AppText>
    </View>
  ) : null

  if (scroll) {
    return (
      <SafeAreaView style={styles.safeArea}>
        {showHeader ? <AppHeader /> : null}
        {backRow}
        <ScrollView contentContainerStyle={[styles.scrollContent, contentStyle]} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {showHeader ? <AppHeader /> : null}
      {backRow}
      <View style={[styles.content, contentStyle]}>{children}</View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  backButtonWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },
})
