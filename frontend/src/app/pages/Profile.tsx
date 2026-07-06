import { useAuth } from '../contexts/AuthContext';
import { apiRequest, resolveUploadUrl } from '../services/api';
import api from '../services/api';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { User, Mail, MapPin, Calendar, Trophy, BarChart3, Edit, GraduationCap, BookOpen, FileText, MessageSquare, Camera, Trash2, Save, X, Eye, Clock, Lock, KeyRound, AlertCircle, Flame, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
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
  const { user, isAuthenticated, refreshUser, isProfessorOuAdmin } = useAuth();
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
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [aAlterarSenha, setAAlterarSenha] = useState(false);
  const [erroSenha, setErroSenha] = useState('');
  const [showEsqueceuSenha, setShowEsqueceuSenha] = useState(false);
  const [aEnviarReset, setAEnviarReset] = useState(false);
  const [resetEnviado, setResetEnviado] = useState(false);

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
  ]);

  const [topicos, setTopicos] = useState<Topico[]>([]);

  // ── Pedidos de acesso a Textos com Jindungo (professor/admin) ────────────
  const [pedidosJindungo, setPedidosJindungo] = useState<any[]>([]);
  const [aCarregarPedidos, setACarregarPedidos] = useState(false);
  const [aResponderPedido, setAResponderPedido] = useState<number | null>(null);
  const [filtroPedidos, setFiltroPedidos] = useState<'pendente' | 'aprovado' | 'rejeitado'>('pendente');

  const carregarPedidosJindungo = async () => {
    setACarregarPedidos(true);
    try {
      const res = await api.get('/content/me/access-requests');
      setPedidosJindungo(res.data?.pedidos ?? res.data ?? []);
    } catch {
      setPedidosJindungo([]);
    } finally {
      setACarregarPedidos(false);
    }
  };

  const responderPedidoJindungo = async (pedidoId: number, status: 'aprovado' | 'rejeitado') => {
    setAResponderPedido(pedidoId);
    try {
      await api.patch(`/content/access-requests/${pedidoId}`, { status });
      setPedidosJindungo(prev => prev.map(p => p.id === pedidoId ? { ...p, status } : p));
    } catch {
      // mantém o estado anterior se falhar
    } finally {
      setAResponderPedido(null);
    }
  };

  useEffect(() => {
    if (isProfessorOuAdmin) void carregarPedidosJindungo();
  }, [isProfessorOuAdmin]);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (user) {
      // Carregar estatísticas reais do utilizador a partir da API (/perfil)
      apiRequest<any>('/perfil')
        .then((perfil) => {
          const s = perfil?.stats ?? {};
          setTotalScore(Number(s.pontuacao_total ?? 0));
          setTotalQuizzes(Number(s.quizzes_feitos ?? 0));
        })
        .catch(() => { /* sem ligação — mantém zeros */ });

      // Carregar ranking real (/ranking) e calcular a posição do utilizador
      apiRequest<any[]>('/ranking')
        .then((rankingData) => {
          const normalizado = (rankingData ?? []).map((r) => ({
            id: r.id,
            name: r.nome ?? r.name ?? '—',
            province: r.provincia ?? r.province ?? '—',
            score: Number(r.pontuacao_total ?? r.score ?? 0),
            quizzes: Number(r.quizzes_completados ?? r.quizzes ?? 0),
          }));
          setRanking(normalizado);

          const position = normalizado.findIndex(
            (r: any) => String(r.id) === String((user as any).id) || r.name === user.name,
          );
          setUserRank(position >= 0 ? position + 1 : null);
        })
        .catch(() => { /* sem ligação — mantém vazio */ });

      // Carregar dados do perfil do localStorage (nome/província/instituição/curso —
      // preferências locais de edição; a foto de perfil vem sempre do backend).
      const savedProfile = localStorage.getItem(`user_profile_${user.email}`);
      if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        setEditedUser({
          name: profile.name || user.name,
          email: profile.email || user.email,
          province: profile.province || user.province || 'Luanda',
          institution: profile.institution || '',
          course: profile.course || ''
        });
      } else {
        setEditedUser({
          name: user.name,
          email: user.email,
          province: user.province || 'Luanda',
          institution: user.institution || '',
          course: user.course || '',
        });
      }
      // A foto de perfil vem sempre do utilizador autenticado (persistida no
      // backend em avatar_url), nunca do localStorage — assim aparece igual
      // em qualquer dispositivo/sessão e em qualquer sítio onde o utilizador
      // é identificado (fórum, salas, comentários, ranking, etc.).
      setProfileImage(resolveUploadUrl(user.avatarUrl) ?? null);

      // Carregar artigos e tópicos salvos
      const savedArtigos = localStorage.getItem(`user_artigos_${user.email}`);
      if (savedArtigos) {
        setArtigos(JSON.parse(savedArtigos));
      }

      // Carregar os tópicos criados por este utilizador a partir da API real
      apiRequest<any[]>('/topicos')
        .then((todos) => {
          const meus = (todos || [])
            .filter((t) => String(t.criado_por) === String((user as any).id))
            .map((t) => ({
              id: Number(t.id),
              title: t.titulo,
              content: t.descricao ?? '',
              category: t.categoria ?? 'Geral',
              date: new Date(t.criado_em).toLocaleDateString('pt-PT'),
              replies: Number(t.respostas ?? 0),
            }));
          setTopicos(meus);
        })
        .catch(() => { /* sem ligação — mantém vazio */ });
    }
  }, [user]);

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

  // Função para editar foto — envia o ficheiro para o backend (POST /perfil/avatar)
  // e persiste em avatar_url, para que a foto apareça em qualquer sítio do
  // sistema (web e mobile) onde este utilizador é identificado.
  const [aEnviarFoto, setAEnviarFoto] = useState(false);
  const handleEditPhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem é demasiado grande. O limite é 5MB.');
        return;
      }

      setAEnviarFoto(true);
      try {
        const fd = new FormData();
        fd.append('avatar', file);
        const res = await api.post('/perfil/avatar', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const novoUrl = res.data?.avatar_url ?? res.data?.avatarUrl ?? null;
        setProfileImage(resolveUploadUrl(novoUrl) ?? null);
        await refreshUser(); // actualiza o utilizador global (navbar, etc.)
        alert('Foto de perfil atualizada com sucesso!');
      } catch (err: any) {
        alert(err?.response?.data?.message || 'Não foi possível carregar a foto. Tenta novamente.');
      } finally {
        setAEnviarFoto(false);
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

  const handleSaveArtigo = () => {
    if (editingArtigo && user) {
      const updatedArtigos = artigos.map(a => 
        a.id === editingArtigo.id ? editingArtigo : a
      );
      setArtigos(updatedArtigos);
      localStorage.setItem(`user_artigos_${user.email}`, JSON.stringify(updatedArtigos));
      setEditingArtigo(null);
      alert('Artigo atualizado com sucesso!');
    }
  };

  const handleDeleteArtigo = (id: number) => {
    if (confirm('Tem certeza que deseja excluir este artigo?')) {
      const updatedArtigos = artigos.filter(a => a.id !== id);
      setArtigos(updatedArtigos);
      if (user) {
        localStorage.setItem(`user_artigos_${user.email}`, JSON.stringify(updatedArtigos));
      }
      alert('Artigo excluído com sucesso!');
    }
  };

  // Funções para Tópicos
  const handleVerTopicos = () => {
    setShowTopicosModal(true);
  };

  const handleEditTopico = (topico: Topico) => {
    setEditingTopico({ ...topico });
  };

  const handleSaveTopico = async () => {
    if (!editingTopico) return;
    try {
      await apiRequest(`/topicos/${editingTopico.id}`, {
        method: 'PUT',
        json: {
          titulo: editingTopico.title,
          descricao: editingTopico.content ?? '',
          categoria: editingTopico.category ?? null,
        },
      });
      setTopicos(prev => prev.map(t => (t.id === editingTopico.id ? editingTopico : t)));
      setEditingTopico(null);
      alert('Tópico atualizado com sucesso!');
    } catch (e) {
      alert((e as Error).message || 'Não foi possível atualizar o tópico.');
    }
  };

  const handleDeleteTopico = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este tópico? Esta ação é irreversível.')) return;
    try {
      await apiRequest(`/topicos/${id}`, { method: 'DELETE' });
      setTopicos(prev => prev.filter(t => t.id !== id));
      alert('Tópico excluído com sucesso!');
    } catch (e) {
      alert((e as Error).message || 'Não foi possível excluir o tópico.');
    }
  };

  const handleAlterarSenha = async () => {
    setErroSenha('');
    if (!senhaAtual) { setErroSenha('Introduz a senha actual.'); return; }
    if (novaSenha.length < 8) { setErroSenha('A nova senha deve ter pelo menos 8 caracteres.'); return; }
    if (novaSenha !== confirmarSenha) { setErroSenha('As senhas não coincidem.'); return; }
    setAAlterarSenha(true);
    try {
      await apiRequest('/perfil/change-password', { method: 'POST', json: { senhaAtual, novaSenha } });
      setSenhaAtual(''); setNovaSenha(''); setConfirmarSenha('');
      alert('Senha alterada com sucesso!');
    } catch (e: any) {
      const msg = e?.message ?? '';
      if (msg.includes('incorrecta') || msg.includes('incorrect') || msg.includes('401')) {
        setErroSenha('Senha actual incorrecta.');
        // Não abre o diálogo automaticamente — o utilizador clica no link se quiser
      } else {
        setErroSenha(msg || 'Não foi possível alterar a senha.');
      }
    } finally { setAAlterarSenha(false); }
  };

  const handleEnviarReset = async () => {
    if (!user?.email) return;
    setAEnviarReset(true);
    try {
      await apiRequest('/auth/forgot-password', { method: 'POST', json: { email: user.email } });
      setResetEnviado(true);
    } catch { setResetEnviado(true); } // mostra sempre sucesso por segurança
    finally { setAEnviarReset(false); }
  };

  // Função para salvar edição do perfil — persiste na base de dados (/perfil)
  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      await apiRequest('/perfil', {
        method: 'PUT',
        json: {
          nome: editedUser.name,
          provincia: editedUser.province,
          instituicao: editedUser.institution || null,
          curso: editedUser.course || null,
        },
      });
    } catch (e) {
      alert((e as Error).message || 'Não foi possível atualizar o perfil na base de dados.');
      return;
    }

    // A foto (data-URL) fica no localStorage — não cabe no campo avatar_url
    localStorage.setItem(
      `user_profile_${user.email}`,
      JSON.stringify({ ...editedUser, avatar: profileImage }),
    );

    // Atualiza o utilizador em sessão com os dados reais da BD
    await refreshUser();

    alert('Perfil atualizado com sucesso!');
    setShowEditProfile(false);
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
              className="w-full bg-gradient-to-r from-[#800020] to-yellow-600 hover:from-[#5C0016] hover:to-yellow-700"
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
      <section className="text-white" style={{ background: '#800020' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" style={{ background: '#800020' }}>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6" style={{ background: '#800020' }}>
            <div className="relative">
              <Avatar className="w-28 h-28 border-4 border-white shadow-xl">
                {profileImage ? (
                  <AvatarImage src={profileImage} alt={user.name} className="object-cover" />
                ) : (
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-[#800020] to-yellow-500 text-white">
                    {getUserInitials(user.name)}
                  </AvatarFallback>
                )}
              </Avatar>
              <button
                onClick={handleEditPhoto}
                disabled={aEnviarFoto}
                className="absolute -bottom-2 -right-2 p-1.5 bg-white rounded-full shadow-md hover:bg-slate-100 transition-colors disabled:opacity-50"
                title="Editar foto"
              >
                <Camera className="w-4 h-4 text-[#800020]" />
              </button>
            </div>
            <div className="flex-1 text-center md:text-left" style={{ background: '#800020' }}>
              <h1 className="text-3xl font-bold mb-2">{editedUser.name}</h1>
              <div className="flex flex-col md:flex-row items-center gap-4 text-white/90 mb-4" style={{ background: '#800020' }}>
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
        <div className={`grid grid-cols-1 gap-5 mb-8 ${isProfessorOuAdmin ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
          {isProfessorOuAdmin && (
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
          )}

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

        {/* Pedidos de acesso a Textos com Jindungo — só professores/admin */}
        {isProfessorOuAdmin && (
          <Card className="mb-8">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-600" /> Pedidos de Acesso — Textos com Jindungo
              </CardTitle>
              <CardDescription>
                Solicitações de acesso aos teus conteúdos Jindungo. Aceita ou recusa, e consulta o histórico
                de quem já aprovaste ou rejeitaste.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                {([
                  { v: 'pendente', label: 'Pendentes' },
                  { v: 'aprovado', label: 'Aprovados' },
                  { v: 'rejeitado', label: 'Rejeitados' },
                ] as const).map(f => (
                  <button
                    key={f.v}
                    onClick={() => setFiltroPedidos(f.v)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      filtroPedidos === f.v ? 'bg-[#800020] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f.label} ({pedidosJindungo.filter(p => p.status === f.v).length})
                  </button>
                ))}
              </div>

              {aCarregarPedidos ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-[#800020]" /></div>
              ) : pedidosJindungo.filter(p => p.status === filtroPedidos).length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-6">Nenhum pedido {filtroPedidos === 'pendente' ? 'pendente' : filtroPedidos === 'aprovado' ? 'aprovado' : 'rejeitado'} no momento.</p>
              ) : (
                <div className="space-y-2">
                  {pedidosJindungo.filter(p => p.status === filtroPedidos).map((pedido) => (
                    <div key={pedido.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-slate-100">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800">{pedido.usuario_nome}</p>
                        <p className="text-xs text-slate-400 truncate">{pedido.usuario_email}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Conteúdo: <span className="font-medium">{pedido.conteudo_titulo}</span>
                        </p>
                        {pedido.motivo && <p className="text-xs text-slate-400 italic mt-1">"{pedido.motivo}"</p>}
                      </div>
                      {filtroPedidos === 'pendente' ? (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            disabled={aResponderPedido === pedido.id}
                            onClick={() => responderPedidoJindungo(pedido.id, 'aprovado')}
                            className="h-8 px-3 text-xs bg-[#800020] hover:bg-[#5C0016] text-white"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Aceitar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={aResponderPedido === pedido.id}
                            onClick={() => responderPedidoJindungo(pedido.id, 'rejeitado')}
                            className="h-8 px-3 text-xs"
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" /> Recusar
                          </Button>
                        </div>
                      ) : (
                        <Badge className={filtroPedidos === 'aprovado' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}>
                          {filtroPedidos === 'aprovado' ? 'Aprovado' : 'Rejeitado'}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Detailed Information — full width */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5 text-[#800020]" />
              Informações Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-0.5">Nome Completo</p>
                <p className="font-semibold text-slate-900 text-sm">{editedUser.name}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-0.5">Email</p>
                <p className="font-semibold text-slate-900 text-sm truncate">{editedUser.email}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-0.5">Província</p>
                <p className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#800020]" />{editedUser.province}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-0.5">Universidade/Instituição</p>
                <p className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-[#800020]" />{editedUser.institution || 'Não informado'}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-0.5">Curso</p>
                <p className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#800020]" />{editedUser.course || 'Não informado'}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-0.5">Membro desde</p>
                <p className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#800020]" />{formattedDate}
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowEditProfile(true)}
              className="bg-gradient-to-r from-[#800020] to-[#5C0016] hover:from-[#5C0016] hover:to-[#5C0016] text-white"
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar Perfil
            </Button>
          </CardContent>
        </Card>

        {/* Provincial Ranking */}
        {user.province && ranking.filter(r => r.province === user.province).length > 0 && (
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="w-5 h-5 text-[#800020]" />
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
              <FileText className="w-6 h-6 text-[#800020]" />
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
                          className="text-[#800020] border-[#FDD5D5] hover:bg-[#FFF2F2]"
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
                          className="text-[#800020] border-[#FDD5D5] hover:bg-[#FFF2F2]"
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
              Guardar Alterações
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
              Guardar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Esqueceu a senha — diálogo de confirmação */}
      <Dialog open={showEsqueceuSenha} onOpenChange={(o) => { setShowEsqueceuSenha(o); if (!o) setResetEnviado(false); }}>
        <DialogContent className="w-[95vw] sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              {resetEnviado ? 'Email enviado!' : 'Esqueceste a senha?'}
            </DialogTitle>
            <DialogDescription className="sr-only">Recuperação de senha</DialogDescription>
          </DialogHeader>
          {resetEnviado ? (
            <p className="text-sm text-slate-600 py-2">
              Enviámos um link de recuperação para <strong>{user?.email}</strong>. Verifica a tua caixa de entrada.
            </p>
          ) : (
            <p className="text-sm text-slate-600 py-2">
              A senha actual que introduziste está incorrecta. Queres receber um email para recuperar a senha?
            </p>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowEsqueceuSenha(false); setResetEnviado(false); }}>
              {resetEnviado ? 'Fechar' : 'Cancelar'}
            </Button>
            {!resetEnviado && (
              <Button onClick={handleEnviarReset} disabled={aEnviarReset} className="bg-[#800020] hover:bg-[#5C0016] text-white">
                {aEnviarReset ? 'A enviar…' : 'Enviar email'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Modal */}
      <Dialog open={showEditProfile} onOpenChange={(o) => { setShowEditProfile(o); if (!o) { setSenhaAtual(''); setNovaSenha(''); setConfirmarSenha(''); setErroSenha(''); } }}>
        <DialogContent className="w-[95vw] sm:max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Edit className="w-5 h-5 text-[#800020]" />
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
                    <AvatarFallback className="text-xl bg-gradient-to-br from-[#800020] to-yellow-500 text-white">
                      {getUserInitials(editedUser.name)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <button
                  onClick={handleEditPhoto}
                  disabled={aEnviarFoto}
                  className="absolute -bottom-1 -right-1 p-1.5 bg-[#800020] rounded-full shadow-md hover:bg-[#5C0016] transition-colors disabled:opacity-50"
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
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800020] focus:border-transparent"
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

            {/* Separador de senha */}
            <div className="pt-2 border-t border-slate-100">
              <p className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
                <Lock className="w-4 h-4 text-[#800020]" /> Alterar Senha
              </p>
              <div className="space-y-2.5">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-600">Senha actual</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={senhaAtual}
                    onChange={(e) => { setSenhaAtual(e.target.value); setErroSenha(''); setShowEsqueceuSenha(false); }}
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-600">Nova senha</Label>
                  <Input
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    value={novaSenha}
                    onChange={(e) => { setNovaSenha(e.target.value); setErroSenha(''); }}
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-600">Confirmar nova senha</Label>
                  <Input
                    type="password"
                    placeholder="Repete a nova senha"
                    value={confirmarSenha}
                    onChange={(e) => { setConfirmarSenha(e.target.value); setErroSenha(''); }}
                    className="rounded-lg"
                  />
                </div>
                {erroSenha && (
                  <div className="flex items-start gap-2 text-xs text-[#800020] bg-[#FFF2F2] border border-[#FDD5D5] px-3 py-2 rounded-lg">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>
                      {erroSenha}
                      {erroSenha.includes('incorrecta') && (
                        <> · <button
                          type="button"
                          onClick={() => setShowEsqueceuSenha(true)}
                          className="underline font-medium hover:text-[#5C0016]"
                        >
                          Esqueceste a senha?
                        </button></>
                      )}
                    </span>
                  </div>
                )}
                {senhaAtual && (
                  <Button
                    onClick={handleAlterarSenha}
                    disabled={aAlterarSenha}
                    variant="outline"
                    className="w-full border-[#800020] text-[#800020] hover:bg-[#FFF2F2] rounded-lg"
                  >
                    <KeyRound className="w-4 h-4 mr-2" />
                    {aAlterarSenha ? 'A alterar…' : 'Alterar Senha'}
                  </Button>
                )}
              </div>
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
              className="bg-gradient-to-r from-[#800020] to-[#5C0016] hover:from-[#5C0016] hover:to-[#5C0016] rounded-xl"
            >
              Guardar Alterações
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