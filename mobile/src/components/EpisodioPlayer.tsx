import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio'
import { colors } from '../theme/colors'

export function formatarTempo(segundos: number): string {
  if (!Number.isFinite(segundos) || segundos < 0) return '0:00'
  const m = Math.floor(segundos / 60)
  const s = Math.floor(segundos % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

interface Props {
  url: string
  titulo: string
  subtitulo?: string
}

/** Mini-leitor de áudio reutilizável (usado no detalhe de conteúdo e na playlist). */
export default function EpisodioPlayer({ url, titulo, subtitulo }: Props) {
  const player = useAudioPlayer(url)
  const status = useAudioPlayerStatus(player)
  return (
    <View style={styles.playerBar}>
      <TouchableOpacity onPress={() => (status.playing ? player.pause() : player.play())}>
        <Ionicons name={status.playing ? 'pause-circle' : 'play-circle'} size={44} color={colors.primary} />
      </TouchableOpacity>
      <View style={styles.playerInfo}>
        <Text style={styles.playerTitulo} numberOfLines={1}>{titulo}</Text>
        {subtitulo ? <Text style={styles.playerSubtitulo} numberOfLines={1}>{subtitulo}</Text> : null}
        <Text style={styles.playerTempo}>
          {formatarTempo(status.currentTime)} / {formatarTempo(status.duration ?? 0)}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  playerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  playerInfo: { flex: 1 },
  playerTitulo: { fontSize: 14, fontWeight: '700', color: colors.text },
  playerSubtitulo: { fontSize: 11, color: colors.muted, marginTop: 1 },
  playerTempo: { fontSize: 12, color: colors.muted, marginTop: 2 },
})
