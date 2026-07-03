import React, { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'

import {
  getUserContentState,
  listContent,
  reactToContent,
  saveContent,
  type ConteudoRaw,
} from '../services/contentService'
import { useAuth } from '../contexts/AuthContext'
import { colors } from '../theme/colors'
import { EstadoErro } from '../components/EstadoErro'
import UserAvatar from '../components/UserAvatar'
import type { AppStackParamList } from '../navigation'

const TIPO_LABEL: Record<ConteudoRaw['tipo'], string> = {
  video: 'Vídeo',
  texto_normal: 'Texto',
  texto_jindungo: 'Jindungo',
  podcast: 'Podcast',
}

export function ExplorarScreen() {
  const { isAuthenticated } = useAuth()
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>()
  const [itens, setItens] = useState<ConteudoRaw[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<unknown>(null)
  const [liked, setLiked] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})

  const carregar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const res = await listContent()
      setItens(
        (res.conteudos ?? []).map((c) => ({
          ...c,
          id: Number(c.id),
          likes: Number(c.likes ?? 0),
          comentarios: Number(c.comentarios ?? 0),
          visualizacoes: Number(c.visualizacoes ?? 0),
        })),
      )
    } catch (e) {
      setItens([])
      setErro(e)
    } finally {
      setLoading(false)
    }
    // Estado do utilizador (gostos/guardados) — requer sessão
    try {
      const estado = await getUserContentState()
      setLiked(estado.likedContents ?? {})
      setSaved(estado.savedContents ?? {})
    } catch {
      /* anónimo ou sem ligação — não é um erro a mostrar, apenas fica sem estado pessoal */
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      void carregar()
    }, [carregar]),
  )

  async function toggleLike(item: ConteudoRaw) {
    if (!isAuthenticated) {
      navigation.navigate('Login')
      return
    }
    const jaGosto = !!liked[item.id]
    setLiked((p) => ({ ...p, [item.id]: !jaGosto }))
    setItens((prev) =>
      prev.map((c) => (c.id === item.id ? { ...c, likes: c.likes + (jaGosto ? -1 : 1) } : c)),
    )
    try {
      await reactToContent(item.id, jaGosto ? null : 'like')
    } catch {
      void carregar() // reverte com o estado real
    }
  }

  async function toggleSave(item: ConteudoRaw) {
    if (!isAuthenticated) {
      navigation.navigate('Login')
      return
    }
    const jaGuardado = !!saved[item.id]
    setSaved((p) => ({ ...p, [item.id]: !jaGuardado }))
    try {
      await saveContent(item.id, !jaGuardado)
    } catch {
      setSaved((p) => ({ ...p, [item.id]: jaGuardado }))
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (erro && itens.length === 0) {
    return <EstadoErro erro={erro} onTentarNovamente={carregar} />
  }

  return (
    <FlatList
      style={styles.flex}
      contentContainerStyle={{ padding: 12 }}
      data={itens}
      keyExtractor={(i) => String(i.id)}
      ListEmptyComponent={<Text style={styles.vazio}>Ainda não há conteúdos.</Text>}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('ContentDetail', { conteudo: item })}
        >
          <View style={styles.cardTopo}>
            <View style={styles.badge}>
              <Text style={styles.badgeTexto}>{TIPO_LABEL[item.tipo] ?? item.tipo}</Text>
            </View>
            {item.categoria ? <Text style={styles.categoria}>{item.categoria}</Text> : null}
          </View>
          <Text style={styles.titulo}>{item.titulo}</Text>
          {item.descricao ? (
            <Text style={styles.descricao} numberOfLines={3}>
              {item.descricao}
            </Text>
          ) : null}

          <View style={styles.autorLinha}>
            <UserAvatar avatarUrl={item.autor_avatar} nome={item.autor_nome} size={18} />
            <Text style={styles.autorTexto}>{item.autor_nome || 'Utilizador'}</Text>
          </View>

          <View style={styles.rodape}>
            <TouchableOpacity style={styles.acao} onPress={() => toggleLike(item)}>
              <Ionicons
                name={liked[item.id] ? 'thumbs-up' : 'thumbs-up-outline'}
                size={18}
                color={liked[item.id] ? colors.success : colors.muted}
              />
              <Text style={styles.acaoTexto}>{item.likes}</Text>
            </TouchableOpacity>

            <View style={styles.acao}>
              <Ionicons name="chatbubble-outline" size={17} color={colors.muted} />
              <Text style={styles.acaoTexto}>{item.comentarios}</Text>
            </View>

            <View style={styles.acao}>
              <Ionicons name="eye-outline" size={18} color={colors.muted} />
              <Text style={styles.acaoTexto}>{item.visualizacoes}</Text>
            </View>

            <TouchableOpacity style={[styles.acao, styles.guardar]} onPress={() => toggleSave(item)}>
              <Ionicons
                name={saved[item.id] ? 'bookmark' : 'bookmark-outline'}
                size={18}
                color={saved[item.id] ? colors.primary : colors.muted}
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}
    />
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  vazio: { textAlign: 'center', color: colors.muted, marginTop: 40 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  cardTopo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  badge: { backgroundColor: '#FBEAEA', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  badgeTexto: { color: colors.primary, fontSize: 11, fontWeight: '700' },
  categoria: { color: colors.muted, fontSize: 12 },
  titulo: { fontSize: 16, fontWeight: '700', color: colors.text },
  descricao: { fontSize: 13, color: colors.muted, marginTop: 6, lineHeight: 19 },
  autorLinha: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  autorTexto: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  rodape: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  acao: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  acaoTexto: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  guardar: { marginLeft: 'auto' },
})
