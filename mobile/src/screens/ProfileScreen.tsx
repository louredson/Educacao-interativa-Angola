import React, { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'

import { getMyProfile, type PerfilRaw } from '../services/profileService'
import { useAuth } from '../contexts/AuthContext'
import { colors } from '../theme/colors'
import { EstadoErro } from '../components/EstadoErro'
import UserAvatar from '../components/UserAvatar'
import type { AppStackParamList } from '../navigation'

type Perfil = PerfilRaw

export function ProfileScreen() {
  const { user, logout, isAuthenticated } = useAuth()
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>()
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<unknown>(null)

  const carregar = useCallback(async () => {
    if (!isAuthenticated) {
      setPerfil(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setErro(null)
    try {
      const data = await getMyProfile()
      setPerfil(data)
    } catch (e) {
      setPerfil(null)
      setErro(e)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useFocusEffect(
    useCallback(() => {
      void carregar()
    }, [carregar]),
  )

  if (!isAuthenticated) {
    return (
      <View style={styles.guest}>
        <Ionicons name="person-circle-outline" size={72} color={colors.muted} />
        <Text style={styles.guestTitulo}>Ainda não iniciaste sessão</Text>
        <Text style={styles.guestTexto}>
          Entra para guardar conteúdos, participar no fórum e acompanhar o teu progresso.
        </Text>
        <TouchableOpacity style={styles.guestBtn} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.guestBtnTexto}>Entrar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.guestBtn, styles.guestBtnSec]}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={[styles.guestBtnTexto, styles.guestBtnTextoSec]}>Criar conta</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (erro && !perfil && !loading) {
    return <EstadoErro erro={erro} onTentarNovamente={carregar} />
  }

  const nome = perfil?.nome ?? user?.name ?? ''
  const st = perfil?.stats

  const cards = [
    { label: 'Conteúdos lidos', value: st?.conteudos_lidos ?? 0, icon: 'book' as const },
    { label: 'Quizzes feitos', value: st?.quizzes_feitos ?? 0, icon: 'help-circle' as const },
    { label: 'Respostas no fórum', value: st?.respostas_forum ?? 0, icon: 'chatbubbles' as const },
    { label: 'Favoritos', value: st?.favoritos ?? 0, icon: 'bookmark' as const },
  ]

  return (
    <ScrollView style={styles.flex} contentContainerStyle={{ paddingBottom: 30 }}>
      <View style={styles.hero}>
        <UserAvatar
          avatarUrl={perfil?.avatar_url ?? user?.avatarUrl}
          nome={nome}
          size={80}
          corFundo="#fff"
          corTexto={colors.primary}
        />
        <Text style={styles.nome}>{nome}</Text>
        <Text style={styles.email}>{perfil?.email ?? user?.email}</Text>
        {st ? <Text style={styles.pontos}>{st.pontuacao_total} pontos</Text> : null}
        <TouchableOpacity style={styles.editarBtn} onPress={() => navigation.navigate('EditProfile')}>
          <Ionicons name="create-outline" size={14} color={colors.primary} />
          <Text style={styles.editarBtnTexto}>Editar perfil</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
      ) : (
        <>
          <View style={styles.grid}>
            {cards.map((c) => (
              <View key={c.label} style={styles.card}>
                <Ionicons name={c.icon} size={20} color={colors.primary} />
                <Text style={styles.cardValor}>{c.value}</Text>
                <Text style={styles.cardLabel}>{c.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.info}>
            <Linha icon="location-outline" label="Província" valor={perfil?.provincia} />
            <Linha icon="business-outline" label="Instituição" valor={perfil?.instituicao} />
            <Linha icon="school-outline" label="Curso" valor={perfil?.curso} />
          </View>

          <View style={styles.menu}>
            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Playlist')}>
              <Ionicons name="bookmark-outline" size={20} color={colors.primary} />
              <Text style={styles.menuTexto}>A minha playlist</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('History')}>
              <Ionicons name="time-outline" size={20} color={colors.primary} />
              <Text style={styles.menuTexto}>Histórico</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </TouchableOpacity>
            {user?.isProfessorOuAdmin && (
              <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('JindungoRequests')}>
                <Ionicons name="flame-outline" size={20} color={colors.primary} />
                <Text style={styles.menuTexto}>Pedidos de Acesso Jindungo</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
              </TouchableOpacity>
            )}
          </View>
        </>
      )}

      <TouchableOpacity style={styles.sair} onPress={() => void logout()}>
        <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        <Text style={styles.sairTexto}>Terminar sessão</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

function Linha({
  icon,
  label,
  valor,
}: {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  valor?: string | null
}) {
  return (
    <View style={styles.linha}>
      <Ionicons name={icon} size={18} color={colors.muted} />
      <Text style={styles.linhaLabel}>{label}</Text>
      <Text style={styles.linhaValor}>{valor || '—'}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  guest: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  guestTitulo: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 14 },
  guestTexto: { fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  guestBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 40,
    marginTop: 16,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  guestBtnTexto: { color: '#fff', fontWeight: '700', fontSize: 15 },
  guestBtnSec: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary, marginTop: 10 },
  guestBtnTextoSec: { color: colors.primary },
  hero: { backgroundColor: colors.primary, alignItems: 'center', paddingVertical: 30 },
  editarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginTop: 12,
  },
  editarBtnTexto: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  nome: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 12 },
  email: { color: '#fff', opacity: 0.9, marginTop: 2 },
  pontos: { color: '#fff', fontWeight: '700', marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    width: '47%',
    flexGrow: 1,
  },
  cardValor: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 6 },
  cardLabel: { fontSize: 12, color: colors.muted, marginTop: 2 },
  info: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 12,
    paddingHorizontal: 14,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  linhaLabel: { color: colors.muted, fontSize: 14 },
  linhaValor: { color: colors.text, fontSize: 14, fontWeight: '600', marginLeft: 'auto' },
  menu: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 12,
    marginTop: 12,
    paddingHorizontal: 14,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  menuTexto: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '600' },
  sair: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    marginHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  sairTexto: { color: colors.danger, fontWeight: '700', fontSize: 15 },
})
