import React, { useCallback, useState } from 'react'
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'

import { getPlaylist, removeFromPlaylist, resolveContentMedia, type PlaylistItem } from '../services/contentService'
import { colors } from '../theme/colors'
import { EstadoErro } from '../components/EstadoErro'
import EpisodioPlayer from '../components/EpisodioPlayer'

export function PlaylistScreen() {
  const [itens, setItens] = useState<PlaylistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<unknown>(null)
  const [ativo, setAtivo] = useState<PlaylistItem | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const res = await getPlaylist()
      setItens(Object.values(res.playlistItems ?? {}).sort((a, b) => b.addedAt - a.addedAt))
    } catch (e) {
      setItens([])
      setErro(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(useCallback(() => { void carregar() }, [carregar]))

  async function remover(item: PlaylistItem) {
    setItens((prev) => prev.filter((i) => i.episodeId !== item.episodeId))
    if (ativo?.episodeId === item.episodeId) setAtivo(null)
    try {
      await removeFromPlaylist(Number(item.podcastContentId), item.episodeId)
    } catch {
      void carregar() // repõe em caso de falha
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
    <View style={styles.flex}>
      {ativo ? (
        <View style={{ padding: 12 }}>
          <EpisodioPlayer
            key={ativo.episodeId}
            url={resolveContentMedia(ativo.audioUrl) ?? ''}
            titulo={ativo.episodeTitle}
            subtitulo={ativo.podcastTitle}
          />
        </View>
      ) : null}

      <FlatList
        contentContainerStyle={{ padding: 12 }}
        data={itens}
        keyExtractor={(i) => i.episodeId}
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="bookmark-outline" size={40} color={colors.muted} />
            <Text style={styles.vazio}>Ainda não guardaste nenhum episódio para ouvir depois.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={() => setAtivo(item)}>
            <View style={styles.itemIcone}>
              <Ionicons name="mic" size={18} color={colors.primary} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.itemTitulo} numberOfLines={1}>{item.episodeTitle}</Text>
              <Text style={styles.itemMeta} numberOfLines={1}>
                {item.podcastTitle}{item.duration ? ` · ${item.duration}` : ''}
              </Text>
            </View>
            <TouchableOpacity onPress={() => remover(item)} hitSlop={8}>
              <Ionicons name="close-circle" size={20} color={colors.muted} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  vazio: { color: colors.muted, fontSize: 13, textAlign: 'center', marginTop: 12 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  itemIcone: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FBEAEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitulo: { fontSize: 14, fontWeight: '700', color: colors.text },
  itemMeta: { fontSize: 12, color: colors.muted, marginTop: 2 },
})
