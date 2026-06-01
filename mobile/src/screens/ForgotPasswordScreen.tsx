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

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>

export function ForgotPasswordScreen({ navigation }: Props) {
  const { requestPasswordReset, resetPassword, isAuthenticating, authError, clearError } = useAuth()
  const [email, setEmail] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [generatedToken, setGeneratedToken] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)

  const canRequest = useMemo(() => email.trim().length > 0, [email])
  const canReset = useMemo(
    () => resetToken.trim().length > 0 && newPassword.trim().length >= 6 && newPassword === confirmPassword,
    [resetToken, newPassword, confirmPassword],
  )

  const handleRequest = async () => {
    if (!canRequest) return
    clearError()
    const response = await requestPasswordReset(email.trim())
    setInfoMessage(response.message)
    setGeneratedToken(response.resetToken ?? null)
  }

  const handleReset = async () => {
    if (!canReset) return
    clearError()
    const response = await resetPassword(resetToken.trim(), newPassword)
    setInfoMessage(response.message)
  }

  return (
    <AppScreen scroll={false} showHeader={false}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <AppText variant="label" align="center" style={styles.label}>
              Recuperação
            </AppText>
            <AppText variant="title" align="center">
              Recuperar palavra-passe
            </AppText>
            <AppText variant="muted" align="center">
              Solicita um token e depois define uma nova palavra-passe.
            </AppText>
          </View>

          <AppCard>
            {authError ? <ErrorBanner message={authError} /> : null}
            {infoMessage ? <ErrorBanner message={infoMessage} /> : null}
            <AppTextInput label="Email" value={email} onChangeText={setEmail} placeholder="teu@email.com" keyboardType="email-address" autoCapitalize="none" />
            <AppButton label="Enviar token" onPress={handleRequest} loading={isAuthenticating} disabled={!canRequest} />
            {generatedToken ? (
              <View style={styles.tokenBox}>
                <AppText variant="label">Token de desenvolvimento</AppText>
                <AppText style={styles.token}>{generatedToken}</AppText>
              </View>
            ) : null}
          </AppCard>

          <AppCard>
            <AppText variant="subtitle">Definir nova palavra-passe</AppText>
            <AppTextInput label="Token" value={resetToken} onChangeText={setResetToken} placeholder="Cole o token" autoCapitalize="none" />
            <AppTextInput label="Nova palavra-passe" value={newPassword} onChangeText={setNewPassword} placeholder="Mínimo 6 caracteres" secureTextEntry />
            <AppTextInput label="Confirmar palavra-passe" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Repete a nova palavra-passe" secureTextEntry />
            <AppButton label="Atualizar palavra-passe" onPress={handleReset} loading={isAuthenticating} disabled={!canReset} />
          </AppCard>

          <AppButton label="Voltar ao login" variant="ghost" onPress={() => navigation.navigate('Login')} />
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
  tokenBox: {
    gap: 6,
  },
  token: {
    fontFamily: 'Courier',
    color: colors.primaryDark,
  },
})



