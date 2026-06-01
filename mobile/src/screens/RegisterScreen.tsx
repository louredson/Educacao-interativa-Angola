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

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>

export function RegisterScreen({ navigation }: Props) {
  const { signUp, isAuthenticating, authError, clearError } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [province, setProvince] = useState('Luanda')
  const [institution, setInstitution] = useState('')
  const [course, setCourse] = useState('')

  const validationError = useMemo(() => {
    if (password && confirmPassword && password !== confirmPassword) {
      return 'As palavras-passe não coincidem'
    }
    return null
  }, [password, confirmPassword])

  const canSubmit =
    name.trim().length > 2 &&
    email.trim().length > 0 &&
    password.trim().length >= 6 &&
    password === confirmPassword &&
    !validationError

  const handleSubmit = async () => {
    if (!canSubmit) return
    clearError()
    await signUp({
      name: name.trim(),
      email: email.trim(),
      password,
      telemovel: phone.trim() || null,
      province: province.trim() || 'Luanda',
      institution: institution.trim() || null,
      course: course.trim() || null,
    })
  }

  return (
    <AppScreen scroll={false} showHeader={false}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <AppText variant="label" align="center" style={styles.label}>
              Registo
            </AppText>
            <AppText variant="title" align="center">
              Criar conta gratuita
            </AppText>
            <AppText variant="muted" align="center">
              O teu progresso fica sincronizado no backend principal.
            </AppText>
          </View>

          <AppCard>
            {authError ? <ErrorBanner message={authError} /> : null}
            {validationError ? <ErrorBanner message={validationError} /> : null}
            <AppTextInput label="Nome completo" value={name} onChangeText={setName} placeholder="Nome e apelido" />
            <AppTextInput
              label="Email"
              value={email}
              onChangeText={(value) => {
                setEmail(value)
                if (authError) clearError()
              }}
              placeholder="teu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <AppTextInput
              label="Palavra-passe"
              value={password}
              onChangeText={setPassword}
              placeholder="Mínimo 6 caracteres"
              secureTextEntry
            />
            <AppTextInput
              label="Confirmar palavra-passe"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repete a palavra-passe"
              secureTextEntry
            />
            <AppTextInput label="Telemóvel" value={phone} onChangeText={setPhone} placeholder="+244..." keyboardType="phone-pad" />
            <AppTextInput label="Província" value={province} onChangeText={setProvince} placeholder="Luanda" />
            <AppTextInput label="Instituição" value={institution} onChangeText={setInstitution} placeholder="Escola ou universidade" />
            <AppTextInput label="Curso" value={course} onChangeText={setCourse} placeholder="Economia, história..." />
            <AppButton label="Criar conta" onPress={handleSubmit} loading={isAuthenticating} disabled={!canSubmit} />
          </AppCard>

          <AppButton label="Já tenho conta" variant="ghost" onPress={() => navigation.navigate('Login')} />
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
})



