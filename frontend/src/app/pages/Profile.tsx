import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../services/api';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { User, Mail, MapPin, Calendar, Trophy, Award, TrendingUp, BarChart3, Medal, Edit, GraduationCap, BookOpen, FileText, MessageSquare, Camera, Upload, Trash2, Save, X, Eye, Clock } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import AuthPrompt from '../components/AuthPrompt';
import { useNavigate } from 'react-router';

interface Artigo {
  id: number;
  title: string;
  date: string;
  views: number;
  content?: string;
  category?: string;
}

interface Topico {
  id: number;
  title: string;
  replies: number;
  date: string;
  content?: string;
  category?: string;
}

export default function Profile() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [totalScore, setTotalScore] = useState(0);
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const [ranking, setRanking] = useState<Array<{name: string, score: number, quizzes: number, province: string, institution?: string, course?: string}>>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showArtigosModal, setShowArtigosModal] = useState(false);
  const [showTopicosModal, setShowTopicosModal] = useState(false);
  const [editingArtigo, setEditingArtigo] = useState<Artigo | null>(null);
  const [editingTopico, setEditingTopico] = useState<Topico | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [editedUser, setEditedUser] = useState({
    name: '',
    email: '',
    province: '',
    institution: '',
    course: ''
  });

  // Categorias disponíveis para Artigos e Tópicos
  const categoriasArtigos = [
    'Economia',
    'Agricultura',
    'Investimento',
    'Tecnologia',
    'Educação',
    'Saúde',
    'Infraestrutura',
    'Turismo',
    'Cultura',
    'Política',
    'Meio Ambiente',
    'Energia',
    'Transportes',
    'Comércio',
    'Indústria'
  ];

  const categoriasTopicos = [
    'Sustentabilidade',
    'Tecnologia',
    'Educação',
    'Economia',
    'Política',
    'Sociedade',
    'Cultura',
    'Desporto',
    'Saúde',
    'Meio Ambiente',
    'Inovação',
    'Empreendedorismo',
    'Direitos Humanos',
    'Desenvolvimento Regional',
    'Agricultura'
  ];

  // Artigos e Tópicos com mais detalhes
  const [artigos, setArtigos] = useState<Artigo[]>([
    { 
      id: 1, 
      title: 'O Impacto da Diversificação Económica em Angola', 
      date: '15 Mar 2026', 
      views: 245,
      content: 'A diversificação económica é um dos maiores desafios e oportunidades para Angola. Este artigo analisa as estratégias implementadas nos últimos anos e os resultados obtidos nos setores não petrolíferos.',
      category: 'Economia'
    },
    { 
      id: 2, 
      title: 'Análise do Sector Agrícola Angolano', 
      date: '10 Mar 2026', 
      views: 189,
      content: 'O sector agrícola angolano tem um enorme potencial ainda inexplorado. Este artigo explora as principais culturas, desafios e oportunidades para o desenvolvimento rural.',
      category: 'Agricultura'
    },
    { 
      id: 3, 
      title: 'Perspectivas para o Investimento Estrangeiro', 
      date: '5 Mar 2026', 
      views: 312,
      content: 'Angola tem atraído cada vez mais investimento estrangeiro. Este artigo analisa as tendências atuais e as perspetivas futuras para o investimento no país.',
      category: 'Investimento'
    }
  ]);

  const [topicos, setTopicos] = useState<Topico[]>([
    { 
      id: 1, 
      title: 'Estratégias para o Desenvolvimento Sustentável', 
      replies: 12, 
      date: '20 Mar 2026',
      content: 'Como podemos conciliar crescimento económico com sustentabilidade ambiental em Angola? Quais são as melhores práticas internacionais que podemos adaptar?',
      category: 'Sustentabilidade'
    },
    { 
      id: 2, 
      title: 'O Papel da Tecnologia na Economia Angolana', 
      replies: 8, 
      date: '18 Mar 2026',
      content: 'A tecnologia tem um papel crescente na transformação da economia angolana. Este tópico discute as principais tendências e oportunidades.',
      category: 'Tecnologia'
    },
    { 
      id: 3, 
      title: 'Desafios da Educação em Angola', 
      replies: 15, 
      date: '15 Mar 2026',
      content: 'A educação é fundamental para o desenvolvimento. Quais são os principais desafios e como podemos superá-los? Partilhe suas ideias e experiências.',
      category: 'Educação'
    }
  ]);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!user) return;

    // Inicializa campos editáveis com dados do utilizador autenticado
    setEditedUser({
      name: (user as any).nome ?? user.name ?? '',
      email: user.email ?? '',
      province: (user as any).provincia ?? (user as any).province ?? 'Luanda',
      institution: (user as any).instituicao ?? (user as any).institution ?? '',
      course: (user as any).curso ?? (user as any).course ?? '',
    });

    const carregarDados = async () => {
      try {
        // Perfil completo com estatísticas reais (conteúdos lidos, quizzes, etc.)
        const perfilData = await apiRequest<any>('/perfil');
        const stats = perfilData.stats ?? {};
        setTotalScore(Number(stats.pontuacao_total ?? 0));
        setTotalQuizzes(Number(stats.quizzes_feitos ?? 0));
        // Avatar
        if (perfilData.avatar_url) setProfileImage(perfilData.avatar_url);
      } catch { /* silencioso */ }

      try {
        // Ranking global
        const rankingData = await apiRequest<any[]>('/ranking');
        const mapped = rankingData.map((r: any) => ({
          name: r.nome,
          score: Number(r.pontuacao_total ?? 0),
          quizzes: Number(r.quizzes_completados ?? 0),
          province: r.provincia ?? '',
          institution: '',
        }));
        setRanking(mapped);
        const pos = mapped.findIndex((r: any) => r.name === (user.name ?? (user as any).nome));
        setUserRank(pos >= 0 ? pos + 1 : null);
      } catch { /* silencioso */ }

      try {
        // Tópicos criados pelo utilizador
        const topicosData = await apiRequest<any[]>('/topicos');
        const meusTopicos = topicosData
          .filter((t: any) => String(t.criado_por) === String((user as any).id))
          .map((t: any) => ({
            id: Number(t.id),
            title: t.titulo,
            replies: Number(t.respostas ?? 0),
            date: new Date(t.criado_em).toLocaleDateString('pt-PT'),
            content: t.descricao ?? '',
            category: t.categoria ?? 'Geral',
          }));
        if (meusTopicos.length > 0) setTopicos(meusTopicos);
      } catch { /* silencioso — mantém dados de exemplo */ }
    };

    void carregarDados();
  }, [user, isAuthenticated]);

  const getUserInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getClassification = () => {
    if (totalQuizzes === 0) return { label: 'Novo', color: 'bg-slate-500', icon: '🆕' };
    if (totalQuizzes >= 10) return { label: 'Expert', color: 'bg-gradient-to-r from-purple-500 to-pink-500', icon: '⭐' };
    if (totalQuizzes >= 5) return { label: 'Avançado', color: 'bg-gradient-to-r from-blue-500 to-cyan-500', icon: '🥈' };
    if (totalQuizzes >= 3) return { label: 'Intermediário', color: 'bg-gradient-to-r from-green-500 to-emerald-500', icon: '🥉' };
    return { label: 'Iniciante', color: 'bg-gradient-to-r from-yellow-500 to-orange-500', icon: '🌱' };
  };

  const classification = getClassification();
  const averageScore = totalQuizzes > 0 ? Math.round(totalScore / totalQuizzes) : 0;
  const formattedDate = new Date(user.createdAt).toLocaleDateString('pt-PT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Função para editar foto
  const handleEditPhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageData = event.target?.result as string;
          setProfileImage(imageData);
          if (user) {
            apiRequest('/perfil', {
              method: 'PUT',
              json: { avatar_url: imageData },
            }).catch(() => null);
          }
          alert('Foto de perfil atualizada com sucesso!');
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // Funções para Artigos
  const handleVerArtigos = () => {
    setShowArtigosModal(true);
  };

  const handleEditArtigo = (artigo: Artigo) => {
    setEditingArtigo({ ...artigo });
  };

  const handleSaveArtigo = async () => {
    if (!editingArtigo || !user) return;
    const updatedArtigos = artigos.map(a => a.id === editingArtigo.id ? editingArtigo : a);
    setArtigos(updatedArtigos);
    setEditingArtigo(null);
    // Persiste via API de artigos (best-effort)
    apiRequest(`/artigos/id/${editingArtigo.id}`, {
      method: 'PUT',
      json: { titulo: editingArtigo.title, conteudo: editingArtigo.content ?? '', categoria: editingArtigo.category },
    }).catch(() => null);
    alert('Artigo atualizado com sucesso!');
  };

  const handleDeleteArtigo = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este artigo?')) return;
    setArtigos(prev => prev.filter(a => a.id !== id));
    apiRequest(`/artigos/id/${id}`, { method: 'DELETE' }).catch(() => null);
    alert('Artigo excluído com sucesso!');
  };

  // Funções para Tópicos
  const handleVerTopicos = () => {
    setShowTopicosModal(true);
  };

  const handleEditTopico = (topico: Topico) => {
    setEditingTopico({ ...topico });
  };

  const handleSaveTopico = async () => {
    if (!editingTopico || !user) return;
    const updatedTopicos = topicos.map(t => t.id === editingTopico.id ? editingTopico : t);
    setTopicos(updatedTopicos);
    setEditingTopico(null);
    apiRequest(`/topicos/${editingTopico.id}`, {
      method: 'PUT',
      json: { titulo: editingTopico.title, descricao: editingTopico.content ?? '', categoria: editingTopico.category },
    }).catch(() => null);
    alert('Tópico atualizado com sucesso!');
  };

  const handleDeleteTopico = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este tópico?')) return;
    setTopicos(prev => prev.filter(t => t.id !== id));
    apiRequest(`/topicos/${id}`, { method: 'DELETE' }).catch(() => null);
    alert('Tópico excluído com sucesso!');
  };

  // Função para salvar edição do perfil via API
  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      await apiRequest('/perfil', {
        method: 'PUT',
        json: {
          nome: editedUser.name,
          provincia: editedUser.province,
          instituicao: editedUser.institution,
          curso: editedUser.course,
          avatar_url: profileImage ?? undefined,
        },
      });
      alert('Perfil atualizado com sucesso!');
      setShowEditProfile(false);
      window.location.reload();
    } catch {
      alert('Não foi possível atualizar o perfil. Tenta novamente.');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle>Perfil de Utilizador</CardTitle>
            <CardDescription>Você precisa estar logado para ver o perfil.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setShowAuthPrompt(true)}
              className="w-full bg-gradient-to-r from-red-600 to-yellow-600 hover:from-red-700 hover:to-yellow-700"
            >
              Entrar ou Cadastrar
            </Button>
          </CardContent>
        </Card>
        <AuthPrompt
          open={showAuthPrompt}
          onOpenChange={(open) => {
            setShowAuthPrompt(open);
            if (!open) navigate('/');
          }}
          action="ver seu perfil e estatísticas"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <section className="text-white" style={{ background: '#C1121F' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" style={{ background: '#C1121F' }}>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6" style={{ background: '#C1121F' }}>
            <div className="relative">
              <Avatar className="w-28 h-28 border-4 border-white shadow-xl">
                {profileImage ? (
                  <AvatarImage src={profileImage} alt={user.name} className="object-cover" />
                ) : (
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-red-500 to-yellow-500 text-white">
                    {getUserInitials(user.name)}
                  </AvatarFallback>
                )}
              </Avatar>
              <button
                onClick={handleEditPhoto}
                className="absolute -bottom-2 -right-2 p-1.5 bg-white rounded-full shadow-md hover:bg-slate-100 transition-colors"
                title="Editar foto"
              >
                <Camera className="w-4 h-4 text-red-600" />
              </button>
            </div>
            <div className="flex-1 text-center md:text-left" style={{ background: '#C1121F' }}>
              <h1 className="text-3xl font-bold mb-2">{editedUser.name}</h1>
              <div className="flex flex-col md:flex-row items-center gap-4 text-white/90 mb-4" style={{ background: '#C1121F' }}>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{editedUser.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{editedUser.province}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Membro desde {formattedDate}</span>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-shadow cursor-pointer" onClick={handleVerArtigos}>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2 text-blue-700 text-sm">
                <FileText className="w-4 h-4" />
                Artigos Publicados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-700">{artigos.length}</div>
              <Button 
                variant="link" 
                className="text-blue-600 hover:text-blue-800 p-0 h-auto text-sm mt-1"
                onClick={(e) => {
                  e.stopPropagation();
                  handleVerArtigos();
                }}
              >
                Ver artigos →
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2 text-green-700 text-sm">
                <BarChart3 className="w-4 h-4" />
                Quizzes Completos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700">{totalQuizzes}</div>
              <p className="text-xs text-green-600 mt-1">Realizados</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-shadow cursor-pointer" onClick={handleVerTopicos}>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2 text-purple-700 text-sm">
                <MessageSquare className="w-4 h-4" />
                Tópicos Publicados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-700">{topicos.length}</div>
              <Button 
                variant="link" 
                className="text-purple-600 hover:text-purple-800 p-0 h-auto text-sm mt-1"
                onClick={(e) => {
                  e.stopPropagation();
                  handleVerTopicos();
                }}
              >
                Ver tópicos →
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2 text-yellow-700 text-sm">
                <Trophy className="w-4 h-4" />
                Ranking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-700">
                {userRank ? `#${userRank}` : '-'}
              </div>
              <p className="text-xs text-yellow-600 mt-1">
                {userRank ? `de ${ranking.length}` : 'Não classificado'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5 text-red-600" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-xs text-slate-600 mb-0.5">Nome Completo</p>
                  <p className="font-semibold text-slate-900 text-sm">{editedUser.name}</p>
                </div>
              </div>

              <div className="flex items-start justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-xs text-slate-600 mb-0.5">Email</p>
                  <p className="font-semibold text-slate-900 text-sm">{editedUser.email}</p>
                </div>
              </div>

              <div className="flex items-start justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-xs text-slate-600 mb-0.5">Província</p>
                  <p className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-red-600" />
                    {editedUser.province}
                  </p>
                </div>
              </div>

              <div className="flex items-start justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-xs text-slate-600 mb-0.5">Universidade/Instituição</p>
                  <p className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                    <GraduationCap className="w-3.5 h-3.5 text-red-600" />
                    {editedUser.institution || 'Não informado'}
                  </p>
                </div>
              </div>

              <div className="flex items-start justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-xs text-slate-600 mb-0.5">Curso</p>
                  <p className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-red-600" />
                    {editedUser.course || 'Não informado'}
                  </p>
                </div>
              </div>

              <div className="flex items-start justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-xs text-slate-600 mb-0.5">Membro desde</p>
                  <p className="font-semibold text-slate-900 text-sm">{formattedDate}</p>
                </div>
              </div>

              <Button 
                onClick={() => setShowEditProfile(true)}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar Perfil
              </Button>
            </CardContent>
          </Card>

          {/* Ranking & Achievements */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-[#0a0a0a7a]">
                <Clock className="w-5 h-5 text-yellow-600" />
                Últimas Conquistas (Em Breve)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-center py-8 text-slate-500">
                <Medal className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Estamos a preparar novas conquistas para si!</p>
                <p className="text-xs text-slate-400 mt-2">Em breve terá acesso a medalhas e reconhecimentos exclusivos.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Provincial Ranking */}
        {user.province && ranking.filter(r => r.province === user.province).length > 0 && (
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="w-5 h-5 text-red-600" />
                Ranking Provincial - {user.province}
              </CardTitle>
              <CardDescription className="text-xs">
                Veja sua posição entre os participantes da sua província
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {ranking
                  .filter(r => r.province === user.province)
                  .slice(0, 5)
                  .map((participant, index) => {
                    const isCurrentUser = participant.name === user.name;
                    return (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                          isCurrentUser ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8">
                            <span className="text-lg font-bold text-slate-600">#{index + 1}</span>
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                              {participant.name}
                              {isCurrentUser && (
                                <span className="text-xs px-1.5 py-0.5 bg-blue-600 text-white rounded">Você</span>
                              )}
                            </div>
                            <div className="text-xs text-slate-600">
                              {participant.quizzes} {participant.quizzes === 1 ? 'quiz' : 'quizzes'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-slate-900">{participant.score}</div>
                          <div className="text-xs text-slate-500">pontos</div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Modal de Artigos */}
      <Dialog open={showArtigosModal} onOpenChange={setShowArtigosModal}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-red-600" />
              Meus Artigos Publicados
            </DialogTitle>
            <DialogDescription className="sr-only">Lista dos seus artigos publicados na plataforma</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {artigos.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Você ainda não publicou nenhum artigo.</p>
              </div>
            ) : (
              artigos.map((artigo) => (
                <Card key={artigo.id} className="border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-blue-100 text-blue-700 text-xs">{artigo.category}</Badge>
                          <span className="text-xs text-slate-500">{artigo.date}</span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-500">{artigo.views} visualizações</span>
                        </div>
                        <h3 className="font-semibold text-slate-900 mb-2">{artigo.title}</h3>
                        <p className="text-sm text-slate-600 line-clamp-2">{artigo.content}</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditArtigo(artigo)}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          <Edit className="w-3.5 h-3.5 mr-1" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteArtigo(artigo.id)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setShowArtigosModal(false)} className="bg-slate-600 hover:bg-slate-700">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Tópicos */}
      <Dialog open={showTopicosModal} onOpenChange={setShowTopicosModal}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-purple-600" />
              Meus Tópicos no Fórum
            </DialogTitle>
            <DialogDescription className="sr-only">Lista dos seus tópicos criados no fórum</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {topicos.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Você ainda não publicou nenhum tópico.</p>
              </div>
            ) : (
              topicos.map((topico) => (
                <Card key={topico.id} className="border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-purple-100 text-purple-700 text-xs">{topico.category}</Badge>
                          <span className="text-xs text-slate-500">{topico.date}</span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-500">{topico.replies} respostas</span>
                        </div>
                        <h3 className="font-semibold text-slate-900 mb-2">{topico.title}</h3>
                        <p className="text-sm text-slate-600 line-clamp-2">{topico.content}</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditTopico(topico)}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          <Edit className="w-3.5 h-3.5 mr-1" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteTopico(topico.id)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setShowTopicosModal(false)} className="bg-slate-600 hover:bg-slate-700">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição de Artigo com Dropdown */}
      <Dialog open={!!editingArtigo} onOpenChange={() => setEditingArtigo(null)}>
        <DialogContent className="sm:max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Edit className="w-5 h-5 text-blue-600" />
              Editar Artigo
            </DialogTitle>
            <DialogDescription className="sr-only">Formulário para editar o artigo selecionado</DialogDescription>
          </DialogHeader>
          
          {editingArtigo && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Título</Label>
                <Input
                  value={editingArtigo.title}
                  onChange={(e) => setEditingArtigo({ ...editingArtigo, title: e.target.value })}
                  className="rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Categoria</Label>
                <select
                  value={editingArtigo.category}
                  onChange={(e) => setEditingArtigo({ ...editingArtigo, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  {categoriasArtigos.map((categoria) => (
                    <option key={categoria} value={categoria}>
                      {categoria}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Conteúdo</Label>
                <Textarea
                  value={editingArtigo.content}
                  onChange={(e) => setEditingArtigo({ ...editingArtigo, content: e.target.value })}
                  rows={6}
                  className="rounded-lg resize-none"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setEditingArtigo(null)}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveArtigo}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl"
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição de Tópico com Dropdown */}
      <Dialog open={!!editingTopico} onOpenChange={() => setEditingTopico(null)}>
        <DialogContent className="sm:max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Edit className="w-5 h-5 text-purple-600" />
              Editar Tópico
            </DialogTitle>
            <DialogDescription className="sr-only">Formulário para editar o tópico do fórum selecionado</DialogDescription>
          </DialogHeader>
          
          {editingTopico && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Título</Label>
                <Input
                  value={editingTopico.title}
                  onChange={(e) => setEditingTopico({ ...editingTopico, title: e.target.value })}
                  className="rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Categoria</Label>
                <select
                  value={editingTopico.category}
                  onChange={(e) => setEditingTopico({ ...editingTopico, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                >
                  {categoriasTopicos.map((categoria) => (
                    <option key={categoria} value={categoria}>
                      {categoria}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Conteúdo</Label>
                <Textarea
                  value={editingTopico.content}
                  onChange={(e) => setEditingTopico({ ...editingTopico, content: e.target.value })}
                  rows={6}
                  className="rounded-lg resize-none"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setEditingTopico(null)}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveTopico}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-xl"
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Modal */}
      <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Edit className="w-5 h-5 text-red-600" />
              Editar Perfil
            </DialogTitle>
            <DialogDescription className="sr-only">Formulário para editar as informações do seu perfil</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Avatar className="w-24 h-24 border-4 border-slate-200 shadow-md">
                  {profileImage ? (
                    <AvatarImage src={profileImage} alt={editedUser.name} className="object-cover" />
                  ) : (
                    <AvatarFallback className="text-xl bg-gradient-to-br from-red-500 to-yellow-500 text-white">
                      {getUserInitials(editedUser.name)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <button
                  onClick={handleEditPhoto}
                  className="absolute -bottom-1 -right-1 p-1.5 bg-red-600 rounded-full shadow-md hover:bg-red-700 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-sm font-medium text-slate-700">Nome Completo</Label>
              <Input
                id="edit-name"
                value={editedUser.name}
                onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email" className="text-sm font-medium text-slate-700">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editedUser.email}
                onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-province" className="text-sm font-medium text-slate-700">Província</Label>
              <select
                id="edit-province"
                value={editedUser.province}
                onChange={(e) => setEditedUser({ ...editedUser, province: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="Luanda">Luanda</option>
                <option value="Benguela">Benguela</option>
                <option value="Huambo">Huambo</option>
                <option value="Cabinda">Cabinda</option>
                <option value="Huíla">Huíla</option>
                <option value="Lunda Norte">Lunda Norte</option>
                <option value="Lunda Sul">Lunda Sul</option>
                <option value="Zaire">Zaire</option>
                <option value="Namibe">Namibe</option>
                <option value="Cuando Cubango">Cuando Cubango</option>
                <option value="Bié">Bié</option>
                <option value="Moxico">Moxico</option>
                <option value="Malanje">Malanje</option>
                <option value="Uíge">Uíge</option>
                <option value="Cuanza Norte">Cuanza Norte</option>
                <option value="Cuanza Sul">Cuanza Sul</option>
                <option value="Bengo">Bengo</option>
                <option value="Cunene">Cunene</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-institution" className="text-sm font-medium text-slate-700">Universidade/Instituição</Label>
              <Input
                id="edit-institution"
                placeholder="Ex: ISPTEC, Universidade Agostinho Neto..."
                value={editedUser.institution}
                onChange={(e) => setEditedUser({ ...editedUser, institution: e.target.value })}
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-course" className="text-sm font-medium text-slate-700">Curso</Label>
              <Input
                id="edit-course"
                placeholder="Ex: Economia, Engenharia Informática..."
                value={editedUser.course}
                onChange={(e) => setEditedUser({ ...editedUser, course: e.target.value })}
                className="rounded-lg"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowEditProfile(false)}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveProfile}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl"
            >
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AuthPrompt
        open={showAuthPrompt}
        onOpenChange={(open) => {
          setShowAuthPrompt(open);
          if (!open) navigate('/');
        }}
        action="ver seu perfil e estatísticas"
      />
    </div>
  );
}