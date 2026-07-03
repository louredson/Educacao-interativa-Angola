import React, { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'

import { listNotifications, markAllRead, markRead, type NotificacaoRaw } from '../services/notificationService'
import { responderPedidoAcesso } from '../services/contentService'
import { usarCodigoConvite } from '../services/salaService'
import { colors } from '../theme/colors'
import { EstadoErro } from '../components/EstadoErro'

type Notificacao = NotificacaoRaw
type Resultado = 'aprovado' | 'rejeitado' | 'aceite' | 'erro'

export function NotificationsScreen() {
  const [itens, setItens] = useState<Notificacao[]>([])
  const [naoLidas, setNaoLidas] = useState(0)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<unknown>(null)
  const [aProcessar, setAProcessar] = useState<number | null>(null)
  const [resultados, setResultados] = useState<Record<number, Resultado>>({})

  const carregar = useCallback(async () => {
    setErro(null)
    try {
      const res = await listNotifications()
      setItens(res.notificacoes ?? [])
      setNaoLidas(Number(res.nao_lidas ?? 0))
    } catch (e) {
      setItens([])
      setErro(e)
    } finally {
      setLoading(false)
    }
  }, [])

  // useFocusEffect: re-busca sempre que o ecrã ganha foco, para apanhar
  // notificações novas geradas por ações no sistema (fórum, admin, etc.)
  // desde a última vez que este ecrã esteve aberto.
  useFocusEffect(
    useCallback(() => {
      void carregar()
    }, [carregar]),
  )

  async function marcarTodas() {
    try {
      await markAllRead()
      setItens((prev) => prev.map((n) => ({ ...n, lida: 1 })))
      setNaoLidas(0)
    } catch {
      /* ignora */
    }
  }

  async function marcar(item: Notificacao) {
    if (item.lida) return
    try {
      await markRead(item.id)
      setItens((prev) => prev.map((n) => (n.id === item.id ? { ...n, lida: 1 } : n)))
      setNaoLidas((n) => Math.max(0, n - 1))
    } catch {
      /* ignora */
    }
  }

  async function responderJindungo(item: Notificacao, status: 'aprovado' | 'rejeitado') {
    if (!item.entidade_id || aProcessar) return
    setAProcessar(item.id)
    try {
      await responderPedidoAcesso(item.entidade_id, status)
      setResultados((prev) => ({ ...prev, [item.id]: status }))
      void marcar(item)
    } catch {
      setResultados((prev) => ({ ...prev, [item.id]: 'erro' }))
    } finally {
      setAProcessar(null)
    }
  }

  async function aceitarConvite(item: Notificacao) {
    const codigo = item.link_destino?.match(/codigo=([A-Z0-9]+)/i)?.[1]
    if (!codigo || aProcessar) return
    setAProcessar(item.id)
    try {
      await usarCodigoConvite(codigo)
      setResultados((prev) => ({ ...prev, [item.id]: 'aceite' }))
      void marcar(item)
    } catch {
      setResultados((prev) => ({ ...prev, [item.id]: 'erro' }))
    } finally {
      setAProcessar(null)
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
    return (
      <EstadoErro
        erro={erro}
        onTentarNovamente={() => {
          setLoading(true)
          void carregar()
        }}
      />
    )
  }

  return (
    <View style={styles.flex}>
      {naoLidas > 0 ? (
        <TouchableOpacity style={styles.marcarTodas} onPress={marcarTodas}>
          <Text style={styles.marcarTodasTexto}>Marcar todas como lidas ({naoLidas})</Text>
        </TouchableOpacity>
      ) : null}

      <FlatList
        contentContainerStyle={{ padding: 12 }}
        data={itens}
        keyExtractor={(n) => String(n.id)}
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="notifications-off-outline" size={40} color={colors.muted} />
            <Text style={styles.vazio}>Sem notificações.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const lida = !!item.lida
          const resultado = resultados[item.id]
          const ehPedidoJindungo = item.tipo === 'pedido_acesso_jindungo'
          const ehConvite = item.tipo === 'convite_sala' || item.tipo === 'convite_topico'

          return (
            <TouchableOpacity
              style={[styles.card, !lida && styles.cardNova]}
              onPress={() => marcar(item)}
              activeOpacity={ehPedidoJindungo || ehConvite ? 1 : 0.7}
            >
              {!lida ? <View style={styles.ponto} /> : null}
              <View style={styles.flex}>
                {item.titulo ? <Text style={styles.titulo}>{item.titulo}</Text> : null}
                <Text style={styles.mensagem}>{item.mensagem}</Text>

                {ehPedidoJindungo && (
                  resultado ? (
                    <Text
                      style={[
                        styles.resultadoTexto,
                        resultado === 'aprovado' && { color: colors.success },
                        resultado === 'rejeitado' && { color: colors.muted },
                        resultado === 'erro' && { color: colors.danger },
                      ]}
                    >
                      {resultado === 'aprovado' ? '✓ Acesso aprovado' : resultado === 'rejeitado' ? 'Pedido recusado' : 'Não foi possível processar.'}
                    </Text>
                  ) : (
                    <View style={styles.acoesLinha}>
                      <TouchableOpacity
                        style={styles.botaoAceitar}
                        disabled={aProcessar === item.id}
                        onPress={() => responderJindungo(item, 'aprovado')}
                      >
                        <Text style={styles.botaoAceitarTexto}>Aceitar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.botaoRecusar}
                        disabled={aProcessar === item.id}
                        onPress={() => responderJindungo(item, 'rejeitado')}
                      >
                        <Text style={styles.botaoRecusarTexto}>Recusar</Text>
                      </TouchableOpacity>
                    </View>
                  )
                )}

                {ehConvite && (
                  resultado ? (
                    <Text
                      style={[
                        styles.resultadoTexto,
                        resultado === 'aceite' && { color: colors.success },
                        resultado === 'erro' && { color: colors.danger },
                      ]}
                    >
                      {resultado === 'aceite' ? '✓ Convite aceite' : 'Não foi possível aceitar — pode já ter expirado.'}
                    </Text>
                  ) : (
                    <TouchableOpacity
                      style={styles.botaoAceitar}
                      disabled={aProcessar === item.id}
                      onPress={() => aceitarConvite(item)}
                    >
                      <Text style={styles.botaoAceitarTexto}>Aceitar convite</Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            </TouchableOpacity>
          )
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  vazio: { color: colors.muted, marginTop: 10 },
  marcarTodas: {
    backgroundColor: colors.surface,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  marcarTodasTexto: { color: colors.primary, fontWeight: '700' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 8,
  },
  cardNova: { backgroundColor: '#FFF7F7', borderColor: '#F5D6D6' },
  ponto: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  titulo: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 2 },
  mensagem: { fontSize: 13, color: colors.muted, lineHeight: 19 },
  resultadoTexto: { fontSize: 12, fontWeight: '700', marginTop: 8 },
  acoesLinha: { flexDirection: 'row', gap: 8, marginTop: 10 },
  botaoAceitar: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  botaoAceitarTexto: { color: '#fff', fontWeight: '700', fontSize: 12 },
  botaoRecusar: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  botaoRecusarTexto: { color: colors.muted, fontWeight: '700', fontSize: 12 },
})
