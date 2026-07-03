import React, { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Ionicons } from '@expo/vector-icons'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

import { updateMyProfile, uploadAvatar } from '../services/profileService'
import { mensagemAmigavel } from '../components/EstadoErro'
import UserAvatar from '../components/UserAvatar'
import { useAuth } from '../contexts/AuthContext'
import { colors } from '../theme/colors'
import type { AppStackParamList } from '../navigation'

type Props = NativeStackScreenProps<AppStackParamList, 'EditProfile'>

export function EditProfileScreen({ navigation }: Props) {
  const { user, refreshUser } = useAuth()

  const [nome, setNome] = useState(user?.name ?? '')
  const [provincia, setProvincia] = useState(user?.province ?? '')
  const [instituicao, setInstituicao] = useState(user?.institution ?? '')
  const [curso, setCurso] = useState(user?.course ?? '')

  const [aEnviarFoto, setAEnviarFoto] = useState(false)
  const [aGuardar, setAGuardar] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // A foto é enviada de imediato ao ser escolhida (não espera pelo "Guardar"),
  // tal como na web — assim o utilizador vê logo o resultado.
  async function escolherFoto() {
    setErro(null)
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permissao.granted) {
      Alert.alert(
        'Permissão necessária',
        'Precisamos de acesso às tuas fotos para poderes escolher uma foto de perfil.',
      )
      return
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    })
    if (resultado.canceled) return

    const asset = resultado.assets[0]
    if (!asset) return

    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
      Alert.alert('Imagem demasiado grande', 'O limite é 5MB. Escolhe outra foto.')
      return
    }

    setAEnviarFoto(true)
    try {
      await uploadAvatar(asset.uri, asset.mimeType ?? 'image/jpeg')
      await refreshUser() // atualiza o avatar em toda a app (perfil, fórum, salas, ranking...)
      Alert.alert('Pronto!', 'Foto de perfil atualizada com sucesso.')
    } catch (e) {
      Alert.alert('Não foi possível carregar a foto', mensagemAmigavel(e))
    } finally {
      setAEnviarFoto(false)
    }
  }

  async function guardar() {
    if (!nome.trim()) {
      setErro('O nome não pode ficar vazio.')
      return
    }
    setErro(null)
    setAGuardar(true)
    try {
      await updateMyProfile({
        nome: nome.trim(),
        provincia: provincia.trim() || undefined,
        instituicao: instituicao.trim() || undefined,
        curso: curso.trim() || undefined,
      })
      await refreshUser()
      navigation.goBack()
    } catch (e) {
      setErro(mensagemAmigavel(e))
    } finally {
      setAGuardar(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.avatarWrap}>
          <UserAvatar avatarUrl={user?.avatarUrl} nome={user?.name} size={104} />
          <TouchableOpacity style={styles.avatarBtn} onPress={escolherFoto} disabled={aEnviarFoto}>
            {aEnviarFoto ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="camera" size={16} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={escolherFoto} disabled={aEnviarFoto}>
          <Text style={styles.trocarFotoTexto}>Trocar foto de perfil</Text>
        </TouchableOpacity>

        <View style={styles.campo}>
          <Text style={styles.label}>Nome completo</Text>
          <TextInput
            style={styles.input}
            value={nome}
            onChangeText={setNome}
            placeholder="O teu nome"
            placeholderTextColor={colors.muted}
          />
        </View>

        <View style={styles.campo}>
          <Text style={styles.label}>Província</Text>
          <TextInput
            style={styles.input}
            value={provincia}
            onChangeText={setProvincia}
            placeholder="Ex: Luanda"
            placeholderTextColor={colors.muted}
          />
        </View>

        <View style={styles.campo}>
          <Text style={styles.label}>Instituição</Text>
          <TextInput
            style={styles.input}
            value={instituicao}
            onChangeText={setInstituicao}
            placeholder="Ex: Universidade Agostinho Neto"
            placeholderTextColor={colors.muted}
          />
        </View>

        <View style={styles.campo}>
          <Text style={styles.label}>Curso</Text>
          <TextInput
            style={styles.input}
            value={curso}
            onChangeText={setCurso}
            placeholder="Ex: Economia"
            placeholderTextColor={colors.muted}
          />
        </View>

        {erro ? <Text style={styles.erro}>{erro}</Text> : null}

        <TouchableOpacity style={styles.botao} onPress={guardar} disabled={aGuardar}>
          {aGuardar ? <ActivityIndicator color="#fff" /> : <Text style={styles.botaoTexto}>Guardar alterações</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: 24, alignItems: 'center' },
  avatarWrap: { position: 'relative', marginTop: 8 },
  avatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  trocarFotoTexto: { color: colors.primary, fontWeight: '700', fontSize: 13, marginTop: 10 },
  campo: { alignSelf: 'stretch', marginTop: 20 },
  label: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 6 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  erro: { color: colors.danger, fontSize: 13, marginTop: 16, textAlign: 'center', alignSelf: 'stretch' },
  botao: {
    alignSelf: 'stretch',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  botaoTexto: { color: '#fff', fontWeight: '700', fontSize: 16 },
})
