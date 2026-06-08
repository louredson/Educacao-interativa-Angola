import { useState, useEffect, useCallback } from 'react';
import { MessageSquare, ThumbsUp, MessageCircle, Send, Search, Lock, Plus, MoreVertical, X, Image as ImageIcon, Flag, Share2, Bookmark, Globe, Users, TrendingUp, Clock, ChevronDown, ChevronUp, Eye, EyeOff, AlertCircle, Flame, Award, Zap, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../services/api';
import AuthPrompt from '../components/AuthPrompt';

interface Comment {
  id: string;
  author: string;
  authorInitials: string;
  timeAgo: string;
  content: string;
  likes: number;
  replies?: Comment[];
}

interface Discussion {
  id: string;
  title: string;
  author: string;
  authorInitials: string;
  date: string;
  timeAgo?: string;
  category: string;
  categoryType: 'public' | 'private';
  excerpt: string;
  fullContent?: string;
  previewContent?: string;
  replies: number;
  likes: number;
  isPrivate?: boolean;
  requiresAccess?: boolean;
  comments?: Comment[];
}

function tempoRelativo(dataStr: string): string {
  const diff = Date.now() - new Date(dataStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora mesmo';
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  return `há ${d} ${d === 1 ? 'dia' : 'dias'}`;
}

function getInitials(name: string): string {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

export default function Forum() {
  const { isAuthenticated, user } = useAuth();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [newPost, setNewPost] = useState({ title: '', content: '', category: '', isPrivate: false, image: null as File | null });
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('discussions');
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [authAction, setAuthAction] = useState('realizar esta ação');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [commentsExpanded, setCommentsExpanded] = useState<Set<string>>(new Set());
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ comment: Comment; discussionId: string } | null>(null);
  const [commentsLiked, setCommentsLiked] = useState<Set<string>>(new Set());
  const [accessRequested, setAccessRequested] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(5);
  const [replyText, setReplyText] = useState('');
  const [popularTopicsOpen, setPopularTopicsOpen] = useState(true);
  const [recentDiscussionsOpen, setRecentDiscussionsOpen] = useState(true);
  const [unansweredOpen, setUnansweredOpen] = useState(true);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionModalType, setActionModalType] = useState<'report' | 'share' | 'save' | 'comment_report'>('report');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // ─── Carregar tópicos da API ────────────────────────────────────────────────
  const carregarTopicos = useCallback(async () => {
    setLoading(true);
    try {
      const topicos = await apiRequest<any[]>('/topicos');
      const mapeados: Discussion[] = topicos.map((t: any) => ({
        id: String(t.id),
        title: t.titulo,
        author: t.autor_nome ?? 'Utilizador',
        authorInitials: getInitials(t.autor_nome ?? 'U'),
        date: new Date(t.criado_em).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }),
        timeAgo: tempoRelativo(t.criado_em),
        category: t.categoria ?? 'Geral',
        categoryType: t.tipo_privacidade === 'privado' ? 'private' : 'public',
        excerpt: t.descricao ? (t.descricao.length > 120 ? t.descricao.slice(0, 120) + '...' : t.descricao) : '',
        fullContent: t.descricao ?? '',
        replies: Number(t.respostas ?? 0),
        likes: Number(t.likes ?? 0),
        isPrivate: t.tipo_privacidade === 'privado',
        requiresAccess: Boolean(t.requires_access),
        comments: [],
      }));
      setDiscussions(mapeados);
    } catch {
      // API indisponível — lista fica vazia
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void carregarTopicos(); }, [carregarTopicos]);

  // Carrega comentários de um tópico ao expandir
  const carregarComentarios = async (topicoId: string) => {
    try {
      const data = await apiRequest<any>(`/topicos/${topicoId}`);
      const respostas: Comment[] = (data.respostas ?? []).map((r: any) => ({
        id: String(r.id),
        author: r.autor_nome ?? 'Utilizador',
        authorInitials: getInitials(r.autor_nome ?? 'U'),
        timeAgo: tempoRelativo(r.publicado_em),
        content: r.conteudo,
        likes: Number(r.likes ?? 0),
        replies: [],
      }));
      setDiscussions(prev => prev.map(d => d.id === topicoId ? { ...d, comments: respostas } : d));
    } catch { /* silencioso */ }
  };

  // ─── Tópicos populares calculados dos dados reais ──────────────────────────
  const popularTopics = discussions
    .sort((a, b) => (b.likes + b.replies * 2) - (a.likes + a.replies * 2))
    .slice(0, 8)
    .map((d, idx) => ({ id: idx + 1, name: d.category, count: d.likes + d.replies }));

  const categories = [
    { id: 'all', label: 'Todos os Tópicos' },
    { id: 'economia', label: 'Economia' },
    { id: 'historia', label: 'História' },
    { id: 'sociedade', label: 'Sociedade' },
    { id: 'analise', label: 'Análise Comparativa' },
    { id: 'infraestrutura', label: 'Infraestrutura' },
    { id: 'tecnologia', label: 'Tecnologia' },
    { id: 'turismo', label: 'Turismo' },
    { id: 'geral', label: 'Geral' },
  ];

  const filterButtons = [
    { id: 'all', label: 'Todos' },
    { id: 'public', label: 'Públicos' },
    { id: 'private', label: 'Privados' },
    { id: 'my', label: 'Os meus' },
  ];

  const filterAndScrollToTopic = (topicTitle: string) => {
    setSearchQuery(topicTitle);
    setActiveFilter('all');
    setSelectedCategory('all');
    setTimeout(() => {
      document.getElementById('discussions-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleLike = (id: string) => {
    if (!isAuthenticated) { setAuthAction('dar like em publicações'); setShowAuthPrompt(true); return; }
    const isLiked = likedPosts.has(id);
    setLikedPosts(prev => { const s = new Set(prev); isLiked ? s.delete(id) : s.add(id); return s; });
    setDiscussions(prev => prev.map(d => d.id === id ? { ...d, likes: d.likes + (isLiked ? -1 : 1) } : d));
    apiRequest(`/topicos/${id}`, {
      method: 'PUT',
      json: { likes: (discussions.find(d => d.id === id)?.likes ?? 0) + (isLiked ? -1 : 1) },
    }).catch(() => null);
  };

  const handleCommentLike = (commentId: string) => {
    if (!isAuthenticated) { setAuthAction('dar like em comentários'); setShowAuthPrompt(true); return; }
    setCommentsLiked(prev => { const s = new Set(prev); s.has(commentId) ? s.delete(commentId) : s.add(commentId); return s; });
  };

  const handleRequestAccess = async (discussionId: string) => {
    if (!isAuthenticated) { setAuthAction('solicitar acesso ao conteúdo'); setShowAuthPrompt(true); return; }
    try {
      await apiRequest(`/topicos/${discussionId}/solicitar-acesso`, { method: 'POST', json: { motivo: 'Pedido de acesso ao tópico privado.' } });
      setAccessRequested(prev => new Set(prev).add(discussionId));
      alert('Solicitação de acesso enviada. Aguarde aprovação.');
    } catch (err: any) {
      if (err?.status === 409) { setAccessRequested(prev => new Set(prev).add(discussionId)); alert('Já enviaste uma solicitação para este tópico.'); }
      else { alert('Não foi possível enviar a solicitação. Tenta novamente.'); }
    }
  };

  const toggleComments = (discussionId: string) => {
    setCommentsExpanded(prev => {
      const s = new Set(prev);
      if (s.has(discussionId)) { s.delete(discussionId); } else { s.add(discussionId); void carregarComentarios(discussionId); }
      return s;
    });
  };

  const handleAddComment = async (discussionId: string) => {
    if (!isAuthenticated) { setAuthAction('comentar'); setShowAuthPrompt(true); return; }
    if (!newComment.trim()) return;
    try {
      const res = await apiRequest<any>(`/topicos/${discussionId}/respostas`, {
        method: 'POST',
        json: { conteudo: newComment.trim() },
      });
      const novoComentario: Comment = {
        id: String(res.id ?? Date.now()),
        author: (user as any)?.nome ?? user?.name ?? 'Utilizador',
        authorInitials: getInitials((user as any)?.nome ?? user?.name ?? 'U'),
        timeAgo: 'agora mesmo',
        content: newComment.trim(),
        likes: 0,
        replies: [],
      };
      setDiscussions(prev => prev.map(d => d.id === discussionId ? {
        ...d,
        comments: [novoComentario, ...(d.comments || [])],
        replies: d.replies + 1,
      } : d));
      setNewComment('');
    } catch { alert('Não foi possível enviar o comentário. Tenta novamente.'); }
  };

  const handleAddReply = async (discussionId: string, parentCommentId: string) => {
    if (!isAuthenticated) { setAuthAction('responder a comentário'); setShowAuthPrompt(true); return; }
    if (!replyText.trim()) return;
    try {
      await apiRequest<any>(`/topicos/${discussionId}/respostas`, {
        method: 'POST',
        json: { conteudo: replyText.trim(), resposta_pai_id: parentCommentId },
      });
      const newReply: Comment = {
        id: `reply_${Date.now()}`,
        author: (user as any)?.nome ?? user?.name ?? 'Utilizador',
        authorInitials: getInitials((user as any)?.nome ?? user?.name ?? 'U'),
        timeAgo: 'agora mesmo',
        content: replyText.trim(),
        likes: 0,
        replies: [],
      };
      setDiscussions(prev => prev.map(d => {
        if (d.id !== discussionId) return d;
        const updateComments = (comments: Comment[]): Comment[] => comments.map(c => {
          if (c.id === parentCommentId) return { ...c, replies: [newReply, ...(c.replies || [])] };
          if (c.replies?.length) return { ...c, replies: updateComments(c.replies) };
          return c;
        });
        return { ...d, comments: updateComments(d.comments || []), replies: d.replies + 1 };
      }));
      setReplyText('');
      setReplyingTo(null);
    } catch { alert('Não foi possível enviar a resposta.'); }
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.content.trim()) { alert('Preenche o título e o conteúdo.'); return; }
    if (!isAuthenticated) { setAuthAction('criar um tópico'); setShowAuthPrompt(true); return; }
    setSubmitting(true);
    try {
      const criado = await apiRequest<any>('/topicos', {
        method: 'POST',
        json: {
          titulo: newPost.title.trim(),
          descricao: newPost.content.trim(),
          tipo_privacidade: newPost.isPrivate ? 'privado' : 'publico',
          categoria: newPost.category || 'Geral',
        },
      });
      const novoTopico: Discussion = {
        id: String(criado.id),
        title: criado.titulo,
        author: (user as any)?.nome ?? user?.name ?? 'Utilizador',
        authorInitials: getInitials((user as any)?.nome ?? user?.name ?? 'U'),
        date: new Date().toLocaleDateString('pt-PT'),
        timeAgo: 'agora mesmo',
        category: newPost.category || 'Geral',
        categoryType: newPost.isPrivate ? 'private' : 'public',
        excerpt: newPost.content.slice(0, 120),
        fullContent: newPost.content,
        replies: 0,
        likes: 0,
        isPrivate: newPost.isPrivate,
        requiresAccess: false,
        comments: [],
      };
      setDiscussions(prev => [novoTopico, ...prev]);
      setNewPost({ title: '', content: '', category: '', isPrivate: false, image: null });
      setActiveTab('discussions');
      alert('Tópico criado com sucesso!');
    } catch { alert('Não foi possível criar o tópico. Tenta novamente.'); }
    finally { setSubmitting(false); }
  };

  const [motivoDenuncia, setMotivoDenuncia] = useState('');
  const [submittingDenuncia, setSubmittingDenuncia] = useState(false);

  const openActionModal = (type: 'report' | 'share' | 'save' | 'comment_report', itemId: string) => {
    setActionModalType(type); setSelectedItemId(itemId); setMotivoDenuncia(''); setActionModalOpen(true);
  };

  const handleActionConfirm = async () => {
    if (actionModalType === 'share') {
      navigator.clipboard?.writeText(window.location.href).catch(() => null);
      alert('Link copiado!');
      setActionModalOpen(false); setSelectedItemId(null);
      return;
    }
    if (actionModalType === 'save') {
      alert('Conteúdo guardado nos seus favoritos!');
      setActionModalOpen(false); setSelectedItemId(null);
      return;
    }

    // 'report' (tópico) e 'comment_report' (resposta) → chamam a API
    if (!isAuthenticated) { setActionModalOpen(false); setAuthAction('denunciar conteúdo'); setShowAuthPrompt(true); return; }
    if (!selectedItemId) return;

    setSubmittingDenuncia(true);
    try {
      if (actionModalType === 'comment_report') {
        // Denuncia uma resposta/comentário
        await apiRequest(`/respostas/${selectedItemId}/denunciar`, {
          method: 'POST',
          json: { motivo: motivoDenuncia || 'conteudo_inapropriado', descricao_detalhada: motivoDenuncia || null },
        });
        alert('Comentário denunciado. A equipa de moderação irá analisar.');
      } else {
        // Denuncia um tópico inteiro → POST /api/topicos/:id/denunciar
        await apiRequest(`/topicos/${selectedItemId}/denunciar`, {
          method: 'POST',
          json: { motivo: motivoDenuncia || 'conteudo_inapropriado', descricao_detalhada: motivoDenuncia || null },
        });
        alert('Tópico denunciado. A equipa de moderação irá analisar.');
      }
    } catch {
      alert('Não foi possível enviar a denúncia. Tenta novamente.');
    } finally {
      setSubmittingDenuncia(false);
      setActionModalOpen(false); setSelectedItemId(null);
    }
  };

  const getHeatScore = (likes: number, replies: number) => {
    const score = likes + replies * 2;
    if (score > 100) return { label: 'Muito Quente', icon: Flame, color: 'text-red-500' };
    if (score > 50) return { label: 'Quente', icon: Zap, color: 'text-orange-500' };
    if (score > 20) return { label: 'Tendência', icon: TrendingUp, color: 'text-green-500' };
    return null;
  };

  const toggleAccordion = (id: string) => {
    setExpandedPosts(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };

  const filteredDiscussions = discussions.filter(d => {
    if (selectedCategory !== 'all') {
      const cat = selectedCategory.toLowerCase();
      if (!d.category.toLowerCase().includes(cat)) return false;
    }
    if (activeFilter === 'public' && d.isPrivate) return false;
    if (activeFilter === 'private' && !d.isPrivate) return false;
    if (activeFilter === 'my' && (user as any)?.nome && d.author !== ((user as any)?.nome ?? user?.name)) return false;
    if (searchQuery && !d.title.toLowerCase().includes(searchQuery.toLowerCase()) && !d.excerpt.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const displayedDiscussions = filteredDiscussions.slice(0, visibleCount);
  const hasMore = visibleCount < filteredDiscussions.length;

  const renderComment = (comment: Comment, discussionId: string, isReply = false): React.ReactNode => {
    const isCommentLiked = commentsLiked.has(comment.id);
    return (
      <div key={comment.id} className={`${!isReply ? 'border-b border-slate-100 pb-4' : 'ml-8 mt-3 border-l-2 border-slate-200 pl-4'}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <Avatar className="w-8 h-8 ring-2 ring-slate-100">
              <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white text-xs">{comment.authorInitials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-slate-900">{comment.author}</span>
                <span className="text-xs text-slate-400">{comment.timeAgo}</span>
              </div>
              <p className="text-sm text-slate-600 mb-2">{comment.content}</p>
              <div className="flex items-center gap-4">
                <button onClick={() => handleCommentLike(comment.id)} className={`flex items-center gap-1 text-xs transition-all duration-200 ${isCommentLiked ? 'text-red-600 scale-105' : 'text-slate-400 hover:text-red-600'}`}>
                  <ThumbsUp className="w-3 h-3" /><span>{comment.likes + (isCommentLiked ? 1 : 0)}</span>
                </button>
                <button onClick={() => setReplyingTo({ comment, discussionId })} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">💬 Responder</button>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><MoreVertical className="h-3 w-3" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openActionModal('comment_report', comment.id)}><Flag className="w-3 h-3 mr-2" />Denunciar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {replyingTo?.comment.id === comment.id && replyingTo.discussionId === discussionId && (
          <div className="mt-3 ml-8 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-start gap-3">
              <Avatar className="w-6 h-6"><AvatarFallback className="bg-gradient-to-br from-slate-500 to-slate-600 text-white text-xs">EU</AvatarFallback></Avatar>
              <div className="flex-1">
                <Textarea placeholder={`Responder a ${comment.author}...`} value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={2} className="resize-none text-sm" />
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={() => handleAddReply(discussionId, comment.id)} disabled={!replyText.trim()} className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"><Send className="w-3 h-3 mr-1" />Responder</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setReplyingTo(null); setReplyText(''); }}>Cancelar</Button>
                </div>
              </div>
            </div>
          </div>
        )}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3">{comment.replies.map(r => renderComment(r, discussionId, true))}</div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <section className="relative text-white overflow-hidden" style={{ background: '#C1121F' }}>
        <div className="absolute inset-0 bg-black/20" style={{ background: 'rgba(0,0,0,0.2)' }}></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-red-500/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-yellow-500/20 rounded-full blur-3xl"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" style={{ background: 'transparent' }}>
          <div className="flex items-center space-x-3 mb-4 animate-in fade-in slide-in-from-left-5 duration-500" style={{ background: 'transparent' }}>
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm"><MessageSquare className="w-8 h-8" /></div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Espaço de Debate</h1>
          </div>
          <p className="text-xl text-red-100 max-w-3xl animate-in fade-in slide-in-from-left-5 duration-500 delay-100">
            Participe das discussões, compartilhe conhecimento e conecte-se com a comunidade angolana.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!isAuthenticated && (
          <div className="mb-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-amber-100 rounded-xl"><Lock className="w-6 h-6 text-amber-600" /></div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 mb-2">Participe dos debates!</h3>
                <p className="text-sm text-slate-700 mb-3">Você pode ler as discussões, mas para comentar, criar tópicos e dar likes, é necessário criar uma conta.</p>
                <Button onClick={() => { setAuthAction('participar dos debates'); setShowAuthPrompt(true); }} className="bg-gradient-to-r from-red-600 to-yellow-600 hover:from-red-700 hover:to-yellow-700 shadow-lg hover:shadow-xl transition-all duration-300">Entrar ou Cadastrar</Button>
              </div>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList className="grid grid-cols-2 w-full sm:w-auto bg-slate-100 p-1 rounded-xl">
              <TabsTrigger value="discussions" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">Discussões</TabsTrigger>
              <TabsTrigger value="new" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">Nova Publicação</TabsTrigger>
            </TabsList>
            <Button onClick={() => { if (!isAuthenticated) { setAuthAction('criar novos tópicos de debate'); setShowAuthPrompt(true); return; } setActiveTab('new'); }} className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-md hover:shadow-lg transition-all duration-300 w-full sm:w-auto group">
              {!isAuthenticated ? <Lock className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />}
              Criar Novo Tópico
            </Button>
          </div>

          <TabsContent value="discussions" className="space-y-6">
            <div id="discussions-section" className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1 space-y-6">
                <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300">
                  <CardContent className="pt-6">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <Input placeholder="Buscar tópicos, discussões..." className="pl-9 border-slate-200 focus:border-red-300 focus:ring-red-200 transition-all" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-2 flex-wrap">
                  {filterButtons.map((filter) => (
                    <button key={filter.id} onClick={() => setActiveFilter(filter.id)} className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${activeFilter === filter.id ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md shadow-red-200' : 'text-slate-600 hover:bg-slate-100'}`}>
                      {filter.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200/60 w-fit">
                  <span className="text-sm text-slate-600 font-medium">Categoria:</span>
                  <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all">
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>

                {loading ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => <Card key={i}><CardContent className="p-6"><div className="h-20 bg-slate-100 rounded animate-pulse" /></CardContent></Card>)}
                  </div>
                ) : filteredDiscussions.length === 0 ? (
                  <div className="text-center py-16">
                    <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-slate-600 mb-1">Nenhuma discussão encontrada</h3>
                    <p className="text-sm text-slate-500">Seja o primeiro a criar um tópico!</p>
                    <Button onClick={() => setActiveTab('new')} className="mt-4 bg-red-600 hover:bg-red-700">Criar tópico</Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {displayedDiscussions.map((discussion, index) => {
                      const isExpanded = expandedPosts.has(discussion.id);
                      const showComments = commentsExpanded.has(discussion.id);
                      const hasAccess = accessRequested.has(discussion.id) || !discussion.requiresAccess;
                      const isLiked = likedPosts.has(discussion.id);
                      const likeCount = discussion.likes;

                      return (
                        <div key={discussion.id} className="animate-in fade-in slide-in-from-bottom-3 duration-500" style={{ animationDelay: `${index * 50}ms` }}>
                          <Card className={`overflow-hidden border-slate-200/80 bg-white/90 backdrop-blur-sm transition-all duration-300 ${isExpanded ? 'shadow-xl border-red-200/50' : 'shadow-sm hover:shadow-md'}`}>
                            <div className="cursor-pointer" onClick={() => toggleAccordion(discussion.id)}>
                              <div className="px-6 py-4 flex justify-between items-start relative">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 flex-wrap mb-3">
                                    {discussion.categoryType === 'public' ? (
                                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium text-xs px-3 py-1 rounded-full flex items-center gap-1.5"><Globe className="w-3 h-3" />PÚBLICO</Badge>
                                    ) : (
                                      <Badge className="bg-amber-50 text-amber-700 border-amber-200 font-medium text-xs px-3 py-1 rounded-full flex items-center gap-1.5"><Lock className="w-3 h-3" />PRIVADO</Badge>
                                    )}
                                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{discussion.category}</span>
                                  </div>
                                  <div className="flex items-center gap-3 mb-2">
                                    <Avatar className="w-10 h-10 ring-4 ring-white shadow-md">
                                      <AvatarFallback className={`text-white font-medium text-sm ${discussion.categoryType === 'public' ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-gradient-to-br from-amber-500 to-amber-600'}`}>{discussion.authorInitials}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <span className="font-semibold text-slate-800">{discussion.author}</span>
                                      <div className="flex items-center gap-1 text-xs text-slate-400"><span>{discussion.timeAgo || discussion.date}</span></div>
                                    </div>
                                  </div>
                                  <CardTitle className="text-lg font-bold text-slate-800 pr-8">{discussion.title}</CardTitle>
                                </div>
                                <div className="flex items-center gap-2">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-slate-100"><MoreVertical className="h-4 w-4 text-slate-400" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="rounded-xl">
                                      <DropdownMenuItem onClick={() => openActionModal('report', discussion.id)}><Flag className="w-3 h-3 mr-2" />Denunciar</DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => openActionModal('share', discussion.id)}><Share2 className="w-3 h-3 mr-2" />Compartilhar</DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => openActionModal('save', discussion.id)}><Bookmark className="w-3 h-3 mr-2" />Guardar</DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                  <button className="p-2 rounded-full hover:bg-slate-100 transition-colors" onClick={(e) => { e.stopPropagation(); toggleAccordion(discussion.id); }}>
                                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="px-6 pb-4 pt-2 border-t border-slate-100 mt-2 animate-in slide-in-from-top-2 duration-200">
                                <div className="mb-4">
                                  {discussion.isPrivate && discussion.requiresAccess && !hasAccess ? (
                                    <div className="p-4 bg-amber-50 rounded-lg text-center">
                                      <p className="text-amber-700 mb-3">[Conteúdo privado - solicite acesso para ler mais]</p>
                                      <Button onClick={() => handleRequestAccess(discussion.id)} variant="outline" className="border-amber-400 text-amber-700 hover:bg-amber-100"><Lock className="w-4 h-4 mr-2" />Solicitar Acesso</Button>
                                    </div>
                                  ) : (
                                    <p className="text-slate-600 leading-relaxed">{discussion.fullContent || discussion.excerpt}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-6 text-sm border-t border-slate-100 pt-4">
                                  <button onClick={() => toggleComments(discussion.id)} className="flex items-center gap-2 text-slate-500 hover:text-red-600 transition-all duration-200 group/comment">
                                    <div className="p-1 rounded-full bg-slate-100 group-hover/comment:bg-red-100 transition-colors"><MessageCircle className="w-4 h-4" /></div>
                                    <span className="font-medium">{discussion.replies}</span>
                                    <span className="text-xs text-slate-400">comentários</span>
                                  </button>
                                  <button onClick={() => handleLike(discussion.id)} className={`flex items-center gap-2 transition-all duration-200 group/like ${isLiked ? 'text-red-600' : 'text-slate-500 hover:text-red-600'}`}>
                                    <div className={`p-1 rounded-full transition-colors ${isLiked ? 'bg-red-100' : 'bg-slate-100 group-hover/like:bg-red-100'}`}><ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-red-600' : ''}`} /></div>
                                    <span className="font-medium">{likeCount}</span>
                                    <span className="text-xs text-slate-400">likes</span>
                                  </button>
                                </div>

                                {showComments && (
                                  <div className="mt-6 pt-4 border-t border-slate-100">
                                    <div className="space-y-4">
                                      <h4 className="font-semibold text-slate-900">Comentários ({discussion.comments?.length || 0})</h4>
                                      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                                        {discussion.comments && discussion.comments.length > 0
                                          ? discussion.comments.map((c) => renderComment(c, discussion.id))
                                          : <p className="text-center text-slate-500 py-8">Nenhum comentário ainda. Seja o primeiro!</p>}
                                      </div>
                                      <div className="pt-4">
                                        <h4 className="font-semibold text-slate-900 mb-3">Adicione um comentário...</h4>
                                        <div className="flex items-start gap-3">
                                          <Avatar className="w-8 h-8"><AvatarFallback className="bg-gradient-to-br from-slate-500 to-slate-600 text-white text-xs">{isAuthenticated ? 'EU' : '?'}</AvatarFallback></Avatar>
                                          <div className="flex-1">
                                            <Textarea placeholder={isAuthenticated ? "Escreva seu comentário..." : "Faça login para comentar"} value={newComment} onChange={(e) => setNewComment(e.target.value)} rows={3} disabled={!isAuthenticated} className="resize-none" />
                                            {isAuthenticated ? (
                                              <div className="flex justify-end mt-2">
                                                <Button onClick={() => handleAddComment(discussion.id)} disabled={!newComment.trim()} className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"><Send className="w-4 h-4 mr-2" />Comentar</Button>
                                              </div>
                                            ) : (
                                              <p className="text-xs text-amber-600 mt-2"><button onClick={() => { setAuthAction('comentar'); setShowAuthPrompt(true); }} className="underline hover:text-amber-700">Faça login</button> para participar da discussão</p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </Card>
                        </div>
                      );
                    })}
                  </div>
                )}

                {hasMore && (
                  <div className="flex justify-center pt-4">
                    <Button onClick={() => setVisibleCount(prev => prev + 5)} variant="outline" className="px-8 py-2 border-2 border-red-600 text-red-600 hover:bg-red-50 hover:border-red-700 hover:text-red-700 transition-all rounded-xl">Carregar mais</Button>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="lg:w-80 space-y-4 flex-shrink-0 lg:sticky lg:top-4 lg:self-start">
                <Card className="border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300">
                  <button onClick={() => setPopularTopicsOpen(!popularTopicsOpen)} className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors rounded-t-lg">
                    <div className="flex items-center gap-2"><div className="p-1.5 bg-red-100 rounded-lg"><TrendingUp className="w-4 h-4 text-red-600" /></div><h3 className="font-semibold text-slate-900 text-sm">Tópicos Populares</h3></div>
                    {popularTopicsOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>
                  {popularTopicsOpen && (
                    <CardContent className="pt-0 pb-4">
                      {popularTopics.length === 0 ? <p className="text-xs text-slate-400 px-3 py-2">Nenhum tópico ainda.</p> : (
                        <div className="space-y-1">
                          {popularTopics.map((topic, idx) => (
                            <button key={topic.id} onClick={() => filterAndScrollToTopic(topic.name)} className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left group">
                              <div className="flex items-center gap-2"><span className="text-xs text-slate-400 w-5">{idx + 1}.</span><span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">#{topic.name}</span></div>
                              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{topic.count}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>

                <Card className="border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300">
                  <button onClick={() => setRecentDiscussionsOpen(!recentDiscussionsOpen)} className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors rounded-t-lg">
                    <div className="flex items-center gap-2"><div className="p-1.5 bg-blue-100 rounded-lg"><Clock className="w-4 h-4 text-blue-600" /></div><h3 className="font-semibold text-slate-900 text-sm">Discussões Recentes</h3></div>
                    {recentDiscussionsOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>
                  {recentDiscussionsOpen && (
                    <CardContent className="pt-0 pb-4">
                      {discussions.slice(0, 4).length === 0 ? <p className="text-xs text-slate-400 px-3 py-2">Nenhuma discussão ainda.</p> : (
                        <div className="space-y-3">
                          {discussions.slice(0, 4).map((d) => (
                            <div key={d.id} onClick={() => filterAndScrollToTopic(d.title)} className="px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group">
                              <div className="flex items-center gap-2 mb-1">
                                <Avatar className="w-5 h-5"><AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-[10px]">{d.authorInitials}</AvatarFallback></Avatar>
                                <span className="text-xs font-medium text-slate-600">{d.author}</span>
                              </div>
                              <p className="text-sm text-slate-700 line-clamp-2 leading-snug group-hover:text-red-600 transition-colors">{d.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-slate-400">{d.timeAgo}</span>
                                <span className="text-xs text-slate-300">•</span>
                                <span className="text-xs text-slate-400">{d.replies} comentários</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>

                <Card className="border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300">
                  <button onClick={() => setUnansweredOpen(!unansweredOpen)} className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors rounded-t-lg">
                    <div className="flex items-center gap-2"><div className="p-1.5 bg-amber-100 rounded-lg"><AlertCircle className="w-4 h-4 text-amber-600" /></div><h3 className="font-semibold text-slate-900 text-sm">Sem Respostas</h3></div>
                    {unansweredOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>
                  {unansweredOpen && (
                    <CardContent className="pt-0 pb-4">
                      {discussions.filter(d => d.replies === 0).length === 0 ? <p className="text-xs text-slate-400 px-3 py-2">Todos os tópicos têm respostas!</p> : (
                        <div className="space-y-3">
                          {discussions.filter(d => d.replies === 0).slice(0, 5).map((d) => (
                            <div key={d.id} onClick={() => filterAndScrollToTopic(d.title)} className="px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group">
                              <p className="text-sm text-slate-700 line-clamp-2 leading-snug group-hover:text-red-600 transition-colors">{d.title}</p>
                              <span className="text-xs text-amber-600 font-medium">0 respostas</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="new">
            {!isAuthenticated ? (
              <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Lock className="w-5 h-5 text-amber-600" />Autenticação Necessária</CardTitle>
                  <CardDescription>Você precisa estar logado para criar novos tópicos de debate</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => { setAuthAction('criar novos tópicos de debate'); setShowAuthPrompt(true); }} className="bg-gradient-to-r from-red-600 to-yellow-600 hover:from-red-700 hover:to-yellow-700"><Lock className="w-4 h-4 mr-2" />Entrar ou Cadastrar</Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Criar Nova Discussão</CardTitle>
                  <CardDescription>Inicie um novo debate sobre história económica de Angola</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitPost} className="space-y-6">
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">Título da Discussão</label>
                      <Input id="title" placeholder="Digite o título do conteúdo..." value={newPost.title} onChange={(e) => setNewPost({ ...newPost, title: e.target.value })} required />
                    </div>
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">Descrição</label>
                      <Textarea id="description" placeholder="Descreva o conteúdo..." value={newPost.content} onChange={(e) => setNewPost({ ...newPost, content: e.target.value })} rows={4} required />
                    </div>
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-2">Categoria</label>
                      <select id="category" value={newPost.category} onChange={(e) => setNewPost({ ...newPost, category: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500">
                        <option value="">Selecione...</option>
                        <option value="Economia">Economia</option>
                        <option value="História">História</option>
                        <option value="Sociedade">Sociedade</option>
                        <option value="Análise Comparativa">Análise Comparativa</option>
                        <option value="Infraestrutura">Infraestrutura</option>
                        <option value="Tecnologia">Tecnologia</option>
                        <option value="Turismo">Turismo</option>
                        <option value="Geral">Geral</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-3">
                        <Lock className="w-5 h-5 text-amber-600" />
                        <div>
                          <Label htmlFor="private-mode" className="text-sm font-medium cursor-pointer">Conteúdo Restrito</Label>
                          <p className="text-xs text-slate-600">O conteúdo só será visível após aprovação</p>
                        </div>
                      </div>
                      <Switch id="private-mode" checked={newPost.isPrivate} onCheckedChange={(checked) => setNewPost({ ...newPost, isPrivate: checked })} />
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-sm text-blue-900 mb-2">Diretrizes do Fórum</h4>
                      <ul className="space-y-1 text-xs text-blue-800">
                        <li>✓ Seja respeitoso com todos os participantes</li>
                        <li>✓ Baseie argumentos em factos e fontes confiáveis</li>
                        <li>✓ Mantenha o foco em temas relacionados com a história económica de Angola</li>
                        <li>✓ Evite linguagem ofensiva ou discriminatória</li>
                      </ul>
                    </div>
                    <div className="flex gap-3">
                      <Button type="button" variant="outline" onClick={() => setActiveTab('discussions')} className="flex-1">Cancelar</Button>
                      <Button type="submit" disabled={submitting} className="flex-1 bg-red-600 hover:bg-red-700">
                        {submitting ? 'A enviar...' : <><Send className="w-4 h-4 mr-2" />Adicionar</>}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </section>

      <Dialog open={actionModalOpen} onOpenChange={setActionModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">
              {actionModalType === 'report' && 'Denunciar'}
              {actionModalType === 'share' && 'Compartilhar'}
              {actionModalType === 'save' && 'Guardar'}
              {actionModalType === 'comment_report' && 'Denunciar Comentário'}
            </DialogTitle>
            <DialogDescription className="sr-only">Ação sobre conteúdo do fórum</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {(actionModalType === 'report' || actionModalType === 'comment_report') && (
              <div className="space-y-3">
                <p className="text-slate-600">
                  {actionModalType === 'report' ? 'Descreve o motivo da denúncia do tópico:' : 'Descreve o motivo da denúncia do comentário:'}
                </p>
                <Textarea
                  placeholder="Ex: conteúdo ofensivo, desinformação, spam..."
                  value={motivoDenuncia}
                  onChange={(e) => setMotivoDenuncia(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
            )}
            {actionModalType === 'share' && <div className="space-y-3"><p className="text-slate-600">Compartilhe este conteúdo:</p><div className="flex gap-3 justify-center"><Button variant="outline" className="flex-1 rounded-xl">WhatsApp</Button><Button variant="outline" className="flex-1 rounded-xl">Facebook</Button><Button variant="outline" className="flex-1 rounded-xl">Twitter</Button></div></div>}
            {actionModalType === 'save' && <p className="text-slate-600">Guardar este conteúdo nos seus favoritos.</p>}
          </div>
          <DialogFooter className="flex gap-3">
            <Button variant="outline" onClick={() => setActionModalOpen(false)} className="rounded-xl" disabled={submittingDenuncia}>Cancelar</Button>
            <Button onClick={handleActionConfirm} disabled={submittingDenuncia} className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl">
              {submittingDenuncia ? 'A enviar...' : actionModalType === 'share' ? 'Copiar Link' : actionModalType === 'save' ? 'Guardar' : 'Confirmar Denúncia'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AuthPrompt open={showAuthPrompt} onOpenChange={setShowAuthPrompt} action={authAction} />
    </div>
  );
}
