import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { colors } from '../constants/colors'

export function ScreenLoader() {
  return (
    <View style={styles.wrapper}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
})

