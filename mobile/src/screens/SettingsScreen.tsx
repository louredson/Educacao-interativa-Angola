import { ScrollView, StyleSheet } from 'react-native'
import { AppButton } from '../components/AppButton'
import { AppCard } from '../components/AppCard'
import { AppScreen } from '../components/AppScreen'
import { AppText } from '../components/AppText'
import { SectionHeader } from '../components/SectionHeader'
import { spacing } from '../constants/colors'
import { useAuth } from '../context/AuthContext'

export function SettingsScreen() {
  const { signOut } = useAuth()

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionHeader title="Configurações" subtitle="Preferências e ações rápidas" />
        <AppCard>
          <AppText variant="subtitle">Sessão</AppText>
          <AppText variant="muted">
            O mobile consome a mesma API do web, então os dados atualizam automaticamente quando o backend muda.
          </AppText>
          <AppButton label="Terminar sessão" variant="danger" onPress={signOut} />
        </AppCard>
        <AppCard>
          <AppText variant="subtitle">Sistema</AppText>
          <AppText variant="muted">Tema optimizado para Android, com componentes responsivos e navegação protegida.</AppText>
        </AppCard>
      </ScrollView>
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
})


