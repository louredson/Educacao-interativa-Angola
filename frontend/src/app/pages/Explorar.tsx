import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Filter,
  BookOpen,
  Clock,
  TrendingUp,
  Globe,
  Landmark,
  Users,
  Loader2,
  Play,
  FileText,
  Headphones,
  Image as ImageIcon,
  Video,
  Mic,
  X,
  Plus,
  Upload,
  Lock,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Share2,
  Flag,
  SkipBack,
  SkipForward,
  Pause,
  Volume2,
  List,
  Edit3,
  Trash2,
  MoreHorizontal,
  Check,
  AlertTriangle,
  Bookmark,
  ArrowLeft,
  ArrowRight,
  Music,
  FileAudio,
  Download,
  ChevronDown,
  Layers,
  History,
  RefreshCcw,
  Flame,
  Maximize2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useParams } from "react-router";
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext';
import AuthPrompt from '../components/AuthPrompt';
import { CommentSection } from './explorar/CommentSection';
import { ContentCard } from './explorar/ContentCard';
import { FullscreenContent } from './explorar/FullscreenContent';
import { PodcastPlayerBar } from './explorar/PodcastPlayerBar';
import { ContentGridSkeleton } from './explorar/ContentGridSkeleton';
import { EmptyState } from './explorar/EmptyState';
import { HistoryModal } from './explorar/HistoryModal';
import { RichTextEditor } from './explorar/RichTextEditor';
import { AccessStatusPanel, ReportActionButton, ReportStatusPanel } from './explorar/StatusPanels';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  SanitizedHtml,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from './explorar/ui';
import type {
  AccessRequestInfo,
  AccessRequestStatus,
  Comment,
  Content,
  PlaylistItem,
  PodcastEpisode,
  ReportInfo,
  ReportStatus,
  Toast,
} from './explorar/types';

// Original Content Images
const cardImages = {
  inflacaoAngola: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  mulheresNegocios: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  comercioColonial: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  economiaMixa: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  doutoresMatumbos: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  independenciaAngola: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  podcastTheme: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
};

const CONTENTS_PER_PAGE = 9;
const EXPLORAR_SCROLL_STORAGE_KEY = "explorar.catalogScroll";

