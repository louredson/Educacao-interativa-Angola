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
  Menu,
  BookOpen as BookOpenIcon,
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

    try {
      const usersResponse = await apiRequest<any[]>('/users', {
        headers: currentUser,
      });
      setUsers(usersResponse.map((item) => ({
        ...item,
        id: String(item.id),
      })));
    } catch (error) {
      console.error('Erro ao carregar utilizadores:', error);
      setUsers([]);
    }

    const rankingData = localStorage.getItem('quiz_ranking');
    if (rankingData) {
      setRanking(JSON.parse(rankingData));
    }

    const contentsData = localStorage.getItem('admin_contents');
    if (contentsData) {
      setContents(JSON.parse(contentsData));
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
    localStorage.setItem('admin_contents', JSON.stringify(updatedContents));

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
    localStorage.setItem('admin_contents', JSON.stringify(updatedContents));
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
    localStorage.setItem('admin_contents', JSON.stringify(updatedContents));
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
    localStorage.setItem('admin_contents', JSON.stringify(updatedContents));
    setDeleteConfirmModalOpen(false);
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

  const totalUsers = users.length;
  const totalContents = contents.length;
  const totalArticles = getArticles().length;
  const totalTopics = getTopics().length;

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
              <Link to="/explorar" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
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
                { label: 'Explorar', href: '/explorar', icon: Compass },
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 h-auto bg-transparent">
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
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><FileQuestion className="w-5 h-5 text-orange-600" /> Gerar Novo Quiz</CardTitle><CardDescription>Crie quizzes personalizados para a plataforma</CardDescription></CardHeader>
              <CardContent>
                <div className="p-8 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border-2 border-orange-200 text-center">
                  <FileQuestion className="w-16 h-16 text-orange-600 mx-auto mb-4" /><h3 className="text-xl font-bold text-slate-900 mb-2">Ferramenta de Criação de Quiz</h3><p className="text-slate-600 mb-6">Crie quizzes com perguntas múltiplas, categorias e níveis de dificuldade.</p>
                  <Button className="bg-red-600 hover:bg-red-700"><PlusCircle className="w-4 h-4 mr-2" /> Criar Novo Quiz</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
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
