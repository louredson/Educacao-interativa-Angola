import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../theme/colors'
import { ApiError } from '../services/api'

interface Props {
  erro?: unknown
  aTentar?: boolean
  onTentarNovamente: () => void
}

/** Traduz um erro apanhado de apiRequest numa mensagem amigável para o utilizador. */
export function mensagemAmigavel(erro: unknown): string {
  if (erro instanceof ApiError) {
    if (erro.kind === 'network') return erro.message
    if (erro.kind === 'timeout') return erro.message
    if (erro.kind === 'http') return erro.message || 'Não foi possível completar o pedido.'
  }
  return 'Ocorreu um erro inesperado. Tenta novamente.'
}

function icone(erro: unknown): keyof typeof Ionicons.glyphMap {
  if (erro instanceof ApiError && erro.kind === 'network') return 'cloud-offline-outline'
  if (erro instanceof ApiError && erro.kind === 'timeout') return 'time-outline'
  return 'alert-circle-outline'
}

/** Estado de erro reutilizável: ícone + mensagem amigável + botão "Tentar novamente". */
export function EstadoErro({ erro, aTentar, onTentarNovamente }: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name={icone(erro)} size={40} color={colors.muted} />
      <Text style={styles.texto}>{mensagemAmigavel(erro)}</Text>
      <TouchableOpacity style={styles.botao} onPress={onTentarNovamente} disabled={aTentar}>
        <Text style={styles.botaoTexto}>{aTentar ? 'A tentar…' : 'Tentar novamente'}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  texto: { color: colors.muted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  botao: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 22,
    paddingVertical: 11,
    marginTop: 4,
  },
  botaoTexto: { color: '#fff', fontWeight: '700', fontSize: 14 },
})
