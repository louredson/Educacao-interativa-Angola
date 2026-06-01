import { View, StyleSheet } from 'react-native'
import { AppText } from './AppText'

interface SectionHeaderProps {
  title: string
  subtitle?: string
}

export function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <View style={styles.wrapper}>
      <AppText variant="subtitle">{title}</AppText>
      {subtitle ? <AppText variant="muted">{subtitle}</AppText> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 4,
  },
})

