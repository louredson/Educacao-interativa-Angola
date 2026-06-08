import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../services/api';
import { useNavigate, Link } from 'react-router';
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import {
  LayoutDashboard,
  Users,
  FileText,
  Trophy,
  PlusCircle,
  BarChart3,
  Trash2,
  Edit,
  Shield,
  MessageSquare,
  BookOpen,
  TrendingUp,
  UserCheck,
  FileQuestion,
  Eye,
  Image,
  Calendar,
  Activity,
  Video,
  Mic,
  Headphones,
  Globe,
  Lock,
  Upload,
  Music,
  FileAudio,
  Play,
  X,
  List,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  Mail,
  MapPin,
  Clock,
  Star,
  Award,
  Building,
  GraduationCap,
  PenLine,
  LogOut,
  Home,
  Compass,
  HelpCircle,
  ChevronLeft,
  Menu,
  BookOpen as BookOpenIcon,
  Inbox,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface PodcastEpisode {
  id: string;
  title: string;
  duration: string;
  description: string;
  date: string;
  audioFile?: File | null;
  audioFileName?: string;
}

interface PublishedArticle {
  id: string;
  title: string;
  description: string;
  content: string;
  type: string;
  createdAt: string;
  createdBy: string;
  imageUrl?: string;
  imageFile?: File | null;
  imageFileName?: string;
  references?: string;
  observations?: string;
  videoUrl?: string;
  videoDuration?: string;
  videoFileName?: string;
  podcastHost?: string;
  podcastCategory?: string;
  episodes?: PodcastEpisode[];
}

interface PublishedTopic {
  id: string;
  title: string;
  description: string;
  type: string;
  topicType: 'public' | 'private';
  topicCategory: string;
  createdAt: string;
  createdBy: string;
  imageUrl?: string;
  imageFile?: File | null;
  imageFileName?: string;
  references?: string;
}

export default function AdminDashboard() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState<any[]>([]);
  const [contents, setContents] = useState<any[]>([]);
  const [ranking, setRanking] = useState<any[]>([]);
  const [contentType, setContentType] = useState<string>('texto_normal');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ── Stats reais da BD ────────────────────────────────────────────────────
  const [dashboardStats, setDashboardStats] = useState({
    total_utilizadores: 0,
    total_conteudos: 0,
    total_quizzes: 0,
    total_perguntas_quiz: 0,
    total_topicos: 0,
    total_respostas_forum: 0,
    total_tentativas_quiz: 0,
    novos_hoje: 0,
  });
  
  // Image upload state
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Video upload state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoFileName, setVideoFileName] = useState<string>('');
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Articles and Topics modals
  const [articlesModalOpen, setArticlesModalOpen] = useState(false);
  const [topicsModalOpen, setTopicsModalOpen] = useState(false);
  const [editArticleModalOpen, setEditArticleModalOpen] = useState(false);
  const [editTopicModalOpen, setEditTopicModalOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<PublishedArticle | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<PublishedTopic | null>(null);
  const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);

  // ── Estado criação de Quiz ────────────────────────────────────────────────
  const [quizList, setQuizList] = useState<any[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [quizForm, setQuizForm] = useState({
    titulo: '', descricao: '', categoria: '', thumbnail_filename: '',
  });
  const [quizPerguntas, setQuizPerguntas] = useState<{
    pergunta: string; opcao_a: string; opcao_b: string;
    opcao_c: string; opcao_d: string; resposta_correta: number; explicacao: string;
  }[]>([{
    pergunta: '', opcao_a: '', opcao_b: '', opcao_c: '', opcao_d: '',
    resposta_correta: 1, explicacao: '',
  }]);
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState<number | null>(null);
  const [deleteQuizId, setDeleteQuizId] = useState<number | null>(null);
  const [deleteQuizModalOpen, setDeleteQuizModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'article' | 'topic'; id: string } | null>(null);

  // ── Estado de Solicitações de Acesso ────────────────────────────────────────
  const [solicitacoes, setSolicitacoes] = useState<{
    jindungo: any[]; topicos: any[]; total_pendentes: number;
  }>({ jindungo: [], topicos: [], total_pendentes: 0 });
  const [loadingSolicitacoes, setLoadingSolicitacoes] = useState(false);
  const [respondendoId, setRespondendoId] = useState<string | null>(null);
  const [solFiltro, setSolFiltro] = useState<'todos' | 'pendente' | 'aprovado' | 'rejeitado'>('pendente');

  // ── Denúncias ────────────────────────────────────────────────────────────
  const [denuncias, setDenuncias] = useState<any[]>([]);
  const [loadingDenuncias, setLoadingDenuncias] = useState(false);
  const [resolvingDenunciaId, setResolvingDenunciaId] = useState<string | null>(null);

  const carregarDenuncias = async () => {
    setLoadingDenuncias(true);
    try {
      const data = await apiRequest<any[]>('/admin/denuncias');
      setDenuncias(data ?? []);
    } catch { /* silencioso */ }
    finally { setLoadingDenuncias(false); }
  };

  const resolverDenuncia = async (id: string, status: 'ignorada' | 'removida' | 'banido', observacoes?: string) => {
    setResolvingDenunciaId(id);
    try {
      await apiRequest(`/admin/denuncias/${id}`, { method: 'PATCH', json: { status, observacoes: observacoes ?? null } });
      setDenuncias(prev => prev.filter(d => d.id !== id));
    } catch { alert('Não foi possível resolver a denúncia.'); }
    finally { setResolvingDenunciaId(null); }
  };

  // User detail modal
  const [userDetailModalOpen, setUserDetailModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  // Edit form states
  const [editArticleForm, setEditArticleForm] = useState({
    title: '',
    description: '',
    content: '',
    references: '',
    observations: '',
    imageUrl: '',
    videoUrl: '',
    videoDuration: '',
    podcastHost: '',
    podcastCategory: '',
    episodes: [] as PodcastEpisode[],
    newEpisode: { 
      title: '', 
      duration: '', 
      description: '', 
      date: '', 
      audioFile: null as File | null, 
      audioFileName: '' 
    },
  });
  const [editTopicForm, setEditTopicForm] = useState({
    title: '',
    description: '',
    topicCategory: 'Economia',
    topicType: 'public' as 'public' | 'private',
    references: '',
    imageUrl: '',
  });

  const [editCoverImageFile, setEditCoverImageFile] = useState<File | null>(null);
  const [editCoverImagePreview, setEditCoverImagePreview] = useState<string | null>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  
  const [newContent, setNewContent] = useState({
    title: '',
    type: 'texto_normal',
    description: '',
    content: '',
    references: '',
    imageUrl: '',
    observations: '',
    videoUrl: '',
    videoDuration: '',
    podcastHost: '',
    podcastCategory: '',
    topicType: 'public' as 'public' | 'private',
    topicCategory: 'Economia',
    episodes: [] as PodcastEpisode[],
    newEpisode: { 
      title: '', 
      duration: '', 
      description: '', 
      date: '', 
      audioFile: null as File | null, 
      audioFileName: '' 
    },
  });

  const contentTypes = [
    { id: 'texto_normal', label: 'Texto Normal', icon: FileText, description: 'Artigos e textos educativos de acesso livre' },
    { id: 'texto_jindungo', label: 'Texto com Jindungo', icon: BookOpen, description: 'Conteúdos exclusivos que requerem aprovação para acesso' },
    { id: 'video', label: 'Vídeo', icon: Video, description: 'Conteúdos em formato de vídeo' },
    { id: 'podcast', label: 'Podcast', icon: Headphones, description: 'Conteúdos em formato de áudio com episódios' },
    { id: 'topico', label: 'Tópicos', icon: MessageSquare, description: 'Tópicos de discussão públicos ou privados' },
  ];

  const handleAdminLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    if (!isAuthenticated || !user?.isAdmin) {
      navigate('/');
      return;
    }
    void loadData();
  }, [isAuthenticated, user, navigate]);

  const loadData = async () => {
    const currentUser = user ? { 'x-user-id': String(user.id) } : undefined;

    // Stats reais da BD
    try {
      const statsData = await apiRequest<any>('/admin/stats');
      setDashboardStats(statsData ?? {});
    } catch { /* silencioso */ }

    // Utilizadores
    try {
      const usersResponse = await apiRequest<any[]>('/users', { headers: currentUser });
      setUsers(usersResponse.map((item) => ({ ...item, id: String(item.id) })));
    } catch (error) {
      console.error('Erro ao carregar utilizadores:', error);
      setUsers([]);
    }

    // Ranking via API
    try {
      const rankingData = await apiRequest<any[]>('/ranking');
      setRanking(rankingData.map((r: any) => ({
        name: r.nome,
        score: Number(r.pontuacao_total ?? 0),
        quizzes: Number(r.quizzes_completados ?? 0),
        province: r.provincia ?? '',
        institution: '',
        course: '',
      })));
    } catch { /* silencioso */ }

    // Quizzes
    try {
      const quizData = await apiRequest<any[]>('/quizzes');
      setQuizList(quizData ?? []);
    } catch { /* silencioso */ }
    finally { setLoadingQuizzes(false); }

    // Solicitações de acesso
    setLoadingSolicitacoes(true);
    try {
      const solData = await apiRequest<any>('/admin/solicitacoes');
      setSolicitacoes(solData ?? { jindungo: [], topicos: [], total_pendentes: 0 });
    } catch { /* silencioso */ }
    finally { setLoadingSolicitacoes(false); }

    // Conteúdos + Tópicos via API
    try {
      const [conteudosData, topicosData] = await Promise.all([
        apiRequest<any[]>('/conteudos'),
        apiRequest<any[]>('/topicos'),
      ]);
      const conteudosMapped = (conteudosData ?? []).map((c: any) => ({
        id: String(c.id),
        title: c.titulo,
        type: c.tipo ?? 'texto_normal',
        description: c.descricao ?? '',
        content: c.conteudo_completo ?? '',
        createdAt: c.publicado_em ?? new Date().toISOString(),
        createdBy: String(c.publicado_por ?? 'Admin'),
        status: 'published',
        imageUrl: c.imagem_filename ?? '',
        imageFileName: c.imagem_filename ?? null,
        observations: '',
        references: '',
        videoUrl: c.url_recurso ?? '',
        videoDuration: c.duracao ?? '',
        podcastHost: c.apresentador ?? '',
        podcastCategory: c.categoria_podcast ?? '',
        episodes: [],
        topicType: 'public' as 'public' | 'private',
        topicCategory: c.categoria ?? 'Geral',
      }));
      const topicosMapped = (topicosData ?? []).map((t: any) => ({
        id: String(t.id),
        title: t.titulo,
        type: 'topico',
        description: t.descricao ?? '',
        content: t.descricao ?? '',
        createdAt: t.criado_em ?? new Date().toISOString(),
        createdBy: t.autor_nome ?? String(t.criado_por ?? 'Utilizador'),
        status: 'published',
        imageUrl: '',
        imageFileName: null,
        observations: '',
        references: '',
        videoUrl: '',
        videoDuration: '',
        podcastHost: '',
        podcastCategory: '',
        episodes: [],
        topicType: (t.tipo_privacidade === 'privado' ? 'private' : 'public') as 'public' | 'private',
        topicCategory: t.categoria ?? 'Geral',
      }));
      setContents([...conteudosMapped, ...topicosMapped]);
    } catch { setContents([]); }
  };

  const getArticles = () => {
    return contents.filter(c => 
      c.type === 'texto_normal' || 
      c.type === 'texto_jindungo' || 
      c.type === 'video' || 
      c.type === 'podcast'
    );
  };

  const getTopics = () => {
    return contents.filter(c => c.type === 'topico');
  };

  // Função para obter contagem de artigos e tópicos por usuário
  const getUserContentCounts = (userName: string) => {
    const userArticles = contents.filter(c => 
      c.createdBy === userName && 
      (c.type === 'texto_normal' || c.type === 'texto_jindungo' || c.type === 'video' || c.type === 'podcast')
    );
    const userTopics = contents.filter(c => 
      c.createdBy === userName && c.type === 'topico'
    );
    return { articles: userArticles.length, topics: userTopics.length };
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setCoverImageFile(null);
    setCoverImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditCoverImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveEditImage = () => {
    setEditCoverImageFile(null);
    setEditCoverImagePreview(null);
    if (editFileInputRef.current) {
      editFileInputRef.current.value = '';
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setVideoFileName(file.name);
    }
  };

  const handleRemoveVideo = () => {
    setVideoFile(null);
    setVideoFileName('');
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  };

  const handleContentTypeChange = (type: string) => {
    setContentType(type);
    setCoverImageFile(null);
    setCoverImagePreview(null);
    setVideoFile(null);
    setVideoFileName('');
    setNewContent({
      ...newContent,
      type: type,
      videoUrl: '',
      videoDuration: '',
      podcastHost: '',
      podcastCategory: '',
      topicType: 'public',
      topicCategory: 'Economia',
      episodes: [],
      newEpisode: { 
        title: '', 
        duration: '', 
        description: '', 
        date: '', 
        audioFile: null, 
        audioFileName: '' 
      },
    });
  };

  const handleAddEpisode = () => {
    if (newContent.newEpisode.title && newContent.newEpisode.duration) {
      const episode: PodcastEpisode = {
        id: String(Date.now()),
        title: newContent.newEpisode.title,
        duration: newContent.newEpisode.duration,
        description: newContent.newEpisode.description,
        date: newContent.newEpisode.date || new Date().toLocaleDateString('pt-AO', { day: 'numeric', month: 'short', year: 'numeric' }),
        audioFile: newContent.newEpisode.audioFile,
        audioFileName: newContent.newEpisode.audioFileName,
      };
      setNewContent({
        ...newContent,
        episodes: [...newContent.episodes, episode],
        newEpisode: { title: '', duration: '', description: '', date: '', audioFile: null, audioFileName: '' },
      });
    }
  };

  const handleRemoveEpisode = (episodeId: string) => {
    setNewContent({
      ...newContent,
      episodes: newContent.episodes.filter((ep) => ep.id !== episodeId),
    });
  };

  const handleEditAddEpisode = () => {
    if (editArticleForm.newEpisode.title && editArticleForm.newEpisode.duration) {
      const episode: PodcastEpisode = {
        id: String(Date.now()),
        title: editArticleForm.newEpisode.title,
        duration: editArticleForm.newEpisode.duration,
        description: editArticleForm.newEpisode.description,
        date: editArticleForm.newEpisode.date || new Date().toLocaleDateString('pt-AO', { day: 'numeric', month: 'short', year: 'numeric' }),
        audioFile: editArticleForm.newEpisode.audioFile,
        audioFileName: editArticleForm.newEpisode.audioFileName,
      };
      setEditArticleForm({
        ...editArticleForm,
        episodes: [...editArticleForm.episodes, episode],
        newEpisode: { title: '', duration: '', description: '', date: '', audioFile: null, audioFileName: '' },
      });
    }
  };

  const handleEditRemoveEpisode = (episodeId: string) => {
    setEditArticleForm({
      ...editArticleForm,
      episodes: editArticleForm.episodes.filter((ep) => ep.id !== episodeId),
    });
  };

  const handleCreateContent = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (contentType === 'video' && !newContent.videoUrl && !videoFile) {
      alert('Por favor, insira o URL do vídeo ou faça upload de um arquivo.');
      return;
    }
    
    if (contentType === 'podcast' && newContent.episodes.length === 0) {
      alert('Por favor, adicione pelo menos um episódio ao podcast.');
      return;
    }

    if (contentType === 'topico' && !newContent.topicCategory) {
      alert('Por favor, selecione uma categoria para o tópico.');
      return;
    }

    const finalImageUrl = coverImageFile 
      ? `uploaded_${coverImageFile.name}` 
      : newContent.imageUrl;

    const newContentItem = {
      id: Math.random().toString(36).substring(2, 9),
      title: newContent.title,
      type: newContent.type,
      description: newContent.description,
      content: newContent.content,
      references: newContent.references,
      imageUrl: finalImageUrl,
      imageFileName: coverImageFile?.name || null,
      observations: newContent.observations,
      videoUrl: newContent.videoUrl,
      videoDuration: newContent.videoDuration,
      videoFileName: videoFileName || null,
      podcastHost: newContent.podcastHost,
      podcastCategory: newContent.podcastCategory,
      episodes: newContent.episodes,
      topicType: newContent.topicType,
      topicCategory: newContent.topicCategory,
      createdAt: new Date().toISOString(),
      createdBy: user?.name || 'Admin',
      status: 'published'
    };

    const updatedContents = [...contents, newContentItem];
    setContents(updatedContents);

    // Persiste na API
    if (contentType === 'topico') {
      apiRequest('/topicos', {
        method: 'POST',
        json: {
          titulo: newContent.title,
          descricao: newContent.description,
          tipo_privacidade: newContent.topicType === 'private' ? 'privado' : 'publico',
          categoria: newContent.topicCategory,
        },
      }).then(() => void loadData()).catch(() => null);
    } else {
      apiRequest('/conteudos', {
        method: 'POST',
        json: {
          titulo: newContent.title,
          descricao: newContent.description,
          tipo: contentType,
          categoria: newContent.topicCategory ?? 'Geral',
          conteudo_completo: newContent.content,
          url_recurso: newContent.videoUrl,
          duracao: newContent.videoDuration,
          apresentador: newContent.podcastHost,
          categoria_podcast: newContent.podcastCategory,
          imagem_filename: finalImageUrl || null,
        },
      }).then(() => void loadData()).catch(() => null);
    }

    setNewContent({
      title: '',
      type: 'texto_normal',
      description: '',
      content: '',
      references: '',
      imageUrl: '',
      observations: '',
      videoUrl: '',
      videoDuration: '',
      podcastHost: '',
      podcastCategory: '',
      topicType: 'public',
      topicCategory: 'Economia',
      episodes: [],
      newEpisode: { 
        title: '', 
        duration: '', 
        description: '', 
        date: '', 
        audioFile: null, 
        audioFileName: '' 
      },
    });
    setCoverImageFile(null);
    setCoverImagePreview(null);
    setVideoFile(null);
    setVideoFileName('');
    setContentType('texto_normal');

    alert('Conteúdo criado com sucesso!');
  };

  const handleEditArticle = (article: PublishedArticle) => {
    setSelectedArticle(article);
    setEditCoverImageFile(null);
    setEditCoverImagePreview(null);
    setEditArticleForm({
      title: article.title || '',
      description: article.description || '',
      content: article.content || '',
      references: article.references || '',
      observations: article.observations || '',
      imageUrl: article.imageUrl || '',
      videoUrl: article.videoUrl || '',
      videoDuration: article.videoDuration || '',
      podcastHost: article.podcastHost || '',
      podcastCategory: article.podcastCategory || '',
      episodes: article.episodes || [],
      newEpisode: { 
        title: '', 
        duration: '', 
        description: '', 
        date: '', 
        audioFile: null, 
        audioFileName: '' 
      },
    });
    setEditArticleModalOpen(true);
  };

  const handleSaveArticleEdit = () => {
    if (!selectedArticle) return;
    const finalImageUrl = editCoverImageFile 
      ? `uploaded_${editCoverImageFile.name}` 
      : editArticleForm.imageUrl;

    const updatedContents = contents.map(c => 
      c.id === selectedArticle.id 
        ? { 
            ...c, 
            title: editArticleForm.title,
            description: editArticleForm.description,
            content: editArticleForm.content,
            references: editArticleForm.references,
            observations: editArticleForm.observations,
            imageUrl: finalImageUrl,
            imageFileName: editCoverImageFile?.name || c.imageFileName,
            videoUrl: editArticleForm.videoUrl,
            videoDuration: editArticleForm.videoDuration,
            podcastHost: editArticleForm.podcastHost,
            podcastCategory: editArticleForm.podcastCategory,
            episodes: editArticleForm.episodes,
          }
        : c
    );
    setContents(updatedContents);
    // Persiste na API
    apiRequest(`/conteudos/${selectedArticle.id}`, {
      method: 'PUT',
      json: {
        titulo: editArticleForm.title,
        descricao: editArticleForm.description,
        conteudo_completo: editArticleForm.content,
        url_recurso: editArticleForm.videoUrl,
        duracao: editArticleForm.videoDuration,
        apresentador: editArticleForm.podcastHost,
        categoria_podcast: editArticleForm.podcastCategory,
        imagem_filename: finalImageUrl || null,
      },
    }).catch(() => null);
    setEditArticleModalOpen(false);
    setSelectedArticle(null);
    setEditCoverImageFile(null);
    setEditCoverImagePreview(null);
    alert('Artigo atualizado com sucesso!');
  };

  const handleEditTopic = (topic: PublishedTopic) => {
    setSelectedTopic(topic);
    setEditTopicForm({
      title: topic.title || '',
      description: topic.description || '',
      topicCategory: topic.topicCategory || 'Economia',
      topicType: topic.topicType || 'public',
      references: topic.references || '',
      imageUrl: topic.imageUrl || '',
    });
    setEditTopicModalOpen(true);
  };

  const handleSaveTopicEdit = () => {
    if (!selectedTopic) return;
    const updatedContents = contents.map(c => 
      c.id === selectedTopic.id 
        ? { 
            ...c, 
            title: editTopicForm.title,
            description: editTopicForm.description,
            topicCategory: editTopicForm.topicCategory,
            topicType: editTopicForm.topicType,
            references: editTopicForm.references,
            imageUrl: editTopicForm.imageUrl,
          }
        : c
    );
    setContents(updatedContents);
    // Persiste na API
    apiRequest(`/topicos/${selectedTopic.id}`, {
      method: 'PUT',
      json: {
        titulo: editTopicForm.title,
        descricao: editTopicForm.description,
        categoria: editTopicForm.topicCategory,
        tipo_privacidade: editTopicForm.topicType === 'private' ? 'privado' : 'publico',
      },
    }).catch(() => null);
    setEditTopicModalOpen(false);
    setSelectedTopic(null);
    alert('Tópico atualizado com sucesso!');
  };

  const handleDeleteClick = (type: 'article' | 'topic', id: string) => {
    setDeleteTarget({ type, id });
    setDeleteConfirmModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const updatedContents = contents.filter(c => c.id !== deleteTarget.id);
    setContents(updatedContents);
    setDeleteConfirmModalOpen(false);
    // Persiste na API
    const endpoint = deleteTarget.type === 'topic' ? `/topicos/${deleteTarget.id}` : `/conteudos/${deleteTarget.id}`;
    apiRequest(endpoint, { method: 'DELETE' }).catch(() => null);
    setDeleteTarget(null);
    alert(`${deleteTarget.type === 'article' ? 'Artigo' : 'Tópico'} removido com sucesso!`);
  };

  const handleDeleteContent = (id: string) => {
    handleDeleteClick(
      contents.find(c => c.id === id)?.type === 'topico' ? 'topic' : 'article',
      id
    );
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Tem certeza que deseja apagar este usuário?')) {
      try {
        await apiRequest(`/users/${id}`, {
          method: 'DELETE',
          headers: user ? { 'x-user-id': String(user.id) } : undefined,
        });
        setUsers((current) => current.filter((u) => String(u.id) !== String(id)));
      } catch (error) {
        console.error('Erro ao remover utilizador:', error);
        alert('Não foi possível apagar o utilizador.');
      }
    }
  };

  const handleViewUser = (userItem: any) => {
    setSelectedUser(userItem);
    setUserDetailModalOpen(true);
  };

  const getContentTypeLabel = (type: string) => {
    const found = contentTypes.find(ct => ct.id === type);
    return found ? found.label : type;
  };

  const getContentTypeIcon = (type: string) => {
    const found = contentTypes.find(ct => ct.id === type);
    if (found) {
      const Icon = found.icon;
      return <Icon className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  if (!user?.isAdmin) {
    return null;
  }

  // Sempre prioriza os valores da BD vindos de /admin/stats.
  // Só cai para o array local se a API ainda não respondeu (valor 0 e array já carregado).
  const totalUsers    = dashboardStats.total_utilizadores > 0 ? dashboardStats.total_utilizadores : users.length;
  const totalContents = dashboardStats.total_conteudos    > 0 ? dashboardStats.total_conteudos    : contents.length;
  const totalArticles = dashboardStats.total_conteudos    > 0 ? dashboardStats.total_conteudos    : getArticles().length;
  const totalTopics   = dashboardStats.total_topicos      > 0 ? dashboardStats.total_topicos      : getTopics().length;

  // ── Handlers de Quiz ────────────────────────────────────────────────────
  const addPerguntaForm = () => {
    setQuizPerguntas(prev => [...prev, {
      pergunta: '', opcao_a: '', opcao_b: '', opcao_c: '', opcao_d: '',
      resposta_correta: 1, explicacao: '',
    }]);
  };

  const removePerguntaForm = (idx: number) => {
    if (quizPerguntas.length === 1) return;
    setQuizPerguntas(prev => prev.filter((_, i) => i !== idx));
  };

  const updatePerguntaForm = (idx: number, field: string, value: string | number) => {
    setQuizPerguntas(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const handleSaveQuiz = async () => {
    if (!quizForm.titulo.trim()) { alert('Introduz o título do quiz.'); return; }
    if (quizPerguntas.some(p => !p.pergunta.trim() || !p.opcao_a.trim() || !p.opcao_b.trim() || !p.opcao_c.trim() || !p.opcao_d.trim())) {
      alert('Preenche todos os campos de todas as perguntas.');
      return;
    }
    setSavingQuiz(true);
    try {
      let quizId = editingQuizId;
      if (!quizId) {
        // Cria quiz
        const criado = await apiRequest<any>('/quizzes', {
          method: 'POST',
          json: {
            titulo: quizForm.titulo.trim(),
            descricao: quizForm.descricao.trim() || null,
            categoria: quizForm.categoria.trim() || null,
            thumbnail_filename: quizForm.thumbnail_filename.trim() || null,
          },
        });
        quizId = criado.id;
      } else {
        // Actualiza quiz existente
        await apiRequest(`/quizzes/${quizId}`, {
          method: 'PUT',
          json: {
            titulo: quizForm.titulo.trim(),
            descricao: quizForm.descricao.trim() || null,
            categoria: quizForm.categoria.trim() || null,
          },
        });
      }
      // Adiciona perguntas
      for (let i = 0; i < quizPerguntas.length; i++) {
        const p = quizPerguntas[i];
        await apiRequest(`/quizzes/${quizId}/perguntas`, {
          method: 'POST',
          json: {
            pergunta: p.pergunta.trim(),
            opcao_a: p.opcao_a.trim(),
            opcao_b: p.opcao_b.trim(),
            opcao_c: p.opcao_c.trim(),
            opcao_d: p.opcao_d.trim(),
            resposta_correta: Number(p.resposta_correta),
            explicacao: p.explicacao.trim() || null,
            ordem: i + 1,
          },
        });
      }
      alert(`Quiz "${quizForm.titulo}" ${editingQuizId ? 'actualizado' : 'criado'} com sucesso!`);
      // Reset
      setQuizForm({ titulo: '', descricao: '', categoria: '', thumbnail_filename: '' });
      setQuizPerguntas([{ pergunta: '', opcao_a: '', opcao_b: '', opcao_c: '', opcao_d: '', resposta_correta: 1, explicacao: '' }]);
      setEditingQuizId(null);
      // Recarrega lista
      const quizData = await apiRequest<any[]>('/quizzes');
      setQuizList(quizData ?? []);
    } catch (err: any) {
      alert('Erro ao guardar quiz: ' + (err?.message ?? 'Tenta novamente.'));
    } finally {
      setSavingQuiz(false);
    }
  };

  const handleEditQuiz = (quiz: any) => {
    setEditingQuizId(quiz.id);
    setQuizForm({
      titulo: quiz.titulo ?? '',
      descricao: quiz.descricao ?? '',
      categoria: quiz.categoria ?? '',
      thumbnail_filename: quiz.thumbnail_filename ?? '',
    });
    setQuizPerguntas([{ pergunta: '', opcao_a: '', opcao_b: '', opcao_c: '', opcao_d: '', resposta_correta: 1, explicacao: '' }]);
    document.getElementById('quiz-form-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteQuiz = async () => {
    if (!deleteQuizId) return;
    try {
      await apiRequest(`/quizzes/${deleteQuizId}`, { method: 'DELETE' });
      setQuizList(prev => prev.filter(q => q.id !== deleteQuizId));
      alert('Quiz removido com sucesso!');
    } catch { alert('Não foi possível remover o quiz.'); }
    finally { setDeleteQuizId(null); setDeleteQuizModalOpen(false); }
  };

  const toggleQuizAtivo = async (quiz: any) => {
    try {
      await apiRequest(`/quizzes/${quiz.id}`, {
        method: 'PUT',
        json: { ativo: !quiz.ativo },
      });
      setQuizList(prev => prev.map(q => q.id === quiz.id ? { ...q, ativo: !q.ativo } : q));
    } catch { alert('Não foi possível alterar o estado do quiz.'); }
  };

  // ── Handlers de Solicitações ─────────────────────────────────────────────
  const recarregarSolicitacoes = async () => {
    setLoadingSolicitacoes(true);
    try {
      const data = await apiRequest<any>('/admin/solicitacoes');
      setSolicitacoes(data ?? { jindungo: [], topicos: [], total_pendentes: 0 });
    } catch { /* silencioso */ }
    finally { setLoadingSolicitacoes(false); }
  };

  const responderSolicitacao = async (
    tipo: 'jindungo' | 'topico',
    id: string,
    status: 'aprovado' | 'rejeitado',
    observacoes?: string,
  ) => {
    setRespondendoId(`${tipo}-${id}`);
    try {
      await apiRequest(`/admin/solicitacoes/${tipo}/${id}`, {
        method: 'PATCH',
        json: { status, observacoes: observacoes ?? null },
      });
      await recarregarSolicitacoes();
    } catch { alert('Não foi possível processar a solicitação.'); }
    finally { setRespondendoId(null); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* ── Topbar de Navegação ─────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            {/* Logo / Brand */}
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-700">
                <BookOpenIcon className="h-4 w-4 text-white" />
              </div>
              <span className="hidden sm:block text-sm font-bold text-slate-900 leading-tight">
                Economia com História
              </span>
            </Link>

            {/* Links de navegação — desktop */}
            <div className="hidden md:flex items-center gap-1">
              <Link to="/" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                <Home className="w-4 h-4" /> Início
              </Link>
              <Link to="/artigos" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                <Compass className="w-4 h-4" /> Explorar
              </Link>
              <Link to="/resources" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                <HelpCircle className="w-4 h-4" /> Quizes
              </Link>
              <Link to="/forum" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                <MessageSquare className="w-4 h-4" /> Debate
              </Link>
              <span className="mx-1 h-5 w-px bg-slate-200" />
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-red-700 bg-red-50">
                <Shield className="w-4 h-4" /> Admin
              </span>
            </div>

            {/* Lado direito */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleAdminLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
              {/* Hamburguer mobile */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 md:hidden transition-colors"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Menu mobile */}
        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
            <nav className="space-y-1">
              {[
                { label: 'Início', href: '/', icon: Home },
                { label: 'Explorar', href: '/artigos', icon: Compass },
                { label: 'Quizes', href: '/resources', icon: HelpCircle },
                { label: 'Debate', href: '/forum', icon: MessageSquare },
              ].map(({ label, href, icon: Icon }) => (
                <Link
                  key={href}
                  to={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <Icon className="h-4 w-4" /> {label}
                </Link>
              ))}
              <button
                onClick={handleAdminLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" /> Sair
              </button>
            </nav>
          </div>
        )}
      </nav>

      {/* ── Header do painel ────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-red-600 via-black to-yellow-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-10 h-10" />
            <div>
              <h1 className="text-4xl font-bold">Dashboard Administrativo</h1>
              <p className="text-white/90">Bem-vindo, {user.name}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2 text-blue-700">
                <Users className="w-4 h-4" />
                Total de Usuários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-700">{totalUsers}</div>
              <p className="text-sm text-blue-600 mt-1">Registados na plataforma</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2 text-green-700">
                <FileText className="w-4 h-4" />
                Total de Conteúdos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-700">{totalContents}</div>
              <p className="text-sm text-green-600 mt-1">Publicados</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2 text-purple-700">
                <BookOpen className="w-4 h-4" />
                Artigos Publicados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-purple-700">{totalArticles}</div>
              <p className="text-sm text-purple-600 mt-1">
                <button onClick={() => setArticlesModalOpen(true)} className="hover:underline">Artigos</button>
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2 text-yellow-700">
                <MessageSquare className="w-4 h-4" />
                Tópicos Publicados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-yellow-700">{totalTopics}</div>
              <p className="text-sm text-yellow-600 mt-1">
                <button onClick={() => setTopicsModalOpen(true)} className="hover:underline">Tópicos</button>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); if (v === 'reports') carregarDenuncias(); }} className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 h-auto bg-transparent">
            <TabsTrigger value="overview" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
              <LayoutDashboard className="w-4 h-4 mr-2" /> Visão Geral
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" /> Usuários
            </TabsTrigger>
            <TabsTrigger value="create" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
              <PlusCircle className="w-4 h-4 mr-2" /> Criar Conteúdo
            </TabsTrigger>
            <TabsTrigger value="contents" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
              <FileText className="w-4 h-4 mr-2" /> Conteúdos
            </TabsTrigger>
            <TabsTrigger value="ranking" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
              <Trophy className="w-4 h-4 mr-2" /> Ranking
            </TabsTrigger>
            <TabsTrigger value="quiz" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
              <FileQuestion className="w-4 h-4 mr-2" /> Gerar Quiz
            </TabsTrigger>
            <TabsTrigger value="solicitacoes" className="relative data-[state=active]:bg-red-600 data-[state=active]:text-white">
              <Inbox className="w-4 h-4 mr-2" /> Solicitações
              {solicitacoes.total_pendentes > 0 && (
                <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                  {solicitacoes.total_pendentes > 9 ? '9+' : solicitacoes.total_pendentes}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
              <BarChart3 className="w-4 h-4 mr-2" /> Relatórios
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-red-600" /> Atividade Recente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { icon: UserCheck, color: 'text-blue-600', label: 'Novos usuários', desc: `${totalUsers} usuários registados`, count: totalUsers },
                    { icon: BookOpen, color: 'text-green-600', label: 'Artigos publicados', desc: `Total de ${totalArticles} artigos`, count: totalArticles },
                    { icon: MessageSquare, color: 'text-yellow-600', label: 'Tópicos publicados', desc: `Total de ${totalTopics} tópicos`, count: totalTopics },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                      <item.icon className={`w-5 h-5 ${item.color} mt-0.5`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{item.label}</p>
                        <p className="text-xs text-slate-600">{item.desc}</p>
                      </div>
                      <Badge variant="secondary">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" /> Gestão de Usuários
                </CardTitle>
                <CardDescription>Total de {totalUsers} usuários registados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {users.map((userItem) => (
                    <div key={userItem.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                          {userItem.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{userItem.name}</p>
                          <p className="text-sm text-slate-600">{userItem.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">{userItem.province || 'Luanda'}</Badge>
                            <span className="text-xs text-slate-500">{new Date(userItem.createdAt).toLocaleDateString('pt-PT')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewUser(userItem)}>
                          <Eye className="w-4 h-4 mr-1" /> Ver
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(userItem.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {users.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-30" /><p>Nenhum usuário registado ainda</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Create Content Tab */}
          <TabsContent value="create" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-green-600" /> Criar Novo Conteúdo
                </CardTitle>
                <CardDescription>Publique conteúdos educativos na plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-8">
                  <label className="text-sm font-medium text-slate-700 mb-3 block">Tipo de Conteúdo *</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {contentTypes.map((ct) => {
                      const Icon = ct.icon;
                      const isActive = contentType === ct.id;
                      return (
                        <button key={ct.id} type="button" onClick={() => handleContentTypeChange(ct.id)}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${isActive ? 'border-red-500 bg-red-50 text-red-700 shadow-md' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:shadow-sm'}`}>
                          <div className={`p-2 rounded-lg ${isActive ? 'bg-red-100' : 'bg-slate-100'}`}><Icon className={`w-6 h-6 ${isActive ? 'text-red-600' : 'text-slate-500'}`} /></div>
                          <span className="text-xs font-medium text-center leading-tight">{ct.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">{contentTypes.find(ct => ct.id === contentType)?.description}</p>
                </div>

                <form onSubmit={handleCreateContent} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Título do Conteúdo *</label>
                      <Input value={newContent.title} onChange={(e) => setNewContent({ ...newContent, title: e.target.value })} placeholder={contentType === 'video' ? 'Ex: Inflação em Angola 1990-2014' : contentType === 'podcast' ? 'Ex: Dinâmicas Macroeconómicas' : contentType === 'texto_jindungo' ? 'Ex: Petróleo: Motor da Economia' : contentType === 'topico' ? 'Ex: Exportação de petróleo: dependência económica' : 'Ex: A Economia da Mata'} required />
                    </div>
                    {(contentType === 'video' || contentType === 'podcast') && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">{contentType === 'video' ? 'Duração do Vídeo' : 'Duração Total'}</label>
                        <Input value={contentType === 'video' ? newContent.videoDuration : newContent.observations} onChange={(e) => contentType === 'video' ? setNewContent({ ...newContent, videoDuration: e.target.value }) : setNewContent({ ...newContent, observations: e.target.value })} placeholder="Ex: 15 min" />
                      </div>
                    )}
                  </div>

                  {contentType === 'video' && (
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-4">
                      <h4 className="font-semibold text-blue-900 flex items-center gap-2"><Video className="w-5 h-5" /> Detalhes do Vídeo</h4>
                      <div className="space-y-2"><label className="text-sm font-medium text-slate-700">URL do Vídeo</label><Input value={newContent.videoUrl} onChange={(e) => setNewContent({ ...newContent, videoUrl: e.target.value })} placeholder="https://youtube.com/watch?v=..." type="url" /><p className="text-xs text-slate-500">Ou faça upload do arquivo abaixo</p></div>
                      <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Upload de Vídeo</label><div className="border-2 border-dashed border-blue-300 rounded-lg p-4 text-center hover:border-red-400 transition-colors"><input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" id="video-upload" ref={videoInputRef} /><label htmlFor="video-upload" className="cursor-pointer">{videoFileName ? (<div className="flex items-center justify-center gap-2 text-blue-700"><Video className="w-5 h-5" /><span className="text-sm font-medium">{videoFileName}</span><button type="button" onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleRemoveVideo(); }} className="text-red-500 hover:text-red-700 ml-2"><X className="w-4 h-4" /></button></div>) : (<><Upload className="w-8 h-8 text-blue-400 mx-auto mb-2" /><p className="text-sm text-blue-600">Clique para enviar vídeo</p><p className="text-xs text-blue-400 mt-1">MP4, WebM, MOV</p></>)}</label></div></div>
                    </div>
                  )}

                  {contentType === 'podcast' && (
                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 space-y-4">
                      <h4 className="font-semibold text-purple-900 flex items-center gap-2"><Headphones className="w-5 h-5" /> Detalhes do Podcast</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Apresentador / Host</label><Input value={newContent.podcastHost} onChange={(e) => setNewContent({ ...newContent, podcastHost: e.target.value })} placeholder="Ex: Economista Pedro Lima" /></div>
                        <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Categoria do Podcast</label><select value={newContent.podcastCategory} onChange={(e) => setNewContent({ ...newContent, podcastCategory: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"><option value="">Selecione...</option><option value="economia">Economia</option><option value="historia">História</option><option value="politica">Política</option><option value="cultura">Cultura</option><option value="educacao">Educação</option></select></div>
                      </div>
                      <div className="border-t border-purple-200 pt-4 mt-4"><h5 className="font-medium text-slate-900 mb-3 flex items-center gap-2"><List className="w-4 h-4" /> Episódios</h5>{newContent.episodes.length > 0 && (<div className="space-y-2 mb-4">{newContent.episodes.map((ep) => (<div key={ep.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-slate-200"><div className="flex-1 min-w-0"><p className="text-sm font-medium text-slate-900 truncate">{ep.title}</p><p className="text-xs text-slate-500">{ep.duration}{ep.date ? ` · ${ep.date}` : ''}</p>{ep.audioFileName && (<p className="text-xs text-green-600 flex items-center gap-1 mt-0.5"><FileAudio className="w-3 h-3" /> {ep.audioFileName}</p>)}</div><button type="button" onClick={() => handleRemoveEpisode(ep.id)} className="text-red-500 hover:text-red-700 ml-2 p-1"><Trash2 className="w-4 h-4" /></button></div>))}</div>)}<div className="space-y-2 p-3 bg-white rounded-lg border border-slate-200"><Input placeholder="Título do episódio" value={newContent.newEpisode.title} onChange={(e) => setNewContent({ ...newContent, newEpisode: { ...newContent.newEpisode, title: e.target.value } })} /><div className="flex gap-2"><Input placeholder="Duração (ex: 20:15)" value={newContent.newEpisode.duration} onChange={(e) => setNewContent({ ...newContent, newEpisode: { ...newContent.newEpisode, duration: e.target.value } })} className="flex-1" /><Input placeholder="Data" value={newContent.newEpisode.date} onChange={(e) => setNewContent({ ...newContent, newEpisode: { ...newContent.newEpisode, date: e.target.value } })} className="flex-1" /></div><div><label className="text-xs font-medium text-slate-700 mb-1 block">Arquivo de Áudio</label><div className="border-2 border-dashed border-purple-300 rounded-lg p-3 text-center hover:border-red-400 transition-colors cursor-pointer"><input type="file" accept="audio/*" onChange={(e) => { const file = e.target.files?.[0] || null; setNewContent({ ...newContent, newEpisode: { ...newContent.newEpisode, audioFile: file, audioFileName: file?.name || '' } }); }} className="hidden" id="admin-audio-upload" /><label htmlFor="admin-audio-upload" className="cursor-pointer"><Music className="w-5 h-5 text-purple-400 mx-auto mb-1" /><p className="text-xs text-purple-600">{newContent.newEpisode.audioFileName || 'Clique para enviar áudio'}</p><p className="text-[10px] text-purple-400 mt-0.5">MP3, WAV, AAC</p></label></div></div><Textarea placeholder="Descrição do episódio" value={newContent.newEpisode.description} onChange={(e) => setNewContent({ ...newContent, newEpisode: { ...newContent.newEpisode, description: e.target.value } })} rows={2} /><Button type="button" onClick={handleAddEpisode} disabled={!newContent.newEpisode.title || !newContent.newEpisode.duration} className="w-full bg-purple-600 hover:bg-purple-700 text-white" size="sm"><PlusCircle className="w-4 h-4 mr-1" /> Adicionar Episódio</Button></div></div>
                    </div>
                  )}

                  {contentType === 'topico' && (
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-4">
                      <h4 className="font-semibold text-amber-900 flex items-center gap-2"><MessageSquare className="w-5 h-5" /> Detalhes do Tópico</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Visibilidade</label><div className="flex gap-3"><button type="button" onClick={() => setNewContent({ ...newContent, topicType: 'public' })} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${newContent.topicType === 'public' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}><Globe className="w-5 h-5" /><span className="text-sm font-medium">Público</span></button><button type="button" onClick={() => setNewContent({ ...newContent, topicType: 'private' })} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${newContent.topicType === 'private' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}><Lock className="w-5 h-5" /><span className="text-sm font-medium">Privado</span></button></div></div>
                        <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Categoria do Tópico *</label><select value={newContent.topicCategory} onChange={(e) => setNewContent({ ...newContent, topicCategory: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"><option value="Economia">Economia</option><option value="Economia Actual">Economia Actual</option><option value="História Económica">História Económica</option><option value="Sociedade">Sociedade</option><option value="Análise Comparativa">Análise Comparativa</option><option value="Infraestrutura">Infraestrutura</option><option value="Tecnologia">Tecnologia</option><option value="Turismo">Turismo</option></select></div>
                      </div>
                      <div className="bg-amber-100/50 rounded-lg p-3 border border-amber-200"><p className="text-xs text-amber-800">{newContent.topicType === 'public' ? '🌍 Tópicos públicos são visíveis para todos os utilizadores.' : '🔒 Tópicos privados exigem solicitação de acesso.'}</p></div>
                    </div>
                  )}

                  {contentType === 'texto_jindungo' && (
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                      <h4 className="font-semibold text-amber-900 flex items-center gap-2 mb-3"><BookOpen className="w-5 h-5" /> Texto com Jindungo</h4>
                      <div className="bg-amber-100/50 rounded-lg p-3 border border-amber-200"><p className="text-xs text-amber-800">🌶️ Este conteúdo será marcado como restrito.</p></div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">{contentType === 'video' ? 'Descrição do Vídeo *' : contentType === 'podcast' ? 'Descrição do Podcast *' : contentType === 'topico' ? 'Conteúdo do Tópico *' : 'Descrição Breve *'}</label>
                    <Textarea value={newContent.description} onChange={(e) => setNewContent({ ...newContent, description: e.target.value })} placeholder={contentType === 'topico' ? 'Escreva o conteúdo completo do tópico...' : 'Descrição resumida...'} rows={contentType === 'topico' ? 8 : 3} required />
                  </div>

                  {(contentType === 'texto_normal' || contentType === 'texto_jindungo') && (
                    <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Conteúdo Completo *</label><Textarea value={newContent.content} onChange={(e) => setNewContent({ ...newContent, content: e.target.value })} placeholder="Conteúdo detalhado..." rows={8} required /></div>
                  )}

                  <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Referências</label><Textarea value={newContent.references} onChange={(e) => setNewContent({ ...newContent, references: e.target.value })} placeholder="Fontes, bibliografia..." rows={3} /></div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 flex items-center gap-2"><Image className="w-4 h-4" /> Imagem de Capa</label>
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-red-400 transition-colors">
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="cover-image-upload" ref={fileInputRef} />
                      {coverImagePreview ? (<div className="relative"><img src={coverImagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" /><button type="button" onClick={handleRemoveImage} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"><X className="w-4 h-4" /></button></div>) : (<label htmlFor="cover-image-upload" className="cursor-pointer"><Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" /><p className="text-sm text-slate-600">Clique para fazer upload</p><p className="text-xs text-slate-400 mt-1">PNG, JPG, WebP até 5MB</p></label>)}
                    </div>
                    <div className="space-y-2 mt-2"><label className="text-sm font-medium text-slate-700">Ou URL da Imagem</label><Input value={newContent.imageUrl} onChange={(e) => setNewContent({ ...newContent, imageUrl: e.target.value })} placeholder="https://exemplo.com/imagem.jpg" type="url" /></div>
                  </div>

                  <Button type="submit" className="w-full bg-red-600 hover:bg-red-700"><PlusCircle className="w-4 h-4 mr-2" /> Publicar {contentTypes.find(ct => ct.id === contentType)?.label || 'Conteúdo'}</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contents Tab */}
          <TabsContent value="contents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-purple-600" /> Gestão de Conteúdos</CardTitle>
                <CardDescription>{totalContents} conteúdos publicados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {contents.map((content) => (
                    <div key={content.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="font-semibold text-slate-900">{content.title}</h3>
                            <Badge className="flex items-center gap-1">{getContentTypeIcon(content.type)} {getContentTypeLabel(content.type)}</Badge>
                            {content.type === 'topico' && (<Badge variant={content.topicType === 'public' ? 'default' : 'secondary'} className="flex items-center gap-1">{content.topicType === 'public' ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}{content.topicType === 'public' ? 'Público' : 'Privado'}</Badge>)}
                            {content.type === 'podcast' && content.episodes && (<Badge variant="outline" className="flex items-center gap-1"><List className="w-3 h-3" /> {content.episodes.length} eps</Badge>)}
                          </div>
                          <p className="text-sm text-slate-600 mb-2">{content.description}</p>
                          <div className="flex items-center gap-4 text-xs text-slate-500"><span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(content.createdAt).toLocaleDateString('pt-PT')}</span><span>Por {content.createdBy}</span></div>
                        </div>
                        <div className="flex gap-2">
                          {content.type === 'topico' ? (<Button variant="outline" size="sm" onClick={() => handleEditTopic(content)}><Edit className="w-4 h-4" /></Button>) : (<Button variant="outline" size="sm" onClick={() => handleEditArticle(content)}><Edit className="w-4 h-4" /></Button>)}
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteContent(content.id)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {contents.length === 0 && (<div className="text-center py-8 text-slate-500"><FileText className="w-12 h-12 mx-auto mb-4 opacity-30" /><p>Nenhum conteúdo criado ainda</p></div>)}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ranking Tab */}
          <TabsContent value="ranking" className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-600" /> Ranking Geral</CardTitle><CardDescription>Classificação completa de todos os participantes</CardDescription></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {ranking.map((userRank, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500' : index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' : 'bg-gradient-to-br from-slate-400 to-slate-600'}`}>{index + 1}</div>
                        <div><p className="font-medium text-slate-900">{userRank.name}</p><div className="flex items-center gap-2 text-sm text-slate-600"><span>{userRank.quizzes} quizzes</span><span>•</span><span>{userRank.province}</span></div></div>
                      </div>
                      <div className="text-right"><p className="text-2xl font-bold text-yellow-600">{userRank.score}</p><p className="text-xs text-slate-500">pontos</p></div>
                    </div>
                  ))}
                  {ranking.length === 0 && (<div className="text-center py-8 text-slate-500"><Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" /><p>Nenhum participante ainda</p></div>)}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quiz Tab */}
          <TabsContent value="quiz" className="space-y-6">

            {/* Lista de quizzes existentes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileQuestion className="w-5 h-5 text-orange-600" /> Quizzes Existentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingQuizzes ? (
                  <div className="space-y-2">
                    {[1,2].map(i => <div key={i} className="h-12 bg-slate-100 rounded animate-pulse" />)}
                  </div>
                ) : quizList.length === 0 ? (
                  <p className="text-slate-500 text-center py-6">Nenhum quiz criado ainda.</p>
                ) : (
                  <div className="space-y-3">
                    {quizList.map((quiz: any) => (
                      <div key={quiz.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-orange-200 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${quiz.ativo ? 'bg-green-500' : 'bg-slate-300'}`} />
                          <div>
                            <p className="font-medium text-slate-900">{quiz.titulo}</p>
                            <p className="text-xs text-slate-500">{quiz.categoria ?? 'Sem categoria'} • {quiz.total_perguntas ?? 0} perguntas</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleQuizAtivo(quiz)}
                            className={quiz.ativo ? 'text-green-600 border-green-200' : 'text-slate-400'}
                          >
                            {quiz.ativo ? 'Activo' : 'Inactivo'}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleEditQuiz(quiz)}>
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => { setDeleteQuizId(quiz.id); setDeleteQuizModalOpen(true); }}
                          >
                            Remover
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Formulário de criação / edição */}
            <Card id="quiz-form-section">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-orange-600" />
                  {editingQuizId ? 'Editar Quiz' : 'Criar Novo Quiz'}
                </CardTitle>
                <CardDescription>
                  {editingQuizId ? 'Edita os dados e adiciona novas perguntas ao quiz.' : 'Preenche os dados e adiciona as perguntas.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">

                {/* Dados gerais do quiz */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Título <span className="text-red-500">*</span></label>
                    <Input
                      placeholder="Ex: Economia Angolana — Básico"
                      value={quizForm.titulo}
                      onChange={e => setQuizForm(f => ({ ...f, titulo: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Categoria</label>
                    <select
                      value={quizForm.categoria}
                      onChange={e => setQuizForm(f => ({ ...f, categoria: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">Selecionar...</option>
                      <option value="Economia">Economia</option>
                      <option value="História">História</option>
                      <option value="Sociedade">Sociedade</option>
                      <option value="Cultura">Cultura</option>
                      <option value="Geografia">Geografia</option>
                      <option value="Geral">Geral</option>
                    </select>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Descrição</label>
                    <Textarea
                      placeholder="Breve descrição do quiz..."
                      value={quizForm.descricao}
                      onChange={e => setQuizForm(f => ({ ...f, descricao: e.target.value }))}
                      rows={2}
                      className="resize-none"
                    />
                  </div>
                </div>

                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900">
                      Perguntas ({quizPerguntas.length})
                    </h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addPerguntaForm}
                      className="border-orange-300 text-orange-600 hover:bg-orange-50"
                    >
                      <PlusCircle className="w-4 h-4 mr-1" /> Adicionar Pergunta
                    </Button>
                  </div>

                  <div className="space-y-6">
                    {quizPerguntas.map((p, idx) => (
                      <div key={idx} className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-slate-700 bg-orange-100 text-orange-700 px-3 py-1 rounded-full">
                            Pergunta {idx + 1}
                          </span>
                          {quizPerguntas.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removePerguntaForm(idx)}
                              className="text-xs text-red-500 hover:text-red-700 transition-colors"
                            >
                              Remover
                            </button>
                          )}
                        </div>

                        <div className="space-y-1">
                          <label className="text-sm font-medium text-slate-700">Texto da Pergunta <span className="text-red-500">*</span></label>
                          <Textarea
                            placeholder="Escreve a pergunta aqui..."
                            value={p.pergunta}
                            onChange={e => updatePerguntaForm(idx, 'pergunta', e.target.value)}
                            rows={2}
                            className="resize-none"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {(['opcao_a','opcao_b','opcao_c','opcao_d'] as const).map((campo, oidx) => (
                            <div key={campo} className="space-y-1">
                              <label className="text-sm font-medium text-slate-700">
                                Opção {['A','B','C','D'][oidx]} <span className="text-red-500">*</span>
                              </label>
                              <Input
                                placeholder={`Opção ${['A','B','C','D'][oidx]}`}
                                value={p[campo]}
                                onChange={e => updatePerguntaForm(idx, campo, e.target.value)}
                              />
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700">Resposta Correcta <span className="text-red-500">*</span></label>
                            <select
                              value={p.resposta_correta}
                              onChange={e => updatePerguntaForm(idx, 'resposta_correta', Number(e.target.value))}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                            >
                              <option value={1}>A — {p.opcao_a || 'Opção A'}</option>
                              <option value={2}>B — {p.opcao_b || 'Opção B'}</option>
                              <option value={3}>C — {p.opcao_c || 'Opção C'}</option>
                              <option value={4}>D — {p.opcao_d || 'Opção D'}</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700">Explicação (opcional)</label>
                            <Input
                              placeholder="Explica por que esta é a resposta correcta..."
                              value={p.explicacao}
                              onChange={e => updatePerguntaForm(idx, 'explicacao', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Acções */}
                <div className="flex gap-3 pt-2 border-t">
                  {editingQuizId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingQuizId(null);
                        setQuizForm({ titulo: '', descricao: '', categoria: '', thumbnail_filename: '' });
                        setQuizPerguntas([{ pergunta: '', opcao_a: '', opcao_b: '', opcao_c: '', opcao_d: '', resposta_correta: 1, explicacao: '' }]);
                      }}
                    >
                      Cancelar Edição
                    </Button>
                  )}
                  <Button
                    onClick={handleSaveQuiz}
                    disabled={savingQuiz}
                    className="bg-red-600 hover:bg-red-700 flex-1"
                  >
                    {savingQuiz
                      ? 'A guardar...'
                      : editingQuizId
                        ? 'Guardar Alterações'
                        : <><PlusCircle className="w-4 h-4 mr-2" /> Criar Quiz</>
                    }
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Solicitações de Acesso Tab */}
          <TabsContent value="solicitacoes" className="space-y-6">

            {/* Filtro de estado */}
            <div className="flex items-center gap-2 flex-wrap">
              {(['pendente', 'aprovado', 'rejeitado', 'todos'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setSolFiltro(f)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
                    solFiltro === f
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f === 'todos' ? 'Todos' : f === 'pendente' ? 'Pendentes' : f === 'aprovado' ? 'Aprovados' : 'Rejeitados'}
                  {f === 'pendente' && solicitacoes.total_pendentes > 0 && (
                    <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] text-white">
                      {solicitacoes.total_pendentes}
                    </span>
                  )}
                </button>
              ))}
              <button
                onClick={recarregarSolicitacoes}
                className="ml-auto px-3 py-1.5 rounded-lg text-sm text-slate-500 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
              >
                <Activity className="w-3.5 h-3.5" /> Atualizar
              </button>
            </div>

            {loadingSolicitacoes ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}
              </div>
            ) : (
              <>
                {/* Jindungo */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <BookOpen className="w-4 h-4 text-amber-600" /> Acesso a Conteúdo Jindungo
                      <Badge variant="secondary" className="ml-auto">
                        {solicitacoes.jindungo.filter(s => solFiltro === 'todos' || s.status === solFiltro).length}
                      </Badge>
                    </CardTitle>
                    <CardDescription>Pedidos de acesso a conteúdos exclusivos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {solicitacoes.jindungo.filter(s => solFiltro === 'todos' || s.status === solFiltro).length === 0 ? (
                      <p className="text-slate-400 text-sm text-center py-6">Nenhuma solicitação {solFiltro !== 'todos' ? solFiltro : ''}.</p>
                    ) : (
                      <div className="space-y-3">
                        {solicitacoes.jindungo
                          .filter(s => solFiltro === 'todos' || s.status === solFiltro)
                          .map((s: any) => (
                            <div key={s.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border border-slate-200 rounded-xl hover:border-amber-200 transition-colors">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                    s.status === 'pendente'   ? 'bg-orange-100 text-orange-700' :
                                    s.status === 'aprovado'  ? 'bg-green-100 text-green-700'   :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {s.status}
                                  </span>
                                  <span className="text-xs text-slate-400">
                                    {new Date(s.solicitado_em).toLocaleDateString('pt-AO')}
                                  </span>
                                </div>
                                <p className="font-medium text-slate-900 truncate">{s.conteudo_titulo}</p>
                                <p className="text-sm text-slate-500">{s.usuario_nome} — <span className="text-slate-400">{s.usuario_email}</span></p>
                                {s.motivo && <p className="text-xs text-slate-500 mt-1 italic">"{s.motivo}"</p>}
                              </div>
                              {s.status === 'pendente' && (
                                <div className="flex gap-2 shrink-0">
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white gap-1"
                                    disabled={respondendoId === `jindungo-${s.id}`}
                                    onClick={() => responderSolicitacao('jindungo', s.id, 'aprovado')}
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" /> Aprovar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 border-red-200 hover:bg-red-50 gap-1"
                                    disabled={respondendoId === `jindungo-${s.id}`}
                                    onClick={() => responderSolicitacao('jindungo', s.id, 'rejeitado')}
                                  >
                                    <XCircle className="w-3.5 h-3.5" /> Rejeitar
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Tópicos Privados */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Lock className="w-4 h-4 text-purple-600" /> Acesso a Tópicos Privados
                      <Badge variant="secondary" className="ml-auto">
                        {solicitacoes.topicos.filter(s => solFiltro === 'todos' || s.status === solFiltro).length}
                      </Badge>
                    </CardTitle>
                    <CardDescription>Pedidos de entrada em tópicos de fórum privados</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {solicitacoes.topicos.filter(s => solFiltro === 'todos' || s.status === solFiltro).length === 0 ? (
                      <p className="text-slate-400 text-sm text-center py-6">Nenhuma solicitação {solFiltro !== 'todos' ? solFiltro : ''}.</p>
                    ) : (
                      <div className="space-y-3">
                        {solicitacoes.topicos
                          .filter(s => solFiltro === 'todos' || s.status === solFiltro)
                          .map((s: any) => (
                            <div key={s.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border border-slate-200 rounded-xl hover:border-purple-200 transition-colors">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                    s.status === 'pendente'   ? 'bg-orange-100 text-orange-700' :
                                    s.status === 'aprovado'  ? 'bg-green-100 text-green-700'   :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {s.status}
                                  </span>
                                  <span className="text-xs text-slate-400">
                                    {new Date(s.solicitado_em).toLocaleDateString('pt-AO')}
                                  </span>
                                </div>
                                <p className="font-medium text-slate-900 truncate">{s.conteudo_titulo}</p>
                                <p className="text-sm text-slate-500">{s.usuario_nome} — <span className="text-slate-400">{s.usuario_email}</span></p>
                                {s.motivo && <p className="text-xs text-slate-500 mt-1 italic">"{s.motivo}"</p>}
                              </div>
                              {s.status === 'pendente' && (
                                <div className="flex gap-2 shrink-0">
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white gap-1"
                                    disabled={respondendoId === `topico-${s.id}`}
                                    onClick={() => responderSolicitacao('topico', s.id, 'aprovado')}
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" /> Aprovar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 border-red-200 hover:bg-red-50 gap-1"
                                    disabled={respondendoId === `topico-${s.id}`}
                                    onClick={() => responderSolicitacao('topico', s.id, 'rejeitado')}
                                  >
                                    <XCircle className="w-3.5 h-3.5" /> Rejeitar
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            {/* ── Estatísticas do sistema ──────────────────────────────── */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-slate-700" /> Relatório Completo do Sistema</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200"><div className="flex items-center gap-3 mb-2"><Users className="w-5 h-5 text-blue-600" /><h4 className="font-semibold text-slate-900">Usuários</h4></div><p className="text-3xl font-bold text-blue-600 mb-1">{totalUsers}</p><p className="text-sm text-slate-600">Total registados</p></div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200"><div className="flex items-center gap-3 mb-2"><FileText className="w-5 h-5 text-green-600" /><h4 className="font-semibold text-slate-900">Conteúdos</h4></div><p className="text-3xl font-bold text-green-600 mb-1">{totalContents}</p><p className="text-sm text-slate-600">Publicados</p></div>
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200"><div className="flex items-center gap-3 mb-2"><MessageSquare className="w-5 h-5 text-purple-600" /><h4 className="font-semibold text-slate-900">Engajamento</h4></div><p className="text-3xl font-bold text-purple-600 mb-1">{totalArticles + totalTopics}</p><p className="text-sm text-slate-600">Artigos e Tópicos</p></div>
                </div>
                <div className="border-t pt-6"><h4 className="font-semibold text-slate-900 mb-4">Distribuição por Província</h4><div className="space-y-2">{['Luanda', 'Benguela', 'Huambo', 'Cabinda', 'Huíla'].map((province) => { const count = users.filter(u => u.province === province).length; const percentage = totalUsers > 0 ? (count / totalUsers) * 100 : 0; return (<div key={province}><div className="flex justify-between text-sm mb-1"><span className="text-slate-700">{province}</span><span className="text-slate-600">{count} usuários ({percentage.toFixed(1)}%)</span></div><div className="h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-red-600 to-yellow-600" style={{ width: `${percentage}%` }} /></div></div>); })}</div></div>
              </CardContent>
            </Card>

            {/* ── Denúncias pendentes ──────────────────────────────────── */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    Denúncias Pendentes
                    {denuncias.length > 0 && (
                      <Badge className="bg-red-100 text-red-700 border-red-200 ml-2">{denuncias.length}</Badge>
                    )}
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={carregarDenuncias} disabled={loadingDenuncias}>
                    {loadingDenuncias ? 'A carregar...' : 'Actualizar'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingDenuncias ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-lg animate-pulse" />)}
                  </div>
                ) : denuncias.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <p className="text-slate-600 font-medium">Nenhuma denúncia pendente</p>
                    <p className="text-sm text-slate-400">A moderação está em dia!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {denuncias.map((d: any) => (
                      <div key={d.id} className="border border-red-100 rounded-xl p-4 bg-red-50/30 hover:bg-red-50/60 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <Badge variant="outline" className="border-red-300 text-red-700 text-xs">Denúncia #{d.id}</Badge>
                              {d.motivo && <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">{d.motivo}</Badge>}
                            </div>
                            <div className="mb-2">
                              <span className="text-xs font-medium text-slate-500">
                                {d.topico_forum_id ? 'Tópico denunciado:' : 'Comentário denunciado:'}
                              </span>
                              <p className="text-sm text-slate-700 mt-1 line-clamp-3 bg-white rounded p-2 border border-slate-200">
                                {d.topico_forum_id
                                  ? (d.topico_titulo ?? '—')
                                  : (d.resposta_conteudo ?? '—')}
                              </p>
                            </div>
                            {d.descricao_detalhada && (
                              <div className="mb-2">
                                <span className="text-xs font-medium text-slate-500">Descrição:</span>
                                <p className="text-sm text-slate-600 mt-1">{d.descricao_detalhada}</p>
                              </div>
                            )}
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                              <span>Denunciado por: <span className="font-medium text-slate-600">{d.denunciado_por_nome ?? '—'}</span></span>
                              {d.criado_em && <span>{new Date(d.criado_em).toLocaleDateString('pt-PT')}</span>}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs"
                              disabled={resolvingDenunciaId === String(d.id)}
                              onClick={() => resolverDenuncia(String(d.id), 'ignorada')}
                            >
                              <XCircle className="w-3 h-3 mr-1" />Ignorar
                            </Button>
                            <Button
                              size="sm"
                              className="bg-amber-500 hover:bg-amber-600 text-white text-xs"
                              disabled={resolvingDenunciaId === String(d.id)}
                              onClick={() => resolverDenuncia(String(d.id), 'removida')}
                            >
                              <Trash2 className="w-3 h-3 mr-1" />Remover
                            </Button>
                            <Button
                              size="sm"
                              className="bg-red-700 hover:bg-red-800 text-white text-xs"
                              disabled={resolvingDenunciaId === String(d.id)}
                              onClick={() => { if (window.confirm('Banir o utilizador que publicou este comentário?')) resolverDenuncia(String(d.id), 'banido'); }}
                            >
                              <Shield className="w-3 h-3 mr-1" />Banir
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      {/* Modal de Artigos Publicados */}
      <Dialog open={articlesModalOpen} onOpenChange={setArticlesModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2"><BookOpen className="w-6 h-6 text-purple-600" /> Artigos Publicados ({totalArticles})</DialogTitle><DialogDescription className="sr-only">Lista de todos os artigos publicados na plataforma</DialogDescription></DialogHeader>
          <div className="space-y-3 mt-4">
            {getArticles().map((article) => (
              <div key={article.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap"><h3 className="font-semibold text-slate-900">{article.title}</h3><Badge>{getContentTypeLabel(article.type)}</Badge>{article.type === 'podcast' && article.episodes && <Badge variant="outline" className="flex items-center gap-1"><List className="w-3 h-3" /> {article.episodes.length} eps</Badge>}</div>
                    <p className="text-sm text-slate-600 mb-2">{article.description}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500"><span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(article.createdAt).toLocaleDateString('pt-PT')}</span><span>Por {article.createdBy}</span></div>
                  </div>
                  <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => { setArticlesModalOpen(false); handleEditArticle(article); }}><Edit className="w-4 h-4" /></Button><Button variant="destructive" size="sm" onClick={() => handleDeleteClick('article', article.id)}><Trash2 className="w-4 h-4" /></Button></div>
                </div>
              </div>
            ))}
            {getArticles().length === 0 && (<div className="text-center py-8 text-slate-500"><BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" /><p>Nenhum artigo publicado ainda</p></div>)}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Tópicos Publicados */}
      <Dialog open={topicsModalOpen} onOpenChange={setTopicsModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2"><MessageSquare className="w-6 h-6 text-yellow-600" /> Tópicos Publicados ({totalTopics})</DialogTitle><DialogDescription className="sr-only">Lista de todos os tópicos do fórum publicados na plataforma</DialogDescription></DialogHeader>
          <div className="space-y-3 mt-4">
            {getTopics().map((topic) => (
              <div key={topic.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap"><h3 className="font-semibold text-slate-900">{topic.title}</h3><Badge variant={topic.topicType === 'public' ? 'default' : 'secondary'} className="flex items-center gap-1">{topic.topicType === 'public' ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}{topic.topicType === 'public' ? 'Público' : 'Privado'}</Badge><Badge variant="outline">{topic.topicCategory}</Badge></div>
                    <p className="text-sm text-slate-600 mb-2">{topic.description}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500"><span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(topic.createdAt).toLocaleDateString('pt-PT')}</span><span>Por {topic.createdBy}</span></div>
                  </div>
                  <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => { setTopicsModalOpen(false); handleEditTopic(topic); }}><Edit className="w-4 h-4" /></Button><Button variant="destructive" size="sm" onClick={() => handleDeleteClick('topic', topic.id)}><Trash2 className="w-4 h-4" /></Button></div>
                </div>
              </div>
            ))}
            {getTopics().length === 0 && (<div className="text-center py-8 text-slate-500"><MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-30" /><p>Nenhum tópico publicado ainda</p></div>)}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes do Usuário - ATUALIZADO */}
      <Dialog open={userDetailModalOpen} onOpenChange={setUserDetailModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" /> Detalhes do Usuário
            </DialogTitle>
            <DialogDescription className="sr-only">Informações detalhadas sobre o usuário selecionado</DialogDescription>
          </DialogHeader>
          {selectedUser && (() => {
            const userCounts = getUserContentCounts(selectedUser.name);
            return (
              <div className="space-y-6 mt-4">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-3xl">
                    {selectedUser.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">{selectedUser.name}</h3>
                    <Badge variant="outline" className="mt-1">{selectedUser.isAdmin ? 'Administrador' : 'Usuário'}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Mail className="w-5 h-5 text-slate-500" />
                    <div>
                      <p className="text-xs text-slate-500">Email</p>
                      <p className="text-sm font-medium text-slate-900">{selectedUser.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <MapPin className="w-5 h-5 text-slate-500" />
                    <div>
                      <p className="text-xs text-slate-500">Província</p>
                      <p className="text-sm font-medium text-slate-900">{selectedUser.province || 'Não informada'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Building className="w-5 h-5 text-slate-500" />
                    <div>
                      <p className="text-xs text-slate-500">Instituição / Universidade</p>
                      <p className="text-sm font-medium text-slate-900">{selectedUser.institution || 'Não informada'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <GraduationCap className="w-5 h-5 text-slate-500" />
                    <div>
                      <p className="text-xs text-slate-500">Curso</p>
                      <p className="text-sm font-medium text-slate-900">{selectedUser.course || 'Não informado'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Clock className="w-5 h-5 text-slate-500" />
                    <div>
                      <p className="text-xs text-slate-500">Data de Registo</p>
                      <p className="text-sm font-medium text-slate-900">
                        {new Date(selectedUser.createdAt).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Estatísticas de conteúdo */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <PenLine className="w-4 h-4 text-purple-600" /> Publicações do Usuário
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200 text-center">
                      <BookOpen className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-purple-700">{userCounts.articles}</p>
                      <p className="text-xs text-purple-600">Artigos publicados</p>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 text-center">
                      <MessageSquare className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-yellow-700">{userCounts.topics}</p>
                      <p className="text-xs text-yellow-600">Tópicos publicados</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Award className="w-5 h-5 text-yellow-500" />
                    <div>
                      <p className="text-xs text-slate-500">Pontuação no Ranking</p>
                      <p className="text-sm font-medium text-slate-900">{ranking.find((r: any) => r.name === selectedUser.name)?.score || 0} pontos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <div>
                      <p className="text-xs text-slate-500">Quizzes Realizados</p>
                      <p className="text-sm font-medium text-slate-900">{ranking.find((r: any) => r.name === selectedUser.name)?.quizzes || 0} quizzes</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserDetailModalOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Editar Artigo */}
      <Dialog open={editArticleModalOpen} onOpenChange={setEditArticleModalOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-xl font-bold text-slate-900">Editar Artigo ({getContentTypeLabel(selectedArticle?.type || '')})</DialogTitle><DialogDescription className="sr-only">Formulário para editar as informações do artigo selecionado</DialogDescription></DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Título *</label><Input value={editArticleForm.title} onChange={(e) => setEditArticleForm({ ...editArticleForm, title: e.target.value })} /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Descrição *</label><Textarea value={editArticleForm.description} onChange={(e) => setEditArticleForm({ ...editArticleForm, description: e.target.value })} rows={3} /></div>
            {(selectedArticle?.type === 'texto_normal' || selectedArticle?.type === 'texto_jindungo') && (<div className="space-y-2"><label className="text-sm font-medium text-slate-700">Conteúdo Completo</label><Textarea value={editArticleForm.content} onChange={(e) => setEditArticleForm({ ...editArticleForm, content: e.target.value })} rows={8} /></div>)}
            {selectedArticle?.type === 'video' && (<div className="p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-4"><h4 className="font-semibold text-blue-900 flex items-center gap-2"><Video className="w-5 h-5" /> Detalhes do Vídeo</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-2"><label className="text-sm font-medium text-slate-700">URL do Vídeo</label><Input value={editArticleForm.videoUrl} onChange={(e) => setEditArticleForm({ ...editArticleForm, videoUrl: e.target.value })} /></div><div className="space-y-2"><label className="text-sm font-medium text-slate-700">Duração</label><Input value={editArticleForm.videoDuration} onChange={(e) => setEditArticleForm({ ...editArticleForm, videoDuration: e.target.value })} /></div></div></div>)}
            {selectedArticle?.type === 'podcast' && (<div className="p-4 bg-purple-50 rounded-xl border border-purple-200 space-y-4"><h4 className="font-semibold text-purple-900 flex items-center gap-2"><Headphones className="w-5 h-5" /> Detalhes do Podcast</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-2"><label className="text-sm font-medium text-slate-700">Apresentador</label><Input value={editArticleForm.podcastHost} onChange={(e) => setEditArticleForm({ ...editArticleForm, podcastHost: e.target.value })} /></div><div className="space-y-2"><label className="text-sm font-medium text-slate-700">Categoria</label><select value={editArticleForm.podcastCategory} onChange={(e) => setEditArticleForm({ ...editArticleForm, podcastCategory: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"><option value="">Selecione...</option><option value="economia">Economia</option><option value="historia">História</option><option value="politica">Política</option><option value="cultura">Cultura</option><option value="educacao">Educação</option></select></div></div><div className="border-t border-purple-200 pt-4 mt-4"><h5 className="font-medium text-slate-900 mb-3 flex items-center gap-2"><List className="w-4 h-4" /> Episódios</h5>{editArticleForm.episodes.length > 0 && (<div className="space-y-2 mb-4">{editArticleForm.episodes.map((ep) => (<div key={ep.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-slate-200"><div className="flex-1 min-w-0"><p className="text-sm font-medium text-slate-900 truncate">{ep.title}</p><p className="text-xs text-slate-500">{ep.duration}{ep.date ? ` · ${ep.date}` : ''}</p></div><button type="button" onClick={() => handleEditRemoveEpisode(ep.id)} className="text-red-500 hover:text-red-700 ml-2 p-1"><Trash2 className="w-4 h-4" /></button></div>))}</div>)}<div className="space-y-2 p-3 bg-white rounded-lg border border-slate-200"><Input placeholder="Título do episódio" value={editArticleForm.newEpisode.title} onChange={(e) => setEditArticleForm({ ...editArticleForm, newEpisode: { ...editArticleForm.newEpisode, title: e.target.value } })} /><div className="flex gap-2"><Input placeholder="Duração (ex: 20:15)" value={editArticleForm.newEpisode.duration} onChange={(e) => setEditArticleForm({ ...editArticleForm, newEpisode: { ...editArticleForm.newEpisode, duration: e.target.value } })} className="flex-1" /><Input placeholder="Data" value={editArticleForm.newEpisode.date} onChange={(e) => setEditArticleForm({ ...editArticleForm, newEpisode: { ...editArticleForm.newEpisode, date: e.target.value } })} className="flex-1" /></div><Textarea placeholder="Descrição do episódio" value={editArticleForm.newEpisode.description} onChange={(e) => setEditArticleForm({ ...editArticleForm, newEpisode: { ...editArticleForm.newEpisode, description: e.target.value } })} rows={2} /><Button type="button" onClick={handleEditAddEpisode} disabled={!editArticleForm.newEpisode.title || !editArticleForm.newEpisode.duration} className="w-full bg-purple-600 hover:bg-purple-700 text-white" size="sm"><PlusCircle className="w-4 h-4 mr-1" /> Adicionar Episódio</Button></div></div></div>)}
            <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Referências</label><Textarea value={editArticleForm.references} onChange={(e) => setEditArticleForm({ ...editArticleForm, references: e.target.value })} rows={2} /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Observações</label><Textarea value={editArticleForm.observations} onChange={(e) => setEditArticleForm({ ...editArticleForm, observations: e.target.value })} rows={2} /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-slate-700 flex items-center gap-2"><Image className="w-4 h-4" /> Imagem de Capa</label><div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-red-400 transition-colors"><input type="file" accept="image/*" onChange={handleEditImageUpload} className="hidden" id="edit-cover-image-upload" ref={editFileInputRef} />{editCoverImagePreview ? (<div className="relative"><img src={editCoverImagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" /><button type="button" onClick={handleRemoveEditImage} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"><X className="w-4 h-4" /></button></div>) : selectedArticle?.imageUrl && !selectedArticle.imageUrl.startsWith('uploaded_') ? (<div className="relative"><img src={selectedArticle.imageUrl} alt="Capa atual" className="w-full h-48 object-cover rounded-lg" /><label htmlFor="edit-cover-image-upload" className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity cursor-pointer rounded-lg"><span className="text-white text-sm font-medium">Clique para alterar</span></label></div>) : (<label htmlFor="edit-cover-image-upload" className="cursor-pointer"><Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" /><p className="text-sm text-slate-600">Clique para fazer upload</p><p className="text-xs text-slate-400 mt-1">PNG, JPG, WebP até 5MB</p></label>)}</div><div className="space-y-2 mt-2"><label className="text-sm font-medium text-slate-700">Ou URL da Imagem</label><Input value={editArticleForm.imageUrl} onChange={(e) => setEditArticleForm({ ...editArticleForm, imageUrl: e.target.value })} placeholder="https://exemplo.com/imagem.jpg" type="url" /></div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEditArticleModalOpen(false)}>Cancelar</Button><Button onClick={handleSaveArticleEdit} className="bg-red-600 hover:bg-red-700">Salvar Alterações</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Editar Tópico */}
      <Dialog open={editTopicModalOpen} onOpenChange={setEditTopicModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-xl font-bold text-slate-900">Editar Tópico</DialogTitle><DialogDescription className="sr-only">Formulário para editar as informações do tópico do fórum selecionado</DialogDescription></DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Título *</label><Input value={editTopicForm.title} onChange={(e) => setEditTopicForm({ ...editTopicForm, title: e.target.value })} /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Conteúdo do Tópico *</label><Textarea value={editTopicForm.description} onChange={(e) => setEditTopicForm({ ...editTopicForm, description: e.target.value })} rows={8} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Categoria</label><select value={editTopicForm.topicCategory} onChange={(e) => setEditTopicForm({ ...editTopicForm, topicCategory: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"><option value="Economia">Economia</option><option value="Economia Actual">Economia Actual</option><option value="História Económica">História Económica</option><option value="Sociedade">Sociedade</option><option value="Análise Comparativa">Análise Comparativa</option><option value="Infraestrutura">Infraestrutura</option><option value="Tecnologia">Tecnologia</option><option value="Turismo">Turismo</option></select></div>
              <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Visibilidade</label><div className="flex gap-2"><button type="button" onClick={() => setEditTopicForm({ ...editTopicForm, topicType: 'public' })} className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border-2 transition-all ${editTopicForm.topicType === 'public' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 text-slate-600'}`}><Globe className="w-4 h-4" /><span className="text-sm">Público</span></button><button type="button" onClick={() => setEditTopicForm({ ...editTopicForm, topicType: 'private' })} className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border-2 transition-all ${editTopicForm.topicType === 'private' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-600'}`}><Lock className="w-4 h-4" /><span className="text-sm">Privado</span></button></div></div>
            </div>
            <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Referências</label><Textarea value={editTopicForm.references} onChange={(e) => setEditTopicForm({ ...editTopicForm, references: e.target.value })} rows={2} /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-slate-700 flex items-center gap-2"><Image className="w-4 h-4" /> URL da Imagem</label><Input value={editTopicForm.imageUrl} onChange={(e) => setEditTopicForm({ ...editTopicForm, imageUrl: e.target.value })} placeholder="https://exemplo.com/imagem.jpg" type="url" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEditTopicModalOpen(false)}>Cancelar</Button><Button onClick={handleSaveTopicEdit} className="bg-red-600 hover:bg-red-700">Salvar Alterações</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Eliminação */}
      <Dialog open={deleteConfirmModalOpen} onOpenChange={setDeleteConfirmModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-600" /> Confirmar Eliminação</DialogTitle><DialogDescription className="text-sm text-slate-600">Tem certeza que deseja eliminar este {deleteTarget?.type === 'article' ? 'artigo' : 'tópico'}? Esta ação não pode ser desfeita.</DialogDescription></DialogHeader>
          <DialogFooter className="flex gap-3 sm:justify-end"><Button variant="outline" onClick={() => { setDeleteConfirmModalOpen(false); setDeleteTarget(null); }}>Cancelar</Button><Button onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">Eliminar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
