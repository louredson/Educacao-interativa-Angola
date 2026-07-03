import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'

import {
  enviarMensagem,
  getMensagens,
  listSalas,
  usarCodigoConvite,
  type MensagemRaw,
  type SalaRaw,
} from '../services/salaService'
import { useAuth } from '../contexts/AuthContext'
import { colors } from '../theme/colors'
import { EstadoErro, mensagemAmigavel } from '../components/EstadoErro'
import UserAvatar from '../components/UserAvatar'

type Sala = SalaRaw
type Mensagem = MensagemRaw

export function SalasScreen() {
  const { user, isAuthenticated } = useAuth()

  const [salas, setSalas] = useState<Sala[]>([])
  const [loading, setLoading] = useState(true)
  const [erroSalas, setErroSalas] = useState<unknown>(null)
  const [salaAtiva, setSalaAtiva] = useState<Sala | null>(null)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [aCarregarMsg, setACarregarMsg] = useState(false)
  const [erroMensagens, setErroMensagens] = useState<unknown>(null)
  const [texto, setTexto] = useState('')
  const [aEnviar, setAEnviar] = useState(false)
  const [showUsarCodigo, setShowUsarCodigo] = useState(false)
  const [codigo, setCodigo] = useState('')
  const [aUsarCodigo, setAUsarCodigo] = useState(false)
  const [erroMsg, setErroMsg] = useState('')
  const flatRef = useRef<FlatList>(null)

  const carregarSalas = useCallback(async () => {
    if (!isAuthenticated) { setLoading(false); return }
    setLoading(true)
    setErroSalas(null)
    try {
      const data = await listSalas()
      setSalas(data.salas ?? [])
    } catch (e) {
      setSalas([])
      setErroSalas(e)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useFocusEffect(useCallback(() => { carregarSalas() }, [carregarSalas]))

  const abrirSala = async (sala: Sala) => {
    setSalaAtiva(sala)
    setMensagens([])
    setErroMensagens(null)
    setACarregarMsg(true)
    try {
      const data = await getMensagens(sala.id)
      setMensagens((data.mensagens ?? []).reverse())
    } catch (e) {
      setMensagens([])
      setErroMensagens(e)
    } finally {
      setACarregarMsg(false)
    }
  }

  // O backend não tem Socket.IO/WebSocket, por isso o "tempo real" do chat
  // é feito por refresh periódico (polling) enquanto uma sala está aberta —
  // assim, mensagens enviadas a partir da web ou de outro dispositivo
  // aparecem aqui sem precisar de sair e reentrar na sala.
  useEffect(() => {
    if (!salaAtiva) return
    const intervalo = setInterval(async () => {
      try {
        const data = await getMensagens(salaAtiva.id)
        const frescas = (data.mensagens ?? []).reverse()
        setMensagens((prev) => {
          const ultimaPrev = prev[prev.length - 1]?.id
          const ultimaFresca = frescas[frescas.length - 1]?.id
          if (frescas.length === prev.length && ultimaPrev === ultimaFresca) {
            return prev // nada de novo — evita re-render e scroll desnecessários
          }
          setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100)
          return frescas
        })
      } catch {
        /* falha pontual do polling — tenta novamente no próximo intervalo */
      }
    }, 5000)
    return () => clearInterval(intervalo)
  }, [salaAtiva])

  const enviar = async () => {
    if (!texto.trim() || !salaAtiva || aEnviar) return
    setAEnviar(true)
    try {
      const data = await enviarMensagem(salaAtiva.id, texto.trim())
      setMensagens(prev => [...prev, data.mensagem])
      setTexto('')
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100)
    } catch (e) {
      setErroMsg(mensagemAmigavel(e))
    } finally {
      setAEnviar(false)
    }
  }

  const usarCodigo = async () => {
    if (!codigo.trim()) return
    setAUsarCodigo(true)
    try {
      await usarCodigoConvite(codigo.trim().toUpperCase())
      setShowUsarCodigo(false)
      setCodigo('')
      await carregarSalas()
    } catch (e) {
      setErroMsg(mensagemAmigavel(e))
    } finally {
      setAUsarCodigo(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.center}>
        <Ionicons name="lock-closed-outline" size={40} color={colors.muted} />
        <Text style={styles.emptyText}>Inicia sessão para aceder às salas de discussão.</Text>
      </View>
    )
  }

  // Vista de chat dentro de uma sala
  if (salaAtiva) {
    return (
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        {/* Header da sala */}
        <View style={styles.salaHeader}>
          <TouchableOpacity onPress={() => setSalaAtiva(null)} style={{ marginRight: 10 }}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.salaHeaderTitulo} numberOfLines={1}>{salaAtiva.titulo}</Text>
            {salaAtiva.descricao ? <Text style={styles.salaHeaderDesc} numberOfLines={1}>{salaAtiva.descricao}</Text> : null}
          </View>
        </View>

        {aCarregarMsg ? (
          <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
        ) : erroMensagens && mensagens.length === 0 ? (
          <EstadoErro erro={erroMensagens} onTentarNovamente={() => abrirSala(salaAtiva)} />
        ) : (
          <FlatList
            ref={flatRef}
            data={mensagens}
            keyExtractor={m => String(m.id)}
            contentContainerStyle={{ padding: 12, gap: 8 }}
            onLayout={() => flatRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={<Text style={[styles.emptyText, { textAlign: 'center', marginTop: 40 }]}>Sem mensagens ainda. Começa a conversa!</Text>}
            renderItem={({ item }) => {
              const proprio = item.autor_id === user?.id
              return (
                <View style={[styles.linhaMensagem, proprio && styles.linhaMensagemPropria]}>
                  {!proprio && (
                    <UserAvatar avatarUrl={item.autor_avatar} nome={item.autor_nome} size={26} />
                  )}
                  <View style={[styles.bubble, proprio ? styles.bubbleMy : styles.bubbleOther]}>
                    {!proprio && <Text style={styles.bubbleAutor}>{item.autor_nome}</Text>}
                    <Text style={[styles.bubbleText, proprio && { color: '#fff' }]}>{item.mensagem}</Text>
                    <Text style={[styles.bubbleTime, proprio && { color: 'rgba(255,255,255,0.7)' }]}>
                      {new Date(item.criado_em).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
              )
            }}
          />
        )}

        {erroMsg ? <Text style={styles.erro}>{erroMsg}</Text> : null}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={texto}
            onChangeText={setTexto}
            placeholder="Escreve uma mensagem..."
            placeholderTextColor={colors.muted}
            multiline
          />
          <TouchableOpacity onPress={enviar} disabled={aEnviar || !texto.trim()} style={[styles.sendBtn, (!texto.trim() || aEnviar) && { opacity: 0.4 }]}>
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    )
  }

  // Lista de salas
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Salas de Discussão</Text>
        <TouchableOpacity onPress={() => setShowUsarCodigo(true)} style={styles.codeBtn}>
          <Ionicons name="key-outline" size={16} color={colors.primary} />
          <Text style={styles.codeBtnText}>Usar código</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
      ) : erroSalas && salas.length === 0 ? (
        <EstadoErro erro={erroSalas} onTentarNovamente={carregarSalas} />
      ) : salas.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="chatbubbles-outline" size={40} color={colors.muted} />
          <Text style={styles.emptyText}>Ainda não és membro de nenhuma sala.</Text>
          <Text style={[styles.emptyText, { fontSize: 12, marginTop: 4 }]}>Usa um código de convite para entrar.</Text>
        </View>
      ) : (
        <FlatList
          data={salas}
          keyExtractor={s => String(s.id)}
          contentContainerStyle={{ padding: 12, gap: 10 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.salaCard} onPress={() => abrirSala(item)}>
              <View style={styles.salaCardIcon}>
                <Ionicons name="chatbubbles" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.salaCardTitulo}>{item.titulo}</Text>
                {item.descricao ? <Text style={styles.salaCardDesc} numberOfLines={1}>{item.descricao}</Text> : null}
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.muted} />
            </TouchableOpacity>
          )}
        />
      )}

      {/* Modal usar código */}
      <Modal visible={showUsarCodigo} transparent animationType="slide" onRequestClose={() => setShowUsarCodigo(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Usar código de convite</Text>
            <TextInput
              style={styles.codeInput}
              value={codigo}
              onChangeText={t => setCodigo(t.toUpperCase())}
              placeholder="ex: AB3K7MNQ"
              placeholderTextColor={colors.muted}
              autoCapitalize="characters"
              maxLength={12}
            />
            {erroMsg ? <Text style={styles.erro}>{erroMsg}</Text> : null}
            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => { setShowUsarCodigo(false); setCodigo(''); setErroMsg('') }} style={styles.cancelBtn}>
                <Text style={{ color: colors.muted, fontWeight: '600' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={usarCodigo} disabled={aUsarCodigo || !codigo.trim()} style={[styles.confirmBtn, (aUsarCodigo || !codigo.trim()) && { opacity: 0.5 }]}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>{aUsarCodigo ? 'A entrar...' : 'Entrar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText:     { color: colors.muted, fontSize: 14, marginTop: 12, textAlign: 'center' },
  topBar:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f1f1' },
  topBarTitle:   { fontSize: 16, fontWeight: '700', color: colors.text },
  codeBtn:       { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.primary },
  codeBtnText:   { fontSize: 12, color: colors.primary, fontWeight: '600' },
  salaCard:      { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e8e8e8' },
  salaCardIcon:  { width: 40, height: 40, borderRadius: 10, backgroundColor: `${colors.primary}15`, alignItems: 'center', justifyContent: 'center' },
  salaCardTitulo:{ fontSize: 14, fontWeight: '700', color: colors.text },
  salaCardDesc:  { fontSize: 12, color: colors.muted, marginTop: 2 },
  salaHeader:    { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 12 },
  salaHeaderTitulo: { fontSize: 15, fontWeight: '700', color: '#fff' },
  salaHeaderDesc:   { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  linhaMensagem: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, maxWidth: '85%', alignSelf: 'flex-start' },
  linhaMensagemPropria: { alignSelf: 'flex-end' },
  bubble:        { maxWidth: '80%', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
  bubbleMy:      { alignSelf: 'flex-end', backgroundColor: colors.primary },
  bubbleOther:   { alignSelf: 'flex-start', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e8e8e8' },
  bubbleAutor:   { fontSize: 10, fontWeight: '700', color: colors.primary, marginBottom: 2 },
  bubbleText:    { fontSize: 14, color: colors.text },
  bubbleTime:    { fontSize: 9, color: colors.muted, marginTop: 4, alignSelf: 'flex-end' },
  inputRow:      { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 10, borderTopWidth: 1, borderTopColor: '#f1f1f1', backgroundColor: '#fff' },
  input:         { flex: 1, minHeight: 40, maxHeight: 120, backgroundColor: '#f5f5f5', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, fontSize: 14, color: colors.text },
  sendBtn:       { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox:      { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle:    { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 16 },
  codeInput:     { backgroundColor: '#f5f5f5', borderRadius: 10, padding: 14, fontSize: 18, fontWeight: '700', letterSpacing: 3, textAlign: 'center', color: colors.text, marginBottom: 12 },
  modalBtns:     { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn:     { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#e8e8e8', alignItems: 'center' },
  confirmBtn:    { flex: 1, padding: 14, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center' },
  erro:          { color: '#dc2626', fontSize: 12, textAlign: 'center', marginBottom: 8 },
})
