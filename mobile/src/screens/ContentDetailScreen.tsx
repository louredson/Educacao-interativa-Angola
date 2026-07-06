import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useVideoPlayer, VideoView } from 'expo-video'

import {
  addToPlaylist,
  createComment,
  deleteComment,
  getPlaylist,
  getUserContentState,
  isYouTubeUrl,
  likeComment,
  listComments,
  MOTIVOS_DENUNCIA,
  parseEpisodios,
  reactToContent,
  registerContentView,
  removeFromPlaylist,
  reportComment,
  reportContent,
  requestContentAccess,
  resolveContentMedia,
  saveContent,
  updateComment,
  type AccessInfo,
  type ComentarioRaw,
  type PodcastEpisodeRaw,
  type ReportInfo,
} from '../services/contentService'
import { registarNoHistorico } from '../services/historyService'
import { useAuth } from '../contexts/AuthContext'
import { colors } from '../theme/colors'
import { mensagemAmigavel } from '../components/EstadoErro'
import UserAvatar from '../components/UserAvatar'
import EpisodioPlayer from '../components/EpisodioPlayer'
import type { AppStackParamList } from '../navigation'

type Props = NativeStackScreenProps<AppStackParamList, 'ContentDetail'>

const TIPO_LABEL: Record<string, string> = {
  video: 'Vídeo',
  texto_normal: 'Texto',
  texto_jindungo: 'Texto com Jindungo',
  podcast: 'Podcast',
}

// Conversão simples de HTML (guardado pelo editor da web) para texto legível.
// Não faz rendering rico (negrito/listas) — apenas garante que o conteúdo é
// legível no telemóvel sem precisar de uma WebView.
function textoLegivel(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// Os comentários vêm em árvore (respostas dentro de `replies`). Estas funções
// aplicam uma alteração a um comentário específico em qualquer nível da árvore,
// sem precisar de recarregar tudo do servidor.
function atualizarTextoComentario(lista: ComentarioRaw[], id: string, novoTexto: string): ComentarioRaw[] {
  return lista.map((c) =>
    c.id === id
      ? { ...c, text: novoTexto }
      : { ...c, replies: c.replies ? atualizarTextoComentario(c.replies, id, novoTexto) : c.replies },
  )
}

function removerComentario(lista: ComentarioRaw[], id: string): ComentarioRaw[] {
  return lista
    .filter((c) => c.id !== id)
    .map((c) => ({ ...c, replies: c.replies ? removerComentario(c.replies, id) : c.replies }))
}

function atualizarLikeComentario(lista: ComentarioRaw[], id: string, gostado: boolean): ComentarioRaw[] {
  return lista.map((c) => {
    if (c.id === id) {
      return { ...c, likedByCurrentUser: gostado, likes: c.likes + (gostado ? 1 : -1) }
    }
    return { ...c, replies: c.replies ? atualizarLikeComentario(c.replies, id, gostado) : c.replies }
  })
}

function VideoBloco({ url }: { url: string }) {
  const player = useVideoPlayer(url, (p) => {
    p.loop = false
  })
  return <VideoView player={player} style={styles.video} nativeControls contentFit="contain" />
}

interface ComentarioLinhaProps {
  comentario: ComentarioRaw
  nivel: number
  isAuthenticated: boolean
  onResponder: (id: string, autor: string) => void
  onGostar: (comentario: ComentarioRaw) => void
  onEditar: (comentario: ComentarioRaw) => void
  onEliminar: (comentario: ComentarioRaw) => void
  onDenunciar: (comentario: ComentarioRaw) => void
}

function ComentarioLinha({
  comentario, nivel, isAuthenticated, onResponder, onGostar, onEditar, onEliminar, onDenunciar,
}: ComentarioLinhaProps) {
  return (
    <View style={[styles.comentario, nivel > 0 && styles.comentarioResposta]}>
      <UserAvatar avatarUrl={comentario.avatarUrl} nome={comentario.author} size={32} />
      <View style={styles.flex}>
        {/* Tal como no botão de três pontos da web (visível ao passar o cursor),
            aqui a opção de denunciar aparece ao premir e segurar o comentário —
            só para comentários de outras pessoas, não os teus próprios. */}
        <TouchableOpacity
          activeOpacity={0.85}
          onLongPress={() => {
            if (!comentario.createdByCurrentUser) onDenunciar(comentario)
          }}
          delayLongPress={400}
          style={styles.comentarioBalao}
        >
          <Text style={styles.comentarioAutor}>{comentario.author}</Text>
          <Text style={styles.comentarioTexto}>{comentario.text}</Text>
        </TouchableOpacity>
        <View style={styles.comentarioAcoes}>
          <Text style={styles.comentarioTempo}>{comentario.time}</Text>
          <TouchableOpacity onPress={() => onGostar(comentario)} style={styles.comentarioAcaoBtn}>
            <Ionicons
              name={comentario.likedByCurrentUser ? 'heart' : 'heart-outline'}
              size={13}
              color={comentario.likedByCurrentUser ? colors.danger : colors.muted}
            />
            <Text style={styles.comentarioAcaoTexto}>{comentario.likes || ''}</Text>
          </TouchableOpacity>
          {isAuthenticated && nivel === 0 && (
            <TouchableOpacity onPress={() => onResponder(comentario.id, comentario.author)}>
              <Text style={styles.comentarioAcaoTexto}>Responder</Text>
            </TouchableOpacity>
          )}
          {comentario.createdByCurrentUser ? (
            <>
              <TouchableOpacity onPress={() => onEditar(comentario)}>
                <Text style={styles.comentarioAcaoTexto}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onEliminar(comentario)}>
                <Text style={[styles.comentarioAcaoTexto, { color: colors.danger }]}>Eliminar</Text>
              </TouchableOpacity>
            </>
          ) : (
            isAuthenticated && (
              <TouchableOpacity onPress={() => onDenunciar(comentario)}>
                <Text style={styles.comentarioAcaoTexto}>Denunciar</Text>
              </TouchableOpacity>
            )
          )}
        </View>

        {(comentario.replies ?? []).map((resposta) => (
          <ComentarioLinha
            key={resposta.id}
            comentario={resposta}
            nivel={nivel + 1}
            isAuthenticated={isAuthenticated}
            onResponder={onResponder}
            onGostar={onGostar}
            onEditar={onEditar}
            onEliminar={onEliminar}
            onDenunciar={onDenunciar}
          />
        ))}
      </View>
    </View>
  )
}

