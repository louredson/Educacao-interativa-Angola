import React, { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'

import { criarTopico, listTopicos, votarTopico, type TopicoRaw } from '../services/forumService'
import { useAuth } from '../contexts/AuthContext'
import { colors } from '../theme/colors'
import { EstadoErro } from '../components/EstadoErro'
import UserAvatar from '../components/UserAvatar'
import type { AppStackParamList } from '../navigation'

type Topico = TopicoRaw

export function ForumScreen() {
  const { isAuthenticated } = useAuth()
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>()
  const [itens, setItens] = useState<Topico[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<unknown>(null)
  const [modal, setModal] = useState(false)
  const [novoTitulo, setNovoTitulo] = useState('')
  const [novoConteudo, setNovoConteudo] = useState('')
  const [aCriar, setACriar] = useState(false)

  const carregar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const data = await listTopicos()
      setItens(data ?? [])
    } catch (e) {
      setItens([])
      setErro(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      void carregar()
    }, [carregar]),
  )

  async function like(item: Topico) {
    if (!isAuthenticated) {
      navigation.navigate('Login')
      return
    }
    try {
      const r = await votarTopico(item.id, 1)
      setItens((prev) =>
        prev.map((t) => (t.id === item.id ? { ...t, votos: r.votos, meu_voto: r.meu_voto } : t)),
      )
    } catch {
      /* ignora */
    }
  }

  async function criar() {
    if (!novoTitulo.trim() || !novoConteudo.trim()) return
    setACriar(true)
    try {
      await criarTopico(novoTitulo.trim(), novoConteudo.trim())
      setModal(false)
      setNovoTitulo('')
      setNovoConteudo('')
      await carregar()
    } catch {
      /* ignora */
    } finally {
      setACriar(false)
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
      <FlatList
        contentContainerStyle={{ padding: 12 }}
        data={itens}
        keyExtractor={(i) => String(i.id)}
        ListEmptyComponent={<Text style={styles.vazio}>Ainda não há tópicos. Cria o primeiro!</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ForumTopic', { id: item.id, titulo: item.titulo })}
          >
            <View style={styles.voto}>
              <Text style={[styles.votoNum, item.votos > 0 && { color: colors.success }]}>
                {item.votos}
              </Text>
              <TouchableOpacity
                style={[styles.likeBtn, item.meu_voto === 1 && styles.likeBtnAtivo]}
                onPress={() => like(item)}
              >
                <Ionicons
                  name="thumbs-up"
                  size={16}
                  color={item.meu_voto === 1 ? colors.success : colors.muted}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.flex}>
              <Text style={styles.titulo} numberOfLines={2}>
                {item.titulo}
              </Text>
              <Text style={styles.descricao} numberOfLines={2}>
                {item.descricao}
              </Text>
              <View style={styles.metaLinha}>
                <UserAvatar avatarUrl={item.autor_avatar} nome={item.autor_nome} size={16} />
                <Text style={styles.meta}>{item.autor_nome}</Text>
                <Text style={styles.meta}>· {item.respostas} respostas</Text>
                {item.resolvido ? <Text style={styles.resolvido}>· Resolvido</Text> : null}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      {isAuthenticated ? (
        <TouchableOpacity style={styles.fab} onPress={() => setModal(true)}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      ) : null}

      <Modal visible={modal} animationType="slide" transparent onRequestClose={() => setModal(false)}>
        <View style={styles.modalFundo}>
          <View style={styles.modalCaixa}>
            <Text style={styles.modalTitulo}>Novo tópico</Text>
            <TextInput
              style={styles.input}
              placeholder="Título"
              value={novoTitulo}
              onChangeText={setNovoTitulo}
              placeholderTextColor={colors.muted}
            />
            <TextInput
              style={[styles.input, styles.inputMulti]}
              placeholder="Conteúdo do tópico..."
              value={novoConteudo}
              onChangeText={setNovoConteudo}
              multiline
              placeholderTextColor={colors.muted}
            />
            <View style={styles.modalAcoes}>
              <TouchableOpacity onPress={() => setModal(false)} style={styles.btnCancelar}>
                <Text style={styles.btnCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={criar} style={styles.btnPublicar} disabled={aCriar}>
                <Text style={styles.btnPublicarTexto}>{aCriar ? 'A publicar…' : 'Publicar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  vazio: { textAlign: 'center', color: colors.muted, marginTop: 40 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    gap: 12,
  },
  voto: { alignItems: 'center', justifyContent: 'center', gap: 8, minWidth: 44 },
  votoNum: { fontSize: 14, fontWeight: '700', color: colors.text },
  likeBtn: {
    width: 36,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  likeBtnAtivo: { borderColor: colors.success, backgroundColor: '#E8F7F1' },
  titulo: { fontSize: 15, fontWeight: '700', color: colors.text },
  descricao: { fontSize: 13, color: colors.muted, marginTop: 4 },
  metaLinha: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  meta: { fontSize: 11, color: colors.muted },
  resolvido: { fontSize: 11, color: colors.success, fontWeight: '700' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  modalFundo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCaixa: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitulo: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 14 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    marginBottom: 12,
  },
  inputMulti: { minHeight: 100, textAlignVertical: 'top' },
  modalAcoes: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  btnCancelar: { paddingVertical: 12, paddingHorizontal: 16 },
  btnCancelarTexto: { color: colors.muted, fontWeight: '600' },
  btnPublicar: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  btnPublicarTexto: { color: '#fff', fontWeight: '700' },
})
