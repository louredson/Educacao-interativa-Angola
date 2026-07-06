import { useAuth } from '../contexts/AuthContext';
import AdminQuizzes from './AdminQuizzes';
import { apiRequest, resolveUploadUrl } from '../services/api';
import api from '../services/api';
import { gerarRelatorioPdf, type RelatorioAdmin } from '../utils/relatorioPdf';
import { useNavigate, useSearchParams } from 'react-router';
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
  Search,
  Phone,
  Download,
  Loader2,
  Bell,
  Flag,
  Trash,
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
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Permite que o sino de notificações da Navbar (e outros links) abram
  // directamente numa tab específica do painel, ex: /admin?tab=notificacoes
  const ABAS_VALIDAS = ['overview', 'users', 'professores', 'notificacoes', 'denuncias', 'contents', 'ranking', 'quiz', 'reports'];
  const abaInicial = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(
    abaInicial && ABAS_VALIDAS.includes(abaInicial) ? abaInicial : 'overview'
  );
  // O componente não remonta ao navegar de /admin para /admin?tab=notificacoes
  // (é a mesma rota) — por isso o useState inicial não chega; isto garante
  // que clicar no sino de notificações muda mesmo de tab mesmo já estando no painel.
  useEffect(() => {
    const aba = searchParams.get('tab');
    if (aba && ABAS_VALIDAS.includes(aba) && aba !== activeTab) {
      setActiveTab(aba);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ── Relatório em PDF ──────────────────────────────────────────────────────
  type PresetRelatorio = 'hoje' | 'semana' | 'mes' | 'ano' | 'personalizado';
  const [presetRelatorio, setPresetRelatorio] = useState<PresetRelatorio>('mes');
  const [dataInicioCustom, setDataInicioCustom] = useState('');
  const [dataFimCustom, setDataFimCustom] = useState('');
  const [aGerarRelatorio, setAGerarRelatorio] = useState(false);
  const [erroRelatorio, setErroRelatorio] = useState('');

  // ── Notificações (dentro do painel — o admin já não visita /notifications) ──
  const [notificacoesAdmin, setNotificacoesAdmin] = useState<any[]>([]);
  const [naoLidasAdmin, setNaoLidasAdmin] = useState(0);
  const [aCarregarNotificacoes, setACarregarNotificacoes] = useState(true);
  const [aProcessarNotificacao, setAProcessarNotificacao] = useState<number | null>(null);
  const [resultadosNotificacao, setResultadosNotificacao] = useState<Record<number, 'apagado' | 'ignorado' | 'erro'>>({});

  const carregarNotificacoesAdmin = async () => {
    setACarregarNotificacoes(true);
    try {
      const res = await apiRequest<{ notificacoes: any[]; nao_lidas: number }>('/notificacoes');
      setNotificacoesAdmin(res.notificacoes ?? []);
      setNaoLidasAdmin(Number(res.nao_lidas ?? 0));
    } catch {
      setNotificacoesAdmin([]);
    } finally {
      setACarregarNotificacoes(false);
    }
  };

  const marcarNotificacaoLida = async (id: number) => {
    try {
      await apiRequest(`/notificacoes/${id}/ler`, { method: 'PATCH' });
      setNotificacoesAdmin(prev => prev.map(n => n.id === id ? { ...n, lida: 1 } : n));
      setNaoLidasAdmin(n => Math.max(0, n - 1));
    } catch { /* ignora */ }
  };

  const marcarTodasNotificacoesLidas = async () => {
    try {
      await apiRequest('/notificacoes/ler-todas', { method: 'PATCH' });
      setNotificacoesAdmin(prev => prev.map(n => ({ ...n, lida: 1 })));
      setNaoLidasAdmin(0);
    } catch { /* ignora */ }
  };

  const resolverComentarioNotificacao = async (n: any, acao: 'apagar' | 'ignorar') => {
    if (!n.entidade_id || aProcessarNotificacao) return;
    setAProcessarNotificacao(n.id);
    try {
      await apiRequest(`/admin/comentarios-denunciados/${n.entidade_id}`, { method: 'PATCH', json: { acao } });
      setResultadosNotificacao(prev => ({ ...prev, [n.id]: acao === 'apagar' ? 'apagado' : 'ignorado' }));
      if (!n.lida) void marcarNotificacaoLida(n.id);
    } catch {
      setResultadosNotificacao(prev => ({ ...prev, [n.id]: 'erro' }));
    } finally {
      setAProcessarNotificacao(null);
    }
  };

  useEffect(() => { void carregarNotificacoesAdmin(); }, []);

  // ── Denúncias do fórum (tópicos/respostas) ──────────────────────────────────
  const [denunciasForum, setDenunciasForum] = useState<any[]>([]);
  const [aCarregarDenunciasForum, setACarregarDenunciasForum] = useState(true);
  const [aResolverDenunciaForum, setAResolverDenunciaForum] = useState<number | null>(null);

  const carregarDenunciasForum = async () => {
    setACarregarDenunciasForum(true);
    try {
      const res = await apiRequest<any[]>('/admin/denuncias');
      setDenunciasForum(res ?? []);
    } catch {
      setDenunciasForum([]);
    } finally {
      setACarregarDenunciasForum(false);
    }
  };

  // ── Toast de feedback (substitui os alert() do browser) ────────────────────
  const [toast, setToast] = useState<{ title: string; message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mostrarToast = (title: string, message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ title, message, type });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 5000);
  };

  const resolverDenunciaForum = async (id: number, status: 'ignorada' | 'removida' | 'banido' | 'oculto', ehTopico = false) => {
    if (status === 'removida' && ehTopico && !confirm('Isto elimina o tópico permanentemente (incluindo as respostas). Continuar?')) return;
    if (status === 'banido' && !confirm('Isto desativa a conta do autor — ele deixa de conseguir entrar. Continuar?')) return;
    setAResolverDenunciaForum(id);
    try {
      await apiRequest(`/admin/denuncias/${id}`, { method: 'PATCH', json: { status } });
      setDenunciasForum(prev => prev.filter(d => d.id !== id));
      const feedback: Record<string, [string, string]> = {
        ignorada: ['Denúncia ignorada', 'A denúncia foi arquivada sem qualquer ação sobre o conteúdo.'],
        removida: [ehTopico ? 'Tópico eliminado' : 'Resposta removida', ehTopico ? 'O tópico e as suas respostas foram eliminados do fórum.' : 'A resposta deixou de ser visível no fórum.'],
        oculto:   ['Tópico ocultado', 'O tópico deixou de aparecer no fórum, mas não foi eliminado.'],
        banido:   ['Autor banido', 'A conta do autor foi desativada — ele deixa de conseguir entrar na plataforma.'],
      };
      const [t, m] = feedback[status] ?? ['Denúncia resolvida', 'A denúncia foi tratada com sucesso.'];
      mostrarToast(t, m, 'success');
    } catch (error) {
      mostrarToast('Não foi possível resolver a denúncia', (error as Error).message, 'error');
    } finally {
      setAResolverDenunciaForum(null);
    }
  };

  // ── Denúncias de conteúdo (vídeo/texto/podcast/jindungo) ────────────────────
  const [denunciasConteudo, setDenunciasConteudo] = useState<any[]>([]);
  const [aCarregarDenunciasConteudo, setACarregarDenunciasConteudo] = useState(true);
  const [aResolverDenunciaConteudo, setAResolverDenunciaConteudo] = useState<number | null>(null);

  const carregarDenunciasConteudo = async () => {
    setACarregarDenunciasConteudo(true);
    try {
      const res = await apiRequest<any[]>('/admin/denuncias-conteudo');
      setDenunciasConteudo(res ?? []);
    } catch {
      setDenunciasConteudo([]);
    } finally {
      setACarregarDenunciasConteudo(false);
    }
  };

  const resolverDenunciaConteudo = async (id: number, status: 'ignorada' | 'removida') => {
    if (status === 'removida' && !confirm('Isto elimina o conteúdo denunciado permanentemente. Continuar?')) return;
    setAResolverDenunciaConteudo(id);
    try {
      await apiRequest(`/admin/denuncias-conteudo/${id}`, { method: 'PATCH', json: { status } });
      setDenunciasConteudo(prev => prev.filter(d => d.id !== id));
      mostrarToast(
        status === 'removida' ? 'Conteúdo removido' : 'Denúncia ignorada',
        status === 'removida' ? 'O conteúdo denunciado foi eliminado da plataforma.' : 'A denúncia foi arquivada sem qualquer ação sobre o conteúdo.',
        'success',
      );
    } catch (error) {
      mostrarToast('Não foi possível resolver a denúncia', (error as Error).message, 'error');
    } finally {
      setAResolverDenunciaConteudo(null);
    }
  };

  useEffect(() => { void carregarDenunciasForum(); void carregarDenunciasConteudo(); }, []);

  // ── Activar/Suspender conta e permissão de criar quiz ───────────────────────
  const [aAlternarActivo, setAAlternarActivo] = useState<string | null>(null);
  const [aAlternarQuizPerm, setAAlternarQuizPerm] = useState<string | null>(null);

  const alternarUtilizadorActivo = async (id: string) => {
    setAAlternarActivo(id);
    try {
      const res = await apiRequest<{ ativo: boolean; message: string }>(`/admin/utilizadores/${id}/toggle`, { method: 'PATCH' });
      setUsers(prev => prev.map(u => String(u.id) === String(id) ? { ...u, ativo: res.ativo, isActive: res.ativo } : u));
      mostrarToast(
        res.ativo ? 'Conta reativada' : 'Conta banida',
        res.ativo ? 'O utilizador já pode voltar a entrar na plataforma.' : 'O utilizador deixa de conseguir usar a plataforma até ser reativado.',
        'success',
      );
    } catch (error) {
      mostrarToast('Não foi possível alterar o estado da conta', (error as Error).message, 'error');
    } finally {
      setAAlternarActivo(null);
    }
  };

  const alternarPermissaoQuiz = async (id: string, actual: boolean) => {
    setAAlternarQuizPerm(id);
    try {
      await apiRequest(`/admin/utilizadores/${id}/quiz-permissao`, {
        method: 'PATCH',
        json: { pode_criar_quiz: !actual },
      });
      setUsers(prev => prev.map(u => String(u.id) === String(id) ? { ...u, pode_criar_quiz: !actual } : u));
      mostrarToast(
        !actual ? 'Permissão concedida' : 'Permissão revogada',
        !actual ? 'Este utilizador já pode criar os seus próprios quizzes.' : 'Este utilizador deixou de poder criar quizzes.',
        'success',
      );
    } catch (error) {
      mostrarToast('Não foi possível alterar a permissão', (error as Error).message, 'error');
    } finally {
      setAAlternarQuizPerm(null);
    }
  };


  // ── Criar Professor ───────────────────────────────────────────────────────
  const [professorForm, setProfessorForm] = useState({ name: '', email: '', password: '' });
  const [professorFotoFile, setProfessorFotoFile] = useState<File | null>(null);
  const [professorFotoPreview, setProfessorFotoPreview] = useState('');
  const [aCriarProfessor, setACriarProfessor] = useState(false);
  const [erroProfessor, setErroProfessor] = useState('');
  const [sucessoProfessor, setSucessoProfessor] = useState('');

  // ── Editar / Apagar Professor ─────────────────────────────────────────────
  const [editProfessor, setEditProfessor] = useState<{ id: string; name: string; email: string } | null>(null);
  const [editProfessorForm, setEditProfessorForm] = useState({ name: '', email: '' });
  const [aEditarProfessor, setAEditarProfessor] = useState(false);
  const [aApagarProfessor, setAApagarProfessor] = useState<string | null>(null);

  const abrirEditProfessor = (p: any) => {
    setEditProfessor({ id: p.id, name: p.name, email: p.email });
    setEditProfessorForm({ name: p.name, email: p.email });
  };

  const guardarEditProfessor = async () => {
    if (!editProfessor) return;
    if (!editProfessorForm.name.trim() || !editProfessorForm.email.trim()) return;
    setAEditarProfessor(true);
    try {
      await apiRequest(`/users/${editProfessor.id}`, {
        method: 'PUT',
        json: { name: editProfessorForm.name.trim(), email: editProfessorForm.email.trim().toLowerCase() },
      });
      setUsers(prev => prev.map(u => String(u.id) === editProfessor.id
        ? { ...u, name: editProfessorForm.name.trim(), email: editProfessorForm.email.trim().toLowerCase() }
        : u
      ));
      setEditProfessor(null);
      mostrarToast('Professor atualizado', 'Os dados do professor foram guardados com sucesso.', 'success');
    } catch (err: any) {
      mostrarToast('Não foi possível editar o professor', err?.message || 'Verifica os dados e tenta novamente.', 'error');
    } finally {
      setAEditarProfessor(false);
    }
  };

  const apagarProfessor = async (id: string, nome: string) => {
    if (!confirm(`Tens a certeza que queres eliminar o professor "${nome}"? Esta acção não pode ser desfeita.`)) return;
    setAApagarProfessor(id);
    try {
      await apiRequest(`/users/${id}`, { method: 'DELETE' });
      setUsers(prev => prev.filter(u => String(u.id) !== id));
      mostrarToast('Professor eliminado', `A conta de "${nome}" foi eliminada da plataforma.`, 'success');
    } catch (err: any) {
      mostrarToast('Não foi possível eliminar o professor', err?.message || 'Tenta novamente dentro de momentos.', 'error');
    } finally {
      setAApagarProfessor(null);
    }
  };

  const handleCriarProfessor = async () => {
    setErroProfessor('');
    setSucessoProfessor('');
    if (!professorForm.name.trim() || !professorForm.email.trim() || !professorForm.password) {
      setErroProfessor('Preenche o nome, email e senha.');
      return;
    }
    if (professorForm.password.length < 8) {
      setErroProfessor('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    setACriarProfessor(true);
    try {
      let avatarUrl: string | null = null;
      if (professorFotoFile) {
        const fd = new FormData();
        fd.append('ficheiro', professorFotoFile);
        const up = await api.post('/content/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        avatarUrl = up.data?.url ?? null;
      }
      const novoProfessor = await apiRequest<any>('/users', {
        method: 'POST',
        json: {
          name: professorForm.name.trim(),
          email: professorForm.email.trim().toLowerCase(),
          password: professorForm.password,
          role: 'professor',
          avatarUrl,
        },
      });
      // Adiciona imediatamente ao state para o contador atualizar sem esperar loadData
      if (novoProfessor?.user ?? novoProfessor) {
        const raw = novoProfessor?.user ?? novoProfessor;
        setUsers(prev => [...prev, normalizeUser({ ...raw, tipo: 'professor', role: 'professor' })]);
      }
      setSucessoProfessor(`Professor "${professorForm.name}" criado com sucesso.`);
      setProfessorForm({ name: '', email: '', password: '' });
      setProfessorFotoFile(null);
      setProfessorFotoPreview('');
      // Sincroniza com o servidor em segundo plano
      loadData().catch(() => null);
    } catch (err: any) {
      setErroProfessor(err?.message || 'Não foi possível criar o professor. Verifica se o email já está em uso.');
    } finally {
      setACriarProfessor(false);
    }
  };
  const [users, setUsers] = useState<any[]>([]);
  const professores = users.filter((u: any) => u.role === 'professor' || u.tipo === 'professor');
  const [rankingTipoFilter, setRankingTipoFilter] = useState<'todos' | 'subscrito' | 'professor'>('todos');
  const [contents, setContents] = useState<any[]>([]);
  const [ranking, setRanking] = useState<any[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [contentType, setContentType] = useState<string>('texto_normal');
  
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
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'article' | 'topic'; id: string } | null>(null);
  
  // User detail modal
  const [userDetailModalOpen, setUserDetailModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [changingRole, setChangingRole] = useState(false);
  const [selectedNewRole, setSelectedNewRole] = useState<string>('');

  // Pesquisa e filtro de utilizadores
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('todos');

  // Pesquisa e filtro de conteúdos
  const [contentFilter, setContentFilter] = useState('todos');
  const [contentSearch, setContentSearch] = useState('');
  const [savingArticle, setSavingArticle] = useState(false);
  const [savingTopic, setSavingTopic] = useState(false);
  const [deletingContent, setDeletingContent] = useState(false);
  const [deletingUser, setDeletingUser] = useState(false);
  
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

  useEffect(() => {
    if (authLoading) return; // aguarda a restauração da sessão
    if (!isAuthenticated || !user?.isAdmin) {
      navigate('/');
      return;
    }
    void loadData();
  }, [authLoading, isAuthenticated, user, navigate]);

  // ── Normaliza um utilizador da API (chaves em PT) para a forma usada na UI ──
  const normalizeUser = (item: any) => {
    const tipo = String(item.tipo ?? item.role ?? 'subscrito');
    return {
      ...item,
      id: String(item.id),
      name: item.name ?? item.nome ?? '',
      email: item.email ?? '',
      province: item.province ?? item.provincia ?? null,
      institution: item.institution ?? item.instituicao ?? null,
      course: item.course ?? item.curso ?? null,
      createdAt: item.createdAt ?? item.criado_em ?? new Date().toISOString(),
      isAdmin: tipo === 'admin' || tipo === 'superadmin',
      tipo,
    };
  };

  // ── Mapeia uma linha da tabela `conteudo` para a forma da UI ──
  const mapConteudo = (row: any) => ({
    id: String(row.id),
    title: row.titulo ?? '',
    type: row.tipo ?? 'texto_normal',
    description: row.descricao ?? '',
    content: row.conteudo_completo ?? '',
    imageUrl: row.tipo === 'video' ? '' : (row.url_recurso ?? ''),
    videoUrl: row.tipo === 'video' ? (row.url_recurso ?? '') : '',
    videoDuration: row.duracao ?? '',
    podcastHost: row.apresentador ?? '',
    podcastCategory: row.categoria_podcast ?? '',
    episodes: [],
    createdAt: row.publicado_em ?? new Date().toISOString(),
    createdBy: row.autor_nome ?? 'Administração',
    status: 'published',
  });

  // ── Mapeia um tópico do fórum (tabela `topico_forum`) para a forma da UI ──
  const mapTopico = (row: any) => ({
    id: String(row.id),
    title: row.titulo ?? '',
    type: 'topico',
    description: row.descricao ?? '',
    topicType: row.tipo_privacidade === 'privado' ? 'private' : 'public',
    topicCategory: row.categoria ?? 'Economia',
    createdAt: row.criado_em ?? new Date().toISOString(),
    createdBy: row.autor_nome ?? 'Administração',
    status: 'published',
  });

  const loadData = async () => {
    // Utilizadores — base de dados real
    try {
      const usersResponse = await apiRequest<any[]>('/users');
      setUsers(usersResponse.map(normalizeUser));
    } catch (error) {
      console.error('Erro ao carregar utilizadores:', error);
      setUsers([]);
    }

    // Estatísticas agregadas — base de dados real
    try {
      setStats(await apiRequest<any>('/admin/stats'));
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }

    // Conteúdos (artigos/vídeos/podcasts) + tópicos do fórum — base de dados real
    try {
      const [conteudos, topicos] = await Promise.all([
        apiRequest<any[]>('/conteudos'),
        apiRequest<any[]>('/topicos'),
      ]);
      setContents([
        ...(conteudos ?? []).map(mapConteudo),
        ...(topicos ?? []).map(mapTopico),
      ]);
    } catch (error) {
      console.error('Erro ao carregar conteúdos:', error);
      setContents([]);
    }

    // Ranking — base de dados real
    try {
      const rankingData = await apiRequest<any[]>('/ranking');
      setRanking((rankingData ?? []).map((r) => ({
        name: r.nome ?? r.name ?? '—',
        province: r.provincia ?? r.province ?? '—',
        score: Number(r.pontuacao_total ?? r.score ?? 0),
        quizzes: Number(r.quizzes_completados ?? r.quizzes ?? 0),
        tipo: r.tipo ?? 'subscrito',
      })));
    } catch (error) {
      console.error('Erro ao carregar ranking:', error);
      setRanking([]);
    }
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

  const handleCreateContent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (contentType === 'video' && !newContent.videoUrl && !videoFile) {
      mostrarToast('Falta o vídeo', 'Insere o URL do vídeo ou faz upload de um ficheiro antes de publicar.', 'info');
      return;
    }

    if (contentType === 'topico' && !newContent.topicCategory) {
      mostrarToast('Falta a categoria', 'Escolhe uma categoria para o tópico antes de continuar.', 'info');
      return;
    }

    try {
      if (contentType === 'topico') {
        // Tópico do fórum → tabela topico_forum
        await apiRequest('/topicos', {
          method: 'POST',
          json: {
            titulo: newContent.title,
            descricao: newContent.description,
            categoria: newContent.topicCategory,
            tipo_privacidade: newContent.topicType === 'private' ? 'privado' : 'publico',
          },
        });
      } else {
        // Artigo/vídeo/podcast → tabela conteudo
        const isVideo = contentType === 'video';
        await apiRequest('/conteudos', {
          method: 'POST',
          json: {
            titulo: newContent.title,
            descricao: newContent.description,
            conteudo_completo: newContent.content || null,
            tipo: newContent.type,
            categoria: newContent.podcastCategory || null,
            duracao: (isVideo ? newContent.videoDuration : newContent.observations) || null,
            url_recurso: (isVideo ? newContent.videoUrl : newContent.imageUrl) || null,
            apresentador: newContent.podcastHost || null,
            categoria_podcast: newContent.podcastCategory || null,
            publicado_por: user?.id ?? null,
          },
        });
      }
    } catch (error) {
      console.error('Erro ao criar conteúdo:', error);
      mostrarToast('Não foi possível publicar', `O conteúdo não foi guardado: ${(error as Error).message}`, 'error');
      return;
    }

    await loadData();

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

    mostrarToast('Conteúdo publicado!', 'Já está disponível para toda a comunidade na página Explorar.', 'success');
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

  const handleSaveArticleEdit = async () => {
    if (!selectedArticle) return;
    setSavingArticle(true);
    const isVideo = selectedArticle.type === 'video';

    try {
      await apiRequest(`/conteudos/${selectedArticle.id}`, {
        method: 'PUT',
        json: {
          titulo: editArticleForm.title,
          descricao: editArticleForm.description,
          conteudo_completo: editArticleForm.content || null,
          duracao: editArticleForm.videoDuration || null,
          url_recurso: (isVideo ? editArticleForm.videoUrl : editArticleForm.imageUrl) || null,
          apresentador: editArticleForm.podcastHost || null,
          categoria_podcast: editArticleForm.podcastCategory || null,
        },
      });
    } catch (error) {
      console.error('Erro ao atualizar artigo:', error);
      mostrarToast('Não foi possível guardar as alterações', (error as Error).message, 'error');
      setSavingArticle(false);
      return;
    }

    await loadData();
    setSavingArticle(false);
    setEditArticleModalOpen(false);
    setSelectedArticle(null);
    setEditCoverImageFile(null);
    setEditCoverImagePreview(null);
    mostrarToast('Alterações guardadas', 'O conteúdo foi atualizado e já está visível para a comunidade.', 'success');
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

  const handleSaveTopicEdit = async () => {
    if (!selectedTopic) return;
    setSavingTopic(true);

    try {
      await apiRequest(`/topicos/${selectedTopic.id}`, {
        method: 'PUT',
        json: {
          titulo: editTopicForm.title,
          descricao: editTopicForm.description,
          categoria: editTopicForm.topicCategory,
          tipo_privacidade: editTopicForm.topicType === 'private' ? 'privado' : 'publico',
        },
      });
    } catch (error) {
      console.error('Erro ao atualizar tópico:', error);
      mostrarToast('Não foi possível guardar as alterações', (error as Error).message, 'error');
      setSavingTopic(false);
      return;
    }

    await loadData();
    setSavingTopic(false);
    setEditTopicModalOpen(false);
    setSelectedTopic(null);
    mostrarToast('Alterações guardadas', 'O tópico foi atualizado e já está visível no fórum.', 'success');
  };

  // ── Relatório em PDF: calcula o intervalo de datas do preset escolhido ────
  const calcularIntervaloRelatorio = (): { inicio: string; fim: string; label: string } | null => {
    const paraISO = (d: Date) => {
      const ano = d.getFullYear();
      const mes = String(d.getMonth() + 1).padStart(2, '0');
      const dia = String(d.getDate()).padStart(2, '0');
      return `${ano}-${mes}-${dia}`;
    };
    const hoje = new Date();

    if (presetRelatorio === 'hoje') {
      return { inicio: paraISO(hoje), fim: paraISO(hoje), label: 'Hoje' };
    }
    if (presetRelatorio === 'semana') {
      const diaSemana = hoje.getDay(); // 0=domingo
      const diffParaSegunda = diaSemana === 0 ? 6 : diaSemana - 1;
      const inicioSemana = new Date(hoje);
      inicioSemana.setDate(hoje.getDate() - diffParaSegunda);
      return { inicio: paraISO(inicioSemana), fim: paraISO(hoje), label: 'Esta semana' };
    }
    if (presetRelatorio === 'mes') {
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      return { inicio: paraISO(inicioMes), fim: paraISO(hoje), label: 'Este mês' };
    }
    if (presetRelatorio === 'ano') {
      const inicioAno = new Date(hoje.getFullYear(), 0, 1);
      return { inicio: paraISO(inicioAno), fim: paraISO(hoje), label: 'Este ano' };
    }
    // Personalizado
    if (!dataInicioCustom || !dataFimCustom) return null;
    if (dataFimCustom < dataInicioCustom) return null;
    return { inicio: dataInicioCustom, fim: dataFimCustom, label: 'Intervalo personalizado' };
  };

  const handleGerarRelatorioPdf = async () => {
    setErroRelatorio('');
    const intervalo = calcularIntervaloRelatorio();
    if (!intervalo) {
      setErroRelatorio('Escolhe uma data de início e de fim válidas (fim não pode ser antes do início).');
      return;
    }

    setAGerarRelatorio(true);
    try {
      const dados = await apiRequest<RelatorioAdmin>(
        `/admin/relatorio?inicio=${intervalo.inicio}&fim=${intervalo.fim}`,
      );
      gerarRelatorioPdf(dados, intervalo.label);
    } catch (error) {
      setErroRelatorio((error as Error).message || 'Não foi possível gerar o relatório. Tenta novamente.');
    } finally {
      setAGerarRelatorio(false);
    }
  };

  const handleDeleteClick = (type: 'article' | 'topic', id: string) => {
    setDeleteTarget({ type, id });
    setDeleteConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeletingContent(true);
    const endpoint = deleteTarget.type === 'topic'
      ? `/topicos/${deleteTarget.id}`
      : `/conteudos/${deleteTarget.id}`;

    try {
      await apiRequest(endpoint, { method: 'DELETE' });
    } catch (error) {
      console.error('Erro ao remover conteúdo:', error);
      mostrarToast('Não foi possível eliminar', (error as Error).message, 'error');
      setDeletingContent(false);
      return;
    }

    await loadData();
    setDeletingContent(false);
    setDeleteConfirmModalOpen(false);
    setDeleteTarget(null);
    mostrarToast(
      deleteTarget.type === 'article' ? 'Conteúdo eliminado' : 'Tópico eliminado',
      deleteTarget.type === 'article'
        ? 'O conteúdo foi removido da plataforma e já não aparece na página Explorar.'
        : 'O tópico foi removido do fórum, incluindo as suas respostas.',
      'success',
    );
  };

  const handleDeleteContent = (id: string) => {
    handleDeleteClick(
      contents.find(c => c.id === id)?.type === 'topico' ? 'topic' : 'article',
      id
    );
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Tem certeza que deseja apagar este usuário?')) {
      setDeletingUser(true);
      try {
        // Nota: não enviar cabeçalhos extra aqui (ex: 'x-user-id') — o CORS do
        // backend só permite 'Content-Type' e 'Authorization' (ver backend/src/app.ts).
        // Qualquer outro cabeçalho faz o browser bloquear o pedido no preflight,
        // e o erro nem chega a aparecer de forma clara — foi isto que impedia
        // o admin de eliminar utilizadores.
        await apiRequest(`/users/${id}`, { method: 'DELETE' });
        setUsers((current) => current.filter((u) => String(u.id) !== String(id)));
        mostrarToast('Utilizador eliminado', 'A conta e os dados associados foram removidos da plataforma.', 'success');
      } catch (error) {
        console.error('Erro ao remover utilizador:', error);
        mostrarToast('Não foi possível eliminar o utilizador', 'Verifica se a conta ainda existe e tenta novamente.', 'error');
      } finally {
        setDeletingUser(false);
      }
    }
  };

  const handleViewUser = (userItem: any) => {
    setSelectedUser(userItem);
    setSelectedNewRole(userItem.tipo ?? 'subscrito');
    setUserDetailModalOpen(true);
  };

  const handleChangeUserRole = async () => {
    if (!selectedUser || !selectedNewRole) return;
    setChangingRole(true);
    try {
      await apiRequest(`/admin/utilizadores/${selectedUser.id}/tipo`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: selectedNewRole }),
      });
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, tipo: selectedNewRole, isAdmin: selectedNewRole === 'admin' || selectedNewRole === 'superadmin' } : u));
      setSelectedUser((prev: any) => ({ ...prev, tipo: selectedNewRole, isAdmin: selectedNewRole === 'admin' || selectedNewRole === 'superadmin' }));
      mostrarToast('Papel atualizado', `O utilizador passou a ter o papel de ${selectedNewRole === 'professor' ? 'Professor' : selectedNewRole === 'subscrito' ? 'Subscrito' : 'Visitante'}.`, 'success');
    } catch (error) {
      console.error('Erro ao mudar papel:', error);
      mostrarToast('Não foi possível mudar o papel', 'O papel do utilizador não foi alterado. Tenta novamente.', 'error');
    } finally {
      setChangingRole(false);
    }
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

  const totalUsers = users.length;
  const totalContents = contents.length;
  const totalArticles = getArticles().length;
  const totalTopics = getTopics().length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Toast de feedback */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[100] max-w-sm w-full animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className={`rounded-xl shadow-lg border p-4 bg-white ${
            toast.type === 'success' ? 'border-emerald-200' : toast.type === 'error' ? 'border-red-200' : 'border-slate-200'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                toast.type === 'success' ? 'bg-emerald-50 text-emerald-600' : toast.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'
              }`}>
                {toast.type === 'success' ? <UserCheck className="w-4 h-4" /> : toast.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
                <p className="text-xs text-slate-600 mt-0.5">{toast.message}</p>
              </div>
              <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <section className="bg-gradient-to-r from-[#800020] via-black to-yellow-600 text-white">
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex flex-wrap gap-2 h-auto bg-transparent justify-start">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#800020] data-[state=active]:text-white">
              <LayoutDashboard className="w-4 h-4 mr-2" /> Visão Geral
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-[#800020] data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" /> Usuários
            </TabsTrigger>
            <TabsTrigger value="notificacoes" className="relative data-[state=active]:bg-[#800020] data-[state=active]:text-white">
              <Bell className="w-4 h-4 mr-2" /> Notificações
              {naoLidasAdmin > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-slate-900 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {naoLidasAdmin}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="professores" className="data-[state=active]:bg-[#800020] data-[state=active]:text-white">
              <GraduationCap className="w-4 h-4 mr-2" /> Professores
            </TabsTrigger>
            <TabsTrigger value="denuncias" className="relative data-[state=active]:bg-[#800020] data-[state=active]:text-white">
              <Flag className="w-4 h-4 mr-2" /> Denúncias
              {(denunciasForum.length + denunciasConteudo.length) > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-slate-900 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {denunciasForum.length + denunciasConteudo.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="contents" className="data-[state=active]:bg-[#800020] data-[state=active]:text-white">
              <FileText className="w-4 h-4 mr-2" /> Conteúdos
            </TabsTrigger>
            <TabsTrigger value="ranking" className="data-[state=active]:bg-[#800020] data-[state=active]:text-white">
              <Trophy className="w-4 h-4 mr-2" /> Ranking
            </TabsTrigger>
            <TabsTrigger value="quiz" className="data-[state=active]:bg-[#800020] data-[state=active]:text-white">
              <FileQuestion className="w-4 h-4 mr-2" /> Gerar Quiz
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-[#800020] data-[state=active]:text-white">
              <BarChart3 className="w-4 h-4 mr-2" /> Relatórios
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#800020]" /> Atividade Recente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { icon: UserCheck, color: 'text-blue-600', label: 'Utilizadores registados', desc: stats?.novos_hoje != null ? `${stats.novos_hoje} novos hoje` : `${totalUsers} no total`, count: stats?.total_utilizadores ?? totalUsers },
                    { icon: BookOpen, color: 'text-green-600', label: 'Artigos / conteúdos', desc: `Conteúdos publicados na biblioteca`, count: stats?.total_conteudos ?? totalArticles },
                    { icon: MessageSquare, color: 'text-yellow-600', label: 'Tópicos do fórum', desc: `${stats?.total_respostas_forum ?? 0} respostas no total`, count: stats?.total_topicos ?? totalTopics },
                    { icon: FileQuestion, color: 'text-orange-600', label: 'Quizzes ativos', desc: `${stats?.total_perguntas_quiz ?? 0} perguntas · ${stats?.total_tentativas_quiz ?? 0} tentativas`, count: stats?.total_quizzes ?? 0 },
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
          <TabsContent value="users" className="space-y-4">
            {/* Cabeçalho + pesquisa */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Users className="w-5 h-5 text-blue-600" /> Gestão de Utilizadores
                    </CardTitle>
                    <CardDescription className="mt-0.5">
                      {totalUsers} utilizador{totalUsers !== 1 ? 'es' : ''} registado{totalUsers !== 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                  <div className="overflow-x-auto -mx-1 px-1">
                    <div className="flex gap-1.5 w-max sm:w-auto sm:flex-wrap">
                      {['todos','subscrito','professor','admin'].map(r => (
                        <button key={r} onClick={() => setUserRoleFilter(r)}
                          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${userRoleFilter === r ? 'bg-[#800020] text-white border-[#800020]' : 'bg-white text-slate-600 border-slate-300 hover:border-[#FBBCB8]'}`}>
                          {r === 'todos' ? 'Todos' : r === 'subscrito' ? 'Subscritos' : r === 'professor' ? 'Professores' : 'Admins'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="relative mt-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Pesquisar por nome, email ou província..."
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A0002A] bg-white"
                  />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {(() => {
                  const q = userSearch.toLowerCase();
                  const filtered = users.filter(u => {
                    const matchRole = userRoleFilter === 'todos' || u.tipo === userRoleFilter;
                    const matchQ = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.province ?? '').toLowerCase().includes(q);
                    return matchRole && matchQ;
                  });

                  const roleStyle: Record<string, string> = {
                    superadmin: 'bg-[#FEE8E8] text-[#5C0016] border-[#FDD5D5]',
                    admin:      'bg-orange-100 text-orange-700 border-orange-200',
                    professor:  'bg-blue-100 text-blue-700 border-blue-200',
                    subscrito:  'bg-green-100 text-green-700 border-green-200',
                    visitante:  'bg-slate-100 text-slate-600 border-slate-200',
                  };
                  const roleLabel: Record<string, string> = {
                    superadmin: 'Super-Admin', admin: 'Admin',
                    professor: 'Professor', subscrito: 'Subscrito', visitante: 'Visitante',
                  };
                  const avatarColor: Record<string, string> = {
                    superadmin: 'from-[#800020] to-rose-600',
                    admin:      'from-orange-400 to-amber-500',
                    professor:  'from-blue-500 to-indigo-600',
                    subscrito:  'from-emerald-400 to-teal-500',
                    visitante:  'from-slate-400 to-slate-500',
                  };

                  if (filtered.length === 0) return (
                    <div className="text-center py-12 text-slate-400">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">{userSearch || userRoleFilter !== 'todos' ? 'Nenhum utilizador encontrado.' : 'Nenhum utilizador registado ainda.'}</p>
                    </div>
                  );

                  return (
                    <div className="divide-y divide-slate-100">
                      {filtered.map(userItem => (
                        <div key={userItem.id} className="flex items-center gap-4 py-3.5 hover:bg-slate-50 rounded-lg px-2 -mx-2 transition-colors group">
                          {/* Avatar */}
                          <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${avatarColor[userItem.tipo] ?? avatarColor.visitante} flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden`}>
                            {userItem.avatar_url ? (
                              <img src={resolveUploadUrl(userItem.avatar_url)} alt={userItem.name} className="w-full h-full object-cover" />
                            ) : (
                              userItem.name.substring(0, 2).toUpperCase()
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-slate-900 text-sm truncate">{userItem.name}</span>
                              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${roleStyle[userItem.tipo] ?? roleStyle.visitante}`}>
                                {roleLabel[userItem.tipo] ?? userItem.tipo}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 truncate mt-0.5">{userItem.email}</p>
                            <div className="flex items-center gap-3 mt-1">
                              {userItem.province && <span className="text-[11px] text-slate-400 flex items-center gap-0.5"><MapPin className="w-3 h-3" />{userItem.province}</span>}
                              <span className="text-[11px] text-slate-400 flex items-center gap-0.5"><Clock className="w-3 h-3" />{new Date(userItem.createdAt).toLocaleDateString('pt-PT')}</span>
                            </div>
                          </div>

                          {/* Acções */}
                          <div className="flex items-center gap-2 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                            <Button variant="outline" size="sm" onClick={() => handleViewUser(userItem)}
                              className="h-8 px-3 text-xs border-slate-300 hover:border-blue-400 hover:text-blue-600">
                              <Eye className="w-3.5 h-3.5 mr-1" /> Ver perfil
                            </Button>
                            {userItem.tipo !== 'admin' && userItem.tipo !== 'superadmin' && (
                              <Button variant="ghost" size="sm"
                                onClick={() => alternarPermissaoQuiz(userItem.id, !!userItem.pode_criar_quiz)}
                                disabled={aAlternarQuizPerm === userItem.id}
                                title={userItem.pode_criar_quiz ? 'Revogar permissão de criar quizzes' : 'Permitir criar quizzes'}
                                className={`h-8 px-3 text-xs ${userItem.pode_criar_quiz ? 'text-amber-600 hover:bg-amber-50' : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'}`}>
                                <FileQuestion className="w-3.5 h-3.5 mr-1" /> {userItem.pode_criar_quiz ? 'Quiz: Sim' : 'Quiz: Não'}
                              </Button>
                            )}
                            {userItem.tipo !== 'admin' && userItem.tipo !== 'superadmin' && (
                              <Button variant="ghost" size="sm"
                                onClick={() => {
                                  if (userItem.ativo === false) {
                                    if (confirm(`Reativar a conta de "${userItem.name}"? O utilizador volta a poder entrar.`)) alternarUtilizadorActivo(userItem.id);
                                  } else {
                                    if (confirm(`Banir a conta de "${userItem.name}"? O utilizador deixa de poder usar a plataforma até ser reativado.`)) alternarUtilizadorActivo(userItem.id);
                                  }
                                }}
                                disabled={aAlternarActivo === userItem.id}
                                title={userItem.ativo === false ? 'Reativar conta banida' : 'Banir conta'}
                                className={`h-8 px-3 text-xs ${userItem.ativo === false ? 'text-red-600 bg-red-50 hover:bg-green-50 hover:text-green-600' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`}>
                                <Lock className="w-3.5 h-3.5 mr-1" />
                                {userItem.ativo === false ? 'Banido' : 'Banir'}
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(userItem.id)} disabled={deletingUser}
                              className="h-8 w-8 p-0 text-slate-400 hover:text-[#800020] hover:bg-[#FFF2F2]">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notificações Tab */}
          <TabsContent value="notificacoes" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-[#800020]" /> Notificações
                  </CardTitle>
                  <CardDescription>
                    Avisos do sistema — principalmente comentários denunciados por utilizadores,
                    à espera de seres tu a decidir se apagas ou ignoras.
                  </CardDescription>
                </div>
                {naoLidasAdmin > 0 && (
                  <Button size="sm" variant="outline" onClick={marcarTodasNotificacoesLidas}>
                    Marcar todas como lidas
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {aCarregarNotificacoes ? (
                  <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-[#800020]" /></div>
                ) : notificacoesAdmin.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-8">Sem notificações de momento.</p>
                ) : (
                  <div className="space-y-2">
                    {notificacoesAdmin.map((n: any) => (
                      <div
                        key={n.id}
                        onClick={() => { if (!n.lida) void marcarNotificacaoLida(n.id); }}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${n.lida ? 'border-slate-100 bg-white' : 'border-[#FDD5D5] bg-[#FFF2F2]'}`}
                      >
                        <div className="flex items-start gap-2">
                          {n.tipo === 'comentario_denunciado' ? (
                            <Flag className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                          ) : (
                            <Bell className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-800">{n.titulo ?? 'Notificação'}</p>
                            <p className="text-xs text-slate-600 mt-0.5">{n.mensagem}</p>
                            <p className="text-[11px] text-slate-400 mt-1">{new Date(n.criada_em).toLocaleString('pt-PT')}</p>

                            {n.tipo === 'comentario_denunciado' && (
                              resultadosNotificacao[n.id] ? (
                                <p className={`mt-2 text-xs font-semibold ${resultadosNotificacao[n.id] === 'apagado' ? 'text-[#800020]' : resultadosNotificacao[n.id] === 'ignorado' ? 'text-slate-500' : 'text-red-600'}`}>
                                  {resultadosNotificacao[n.id] === 'apagado' ? '✓ Comentário apagado' : resultadosNotificacao[n.id] === 'ignorado' ? 'Denúncia ignorada' : 'Não foi possível processar.'}
                                </p>
                              ) : (
                                <div className="flex items-center gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    size="sm"
                                    disabled={aProcessarNotificacao === n.id}
                                    onClick={() => resolverComentarioNotificacao(n, 'apagar')}
                                    className="h-7 px-3 text-xs bg-[#800020] hover:bg-[#5C0016] text-white"
                                  >
                                    <Trash2 className="w-3 h-3 mr-1" /> Apagar comentário
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={aProcessarNotificacao === n.id}
                                    onClick={() => resolverComentarioNotificacao(n, 'ignorar')}
                                    className="h-7 px-3 text-xs"
                                  >
                                    Ignorar
                                  </Button>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Professores Tab */}
          <TabsContent value="professores" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-[#800020]" /> Cadastrar Professor
                </CardTitle>
                <CardDescription>
                  Cria uma conta com o papel "professor" — pode publicar conteúdos (incluindo Textos com
                  Jindungo) usando o seu próprio nome e foto, e gerir os pedidos de acesso aos textos que criar.
                  O cadastro público continua exclusivo para alunos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {professorFotoPreview ? (
                      <img src={professorFotoPreview} alt="Pré-visualização" className="w-full h-full object-cover" />
                    ) : (
                      <GraduationCap className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      id="professor-foto"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        setProfessorFotoFile(file);
                        setProfessorFotoPreview(file ? URL.createObjectURL(file) : '');
                      }}
                    />
                    <label
                      htmlFor="professor-foto"
                      className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Escolher foto de perfil
                    </label>
                    <p className="mt-1 text-[11px] text-slate-400">PNG, JPG ou WEBP. Opcional, mas recomendado.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Nome completo</label>
                    <input
                      type="text"
                      value={professorForm.name}
                      onChange={(e) => setProfessorForm({ ...professorForm, name: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]"
                      placeholder="Nome do professor"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                    <input
                      type="email"
                      value={professorForm.email}
                      onChange={(e) => setProfessorForm({ ...professorForm, email: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]"
                      placeholder="professor@exemplo.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Senha (mín. 8 caracteres)</label>
                    <input
                      type="password"
                      value={professorForm.password}
                      onChange={(e) => setProfessorForm({ ...professorForm, password: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {erroProfessor && <p className="text-sm text-red-600">{erroProfessor}</p>}
                {sucessoProfessor && <p className="text-sm text-green-600">{sucessoProfessor}</p>}

                <Button
                  onClick={handleCriarProfessor}
                  disabled={aCriarProfessor}
                  className="bg-[#800020] hover:bg-[#5C0016] text-white"
                >
                  {aCriarProfessor ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> A criar...</>
                  ) : (
                    <><GraduationCap className="w-4 h-4 mr-2" /> Criar Professor</>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Professores Cadastrados ({professores.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {professores.length === 0 ? (
                  <p className="text-sm text-slate-500">Ainda não cadastraste nenhum professor.</p>
                ) : (
                  <div className="space-y-2">
                    {professores.map((p: any) => (
                      <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100">
                        <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                          {p.avatarUrl || p.avatar_url ? (
                            <img src={resolveUploadUrl(p.avatarUrl || p.avatar_url)} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <GraduationCap className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-800 truncate">{p.name}</p>
                          <p className="text-xs text-slate-400 truncate">{p.email}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => abrirEditProfessor(p)}
                            className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-[#800020] transition-colors"
                            title="Editar professor"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => apagarProfessor(p.id, p.name)}
                            disabled={aApagarProfessor === p.id}
                            className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-red-600 transition-colors disabled:opacity-40"
                            title="Eliminar professor"
                          >
                            {aApagarProfessor === p.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Modal Editar Professor */}
          {editProfessor && (
            <Dialog open={!!editProfessor} onOpenChange={() => setEditProfessor(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Editar Professor</DialogTitle>
                  <DialogDescription>Atualiza o nome e email do professor.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Nome</label>
                    <Input
                      value={editProfessorForm.name}
                      onChange={e => setEditProfessorForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Nome do professor"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                    <Input
                      type="email"
                      value={editProfessorForm.email}
                      onChange={e => setEditProfessorForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditProfessor(null)}>Cancelar</Button>
                  <Button
                    onClick={guardarEditProfessor}
                    disabled={aEditarProfessor}
                    className="bg-[#800020] hover:bg-[#5C0016] text-white"
                  >
                    {aEditarProfessor ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> A guardar...</> : 'Guardar'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}


          {/* Denúncias Tab */}
          <TabsContent value="denuncias" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="w-5 h-5 text-red-600" /> Denúncias do Fórum
                </CardTitle>
                <CardDescription>Tópicos e respostas denunciados por utilizadores.</CardDescription>
              </CardHeader>
              <CardContent>
                {aCarregarDenunciasForum ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-[#800020]" /></div>
                ) : denunciasForum.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-6">Sem denúncias pendentes no fórum.</p>
                ) : (
                  <div className="space-y-2">
                    {denunciasForum.map((d: any) => (
                      <div key={d.id} className="p-3 rounded-lg border border-slate-100">
                        <p className="text-sm font-semibold text-slate-800">{d.denunciado_por_nome} denunciou {d.resposta_forum_id ? 'uma resposta' : 'um tópico'}</p>
                        {d.topico_titulo && !d.resposta_forum_id && <p className="text-xs text-slate-600 mt-0.5">Tópico: <span className="font-medium">"{d.topico_titulo}"</span></p>}
                        {d.motivo && <p className="text-xs text-slate-500 mt-0.5">Motivo: {d.motivo}</p>}
                        {d.resposta_conteudo && <p className="text-xs text-slate-600 italic mt-1 line-clamp-2">"{d.resposta_conteudo}"</p>}
                        {d.descricao_detalhada && <p className="text-xs text-slate-500 mt-1">{d.descricao_detalhada}</p>}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Button size="sm" disabled={aResolverDenunciaForum === d.id} onClick={() => resolverDenunciaForum(d.id, 'removida', !d.resposta_forum_id)} className="h-7 px-3 text-xs bg-[#800020] hover:bg-[#5C0016] text-white">
                            <Trash2 className="w-3 h-3 mr-1" /> {d.resposta_forum_id ? 'Remover' : 'Eliminar tópico'}
                          </Button>
                          {!d.resposta_forum_id && d.topico_forum_id && (
                            <Button size="sm" variant="outline" disabled={aResolverDenunciaForum === d.id} onClick={() => resolverDenunciaForum(d.id, 'oculto')} className="h-7 px-3 text-xs text-amber-700 border-amber-300 hover:bg-amber-50">
                              <Eye className="w-3 h-3 mr-1" /> Ocultar tópico
                            </Button>
                          )}
                          <Button size="sm" variant="outline" disabled={aResolverDenunciaForum === d.id} onClick={() => resolverDenunciaForum(d.id, 'banido')} className="h-7 px-3 text-xs">
                            Banir autor
                          </Button>
                          <Button size="sm" variant="outline" disabled={aResolverDenunciaForum === d.id} onClick={() => resolverDenunciaForum(d.id, 'ignorada')} className="h-7 px-3 text-xs">
                            Ignorar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="w-5 h-5 text-red-600" /> Denúncias de Conteúdo
                </CardTitle>
                <CardDescription>Vídeos, textos, podcasts e Textos com Jindungo denunciados por utilizadores.</CardDescription>
              </CardHeader>
              <CardContent>
                {aCarregarDenunciasConteudo ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-[#800020]" /></div>
                ) : denunciasConteudo.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-6">Sem denúncias pendentes de conteúdo.</p>
                ) : (
                  <div className="space-y-2">
                    {denunciasConteudo.map((d: any) => (
                      <div key={d.id} className="p-3 rounded-lg border border-slate-100">
                        <p className="text-sm font-semibold text-slate-800">{d.denunciado_por_nome} denunciou "{d.conteudo_titulo}"</p>
                        <p className="text-xs text-slate-500 mt-0.5">Tipo: {d.conteudo_tipo} · Motivo: {d.motivo}</p>
                        {d.descricao_detalhada && <p className="text-xs text-slate-600 italic mt-1">{d.descricao_detalhada}</p>}
                        <div className="flex items-center gap-2 mt-2">
                          <Button size="sm" disabled={aResolverDenunciaConteudo === d.id} onClick={() => resolverDenunciaConteudo(d.id, 'removida')} className="h-7 px-3 text-xs bg-[#800020] hover:bg-[#5C0016] text-white">
                            <Trash2 className="w-3 h-3 mr-1" /> Eliminar conteúdo
                          </Button>
                          <Button size="sm" variant="outline" disabled={aResolverDenunciaConteudo === d.id} onClick={() => resolverDenunciaConteudo(d.id, 'ignorada')} className="h-7 px-3 text-xs">
                            Ignorar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>


          {/* Contents Tab */}
          <TabsContent value="contents" className="space-y-4">
            {(() => {
              const typeColors: Record<string, string> = {
                texto_normal:   'bg-blue-50 border-blue-200 text-blue-700',
                texto_jindungo: 'bg-amber-50 border-amber-200 text-amber-700',
                video:          'bg-red-50 border-red-200 text-red-700',
                podcast:        'bg-purple-50 border-purple-200 text-purple-700',
                topico:         'bg-green-50 border-green-200 text-green-700',
              };
              const filtered = contents.filter(c => {
                const matchType = contentFilter === 'todos' || c.type === contentFilter;
                const q = contentSearch.toLowerCase();
                const matchQ = !q || c.title.toLowerCase().includes(q) || (c.description ?? '').toLowerCase().includes(q) || c.createdBy.toLowerCase().includes(q);
                return matchType && matchQ;
              });
              return (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <FileText className="w-5 h-5 text-purple-600" /> Gestão de Conteúdos
                        </CardTitle>
                        <CardDescription className="mt-0.5">{filtered.length} de {totalContents} conteúdos</CardDescription>
                      </div>
                      <div className="overflow-x-auto -mx-1 px-1">
                        <div className="flex gap-1.5 w-max sm:w-auto sm:flex-wrap">
                          {['todos','texto_normal','texto_jindungo','video','podcast','topico'].map(t => (
                            <button key={t} onClick={() => setContentFilter(t)}
                              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${contentFilter === t ? 'bg-[#800020] text-white border-[#800020]' : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'}`}>
                              {t === 'todos' ? 'Todos' : t === 'texto_normal' ? 'Texto' : t === 'texto_jindungo' ? 'Jindungo' : t === 'video' ? 'Vídeo' : t === 'podcast' ? 'Podcast' : 'Tópico'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="relative mt-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input type="text" placeholder="Pesquisar por título, descrição ou autor..." value={contentSearch} onChange={e => setContentSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A0002A] bg-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {filtered.length === 0 ? (
                      <div className="text-center py-12 text-slate-400">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">{contentSearch || contentFilter !== 'todos' ? 'Nenhum conteúdo encontrado.' : 'Nenhum conteúdo publicado ainda.'}</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {filtered.map(content => (
                          <div key={content.id} className="flex items-center gap-4 py-3.5 hover:bg-slate-50 rounded-lg px-2 -mx-2 transition-colors group">
                            {/* Ícone tipo */}
                            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${typeColors[content.type] ?? 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                              {getContentTypeIcon(content.type)}
                            </div>
                            {/* Info */}
                            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => content.type === 'topico' ? navigate('/forum') : navigate(`/explorar/${content.id}`)}>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-slate-900 text-sm truncate">{content.title}</span>
                                {content.type === 'topico' && (
                                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${content.topicType === 'public' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                    {content.topicType === 'public' ? 'Público' : 'Privado'}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 truncate mt-0.5">{content.description}</p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-[11px] text-slate-400 flex items-center gap-0.5"><Calendar className="w-3 h-3" />{new Date(content.createdAt).toLocaleDateString('pt-PT')}</span>
                                <span className="text-[11px] text-slate-400">Por {content.createdBy}</span>
                              </div>
                            </div>
                            {/* Acções */}
                            <div className="flex items-center gap-1.5 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="sm" title="Ver preview"
                                onClick={() => content.type === 'topico' ? navigate('/forum') : navigate(`/explorar/${content.id}`)}
                                className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" title="Editar"
                                onClick={() => content.type === 'topico' ? handleEditTopic(content) : handleEditArticle(content)}
                                className="h-8 w-8 p-0 text-slate-400 hover:text-[#800020] hover:bg-[#FFF2F2]">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" title="Eliminar"
                                onClick={() => handleDeleteContent(content.id)}
                                className="h-8 w-8 p-0 text-slate-400 hover:text-[#800020] hover:bg-[#FFF2F2]">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })()}
          </TabsContent>

          {/* Ranking Tab */}
          <TabsContent value="ranking" className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-600" /> Ranking Geral</CardTitle><CardDescription>Classificação completa de todos os participantes</CardDescription></CardHeader>
              <CardContent>
                <div className="flex gap-1.5 mb-4">
                  {([
                    { v: 'todos', label: 'Todos' },
                    { v: 'subscrito', label: 'Alunos' },
                    { v: 'professor', label: 'Professores' },
                  ] as const).map(f => (
                    <button
                      key={f.v}
                      onClick={() => setRankingTipoFilter(f.v)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${rankingTipoFilter === f.v ? 'bg-[#800020] text-white border-[#800020]' : 'bg-white text-slate-600 border-slate-300 hover:border-[#FBBCB8]'}`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <div className="space-y-3">
                  {ranking.filter((r: any) => rankingTipoFilter === 'todos' || r.tipo === rankingTipoFilter).map((userRank, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500' : index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' : 'bg-gradient-to-br from-slate-400 to-slate-600'}`}>{index + 1}</div>
                        <div><p className="font-medium text-slate-900">{userRank.name}</p><div className="flex items-center gap-2 text-sm text-slate-600"><span>{userRank.quizzes} quizzes</span><span>•</span><span>{userRank.province}</span></div></div>
                      </div>
                      <div className="text-right"><p className="text-2xl font-bold text-yellow-600">{userRank.score}</p><p className="text-xs text-slate-500">pontos</p></div>
                    </div>
                  ))}
                  {ranking.filter((r: any) => rankingTipoFilter === 'todos' || r.tipo === rankingTipoFilter).length === 0 && (<div className="text-center py-8 text-slate-500"><Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" /><p>Nenhum participante ainda</p></div>)}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quiz Tab */}
          <TabsContent value="quiz" className="space-y-6">
            <AdminQuizzes embedded />
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-[#800020]" /> Exportar Relatório em PDF
                </CardTitle>
                <CardDescription>
                  Gera um relatório com as informações relevantes do sistema, tabeladas e organizadas,
                  para o período que escolheres.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {([
                    { value: 'hoje', label: 'Hoje' },
                    { value: 'semana', label: 'Esta semana' },
                    { value: 'mes', label: 'Este mês' },
                    { value: 'ano', label: 'Este ano' },
                    { value: 'personalizado', label: 'Intervalo personalizado' },
                  ] as const).map((opcao) => (
                    <button
                      key={opcao.value}
                      onClick={() => { setPresetRelatorio(opcao.value); setErroRelatorio(''); }}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        presetRelatorio === opcao.value
                          ? 'bg-[#800020] text-white border-[#800020]'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-[#FBBCB8]'
                      }`}
                    >
                      {opcao.label}
                    </button>
                  ))}
                </div>

                {presetRelatorio === 'personalizado' && (
                  <div className="flex flex-wrap items-end gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Data de início</label>
                      <input
                        type="date"
                        value={dataInicioCustom}
                        onChange={(e) => setDataInicioCustom(e.target.value)}
                        max={dataFimCustom || undefined}
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A0002A] bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Data de fim</label>
                      <input
                        type="date"
                        value={dataFimCustom}
                        onChange={(e) => setDataFimCustom(e.target.value)}
                        min={dataInicioCustom || undefined}
                        max={new Date().toISOString().slice(0, 10)}
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A0002A] bg-white"
                      />
                    </div>
                  </div>
                )}

                {erroRelatorio && (
                  <p className="text-sm text-[#5C0016] bg-[#FFF2F2] border border-[#FDD5D5] rounded-lg px-3 py-2">
                    {erroRelatorio}
                  </p>
                )}

                <Button
                  onClick={handleGerarRelatorioPdf}
                  disabled={aGerarRelatorio || (presetRelatorio === 'personalizado' && (!dataInicioCustom || !dataFimCustom))}
                  className="bg-[#800020] hover:bg-[#5C0016] text-white"
                >
                  {aGerarRelatorio ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> A gerar relatório...</>
                  ) : (
                    <><Download className="w-4 h-4 mr-2" /> Gerar e descarregar PDF</>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-slate-700" /> Relatório Completo do Sistema</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200"><div className="flex items-center gap-3 mb-2"><Users className="w-5 h-5 text-blue-600" /><h4 className="font-semibold text-slate-900">Usuários</h4></div><p className="text-3xl font-bold text-blue-600 mb-1">{totalUsers}</p><p className="text-sm text-slate-600">Total registados</p></div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200"><div className="flex items-center gap-3 mb-2"><FileText className="w-5 h-5 text-green-600" /><h4 className="font-semibold text-slate-900">Conteúdos</h4></div><p className="text-3xl font-bold text-green-600 mb-1">{totalContents}</p><p className="text-sm text-slate-600">Publicados</p></div>
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200"><div className="flex items-center gap-3 mb-2"><MessageSquare className="w-5 h-5 text-purple-600" /><h4 className="font-semibold text-slate-900">Engajamento</h4></div><p className="text-3xl font-bold text-purple-600 mb-1">{totalArticles + totalTopics}</p><p className="text-sm text-slate-600">Artigos e Tópicos</p></div>
                </div>
                <div className="border-t pt-6"><h4 className="font-semibold text-slate-900 mb-4">Distribuição por Província</h4><div className="space-y-2">{['Luanda', 'Benguela', 'Huambo', 'Cabinda', 'Huíla'].map((province) => { const count = users.filter(u => u.province === province).length; const percentage = totalUsers > 0 ? (count / totalUsers) * 100 : 0; return (<div key={province}><div className="flex justify-between text-sm mb-1"><span className="text-slate-700">{province}</span><span className="text-slate-600">{count} usuários ({percentage.toFixed(1)}%)</span></div><div className="h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#800020] to-yellow-600" style={{ width: `${percentage}%` }} /></div></div>); })}</div></div>
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
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">Perfil do Utilizador</DialogTitle>
            <DialogDescription className="sr-only">Informações detalhadas do utilizador</DialogDescription>
          </DialogHeader>
          {selectedUser && (() => {
            const userCounts = getUserContentCounts(selectedUser.name);
            const rankEntry  = ranking.find((r: any) => r.name === selectedUser.name);
            const roleStyle: Record<string,string> = {
              superadmin: 'bg-[#FEE8E8] text-[#5C0016] border-[#FDD5D5]',
              admin:      'bg-orange-100 text-orange-700 border-orange-200',
              professor:  'bg-blue-100 text-blue-700 border-blue-200',
              subscrito:  'bg-green-100 text-green-700 border-green-200',
              visitante:  'bg-slate-100 text-slate-600 border-slate-200',
            };
            const roleLabel: Record<string,string> = {
              superadmin: 'Super-Admin', admin: 'Administrador',
              professor: 'Professor', subscrito: 'Subscrito', visitante: 'Visitante',
            };
            const avatarGrad: Record<string,string> = {
              superadmin: 'from-[#800020] to-rose-600', admin: 'from-orange-400 to-amber-500',
              professor: 'from-blue-500 to-indigo-600', subscrito: 'from-emerald-400 to-teal-500',
              visitante: 'from-slate-400 to-slate-500',
            };
            return (
              <div className="space-y-5 mt-2">

                {/* Hero do utilizador */}
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${avatarGrad[selectedUser.tipo] ?? avatarGrad.visitante} flex items-center justify-center text-white font-bold text-xl shrink-0 overflow-hidden`}>
                    {selectedUser.avatar_url ? (
                      <img src={resolveUploadUrl(selectedUser.avatar_url)} alt={selectedUser.name} className="w-full h-full object-cover" />
                    ) : (
                      selectedUser.name.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-slate-900 truncate">{selectedUser.name}</h3>
                    <p className="text-sm text-slate-500 truncate">{selectedUser.email}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${roleStyle[selectedUser.tipo] ?? roleStyle.visitante}`}>
                        {roleLabel[selectedUser.tipo] ?? selectedUser.tipo}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${selectedUser.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-[#FEE8E8] text-[#5C0016]'}`}>
                        {selectedUser.isActive !== false ? '● Activo' : '● Inactivo'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Estatísticas rápidas */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-center">
                    <p className="text-xl font-bold text-blue-700">{rankEntry?.score ?? 0}</p>
                    <p className="text-[11px] text-blue-600 mt-0.5">Pontos</p>
                  </div>
                  <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl text-center">
                    <p className="text-xl font-bold text-purple-700">{rankEntry?.quizzes ?? 0}</p>
                    <p className="text-[11px] text-purple-600 mt-0.5">Quizzes</p>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-center">
                    <p className="text-xl font-bold text-amber-700">{userCounts.topics}</p>
                    <p className="text-[11px] text-amber-600 mt-0.5">Tópicos</p>
                  </div>
                </div>

                {/* Informações pessoais */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Informações Pessoais</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { icon: Mail,         label: 'Email',          value: selectedUser.email },
                      { icon: Phone,        label: 'Telemóvel',      value: selectedUser.phone || selectedUser.telemovel },
                      { icon: MapPin,       label: 'Província',      value: selectedUser.province },
                      { icon: Building,     label: 'Instituição',    value: selectedUser.institution },
                      { icon: GraduationCap,label: 'Curso',          value: selectedUser.course },
                      { icon: Clock,        label: 'Registo em',     value: new Date(selectedUser.createdAt).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' }) },
                    ].map(({ icon: Icon, label, value }) => value ? (
                      <div key={label} className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 rounded-lg">
                        <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</p>
                          <p className="text-sm font-medium text-slate-800 truncate">{value}</p>
                        </div>
                      </div>
                    ) : null)}
                  </div>
                </div>

                {/* Alterar papel */}
                <div className="space-y-2 border-t pt-4">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" /> Papel & Permissões
                  </h4>
                  <div className="flex gap-2">
                    <select
                      value={selectedNewRole}
                      onChange={e => setSelectedNewRole(e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="visitante">Visitante</option>
                      <option value="subscrito">Subscrito</option>
                      <option value="professor">Professor</option>
                    </select>
                    <Button
                      onClick={handleChangeUserRole}
                      disabled={changingRole || selectedNewRole === selectedUser.tipo}
                      className="bg-blue-600 hover:bg-blue-700 shrink-0"
                      size="sm"
                    >
                      {changingRole ? 'A guardar...' : 'Actualizar'}
                    </Button>
                  </div>
                  <p className="text-xs text-slate-400">Professor — pode publicar conteúdo e gerir salas de discussão.</p>
                </div>
              </div>
            );
          })()}
          <DialogFooter className="mt-4">
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
            {selectedArticle?.type === 'podcast' && (<div className="p-4 bg-purple-50 rounded-xl border border-purple-200 space-y-4"><h4 className="font-semibold text-purple-900 flex items-center gap-2"><Headphones className="w-5 h-5" /> Detalhes do Podcast</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-2"><label className="text-sm font-medium text-slate-700">Apresentador</label><Input value={editArticleForm.podcastHost} onChange={(e) => setEditArticleForm({ ...editArticleForm, podcastHost: e.target.value })} /></div><div className="space-y-2"><label className="text-sm font-medium text-slate-700">Categoria</label><select value={editArticleForm.podcastCategory} onChange={(e) => setEditArticleForm({ ...editArticleForm, podcastCategory: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#800020] bg-white"><option value="">Selecione...</option><option value="economia">Economia</option><option value="historia">História</option><option value="politica">Política</option><option value="cultura">Cultura</option><option value="educacao">Educação</option></select></div></div><div className="border-t border-purple-200 pt-4 mt-4"><h5 className="font-medium text-slate-900 mb-3 flex items-center gap-2"><List className="w-4 h-4" /> Episódios</h5>{editArticleForm.episodes.length > 0 && (<div className="space-y-2 mb-4">{editArticleForm.episodes.map((ep) => (<div key={ep.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-slate-200"><div className="flex-1 min-w-0"><p className="text-sm font-medium text-slate-900 truncate">{ep.title}</p><p className="text-xs text-slate-500">{ep.duration}{ep.date ? ` · ${ep.date}` : ''}</p></div><button type="button" onClick={() => handleEditRemoveEpisode(ep.id)} className="text-[#800020] hover:text-[#5C0016] ml-2 p-1"><Trash2 className="w-4 h-4" /></button></div>))}</div>)}<div className="space-y-2 p-3 bg-white rounded-lg border border-slate-200"><Input placeholder="Título do episódio" value={editArticleForm.newEpisode.title} onChange={(e) => setEditArticleForm({ ...editArticleForm, newEpisode: { ...editArticleForm.newEpisode, title: e.target.value } })} /><div className="flex gap-2"><Input placeholder="Duração (ex: 20:15)" value={editArticleForm.newEpisode.duration} onChange={(e) => setEditArticleForm({ ...editArticleForm, newEpisode: { ...editArticleForm.newEpisode, duration: e.target.value } })} className="flex-1" /><Input placeholder="Data" value={editArticleForm.newEpisode.date} onChange={(e) => setEditArticleForm({ ...editArticleForm, newEpisode: { ...editArticleForm.newEpisode, date: e.target.value } })} className="flex-1" /></div><Textarea placeholder="Descrição do episódio" value={editArticleForm.newEpisode.description} onChange={(e) => setEditArticleForm({ ...editArticleForm, newEpisode: { ...editArticleForm.newEpisode, description: e.target.value } })} rows={2} /><Button type="button" onClick={handleEditAddEpisode} disabled={!editArticleForm.newEpisode.title || !editArticleForm.newEpisode.duration} className="w-full bg-purple-600 hover:bg-purple-700 text-white" size="sm"><PlusCircle className="w-4 h-4 mr-1" /> Adicionar Episódio</Button></div></div></div>)}
            <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Referências</label><Textarea value={editArticleForm.references} onChange={(e) => setEditArticleForm({ ...editArticleForm, references: e.target.value })} rows={2} /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Observações</label><Textarea value={editArticleForm.observations} onChange={(e) => setEditArticleForm({ ...editArticleForm, observations: e.target.value })} rows={2} /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-slate-700 flex items-center gap-2"><Image className="w-4 h-4" /> Imagem de Capa</label><div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-[#A0002A] transition-colors"><input type="file" accept="image/*" onChange={handleEditImageUpload} className="hidden" id="edit-cover-image-upload" ref={editFileInputRef} />{editCoverImagePreview ? (<div className="relative"><img src={editCoverImagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" /><button type="button" onClick={handleRemoveEditImage} className="absolute top-2 right-2 bg-[#800020] text-white rounded-full p-1 hover:bg-[#800020]"><X className="w-4 h-4" /></button></div>) : selectedArticle?.imageUrl && !selectedArticle.imageUrl.startsWith('uploaded_') ? (<div className="relative"><img src={selectedArticle.imageUrl} alt="Capa atual" className="w-full h-48 object-cover rounded-lg" /><label htmlFor="edit-cover-image-upload" className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity cursor-pointer rounded-lg"><span className="text-white text-sm font-medium">Clique para alterar</span></label></div>) : (<label htmlFor="edit-cover-image-upload" className="cursor-pointer"><Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" /><p className="text-sm text-slate-600">Clique para fazer upload</p><p className="text-xs text-slate-400 mt-1">PNG, JPG, WebP até 5MB</p></label>)}</div><div className="space-y-2 mt-2"><label className="text-sm font-medium text-slate-700">Ou URL da Imagem</label><Input value={editArticleForm.imageUrl} onChange={(e) => setEditArticleForm({ ...editArticleForm, imageUrl: e.target.value })} placeholder="https://exemplo.com/imagem.jpg" type="url" /></div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEditArticleModalOpen(false)}>Cancelar</Button><Button onClick={handleSaveArticleEdit} disabled={savingArticle} className="bg-[#800020] hover:bg-[#5C0016]">{savingArticle ? 'A guardar...' : 'Guardar Alterações'}</Button></DialogFooter>
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
              <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Categoria</label><select value={editTopicForm.topicCategory} onChange={(e) => setEditTopicForm({ ...editTopicForm, topicCategory: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#800020]"><option value="Economia">Economia</option><option value="Economia Actual">Economia Actual</option><option value="História Económica">História Económica</option><option value="Sociedade">Sociedade</option><option value="Análise Comparativa">Análise Comparativa</option><option value="Infraestrutura">Infraestrutura</option><option value="Tecnologia">Tecnologia</option><option value="Turismo">Turismo</option></select></div>
              <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Visibilidade</label><div className="flex gap-2"><button type="button" onClick={() => setEditTopicForm({ ...editTopicForm, topicType: 'public' })} className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border-2 transition-all ${editTopicForm.topicType === 'public' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 text-slate-600'}`}><Globe className="w-4 h-4" /><span className="text-sm">Público</span></button><button type="button" onClick={() => setEditTopicForm({ ...editTopicForm, topicType: 'private' })} className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border-2 transition-all ${editTopicForm.topicType === 'private' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-600'}`}><Lock className="w-4 h-4" /><span className="text-sm">Privado</span></button></div></div>
            </div>
            <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Referências</label><Textarea value={editTopicForm.references} onChange={(e) => setEditTopicForm({ ...editTopicForm, references: e.target.value })} rows={2} /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-slate-700 flex items-center gap-2"><Image className="w-4 h-4" /> URL da Imagem</label><Input value={editTopicForm.imageUrl} onChange={(e) => setEditTopicForm({ ...editTopicForm, imageUrl: e.target.value })} placeholder="https://exemplo.com/imagem.jpg" type="url" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEditTopicModalOpen(false)}>Cancelar</Button><Button onClick={handleSaveTopicEdit} disabled={savingTopic} className="bg-[#800020] hover:bg-[#5C0016]">{savingTopic ? 'A guardar...' : 'Guardar Alterações'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Eliminação */}
      <Dialog open={deleteConfirmModalOpen} onOpenChange={setDeleteConfirmModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-[#800020]" /> Confirmar Eliminação</DialogTitle><DialogDescription className="text-sm text-slate-600">Tem certeza que deseja eliminar este {deleteTarget?.type === 'article' ? 'artigo' : 'tópico'}? Esta ação não pode ser desfeita.</DialogDescription></DialogHeader>
          <DialogFooter className="flex gap-3 sm:justify-end"><Button variant="outline" onClick={() => { setDeleteConfirmModalOpen(false); setDeleteTarget(null); }} disabled={deletingContent}>Cancelar</Button><Button onClick={handleConfirmDelete} disabled={deletingContent} className="bg-[#800020] hover:bg-[#5C0016]">{deletingContent ? 'A eliminar...' : 'Eliminar'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
