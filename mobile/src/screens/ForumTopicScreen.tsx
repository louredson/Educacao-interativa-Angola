import React, { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'

import { getTopico, responderTopico } from '../services/forumService'
import { useAuth } from '../contexts/AuthContext'
import { colors } from '../theme/colors'
import { EstadoErro } from '../components/EstadoErro'
import UserAvatar from '../components/UserAvatar'
import type { AppStackParamList } from '../navigation'

type Props = NativeStackScreenProps<AppStackParamList, 'ForumTopic'>

interface Resposta {
  id: number
  conteudo: string
  autor_nome: string
  autor_avatar?: string | null
  votos: number
  publicado_em: string
  aceite?: boolean
}
interface Detalhe {
  id: number
  titulo: string
  descricao: string
  autor_nome: string
  autor_avatar?: string | null
  categoria: string | null
  votos: number
  respostas: Resposta[]
  visualizacoes: number
}

export function ForumTopicScreen({ route }: Props) {
  const { id } = route.params
  const { isAuthenticated } = useAuth()
  const [detalhe, setDetalhe] = useState<Detalhe | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<unknown>(null)
  const [texto, setTexto] = useState('')
  const [aEnviar, setAEnviar] = useState(false)

  const carregar = useCallback(async () => {
    setErro(null)
    try {
      const data = await getTopico(id)
      setDetalhe({ ...data, respostas: data.respostas ?? [] })
    } catch (e) {
      setDetalhe(null)
      setErro(e)
    } finally {
      setLoading(false)
    }
  }, [id])

  // useFocusEffect (não useEffect de montagem única): re-busca o tópico sempre
  // que o ecrã volta a ganhar foco, para que respostas/votos feitos noutro
  // dispositivo ou na web apareçam ao voltar a este ecrã.
  useFocusEffect(
    useCallback(() => {
      void carregar()
    }, [carregar]),
  )

  async function responder() {
    if (!texto.trim()) return
    setAEnviar(true)
    try {
      await responderTopico(id, texto.trim())
      setTexto('')
      await carregar()
    } catch {
      /* ignora */
    } finally {
      setAEnviar(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }
  if (!detalhe) {
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
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        contentContainerStyle={{ padding: 16 }}
        data={detalhe.respostas}
        keyExtractor={(r) => String(r.id)}
        ListHeaderComponent={
          <View style={styles.cabecalho}>
            {detalhe.categoria ? <Text style={styles.categoria}>{detalhe.categoria}</Text> : null}
            <Text style={styles.titulo}>{detalhe.titulo}</Text>
            <Text style={styles.corpo}>{detalhe.descricao}</Text>
            <View style={styles.metaLinha}>
              <UserAvatar avatarUrl={detalhe.autor_avatar} nome={detalhe.autor_nome} size={16} />
              <Text style={styles.meta}>{detalhe.autor_nome}</Text>
              <Text style={styles.meta}>· {detalhe.visualizacoes} visualizações</Text>
            </View>
            <Text style={styles.contagem}>
              {detalhe.respostas.length}{' '}
              {detalhe.respostas.length === 1 ? 'resposta' : 'respostas'}
            </Text>
          </View>
        }
        ListEmptyComponent={<Text style={styles.vazio}>Ainda sem respostas. Sê o primeiro!</Text>}
        renderItem={({ item }) => (
          <View style={[styles.resposta, item.aceite && styles.respostaAceite]}>
            <View style={styles.respostaTopo}>
              <UserAvatar avatarUrl={item.autor_avatar} nome={item.autor_nome} size={20} />
              <Text style={styles.respostaAutor}>{item.autor_nome}</Text>
              {item.aceite ? (
                <View style={styles.solucao}>
                  <Ionicons name="checkmark-circle" size={13} color={colors.success} />
                  <Text style={styles.solucaoTexto}>Solução</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.respostaTexto}>{item.conteudo}</Text>
          </View>
        )}
      />

      {isAuthenticated ? (
        <View style={styles.barra}>
          <TextInput
            style={styles.barraInput}
            placeholder="Escreve uma resposta..."
            value={texto}
            onChangeText={setTexto}
            multiline
            placeholderTextColor={colors.muted}
          />
          <TouchableOpacity style={styles.enviar} onPress={responder} disabled={aEnviar}>
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  vazio: { textAlign: 'center', color: colors.muted, marginTop: 30 },
  cabecalho: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 14,
  },
  categoria: { color: colors.primary, fontWeight: '700', fontSize: 12, marginBottom: 6 },
  titulo: { fontSize: 19, fontWeight: '800', color: colors.text },
  corpo: { fontSize: 14, color: colors.text, lineHeight: 21, marginTop: 8 },
  metaLinha: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  meta: { fontSize: 12, color: colors.muted },
  contagem: { fontSize: 13, fontWeight: '700', color: colors.text, marginTop: 14 },
  resposta: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
  },
  respostaAceite: { borderColor: colors.success, borderLeftWidth: 3 },
  respostaTopo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  respostaAutor: { fontSize: 13, fontWeight: '700', color: colors.text },
  solucao: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 'auto' },
  solucaoTexto: { fontSize: 11, color: colors.success, fontWeight: '700' },
  respostaTexto: { fontSize: 14, color: colors.text, lineHeight: 20 },
  barra: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  barraInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxHeight: 100,
    color: colors.text,
  },
  enviar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
