import { type ReactNode } from 'react'
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native'
import { colors, spacing } from '../constants/colors'
import { AppHeader } from './AppHeader'

interface AppScreenProps {
  children: ReactNode
  scroll?: boolean
  contentStyle?: object
  showHeader?: boolean
}

export function AppScreen({ children, scroll = true, contentStyle, showHeader = true }: AppScreenProps) {
  if (scroll) {
    return (
      <SafeAreaView style={styles.safeArea}>
        {showHeader ? <AppHeader /> : null}
        <ScrollView contentContainerStyle={[styles.scrollContent, contentStyle]} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {showHeader ? <AppHeader /> : null}
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
})