export default function Explorar() {
  // Auth state
  const { user, isAuthenticated, isProfessorOuAdmin } = useAuth();
  const { id: sharedContentId } = useParams();
  const openedSharedContentRef = useRef<string | null>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [authAction, setAuthAction] = useState('');

  const createClientId = (prefix: string) => {
    if (globalThis.crypto?.randomUUID) {
      return `${prefix}-${globalThis.crypto.randomUUID()}`;
    }

    const values = new Uint32Array(4);
    globalThis.crypto?.getRandomValues(values);
    const fallbackId = Array.from(values, (value) => value.toString(16).padStart(8, "0")).join("");
    return `${prefix}-${fallbackId || "local"}`;
  };

  const getCurrentUserName = () => user?.name || user?.nome || "Utilizador";

  const getInitialsFromName = (name: string) => {
    const initials = name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return initials || "U";
  };

  const getCurrentUserInitials = () => getInitialsFromName(getCurrentUserName());

  const formatDateTime = (value?: string | null) => {
    if (!value) return "Ainda sem data";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Data indisponível";
    return date.toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const normalizeAccessState = (rawState: Record<string, AccessRequestInfo | boolean> = {}) =>
    Object.fromEntries(
      Object.entries(rawState).map(([contentId, value]) => [
        contentId,
        value === true
          ? { status: "pendente" as AccessRequestStatus }
          : value,
      ])
    ) as Record<string, AccessRequestInfo>;

  const normalizeReportState = (rawState: Record<string, ReportInfo | boolean> = {}) =>
    Object.fromEntries(
      Object.entries(rawState).map(([contentId, value]) => [
        contentId,
        value === true
          ? { status: "pendente" as ReportStatus }
          : value,
      ])
    ) as Record<string, ReportInfo>;

  const getAccessStatusLabel = (status?: AccessRequestStatus) => {
    if (status === "aprovado") return "Já tens acesso a este conteúdo!";
    if (status === "rejeitado") return "Pedido não aprovado";
    return "Pedido enviado — aguarda a resposta do autor";
  };

  const getReportStatusLabel = (status?: ReportStatus) => {
    if (status === "ignorada") return "Denúncia analisada";
    if (status === "removida") return "Conteúdo removido";
    return "Denúncia registada";
  };

  const getAccessInfo = (contentId: string) => accessRequested[contentId];
  const isAccessApproved = (contentId: string) => getAccessInfo(contentId)?.status === "aprovado";
  const getReportInfo = (contentId: string) => reportedContents[contentId];

  const openReportModal = (content: Content) => {
    if (!isAuthenticated) {
      setAuthAction('denunciar conteúdos');
      setShowAuthPrompt(true);
      return;
    }
    setSelectedContentForReport(content);
    setIsReportModalOpen(true);
  };

  // Navigation & View States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLikingId, setIsLikingId] = useState<string | null>(null);
  const [isSavingId, setIsSavingId] = useState<string | null>(null);
  
  const [isCategorySelectOpen, setIsCategorySelectOpen] = useState(false);
  const [isSortSelectOpen, setIsSortSelectOpen] = useState(false);

  const [commentsByContent, setCommentsByContent] = useState<Record<string, Comment[]>>({});
  const [commentsLoadedByContent, setCommentsLoadedByContent] = useState<Record<string, boolean>>({});

  const getCommentsForContent = (contentId: string) => commentsByContent[contentId] || [];
  const setCommentsForContent = (contentId: string, newComments: Comment[]) => {
    setCommentsByContent(prev => ({ ...prev, [contentId]: newComments }));
  };
  
  const [contents, setContents] = useState<Content[]>([])
  const [isLoadingContents, setIsLoadingContents] = useState<boolean>(false)
  const [contentLoadError, setContentLoadError] = useState<string | null>(null)

  const [likedContents, setLikedContents] = useState<{ [key: string]: boolean }>({});
  const [dislikedContents, setDislikedContents] = useState<{ [key: string]: boolean }>({});
  const [savedContents, setSavedContents] = useState<{ [key: string]: boolean }>({});
  const [accessRequested, setAccessRequested] = useState<Record<string, AccessRequestInfo>>({});
  const [reportedContents, setReportedContents] = useState<Record<string, ReportInfo>>({});
  const [playlistItems, setPlaylistItems] = useState<{ [key: string]: PlaylistItem }>({});
  const [likedComments, setLikedComments] = useState<{ [key: string]: boolean }>({});
  
  const [playingEpisode, setPlayingEpisode] = useState<PodcastEpisode | null>(null);
  const [playingPlaylistKey, setPlayingPlaylistKey] = useState<string | null>(null);
  const [playingPodcastTitle, setPlayingPodcastTitle] = useState("");
  const [playingPodcastThumbnail, setPlayingPodcastThumbnail] = useState("");
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [selectedContentForAccess, setSelectedContentForAccess] = useState<Content | null>(null);
  const [selectedContentForReport, setSelectedContentForReport] = useState<Content | null>(null);
  const [accessReason, setAccessReason] = useState("");
  const [aSubmeterAcesso, setASubmeterAcesso] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modoAdicao, setModoAdicao] = useState<"editor" | "preview">("editor");
  const [addContentSubmitAttempted, setAddContentSubmitAttempted] = useState(false);

  // Painel de pedidos de acesso Jindungo (para o criador)
  const [isAccessRequestsModalOpen, setIsAccessRequestsModalOpen] = useState(false);
  const [accessRequestsList, setAccessRequestsList] = useState<any[]>([]);
  const [isLoadingAccessRequests, setIsLoadingAccessRequests] = useState(false);
  const [respondingRequestId, setRespondingRequestId] = useState<number | null>(null);

  const carregarPedidosAcesso = async () => {
    setIsLoadingAccessRequests(true);
    try {
      const res = await api.get('/content/me/access-requests');
      setAccessRequestsList(res.data.pedidos || []);
    } catch (error) {
      handleAndShowError(error, "Carregar pedidos de acesso");
    } finally {
      setIsLoadingAccessRequests(false);
    }
  };

  const responderPedidoAcesso = async (pedidoId: number, status: 'aprovado' | 'rejeitado', observacoes?: string) => {
    setRespondingRequestId(pedidoId);
    try {
      await api.patch(`/content/access-requests/${pedidoId}`, { status, observacoes: observacoes || null });
      setAccessRequestsList(prev =>
        prev.map(p => p.id === pedidoId ? { ...p, status, respondido_em: new Date().toISOString(), observacoes_resposta: observacoes || null } : p)
      );
      triggerToast(
        status === 'aprovado' ? "✅ Acesso aprovado" : "❌ Acesso rejeitado",
        status === 'aprovado' ? "O utilizador foi notificado e já pode aceder ao conteúdo." : "O pedido foi rejeitado.",
        status === 'aprovado' ? "success" : "info"
      );
    } catch (error) {
      handleAndShowError(error, "Responder pedido");
    } finally {
      setRespondingRequestId(null);
    }
  };

  const [showSavedContents, setShowSavedContents] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [viewedHistory, setViewedHistory] = useState<Content[]>([]);

  const [videoContent, setVideoContent] = useState<Content | null>(null);
  const [fullscreenContent, setFullscreenContent] = useState<Content | null>(null);
  const [textContent, setTextContent] = useState<Content | null>(null);
  const [podcastContent, setPodcastContent] = useState<Content | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "comment" | "content" | "playlistItem";
    id: string;
    contentId?: string;
  } | null>(null);
  
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");

  // Sistema de Toasts Melhorado
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const triggerToast = (title: string, desc: string, type: "success" | "info" | "warning" | "error" = "success", action?: { label: string; onClick: () => void }) => {
    const durations = {
      success: 3500,
      info: 4000,
      warning: 5000,
      error: 6000
    };
    
    const id = createClientId("toast");
    setToasts((prev) => [...prev, { id, title, desc, type, action }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, durations[type]);
  };

  const handleAndShowError = (error: any, context: string) => {
    const errorMessage = error?.message || String(error) || "Erro desconhecido";
    console.error(`[${context}]`, error);
    triggerToast(
      `❌ Erro: ${context}`,
      errorMessage.length > 100 ? errorMessage.substring(0, 100) + "..." : errorMessage,
      "error"
    );
  };

  const [openCommentMenuId, setOpenCommentMenuId] = useState<string | null>(null);
  const [hiddenComments, setHiddenComments] = useState<{ [key: string]: boolean }>({});

  // Resolução de links de imagem externos (ex: Pinterest) colados nos campos
  // de capa — 'capa' é o campo genérico (artigo/jindungo), 'video' é a capa do vídeo.
  const [aResolverImagem, setAResolverImagem] = useState<{ capa?: boolean; video?: boolean }>({});
  const [erroResolverImagem, setErroResolverImagem] = useState<{ capa?: string; video?: string }>({});

  async function resolverImagemExterna(urlColado: string, campo: 'capa' | 'video') {
    const chaveEstado = campo === 'capa' ? 'coverPreviewUrl' : 'videoCoverPreviewUrl';
    const chaveNome = campo === 'capa' ? 'coverImageName' : 'videoCoverImageName';
    const chaveFicheiro = campo === 'capa' ? 'coverImageFile' : 'videoCoverImage';

    setErroResolverImagem(prev => ({ ...prev, [campo]: undefined }));

    if (!urlColado) {
      setNewContent(prev => ({ ...prev, [chaveEstado]: "", [chaveFicheiro]: null, [chaveNome]: "" }));
      return;
    }
    if (!/^https?:\/\//i.test(urlColado)) return;

    // Já é um ficheiro de imagem directo — não precisa de ir ao backend.
    if (/\.(jpe?g|png|webp|gif|avif)(\?.*)?$/i.test(urlColado)) {
      setNewContent(prev => ({ ...prev, [chaveEstado]: urlColado, [chaveFicheiro]: null, [chaveNome]: "Imagem externa" }));
      return;
    }

    setAResolverImagem(prev => ({ ...prev, [campo]: true }));
    try {
      const resposta = await api.get('/content/resolve-image', { params: { url: urlColado } });
      const imageUrl = resposta.data?.imageUrl;
      if (imageUrl) {
        setNewContent(prev => ({ ...prev, [chaveEstado]: imageUrl, [chaveFicheiro]: null, [chaveNome]: "Imagem externa" }));
      }
    } catch (err: any) {
      setErroResolverImagem(prev => ({ ...prev, [campo]: err?.response?.data?.erro || "Não foi possível carregar a imagem desse link." }));
    } finally {
      setAResolverImagem(prev => ({ ...prev, [campo]: false }));
    }
  }

  const [newContent, setNewContent] = useState({
    title: "",
    description: "",
    categories: [] as string[],
    type: "video" as string,
    duration: "",
    thumbnailUrl: "",
    contentBody: "",
    level: "iniciante" as Content["level"],
    episodes: [] as PodcastEpisode[],
    epFormTitle: "",
    epFormDuration: "",
    epFormDesc: "",
    mediaFile: null as File | null,
    mediaFileName: "",
    mediaPreviewUrl: "",
    videoCoverImage: null as File | null,
    videoCoverImageName: "",
    videoCoverPreviewUrl: "",
    coverImageFile: null as File | null,
    coverImageName: "",
    coverPreviewUrl: "",
    newCategoryInput: "",
    newEpisode: {
      title: "",
      duration: "",
      date: "",
      audioFileName: "",
      audioUrl: "",
      description: ""
    }
  });

  const mapApiConteudoToContent = (item: any): Content => {
    const categoryArray = item.categoria ? item.categoria.split(',').map((cat: string) => cat.trim().toLowerCase()) : []
    const imageIcon = item.tipo === 'video'
      ? <Video className="w-16 h-16 text-white" />
      : item.tipo === 'podcast'
      ? <Mic className="w-16 h-16 text-white" />
      : item.tipo === 'texto_jindungo'
      ? <FileText className="w-16 h-16 text-white" />
      : <FileText className="w-16 h-16 text-white" />

    const imageColor = item.tipo === 'video'
      ? 'from-[#800020] via-[#5C0016] to-slate-950'
      : item.tipo === 'podcast'
      ? 'from-violet-600 via-indigo-800 to-slate-950'
      : 'from-emerald-600 via-teal-700 to-slate-950'

    // Episódios de podcast ficam serializados em conteudo_completo como JSON
    let episodes: PodcastEpisode[] | undefined
    if (item.tipo === 'podcast' && item.conteudo_completo) {
      try { episodes = JSON.parse(item.conteudo_completo) } catch { episodes = [] }
    }

    // Suporte a URLs externas (http/https) guardadas directamente nos campos
    const toMediaUrl = (raw: string | null | undefined) =>
      raw ? (/^https?:\/\//.test(raw) ? raw : `/uploads/${raw}`) : undefined

    return {
      id: String(item.id),
      title: item.titulo,
      description: item.descricao || '',
      category: categoryArray.length ? categoryArray : ['geral'],
      type: item.tipo,
      duration: item.duracao || 'N/A',
      level: 'intermediario',
      views: item.visualizacoes || 0,
      rating: 0,
      likes: Number(item.likes || 0),
      commentsCount: Number(item.comentarios ?? item.commentsCount ?? 0),
      // O nome a mostrar é sempre o do utilizador que publicou (autor_nome, via
      // JOIN no backend) — nunca um cargo técnico nem um valor por omissão.
      // 'apresentador' é um campo à parte, só usado para podcasts (locutor).
      author: item.autor_nome || item.apresentador || 'Utilizador',
      authorId: item.publicado_por ?? null,
      authorAvatar: item.autor_avatar ?? null,
      date: item.publicado_em ? new Date(item.publicado_em).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
      tags: [item.tema || item.categoria || 'Angola'],
      requiresAccess: item.tipo === 'texto_jindungo',
      imageColor,
      imageIcon,
      thumbnail: toMediaUrl(item.imagem_filename),
      content: item.tipo === 'podcast' ? (item.descricao || '') : (item.conteudo_completo || item.descricao || ''),
      episodes,
      mediaUrl: item.url_recurso || item.video_filename || undefined,
      videoFile: null,
      videoCoverUrl: toMediaUrl(item.imagem_filename),
      createdByCurrentUser: !!user && item.publicado_por === user.id,
    }
  }

  const carregarConteudos = async () => {
    setIsLoadingContents(true)
    setContentLoadError(null)
    try {
      const response = await api.get('/content')
      const conteudos = response.data.conteudos || []
      setContents(conteudos.map(mapApiConteudoToContent))
    } catch (error: any) {
      console.error('Erro ao carregar conteúdos:', error)
      setContentLoadError(error.response?.data?.erro || error.message || 'Erro desconhecido ao carregar conteúdos.')
    } finally {
      setIsLoadingContents(false)
    }
  }

  useEffect(() => {
    carregarConteudos()
  }, [])

  const carregarEstadoUsuario = async () => {
    if (!isAuthenticated) {
      setLikedContents({});
      setDislikedContents({});
      setSavedContents({});
      setPlaylistItems({});
      setLikedComments({});
      setAccessRequested({});
      setReportedContents({});
      return;
    }

    try {
      const [estadoResponse, playlistResponse] = await Promise.all([
        api.get('/content/me/state'),
        api.get('/content/me/playlist'),
      ]);
      setLikedContents(estadoResponse.data.likedContents || {});
      setDislikedContents(estadoResponse.data.dislikedContents || {});
      setSavedContents(estadoResponse.data.savedContents || {});
      setAccessRequested(normalizeAccessState(estadoResponse.data.accessRequested || {}));
      setReportedContents(normalizeReportState(estadoResponse.data.reportedContents || {}));
      setPlaylistItems(playlistResponse.data.playlistItems || {});
    } catch (error) {
      console.error('Erro ao carregar estado persistido do utilizador:', error);
    }
  };

  useEffect(() => {
    carregarEstadoUsuario();
  }, [isAuthenticated]);

  const [customCategoryLabels, setCustomCategoryLabels] = useState<{ [key: string]: { label: string; icon: any; color: string } }>({});

  // Funções de comentários recursivas
  const handleEditComment = (contentId: string, id: string) => {
    const comments = getCommentsForContent(contentId);
    const updateCommentRecursive = (commentsList: Comment[]): Comment[] => {
      return commentsList.map(c => {
        if (c.id === id) {
          return { ...c, isEditing: true, editText: c.text };
        }
        if (c.replies && c.replies.length > 0) {
          return { ...c, replies: updateCommentRecursive(c.replies) };
        }
        return c;
      });
    };
    setCommentsForContent(contentId, updateCommentRecursive(comments));
  };

  const handleDeleteCommentClick = (contentId: string, id: string) => {
    setDeleteTarget({ type: "comment", id, contentId });
    setIsDeleteModalOpen(true);
  };

  const handleSaveEditComment = async (contentId: string, id: string) => {
    const comments = getCommentsForContent(contentId);
    let nextText = "";
    const updateCommentRecursive = (commentsList: Comment[]): Comment[] => {
      return commentsList.map(c => {
        if (c.id === id) {
          nextText = c.editText || c.text;
          return { ...c, text: c.editText || c.text, isEditing: false, editText: "" };
        }
        if (c.replies && c.replies.length > 0) {
          return { ...c, replies: updateCommentRecursive(c.replies) };
        }
        return c;
      });
    };
    setCommentsForContent(contentId, updateCommentRecursive(comments));
    try {
      await api.patch(`/content/comments/${id}`, { comentario: nextText });
    } catch (error) {
      setCommentsForContent(contentId, comments);
      handleAndShowError(error, "Editar comentário");
      return;
    }
    triggerToast("✏️ Comentário editado", "As suas alterações foram guardadas com sucesso.", "success");
  };

  const handleCancelEditComment = (contentId: string, id: string) => {
    const comments = getCommentsForContent(contentId);
    const updateCommentRecursive = (commentsList: Comment[]): Comment[] => {
      return commentsList.map(c => {
        if (c.id === id) {
          return { ...c, isEditing: false, editText: "" };
        }
        if (c.replies && c.replies.length > 0) {
          return { ...c, replies: updateCommentRecursive(c.replies) };
        }
        return c;
      });
    };
    setCommentsForContent(contentId, updateCommentRecursive(comments));
  };

  const formatAudioTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
    const totalSeconds = Math.floor(seconds);
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const getPlaylistEntries = () => Object.entries(playlistItems) as [string, PlaylistItem][];

  const stopAudioPlayer = () => {
    try {
      audioRef.current?.pause();
      setPlayingEpisode(null);
      setPlayingPlaylistKey(null);
      setPlayingPodcastTitle("");
      setPlayingPodcastThumbnail("");
      setIsAudioPlaying(false);
      setAudioProgress(0);
      setAudioCurrentTime(0);
      setAudioDuration(0);
    } catch (error) {
      handleAndShowError(error, "Parar reprodução de áudio");
    }
  };

  const playPlaylistItem = (key: string, item: PlaylistItem) => {
    try {
      const podcast = contents.find(c => c.id === item.podcastContentId);
      const ep = podcast?.episodes?.find(e => e.id === item.episodeId);
      const audioUrl = ep?.audioUrl || item.audioUrl;

      if (!podcast || !ep) {
        triggerToast("📁 Arquivo não encontrado", "Não foi possível carregar as informações do episódio. Tente novamente.", "warning");
        return;
      }

      if (!audioUrl) {
        triggerToast("🔊 Áudio indisponível", `"${item.episodeTitle}" não tem um arquivo de áudio associado.`, "warning");
        return;
      }

      if (playingPlaylistKey === key) {
        setIsAudioPlaying(prev => !prev);
        return;
      }

      setPlayingEpisode({ ...ep, audioUrl, podcastContentId: podcast.id });
      setPlayingPlaylistKey(key);
      setPlayingPodcastTitle(podcast.title);
      setPlayingPodcastThumbnail(podcast.thumbnail || "");
      setAudioProgress(0);
      setAudioCurrentTime(0);
      setAudioDuration(0);
      setIsAudioPlaying(true);
      triggerToast("🎧 A tocar agora", `"${item.episodeTitle}" - ${podcast.title}`, "success");
    } catch (error) {
      handleAndShowError(error, "Reproduzir episódio da playlist");
    }
  };

  const playAdjacentPlaylistItem = (direction: -1 | 1) => {
    const entries = getPlaylistEntries();
    if (entries.length === 0) return;

    const currentIndex = playingPlaylistKey
      ? entries.findIndex(([key]) => key === playingPlaylistKey)
      : -1;
    const nextIndex = currentIndex === -1
      ? 0
      : (currentIndex + direction + entries.length) % entries.length;
    const [nextKey, nextItem] = entries[nextIndex];
    playPlaylistItem(nextKey, nextItem);
  };

  const seekAudioToPercentage = (percentage: number) => {
    try {
      const audio = audioRef.current;
      if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return;

      const nextProgress = Math.max(0, Math.min(100, percentage));
      audio.currentTime = (nextProgress / 100) * audio.duration;
      setAudioProgress(nextProgress);
      setAudioCurrentTime(audio.currentTime);
    } catch (error) {
      handleAndShowError(error, "Navegar no áudio");
    }
  };

  const resetContentForm = () => {
    setNewContent({
      title: "",
      description: "",
      categories: [],
      type: "video",
      duration: "",
      thumbnailUrl: "",
      contentBody: "",
      level: "iniciante",
      episodes: [],
      epFormTitle: "",
      epFormDuration: "",
      epFormDesc: "",
      mediaFile: null,
      mediaFileName: "",
      mediaPreviewUrl: "",
      videoCoverImage: null,
      videoCoverImageName: "",
      videoCoverPreviewUrl: "",
      coverImageFile: null,
      coverImageName: "",
      coverPreviewUrl: "",
      newCategoryInput: "",
      newEpisode: {
        title: "",
        duration: "",
        date: "",
        audioFileName: "",
        audioUrl: "",
        description: ""
      }
    });
    setEditingContentId(null);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = isMuted;
  }, [isMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isAudioPlaying) {
      const playPromise = audio.play();
      if (playPromise) {
        playPromise.catch((error) => {
          setIsAudioPlaying(false);
          handleAndShowError(error, "Reprodução automática de áudio");
          triggerToast("🔇 Reprodução bloqueada", "Clique no botão de play para iniciar manualmente.", "warning");
        });
      }
    } else {
      audio.pause();
    }
  }, [isAudioPlaying, playingEpisode?.audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setAudioDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    };
    const handleTimeUpdate = () => {
      setAudioCurrentTime(audio.currentTime);
      setAudioProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
    };
    const handleEnded = () => {
      setIsAudioPlaying(false);
      setAudioProgress(100);
      if (getPlaylistEntries().length > 1) {
        playAdjacentPlaylistItem(1);
      }
    };
    const handleError = (e: ErrorEvent) => {
      handleAndShowError(e, "Reprodução de áudio");
      triggerToast("⚠️ Erro no áudio", "Não foi possível reproduzir este episódio. O ficheiro pode estar corrompido.", "error");
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError as any);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError as any);
    };
  }, [playingEpisode?.audioUrl, playingPlaylistKey, playlistItems]);

  const getCategoryLabel = (cat: string) => {
    return categoryLabels[cat]?.label || cat;
  };

  const handleSelectCategory = (cat: string) => {
    if (!newContent.categories.includes(cat)) {
      setNewContent(prev => ({
        ...prev,
        categories: [...prev.categories, cat]
      }));
    }
  };

  const handleAddNewCategory = () => {
    const value = newContent.newCategoryInput.trim();
    if (value) {
      const id = value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-");
      const normalizedValue = value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const categoryAlreadyExists = Object.entries(categoryLabels).some(([catId, cat]) => {
        const normalizedLabel = cat.label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return catId === id || normalizedLabel === normalizedValue;
      });

      if (categoryAlreadyExists) {
        triggerToast("🏷️ Categoria duplicada", `"${value}" já existe na lista. Utilize a categoria existente.`, "warning");
        setNewContent(prev => ({
          ...prev,
          newCategoryInput: ""
        }));
        return;
      }

      setCustomCategoryLabels(prev => ({
        ...prev,
        [id]: { label: value, icon: BookOpen, color: "from-slate-600 to-slate-800" }
      }));
      if (!newContent.categories.includes(id)) {
        setNewContent(prev => ({
          ...prev,
          categories: [...prev.categories, id],
          newCategoryInput: ""
        }));
        triggerToast("✅ Nova categoria criada", `"${value}" foi adicionada à lista de categorias.`, "success");
      } else {
        setNewContent(prev => ({
          ...prev,
          newCategoryInput: ""
        }));
      }
    }
  };

  const handleRemoveCategory = (cat: string) => {
    setNewContent(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c !== cat)
    }));
  };

  const isEpisodeDurationValid = (val: string) => /^\d{2}:\d{2}$/.test(val);
  const isEpisodeDateValid = (val: string) => /^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/.test(val);

  const handleEpisodeDurationChange = (val: string) => {
    if (/^\d{0,2}(:\d{0,2})?$/.test(val)) {
      setNewContent(prev => ({
        ...prev,
        newEpisode: { ...prev.newEpisode, duration: val },
      }));
    }
  };

  const handleEpisodeDateChange = (val: string) => {
    if (/^\d{0,2}(\/\d{0,2})?(\/\d{0,4})?$/.test(val)) {
      setNewContent(prev => ({
        ...prev,
        newEpisode: { ...prev.newEpisode, date: val },
      }));
    }
  };

  type UploadKind = "image" | "video" | "audio";

  const uploadRules: Record<UploadKind, {
    label: string;
    maxSize: number;
    extensions: string[];
    mimeTypes: string[];
  }> = {
    image: {
      label: "imagem",
      maxSize: 5 * 1024 * 1024,
      extensions: ["png", "jpg", "jpeg", "webp"],
      mimeTypes: ["image/png", "image/jpeg", "image/webp"],
    },
    video: {
      label: "vídeo",
      maxSize: 100 * 1024 * 1024,
      extensions: ["mp4", "webm", "mov"],
      mimeTypes: ["video/mp4", "video/webm", "video/quicktime"],
    },
    audio: {
      label: "áudio",
      maxSize: 50 * 1024 * 1024,
      extensions: ["mp3", "wav", "aac", "m4a"],
      mimeTypes: ["audio/mpeg", "audio/wav", "audio/x-wav", "audio/aac", "audio/mp4", "audio/mp4a-latm"],
    },
  };

  const dangerousExtensions = new Set([
    "ade", "adp", "apk", "app", "bat", "bin", "cmd", "com", "cpl", "dll", "dmg", "exe",
    "hta", "ins", "iso", "jar", "js", "jse", "lib", "lnk", "msi", "msp", "mst", "ps1",
    "scr", "sh", "sys", "vb", "vbe", "vbs", "ws", "wsc", "wsf",
  ]);

  const formatBytes = (bytes: number) => {
    const megabytes = bytes / (1024 * 1024);
    return `${megabytes % 1 === 0 ? megabytes.toFixed(0) : megabytes.toFixed(1)}MB`;
  };

  const getFileExtension = (fileName: string) => fileName.split(".").pop()?.toLowerCase() || "";

  const hasDangerousExtension = (fileName: string) => {
    const parts = fileName.toLowerCase().split(".").slice(1);
    return parts.some((part) => dangerousExtensions.has(part));
  };

  const readFileHeader = async (file: File, length = 16) => {
    const buffer = await file.slice(0, length).arrayBuffer();
    return Array.from(new Uint8Array(buffer));
  };

  const hasExecutableSignature = (header: number[]) => {
    const startsWith = (...signature: number[]) => signature.every((byte, index) => header[index] === byte);
    return (
      startsWith(0x4d, 0x5a) || // Windows MZ executable
      startsWith(0x7f, 0x45, 0x4c, 0x46) || // ELF
      startsWith(0xca, 0xfe, 0xba, 0xbe) || // Mach-O universal / Java class
      startsWith(0xfe, 0xed, 0xfa, 0xce) ||
      startsWith(0xfe, 0xed, 0xfa, 0xcf) ||
      startsWith(0xce, 0xfa, 0xed, 0xfe) ||
      startsWith(0xcf, 0xfa, 0xed, 0xfe)
    );
  };

  const matchesExpectedSignature = (kind: UploadKind, extension: string, header: number[]) => {
    const startsWith = (...signature: number[]) => signature.every((byte, index) => header[index] === byte);
    const asciiAt = (start: number, text: string) =>
      text.split("").every((char, index) => header[start + index] === char.charCodeAt(0));

    if (kind === "image") {
      if (extension === "png") return startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
      if (extension === "jpg" || extension === "jpeg") return startsWith(0xff, 0xd8, 0xff);
      if (extension === "webp") return asciiAt(0, "RIFF") && asciiAt(8, "WEBP");
      return false;
    }

    if (kind === "video") {
      if (extension === "webm") return startsWith(0x1a, 0x45, 0xdf, 0xa3);
      if (extension === "mp4" || extension === "mov") return asciiAt(4, "ftyp");
      return false;
    }

    if (kind === "audio") {
      if (extension === "mp3") return asciiAt(0, "ID3") || (header[0] === 0xff && (header[1] & 0xe0) === 0xe0);
      if (extension === "wav") return asciiAt(0, "RIFF") && asciiAt(8, "WAVE");
      if (extension === "aac") return header[0] === 0xff && (header[1] === 0xf1 || header[1] === 0xf9);
      if (extension === "m4a") return asciiAt(4, "ftyp");
      return false;
    }

    return false;
  };

  const validateUploadFile = async (file: File, kind: UploadKind) => {
    const rules = uploadRules[kind];
    const extension = getFileExtension(file.name);
    const mimeType = file.type.toLowerCase();

    if (hasDangerousExtension(file.name)) {
      triggerToast(
        "⚠️ Ficheiro bloqueado",
        "O nome do ficheiro contém uma extensão executável ou potencialmente perigosa.",
        "error"
      );
      return false;
    }

    if (!rules.extensions.includes(extension)) {
      triggerToast(
        "⚠️ Extensão inválida",
        `Envie apenas ${rules.label} nos formatos: ${rules.extensions.join(", ").toUpperCase()}.`,
        "error"
      );
      return false;
    }

    if (file.size > rules.maxSize) {
      triggerToast(
        "⚠️ Ficheiro demasiado grande",
        `O limite para ${rules.label} é ${formatBytes(rules.maxSize)}.`,
        "error"
      );
      return false;
    }

    if (!mimeType || !rules.mimeTypes.includes(mimeType)) {
      triggerToast(
        "⚠️ Tipo MIME inválido",
        `O ficheiro não parece ser um ${rules.label} válido.`,
        "error"
      );
      return false;
    }

    const header = await readFileHeader(file);
    if (hasExecutableSignature(header)) {
      triggerToast(
        "⚠️ Ficheiro perigoso bloqueado",
        "A assinatura do ficheiro indica um executável, mesmo que tenha sido renomeado.",
        "error"
      );
      return false;
    }

    if (!matchesExpectedSignature(kind, extension, header)) {
      triggerToast(
        "⚠️ Conteúdo incompatível",
        "A extensão e o conteúdo real do ficheiro não correspondem.",
        "error"
      );
      return false;
    }

    return true;
  };

  const handleCoverOrMediaFile = async (file: File | null) => {
    if (!file) return;
    try {
      const uploadKind: UploadKind = newContent.type === "video" ? "video" : "image";
      const isValidFile = await validateUploadFile(file, uploadKind);
      if (!isValidFile) return;

      const url = URL.createObjectURL(file);
      if (newContent.type === "video") {
        setNewContent(prev => ({
          ...prev,
          mediaFile: file,
          mediaFileName: file.name,
          mediaPreviewUrl: url
        }));
        triggerToast("🎬 Vídeo carregado", `"${file.name}" - Pronto para pré-visualização.`, "success");
      } else {
        setNewContent(prev => ({
          ...prev,
          coverImageFile: file,
          coverImageName: file.name,
          coverPreviewUrl: url
        }));
        triggerToast("🖼️ Imagem de capa carregada", `"${file.name}" será utilizada como capa.`, "success");
      }
    } catch (error) {
      handleAndShowError(error, "Upload de ficheiro");
    }
  };

  const handleVideoCoverImage = async (file: File | null) => {
    if (!file) return;
    try {
      const isValidFile = await validateUploadFile(file, "image");
      if (!isValidFile) return;

      const url = URL.createObjectURL(file);
      setNewContent(prev => ({
        ...prev,
        videoCoverImage: file,
        videoCoverImageName: file.name,
        videoCoverPreviewUrl: url
      }));
      triggerToast("🎨 Capa do vídeo carregada", `"${file.name}" será utilizada como thumbnail.`, "success");
    } catch (error) {
      handleAndShowError(error, "Upload de capa de vídeo");
    }
  };

  const handleRemoveEpisode = (id: string) => {
    setNewContent(prev => ({
      ...prev,
      episodes: prev.episodes.filter(ep => ep.id !== id)
    }));
    triggerToast("📻 Episódio removido", "O episódio foi retirado do podcast.", "info");
  };

  const handleAudioFile = async (file: File | null) => {
    if (!file) return;
    try {
      const isValidFile = await validateUploadFile(file, "audio");
      if (!isValidFile) return;

      const url = URL.createObjectURL(file);
      setNewContent(prev => ({
        ...prev,
        newEpisode: {
          ...prev.newEpisode,
          audioFileName: file.name,
          audioUrl: url
        }
      }));
      triggerToast("🎵 Áudio carregado", `"${file.name}" - Pronto para ser adicionado ao episódio.`, "success");
    } catch (error) {
      handleAndShowError(error, "Upload de áudio");
    }
  };

  const handleAddEpisode = () => {
    if (!newContent.newEpisode.title) {
      triggerToast("📝 Título em falta", "Por favor, adicione um título para o episódio.", "warning");
      return;
    }
    if (!isEpisodeDurationValid(newContent.newEpisode.duration)) {
      triggerToast("⏱️ Duração inválida", "Use o formato 20:15 (minutos:segundos) para a duração.", "warning");
      return;
    }
    if (newContent.newEpisode.date && !isEpisodeDateValid(newContent.newEpisode.date)) {
      triggerToast("📅 Data inválida", "Use o formato DD/MM/AAAA para a data.", "warning");
      return;
    }
    const newEp = {
      id: createClientId("episode"),
      title: newContent.newEpisode.title,
      duration: newContent.newEpisode.duration,
      description: newContent.newEpisode.description || "",
      date: newContent.newEpisode.date || new Date().toLocaleDateString("pt"),
      audioFileName: newContent.newEpisode.audioFileName,
      audioUrl: newContent.newEpisode.audioUrl
    };
    setNewContent(prev => ({
      ...prev,
      episodes: [...prev.episodes, newEp],
      newEpisode: {
        title: "",
        duration: "",
        date: "",
        audioFileName: "",
        audioUrl: "",
        description: ""
      }
    }));
    triggerToast("➕ Episódio adicionado", `"${newEp.title}" foi incluído no podcast.`, "success");
  };

  const [editingContentId, setEditingContentId] = useState<string | null>(null);

  const updateViews = async (id: string) => {
    // Atualiza o estado local
    setContents(prev => prev.map(c => c.id === id ? { ...c, views: c.views + 1 } : c));
    
    // Registra a visualização no backend
    try {
      await api.post(`/content/${id}/view`);
    } catch (error) {
      console.error('Erro ao registrar visualização:', error);
    }
  };

  const saveCatalogScrollPosition = (contentId: string) => {
    sessionStorage.setItem(
      EXPLORAR_SCROLL_STORAGE_KEY,
      JSON.stringify({
        contentId,
        page: currentPage,
        scrollY: window.scrollY,
      })
    );
  };

  const restoreCatalogScrollPosition = () => {
    const rawState = sessionStorage.getItem(EXPLORAR_SCROLL_STORAGE_KEY);
    if (!rawState) return;

    try {
      const parsedState = JSON.parse(rawState) as { page?: number; scrollY?: number };
      if (parsedState.page && parsedState.page > 0) {
        setCurrentPage(parsedState.page);
      }

      window.setTimeout(() => {
        window.scrollTo({
          top: Math.max(0, parsedState.scrollY || 0),
          behavior: "auto",
        });
      }, 0);
    } catch (error) {
      console.error("Erro ao restaurar posição do catálogo:", error);
    } finally {
      sessionStorage.removeItem(EXPLORAR_SCROLL_STORAGE_KEY);
    }
  };

  const openContent = (content: Content) => {
    if ((content.requiresAccess || content.type === "texto_jindungo") && !isAccessApproved(content.id) && !isProfessorOuAdmin) {
      if (!isAuthenticated) {
        setAuthAction('solicitar acesso a conteúdos premium');
        setShowAuthPrompt(true);
        return;
      }
      setSelectedContentForAccess(content);
      setIsAccessModalOpen(true);
      return;
    }

    saveCatalogScrollPosition(content.id);
    setViewedHistory(prev => [content, ...prev.filter(item => item.id !== content.id)].slice(0, 12));
    updateViews(content.id);
    if (content.type === "video") setVideoContent(content);
    else if (content.type === "texto_normal" || content.type === "texto_jindungo") setTextContent(content);
    else if (content.type === "podcast") setPodcastContent(content);
  };

  useEffect(() => {
    if (!sharedContentId || openedSharedContentRef.current === sharedContentId || contents.length === 0) return;
    const content = contents.find((item) => item.id === sharedContentId);
    if (!content) return;

    openedSharedContentRef.current = sharedContentId;
    openContent(content);
  }, [sharedContentId, contents, accessRequested, isAuthenticated]);

  // Mantém os modals abertos (vídeo/texto/podcast) em sincronia com o número
  // de gostos — sem isto o contador do modal ficava congelado no valor com
  // que o modal foi aberto.
  const syncModalLikes = (id: string, updater: (likes: number) => number) => {
    setVideoContent(prev => (prev && prev.id === id ? { ...prev, likes: updater(prev.likes || 0) } : prev));
    setTextContent(prev => (prev && prev.id === id ? { ...prev, likes: updater(prev.likes || 0) } : prev));
    setPodcastContent(prev => (prev && prev.id === id ? { ...prev, likes: updater(prev.likes || 0) } : prev));
  };

  const handleLike = async (id: string) => {
    // Verificar se o utilizador está autenticado
    if (!isAuthenticated) {
      setAuthAction('dar like em conteúdos');
      setShowAuthPrompt(true);
      return;
    }

    setIsLikingId(id);
    setTimeout(() => setIsLikingId(null), 400);

    const isCurrentlyLiked = likedContents[id];
    const nextLikedContents = { ...likedContents, [id]: !isCurrentlyLiked };
    const nextDislikedContents = { ...dislikedContents, [id]: false };

    setLikedContents(prev => ({ ...prev, [id]: !prev[id] }));
    
    if (dislikedContents[id]) {
      setDislikedContents(prev => ({ ...prev, [id]: false }));
    }

    setContents(prev =>
      prev.map(c => {
        if (c.id === id) {
          const change = isCurrentlyLiked ? -1 : 1;
          return { ...c, likes: Math.max(0, c.likes + change) };
        }
        return c;
      })
    );
    syncModalLikes(id, likes => Math.max(0, likes + (isCurrentlyLiked ? -1 : 1)));

    try {
      const response = await api.post(`/content/${id}/reaction`, {
        tipo: isCurrentlyLiked ? null : 'like',
      });
      setLikedContents(nextLikedContents);
      setDislikedContents(nextDislikedContents);
      setContents(prev =>
        prev.map(c => (c.id === id ? { ...c, likes: Number(response.data.likes ?? c.likes) } : c))
      );
      if (response.data.likes !== undefined) {
        syncModalLikes(id, () => Number(response.data.likes));
      }
    } catch (error) {
      setLikedContents(likedContents);
      setDislikedContents(dislikedContents);
      await carregarConteudos();
      handleAndShowError(error, "Persistir like");
      return;
    }

    if (!isCurrentlyLiked) {
      triggerToast("👍 Gostaste!", "Obrigado pelo teu feedback. Isso ajuda outros utilizadores.", "success");
    } else {
      triggerToast("👎 Gosto removido", "Podes sempre voltar a gostar se mudares de ideias.", "info");
    }
  };

  const handleDislike = async (id: string) => {
    // Verificar se o utilizador está autenticado
    if (!isAuthenticated) {
      setAuthAction('dar dislike em conteúdos');
      setShowAuthPrompt(true);
      return;
    }

    const isCurrentlyDisliked = dislikedContents[id];
    const nextLikedContents = { ...likedContents, [id]: false };
    const nextDislikedContents = { ...dislikedContents, [id]: !isCurrentlyDisliked };

    setDislikedContents(prev => ({ ...prev, [id]: !prev[id] }));
    if (likedContents[id]) {
      setLikedContents(prev => ({ ...prev, [id]: false }));
      setContents(prev =>
        prev.map(c => (c.id === id ? { ...c, likes: Math.max(0, c.likes - 1) } : c))
      );
      syncModalLikes(id, likes => Math.max(0, likes - 1));
    }

    try {
      const response = await api.post(`/content/${id}/reaction`, {
        tipo: isCurrentlyDisliked ? null : 'dislike',
      });
      setLikedContents(nextLikedContents);
      setDislikedContents(nextDislikedContents);
      setContents(prev =>
        prev.map(c => (c.id === id ? { ...c, likes: Number(response.data.likes ?? c.likes) } : c))
      );
      if (response.data.likes !== undefined) {
        syncModalLikes(id, () => Number(response.data.likes));
      }
    } catch (error) {
      setLikedContents(likedContents);
      setDislikedContents(dislikedContents);
      await carregarConteudos();
      handleAndShowError(error, "Persistir dislike");
      return;
    }
    triggerToast("👎 Feedback registado", "Agradecemos a tua opinião para melhorar o conteúdo.", "info");
  };

  const handleSaveToggle = async (id: string, title: string) => {
    // Verificar se o utilizador está autenticado
    if (!isAuthenticated) {
      setAuthAction('guardar conteúdos');
      setShowAuthPrompt(true);
      return;
    }

    setIsSavingId(id);
    setTimeout(() => setIsSavingId(null), 500);

    const isCurrentlySaved = savedContents[id];
    setSavedContents(prev => ({ ...prev, [id]: !prev[id] }));

    try {
      await api.post(`/content/${id}/save`, { saved: !isCurrentlySaved });
    } catch (error) {
      setSavedContents(savedContents);
      handleAndShowError(error, "Persistir favorito");
      return;
    }

    if (!isCurrentlySaved) {
      triggerToast(
        "📚 Guardado na Biblioteca",
        `"${title}" foi adicionado aos teus favoritos. Encontra-o no separador "Guardados".`,
        "success",
        {
          label: "Ver Guardados",
          onClick: () => setShowSavedContents(true)
        }
      );
    } else {
      triggerToast(
        "📖 Removido dos favoritos",
        `"${title}" foi retirado da tua lista de interesse.`,
        "info"
      );
    }
  };

  const getContentShareUrl = (id: string) => {
    // A rota pública de conteúdo é /explorar/:id (ver routes.tsx)
    const contentUrl = new URL(`/explorar/${encodeURIComponent(id)}`, window.location.origin);
    return contentUrl.toString();
  };

  const handleCopyShareLink = async (content: Content) => {
    // Textos com Jindungo são de acesso restrito — não podem ser partilhados
    if (content.type === "texto_jindungo" || content.requiresAccess) {
      triggerToast(
        "🔒 Conteúdo restrito",
        "Os Textos com Jindungo não podem ser partilhados — o acesso é individual e aprovado pelo autor.",
        "error"
      );
      return;
    }

    const shareUrl = getContentShareUrl(content.id);

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("A cópia automática não está disponível neste navegador.");
      }

      await navigator.clipboard.writeText(shareUrl);
      triggerToast(
        "🔗 Link copiado!",
        `O link de "${content.title}" foi copiado: ${shareUrl}`,
        "success"
      );
    } catch (error) {
      handleAndShowError(error, "Copiar link do conteúdo");
    }
  };

  const sanitizeFileName = (name: string) =>
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9-_]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "conteudo";

  const getFileExtensionFromUrl = (url: string) => {
    const cleanPath = url.split("?")[0].split("#")[0];
    const fileName = cleanPath.split("/").pop() || "";
    const extension = getFileExtension(fileName);
    return extension ? `.${extension}` : "";
  };

  const getFileExtensionFromContentType = (contentType: string) => {
    if (contentType.includes("pdf")) return ".pdf";
    if (contentType.includes("png")) return ".png";
    if (contentType.includes("jpeg") || contentType.includes("jpg")) return ".jpg";
    if (contentType.includes("webp")) return ".webp";
    if (contentType.includes("mp4")) return ".mp4";
    if (contentType.includes("webm")) return ".webm";
    if (contentType.includes("mpeg")) return ".mp3";
    if (contentType.includes("wav")) return ".wav";
    if (contentType.includes("text/plain")) return ".txt";
    return "";
  };

  const buildDownloadFileName = (content: Content, blob?: Blob) => {
    const baseName = sanitizeFileName(content.title);
    if (content.mediaFileName) return content.mediaFileName;

    const fileUrl = content.mediaUrl || content.thumbnail || content.videoCoverUrl || "";
    const urlExtension = fileUrl ? getFileExtensionFromUrl(fileUrl) : "";
    const contentTypeExtension = blob ? getFileExtensionFromContentType(blob.type) : "";
    return `${baseName}${urlExtension || contentTypeExtension || ".txt"}`;
  };

  const triggerBrowserDownload = (href: string, filename: string) => {
    const link = document.createElement("a");
    link.href = href;
    link.download = filename;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleDownloadTrigger = async (content: Content, episodeIndex?: number) => {
    try {
      let blob: Blob;
      let filename: string;

      if (content.type === 'texto_normal' || content.type === 'texto_jindungo') {
        // Texto: descarrega conteúdo como ficheiro .txt
        const body = content.content
          ? content.content.replace(/<[^>]*>/g, '') // remove HTML tags
          : content.description;
        const text = `${content.title}\n${'─'.repeat(60)}\n${content.author}  ·  ${content.date}\n\n${body}`;
        blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        filename = `${sanitizeFileName(content.title)}.txt`;

      } else if (content.type === 'podcast') {
        // Podcast: descarrega áudio do episódio (índice 0 por defeito)
        const episodes = content.episodes || [];
        const ep = episodes[episodeIndex ?? 0];
        const audioUrl = ep?.audioUrl;
        if (!audioUrl) {
          triggerToast("⚠️ Sem ficheiro de áudio", "Este episódio não tem ficheiro de áudio disponível para download.", "warning");
          return;
        }
        const response = await fetch(audioUrl);
        if (!response.ok) throw new Error(`Não foi possível descarregar o áudio (${response.status}).`);
        blob = await response.blob();
        const baseName = sanitizeFileName(ep.title || content.title);
        filename = ep.audioFileName || `${baseName}.mp3`;

      } else {
        // Vídeo (ficheiro local): descarrega o recurso
        const fileUrl = content.mediaUrl;
        if (!fileUrl) {
          triggerToast("⚠️ Sem ficheiro", "Este vídeo não tem ficheiro local disponível para download.", "warning");
          return;
        }
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error(`Não foi possível descarregar o vídeo (${response.status}).`);
        blob = await response.blob();
        filename = buildDownloadFileName(content, blob);
      }

      const blobUrl = URL.createObjectURL(blob);
      triggerBrowserDownload(blobUrl, filename);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

      triggerToast(
        "⬇️ Download iniciado",
        `"${content.title}" será guardado na pasta "Transferências" do seu dispositivo.`,
        "info"
      );
    } catch (error) {
      handleAndShowError(error, "Download de conteúdo");
    }
  };

  const isTextModalOpen = !!textContent;
  const setIsTextModalOpen = (open: boolean) => {
    if (!open) {
      setTextContent(null);
      restoreCatalogScrollPosition();
    }
  };

  const isVideoModalOpen = !!videoContent;
  const setIsVideoModalOpen = (open: boolean) => {
    if (!open) {
      setVideoContent(null);
      restoreCatalogScrollPosition();
    }
  };

  const isPodcastModalOpen = !!podcastContent;
  const setIsPodcastModalOpen = (open: boolean) => {
    if (!open) {
      setPodcastContent(null);
      restoreCatalogScrollPosition();
    }
  };

  const [currentEpisode, setCurrentEpisode] = useState<PodcastEpisode | null>(null);
  const playingEpisodeId = playingEpisode?.id;

  const handleAddToPlaylist = async (ep: PodcastEpisode, podcast: Content) => {
    // Verificar se o utilizador está autenticado
    if (!isAuthenticated) {
      setAuthAction('adicionar episódios à playlist');
      setShowAuthPrompt(true);
      return;
    }

    const playlistKey = `${podcast.id}_${ep.id}`;
    if (playlistItems[playlistKey]) {
      setPlaylistItems(prev => {
        const copy = { ...prev };
        delete copy[playlistKey];
        return copy;
      });
      try {
        await api.delete(`/content/me/playlist/${podcast.id}/${encodeURIComponent(ep.id)}`);
      } catch (error) {
        setPlaylistItems(playlistItems);
        handleAndShowError(error, "Remover da playlist");
        return;
      }
      triggerToast("📋 Removido da Playlist", `"${ep.title}" foi retirado da sua playlist.`, "info");
    } else {
      const item: PlaylistItem = {
        episodeId: ep.id,
        podcastContentId: podcast.id,
        episodeTitle: ep.title,
        podcastTitle: podcast.title,
        duration: ep.duration,
        date: ep.date,
        podcastAuthor: podcast.author,
        podcastThumbnail: podcast.thumbnail,
        audioUrl: ep.audioUrl,
        addedAt: new Date().toISOString()
      };
      setPlaylistItems(prev => ({
        ...prev,
        [playlistKey]: item
      }));
      try {
        await api.post('/content/me/playlist', item);
      } catch (error) {
        setPlaylistItems(playlistItems);
        handleAndShowError(error, "Persistir playlist");
        return;
      }
      triggerToast(
        "➕ Adicionado à Playlist",
        `"${ep.title}" foi adicionado. Acede à playlist para ouvir em sequência.`,
        "success",
        {
          label: "Ver Playlist",
          onClick: () => setShowPlaylist(true)
        }
      );
    }
  };

  const handleSave = (id: string, title: string) => handleSaveToggle(id, title);

  const handleReport = async () => {
    // Verificar se o utilizador está autenticado
    if (!isAuthenticated) {
      setAuthAction('denunciar conteúdos');
      setShowAuthPrompt(true);
      return;
    }

    if (!reportReason) {
      triggerToast("⚠️ Selecione um motivo", "Por favor, escolha uma razão para a denúncia antes de enviar.", "warning");
      return;
    }
    if (!selectedContentForReport) {
      triggerToast("⚠️ Conteúdo não selecionado", "Abra o conteúdo novamente antes de enviar a denúncia.", "warning");
      return;
    }
    if (getReportInfo(selectedContentForReport.id)) {
      triggerToast("📢 Denúncia já registada", "A sua denúncia para este conteúdo já está guardada para moderação.", "info");
      setIsReportModalOpen(false);
      setSelectedContentForReport(null);
      setReportReason("");
      setReportDescription("");
      return;
    }

    try {
      const response = await api.post(`/content/${selectedContentForReport.id}/report`, {
        motivo: reportReason,
        descricao: reportDescription,
      });
      setReportedContents(prev => ({
        ...prev,
        [selectedContentForReport.id]: response.data.report || {
          status: "pendente",
          reportedAt: new Date().toISOString(),
          reviewedAt: null,
          reviewedBy: null,
          notes: null,
        },
      }));
    } catch (error) {
      handleAndShowError(error, "Enviar denúncia");
      return;
    }

    triggerToast(
      "📢 Denúncia registada",
      "A equipa de moderação irá analisar o conteúdo em até 48 horas.",
      "info"
    );
    setIsReportModalOpen(false);
    setSelectedContentForReport(null);
    setReportReason("");
    setReportDescription("");
  };

  const triggerAccessRequest = (content: Content) => {
    if (!isAuthenticated) {
      setAuthAction('solicitar acesso a conteúdos premium');
      setShowAuthPrompt(true);
      return;
    }
    setSelectedContentForAccess(content);
    setIsAccessModalOpen(true);
  };

  const submitAccessRequest = async () => {
    if (selectedContentForAccess) {
      setASubmeterAcesso(true);
      try {
        const response = await api.post(`/content/${selectedContentForAccess.id}/access-request`, {
          motivo: accessReason,
        });
        setAccessRequested(prev => ({
          ...prev,
          [selectedContentForAccess.id]: response.data.accessRequest || {
            status: "pendente",
            requestedAt: new Date().toISOString(),
            reviewedAt: null,
            reviewedBy: null,
            notes: null,
          },
        }));
      } catch (error) {
        handleAndShowError(error, "Solicitar acesso");
        setASubmeterAcesso(false);
        return;
      } finally {
        setASubmeterAcesso(false);
      }

      triggerToast(
        "📨 Pedido de acesso enviado!",
        `"${selectedContentForAccess.title}" - Análise em até 48h. Receberá notificação por email.`,
        "success"
      );
    }
    setIsAccessModalOpen(false);
    setSelectedContentForAccess(null);
    setAccessReason("");
  };

  const removePlaylistItem = async (key: string, item: PlaylistItem) => {
    const previousPlaylistItems = playlistItems;

    if (playingPlaylistKey === key) {
      stopAudioPlayer();
    }

    setPlaylistItems(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });

    try {
      await api.delete(`/content/me/playlist/${item.podcastContentId}/${encodeURIComponent(item.episodeId)}`);
      triggerToast("📋 Removido da Playlist", `"${item.episodeTitle}" foi retirado da sua playlist.`, "info");
    } catch (error) {
      setPlaylistItems(previousPlaylistItems);
      handleAndShowError(error, "Remover da playlist");
    }
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === "comment" && deleteTarget.contentId) {
        const currentComments = getCommentsForContent(deleteTarget.contentId);
        await api.delete(`/content/comments/${deleteTarget.id}`);
        const deleteCommentRecursive = (commentsList: Comment[]): Comment[] => {
          return commentsList
            .filter(c => c.id !== deleteTarget.id)
            .map(c => ({
              ...c,
              replies: c.replies ? deleteCommentRecursive(c.replies) : undefined
            }));
        };
        setCommentsForContent(deleteTarget.contentId, deleteCommentRecursive(currentComments));
        triggerToast("🗑️ Comentário eliminado", "O comentário foi removido permanentemente.", "info");
      } else if (deleteTarget.type === "content") {
        await api.delete(`/content/${deleteTarget.id}`);
        setContents(prev => prev.filter(c => c.id !== deleteTarget.id));
        triggerToast("📄 Conteúdo eliminado", "O recurso foi removido da plataforma.", "warning");
      } else if (deleteTarget.type === "playlistItem") {
        const cleanKey = deleteTarget.id;
        const item = playlistItems[cleanKey];
        if (item) {
          await removePlaylistItem(cleanKey, item);
        }
      }
    } catch (error) {
      handleAndShowError(error, "Eliminar item");
    }

    setIsDeleteModalOpen(false);
    setDeleteTarget(null);
  };

  const submitAddContentForm = async () => {
    setAddContentSubmitAttempted(true);

    if (!newContent.title.trim()) {
      triggerToast("📝 Título necessário", "Por favor, adicione um título para o conteúdo.", "warning");
      return;
    }

    try {
      const existingContent = editingContentId ? contents.find(c => c.id === editingContentId) : null;
      const resolvedType = existingContent?.type || (newContent.type === "texto" ? "texto_normal" : newContent.type);
      const today = new Date().toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }).replace(".", "");
      const resolvedThumbnail = resolvedType === "video"
        ? (newContent.videoCoverPreviewUrl || newContent.thumbnailUrl || "")
        : resolvedType === "texto_normal"
          ? (newContent.coverPreviewUrl || newContent.thumbnailUrl || "")
          : (newContent.coverPreviewUrl || newContent.thumbnailUrl || cardImages.doutoresMatumbos);
      const resolvedContentBody = resolvedType === "texto_normal" || resolvedType === "video"
        ? newContent.description
        : (newContent.contentBody || newContent.description || "");

      const payload: Content = {
        id: editingContentId || createClientId("content"),
        title: newContent.title,
        description: newContent.description,
        category: newContent.categories,
        type: resolvedType as Content["type"],
        duration: "",
        level: newContent.level || "iniciante",
        views: editingContentId ? (contents.find(c => c.id === editingContentId)?.views || 0) : 0,
        rating: editingContentId ? (contents.find(c => c.id === editingContentId)?.rating || 5.0) : 5.0,
        likes: editingContentId ? (contents.find(c => c.id === editingContentId)?.likes || 0) : 0,
        commentsCount: editingContentId ? (contents.find(c => c.id === editingContentId)?.commentsCount || 0) : 0,
        author: getCurrentUserName(),
        date: editingContentId ? (contents.find(c => c.id === editingContentId)?.date || today) : today,
        tags: newContent.categories,
        requiresAccess: resolvedType === "texto_jindungo",
        imageColor: resolvedType === "video"
          ? "from-[#800020] to-[#5C0016]"
          : resolvedType === "podcast"
            ? "from-purple-600 to-indigo-800"
            : resolvedType === "texto_jindungo"
              ? "from-amber-600 via-orange-700 to-slate-950"
              : "from-emerald-600 to-teal-800",
        imageIcon: resolvedType === "video"
          ? <Video className="w-16 h-16 text-white" />
          : resolvedType === "podcast"
            ? <Mic className="w-16 h-16 text-white" />
            : <FileText className="w-16 h-16 text-white" />,
        thumbnail: resolvedThumbnail,
        content: resolvedContentBody,
        episodes: resolvedType === "podcast" ? newContent.episodes : undefined,
        createdByCurrentUser: true,
        mediaUrl: resolvedType === "video" ? newContent.mediaPreviewUrl : undefined,
        mediaFileName: resolvedType === "video" ? newContent.mediaFileName : undefined,
        videoFile: resolvedType === "video" ? newContent.mediaFile : undefined,
        videoCoverUrl: resolvedType === "video" ? resolvedThumbnail : undefined,
      };

      // ── Upload de ficheiros para o servidor ────────────────────────────────
      const uploadFicheiro = async (file: File): Promise<string> => {
        const fd = new FormData();
        fd.append('ficheiro', file);
        const res = await api.post('/content/upload', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 5 * 60 * 1000, // 5 min para ficheiros grandes
        });
        return res.data.url as string;
      };

      const isHttpUrl = (u: unknown) =>
        typeof u === 'string' && /^https?:\/\//i.test(u);
      const isServerPath = (u: unknown) =>
        typeof u === 'string' && u.startsWith('/uploads/');
      // URLs externas (ex: YouTube) guardadas directamente — não precisa de prefixo /uploads/
      const toFilenameOrUrl = (url: string) =>
        /^https?:\/\//i.test(url) ? url : url.replace(/^\/uploads\//, '');

      // Helper: extrai o path relativo a /uploads/ para guardar na BD
      const toFilename = (url: string) => url.replace(/^\/uploads\//, '');

      // Upload do ficheiro de vídeo
      let recursoUrl: string | null = (isHttpUrl(newContent.mediaPreviewUrl) || isServerPath(newContent.mediaPreviewUrl))
        ? newContent.mediaPreviewUrl
        : null;
      if (!recursoUrl && newContent.mediaFile) {
        recursoUrl = await uploadFicheiro(newContent.mediaFile);
      }

      // Upload da imagem de capa (vídeo → videoCoverImage; texto/podcast → coverImageFile)
      let imagemFilename: string | null = null;
      if (resolvedType === 'video') {
        if (newContent.videoCoverImage) {
          imagemFilename = toFilenameOrUrl(await uploadFicheiro(newContent.videoCoverImage));
        } else if (isHttpUrl(newContent.videoCoverPreviewUrl) || isServerPath(newContent.videoCoverPreviewUrl)) {
          imagemFilename = toFilenameOrUrl(newContent.videoCoverPreviewUrl);
        }
      } else {
        if (newContent.coverImageFile) {
          imagemFilename = toFilenameOrUrl(await uploadFicheiro(newContent.coverImageFile));
        } else if (isHttpUrl(newContent.coverPreviewUrl) || isServerPath(newContent.coverPreviewUrl)) {
          imagemFilename = toFilenameOrUrl(newContent.coverPreviewUrl);
        }
      }

      // Podcast: faz upload dos áudios dos episódios com blob URL e serializa como JSON
      let episodesComUrl = newContent.episodes;
      if (resolvedType === 'podcast' && newContent.episodes.length > 0) {
        episodesComUrl = await Promise.all(
          newContent.episodes.map(async ep => {
            // Já tem URL de servidor — não precisa de upload
            if (!ep.audioUrl || isHttpUrl(ep.audioUrl) || isServerPath(ep.audioUrl)) return ep;
            // É blob URL: converter para File e fazer upload
            try {
              const blob = await fetch(ep.audioUrl).then(r => r.blob());
              const file = new File([blob], ep.audioFileName || 'audio.mp3', { type: blob.type });
              const serverUrl = await uploadFicheiro(file);
              return { ...ep, audioUrl: serverUrl };
            } catch {
              return ep;
            }
          })
        );
      }

      // Episódios de podcast ficam serializados em conteudo_completo
      const finalContentBody = resolvedType === 'podcast'
        ? JSON.stringify(episodesComUrl)
        : (resolvedContentBody || null);

      const apiPayload = {
        titulo: newContent.title,
        descricao: newContent.description,
        conteudo_completo: finalContentBody,
        tipo: resolvedType,
        categoria: Array.isArray(newContent.categories)
          ? (newContent.categories[0] ?? null)
          : (newContent.categories ?? null),
        url_recurso: recursoUrl,
        imagem_filename: imagemFilename,
      };

      if (editingContentId) {
        await api.put(`/content/${editingContentId}`, apiPayload);
        await carregarConteudos();
        triggerToast("✏️ Conteúdo atualizado", `"${newContent.title}" foi editado com sucesso.`, "success");
      } else {
        await api.post('/content', apiPayload);
        await carregarConteudos();
        setSortBy("recent");
        triggerToast(
          "✨ Conteúdo publicado!",
          `"${newContent.title}" já está disponível para a comunidade. Encontra-o nos resultados recentes.`,
          "success",
          {
            label: "Ver agora",
            onClick: () => {
              setSearchQuery("");
              setSelectedCategory("all");
              setSelectedType("all");
            }
          }
        );
      }

      resetContentForm();
      setAddContentSubmitAttempted(false);
      setIsAddModalOpen(false);
    } catch (error) {
      handleAndShowError(error, "Publicar conteúdo");
    }
  };

  const categoryLabels: { [key: string]: { label: string; icon: any; color: string } } = {
    all: { label: "Todas Categorias", icon: Globe, color: "from-slate-700 to-slate-900" },
    economia: { label: "Economia", icon: TrendingUp, color: "from-amber-600 to-amber-800" },
    historia: { label: "História", icon: Landmark, color: "from-[#800020] to-[#5C0016]" },
    cultura: { label: "Cultura & Tradição", icon: Users, color: "from-emerald-600 to-emerald-800" },
    politica: { label: "Política Pública", icon: Landmark, color: "from-blue-600 to-blue-800" },
    educacao: { label: "Educação", icon: BookOpen, color: "from-pink-600 to-pink-800" },
    saude: { label: "Saúde Social", icon: Globe, color: "from-teal-600 to-teal-800" },
    ...customCategoryLabels
  };
  const selectableCategories = Object.keys(categoryLabels).filter(cat => cat !== "all");

  // Render & Filtering logic
  const normalizeSearchText = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  const getContentSearchIndex = (content: Content) => {
    const categoryText = content.category
      .flatMap((catKey) => [catKey, categoryLabels[catKey]?.label || ""])
      .join(" ");

    const episodeText = content.episodes
      ?.map((episode) => `${episode.title} ${episode.description} ${episode.date} ${episode.duration}`)
      .join(" ") || "";

    return normalizeSearchText([
      content.title,
      content.description,
      content.content || "",
      content.author,
      categoryText,
      content.tags.join(" "),
      episodeText,
    ].join(" "));
  };

  const getFilteredContents = () => {
    let result = contents;

    if (searchQuery.trim() !== "") {
      const q = normalizeSearchText(searchQuery.trim());
      result = result.filter(c => getContentSearchIndex(c).includes(q));
    }

    if (selectedCategory !== "all") {
      result = result.filter(c => c.category.includes(selectedCategory));
    }

    if (selectedType !== "all") {
      result = result.filter(c => c.type === selectedType);
    }

    const getContentOrderValue = (content: Content) => {
      const numericId = Number(content.id);
      return Number.isFinite(numericId) ? numericId : 0;
    };

    if (sortBy === "recent") {
      result = [...result].sort((a, b) => getContentOrderValue(b) - getContentOrderValue(a));
    } else if (sortBy === "popular") {
      result = [...result].sort((a, b) => b.views - a.views);
    } else if (sortBy === "oldest") {
      result = [...result].sort((a, b) => getContentOrderValue(a) - getContentOrderValue(b));
    }

    if (showSavedContents) {
      result = result.filter(c => savedContents[c.id]);
    }

    return result;
  };

  const currentDisplayContents = getFilteredContents();
  const totalPages = Math.max(1, Math.ceil(currentDisplayContents.length / CONTENTS_PER_PAGE));
  const pageStartIndex = (currentPage - 1) * CONTENTS_PER_PAGE;
  const visibleContents = currentDisplayContents.slice(pageStartIndex, pageStartIndex + CONTENTS_PER_PAGE);
  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedCategory !== "all" ||
    selectedType !== "all" ||
    showSavedContents;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedType, sortBy, showSavedContents]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const scrollCatalogIntoView = () => {
    document.getElementById("catalogo-conteudos")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const clearCatalogFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedType("all");
    setShowSavedContents(false);
    setCurrentPage(1);
  };

  const handleBackToCatalog = () => {
    clearCatalogFilters();
    window.setTimeout(scrollCatalogIntoView, 0);
  };

  const catalogEmptyState = showSavedContents
    ? {
        icon: Bookmark,
        title: "Ainda não guardaste conteúdos.",
        description: "Quando encontrares um vídeo, texto ou podcast importante, usa o marcador para criar a tua biblioteca pessoal.",
        tone: "action" as const,
        primaryAction: { label: "Ver todos os conteúdos", onClick: clearCatalogFilters },
      }
    : searchQuery.trim() !== ""
      ? {
          icon: Search,
          title: "Nenhum resultado para esta pesquisa.",
          description: "Tenta procurar por tema, autor, formato ou uma palavra mais curta. O catálogo continua aqui, só precisa de outra pista.",
          tone: "secondary" as const,
          primaryAction: { label: "Limpar pesquisa", onClick: clearCatalogFilters },
        }
      : contents.length === 0
        ? {
            icon: BookOpen,
            title: "Conteúdos ainda não disponíveis.",
            description: "Assim que novos materiais forem publicados, esta área passa a mostrar vídeos, textos e podcasts para explorar.",
            tone: "primary" as const,
            primaryAction: { label: "Recarregar", onClick: carregarConteudos },
          }
        : {
            icon: Layers,
            title: "Nenhum conteúdo encontrado.",
            description: "Ajuste a pesquisa ou limpe os filtros para voltar a ver todos os materiais disponíveis.",
            tone: "neutral" as const,
            primaryAction: { label: "Limpar filtros", onClick: clearCatalogFilters },
            secondaryAction: { label: "Voltar ao catálogo", onClick: handleBackToCatalog },
          };

  const handlePageChange = (page: number) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    setCurrentPage(nextPage);
    window.setTimeout(scrollCatalogIntoView, 0);
  };

  const paginationItems = (() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
    const sortedPages = Array.from(pages)
      .filter((page) => page >= 1 && page <= totalPages)
      .sort((a, b) => a - b);

    return sortedPages.reduce<(number | "ellipsis")[]>((items, page) => {
      const previousPage = typeof items[items.length - 1] === "number" ? (items[items.length - 1] as number) : null;
      if (previousPage && page - previousPage > 1) {
        items.push("ellipsis");
      }
      items.push(page);
      return items;
    }, []);
  })();

  const commentSectionProps = {
    isAuthenticated,
    contents,
    likedComments,
    hiddenComments,
    commentsLoadedByContent,
    openCommentMenuId,
    setAuthAction,
    setShowAuthPrompt,
    setCommentsForContent,
    setCommentsLoadedByContent,
    setLikedComments,
    setContents,
    setSelectedContentForReport,
    setIsReportModalOpen,
    setOpenCommentMenuId,
    getCommentsForContent,
    createClientId,
    getCurrentUserName,
    getCurrentUserInitials,
    handleEditComment,
    handleDeleteCommentClick,
    handleSaveEditComment,
    handleCancelEditComment,
    handleAndShowError,
    triggerToast,
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900 font-sans tracking-normal relative selection:bg-amber-100 selection:text-amber-900">
      
      {/* Toast Alert Pile Melhorado */}
      <div className="fixed top-5 right-5 z-[99] max-w-sm w-full flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, x: 20 }}
              transition={{ duration: 0.3 }}
              className={`bg-white border-l-4 shadow-xl rounded-xl p-4 pointer-events-auto flex gap-3 items-start ${
                t.type === "success" ? "border-emerald-500" :
                t.type === "error" ? "border-[#800020]" :
                t.type === "warning" ? "border-amber-500" :
                "border-blue-500"
              }`}
            >
              <div className="mt-1">
                {t.type === "success" && <Check className="w-5 h-5 text-emerald-600" />}
                {t.type === "error" && <AlertTriangle className="w-5 h-5 text-[#800020]" />}
                {t.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-600" />}
                {t.type === "info" && <MessageCircle className="w-5 h-5 text-blue-600" />}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm text-slate-900">{t.title}</h4>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{t.desc}</p>
                {t.action && (
                  <button
                    onClick={t.action.onClick}
                    aria-label={t.action.label}
                    className="text-xs font-semibold text-[#800020] hover:text-[#5C0016] mt-2 transition-colors"
                  >
                    {t.action.label} →
                  </button>
                )}
              </div>
              <button
                onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
                aria-label={`Fechar notificação: ${t.title}`}
                className="text-slate-300 hover:text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* CABEÇALHO - ALTERADO: RECURSOS MULTIMÉDIA → EXPLORAR CONTEÚDOS, Educação e Cultura Angolana → Educação e História Angolana */}
      <header className="bg-[#264653] border-b border-[#2C2C2E] py-4 px-6 md:px-12 flex flex-col md:flex-row md:items-center md:justify-between sticky top-0 z-10 gap-4">
        <div className="flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-[#EF4444]" />
          <div>
            <h1 className="text-xl font-bold text-white uppercase tracking-wider">EXPLORAR CONTEÚDOS</h1>
            <p className="text-xs text-[#FDD5D5]">Educação e História Angolana</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Guardados — sem borda */}
          <button
            onClick={() => {
              if (!isAuthenticated) {
                setAuthAction('guardar conteúdos');
                setShowAuthPrompt(true);
                return;
              }
              setShowSavedContents(!showSavedContents);
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all ${
              showSavedContents
                ? "bg-white text-[#800020] shadow-sm"
                : "bg-white/10 hover:bg-white/20 text-white"
            }`}
          >
            <Bookmark className="w-4 h-4" fill={showSavedContents ? "currentColor" : "none"} />
            <span>Guardados</span>
            {(() => { const n = contents.filter(c => savedContents[c.id]).length; return n > 0 ? (
              <span className={`ml-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${showSavedContents ? "bg-[#800020] text-white" : "bg-white/25 text-white"}`}>{n}</span>
            ) : null; })()}
          </button>

          {/* Histórico */}
          <button
            onClick={() => setShowHistory(true)}
            className="bg-[#E9C46A]/10 hover:bg-[#E9C46A]/20 text-white px-4 py-2 text-xs font-semibold rounded-lg border flex items-center gap-2 transition-all whitespace-nowrap"
            style={{ borderColor: 'rgba(233, 196, 106, 0.5)', borderWidth: 1 }}
          >
            <History className="w-4 h-4" style={{ color: '#FCD34D' }} />
            <span>Histórico</span>
            {viewedHistory.length > 0 && (
              <span className="ml-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center bg-white/25 text-white">{viewedHistory.length}</span>
            )}
          </button>
          
          {isProfessorOuAdmin && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => { carregarPedidosAcesso(); setIsAccessRequestsModalOpen(true); }}
                className="relative bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-all whitespace-nowrap"
                title="Gerir pedidos de acesso Jindungo"
              >
                <Flame className="w-4 h-4" />
                <span>Pedidos Jindungo</span>
                {accessRequestsList.filter(p => p.status === 'pendente').length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-slate-900 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                    {accessRequestsList.filter(p => p.status === 'pendente').length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-[#9E152F] hover:bg-[#5C0016] text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Conteúdo</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Browse Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Search, Category Selection Filter and Tab Row */}
        <div className="relative bg-white rounded-2xl p-4 sm:p-6 border border-[#800020]/10 shadow-lg shadow-[#800020]/[0.04] mb-8">
          <div className="absolute inset-x-0 top-0 h-1 bg-[#800020]" />
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
              <input
                type="text"
                aria-label="Pesquisar conteúdos"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar por título, autor, moeda ou mercado..."
                className="w-full bg-[#800020]/[0.025] border border-[#800020]/10 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-950 placeholder:text-slate-400 focus:outline-none focus:border-[#800020] focus:ring-4 focus:ring-[#800020]/10 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  aria-label="Limpar pesquisa"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              
              <div className="relative">
                <button
                  onClick={() => {
                    setIsCategorySelectOpen(!isCategorySelectOpen);
                    setIsSortSelectOpen(false);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") setIsCategorySelectOpen(false);
                    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setIsCategorySelectOpen(true);
                      setIsSortSelectOpen(false);
                      window.setTimeout(() => {
                        document.getElementById("category-filter-list")?.querySelector<HTMLElement>('[role="option"]')?.focus();
                      }, 0);
                    }
                  }}
                  aria-label="Selecionar categoria"
                  aria-haspopup="listbox"
                  aria-expanded={isCategorySelectOpen}
                  className={`flex items-center gap-2 px-4 py-2.5 border transition-all rounded-xl text-xs font-semibold text-[#800020] ${
                    selectedCategory !== "all"
                      ? "bg-[#800020]/10 border-[#800020]/30"
                      : "bg-[#800020]/[0.035] border-[#800020]/15 hover:bg-[#800020]/10"
                  }`}
                >
                  <Filter className="w-3.5 h-3.5 text-[#800020]" />
                  <span>{selectedCategory === "all" ? "Categorias" : categoryLabels[selectedCategory]?.label || selectedCategory}</span>
                  {selectedCategory !== "all" && <span className="h-2 w-2 rounded-full bg-[#800020] inline-block" />}
                  <ChevronDown className="w-3.5 h-3.5 ml-1 text-[#800020]/60" />
                </button>
                {isCategorySelectOpen && (
                  <>
                    <div className="fixed inset-0 z-40" aria-hidden="true" onClick={() => setIsCategorySelectOpen(false)} />
                    <div id="category-filter-list" role="listbox" aria-label="Categorias" className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-slate-100 shadow-xl z-50 py-1.5 overflow-hidden">
                      {Object.keys(categoryLabels).map((catId) => {
                        const ItemIcon = categoryLabels[catId].icon;
                        return (
                          <button
                            key={catId}
                            onClick={() => {
                              setSelectedCategory(catId);
                              setIsCategorySelectOpen(false);
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Escape") setIsCategorySelectOpen(false);
                            }}
                            role="option"
                            aria-selected={selectedCategory === catId}
                            className={`w-full text-left px-4 py-2 text-xs flex items-center gap-2.5 transition-colors ${
                              selectedCategory === catId 
                                ? "bg-[#800020]/10 text-[#800020] font-bold" 
                                : "text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <ItemIcon className="w-3.5 h-3.5 text-slate-400" />
                            <span>{categoryLabels[catId].label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => {
                    setIsSortSelectOpen(!isSortSelectOpen);
                    setIsCategorySelectOpen(false);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") setIsSortSelectOpen(false);
                    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setIsSortSelectOpen(true);
                      setIsCategorySelectOpen(false);
                      window.setTimeout(() => {
                        document.getElementById("sort-filter-list")?.querySelector<HTMLElement>('[role="option"]')?.focus();
                      }, 0);
                    }
                  }}
                  aria-label="Selecionar ordenação"
                  aria-haspopup="listbox"
                  aria-expanded={isSortSelectOpen}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#264653]/[0.045] border border-[#264653]/15 hover:bg-[#264653]/10 transition-all rounded-xl text-xs font-semibold text-[#264653]"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-[#264653]" />
                  <span>Ordenar Por: {sortBy === "popular" ? "Mais vistos" : sortBy === "recent" ? "Mais recentes" : "Mais antigos"}</span>
                  <ChevronDown className="w-3.5 h-3.5 ml-1 text-[#264653]/60" />
                </button>
                {isSortSelectOpen && (
                  <>
                    <div className="fixed inset-0 z-40" aria-hidden="true" onClick={() => setIsSortSelectOpen(false)} />
                    <div id="sort-filter-list" role="listbox" aria-label="Ordenação" className="absolute right-0 mt-2 w-48 rounded-xl bg-white border border-slate-100 shadow-xl z-50 py-1.5 overflow-hidden">
                      {[
                        { id: "popular", label: "Mais vistos" },
                        { id: "recent", label: "Mais recentes" },
                        { id: "oldest", label: "Mais antigos" }
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => {
                            setSortBy(opt.id);
                            setIsSortSelectOpen(false);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Escape") setIsSortSelectOpen(false);
                          }}
                          role="option"
                          aria-selected={sortBy === opt.id}
                          className={`w-full text-left px-4 py-2 text-xs transition-colors ${
                            sortBy === opt.id 
                              ? "bg-[#264653]/10 text-[#264653] font-bold" 
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2.5 rounded-xl border transition-all text-xs font-semibold flex items-center gap-1.5 ${
                  showFilters || selectedType !== "all"
                    ? "bg-amber-100 text-amber-800 border-amber-300"
                    : "bg-white border-amber-200 text-amber-800 hover:bg-amber-50"
                }`}
              >
                <Layers className="w-4 h-4 text-amber-600" />
                <span>
                  {selectedType === "all"
                    ? "Formatos"
                    : selectedType === "video" ? "Vídeos"
                    : selectedType === "texto_normal" ? "Textos"
                    : selectedType === "texto_jindungo" ? "Jindungo"
                    : selectedType === "podcast" ? "Podcasts"
                    : "Formatos"}
                </span>
                {selectedType !== "all" && (
                  <span className="ml-0.5 h-2 w-2 rounded-full bg-amber-500 inline-block" />
                )}
                <ChevronDown className="w-3.5 h-3.5 text-amber-600/60" />
              </button>

            </div>
          </div>

          {/* Formats filter row drawer - ALTERADO: Vídeos Documentais → Vídeos, Artigos e Ensaios → Textos */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="mt-5 pt-5 border-t border-[#800020]/10 flex flex-wrap gap-2">
                  {[
                    { id: "all", label: "Tudo", icon: Globe },
                    { id: "video", label: "Vídeos", icon: Play },
                    { id: "texto_normal", label: "Textos", icon: FileText },
                    { id: "texto_jindungo", label: "Texto com Jindungo", icon: Flame },
                    { id: "podcast", label: "Podcasts & Debates", icon: Mic }
                  ].map((type) => {
                    const TypeIcon = type.icon;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setSelectedType(type.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          selectedType === type.id
                            ? "bg-[#800020] text-white shadow-xs"
                            : "bg-[#264653]/5 text-[#264653] hover:bg-[#264653]/10"
                        }`}
                      >
                        <TypeIcon className="w-3.5 h-3.5" />
                        <span>{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* View title label feedback based on filter status - ALTERADO: Recursos Didáticos → Conteúdos Disponíveis, texto descritivo */}
        <div id="catalogo-conteudos" className="mb-6 flex justify-between items-center px-1 scroll-mt-24">
          <div className="border-l-4 border-[#800020] pl-4">
            <h3 className="text-xl font-bold text-slate-950 tracking-tight flex items-center gap-2">
              {showSavedContents ? (
                <>
                  <Bookmark className="w-5 h-5 text-amber-500" fill="currentColor" />
                  <span>Conteúdos Favoritos Guardados</span>
                </>
              ) : (
                <span>Conteúdos Disponíveis ({currentDisplayContents.length})</span>
              )}
            </h3>
            <p className="text-xs text-[#264653] mt-1">
              {showSavedContents ? "Mostrando apenas mídias que guardaste para estudo pessoal." : "Explore vídeos, textos, podcast sobre a economia e história de Angola."}
            </p>
          </div>

          {showSavedContents && (
            <button
              onClick={() => setShowSavedContents(false)}
              className="text-orange-600 hover:text-orange-700 text-xs font-bold flex items-center gap-1.5 hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar à biblioteca completa</span>
            </button>
          )}
        </div>

        {/* Dynamic Media Grid View */}
        {contentLoadError ? (
          <div className="mb-6 rounded-3xl border border-[#FDD5D5] bg-[#FFF2F2] p-6 text-[#5C0016] shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Falha ao carregar conteúdos</p>
                <p className="mt-1 text-xs text-[#5C0016]/80">{contentLoadError}</p>
              </div>
              <button
                onClick={carregarConteudos}
                className="inline-flex items-center gap-2 rounded-full bg-[#800020] px-4 py-2 text-xs font-bold text-white hover:bg-[#5C0016] transition-colors"
              >
                <RefreshCcw className="w-4 h-4" />
                Recarregar
              </button>
            </div>
          </div>
        ) : null}

        {isLoadingContents ? (
          <ContentGridSkeleton />
        ) : visibleContents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {visibleContents.map((content) => {
              const isSaved = savedContents[content.id];
              // Um professor só pode editar/eliminar o que ele próprio criou;
              // só um admin (não um professor qualquer) pode gerir tudo —
              // isto espelha exactamente a regra já aplicada no backend
              // (atualizarConteudo / deleteConteudo).
              // A edição/eliminação é exclusiva de quem criou o conteúdo — o
              // admin já não gere conteúdo directamente (só administra o sistema).
              const isCreator = content.createdByCurrentUser === true;
              const accessInfo = getAccessInfo(content.id);
              const isPremiumContent = (content.requiresAccess || content.type === "texto_jindungo") && !isProfessorOuAdmin;
              const canOpenPremiumContent = isPremiumContent && accessInfo?.status === "aprovado";

              return (
                <ContentCard
                  key={content.id}
                  content={content}
                  isSaved={isSaved}
                  isSavingId={isSavingId}
                  isLiked={!!likedContents[content.id]}
                  isLikingId={isLikingId}
                  isCreator={isCreator}
                  accessInfo={accessInfo}
                  isPremiumContent={isPremiumContent}
                  canOpenPremiumContent={canOpenPremiumContent}
                  categoryLabels={categoryLabels}
                  onOpen={openContent}
                  onLike={handleLike}
                  onOpenFullscreen={(c) => {
                    setViewedHistory(prev => [c, ...prev.filter(i => i.id !== c.id)].slice(0, 12));
                    updateViews(c.id);
                    setFullscreenContent(c);
                  }}
                  onSaveToggle={handleSaveToggle}
                  onAccessRequest={triggerAccessRequest}
                  onEditStart={(c) => {
                    setEditingContentId(c.id);
                    setNewContent({
                      title: c.title,
                      description: c.description,
                      categories: c.category,
                      type: c.type,
                      duration: c.duration,
                      thumbnailUrl: c.type === "video" ? (c.videoCoverUrl || c.thumbnail || "") : (c.thumbnail || ""),
                      contentBody: c.content || "",
                      level: c.level,
                      episodes: c.episodes || [],
                      epFormTitle: "",
                      epFormDuration: "",
                      epFormDesc: "",
                      mediaFile: null,
                      mediaFileName: "",
                      mediaPreviewUrl: c.type === "video" ? (c.mediaUrl || "") : "",
                      videoCoverImage: null,
                      videoCoverImageName: c.type === "video" && (c.videoCoverUrl || c.thumbnail) ? "Capa atual do vídeo" : "",
                      videoCoverPreviewUrl: c.type === "video" ? (c.videoCoverUrl || c.thumbnail || "") : "",
                      coverImageName: "",
                      coverPreviewUrl: c.type !== "video" ? (c.thumbnail || "") : "",
                      newCategoryInput: "",
                      newEpisode: { title: "", duration: "", date: "", audioFileName: "", audioUrl: "", description: "" }
                    });
                    setIsAddModalOpen(true);
                  }}
                  onDeleteStart={(id) => {
                    setDeleteTarget({ type: "content", id });
                    setIsDeleteModalOpen(true);
                  }}
                  getAccessInfo={getAccessInfo}
                  getAccessStatusLabel={getAccessStatusLabel}
                  formatDateTime={formatDateTime}
                />
              );
            })}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <EmptyState {...catalogEmptyState} />
          </div>
        )}

        {totalPages > 1 && !isLoadingContents && visibleContents.length > 0 && (
          <div className="mt-12 flex flex-col items-center gap-4">
            <p className="text-xs font-semibold text-slate-500">
              A mostrar {pageStartIndex + 1}-{Math.min(pageStartIndex + CONTENTS_PER_PAGE, currentDisplayContents.length)} de {currentDisplayContents.length} conteúdos
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Página anterior"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition-colors hover:border-orange-300 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>

              {paginationItems.map((item, index) =>
                item === "ellipsis" ? (
                  <span key={`ellipsis-${index}`} className="px-2 text-slate-400">
                    <MoreHorizontal className="w-4 h-4" />
                  </span>
                ) : (
                  <button
                    key={item}
                    onClick={() => handlePageChange(item)}
                    aria-label={`Ir para página ${item}`}
                    aria-current={currentPage === item ? "page" : undefined}
                    className={`h-10 min-w-10 rounded-xl px-3 text-xs font-bold transition-colors ${
                      currentPage === item
                        ? "bg-orange-600 text-white shadow-xs"
                        : "border border-slate-200 bg-white text-slate-700 hover:border-orange-300 hover:bg-orange-50"
                    }`}
                  >
                    {item}
                  </button>
                )
              )}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Página seguinte"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition-colors hover:border-orange-300 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <span>Seguinte</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Mini-Sticky Interactive Custom Audio Podcast Player — só fica solta na
          página quando o modal "Ouvir Podcast" não está aberto; quando está,
          a mesma barra é passada para dentro do modal (ver playerBarNode abaixo),
          para não ficar "por trás"/fora do ecrã de conteúdo. */}
      {!(fullscreenContent?.type === 'podcast') && (
        <PodcastPlayerBar
          playingEpisode={playingEpisode}
          playingPodcastTitle={playingPodcastTitle}
          playingPodcastThumbnail={playingPodcastThumbnail}
          isAudioPlaying={isAudioPlaying}
          audioProgress={audioProgress}
          audioCurrentTime={audioCurrentTime}
          audioDuration={audioDuration}
          isMuted={isMuted}
          audioRef={audioRef}
          onPlayPause={() => setIsAudioPlaying(!isAudioPlaying)}
          onStop={stopAudioPlayer}
          onPrev={() => playAdjacentPlaylistItem(-1)}
          onNext={() => playAdjacentPlaylistItem(1)}
          onSeek={seekAudioToPercentage}
          onMuteToggle={() => setIsMuted(!isMuted)}
          formatAudioTime={formatAudioTime}
        />
      )}

      {/* DIALOGS / MODALS */}

      {/* ============================================================ */}
      {/* MODAL DE VÍDEO - COM REDUÇÃO SUTIL DO PLAYER */}
      {/* ============================================================ */}
      <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
        <DialogContent className="sm:max-w-5xl max-h-[95vh] overflow-y-auto p-0">
          {/* Botão de fechar maior e mais visível */}
          <button
            onClick={() => setIsVideoModalOpen(false)}
            className="absolute top-4 right-4 z-20 p-3 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all hover:scale-110 shadow-lg backdrop-blur-sm"
            aria-label="Fechar"
          >
            <X className="w-6 h-6" />
          </button>

          <DialogTitle className="sr-only">
            {videoContent?.title || "Visualização de Vídeo"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Player de vídeo e informações sobre o conteúdo selecionado
          </DialogDescription>
          {videoContent && (
            <div>
              <div className={`relative w-full max-h-[75vh] aspect-video ${videoContent.thumbnail ? 'bg-slate-200' : `bg-gradient-to-br ${videoContent.imageColor}`} flex items-center justify-center overflow-hidden`}>
                {videoContent.mediaUrl ? (
                  /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(videoContent.mediaUrl) ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${videoContent.mediaUrl.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1] ?? ''}`}
                      className="w-full h-full max-h-[75vh] aspect-video"
                      allowFullScreen
                      title={videoContent.title}
                    />
                  ) : (
                  <video
                    src={videoContent.mediaUrl}
                    controls
                    className="w-full h-full max-h-[75vh] object-contain bg-black"
                  />
                  )
                ) : videoContent.thumbnail ? (
                  <img
                    src={videoContent.thumbnail}
                    alt={videoContent.title}
                    className="w-full h-full max-h-[75vh] object-cover"
                  />
                ) : (
                  <>
                    <div className="absolute inset-0 bg-black/40" />
                    <div className="relative z-10 flex items-center justify-center">
                      <div className="text-white">
                        {videoContent.imageIcon}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="p-8">
                <button
                  onClick={() => { setIsVideoModalOpen(false); setFullscreenContent(videoContent); }}
                  className="mb-5 flex items-center gap-1.5 px-4 py-2 bg-[#800020] hover:bg-[#5C0016] text-white rounded-full text-xs font-bold transition-all shadow-sm"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Abrir em ecrã completo</span>
                </button>
                <h2 className="text-3xl font-bold text-slate-900 mb-4">{videoContent.title}</h2>

                <div className="flex items-center justify-between flex-wrap gap-4 mb-4 pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#800020] rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {videoContent.author.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-base">{videoContent.author}</p>
                      <p className="text-sm text-slate-500">{videoContent.date}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {videoContent.tags.map((tag) => (
                    <span key={tag} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-md text-sm">
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="bg-slate-50 rounded-xl p-6 mb-6">
                  <SanitizedHtml
                    html={videoContent.content || videoContent.description}
                    className="text-base text-slate-700 whitespace-pre-line leading-relaxed"
                  />
                </div>

                <div className="flex items-center gap-6 mb-6 pb-4 border-b border-slate-200">
                  <button
                    onClick={() => handleLike(videoContent.id)}
                    className={`flex items-center gap-2 text-sm transition-colors ${
                      likedContents[videoContent.id] ? "text-[#800020] font-semibold" : "text-slate-600 hover:text-[#800020]"
                    }`}
                  >
                    <motion.span
                      animate={isLikingId === videoContent.id ? { scale: [1, 1.28, 1] } : { scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="flex"
                    >
                      <ThumbsUp className="w-5 h-5" fill={likedContents[videoContent.id] ? "currentColor" : "none"} />
                    </motion.span>
                    <span>Gostei</span>
                    <motion.span
                      key={`video-likes-${videoContent.likes}`}
                      initial={{ y: -4, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.18 }}
                      className="text-xs text-slate-500"
                    >
                      ({videoContent.likes || 0})
                    </motion.span>
                  </button>
                  <button
                    onClick={() => handleSave(videoContent.id, videoContent.title)}
                    className={`flex items-center gap-2 text-sm transition-colors ${
                      savedContents[videoContent.id] ? "text-[#800020] font-semibold" : "text-slate-600 hover:text-[#800020]"
                    }`}
                  >
                    <motion.span
                      animate={isSavingId === videoContent.id ? { scale: [1, 1.22, 1] } : { scale: savedContents[videoContent.id] ? 1.06 : 1 }}
                      transition={{ duration: 0.28 }}
                      className="flex"
                    >
                      <Bookmark className="w-5 h-5" fill={savedContents[videoContent.id] ? "currentColor" : "none"} />
                    </motion.span>
                    <span>{savedContents[videoContent.id] ? "Remover dos guardados" : "Guardar"}</span>
                  </button>
                  <button
                    onClick={() => handleCopyShareLink(videoContent)}
                    className="flex items-center gap-2 text-sm text-slate-600 hover:text-[#800020] transition-colors"
                  >
                    <Share2 className="w-5 h-5" />
                    <span>Partilhar</span>
                  </button>
                  <button
                    onClick={() => handleDownloadTrigger(videoContent)}
                    disabled={/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(videoContent?.mediaUrl || '')}
                    className="flex items-center gap-2 text-sm text-slate-600 hover:text-[#800020] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-slate-600"
                    title={/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(videoContent?.mediaUrl || '') ? 'Não disponível para vídeos do YouTube' : undefined}
                  >
                    <Download className="w-5 h-5" />
                    <span>Download</span>
                  </button>
                  <ReportActionButton
                    content={videoContent}
                    getReportInfo={getReportInfo}
                    openReportModal={openReportModal}
                  />
                </div>

                <CommentSection contentId={videoContent.id} {...commentSectionProps} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* MODAL DE TEXTO - IMAGEM COM 50vh PARA CABER COMPLETAMENTE NO ECRÃ */}
      {/* ============================================================ */}
      <Dialog open={isTextModalOpen} onOpenChange={setIsTextModalOpen}>
        <DialogContent className="sm:max-w-5xl max-h-[95vh] overflow-y-auto p-0">
          <button
            onClick={() => setIsTextModalOpen(false)}
            className="absolute top-4 right-4 z-20 p-3 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all hover:scale-110 shadow-lg backdrop-blur-sm"
            aria-label="Fechar"
          >
            <X className="w-6 h-6" />
          </button>

          <DialogTitle className="sr-only">
            {textContent?.title || "Visualização de Texto"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Conteúdo de texto completo com informações e seção de comentários
          </DialogDescription>
          {textContent && (
            <div>
              {/* Container da imagem com altura máxima de 50vh para caber no ecrã */}
              <div className="relative w-full flex justify-center">
                {textContent.thumbnail ? (
                  <img
                    src={textContent.thumbnail}
                    alt={textContent.title}
                    className="max-w-full h-auto max-h-[50vh] object-contain"
                    loading="lazy"
                  />
                ) : (
                  <div className={`w-full h-64 bg-gradient-to-br ${textContent.imageColor} flex items-center justify-center`}>
                    <div className="relative z-10 text-center text-white">
                      {textContent.imageIcon}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-8">
                <h1 className="text-4xl font-bold text-slate-900 mb-4 leading-tight">{textContent.title}</h1>

                <button
                  onClick={() => { setIsTextModalOpen(false); setFullscreenContent(textContent); }}
                  className="mb-5 flex items-center gap-1.5 px-4 py-2 bg-[#800020] hover:bg-[#5C0016] text-white rounded-full text-xs font-bold transition-all shadow-sm"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Abrir em ecrã completo</span>
                </button>

                <div className="flex items-center gap-4 pb-6 border-b border-slate-200 mb-6">
                  <div className="w-14 h-14 bg-[#800020] rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {textContent.author.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-lg">{textContent.author}</p>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <span>{textContent.date}</span>
                      {textContent.duration && textContent.duration.trim() !== "" && (
                        <>
                          <span>·</span>
                          <span>{textContent.duration} de leitura</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <article className="prose prose-lg prose-slate max-w-none mb-8">
                  <SanitizedHtml
                    html={textContent.content || textContent.description}
                    className="text-slate-700 leading-relaxed text-base whitespace-pre-line space-y-4"
                  />
                </article>

                <div className="flex flex-wrap gap-2 mb-6 pt-4 border-t border-slate-200">
                  {textContent.tags.map((tag) => (
                    <span key={tag} className="bg-slate-100 text-slate-600 px-4 py-1.5 rounded-full text-sm font-medium">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-6 mb-8 pb-6 border-b border-slate-200">
                  <button
                    onClick={() => handleLike(textContent.id)}
                    className={`flex items-center gap-2 text-sm transition-colors ${
                      likedContents[textContent.id] ? "text-[#800020] font-semibold" : "text-slate-600 hover:text-[#800020]"
                    }`}
                  >
                    <motion.span
                      animate={isLikingId === textContent.id ? { scale: [1, 1.28, 1] } : { scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="flex"
                    >
                      <ThumbsUp className="w-5 h-5" fill={likedContents[textContent.id] ? "currentColor" : "none"} />
                    </motion.span>
                    <span>Gostei</span>
                    <motion.span
                      key={`text-likes-${textContent.likes}`}
                      initial={{ y: -4, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.18 }}
                      className="text-xs text-slate-500"
                    >
                      ({textContent.likes || 0})
                    </motion.span>
                  </button>
                  <button
                    onClick={() => handleSave(textContent.id, textContent.title)}
                    className={`flex items-center gap-2 text-sm transition-colors ${
                      savedContents[textContent.id] ? "text-[#800020] font-semibold" : "text-slate-600 hover:text-[#800020]"
                    }`}
                  >
                    <motion.span
                      animate={isSavingId === textContent.id ? { scale: [1, 1.22, 1] } : { scale: savedContents[textContent.id] ? 1.06 : 1 }}
                      transition={{ duration: 0.28 }}
                      className="flex"
                    >
                      <Bookmark className="w-5 h-5" fill={savedContents[textContent.id] ? "currentColor" : "none"} />
                    </motion.span>
                    <span>{savedContents[textContent.id] ? "Remover dos guardados" : "Guardar"}</span>
                  </button>
                  {textContent.type !== "texto_jindungo" && !textContent.requiresAccess && (
                    <button
                      onClick={() => handleCopyShareLink(textContent)}
                      className="flex items-center gap-2 text-sm text-slate-600 hover:text-[#800020] transition-colors"
                    >
                      <Share2 className="w-5 h-5" />
                      <span>Partilhar</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleDownloadTrigger(textContent)}
                    className="flex items-center gap-2 text-sm text-slate-600 hover:text-[#800020] transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    <span>Download</span>
                  </button>
                  <ReportActionButton
                    content={textContent}
                    getReportInfo={getReportInfo}
                    openReportModal={openReportModal}
                  />
                </div>

                <CommentSection contentId={textContent.id} {...commentSectionProps} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* MODAL DE PODCAST - TAMANHO EXPANDIDO */}
      {/* ============================================================ */}
      <Dialog open={isPodcastModalOpen} onOpenChange={setIsPodcastModalOpen}>
        <DialogContent className="sm:max-w-5xl max-h-[95vh] overflow-y-auto p-0 bg-gradient-to-b from-gray-50 to-white">
          <button
            onClick={() => setIsPodcastModalOpen(false)}
            className="absolute top-4 right-4 z-20 p-3 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all hover:scale-110 shadow-lg backdrop-blur-sm"
            aria-label="Fechar"
          >
            <X className="w-6 h-6" />
          </button>

          <DialogTitle className="sr-only">
            {podcastContent?.title || "Visualização de Podcast"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Player de podcast com episódios e seção de comentários
          </DialogDescription>
          {podcastContent && (
            <div className="text-slate-800">
              <div className="bg-gradient-to-b from-gray-100 to-white p-8 border-b border-gray-200">
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
                  <div className={`w-56 h-56 ${podcastContent.thumbnail ? 'bg-gray-100' : `bg-gradient-to-br ${podcastContent.imageColor}`} rounded-xl shadow-lg flex-shrink-0 flex items-center justify-center overflow-hidden relative`}>
                    {podcastContent.thumbnail ? (
                      <img
                        src={podcastContent.thumbnail}
                        alt={podcastContent.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-white">
                        {podcastContent.imageIcon}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 pb-2">
                    <span className="text-sm font-bold uppercase tracking-wider text-[#800020] mb-2 block">Podcast</span>
                    <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4 leading-tight">{podcastContent.title}</h2>
                    <button
                      onClick={() => { setIsPodcastModalOpen(false); setFullscreenContent(podcastContent); }}
                      className="mb-4 flex items-center gap-1.5 px-4 py-2 bg-[#800020] hover:bg-[#5C0016] text-white rounded-full text-xs font-bold transition-all shadow-sm"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Abrir em ecrã completo</span>
                    </button>
                    <div className="flex items-center gap-3 text-base text-gray-600 mb-6">
                      <span className="text-slate-700 font-medium">{podcastContent.author}</span>
                      <span>•</span>
                      <span>{podcastContent.episodes?.length || 0} Episódios</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <button
                        onClick={() => handleCopyShareLink(podcastContent)}
                        className="flex items-center gap-2 text-slate-600 hover:text-[#800020] transition-colors"
                      >
                        <Share2 className="w-5 h-5" />
                        <span>Partilhar</span>
                      </button>
                      <button
                        onClick={() => handleDownloadTrigger(podcastContent)}
                        className="flex items-center gap-2 text-slate-600 hover:text-[#800020] transition-colors"
                      >
                        <Download className="w-5 h-5" />
                        <span>Download</span>
                      </button>
                      <ReportActionButton
                        content={podcastContent}
                        className="text-slate-600"
                        getReportInfo={getReportInfo}
                        openReportModal={openReportModal}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="mb-6">
                  <SanitizedHtml
                    html={podcastContent.description}
                    className="text-gray-700 text-base leading-relaxed"
                  />
                </div>

                <h3 className="text-2xl font-bold text-slate-800 mb-4">Episódios</h3>
                <div className="space-y-2">
                  {podcastContent.episodes?.map((ep) => {
                    const playlistKey = `${podcastContent.id}_${ep.id}`;
                    const isInPlaylist = !!playlistItems[playlistKey];
                    
                    return (
                      <motion.div
                        key={ep.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.22 }}
                        className={`bg-gray-50 hover:bg-gray-100 rounded-xl p-5 transition-colors group ${
                          currentEpisode?.id === ep.id ? 'border-2 border-[#FBBCB8] bg-[#FFF2F2]/30' : 'border border-transparent'
                        } ${playingEpisodeId === ep.id ? 'border-2 border-[#FBBCB8] bg-[#FFF2F2]/30' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div
                              role="button"
                              tabIndex={0}
                              aria-expanded={currentEpisode?.id === ep.id}
                              aria-label={`Mostrar detalhes do episódio ${ep.title}`}
                              className="min-w-0 cursor-pointer flex-1 focus:outline-none focus:ring-2 focus:ring-[#FBBCB8] rounded-md"
                              onClick={() => setCurrentEpisode(ep)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault();
                                  setCurrentEpisode(ep);
                                }
                              }}
                            >
                              <p className="text-slate-800 font-medium text-base group-hover:text-[#800020] transition-colors truncate">
                                {ep.title}
                              </p>
                              <p className="text-gray-500 text-sm mt-0.5">{ep.duration} · {ep.date}</p>
                            </div>
                          </div>
                          <motion.button
                            onClick={() => handleAddToPlaylist(ep, podcastContent)}
                            whileTap={{ scale: 0.96 }}
                            animate={isInPlaylist ? { x: [0, -3, 0], scale: [1, 1.03, 1] } : { x: 0, scale: 1 }}
                            transition={{ duration: 0.28 }}
                            className={`ml-2 min-w-[172px] justify-end text-sm font-medium transition-colors flex items-center gap-1.5 ${
                              isInPlaylist ? "text-purple-700" : "text-gray-500 hover:text-purple-600"
                            }`}
                          >
                            <List className="w-4 h-4" />
                            {isInPlaylist ? (
                              <motion.span
                                initial={{ opacity: 0, y: -3 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-bold text-purple-700"
                              >
                                Na playlist
                              </motion.span>
                            ) : (
                              <span>+ Adicionar à playlist</span>
                            )}
                          </motion.button>
                        </div>
                        {currentEpisode?.id === ep.id && (
                          <div className="mt-4 pl-0 text-base text-gray-600 space-y-4">
                            <p>{ep.description}</p>
                            {ep.audioUrl && (
                              <audio src={ep.audioUrl} controls className="w-full" />
                            )}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                <CommentSection contentId={podcastContent.id} isDarkMode={false} {...commentSectionProps} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative z-10 text-center">
              <div className="w-12 h-12 rounded-full bg-[#FEE8E8] text-[#800020] flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <DialogTitle className="text-lg font-bold text-slate-900">Pretende eliminar este item?</DialogTitle>
              <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                Esta ação não pode ser desfeita.
              </p>

              <div className="mt-6 flex justify-end gap-2 text-xs font-bold">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setDeleteTarget(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-650 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={executeDelete}
                  className="px-4 py-2 rounded-xl bg-[#800020] text-white hover:bg-[#5C0016] transition-colors"
                >
                  Sim, Excluir Ficheiro
                </button>
              </div>

        </DialogContent>
      </Dialog>

      <Dialog open={isAccessModalOpen} onOpenChange={setIsAccessModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">
              Solicitar Acesso
            </DialogTitle>
            <DialogDescription className="sr-only">
              Formulário para solicitar acesso a conteúdo privado
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <p className="text-sm text-slate-600 mb-4">
              Este conteúdo requer aprovação. A solicitação será analisada.
            </p>

            <div className="bg-slate-50 rounded-lg p-4 mb-4 border border-slate-200">
              <p className="text-[#800020] font-medium">{selectedContentForAccess?.title}</p>
              <p className="text-sm text-slate-600 mt-1">{selectedContentForAccess?.description}</p>
            </div>

            {selectedContentForAccess && getAccessInfo(selectedContentForAccess.id) && (
              <div className="mb-4">
                <AccessStatusPanel
                  content={selectedContentForAccess}
                  getAccessInfo={getAccessInfo}
                  getAccessStatusLabel={getAccessStatusLabel}
                  formatDateTime={formatDateTime}
                />
              </div>
            )}

            <div className="mb-4">
              <Label htmlFor="reason" className="text-sm font-medium text-slate-700 mb-2 block">
                Por que deseja acesso? (Opcional)
              </Label>
              <Textarea
                id="reason"
                placeholder="Ex: Pesquisa acadêmica..."
                value={accessReason}
                onChange={(e) => setAccessReason(e.target.value)}
                rows={4}
                className="w-full resize-none"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-3 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setIsAccessModalOpen(false);
                setAccessReason("");
              }}
            >
              Cancelar
            </Button>
            <Button onClick={submitAccessRequest} disabled={aSubmeterAcesso} className="bg-[#800020] hover:bg-[#5C0016]">
              {aSubmeterAcesso ? 'A enviar...' : 'Enviar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPlaylist} onOpenChange={setShowPlaylist}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <List className="w-5 h-5 text-purple-600" />
              Sua Playlist de Estudos
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-550">
              Episódios agendados de podcasts e discussões científicas.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 max-h-[60vh] overflow-y-auto space-y-3 pr-1">
            {Object.keys(playlistItems).length === 0 ? (
              <EmptyState
                icon={Music}
                title="A tua playlist está vazia."
                description="Adiciona episódios a partir dos podcasts para criares uma sequência de estudo ou escuta."
                tone="secondary"
                compact
              />
            ) : (
              (Object.entries(playlistItems) as [string, PlaylistItem][]).map(([key, item]) => {
                const isCurrentlyPlaying = playingPlaylistKey === key;
                return (
                  <div
                    key={key}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                      isCurrentlyPlaying
                        ? "bg-purple-50/50 border-purple-200 animate-pulse-subtle"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-250"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-orange-100 flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-200">
                        {item.podcastThumbnail ? (
                          <img src={item.podcastThumbnail} alt={item.episodeTitle} className="w-full h-full object-cover animate-fade-in" />
                        ) : (
                          <Mic className="w-5 h-5 text-orange-600" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className={`text-xs font-semibold truncate ${isCurrentlyPlaying ? 'text-purple-700' : 'text-slate-800'}`}>
                          {item.episodeTitle}
                        </h4>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">
                          {item.podcastTitle} · {item.podcastAuthor}
                        </p>
                        <p className="text-[9px] text-slate-400 mt-0.5">
                          {item.duration} · {item.date}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => playPlaylistItem(key, item)}
                        aria-label={isCurrentlyPlaying && isAudioPlaying ? `Pausar ${item.episodeTitle}` : `Reproduzir ${item.episodeTitle}`}
                        className={`p-2 rounded-lg transition-colors ${
                          isCurrentlyPlaying
                            ? "bg-purple-600 text-white hover:bg-purple-700"
                            : "bg-white text-slate-700 hover:bg-purple-50 hover:text-purple-600 border border-slate-200"
                        }`}
                        title="Reproduzir episódio"
                      >
                        {isCurrentlyPlaying && isAudioPlaying ? (
                          <Pause className="w-3.5 h-3.5" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current" />
                        )}
                      </button>

                      <button
                        onClick={() => removePlaylistItem(key, item)}
                        aria-label={`Remover ${item.episodeTitle} da playlist`}
                        className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-650 hover:bg-[#FFF2F2] hover:border-[#FEE8E8] transition-colors"
                        title="Remover"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <DialogFooter className="mt-4 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setShowPlaylist(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <HistoryModal
        open={showHistory}
        onOpenChange={setShowHistory}
        viewedHistory={viewedHistory}
        openContent={openContent}
      />

      {/* ============================================================ */}
      {/* Modal de criação de conteúdo */}
      {/* ============================================================ */}
      <Dialog open={isAddModalOpen} onOpenChange={(open) => {
          setIsAddModalOpen(open);
          if (!open) {
            setModoAdicao("editor");
            setAddContentSubmitAttempted(false);
            resetContentForm();
          }
        }}
      >
        <DialogContent className="h-[92vh] w-[96vw] max-w-7xl max-h-[92vh] !overflow-hidden !rounded-2xl !p-0">
          <button
            onClick={() => {
              setIsAddModalOpen(false);
              setModoAdicao("editor");
              setAddContentSubmitAttempted(false);
              resetContentForm();
            }}
            className="absolute right-5 top-5 z-20 rounded-full bg-white/90 p-2.5 text-slate-600 shadow-md ring-1 ring-slate-200 backdrop-blur transition-all hover:bg-slate-100 hover:text-slate-950"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex-1 overflow-y-auto bg-slate-50/70 px-4 py-5 sm:px-6 lg:px-8">
          <DialogHeader className="border-b border-slate-200 pb-5 pr-12">
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#800020]">
              {editingContentId ? "Atualizar publicação" : "Nova publicação"}
            </p>
            <DialogTitle className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">
              {editingContentId ? "Editar conteúdo" : "Publicar conteúdo"}
            </DialogTitle>
            <DialogDescription className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Escolha o formato, descreva a ideia central e adicione os ficheiros necessários para a publicação ficar pronta.
            </DialogDescription>
            <div className="mt-5 inline-flex w-fit rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setModoAdicao("editor")}
                className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${
                  modoAdicao === "editor"
                    ? "bg-[#800020] text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                Editor
              </button>
              <button
                type="button"
                onClick={() => setModoAdicao("preview")}
                className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${
                  modoAdicao === "preview"
                    ? "bg-[#800020] text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                Previsualizar
              </button>
            </div>
          </DialogHeader>

          {modoAdicao === "editor" ? (
            <div className="mt-6 space-y-5">
              <section className="rounded-2xl border border-[#800020]/15 bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-wider text-[#800020]">Etapa 1</p>
                    <h3 className="text-xl font-black text-slate-950">Tipo de conteúdo</h3>
                  </div>
                  <p className="text-xs font-semibold text-slate-500">4 formatos disponíveis</p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
                  {[
                    { id: "video", label: "Vídeo", desc: "Conteúdo MP4, MOV ou WebM", icon: Video },
                    { id: "texto", label: "Artigo", desc: "Texto editorial com imagem de capa", icon: FileText },
                    { id: "podcast", label: "Podcast", desc: "Episódios com áudio e descrição", icon: Mic },
                    { id: "texto_jindungo", label: "Texto com Jindungo", desc: "Conteúdo exclusivo para membros", icon: Flame },
                  ].map((type) => {
                    const isSelected = newContent.type === type.id || (type.id === "texto" && newContent.type === "texto_normal");
                    return (
                      <button
                        key={type.id}
                        type="button"
                        disabled={!!editingContentId}
                        onClick={() => {
                          if (editingContentId) return;
                          setNewContent({
                            ...newContent,
                            type: type.id as any,
                            mediaFile: null,
                            mediaFileName: "",
                            mediaPreviewUrl: "",
                            videoCoverImage: null,
                            videoCoverImageName: "",
                            videoCoverPreviewUrl: "",
                            coverImageFile: null,
                            coverPreviewUrl: "",
                          });
                        }}
                        className={`group min-h-[150px] rounded-2xl border-2 bg-white p-5 text-left transition-all active:scale-[0.99] ${
                          isSelected
                            ? "border-[#800020] bg-[#800020]/[0.025] shadow-lg shadow-[#800020]/10"
                            : "border-slate-200 hover:border-[#800020]/35 hover:bg-slate-50"
                        } ${editingContentId ? "cursor-not-allowed opacity-70" : ""}`}
                        title={editingContentId ? "O tipo de conteúdo não pode ser alterado durante a edição" : undefined}
                      >
                        <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${
                          isSelected ? "bg-[#800020] text-white" : "bg-slate-100 text-slate-600 group-hover:bg-[#800020]/10 group-hover:text-[#800020]"
                        }`}>
                          <type.icon className="h-6 w-6" />
                        </div>
                        <p className="text-lg font-black text-slate-950">{type.label}</p>
                        <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500">{type.desc}</p>
                        {isSelected && (
                          <span className="mt-4 inline-flex items-center gap-1 rounded-full bg-[#800020]/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[#800020]">
                            <Check className="h-3 w-3" />
                            Selecionado
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>

              <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(330px,0.9fr)]">
                <div className="space-y-5">
                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-5 border-b border-slate-100 pb-4">
                      <p className="text-xs font-extrabold uppercase tracking-wider text-[#264653]">Etapa 2</p>
                      <h3 className="text-xl font-black text-slate-950">Informações principais</h3>
                      <p className="mt-1 text-xs font-medium text-slate-500">Título e descrição são o núcleo da publicação.</p>
                    </div>

                    <div className="space-y-5">
                      <div>
                        <Label htmlFor="title" className="mb-2 block text-sm font-semibold text-slate-800">
                          Título
                        </Label>
                        <Input
                          id="title"
                          placeholder="Ex: Inflação em Angola: causas, impactos e respostas"
                          value={newContent.title}
                          onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                          className={`py-3 text-base font-semibold focus:ring-2 focus:ring-[#800020] ${
                            addContentSubmitAttempted && !newContent.title.trim() ? "border-[#FBBCB8]" : ""
                          }`}
                        />
                        {addContentSubmitAttempted && !newContent.title.trim() && (
                          <p className="mt-2 text-xs font-medium text-[#800020]">Adicione um título antes de publicar.</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="description" className="mb-2 block text-sm font-semibold text-slate-800">
                          Descrição
                        </Label>
                        <RichTextEditor
                          value={newContent.description}
                          onChange={(value) => setNewContent({ ...newContent, description: value })}
                          placeholder={"Comece a escrever...\nExplique o conteúdo.\nAdicione contexto.\nIndique referências relevantes."}
                          className="min-h-[220px] bg-white"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-5 border-b border-slate-100 pb-4">
                      <p className="text-xs font-extrabold uppercase tracking-wider text-[#264653]">Etapa 3</p>
                      <h3 className="text-xl font-black text-slate-950">Organização</h3>
                      <p className="mt-1 text-xs font-medium text-slate-500">Escolha uma ou mais categorias para facilitar a pesquisa.</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="mb-2 block text-sm font-semibold text-slate-800">
                          Categorias
                        </Label>
                        <Select onValueChange={handleSelectCategory}>
                          <SelectTrigger aria-label="Selecionar categoria do conteúdo" className="focus:ring-2 focus:ring-[#800020]">
                            <SelectValue placeholder="Selecione uma categoria..." />
                          </SelectTrigger>
                          <SelectContent>
                            {selectableCategories.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {getCategoryLabel(cat)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="mt-2 text-xs font-medium text-slate-500">
                          As categorias ajudam o conteúdo a aparecer nas pesquisas certas.
                        </p>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row">
                        <Input
                          placeholder="Criar nova categoria..."
                          value={newContent.newCategoryInput}
                          onChange={(e) => setNewContent({ ...newContent, newCategoryInput: e.target.value })}
                          className="flex-1 focus:ring-2 focus:ring-[#800020]"
                        />
                        <Button
                          type="button"
                          onClick={handleAddNewCategory}
                          disabled={!newContent.newCategoryInput.trim()}
                          variant="outline"
                          className="border-[#800020] text-[#800020] hover:bg-[#FFF2F2]"
                        >
                          <Plus className="mr-1 h-4 w-4" />
                          Adicionar
                        </Button>
                      </div>

                      {newContent.categories.length > 0 && (
                        <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 animate-fade-in">
                          {newContent.categories.map((cat) => (
                            <Badge
                              key={cat}
                              className="flex items-center gap-1.5 rounded-full border border-[#800020]/15 bg-[#800020]/5 px-3 py-1.5 text-xs text-[#800020]"
                            >
                              {getCategoryLabel(cat)}
                              <button
                                type="button"
                                onClick={() => handleRemoveCategory(cat)}
                                aria-label={`Remover categoria ${getCategoryLabel(cat)}`}
                                className="ml-1 transition-colors hover:text-[#5C0016]"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </section>
                </div>

                <aside className="space-y-5 lg:sticky lg:top-4">
                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-5 border-b border-slate-100 pb-4">
                      <p className="text-xs font-extrabold uppercase tracking-wider text-[#264653]">Etapa 4</p>
                      <h3 className="text-xl font-black text-slate-950">Mídia</h3>
                      <p className="mt-1 text-xs font-medium text-slate-500">Adicione os ficheiros que dão presença à publicação.</p>
                    </div>

                    <div className="space-y-5">
                      {newContent.type !== "video" && (
                        <div>
                          <Label className="mb-2 block text-sm font-semibold text-slate-800">
                            Imagem de capa
                          </Label>
                          <div
                            className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/80 p-6 text-center transition-all hover:border-[#800020]/40 hover:bg-[#800020]/[0.025]"
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={(event) => {
                              event.preventDefault();
                              handleCoverOrMediaFile(event.dataTransfer.files?.[0] || null);
                            }}
                          >
                            <input
                              type="file"
                              accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                              onChange={(event) => handleCoverOrMediaFile(event.target.files?.[0] || null)}
                              className="hidden"
                              id="image-upload"
                            />
                            <label htmlFor="image-upload" className="block cursor-pointer">
                              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#800020] shadow-sm">
                                <ImageIcon className="h-7 w-7" />
                              </div>
                              <p className="text-base font-black text-slate-900 break-words">
                                {newContent.coverImageName || "Arraste a imagem para aqui"}
                              </p>
                              <p className="mt-2 text-xs font-semibold text-slate-500">ou</p>
                              <span className="mt-2 inline-flex rounded-xl bg-[#800020] px-4 py-2 text-xs font-bold text-white shadow-sm">
                                Selecionar ficheiro
                              </span>
                              <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-slate-400">PNG • JPG • WebP • Até 5 MB</p>
                            </label>
                            {newContent.coverPreviewUrl && (
                              <div className="relative mt-4 flex w-full justify-center">
                                <img src={newContent.coverPreviewUrl} alt="Pré-visualização" className="max-h-64 max-w-full rounded-xl object-contain shadow-sm" />
                              </div>
                            )}
                          </div>
                          {/* Input de URL de imagem externa */}
                          <div className="mt-3">
                            <Label className="mb-1.5 block text-xs font-semibold text-slate-600">
                              Ou cole um link de imagem
                            </Label>
                            <input
                              type="url"
                              placeholder="https://exemplo.com/imagem.jpg"
                              value={/^https?:\/\//i.test(newContent.coverPreviewUrl) ? newContent.coverPreviewUrl : ""}
                              onChange={(e) => {
                                const val = e.target.value.trim();
                                setNewContent({ ...newContent, coverPreviewUrl: val, coverImageFile: null, coverImageName: val ? "Imagem externa" : "" });
                              }}
                              onBlur={(e) => resolverImagemExterna(e.target.value.trim(), 'capa')}
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]"
                            />
                            <p className="mt-1 text-[11px] text-slate-400">
                              Também aceita links de páginas como Pinterest — vamos tentar encontrar a imagem automaticamente.
                            </p>
                            {aResolverImagem.capa && (
                              <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-[#800020]">
                                <Loader2 className="h-3 w-3 animate-spin" /> A procurar a imagem nesse link...
                              </p>
                            )}
                            {erroResolverImagem.capa && (
                              <p className="mt-1 text-xs font-medium text-red-600">{erroResolverImagem.capa}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {newContent.type === "video" && (
                        <>
                          <div>
                            <Label className="mb-2 block text-sm font-semibold text-slate-800">
                              Vídeo
                            </Label>
                            <div
                              className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/80 p-6 text-center transition-all hover:border-[#800020]/40 hover:bg-[#800020]/[0.025]"
                              onDragOver={(event) => event.preventDefault()}
                              onDrop={(event) => {
                                event.preventDefault();
                                handleCoverOrMediaFile(event.dataTransfer.files?.[0] || null);
                              }}
                            >
                              <input
                                type="file"
                                accept=".mp4,.webm,.mov,video/mp4,video/webm,video/quicktime"
                                onChange={(event) => handleCoverOrMediaFile(event.target.files?.[0] || null)}
                                className="hidden"
                                id="video-upload"
                              />
                              <label htmlFor="video-upload" className="block cursor-pointer">
                                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#800020] shadow-sm">
                                  <Video className="h-7 w-7" />
                                </div>
                                <p className="text-base font-black text-slate-900 break-words">
                                  {newContent.mediaFileName || "Arraste o vídeo para aqui"}
                                </p>
                                <p className="mt-2 text-xs font-semibold text-slate-500">ou</p>
                                <span className="mt-2 inline-flex rounded-xl bg-[#800020] px-4 py-2 text-xs font-bold text-white shadow-sm">
                                  Selecionar ficheiro
                                </span>
                                <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-slate-400">MP4 • MOV • WebM • Até 100 MB</p>
                              </label>
                              {newContent.mediaPreviewUrl && (
                                /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(newContent.mediaPreviewUrl) ? (
                                  <iframe
                                    src={`https://www.youtube.com/embed/${newContent.mediaPreviewUrl.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1] ?? ''}`}
                                    className="mt-4 w-full rounded-xl aspect-video"
                                    allowFullScreen
                                    title="YouTube preview"
                                  />
                                ) : (
                                  <video src={newContent.mediaPreviewUrl} controls className="mt-4 max-h-72 w-full rounded-xl bg-black" />
                                )
                              )}
                            </div>
                            {/* Input de URL YouTube */}
                            <div className="mt-3">
                              <Label className="mb-1.5 block text-xs font-semibold text-slate-600">
                                Ou cole um link do YouTube
                              </Label>
                              <input
                                type="url"
                                placeholder="https://www.youtube.com/watch?v=..."
                                value={/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(newContent.mediaPreviewUrl) ? newContent.mediaPreviewUrl : ""}
                                onChange={(e) => {
                                  const val = e.target.value.trim();
                                  const ytId = val.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1];
                                  // Sempre actualiza a capa quando o link YouTube muda e tem ID válido
                                  const thumbUrl = ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : "";
                                  setNewContent({
                                    ...newContent,
                                    mediaPreviewUrl: val,
                                    mediaFile: null,
                                    mediaFileName: val ? "YouTube" : "",
                                    videoCoverPreviewUrl: thumbUrl,
                                    videoCoverImage: thumbUrl ? null : newContent.videoCoverImage,
                                    videoCoverImageName: thumbUrl ? "Capa do YouTube" : newContent.videoCoverImageName,
                                  });
                                }}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]"
                              />
                            </div>
                          </div>

                          <div>
                            <Label className="mb-2 block text-sm font-semibold text-slate-800">
                              Imagem de capa do vídeo
                              <span className="ml-2 text-xs font-medium text-slate-400">Opcional</span>
                            </Label>
                            <div
                              className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/80 p-6 text-center transition-all hover:border-[#800020]/40 hover:bg-[#800020]/[0.025]"
                              onDragOver={(event) => event.preventDefault()}
                              onDrop={(event) => {
                                event.preventDefault();
                                handleVideoCoverImage(event.dataTransfer.files?.[0] || null);
                              }}
                            >
                              <input
                                type="file"
                                accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                                onChange={(event) => handleVideoCoverImage(event.target.files?.[0] || null)}
                                className="hidden"
                                id="video-cover-upload"
                              />
                              <label htmlFor="video-cover-upload" className="block cursor-pointer">
                                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#800020] shadow-sm">
                                  <ImageIcon className="h-7 w-7" />
                                </div>
                                <p className="text-base font-black text-slate-900 break-words">
                                  {newContent.videoCoverImageName || "Arraste a capa para aqui"}
                                </p>
                                <p className="mt-2 text-xs font-semibold text-slate-500">ou</p>
                                <span className="mt-2 inline-flex rounded-xl bg-[#800020] px-4 py-2 text-xs font-bold text-white shadow-sm">
                                  Selecionar ficheiro
                                </span>
                                <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-slate-400">PNG • JPG • WebP • Até 5 MB</p>
                              </label>
                              {newContent.videoCoverPreviewUrl && (
                                <div className="relative mt-4 flex w-full justify-center">
                                  <img src={newContent.videoCoverPreviewUrl} alt="Pré-visualização da capa do vídeo" className="max-h-64 max-w-full rounded-xl object-contain shadow-sm" />
                                </div>
                              )}
                            </div>
                            {/* Input de URL de imagem externa para capa do vídeo */}
                            <div className="mt-3">
                              <Label className="mb-1.5 block text-xs font-semibold text-slate-600">
                                Ou cole um link de imagem
                              </Label>
                              <input
                                type="url"
                                placeholder="https://exemplo.com/capa.jpg"
                                value={/^https?:\/\//i.test(newContent.videoCoverPreviewUrl) ? newContent.videoCoverPreviewUrl : ""}
                                onChange={(e) => {
                                  const val = e.target.value.trim();
                                  setNewContent({ ...newContent, videoCoverPreviewUrl: val, videoCoverImage: null, videoCoverImageName: val ? "Imagem externa" : "" });
                                }}
                                onBlur={(e) => resolverImagemExterna(e.target.value.trim(), 'video')}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]"
                              />
                              <p className="mt-1 text-[11px] text-slate-400">
                                Também aceita links de páginas como Pinterest — vamos tentar encontrar a imagem automaticamente.
                              </p>
                              {aResolverImagem.video && (
                                <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-[#800020]">
                                  <Loader2 className="h-3 w-3 animate-spin" /> A procurar a imagem nesse link...
                                </p>
                              )}
                              {erroResolverImagem.video && (
                                <p className="mt-1 text-xs font-medium text-red-600">{erroResolverImagem.video}</p>
                              )}
                            </div>
                          </div>
                        </>
                      )}

                      {newContent.type === "podcast" && (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                          <h4 className="mb-4 flex items-center gap-2 text-base font-black text-slate-950">
                            <Headphones className="h-5 w-5 text-[#800020]" />
                            Episódios do Podcast
                          </h4>

                          {newContent.episodes.length > 0 && (
                            <div className="mb-4 max-h-48 space-y-2 overflow-y-auto">
                              {newContent.episodes.map((ep) => (
                                <div key={ep.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-slate-900">{ep.title}</p>
                                    <p className="text-xs text-slate-500">{ep.duration} · {ep.date}</p>
                                    {ep.audioFileName && (
                                      <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-green-600">
                                        <FileAudio className="h-3.5 w-3.5" />
                                        {ep.audioFileName}
                                      </p>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveEpisode(ep.id)}
                                    aria-label={`Remover episódio ${ep.title}`}
                                    className="ml-2 rounded-lg p-1 text-[#800020] transition hover:bg-[#FFF2F2] hover:text-[#5C0016]"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
                            <Input
                              aria-label="Título do episódio"
                              placeholder="Título do episódio"
                              value={newContent.newEpisode.title}
                              onChange={(e) =>
                                setNewContent({
                                  ...newContent,
                                  newEpisode: { ...newContent.newEpisode, title: e.target.value },
                                })
                              }
                              className="focus:ring-2 focus:ring-[#800020]"
                            />
                            <div className="flex flex-col gap-3 sm:flex-row">
                              <Input
                                aria-label="Duração do episódio"
                                placeholder="Duração (ex: 20:15)"
                                value={newContent.newEpisode.duration}
                                onChange={(e) => handleEpisodeDurationChange(e.target.value)}
                                className="flex-1 focus:ring-2 focus:ring-[#800020]"
                              />
                              <Input
                                aria-label="Data do episódio"
                                placeholder="Data (ex: 04/06/2026)"
                                value={newContent.newEpisode.date}
                                onChange={(e) => handleEpisodeDateChange(e.target.value)}
                                className="flex-1 focus:ring-2 focus:ring-[#800020]"
                              />
                            </div>
                            <div
                              className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 text-center transition-all hover:border-[#800020]/35 hover:bg-[#800020]/[0.025]"
                              onDragOver={(event) => event.preventDefault()}
                              onDrop={(event) => {
                                event.preventDefault();
                                handleAudioFile(event.dataTransfer.files?.[0] || null);
                              }}
                            >
                              <input
                                type="file"
                                accept=".mp3,.wav,.aac,.m4a,audio/mpeg,audio/wav,audio/x-wav,audio/aac,audio/mp4"
                                onChange={(e) => handleAudioFile(e.target.files?.[0] || null)}
                                className="hidden"
                                id="audio-upload"
                              />
                              <label htmlFor="audio-upload" className="block cursor-pointer">
                                <Music className="mx-auto mb-2 h-6 w-6 text-[#800020]" />
                                <p className="text-xs font-bold text-slate-800">
                                  {newContent.newEpisode.audioFileName || "Arraste o áudio para aqui"}
                                </p>
                                <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">MP3 • WAV • AAC • M4A</p>
                              </label>
                              {newContent.newEpisode.audioUrl && (
                                <audio src={newContent.newEpisode.audioUrl} controls className="mt-3 w-full" />
                              )}
                            </div>
                            <Textarea
                              aria-label="Descrição do episódio"
                              placeholder="Descrição do episódio"
                              value={newContent.newEpisode.description}
                              onChange={(e) =>
                                setNewContent({
                                  ...newContent,
                                  newEpisode: { ...newContent.newEpisode, description: e.target.value },
                                })
                              }
                              rows={2}
                              className="resize-none focus:ring-2 focus:ring-[#800020]"
                            />
                            <Button
                              type="button"
                              onClick={handleAddEpisode}
                              disabled={
                                !newContent.newEpisode.title ||
                                !isEpisodeDurationValid(newContent.newEpisode.duration) ||
                                (!!newContent.newEpisode.date && !isEpisodeDateValid(newContent.newEpisode.date))
                              }
                              className="w-full bg-slate-800 text-white hover:bg-slate-900"
                              size="sm"
                            >
                              <Plus className="mr-1 h-4 w-4" /> Adicionar Episódio
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                </aside>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              <div className="animate-fade-in rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-[#800020] rounded-full flex items-center justify-center text-white font-bold text-xl shadow-sm">
                    {getCurrentUserInitials()}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-lg">{getCurrentUserName()}</p>
                    <p className="text-sm text-slate-500">Agora mesmo</p>
                  </div>
                </div>

                {newContent.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {newContent.categories.map((cat) => (
                      <span key={cat} className="inline-block rounded-full border border-[#800020]/15 bg-[#800020]/5 px-3 py-1 text-xs font-medium text-[#800020]">
                        {getCategoryLabel(cat)}
                      </span>
                    ))}
                  </div>
                )}

                {/* Imagem de capa no Preview - estilo responsivo */}
                {newContent.coverPreviewUrl && newContent.type !== "video" && (
                  <div className="relative w-full flex justify-center mb-4">
                    <img 
                      src={newContent.coverPreviewUrl} 
                      alt="Preview da capa" 
                      className="max-w-full h-auto max-h-[50vh] object-contain rounded-lg shadow-sm"
                    />
                  </div>
                )}

                {newContent.type === "video" && newContent.videoCoverPreviewUrl && (
                  <div className="relative w-full flex justify-center mb-4">
                    <img 
                      src={newContent.videoCoverPreviewUrl} 
                      alt="Preview da capa do vídeo" 
                      className="max-w-full h-auto max-h-[50vh] object-contain rounded-lg shadow-sm"
                    />
                  </div>
                )}

                <h3 className="text-3xl font-bold text-slate-900 mb-4">
                  {newContent.title || "Título do conteúdo"}
                </h3>

                {newContent.type === "podcast" && newContent.episodes.length > 0 && (
                  <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-700 mb-2">Episódios:</p>
                    <div className="space-y-1">
                      {newContent.episodes.map((ep, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                          <Play className="w-3 h-3 text-[#800020]" />
                          <span className="font-medium">{ep.title}</span>
                          <span className="text-slate-400">· {ep.duration}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {newContent.type === "video" && newContent.mediaPreviewUrl && (
                  /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(newContent.mediaPreviewUrl) ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${newContent.mediaPreviewUrl.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1] ?? ''}`}
                      className="w-full rounded-lg mb-4 aspect-video"
                      allowFullScreen
                      title="YouTube preview"
                    />
                  ) : (
                    <video src={newContent.mediaPreviewUrl} controls className="w-full rounded-lg mb-4 max-h-96 shadow-inner" />
                  )
                )}

                <div className="prose prose-slate max-w-none">
                  <SanitizedHtml
                    html={newContent.description || "Nenhuma descrição adicionada ainda..."}
                    className="text-slate-700 whitespace-pre-wrap leading-relaxed text-base"
                  />
                </div>
              </div>
            </div>
          )}
          </div>

          <DialogFooter className="z-10 shrink-0 gap-3 border-t bg-white px-4 py-4 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] sm:px-8 sm:py-5">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false);
                setModoAdicao("editor");
                setAddContentSubmitAttempted(false);
                resetContentForm();
              }}
              className="h-11 px-6 transition hover:bg-slate-100"
            >
              Cancelar
            </Button>
            <Button onClick={submitAddContentForm} className="h-11 bg-[#800020] px-8 text-sm font-black text-white shadow-lg shadow-[#800020]/20 transition hover:bg-[#5C0016]">
              <Upload className="mr-2 h-4 w-4" />
              {editingContentId ? "Guardar alterações" : "Publicar Conteúdo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Pedidos de Acesso Jindungo (para o criador) */}
      <Dialog open={isAccessRequestsModalOpen} onOpenChange={setIsAccessRequestsModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              Pedidos de Acesso — Textos com Jindungo
            </DialogTitle>
            <DialogDescription>
              Pedidos de acesso aos seus conteúdos exclusivos. Só você os vê.
            </DialogDescription>
          </DialogHeader>

          {isLoadingAccessRequests ? (
            <div className="py-12 text-center text-slate-400 text-sm">A carregar pedidos…</div>
          ) : accessRequestsList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">Nenhum pedido de acesso recebido ainda.</div>
          ) : (
            <div className="space-y-3 mt-2">
              {accessRequestsList.map((pedido) => (
                <div key={pedido.id} className="rounded-xl border border-slate-200 p-4 bg-slate-50">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{pedido.usuario_nome}</p>
                      <p className="text-xs text-slate-500">{pedido.usuario_email}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Conteúdo: <span className="font-semibold text-slate-600">{pedido.conteudo_titulo}</span>
                      </p>
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex-shrink-0 ${
                      pedido.status === 'aprovado' ? 'bg-emerald-100 text-emerald-700'
                      : pedido.status === 'rejeitado' ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-700'
                    }`}>
                      {pedido.status === 'aprovado' ? 'Aprovado' : pedido.status === 'rejeitado' ? 'Rejeitado' : 'Pendente'}
                    </span>
                  </div>

                  {pedido.motivo && (
                    <p className="text-xs text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-2 mb-3 italic">
                      "{pedido.motivo}"
                    </p>
                  )}

                  {pedido.status === 'pendente' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => responderPedidoAcesso(pedido.id, 'aprovado')}
                        disabled={respondingRequestId === pedido.id}
                        className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        {respondingRequestId === pedido.id ? 'A processar…' : '✓ Aprovar'}
                      </button>
                      <button
                        onClick={() => responderPedidoAcesso(pedido.id, 'rejeitado')}
                        disabled={respondingRequestId === pedido.id}
                        className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        ✕ Rejeitar
                      </button>
                    </div>
                  )}

                  {pedido.status !== 'pendente' && pedido.respondido_em && (
                    <p className="text-[10px] text-slate-400 mt-1">
                      Respondido em {new Date(pedido.respondido_em).toLocaleDateString('pt-PT')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Denúncia */}
      <Dialog open={isReportModalOpen} onOpenChange={(open) => {
        setIsReportModalOpen(open);
        if (!open) setSelectedContentForReport(null);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Flag className="w-5 h-5 text-[#800020]" />
              Denunciar Conteúdo
            </DialogTitle>
            <DialogDescription>
              Ajude-nos a manter a comunidade segura. Por que motivo está a denunciar?
            </DialogDescription>
          </DialogHeader>

          {selectedContentForReport && getReportInfo(selectedContentForReport.id) ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">{selectedContentForReport.title}</p>
                <p className="mt-1 text-xs text-slate-600">A sua denúncia já está guardada e será mantida após atualizar a página.</p>
              </div>
              <ReportStatusPanel
                content={selectedContentForReport}
                getReportInfo={getReportInfo}
                getReportStatusLabel={getReportStatusLabel}
                formatDateTime={formatDateTime}
              />
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div>
                <Label className="text-sm font-medium text-slate-700 mb-2 block">
                  Motivo da Denúncia <span className="text-[#800020]">*</span>
                </Label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]"
                >
                  <option value="">Selecione um motivo...</option>
                  <option value="spam">Conteúdo de spam ou publicidade</option>
                  <option value="ofensivo">Conteúdo ofensivo ou inadequado</option>
                  <option value="desinformacao">Desinformação ou fake news</option>
                  <option value="direitos">Violação de direitos autorais</option>
                  <option value="outro">Outro motivo</option>
                </select>
              </div>

              <div>
                <Label htmlFor="reportDesc" className="text-sm font-medium text-slate-700 mb-2 block">
                  Descrição (Opcional)
                </Label>
                <Textarea
                  id="reportDesc"
                  placeholder="Forneça mais detalhes sobre a sua denúncia..."
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-3 sm:justify-end mt-4">
            <Button variant="outline" onClick={() => {
              setIsReportModalOpen(false);
              setSelectedContentForReport(null);
              setReportReason("");
              setReportDescription("");
            }}>
              Cancelar
            </Button>
            {selectedContentForReport && getReportInfo(selectedContentForReport.id) ? null : (
              <Button onClick={handleReport} className="bg-[#800020] hover:bg-[#5C0016]">
                Enviar Denúncia
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AuthPrompt Modal */}
      <AuthPrompt
        open={showAuthPrompt}
        onOpenChange={setShowAuthPrompt}
        action={authAction}
      />

      {/* Vista Fullscreen de conteúdo */}
      <AnimatePresence>
        {fullscreenContent && (
          <FullscreenContent
            content={fullscreenContent}
            allContents={currentDisplayContents}
            onClose={() => setFullscreenContent(null)}
            onNavigate={(c) => {
              updateViews(c.id);
              setViewedHistory(prev => [c, ...prev.filter(i => i.id !== c.id)].slice(0, 12));
              setFullscreenContent(c);
            }}
            onSaveToggle={handleSaveToggle}
            isSaved={!!savedContents[fullscreenContent.id]}
            onPlayEpisode={(ep, podcast) => {
              setPlayingEpisode(ep);
              setPlayingPodcastTitle(podcast.title);
              setPlayingPodcastThumbnail(podcast.thumbnail || "");
            }}
            categoryLabels={categoryLabels}
            playerBar={
              fullscreenContent.type === 'podcast' && playingEpisode ? (
                <PodcastPlayerBar
                  playingEpisode={playingEpisode}
                  playingPodcastTitle={playingPodcastTitle}
                  playingPodcastThumbnail={playingPodcastThumbnail}
                  isAudioPlaying={isAudioPlaying}
                  audioProgress={audioProgress}
                  audioCurrentTime={audioCurrentTime}
                  audioDuration={audioDuration}
                  isMuted={isMuted}
                  audioRef={audioRef}
                  onPlayPause={() => setIsAudioPlaying(!isAudioPlaying)}
                  onStop={stopAudioPlayer}
                  onPrev={() => playAdjacentPlaylistItem(-1)}
                  onNext={() => playAdjacentPlaylistItem(1)}
                  onSeek={seekAudioToPercentage}
                  onMuteToggle={() => setIsMuted(!isMuted)}
                  formatAudioTime={formatAudioTime}
                  inline
                />
              ) : undefined
            }
          />
        )}
      </AnimatePresence>

    </div>
  );
}