export function ContentDetailScreen({ route, navigation }: Props) {
  const { conteudo } = route.params
  const { user, isAuthenticated } = useAuth()

  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [likesCount, setLikesCount] = useState(conteudo.likes)
  const [acesso, setAcesso] = useState<AccessInfo | undefined>(undefined)
  const [carregandoEstado, setCarregandoEstado] = useState(true)
  const [motivo, setMotivo] = useState('')
  const [aSolicitar, setASolicitar] = useState(false)
  const [erroAcesso, setErroAcesso] = useState('')
  const [episodioAtivo, setEpisodioAtivo] = useState<PodcastEpisodeRaw | null>(null)
  const [naPlaylist, setNaPlaylist] = useState<Record<string, boolean>>({})

  const [comentarios, setComentarios] = useState<ComentarioRaw[]>([])
  const [aCarregarComentarios, setACarregarComentarios] = useState(true)
  const [novoComentario, setNovoComentario] = useState('')
  const [aComentar, setAComentar] = useState(false)
  const [respondendoA, setRespondendoA] = useState<{ id: string; autor: string } | null>(null)
  const [textoResposta, setTextoResposta] = useState('')
  const [editando, setEditando] = useState<ComentarioRaw | null>(null)
  const [textoEdicao, setTextoEdicao] = useState('')
  const [erroComentario, setErroComentario] = useState('')

  const [reportInfo, setReportInfo] = useState<ReportInfo | undefined>(undefined)
  const [showReportModal, setShowReportModal] = useState(false)
  const [motivoDenuncia, setMotivoDenuncia] = useState('')
  const [descricaoDenuncia, setDescricaoDenuncia] = useState('')
  const [aDenunciar, setADenunciar] = useState(false)
  const [erroDenuncia, setErroDenuncia] = useState('')

  useEffect(() => {
    const titulo = conteudo.titulo.length > 28 ? `${conteudo.titulo.slice(0, 28)}…` : conteudo.titulo
    navigation.setOptions({ title: titulo })
  }, [conteudo.titulo, navigation])

  useEffect(() => {
    registerContentView(conteudo.id).catch(() => null)
    registarNoHistorico(conteudo).catch(() => null)
  }, [conteudo.id])

  useEffect(() => {
    let ativo = true
    ;(async () => {
      setACarregarComentarios(true)
      try {
        const res = await listComments(conteudo.id)
        if (ativo) setComentarios(res.comentarios ?? [])
      } catch {
        if (ativo) setComentarios([])
      } finally {
        if (ativo) setACarregarComentarios(false)
      }
    })()
    return () => {
      ativo = false
    }
  }, [conteudo.id])

  useEffect(() => {
    if (conteudo.tipo !== 'podcast' || !isAuthenticated) return
    let ativo = true
    ;(async () => {
      try {
        const res = await getPlaylist()
        if (!ativo) return
        const marcados: Record<string, boolean> = {}
        Object.values(res.playlistItems ?? {}).forEach((item) => {
          if (item.podcastContentId === String(conteudo.id)) marcados[item.episodeId] = true
        })
        setNaPlaylist(marcados)
      } catch {
        /* sem sessão ou sem ligação — fica sem estado de playlist */
      }
    })()
    return () => {
      ativo = false
    }
  }, [conteudo.id, conteudo.tipo, isAuthenticated])

  async function enviarComentario() {
    if (!isAuthenticated) {
      navigation.navigate('Login')
      return
    }
    if (!novoComentario.trim()) return
    setErroComentario('')
    setAComentar(true)
    try {
      const res = await createComment(conteudo.id, novoComentario.trim())
      setComentarios(res.comentarios ?? [])
      setNovoComentario('')
    } catch (e) {
      setErroComentario(mensagemAmigavel(e))
    } finally {
      setAComentar(false)
    }
  }

  async function enviarResposta() {
    if (!respondendoA || !textoResposta.trim()) return
    setErroComentario('')
    setAComentar(true)
    try {
      const res = await createComment(conteudo.id, textoResposta.trim(), Number(respondendoA.id))
      setComentarios(res.comentarios ?? [])
      setTextoResposta('')
      setRespondendoA(null)
    } catch (e) {
      setErroComentario(mensagemAmigavel(e))
    } finally {
      setAComentar(false)
    }
  }

  async function guardarEdicao() {
    if (!editando || !textoEdicao.trim()) return
    setAComentar(true)
    try {
      await updateComment(Number(editando.id), textoEdicao.trim())
      setComentarios((prev) => atualizarTextoComentario(prev, editando.id, textoEdicao.trim()))
      setEditando(null)
      setTextoEdicao('')
    } catch (e) {
      setErroComentario(mensagemAmigavel(e))
    } finally {
      setAComentar(false)
    }
  }

  function pedirConfirmacaoEliminar(comentario: ComentarioRaw) {
    Alert.alert('Eliminar comentário', 'Tens a certeza que queres eliminar este comentário?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteComment(Number(comentario.id))
            setComentarios((prev) => removerComentario(prev, comentario.id))
          } catch (e) {
            Alert.alert('Não foi possível eliminar', mensagemAmigavel(e))
          }
        },
      },
    ])
  }

  function pedirConfirmacaoDenuncia(comentario: ComentarioRaw) {
    Alert.alert(
      'Denunciar comentário',
      `Queres denunciar este comentário de ${comentario.author} como ofensivo ou impróprio?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Denunciar',
          style: 'destructive',
          onPress: async () => {
            try {
              await reportComment(Number(comentario.id))
              Alert.alert('Denunciado', 'Obrigado — a nossa equipa vai analisar este comentário.')
            } catch (e) {
              Alert.alert('Não foi possível denunciar', mensagemAmigavel(e))
            }
          },
        },
      ],
    )
  }

  async function alternarGostoComentario(comentario: ComentarioRaw) {
    if (!isAuthenticated) {
      navigation.navigate('Login')
      return
    }
    const novoEstado = !comentario.likedByCurrentUser
    setComentarios((prev) => atualizarLikeComentario(prev, comentario.id, novoEstado))
    try {
      await likeComment(Number(comentario.id), novoEstado)
    } catch {
      setComentarios((prev) => atualizarLikeComentario(prev, comentario.id, !novoEstado))
    }
  }

  useEffect(() => {
    let ativo = true
    ;(async () => {
      try {
        const estado = await getUserContentState()
        if (!ativo) return
        setLiked(!!estado.likedContents?.[String(conteudo.id)])
        setSaved(!!estado.savedContents?.[String(conteudo.id)])
        setAcesso(estado.accessRequested?.[String(conteudo.id)])
        setReportInfo(estado.reportedContents?.[String(conteudo.id)])
      } catch {
        /* anónimo ou sem ligação — sem estado pessoal, não é um erro a mostrar */
      } finally {
        if (ativo) setCarregandoEstado(false)
      }
    })()
    return () => {
      ativo = false
    }
  }, [conteudo.id])

  const ehCriador = !!user && conteudo.publicado_por === user.id
  const ehJindungo = conteudo.tipo === 'texto_jindungo'
  const podeVerTexto = !ehJindungo || acesso?.status === 'aprovado' || ehCriador || !!user?.isProfessorOuAdmin

  async function alternarLike() {
    if (!isAuthenticated) {
      navigation.navigate('Login')
      return
    }
    const novo = !liked
    setLiked(novo)
    setLikesCount((n) => n + (novo ? 1 : -1))
    try {
      await reactToContent(conteudo.id, novo ? 'like' : null)
    } catch {
      setLiked(!novo)
      setLikesCount((n) => n + (novo ? -1 : 1))
    }
  }

  async function alternarGuardar() {
    if (!isAuthenticated) {
      navigation.navigate('Login')
      return
    }
    const novo = !saved
    setSaved(novo)
    try {
      await saveContent(conteudo.id, novo)
    } catch {
      setSaved(!novo)
    }
  }

  async function pedirAcesso() {
    if (!isAuthenticated) {
      navigation.navigate('Login')
      return
    }
    setErroAcesso('')
    setASolicitar(true)
    try {
      const res = await requestContentAccess(conteudo.id, motivo.trim())
      setAcesso(res.accessRequest)
    } catch (e) {
      setErroAcesso(mensagemAmigavel(e))
    } finally {
      setASolicitar(false)
    }
  }

  async function alternarPlaylist(ep: PodcastEpisodeRaw) {
    if (!isAuthenticated) {
      navigation.navigate('Login')
      return
    }
    const jaGuardado = !!naPlaylist[ep.id]
    setNaPlaylist((prev) => ({ ...prev, [ep.id]: !jaGuardado }))
    try {
      if (jaGuardado) {
        await removeFromPlaylist(conteudo.id, ep.id)
      } else {
        await addToPlaylist({
          episodeId: ep.id,
          podcastContentId: String(conteudo.id),
          episodeTitle: ep.title,
          podcastTitle: conteudo.titulo,
          duration: ep.duration,
          date: ep.date,
          podcastAuthor: conteudo.apresentador ?? undefined,
          podcastThumbnail: conteudo.imagem_filename ?? undefined,
          audioUrl: ep.audioUrl,
        })
      }
    } catch {
      setNaPlaylist((prev) => ({ ...prev, [ep.id]: jaGuardado }))
    }
  }

  async function enviarDenuncia() {
    if (!motivoDenuncia) {
      setErroDenuncia('Escolhe um motivo para a denúncia.')
      return
    }
    setErroDenuncia('')
    setADenunciar(true)
    try {
      const res = await reportContent(conteudo.id, motivoDenuncia, descricaoDenuncia)
      setReportInfo(res.report)
      setShowReportModal(false)
      Alert.alert('Denúncia enviada', 'Obrigado. A nossa equipa vai analisar este conteúdo.')
    } catch (e) {
      setErroDenuncia(mensagemAmigavel(e))
    } finally {
      setADenunciar(false)
    }
  }

  const thumbnail = resolveContentMedia(conteudo.imagem_filename)
  const rawVideoUrl = conteudo.url_recurso || conteudo.video_filename || undefined
  const ehYouTube = isYouTubeUrl(rawVideoUrl)
  const videoUrl = !ehYouTube ? resolveContentMedia(rawVideoUrl) : undefined
  const episodios = conteudo.tipo === 'podcast' ? parseEpisodios(conteudo.conteudo_completo) : []

  return (
    <>
    <ScrollView style={styles.flex} contentContainerStyle={{ paddingBottom: 40 }}>
      {thumbnail ? (
        <Image source={{ uri: thumbnail }} style={styles.hero} />
      ) : (
        <View style={[styles.hero, styles.heroFallback]}>
          <Ionicons
            name={conteudo.tipo === 'video' ? 'videocam' : conteudo.tipo === 'podcast' ? 'mic' : 'document-text'}
            size={48}
            color="#fff"
          />
        </View>
      )}

      <View style={styles.corpo}>
        <View style={styles.badge}>
          <Text style={styles.badgeTexto}>{TIPO_LABEL[conteudo.tipo] ?? conteudo.tipo}</Text>
        </View>
        <Text style={styles.titulo}>{conteudo.titulo}</Text>
        <View style={styles.autorLinha}>
          <UserAvatar avatarUrl={conteudo.autor_avatar} nome={conteudo.autor_nome} size={22} />
          <Text style={styles.autorNome}>{conteudo.autor_nome || 'Utilizador'}</Text>
        </View>
        <View style={styles.metaLinha}>
          {conteudo.apresentador ? <Text style={styles.meta}>{conteudo.apresentador}</Text> : null}
          {conteudo.publicado_em ? (
            <Text style={styles.meta}>
              {conteudo.apresentador ? '· ' : ''}
              {new Date(conteudo.publicado_em).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })}
            </Text>
          ) : null}
          <Text style={styles.meta}>· {conteudo.visualizacoes} visualizações</Text>
        </View>

        {conteudo.descricao ? <Text style={styles.descricao}>{conteudo.descricao}</Text> : null}

        {/* ── VÍDEO ───────────────────────────────────────────── */}
        {conteudo.tipo === 'video' && (
          <View style={styles.secaoMidia}>
            {videoUrl ? (
              <VideoBloco url={videoUrl} />
            ) : ehYouTube && rawVideoUrl ? (
              <TouchableOpacity style={styles.youtubeBtn} onPress={() => Linking.openURL(rawVideoUrl)}>
                <Ionicons name="logo-youtube" size={20} color="#fff" />
                <Text style={styles.youtubeBtnTexto}>Abrir vídeo no YouTube</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.vazio}>Vídeo não disponível.</Text>
            )}
          </View>
        )}

        {/* ── PODCAST ─────────────────────────────────────────── */}
        {conteudo.tipo === 'podcast' && (
          <View style={styles.secaoMidia}>
            {episodioAtivo && resolveContentMedia(episodioAtivo.audioUrl) ? (
              <EpisodioPlayer
                key={episodioAtivo.id}
                url={resolveContentMedia(episodioAtivo.audioUrl)!}
                titulo={episodioAtivo.title}
              />
            ) : null}
            {episodios.length === 0 ? (
              <Text style={styles.vazio}>Este podcast ainda não tem episódios.</Text>
            ) : (
              episodios.map((ep, i) => (
                <TouchableOpacity
                  key={ep.id}
                  style={[styles.episodio, episodioAtivo?.id === ep.id && styles.episodioAtivo]}
                  onPress={() => setEpisodioAtivo(ep)}
                >
                  <View style={styles.episodioIndice}>
                    <Text style={styles.episodioIndiceTexto}>{i + 1}</Text>
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.episodioTitulo} numberOfLines={1}>{ep.title}</Text>
                    {ep.duration ? <Text style={styles.episodioMeta}>{ep.duration}</Text> : null}
                  </View>
                  <TouchableOpacity
                    onPress={() => alternarPlaylist(ep)}
                    hitSlop={8}
                    style={{ marginRight: 4 }}
                  >
                    <Ionicons
                      name={naPlaylist[ep.id] ? 'bookmark' : 'bookmark-outline'}
                      size={19}
                      color={naPlaylist[ep.id] ? colors.primary : colors.muted}
                    />
                  </TouchableOpacity>
                  <Ionicons
                    name={episodioAtivo?.id === ep.id ? 'volume-high' : 'play-circle-outline'}
                    size={22}
                    color={episodioAtivo?.id === ep.id ? colors.primary : colors.muted}
                  />
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* ── TEXTO / JINDUNGO ────────────────────────────────── */}
        {(conteudo.tipo === 'texto_normal' || conteudo.tipo === 'texto_jindungo') && (
          <View style={styles.secaoMidia}>
            {carregandoEstado ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
            ) : podeVerTexto ? (
              conteudo.conteudo_completo ? (
                <Text style={styles.corpoTexto}>{textoLegivel(conteudo.conteudo_completo)}</Text>
              ) : (
                <Text style={styles.vazio}>Este conteúdo ainda não tem texto completo.</Text>
              )
            ) : (
              <View style={styles.trancado}>
                <Ionicons name="flame" size={28} color="#B45309" />
                <Text style={styles.trancadoTitulo}>Texto com Jindungo</Text>
                <Text style={styles.trancadoTexto}>
                  Este é um conteúdo exclusivo. O acesso é avaliado por quem o publicou.
                </Text>

                {acesso?.status === 'pendente' && (
                  <View style={[styles.statusPill, styles.statusPendente]}>
                    <Ionicons name="time-outline" size={14} color="#92400E" />
                    <Text style={styles.statusPendenteTexto}>Pedido em análise</Text>
                  </View>
                )}

                {acesso?.status === 'rejeitado' && (
                  <View style={[styles.statusPill, styles.statusRejeitado]}>
                    <Ionicons name="close-circle-outline" size={14} color="#991B1B" />
                    <Text style={styles.statusRejeitadoTexto}>
                      Pedido anterior rejeitado{acesso.notes ? `: ${acesso.notes}` : ''}
                    </Text>
                  </View>
                )}

                {(!acesso || acesso.status === 'rejeitado') && (
                  <View style={styles.formAcesso}>
                    <TextInput
                      style={styles.inputMotivo}
                      placeholder="Explica porque queres aceder a este conteúdo (opcional)"
                      placeholderTextColor={colors.muted}
                      value={motivo}
                      onChangeText={setMotivo}
                      multiline
                    />
                    {erroAcesso ? <Text style={styles.erro}>{erroAcesso}</Text> : null}
                    <TouchableOpacity style={styles.botaoSolicitar} onPress={pedirAcesso} disabled={aSolicitar}>
                      {aSolicitar ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.botaoSolicitarTexto}>Solicitar acesso</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* ── AÇÕES ───────────────────────────────────────────── */}
        <View style={styles.acoes}>
          <TouchableOpacity style={styles.acao} onPress={alternarLike}>
            <Ionicons
              name={liked ? 'thumbs-up' : 'thumbs-up-outline'}
              size={20}
              color={liked ? colors.success : colors.muted}
            />
            <Text style={styles.acaoTexto}>{likesCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.acao} onPress={alternarGuardar}>
            <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={20} color={saved ? colors.primary : colors.muted} />
            <Text style={styles.acaoTexto}>{saved ? 'Guardado' : 'Guardar'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.acao, styles.acaoDenunciar]}
            onPress={() => (reportInfo ? null : setShowReportModal(true))}
            disabled={!!reportInfo}
          >
            <Ionicons name="flag-outline" size={19} color={reportInfo ? colors.muted : colors.danger} />
            <Text style={[styles.acaoTexto, !reportInfo && { color: colors.danger }]}>
              {reportInfo ? 'Denunciado' : 'Denunciar'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── COMENTÁRIOS ─────────────────────────────────────── */}
        {/* Mesma regra do texto: um Jindungo sem acesso aprovado não mostra
            comentários (tal como na web, onde nem chega a abrir o conteúdo). */}
        {(!ehJindungo || podeVerTexto) && (
          <View style={styles.secaoComentarios}>
            <Text style={styles.comentariosTitulo}>Comentários ({comentarios.length})</Text>

            {isAuthenticated ? (
              <View style={styles.novoComentarioBox}>
                <TextInput
                  style={styles.inputComentario}
                  placeholder="Escreve um comentário..."
                  placeholderTextColor={colors.muted}
                  value={novoComentario}
                  onChangeText={setNovoComentario}
                  multiline
                />
                <TouchableOpacity
                  style={[styles.enviarComentarioBtn, !novoComentario.trim() && { opacity: 0.5 }]}
                  onPress={enviarComentario}
                  disabled={aComentar || !novoComentario.trim()}
                >
                  <Ionicons name="send" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.loginParaComentar} onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginParaComentarTexto}>Inicia sessão para comentar</Text>
              </TouchableOpacity>
            )}

            {erroComentario ? <Text style={styles.erroComentarioTexto}>{erroComentario}</Text> : null}

            {aCarregarComentarios ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />
            ) : comentarios.length === 0 ? (
              <Text style={styles.vazioComentarios}>Sê o primeiro a comentar.</Text>
            ) : (
              comentarios.map((c) => (
                <View key={c.id}>
                  <ComentarioLinha
                    comentario={c}
                    nivel={0}
                    isAuthenticated={isAuthenticated}
                    onResponder={(id, autor) => setRespondendoA({ id, autor })}
                    onGostar={alternarGostoComentario}
                    onEditar={(comentario) => {
                      setEditando(comentario)
                      setTextoEdicao(comentario.text)
                    }}
                    onEliminar={pedirConfirmacaoEliminar}
                    onDenunciar={pedirConfirmacaoDenuncia}
                  />

                  {respondendoA?.id === c.id && (
                    <View style={styles.respostaBox}>
                      <TextInput
                        style={styles.inputComentario}
                        placeholder={`Responder a ${respondendoA.autor}...`}
                        placeholderTextColor={colors.muted}
                        value={textoResposta}
                        onChangeText={setTextoResposta}
                        multiline
                        autoFocus
                      />
                      <View style={styles.respostaBotoes}>
                        <TouchableOpacity onPress={() => { setRespondendoA(null); setTextoResposta('') }}>
                          <Text style={styles.cancelarTexto}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.enviarComentarioBtn, !textoResposta.trim() && { opacity: 0.5 }]}
                          onPress={enviarResposta}
                          disabled={aComentar || !textoResposta.trim()}
                        >
                          <Ionicons name="send" size={16} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {editando?.id === c.id && (
                    <View style={styles.respostaBox}>
                      <TextInput
                        style={styles.inputComentario}
                        value={textoEdicao}
                        onChangeText={setTextoEdicao}
                        multiline
                        autoFocus
                      />
                      <View style={styles.respostaBotoes}>
                        <TouchableOpacity onPress={() => { setEditando(null); setTextoEdicao('') }}>
                          <Text style={styles.cancelarTexto}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.enviarComentarioBtn, !textoEdicao.trim() && { opacity: 0.5 }]}
                          onPress={guardarEdicao}
                          disabled={aComentar || !textoEdicao.trim()}
                        >
                          <Text style={styles.guardarEdicaoTexto}>Guardar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}
      </View>
    </ScrollView>

    <Modal visible={showReportModal} transparent animationType="slide" onRequestClose={() => setShowReportModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalFolha}>
          <View style={styles.modalTopo}>
            <Ionicons name="flag" size={18} color={colors.danger} />
            <Text style={styles.modalTitulo}>Denunciar conteúdo</Text>
          </View>
          <Text style={styles.modalSubtitulo}>
            Ajuda-nos a manter a comunidade segura. Por que motivo estás a denunciar?
          </Text>

          {MOTIVOS_DENUNCIA.map((m) => (
            <TouchableOpacity
              key={m.value}
              style={styles.motivoLinha}
              onPress={() => setMotivoDenuncia(m.value)}
            >
              <Ionicons
                name={motivoDenuncia === m.value ? 'radio-button-on' : 'radio-button-off'}
                size={18}
                color={motivoDenuncia === m.value ? colors.primary : colors.muted}
              />
              <Text style={styles.motivoTexto}>{m.label}</Text>
            </TouchableOpacity>
          ))}

          <TextInput
            style={[styles.inputMotivo, { marginTop: 10 }]}
            placeholder="Descrição (opcional)"
            placeholderTextColor={colors.muted}
            value={descricaoDenuncia}
            onChangeText={setDescricaoDenuncia}
            multiline
          />

          {erroDenuncia ? <Text style={styles.erro}>{erroDenuncia}</Text> : null}

          <View style={styles.modalBotoes}>
            <TouchableOpacity onPress={() => setShowReportModal(false)}>
              <Text style={styles.cancelarTexto}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.botaoSolicitar} onPress={enviarDenuncia} disabled={aDenunciar}>
              {aDenunciar ? <ActivityIndicator color="#fff" /> : <Text style={styles.botaoSolicitarTexto}>Enviar denúncia</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  hero: { width: '100%', height: 200 },
  heroFallback: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  corpo: { padding: 18 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FBEAEA',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  badgeTexto: { color: colors.primary, fontSize: 11, fontWeight: '700' },
  titulo: { fontSize: 22, fontWeight: '800', color: colors.text, lineHeight: 28 },
  metaLinha: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 },
  autorLinha: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  autorNome: { fontSize: 14, fontWeight: '700', color: colors.text },
  meta: { fontSize: 12, color: colors.muted },
  descricao: { fontSize: 15, color: colors.text, lineHeight: 22, marginTop: 14 },
  secaoMidia: { marginTop: 20 },
  vazio: { color: colors.muted, fontSize: 13, textAlign: 'center', marginTop: 12 },
  corpoTexto: { fontSize: 15, color: colors.text, lineHeight: 24 },

  video: { width: '100%', aspectRatio: 16 / 9, borderRadius: 12, backgroundColor: '#000' },
  youtubeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF0000',
    borderRadius: 12,
    paddingVertical: 14,
  },
  youtubeBtnTexto: { color: '#fff', fontWeight: '700', fontSize: 14 },

  episodio: {
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
  episodioAtivo: { borderColor: colors.primary },
  episodioIndice: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  episodioIndiceTexto: { fontSize: 12, fontWeight: '700', color: colors.muted },
  episodioTitulo: { fontSize: 14, fontWeight: '600', color: colors.text },
  episodioMeta: { fontSize: 11, color: colors.muted, marginTop: 2 },

  trancado: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  trancadoTitulo: { fontSize: 16, fontWeight: '800', color: '#92400E', marginTop: 8 },
  trancadoTexto: { fontSize: 13, color: '#B45309', textAlign: 'center', marginTop: 6, lineHeight: 19 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, marginTop: 14 },
  statusPendente: { backgroundColor: '#FEF3C7' },
  statusPendenteTexto: { color: '#92400E', fontSize: 12, fontWeight: '700' },
  statusRejeitado: { backgroundColor: '#FEE2E2' },
  statusRejeitadoTexto: { color: '#991B1B', fontSize: 12, fontWeight: '700' },
  formAcesso: { alignSelf: 'stretch', marginTop: 16 },
  inputMotivo: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: colors.text,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  erro: { color: colors.danger, fontSize: 12, marginTop: 8, textAlign: 'center' },
  botaoSolicitar: { backgroundColor: '#B45309', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 10 },
  botaoSolicitarTexto: { color: '#fff', fontWeight: '700', fontSize: 14 },

  acoes: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 26,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  acao: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  acaoTexto: { fontSize: 13, fontWeight: '600', color: colors.text },

  // Comentários
  secaoComentarios: { marginTop: 28, paddingTop: 18, borderTopWidth: 1, borderTopColor: colors.border },
  comentariosTitulo: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 14 },
  novoComentarioBox: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 8 },
  inputComentario: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    maxHeight: 100,
  },
  enviarComentarioBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginParaComentar: {
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  loginParaComentarTexto: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  erroComentarioTexto: { color: colors.danger, fontSize: 12, marginBottom: 8, textAlign: 'center' },
  vazioComentarios: { color: colors.muted, fontSize: 13, textAlign: 'center', marginTop: 16 },

  comentario: { flexDirection: 'row', gap: 10, marginTop: 16 },
  comentarioResposta: { marginTop: 12, marginLeft: 0 },
  comentarioBalao: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    borderTopLeftRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  comentarioAutor: { fontSize: 12.5, fontWeight: '700', color: colors.text, marginBottom: 2 },
  comentarioTexto: { fontSize: 13.5, color: colors.text, lineHeight: 19 },
  comentarioAcoes: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 5, marginLeft: 4 },
  comentarioTempo: { fontSize: 11, color: colors.muted },
  comentarioAcaoBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  comentarioAcaoTexto: { fontSize: 11, color: colors.muted, fontWeight: '600' },

  respostaBox: { marginTop: 10, marginLeft: 42 },
  respostaBotoes: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 14, marginTop: 6 },
  cancelarTexto: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  guardarEdicaoTexto: { color: '#fff', fontWeight: '700', fontSize: 12, paddingHorizontal: 6 },

  acaoDenunciar: { marginLeft: 'auto' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalFolha: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 22,
    maxHeight: '85%',
  },
  modalTopo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  modalTitulo: { fontSize: 17, fontWeight: '800', color: colors.text },
  modalSubtitulo: { fontSize: 13, color: colors.muted, marginBottom: 16, lineHeight: 19 },
  motivoLinha: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 },
  motivoTexto: { fontSize: 14, color: colors.text, flex: 1 },
  modalBotoes: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 18, marginTop: 16 },
})
