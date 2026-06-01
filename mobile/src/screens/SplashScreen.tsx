import { StyleSheet, View } from 'react-native'
import { colors } from '../constants/colors'
import { AppText } from '../components/AppText'
import { ScreenLoader } from '../components/ScreenLoader'

export function SplashScreen() {
  return (
    <View style={styles.wrapper}>
      <AppText variant="label" align="center" style={styles.brand}>
        Economia com História
      </AppText>
      <AppText variant="title" align="center" style={styles.title}>
        Plataforma móvel oficial
      </AppText>
      <AppText variant="muted" align="center" style={styles.subtitle}>
        A preparar os teus dados mais recentes.
      </AppText>
      <ScreenLoader />
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: colors.background,
    gap: 12,
  },
  brand: {
    color: colors.primary,
  },
  title: {
    color: colors.text,
  },
  subtitle: {
    maxWidth: 320,
  },
})


