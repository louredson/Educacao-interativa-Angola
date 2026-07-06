import React, { useCallback, useState } from 'react'
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'

import { listMyAccessRequests, responderPedidoAcesso, type PedidoAcessoRaw } from '../services/contentService'
import { colors } from '../theme/colors'
import { EstadoErro } from '../components/EstadoErro'

type Filtro = 'pendente' | 'aprovado' | 'rejeitado'

// Ecrã para professores/admin geriram os pedidos de acesso aos "Textos com
// Jindungo" que publicaram: aceitar/recusar pedidos pendentes, e consultar
// o histórico de quem já foi aprovado ou rejeitado.
export function JindungoRequestsScreen() {
  const [pedidos, setPedidos] = useState<PedidoAcessoRaw[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<unknown>(null)
  const [filtro, setFiltro] = useState<Filtro>('pendente')
  const [aResponder, setAResponder] = useState<number | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const res = await listMyAccessRequests()
      setPedidos(res.pedidos ?? [])
    } catch (e) {
      setPedidos([])
      setErro(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(useCallback(() => { void carregar() }, [carregar]))

  async function responder(pedido: PedidoAcessoRaw, status: 'aprovado' | 'rejeitado') {
    setAResponder(pedido.id)
    try {
      await responderPedidoAcesso(pedido.id, status)
      setPedidos((prev) => prev.map((p) => (p.id === pedido.id ? { ...p, status } : p)))
    } catch {
      /* ignora — o item mantém-se no filtro atual */
    } finally {
      setAResponder(null)
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (erro && pedidos.length === 0) {
    return <EstadoErro erro={erro} onTentarNovamente={carregar} />
  }

  const filtrados = pedidos.filter((p) => p.status === filtro)

  return (
    <View style={styles.flex}>
      <View style={styles.filtros}>
        {(['pendente', 'aprovado', 'rejeitado'] as Filtro[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filtroBtn, filtro === f && styles.filtroBtnAtivo]}
            onPress={() => setFiltro(f)}
          >
            <Text style={[styles.filtroTexto, filtro === f && styles.filtroTextoAtivo]}>
              {f === 'pendente' ? 'Pendentes' : f === 'aprovado' ? 'Aprovados' : 'Rejeitados'} (
              {pedidos.filter((p) => p.status === f).length})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        contentContainerStyle={{ padding: 12 }}
        data={filtrados}
        keyExtractor={(p) => String(p.id)}
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="flame-outline" size={40} color={colors.muted} />
            <Text style={styles.vazio}>Nenhum pedido {filtro === 'pendente' ? 'pendente' : filtro === 'aprovado' ? 'aprovado' : 'rejeitado'}.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.nome}>{item.usuario_nome}</Text>
            <Text style={styles.email}>{item.usuario_email}</Text>
            <Text style={styles.conteudo}>
              Conteúdo: <Text style={styles.conteudoTitulo}>{item.conteudo_titulo}</Text>
            </Text>
            {item.motivo ? <Text style={styles.motivo}>"{item.motivo}"</Text> : null}

            {filtro === 'pendente' ? (
              <View style={styles.acoes}>
                <TouchableOpacity
                  style={styles.botaoAceitar}
                  disabled={aResponder === item.id}
                  onPress={() => responder(item, 'aprovado')}
                >
                  <Text style={styles.botaoAceitarTexto}>Aceitar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.botaoRecusar}
                  disabled={aResponder === item.id}
                  onPress={() => responder(item, 'rejeitado')}
                >
                  <Text style={styles.botaoRecusarTexto}>Recusar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.selo, filtro === 'aprovado' ? styles.seloAprovado : styles.seloRejeitado]}>
                <Text style={[styles.seloTexto, filtro === 'aprovado' ? styles.seloTextoAprovado : styles.seloTextoRejeitado]}>
                  {filtro === 'aprovado' ? 'Aprovado' : 'Rejeitado'}
                </Text>
              </View>
            )}
          </View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  vazio: { color: colors.muted, fontSize: 13, textAlign: 'center', marginTop: 12 },
  filtros: { flexDirection: 'row', gap: 8, padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface },
  filtroBtn: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, backgroundColor: colors.background },
  filtroBtnAtivo: { backgroundColor: colors.primary },
  filtroTexto: { fontSize: 11, fontWeight: '700', color: colors.muted },
  filtroTextoAtivo: { color: '#fff' },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  nome: { fontSize: 14, fontWeight: '700', color: colors.text },
  email: { fontSize: 12, color: colors.muted, marginTop: 1 },
  conteudo: { fontSize: 12, color: colors.muted, marginTop: 8 },
  conteudoTitulo: { fontWeight: '700', color: colors.text },
  motivo: { fontSize: 12, color: colors.muted, fontStyle: 'italic', marginTop: 6 },
  acoes: { flexDirection: 'row', gap: 8, marginTop: 12 },
  botaoAceitar: { backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  botaoAceitarTexto: { color: '#fff', fontWeight: '700', fontSize: 12 },
  botaoRecusar: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  botaoRecusarTexto: { color: colors.muted, fontWeight: '700', fontSize: 12 },
  selo: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginTop: 10 },
  seloAprovado: { backgroundColor: '#E8F7F1' },
  seloRejeitado: { backgroundColor: colors.background },
  seloTexto: { fontSize: 11, fontWeight: '700' },
  seloTextoAprovado: { color: colors.success },
  seloTextoRejeitado: { color: colors.muted },
})
