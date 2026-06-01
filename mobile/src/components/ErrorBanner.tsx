import { StyleSheet, View } from 'react-native'
import { colors, radii, spacing } from '../constants/colors'
import { AppText } from './AppText'

export function ErrorBanner({ message }: { message: string }) {
  return (
    <View style={styles.banner}>
      <AppText style={styles.text}>{message}</AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  text: {
    color: colors.danger,
    fontWeight: '600',
  },
})

