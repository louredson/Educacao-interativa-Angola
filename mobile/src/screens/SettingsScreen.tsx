import { ScrollView, StyleSheet } from 'react-native'
import { AppButton } from '../components/AppButton'
import { AppCard } from '../components/AppCard'
import { AuthPromptCard } from '../components/AuthPromptCard'
import { AppScreen } from '../components/AppScreen'
import { AppText } from '../components/AppText'
import { SectionHeader } from '../components/SectionHeader'
import { spacing } from '../constants/colors'
import { useAuth } from '../context/AuthContext'
import { navigateToTopLevel } from '../utils/navigation'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { ProfileStackParamList } from '../types/navigation'

type Props = NativeStackScreenProps<ProfileStackParamList, 'Settings'>

export function SettingsScreen({ navigation }: Props) {
  const { signOut, isAuthenticated } = useAuth()

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionHeader title="Configurações" subtitle="Preferências e ações rápidas" />

        {isAuthenticated ? (
          <>
            <AppCard>
              <AppText variant="subtitle">Sessão</AppText>
              <AppText variant="muted">
                O mobile consome a mesma API do web, então os dados atualizam automaticamente quando o backend muda.
              </AppText>
              <AppButton label="Terminar sessão" variant="danger" onPress={signOut} />
            </AppCard>
            <AppCard>
              <AppText variant="subtitle">Sistema</AppText>
              <AppText variant="muted">
                Tema optimizado para Android, com componentes responsivos e navegação protegida.
              </AppText>
            </AppCard>
          </>
        ) : (
          <AuthPromptCard
            title="Configurações reservadas"
            description="Algumas preferências ficam disponíveis apenas depois de entrar na tua conta."
            onLogin={() => navigateToTopLevel(navigation, 'Auth')}
            onRegister={() => navigateToTopLevel(navigation, 'Auth')}
          />
        )}
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
