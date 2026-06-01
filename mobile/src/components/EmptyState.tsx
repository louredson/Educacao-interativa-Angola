import { StyleSheet, View } from 'react-native'
import { colors, radii, spacing } from '../constants/colors'
import { AppText } from './AppText'

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <View style={styles.wrapper}>
      <AppText variant="subtitle" align="center">
        {title}
      </AppText>
      {description ? (
        <AppText variant="muted" align="center">
          {description}
        </AppText>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    padding: spacing.xl,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    alignItems: 'center',
  },
})

