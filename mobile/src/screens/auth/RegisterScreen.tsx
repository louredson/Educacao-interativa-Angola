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
import SelectModal from '../../components/SelectModal'
import { CURSOS, INSTITUICOES, PROVINCIAS } from '../../constants/registo'
import type { AppStackParamList } from '../../navigation'

type Props = NativeStackScreenProps<AppStackParamList, 'Register'>

// Os mesmos campos pedidos no formulário de registo da versão web
// (frontend/src/app/pages/Login.tsx): nome, província, instituição, curso,
// email e palavra-passe — nesta mesma ordem.
export function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth()
  const [name, setName] = useState('')
  const [province, setProvince] = useState('Luanda')
  const [institution, setInstitution] = useState('')
  const [course, setCourse] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function onSubmit() {
    setErro(null)
    if (!name.trim() || !email.trim() || !password) {
      setErro('Preenche o nome, email e palavra-passe.')
      return
    }
    if (!province || !institution || !course) {
      setErro('Escolhe a tua província, instituição e curso.')
      return
    }
    // O backend exige mínimo de 8 caracteres — o mesmo limite usado no reset de password.
    if (password.length < 8) {
      setErro('A palavra-passe deve ter pelo menos 8 caracteres.')
      return
    }
    setLoading(true)
    const ok = await register({
      name: name.trim(),
      email: email.trim(),
      password,
      province,
      institution,
      course,
    })
    setLoading(false)
    if (ok) {
      if (navigation.canGoBack()) navigation.goBack()
    } else {
      setErro('Não foi possível criar a conta. O email pode já estar registado.')
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.brand}>Criar conta</Text>
        <Text style={styles.subtitle}>Junta-te à comunidade</Text>

        <TextInput
          style={styles.input}
          placeholder="Nome completo"
          value={name}
          onChangeText={setName}
          placeholderTextColor={colors.muted}
        />

        <SelectModal label="Província" value={province} options={PROVINCIAS} onChange={setProvince} />
        <SelectModal
          label="Instituição"
          placeholder="Selecione a instituição"
          value={institution}
          options={INSTITUICOES}
          onChange={setInstitution}
          pesquisavel
        />
        <SelectModal
          label="Curso"
          placeholder="Selecione o curso"
          value={course}
          options={CURSOS}
          onChange={setCourse}
          pesquisavel
        />

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
          placeholder="Palavra-passe (mín. 8 caracteres)"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholderTextColor={colors.muted}
        />

        {erro ? <Text style={styles.erro}>{erro}</Text> : null}

        <TouchableOpacity style={styles.botao} onPress={onSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.botaoTexto}>Criar conta</Text>
          )}
        </TouchableOpacity>

        <View style={styles.linha}>
          <Text style={styles.muted}>Já tens conta? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>Entrar</Text>
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
