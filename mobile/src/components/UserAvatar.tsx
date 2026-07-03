import React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { colors } from '../theme/colors'
import { resolveUploadUrl } from '../services/api'

interface Props {
  /** avatar_url devolvido pelo backend (relativo ou absoluto). */
  avatarUrl?: string | null
  /** Nome do utilizador, usado para gerar as iniciais de fallback. */
  nome?: string | null
  /** Diâmetro em pixels. Default: 36. */
  size?: number
  /** Cor de fundo do fallback de iniciais. Default: colors.primary. */
  corFundo?: string
  /** Cor do texto das iniciais. Default: '#fff'. */
  corTexto?: string
}

function iniciais(nome?: string | null): string {
  if (!nome) return '?'
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

/**
 * Avatar de utilizador partilhado por toda a app — sempre que alguém é
 * identificado (fórum, salas, ranking, perfil), deve usar-se este componente
 * para que a foto de perfil apareça de forma consistente, com fallback
 * automático para iniciais quando não há foto.
 */
export default function UserAvatar({ avatarUrl, nome, size = 36, corFundo, corTexto }: Props) {
  const src = resolveUploadUrl(avatarUrl)
  const estiloContainer = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: corFundo ?? colors.primary,
  }

  if (src) {
    return <Image source={{ uri: src }} style={estiloContainer} />
  }

  return (
    <View style={[styles.fallback, estiloContainer]}>
      <Text style={[styles.texto, { fontSize: Math.max(10, size * 0.38), color: corTexto ?? '#fff' }]}>
        {iniciais(nome)}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
  texto: { fontWeight: '700' },
})
