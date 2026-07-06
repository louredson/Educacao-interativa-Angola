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
import { Ionicons } from '@expo/vector-icons'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

import { useAuth } from '../../contexts/AuthContext'
import { colors } from '../../theme/colors'
import type { AppStackParamList } from '../../navigation'

type Props = NativeStackScreenProps<AppStackParamList, 'ForgotPassword'>

// Só pede o email e envia o pedido — a redefinição em si acontece a partir
// do link recebido por email, que abre a página web (ver authService.ts
// para a explicação de porque não há um ecrã de "definir nova password"
// próprio no mobile).
export function ForgotPasswordScreen({ navigation }: Props) {
  const { forgotPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [enviado, setEnviado] = useState(false)

  async function onSubmit() {
    if (!email.trim()) {
      setErro('Introduz o teu email.')
      return
    }
    setErro('')
    setLoading(true)
    const res = await forgotPassword(email.trim().toLowerCase())
    setLoading(false)
    if (res.ok) {
      setEnviado(true)
    } else {
      setErro(res.message)
    }
  }

  if (enviado) {
    return (
      <View style={styles.centro}>
        <View style={styles.iconeSucesso}>
          <Ionicons name="checkmark-circle" size={40} color={colors.success} />
        </View>
        <Text style={styles.tituloSucesso}>Email enviado!</Text>
        <Text style={styles.textoSucesso}>
          Enviámos um link de recuperação para {email}.{'\n\n'}
          O link expira em 1 hora. Verifica também a pasta de spam. Abre o link no
          telemóvel ou no computador para definires a nova palavra-passe.
        </Text>
        <TouchableOpacity style={styles.botao} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.botaoTexto}>Voltar ao login</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.brand}>Recuperar senha</Text>
        <Text style={styles.subtitle}>Indica o teu email e enviamos um link para redefinires a senha.</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholderTextColor={colors.muted}
        />

        {erro ? <Text style={styles.erro}>{erro}</Text> : null}

        <TouchableOpacity style={styles.botao} onPress={onSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.botaoTexto}>Enviar link de recuperação</Text>}
        </TouchableOpacity>

        <View style={styles.linha}>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>← Voltar ao login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  brand: { fontSize: 24, fontWeight: '800', color: colors.primary, textAlign: 'center' },
  subtitle: { fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 6, marginBottom: 26, lineHeight: 20 },
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
  erro: { color: colors.danger, marginBottom: 8, textAlign: 'center' },
  botao: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  botaoTexto: { color: '#fff', fontWeight: '700', fontSize: 16 },
  linha: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  link: { color: colors.primary, fontWeight: '700' },

  centro: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 32 },
  iconeSucesso: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E8F7F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  tituloSucesso: { fontSize: 19, fontWeight: '800', color: colors.text },
  textoSucesso: { fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 10, lineHeight: 20 },
})
