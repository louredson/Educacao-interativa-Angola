import { type ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { colors, radii, spacing } from '../constants/colors'

export function AppCard({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
})

