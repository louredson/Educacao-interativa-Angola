import React, { useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

import { useAuth } from '../../contexts/AuthContext'
import { colors } from '../../theme/colors'
import type { AppStackParamList } from '../../navigation'

type Props = NativeStackScreenProps<AppStackParamList, 'Login'>

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function onSubmit() {
    setErro(null)
    if (!email.trim() || !password) {
      setErro('Preenche o email e a palavra-passe.')
      return
    }
    setLoading(true)
    const ok = await login(email.trim(), password)
    setLoading(false)
    if (ok) {
      if (navigation.canGoBack()) navigation.goBack()
    } else {
      setErro('Credenciais inválidas. Tenta novamente.')
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.brand}>Economia com História</Text>
        <Text style={styles.subtitle}>Entra na tua conta</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholderTextColor={colors.muted}
        />
        <TextInput
          style={styles.input}
          placeholder="Palavra-passe"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholderTextColor={colors.muted}
        />

        {erro ? <Text style={styles.erro}>{erro}</Text> : null}

        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.esqueceuLink}>
          <Text style={styles.link}>Esqueceu a senha?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.botao} onPress={onSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.botaoTexto}>Entrar</Text>
          )}
        </TouchableOpacity>

        <View style={styles.linha}>
          <Text style={styles.muted}>Não tens conta? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.link}>Criar conta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  brand: { fontSize: 26, fontWeight: '800', color: colors.primary, textAlign: 'center' },
  subtitle: { fontSize: 15, color: colors.muted, textAlign: 'center', marginBottom: 28 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    marginBottom: 12,
  },
  erro: { color: colors.danger, marginBottom: 8 },
  esqueceuLink: { alignSelf: 'flex-end', marginBottom: 16 },
  botao: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  botaoTexto: { color: '#fff', fontWeight: '700', fontSize: 16 },
  linha: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  muted: { color: colors.muted },
  link: { color: colors.primary, fontWeight: '700' },
})
