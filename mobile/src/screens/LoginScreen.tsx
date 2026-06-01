import { useMemo, useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { AppButton } from '../components/AppButton'
import { AppCard } from '../components/AppCard'
import { AppScreen } from '../components/AppScreen'
import { AppText } from '../components/AppText'
import { AppTextInput } from '../components/AppTextInput'
import { ErrorBanner } from '../components/ErrorBanner'
import { colors, spacing } from '../constants/colors'
import { useAuth } from '../context/AuthContext'
import type { AuthStackParamList } from '../types/navigation'
import { navigateToTopLevel } from '../utils/navigation'

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>

export function LoginScreen({ navigation }: Props) {
  const { signIn, signInDemo, isAuthenticating, authError, clearError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const canSubmit = useMemo(() => email.trim().length > 0 && password.trim().length > 0, [email, password])

  const handleSubmit = async () => {
    if (!canSubmit) return
    clearError()
    await signIn({ email: email.trim(), password })
    navigateToTopLevel(navigation, 'Main')
  }

  return (
    <AppScreen scroll={false} showHeader={false} showBack>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <AppText variant="label" align="center" style={styles.label}>
              Bem-vindo
            </AppText>
            <AppText variant="title" align="center">
              Entrar na plataforma
            </AppText>
            <AppText variant="muted" align="center">
              Usa a tua conta para ver conteúdos, progresso e notificações.
            </AppText>
          </View>

          <AppCard>
            {authError ? <ErrorBanner message={authError} /> : null}
            <AppTextInput
              label="Email"
              placeholder="teu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(value) => {
                setEmail(value)
                if (authError) clearError()
              }}
            />
            <AppTextInput
              label="Palavra-passe"
              placeholder="********"
              secureTextEntry
              value={password}
              onChangeText={(value) => {
                setPassword(value)
                if (authError) clearError()
              }}
            />
            <AppButton label="Entrar" onPress={handleSubmit} loading={isAuthenticating} disabled={!canSubmit} />
            <AppButton
              label="Entrar em modo demo"
              variant="secondary"
              onPress={async () => {
                await signInDemo()
                navigateToTopLevel(navigation, 'Main')
              }}
              loading={isAuthenticating}
            />
            <AppButton
              label="Esqueci a palavra-passe"
              variant="ghost"
              onPress={() => navigation.navigate('ForgotPassword')}
            />
          </AppCard>

          <View style={styles.footer}>
            <AppText variant="muted" align="center">
              Ainda não tens conta?
            </AppText>
            <AppButton
              label="Criar conta gratuita"
              variant="secondary"
              onPress={() => navigation.navigate('Register')}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.lg,
  },
  hero: {
    gap: 8,
    alignItems: 'center',
  },
  label: {
    color: colors.primary,
  },
  footer: {
    gap: spacing.md,
  },
})


