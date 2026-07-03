import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  ThumbsUp, Plus, Search, Pin, CircleCheck, Eye, Clock,
  MessageCircle, X, ArrowLeft, Flame, MessageSquare, ShieldCheck, Lock, Send, Trash2,
  Paperclip, FileText, Image as ImageIcon, UserCheck, UserX, Bell, LockOpen, CornerDownRight,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest, getToken, getApiBase, resolveUploadUrl } from '../services/api';
import FicheiroPreview from '../components/FicheiroPreview';
import AuthPrompt from '../components/AuthPrompt';
import { toast } from 'sonner';

// ── Tipos ───────────────────────────────────────────────────────────────────
interface Resposta {
  id: number;
  conteudo: string;
  ficheiro_url?: string | null;
  ficheiro_nome?: string | null;
  autor_id: number;
  autor_nome: string;
  autor_avatar?: string | null;
  autor_tipo?: string;
  votos: number;
  meu_voto?: number | null;
  publicado_em: string;
  aceite?: boolean;
}
interface Topico {
  id: number;
  titulo: string;
  descricao: string;
  criado_por: number;
  autor_nome: string;
  autor_avatar?: string | null;
  autor_tipo?: string;
  categoria: string | null;
  tags: string | null;
  tipo_privacidade: 'publico' | 'privado';
  fixado: number;
  resolvido: number;
  fechado: number;
  resposta_aceite_id: number | null;
  votos: number;
  meu_voto?: number | null;
  respostas: number;
  visualizacoes: number;
  criado_em: string;
  ultima_atividade: string;
  acesso_pedido?: 'pendente' | 'aprovado' | 'rejeitado' | null;
  pedidos_pendentes?: number;
}
interface TopicoDetalhe extends Topico {
  respostas_lista: Resposta[];
}
interface RespostaComReplies extends Resposta {
  resposta_pai_id?: number | null;
}

// ── Cores de categoria (atribuídas dinamicamente por nome) ──────────────────
const PALETA = [
  { dot: '#378ADD', bg: '#E6F1FB', text: '#0C447C' },
  { dot: '#BA7517', bg: '#FAEEDA', text: '#854F0B' },
  { dot: '#1D9E75', bg: '#E1F5EE', text: '#0F6E56' },
  { dot: '#D4537E', bg: '#FBEAF0', text: '#993556' },
  { dot: '#7F77DD', bg: '#EEEDFE', text: '#3C3489' },
  { dot: '#D85A30', bg: '#FAECE7', text: '#712B13' },
  { dot: '#639922', bg: '#EAF3DE', text: '#27500A' },
];
function corCategoria(cat: string | null) {
  if (!cat) return { dot: '#888780', bg: '#F1EFE8', text: '#444441' };
  let h = 0;
  for (let i = 0; i < cat.length; i++) h = (h * 31 + cat.charCodeAt(i)) >>> 0;
  return PALETA[h % PALETA.length];
}
function CatBadge({ cat }: { cat: string | null }) {
  if (!cat) return null;
  const c = corCategoria(cat);
  return <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: c.bg, color: c.text }}>{cat}</span>;
}
const FILTROS = [
  { id: 'recentes',     label: 'Recentes' },
  { id: 'populares',    label: 'Populares' },
  { id: 'sem-resposta', label: 'Sem resposta' },
  { id: 'resolvidos',   label: 'Resolvidos' },
];

// ── Helpers ─────────────────────────────────────────────────────────────────
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
function iniciais(nome: string): string {
  return nome.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
}
function ehStaff(tipo?: string): boolean {
  return tipo === 'admin' || tipo === 'superadmin';
}
// Conteúdo de um badge de autor: foto real se existir, senão as iniciais
// (mantém exatamente o mesmo círculo/cor/tamanho já usados em cada contexto —
// só substitui o texto por uma imagem quando há avatar_url).
function avatarConteudo(avatarUrl: string | null | undefined, nome: string) {
  const src = resolveUploadUrl(avatarUrl);
  if (!src) return iniciais(nome);
  return <img src={src} alt={nome} className="w-full h-full object-cover" />;
}

// ── Coluna de votação ───────────────────────────────────────────────────────
function VotoCol({ votos, meuVoto, onVote }: { votos: number; meuVoto?: number | null; onVote: (v: number) => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 min-w-[44px] self-stretch py-2">
      <span className={`text-sm font-semibold ${votos > 0 ? 'text-green-600' : 'text-slate-800'}`}>{votos}</span>
      <button
        aria-label="gosto"
        title="Gosto (+1)"
        onClick={(e) => { e.stopPropagation(); onVote(1); }}
        className={`w-9 h-8 flex items-center justify-center rounded-lg border transition-colors ${
          meuVoto === 1 ? 'border-green-600 text-green-600 bg-green-50' : 'border-slate-200 text-slate-400 hover:border-green-400 hover:text-green-500'
        }`}
      ><ThumbsUp className="w-4 h-4" /></button>
    </div>
  );
}

export default function Forum() {
  const { isAuthenticated, user, isAdmin, isProfessorOuAdmin } = useAuth();

  const [todos, setTodos] = useState<Topico[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoria, setCategoria] = useState('all');
  const [filtro, setFiltro] = useState('recentes');
  const [busca, setBusca] = useState('');

  const [detalhe, setDetalhe] = useState<TopicoDetalhe | null>(null);
  const [loadingDetalhe, setLoadingDetalhe] = useState(false);

  const [showAuth, setShowAuth] = useState(false);
  const [authAction, setAuthAction] = useState('participar no fórum');

  const [tagFiltro, setTagFiltro] = useState<string | null>(null);

  // hashtags em tendência — contagem de todas as tags dos tópicos carregados
  const hashtagsTendencia = useMemo(() => {
    const conta: Record<string, number> = {};
    todos.forEach(t => {
      if (!t.tags) return;
      t.tags.split(',').map(s => s.trim().toLowerCase()).filter(Boolean).forEach(tag => {
        conta[tag] = (conta[tag] ?? 0) + 1;
      });
    });
    return Object.entries(conta).sort((a, b) => b[1] - a[1]).slice(0, 12);
  }, [todos]);

  const [showNovo, setShowNovo] = useState(false);
  const [novo, setNovo] = useState({ titulo: '', categoria: 'Economia', descricao: '', privado: false });
  const [novasTags, setNovasTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [aCriar, setACriar] = useState(false);

  const [respostaTexto, setRespostaTexto] = useState('');
  const [aResponder, setAResponder] = useState(false);
  const [ficheiroAnexo, setFicheiroAnexo] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [replyingTo, setReplyingTo] = useState<Resposta | null>(null);
  const [inlineReplyId, setInlineReplyId] = useState<number | null>(null);
  const [inlineReplyText, setInlineReplyText] = useState('');
  const [inlineReplyPlaceholder, setInlineReplyPlaceholder] = useState('');
  const [aEnviarReply, setAEnviarReply] = useState(false);
  const [aPedirAcesso, setAPedirAcesso] = useState(false);

  interface PedidoAcesso { id: number; subscrito_id: number; nome: string; email: string; motivo: string | null; criado_em: string }
  const [pedidosAcesso, setPedidosAcesso] = useState<PedidoAcesso[]>([]);
  const [aResponderPedido, setAResponderPedido] = useState<number | null>(null);
  const [showPedidosModal, setShowPedidosModal] = useState<{ topicoId: number; titulo: string } | null>(null);
  const [loadingPedidos, setLoadingPedidos] = useState(false);

  const exigirLogin = (acao: string) => { setAuthAction(acao); setShowAuth(true); };

  // ── Carregar lista ────────────────────────────────────────────────────────
  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest<Topico[]>('/topicos');
      setTodos(data ?? []);
    } catch {
      setTodos([]);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void carregar(); }, [carregar]);

  // Abre automaticamente o tópico indicado no query param ?topico=ID (vindo de notificações)
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    const id = Number(searchParams.get('topico'));
    if (!id || todos.length === 0) return;
    abrir(id);
    setSearchParams({}, { replace: true });
  }, [todos, searchParams]);

  // ── Derivados (filtro + pesquisa + ordenação, fixados primeiro) ────────────
  const visiveis = useMemo(() => {
    let lista = todos.slice();
    if (categoria !== 'all') lista = lista.filter((t) => t.categoria === categoria);
    if (busca.trim()) {
      const q = busca.toLowerCase();
      lista = lista.filter((t) => t.titulo.toLowerCase().includes(q) || t.descricao.toLowerCase().includes(q));
    }
    if (filtro === 'sem-resposta') lista = lista.filter((t) => t.respostas === 0);
    if (filtro === 'resolvidos')   lista = lista.filter((t) => t.resolvido);
    if (tagFiltro) lista = lista.filter((t) => t.tags?.split(',').map(s => s.trim().toLowerCase()).includes(tagFiltro));
    // Fixados primeiro; em empate de votos, a mais recente fica acima da mais
    // antiga (criado_em desc), terminando sempre no id (único) para ser determinístico.
    lista.sort((a, b) => {
      if (a.fixado !== b.fixado) return b.fixado - a.fixado;
      if (filtro === 'populares')
        return b.votos - a.votos
          || new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime()
          || b.id - a.id;
      return new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime()
        || b.id - a.id;
    });
    return lista;
  }, [todos, categoria, busca, filtro, tagFiltro]);

  // Categorias derivadas dos tópicos reais (com contagem), ordenadas por frequência
  const categoriasLista = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of todos) {
      const c = (t.categoria || '').trim();
      if (c) m.set(c, (m.get(c) || 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([nome, n]) => ({ nome, n }));
  }, [todos]);

  const totalRespostas = useMemo(() => todos.reduce((s, t) => s + Number(t.respostas || 0), 0), [todos]);
  const fixados = visiveis.filter((t) => t.fixado);
  const normais = visiveis.filter((t) => !t.fixado);

  // ── Votar tópico ──────────────────────────────────────────────────────────
  const votarTopico = async (id: number, valor: number) => {
    if (!isAuthenticated) return exigirLogin('votar em tópicos');
    try {
      const r = await apiRequest<{ votos: number; meu_voto: number }>(`/topicos/${id}/votar`, { method: 'POST', json: { valor } });
      setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, votos: r.votos, meu_voto: r.meu_voto } : t)));
      setDetalhe((d) => (d && d.id === id ? { ...d, votos: r.votos, meu_voto: r.meu_voto } : d));
    } catch (e) { toast.error((e as Error).message); }
  };

  // ── Abrir detalhe ─────────────────────────────────────────────────────────
  const abrir = async (id: number) => {
    setLoadingDetalhe(true);
    setPedidosAcesso([]);
    try {
      const data = await apiRequest<any>(`/topicos/${id}`);
      setDetalhe({ ...data, respostas_lista: data.respostas ?? [] });
      setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, visualizacoes: Number(data.visualizacoes ?? t.visualizacoes) } : t)));
      window.scrollTo({ top: 0 });
      // Se o tópico é privado, tenta carregar pedidos (o backend rejeita se não for o criador)
      if (data.tipo_privacidade === 'privado') {
        void carregarPedidos(id);
      }
    } catch (e) {
      toast.error('Não foi possível abrir o tópico.');
    } finally {
      setLoadingDetalhe(false);
    }
  };

  // ── Votar resposta ────────────────────────────────────────────────────────
  const votarResposta = async (respostaId: number, valor: number) => {
    if (!isAuthenticated) return exigirLogin('votar em respostas');
    try {
      const r = await apiRequest<{ votos: number; meu_voto: number }>(`/respostas/${respostaId}/votar`, { method: 'POST', json: { valor } });
      setDetalhe((d) => d ? { ...d, respostas_lista: d.respostas_lista.map((x) => x.id === respostaId ? { ...x, votos: r.votos, meu_voto: r.meu_voto } : x) } : d);
    } catch (e) { toast.error((e as Error).message); }
  };

  // ── Aceitar solução ───────────────────────────────────────────────────────
  const aceitarSolucao = async (respostaId: number | null) => {
    if (!detalhe) return;
    try {
      const r = await apiRequest<{ resolvido: number; resposta_aceite_id: number | null }>(`/topicos/${detalhe.id}/resolver`, { method: 'POST', json: { resposta_aceite_id: respostaId } });
      setDetalhe((d) => d ? {
        ...d, resolvido: r.resolvido, resposta_aceite_id: r.resposta_aceite_id,
        respostas_lista: d.respostas_lista.map((x) => ({ ...x, aceite: x.id === r.resposta_aceite_id })),
      } : d);
      setTodos((prev) => prev.map((t) => t.id === detalhe.id ? { ...t, resolvido: r.resolvido, resposta_aceite_id: r.resposta_aceite_id } : t));
      toast.success(respostaId ? 'Resposta marcada como solução.' : 'Solução removida.');
    } catch (e) { toast.error((e as Error).message); }
  };

  // ── Fixar (admin) ─────────────────────────────────────────────────────────
  const fixar = async (id: number) => {
    try {
      const r = await apiRequest<{ fixado: number }>(`/topicos/${id}/fixar`, { method: 'POST' });
      setTodos((prev) => prev.map((t) => t.id === id ? { ...t, fixado: r.fixado } : t));
      setDetalhe((d) => d && d.id === id ? { ...d, fixado: r.fixado } : d);
      toast.success(r.fixado ? 'Tópico fixado.' : 'Tópico desafixado.');
    } catch (e) { toast.error((e as Error).message); }
  };

  // ── Apagar tópico (autor do tópico ou admin) ──────────────────────────────
  const apagarTopico = async (id: number) => {
    if (!window.confirm('Tens a certeza que queres apagar este tópico? Esta ação é irreversível e remove também as respostas.')) return;
    try {
      await apiRequest(`/topicos/${id}`, { method: 'DELETE' });
      setTodos((prev) => prev.filter((t) => t.id !== id));
      setDetalhe((d) => (d && d.id === id ? null : d));
      toast.success('Tópico apagado.');
    } catch (e) { toast.error((e as Error).message); }
  };

  // ── Criar tópico ──────────────────────────────────────────────────────────
  const criar = async () => {
    if (!isAuthenticated) { setShowNovo(false); return exigirLogin('criar um tópico'); }
    if (!novo.titulo.trim() || !novo.descricao.trim()) { toast.error('Preenche o título e o conteúdo.'); return; }
    setACriar(true);
    try {
      await apiRequest('/topicos', { method: 'POST', json: {
        titulo: novo.titulo.trim(), descricao: novo.descricao.trim(), categoria: novo.categoria,
        tags: novasTags.length ? novasTags.join(',') : null, tipo_privacidade: novo.privado ? 'privado' : 'publico',
      }});
      toast.success('Tópico publicado com sucesso!');
      setShowNovo(false);
      setNovo({ titulo: '', categoria: 'Economia', descricao: '', privado: false });
      setNovasTags([]); setTagInput('');
      await carregar();
    } catch (e) { toast.error((e as Error).message); }
    finally { setACriar(false); }
  };

  // ── Pedido de acesso a tópico privado ────────────────────────────────────
  const pedirAcesso = async (id: number) => {
    if (!isAuthenticated) return exigirLogin('pedir acesso a tópicos privados');
    setAPedirAcesso(true);
    try {
      await apiRequest(`/topicos/${id}/solicitar-acesso`, { method: 'POST', json: {} });
      toast.success('Pedido de acesso enviado ao criador do tópico.');
      setTodos((prev) => prev.map((t) => t.id === id ? { ...t, acesso_pedido: 'pendente' } : t));
    } catch (e: any) {
      toast.error(e?.message ?? 'Não foi possível enviar o pedido.');
    } finally {
      setAPedirAcesso(false);
    }
  };

  const cancelarAcesso = async (id: number) => {
    try {
      await apiRequest(`/topicos/${id}/solicitar-acesso`, { method: 'DELETE' });
      toast.success('Pedido de acesso cancelado.');
      setTodos((prev) => prev.map((t) => t.id === id ? { ...t, acesso_pedido: null } : t));
    } catch (e: any) {
      toast.error(e?.message ?? 'Não foi possível cancelar o pedido.');
    }
  };

  // ── Gestão de pedidos de acesso ───────────────────────────────────────────
  const carregarPedidos = async (topicoId: number) => {
    setLoadingPedidos(true);
    try {
      const data = await apiRequest<{ pedidos: PedidoAcesso[] }>(`/topicos/${topicoId}/pedidos-acesso`);
      setPedidosAcesso(data.pedidos ?? []);
    } catch (e) {
      toast.error('Erro ao carregar pedidos: ' + (e as Error).message);
      setPedidosAcesso([]);
    } finally {
      setLoadingPedidos(false);
    }
  };

  const abrirModalPedidos = async (t: Topico, e: React.MouseEvent) => {
    e.stopPropagation();
    setPedidosAcesso([]);
    setShowPedidosModal({ topicoId: t.id, titulo: t.titulo });
    await carregarPedidos(t.id);
  };

  const responderPedidoModal = async (pedidoId: number, acao: 'aprovar' | 'rejeitar') => {
    if (!showPedidosModal) return;
    setAResponderPedido(pedidoId);
    try {
      await apiRequest(`/topicos/${showPedidosModal.topicoId}/pedidos-acesso/${pedidoId}`, { method: 'PATCH', json: { acao } });
      setPedidosAcesso(prev => prev.filter(p => p.id !== pedidoId));
      setTodos(prev => prev.map(t => t.id === showPedidosModal.topicoId
        ? { ...t, pedidos_pendentes: Math.max(0, (t.pedidos_pendentes ?? 1) - 1) }
        : t));
      toast.success(acao === 'aprovar' ? 'Acesso aprovado.' : 'Pedido rejeitado.');
    } catch (e) { toast.error((e as Error).message); }
    finally { setAResponderPedido(null); }
  };

  const responderPedido = async (topicoId: number, pedidoId: number, acao: 'aprovar' | 'rejeitar') => {
    setAResponderPedido(pedidoId);
    try {
      await apiRequest(`/topicos/${topicoId}/pedidos-acesso/${pedidoId}`, { method: 'PATCH', json: { acao } });
      setPedidosAcesso(prev => prev.filter(p => p.id !== pedidoId));
      toast.success(acao === 'aprovar' ? 'Acesso aprovado.' : 'Pedido rejeitado.');
    } catch (e) { toast.error((e as Error).message); }
    finally { setAResponderPedido(null); }
  };

  // ── Responder ─────────────────────────────────────────────────────────────
  const responder = async () => {
    if (!detalhe) return;
    if (!isAuthenticated) return exigirLogin('responder a tópicos');
    if (!respostaTexto.trim() && !ficheiroAnexo) return;
    setAResponder(true);
    try {
      let nova: any;
      if (ficheiroAnexo) {
        const fd = new FormData();
        fd.append('conteudo', respostaTexto.trim());
        fd.append('ficheiro', ficheiroAnexo);
        if (replyingTo) fd.append('resposta_pai_id', String(replyingTo.id));
        const resp = await fetch(`${getApiBase()}/topicos/${detalhe.id}/respostas`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${getToken()}` },
          body: fd,
        });
        if (!resp.ok) throw new Error((await resp.json()).message ?? 'Erro ao enviar.');
        nova = await resp.json();
      } else {
        nova = await apiRequest<any>(`/topicos/${detalhe.id}/respostas`, {
          method: 'POST',
          json: { conteudo: respostaTexto.trim(), resposta_pai_id: replyingTo?.id ?? null },
        });
      }
      setDetalhe((d) => d ? { ...d, respostas: d.respostas + 1, respostas_lista: [...d.respostas_lista, {
        id: nova.id, conteudo: nova.conteudo, ficheiro_url: nova.ficheiro_url, ficheiro_nome: nova.ficheiro_nome,
        autor_id: nova.autor_id, autor_nome: nova.autor_nome ?? (user as any)?.nome ?? 'Tu',
        autor_tipo: nova.autor_tipo, votos: 0, meu_voto: 0, publicado_em: nova.publicado_em ?? new Date().toISOString(),
        aceite: false, resposta_pai_id: replyingTo?.id ?? null,
      }] } : d);
      setTodos((prev) => prev.map((t) => t.id === detalhe.id ? { ...t, respostas: t.respostas + 1 } : t));
      setRespostaTexto('');
      setFicheiroAnexo(null);
      setReplyingTo(null);
    } catch (e) { toast.error((e as Error).message); }
    finally { setAResponder(false); }
  };

  const podeResolver = (t: Topico) => isAuthenticated && (isAdmin || t.criado_por === Number((user as any)?.id));
  const podeFechare  = (t: Topico) => isAuthenticated && (isAdmin || t.criado_por === Number((user as any)?.id));

  const responderInline = async (paiId: number) => {
    if (!detalhe || !inlineReplyText.trim()) return;
    setAEnviarReply(true);
    try {
      const nova = await apiRequest<any>(`/topicos/${detalhe.id}/respostas`, {
        method: 'POST',
        json: { conteudo: inlineReplyText.trim(), resposta_pai_id: paiId },
      });
      setDetalhe((d) => d ? { ...d, respostas: d.respostas + 1, respostas_lista: [...d.respostas_lista, {
        id: nova.id, conteudo: nova.conteudo, ficheiro_url: null, ficheiro_nome: null,
        autor_id: nova.autor_id, autor_nome: nova.autor_nome ?? (user as any)?.nome ?? 'Tu',
        autor_tipo: nova.autor_tipo, votos: 0, meu_voto: 0,
        publicado_em: nova.publicado_em ?? new Date().toISOString(),
        aceite: false, resposta_pai_id: paiId,
      }] } : d);
      setTodos((prev) => prev.map((t) => t.id === detalhe.id ? { ...t, respostas: t.respostas + 1 } : t));
      setInlineReplyText('');
      setInlineReplyId(null);
    } catch (e) { toast.error((e as Error).message); }
    finally { setAEnviarReply(false); }
  };

  const fecharTopico = async (id: number) => {
    try {
      const r = await apiRequest<{ fechado: number }>(`/topicos/${id}/fechar`, { method: 'POST' });
      setDetalhe((d) => d && d.id === id ? { ...d, fechado: r.fechado } : d);
      setTodos((prev) => prev.map((t) => t.id === id ? { ...t, fechado: r.fechado } : t));
      toast.success(r.fechado ? 'Tópico fechado. Não é possível responder.' : 'Tópico reaberto.');
    } catch (e) { toast.error((e as Error).message); }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: DETALHE
  // ══════════════════════════════════════════════════════════════════════════
  if (detalhe) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <AuthPrompt open={showAuth} onOpenChange={setShowAuth} action={authAction} />

        <button
          onClick={() => { setDetalhe(null); window.scrollTo({ top: 0 }); }}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-[#800020] mb-4 border border-slate-200 hover:border-[#FBBCB8] rounded-lg px-3 py-1.5 bg-white"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar aos debates
        </button>

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex gap-4">
          <VotoCol votos={detalhe.votos} meuVoto={detalhe.meu_voto} onVote={(v) => votarTopico(detalhe.id, v)} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {detalhe.fixado ? <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#FCEBEB] text-[#791F1F] flex items-center gap-1"><Pin className="w-2.5 h-2.5" /> Fixado</span> : null}
              {detalhe.resolvido ? <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#E1F5EE] text-[#0F6E56] flex items-center gap-1"><CircleCheck className="w-2.5 h-2.5" /> Resolvido</span> : null}
              {detalhe.tipo_privacidade === 'privado' ? <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 flex items-center gap-1"><Lock className="w-2.5 h-2.5" /> Privado</span> : null}
              <CatBadge cat={detalhe.categoria} />
            </div>
            <h1 className="text-xl font-semibold text-slate-900 mb-3 leading-snug">{detalhe.titulo}</h1>
            <p className="text-[15px] text-slate-600 leading-relaxed whitespace-pre-wrap mb-3">{detalhe.descricao}</p>
            {detalhe.tags ? (
              <div className="flex gap-1.5 flex-wrap mb-3">
                {detalhe.tags.split(',').map((tag, i) => tag.trim() && (
                  <span key={i} className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500">#{tag.trim()}</span>
                ))}
              </div>
            ) : null}
            <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 flex-wrap gap-2">
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="w-6 h-6 rounded-full bg-[#FEE8E8] text-[#5C0016] flex items-center justify-center text-[10px] font-medium overflow-hidden">{avatarConteudo(detalhe.autor_avatar, detalhe.autor_nome)}</span>
                {detalhe.autor_nome}{ehStaff(detalhe.autor_tipo) ? <ShieldCheck className="w-3 h-3 text-[#800020]" /> : null} · {tempoRelativo(detalhe.criado_em)}
              </span>
              <span className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {detalhe.visualizacoes}</span>
                {isAdmin ? <button onClick={() => fixar(detalhe.id)} className="flex items-center gap-1 hover:text-[#800020]"><Pin className="w-3.5 h-3.5" /> {detalhe.fixado ? 'Desafixar' : 'Fixar'}</button> : null}
                {isAdmin ? <button onClick={() => apagarTopico(detalhe.id)} className="flex items-center gap-1 hover:text-[#800020]"><Trash2 className="w-3.5 h-3.5" /> Apagar</button> : null}
              </span>
            </div>
          </div>
        </div>

        {/* Painel de pedidos de acesso pendentes — visível só ao criador */}
        {pedidosAcesso.length > 0 && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-semibold text-amber-800">
                {pedidosAcesso.length} {pedidosAcesso.length === 1 ? 'pedido de acesso pendente' : 'pedidos de acesso pendentes'}
              </span>
            </div>
            <div className="space-y-2">
              {pedidosAcesso.map(p => (
                <div key={p.id} className="flex items-center gap-3 bg-white rounded-lg border border-amber-100 px-3 py-2.5">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0">
                    {p.nome.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{p.nome}</p>
                    <p className="text-xs text-slate-500 truncate">{p.email}</p>
                    {p.motivo && <p className="text-xs text-slate-400 italic mt-0.5">"{p.motivo}"</p>}
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => responderPedido(detalhe.id, p.id, 'aprovar')}
                      disabled={aResponderPedido === p.id}
                      className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 transition-colors"
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Aprovar
                    </button>
                    <button
                      onClick={() => responderPedido(detalhe.id, p.id, 'rejeitar')}
                      disabled={aResponderPedido === p.id}
                      className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-[#FFF2F2] hover:text-[#800020] text-slate-600 disabled:opacity-50 transition-colors"
                    >
                      <UserX className="w-3.5 h-3.5" /> Rejeitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between px-1 mt-6 mb-3">
          <span className="text-sm font-medium text-slate-800">{detalhe.respostas_lista.length} {detalhe.respostas_lista.length === 1 ? 'resposta' : 'respostas'}</span>
          {/* Fechar fórum — só para o criador e apenas se houver comentários */}
          {podeFechare(detalhe) && detalhe.respostas_lista.length > 0 && (
            <button
              onClick={() => fecharTopico(detalhe.id)}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-[#800020] transition-colors"
            >
              {detalhe.fechado
                ? <><LockOpen className="w-3 h-3" /> Reabrir debate</>
                : <><Lock className="w-3 h-3" /> Fechar debate</>}
            </button>
          )}
        </div>

        {detalhe.fechado ? (
          <div className="flex items-center gap-2 px-3 py-2 mb-3 bg-slate-50 border border-slate-200 rounded-lg text-[12px] text-slate-500">
            <Lock className="w-3.5 h-3.5 shrink-0" /> Este debate foi fechado pelo criador. Não é possível adicionar novas respostas.
          </div>
        ) : null}

        {/* Replies agrupados — raiz + filhos indentados */}
        <div className="flex flex-col gap-3">
          {(() => {
            const raizes = detalhe.respostas_lista.filter((r: any) => !r.resposta_pai_id);
            const filhos = detalhe.respostas_lista.filter((r: any) => !!r.resposta_pai_id);
            const renderFilho = (f: Resposta, paiNome: string, rootId: number) => (
              <div key={f.id} className="flex gap-2 mt-2">
                {/* linha vertical conectora */}
                <div className="flex flex-col items-center shrink-0 w-5">
                  <div className="w-px flex-1 bg-slate-300" />
                </div>
                <div className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-xl p-3">
                  {/* menção ao pai */}
                  <div className="flex items-center gap-1.5 mb-1.5 text-[11px] text-slate-400">
                    <CornerDownRight className="w-3 h-3 shrink-0" />
                    <span>Em resposta a <span className="font-semibold text-slate-500">{paiNome}</span></span>
                  </div>
                  <div className="flex gap-3">
                    <VotoCol votos={f.votos} meuVoto={f.meu_voto} onVote={(v) => votarResposta(f.id, v)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-[9px] font-medium overflow-hidden">{avatarConteudo(f.autor_avatar, f.autor_nome)}</span>
                        <span className="text-[12px] font-semibold text-slate-700">{f.autor_nome}</span>
                        {ehStaff(f.autor_tipo) ? <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#FAEEDA] text-[#854F0B] font-medium">Admin</span> : null}
                        {f.aceite ? <span className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#E1F5EE] text-[#0F6E56] flex items-center gap-1"><CircleCheck className="w-2.5 h-2.5" /> Solução aceite</span> : null}
                      </div>
                      {f.conteudo && <p className="text-[13px] text-slate-600 leading-relaxed whitespace-pre-wrap">{f.conteudo}</p>}
                      {f.ficheiro_url && <FicheiroPreview ficheiroUrl={f.ficheiro_url} ficheiroNome={f.ficheiro_nome} />}
                      <div className="flex items-center gap-3 mt-1.5">
                        {isAuthenticated && !detalhe.fechado && (
                          <button
                            onClick={() => {
                              setInlineReplyId(rootId);
                              setInlineReplyText(`@${f.autor_nome} `);
                              setInlineReplyPlaceholder(`Responder a ${f.autor_nome}…`);
                            }}
                            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-[#800020] transition-colors"
                          >
                            <CornerDownRight className="w-3 h-3" /> Responder
                          </button>
                        )}
                        {detalhe.criado_por === Number((user as any)?.id) && (
                          f.aceite
                            ? <button onClick={() => aceitarSolucao(null)} className="text-[11px] text-slate-400 hover:text-slate-600">Remover solução</button>
                            : <button onClick={() => aceitarSolucao(f.id)} className="flex items-center gap-0.5 text-[11px] text-[#0F6E56] hover:underline"><CircleCheck className="w-3 h-3" /> Solução</button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );

            const renderResposta = (r: Resposta) => (
              <div key={r.id}>
                <div className={`bg-white border rounded-xl p-4 flex gap-4 ${r.aceite ? 'border-[#1D9E75] border-l-[3px]' : 'border-slate-200'}`}>
                  <VotoCol votos={r.votos} meuVoto={r.meu_voto} onVote={(v) => votarResposta(r.id, v)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[10px] font-medium overflow-hidden">{avatarConteudo(r.autor_avatar, r.autor_nome)}</span>
                      <span className="text-[13px] font-medium text-slate-800">{r.autor_nome}</span>
                      {ehStaff(r.autor_tipo) ? <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#FAEEDA] text-[#854F0B] font-medium">Admin</span> : null}
                      {r.aceite ? <span className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#E1F5EE] text-[#0F6E56] flex items-center gap-1"><CircleCheck className="w-2.5 h-2.5" /> Solução aceite</span> : null}
                    </div>
                    {r.conteudo && <p className="text-[14px] text-slate-600 leading-relaxed whitespace-pre-wrap">{r.conteudo}</p>}
                    {r.ficheiro_url && <FicheiroPreview ficheiroUrl={r.ficheiro_url} ficheiroNome={r.ficheiro_nome} />}
                    <div className="flex items-center gap-3 mt-2">
                      {isAuthenticated && !detalhe.fechado && (
                        <button
                          onClick={() => {
                            if (inlineReplyId === r.id) { setInlineReplyId(null); setInlineReplyText(''); }
                            else { setInlineReplyId(r.id); setInlineReplyText(''); setInlineReplyPlaceholder(`Responder a ${r.autor_nome}…`); }
                          }}
                          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-[#800020] transition-colors"
                        >
                          <CornerDownRight className="w-3 h-3" /> Responder
                        </button>
                      )}
                      {detalhe.criado_por === Number((user as any)?.id) && (
                        r.aceite
                          ? <button onClick={() => aceitarSolucao(null)} className="text-[11px] text-slate-400 hover:text-slate-600">Remover solução</button>
                          : <button onClick={() => aceitarSolucao(r.id)} className="flex items-center gap-0.5 text-[11px] text-[#0F6E56] hover:underline"><CircleCheck className="w-3 h-3" /> Solução</button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Respostas filhas com linha conectora */}
                {filhos.filter((f: any) => f.resposta_pai_id === r.id).length > 0 && (
                  <div className="ml-6 mt-0">
                    {filhos.filter((f: any) => f.resposta_pai_id === r.id).map((f) => renderFilho(f, r.autor_nome, r.id))}
                  </div>
                )}

                {/* Campo inline estilo Facebook */}
                {inlineReplyId === r.id && !detalhe.fechado && (
                  <div className="ml-6 flex gap-2 items-start mt-2">
                    <div className="flex flex-col items-center shrink-0 w-5">
                      <div className="w-px h-3 bg-slate-300" />
                    </div>
                    <div className="flex-1 flex gap-2 items-start">
                      <span className="w-6 h-6 rounded-full bg-[#800020] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 overflow-hidden">
                        {avatarConteudo(user?.avatarUrl, user?.name ?? '?')}
                      </span>
                      <div className="flex-1 bg-slate-100 rounded-2xl px-3 py-2 flex items-end gap-2">
                        <textarea
                          autoFocus
                          value={inlineReplyText}
                          onChange={(e) => setInlineReplyText(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void responderInline(r.id); } if (e.key === 'Escape') { setInlineReplyId(null); setInlineReplyText(''); } }}
                          placeholder={inlineReplyPlaceholder || `Responder a ${r.autor_nome}…`}
                          rows={1}
                          className="flex-1 bg-transparent text-[13px] text-slate-800 resize-none outline-none leading-relaxed placeholder:text-slate-400"
                        />
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => { setInlineReplyId(null); setInlineReplyText(''); }} className="text-slate-400 hover:text-slate-600 p-1"><X className="w-3.5 h-3.5" /></button>
                          <button onClick={() => responderInline(r.id)} disabled={aEnviarReply || !inlineReplyText.trim()} className="text-[#800020] hover:text-[#5C0016] disabled:opacity-40 p-1">
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
            return raizes.map((r) => (
              <div key={r.id}>
                {renderResposta(r)}
              </div>
            ));
          })()}
          {detalhe.respostas_lista.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-400">Ainda sem respostas. Sê o primeiro a responder.</div>
          ) : null}
        </div>

        {!detalhe.fechado && (
        <div className="bg-white border border-slate-300 rounded-xl p-4 mt-4">
          <div className="text-xs font-medium text-slate-600 mb-2">A tua resposta</div>
          <textarea
            value={respostaTexto}
            onChange={(e) => setRespostaTexto(e.target.value)}
            placeholder="Partilha a tua perspetiva com detalhe..."
            className="w-full min-h-[80px] border border-slate-200 rounded-lg p-2.5 text-[13px] bg-slate-50 resize-y outline-none focus:border-[#A0002A]"
          />
          {/* Pré-visualização do ficheiro anexado */}
          {ficheiroAnexo && (
            <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              {ficheiroAnexo.type.startsWith('image/') ? <ImageIcon className="w-4 h-4 text-blue-500 shrink-0" /> : <FileText className="w-4 h-4 text-blue-500 shrink-0" />}
              <span className="text-xs text-blue-700 truncate flex-1">{ficheiroAnexo.name}</span>
              <span className="text-[10px] text-blue-400">({(ficheiroAnexo.size / 1024).toFixed(0)} KB)</span>
              <button onClick={() => { setFicheiroAnexo(null); if (fileInputRef.current) fileInputRef.current.value = '' }} className="text-blue-400 hover:text-[#800020] ml-1"><X className="w-3.5 h-3.5" /></button>
            </div>
          )}
          <div className="flex items-center justify-between mt-2.5">
            <div>
              <input ref={fileInputRef} type="file" className="hidden" id="forum-anexo"
                accept="image/*,.pdf,.doc,.docx,.txt"
                onChange={(e) => setFicheiroAnexo(e.target.files?.[0] ?? null)}
              />
              <label htmlFor="forum-anexo" className="flex items-center gap-1.5 text-[12px] text-slate-500 hover:text-[#800020] cursor-pointer border border-slate-200 hover:border-[#FBBCB8] rounded-lg px-3 py-1.5 transition-colors">
                <Paperclip className="w-3.5 h-3.5" /> Anexar ficheiro
              </label>
            </div>
            <button onClick={responder} disabled={aResponder || (!respostaTexto.trim() && !ficheiroAnexo)} className="flex items-center gap-1.5 bg-[#800020] hover:bg-[#5C0016] disabled:opacity-50 text-white rounded-lg px-4 py-2 text-[13px] font-medium">
              <Send className="w-3.5 h-3.5" /> {aResponder ? 'A publicar…' : 'Publicar resposta'}
            </button>
          </div>
        </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: LISTA
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <AuthPrompt open={showAuth} onOpenChange={setShowAuth} action={authAction} />

      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="min-w-0">
          <h1 className="text-[18px] sm:text-[20px] font-semibold text-slate-900">Fórum da comunidade</h1>
          <p className="text-[12px] sm:text-[13px] text-slate-400 mt-0.5 hidden sm:block">Debate, dúvidas e partilha sobre economia e história de Angola</p>
        </div>
        <button onClick={() => (isAuthenticated ? setShowNovo(true) : exigirLogin('criar um tópico'))} className="flex items-center gap-1.5 bg-[#800020] hover:bg-[#5C0016] text-white rounded-md px-3 sm:px-3.5 py-2 text-[13px] font-medium shrink-0">
          <Plus className="w-4 h-4" /> <span className="hidden xs:inline">Novo </span>tópico
        </button>
      </div>

      <div className="flex gap-4">
        {/* Sidebar */}
        <aside className="hidden md:flex w-[170px] flex-shrink-0 flex-col gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-3">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-2">Categorias</div>
            <button onClick={() => setCategoria('all')} className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] ${categoria === 'all' ? 'bg-[#FFF2F2] text-[#5C0016] font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#800020' }} />
              Todas
              <span className="ml-auto text-[11px] text-slate-400">{todos.length}</span>
            </button>
            {categoriasLista.map(({ nome, n }) => (
              <button key={nome} onClick={() => setCategoria(nome)} className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] text-left ${categoria === nome ? 'bg-[#FFF2F2] text-[#5C0016] font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: corCategoria(nome).dot }} />
                <span className="truncate">{nome}</span>
                <span className="ml-auto text-[11px] text-slate-400 flex-shrink-0">{n}</span>
              </button>
            ))}
          </div>
          {hashtagsTendencia.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-3">
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-2">Hashtags</div>
              <div className="flex flex-wrap gap-1">
                {hashtagsTendencia.map(([tag, n]) => (
                  <button
                    key={tag}
                    onClick={() => setTagFiltro(tagFiltro === tag ? null : tag)}
                    className={`text-[11px] px-2 py-0.5 rounded-full font-medium transition-colors ${tagFiltro === tag ? 'bg-[#800020] text-white' : 'bg-[#FEE8E8] text-[#800020] hover:bg-[#FDD5D5]'}`}
                  >
                    #{tag}
                    <span className={`ml-1 text-[10px] ${tagFiltro === tag ? 'text-white/70' : 'text-[#800020]/60'}`}>{n}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="bg-white border border-slate-200 rounded-xl p-3">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-2">Estatísticas</div>
            <div className="flex justify-between text-[12px] text-slate-600 py-1 border-b border-slate-100"><span>Tópicos</span><span className="font-medium text-slate-800">{todos.length}</span></div>
            <div className="flex justify-between text-[12px] text-slate-600 py-1 border-b border-slate-100"><span>Respostas</span><span className="font-medium text-slate-800">{totalRespostas}</span></div>
            <div className="flex justify-between text-[12px] text-slate-600 py-1"><span>Resolvidos</span><span className="font-medium text-[#0F6E56]">{todos.filter((t) => t.resolvido).length}</span></div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 flex flex-col gap-2.5">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-md px-3 py-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Pesquisar tópicos..." className="flex-1 text-[13px] outline-none bg-transparent" />
          </div>

          {/* Filtros mobile — categorias + hashtags (visível só abaixo de md) */}
          <div className="md:hidden">
            <div className="overflow-x-auto pb-1 -mx-1 px-1">
              <div className="flex gap-1.5 w-max">
                <button onClick={() => setCategoria('all')} className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium whitespace-nowrap border transition-colors ${categoria === 'all' ? 'bg-[#800020] text-white border-[#800020]' : 'bg-white text-slate-600 border-slate-300'}`}>
                  Todas
                </button>
                {categoriasLista.map(({ nome }) => (
                  <button key={nome} onClick={() => setCategoria(nome === categoria ? 'all' : nome)} className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium whitespace-nowrap border transition-colors ${categoria === nome ? 'bg-[#800020] text-white border-[#800020]' : 'bg-white text-slate-600 border-slate-300'}`}>
                    {nome}
                  </button>
                ))}
                {hashtagsTendencia.slice(0, 8).map(([tag]) => (
                  <button key={tag} onClick={() => setTagFiltro(tagFiltro === tag ? null : tag)} className={`flex items-center gap-0.5 px-2.5 py-1 rounded-full text-[12px] font-medium whitespace-nowrap border transition-colors ${tagFiltro === tag ? 'bg-[#800020] text-white border-[#800020]' : 'bg-[#FEE8E8] text-[#800020] border-[#FDD5D5]'}`}>
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {tagFiltro && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FEE8E8] border border-[#FDD5D5] rounded-lg">
              <span className="text-[12px] text-[#800020] font-medium">#{tagFiltro}</span>
              <button onClick={() => setTagFiltro(null)} className="ml-auto text-[#800020]/60 hover:text-[#800020]"><X className="w-3.5 h-3.5" /></button>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex gap-1 bg-slate-100 rounded-md p-0.5">
              {FILTROS.map((f) => (
                <button key={f.id} onClick={() => setFiltro(f.id)} className={`text-[12px] px-2.5 sm:px-3 py-1.5 rounded-[6px] ${filtro === f.id ? 'bg-white text-slate-900 font-medium border border-slate-200' : 'text-slate-500'}`}>{f.label}</button>
              ))}
            </div>
            <span className="text-[11px] text-slate-400">{visiveis.length} tópicos</span>
          </div>

          {loading ? (
            <div className="text-center py-12 text-sm text-slate-400">A carregar tópicos…</div>
          ) : visiveis.length === 0 ? (
            <div className="text-center py-12 text-sm text-slate-400">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
              Nenhum tópico encontrado. {isAuthenticated ? 'Cria o primeiro!' : 'Entra para criar o primeiro.'}
            </div>
          ) : (
            <>
              {fixados.length > 0 && <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wide pt-1">Fixados</div>}
              {fixados.map((t) => <Card key={t.id} t={t} onOpen={abrir} onVote={votarTopico} podeGerir={isProfessorOuAdmin} onDelete={apagarTopico} onPedirAcesso={pedirAcesso} aPedirAcesso={aPedirAcesso} onCancelarAcesso={cancelarAcesso} onAbrirPedidos={abrirModalPedidos} userId={(user as any)?.id ?? null} onTagClick={setTagFiltro} />)}
              {normais.length > 0 && <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wide pt-2 flex items-center gap-1"><Flame className="w-3 h-3 text-[#BA7517]" /> Discussões</div>}
              {normais.map((t) => <Card key={t.id} t={t} onOpen={abrir} onVote={votarTopico} podeGerir={isProfessorOuAdmin} onDelete={apagarTopico} onPedirAcesso={pedirAcesso} aPedirAcesso={aPedirAcesso} onCancelarAcesso={cancelarAcesso} onAbrirPedidos={abrirModalPedidos} userId={(user as any)?.id ?? null} onTagClick={setTagFiltro} />)}
            </>
          )}
        </main>
      </div>

      {/* Modal de pedidos de acesso (a partir da lista) */}
      <Dialog open={!!showPedidosModal} onOpenChange={(o) => { if (!o) setShowPedidosModal(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Bell className="w-4 h-4 text-amber-500" /> Pedidos de acesso</DialogTitle>
            <DialogDescription className="truncate text-slate-500">{showPedidosModal?.titulo}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto mt-1">
            {loadingPedidos && (
              <div className="space-y-2">
                {[1,2].map(i => <div key={i} className="h-14 rounded-lg bg-slate-100 animate-pulse" />)}
              </div>
            )}
            {!loadingPedidos && pedidosAcesso.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6">Nenhum pedido pendente.</p>
            )}
            {pedidosAcesso.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0">
                  {p.nome.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{p.nome}</p>
                  <p className="text-xs text-slate-500 truncate">{p.email}</p>
                  {p.motivo && <p className="text-xs text-slate-400 italic mt-0.5">"{p.motivo}"</p>}
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => responderPedidoModal(p.id, 'aprovar')}
                    disabled={aResponderPedido === p.id}
                    className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                  >
                    <UserCheck className="w-3.5 h-3.5" /> Aprovar
                  </button>
                  <button
                    onClick={() => responderPedidoModal(p.id, 'rejeitar')}
                    disabled={aResponderPedido === p.id}
                    className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-[#FFF2F2] hover:text-[#800020] text-slate-600 disabled:opacity-50"
                  >
                    <UserX className="w-3.5 h-3.5" /> Rejeitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal novo tópico */}
      <Dialog open={showNovo} onOpenChange={setShowNovo}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar novo tópico</DialogTitle>
            <DialogDescription className="sr-only">Formulário para publicar um novo tópico no fórum</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Título</label>
              <input value={novo.titulo} onChange={(e) => setNovo({ ...novo, titulo: e.target.value })} placeholder="Escreve um título claro e específico..." className="w-full border border-slate-200 rounded-md px-3 py-2 text-[13px] bg-slate-50 outline-none focus:border-[#A0002A]" />
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Categoria</label>
                <select value={novo.categoria} onChange={(e) => setNovo({ ...novo, categoria: e.target.value })} className="w-full border border-slate-200 rounded-md px-3 py-2 text-[13px] bg-slate-50 outline-none focus:border-[#A0002A]">
                  {(categoriasLista.length ? categoriasLista.map((c) => c.nome) : ['Economia', 'História', 'Sociedade', 'Política']).map((nome) => <option key={nome} value={nome}>{nome}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Tags (opcional)</label>
                <div
                  className="min-h-[36px] w-full border border-slate-200 rounded-md px-2 py-1.5 bg-slate-50 focus-within:border-[#A0002A] flex flex-wrap gap-1 cursor-text"
                  onClick={(e) => (e.currentTarget.querySelector('input') as HTMLInputElement)?.focus()}
                >
                  {novasTags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FEE8E8] text-[#800020] text-[11px] font-medium">
                      #{tag}
                      <button type="button" onClick={() => setNovasTags((p) => p.filter((t) => t !== tag))} className="hover:text-[#5C0016] leading-none">×</button>
                    </span>
                  ))}
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value.replace(/\s/g, ''))}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ',' || e.key === ' ') && tagInput.trim()) {
                        e.preventDefault();
                        const t = tagInput.replace(/^#+/, '').trim().toLowerCase();
                        if (t && !novasTags.includes(t) && novasTags.length < 10) setNovasTags((p) => [...p, t]);
                        setTagInput('');
                      }
                      if (e.key === 'Backspace' && !tagInput && novasTags.length) {
                        setNovasTags((p) => p.slice(0, -1));
                      }
                    }}
                    placeholder={novasTags.length === 0 ? '#sonangol  #inflação…' : ''}
                    className="flex-1 min-w-[80px] bg-transparent text-[13px] outline-none placeholder:text-slate-400"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Enter ou vírgula para adicionar · Backspace para remover</p>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Conteúdo</label>
              <textarea value={novo.descricao} onChange={(e) => setNovo({ ...novo, descricao: e.target.value })} placeholder="Descreve a tua dúvida ou partilha a tua perspetiva..." className="w-full min-h-[100px] border border-slate-200 rounded-md px-3 py-2 text-[13px] bg-slate-50 resize-y outline-none focus:border-[#A0002A]" />
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input type="checkbox" checked={novo.privado} onChange={(e) => setNovo({ ...novo, privado: e.target.checked })} /> Tópico privado (requer aprovação de acesso)
            </label>
          </div>
          <DialogFooter>
            <button onClick={() => setShowNovo(false)} className="border border-slate-200 rounded-md px-4 py-2 text-[13px] text-slate-600">Cancelar</button>
            <button onClick={criar} disabled={aCriar} className="bg-[#800020] hover:bg-[#5C0016] disabled:opacity-50 text-white rounded-md px-4 py-2 text-[13px] font-medium">{aCriar ? 'A publicar…' : 'Publicar tópico'}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Card de tópico ──────────────────────────────────────────────────────────
function Card({ t, onOpen, onVote, podeGerir, onDelete, onPedirAcesso, aPedirAcesso, onCancelarAcesso, onAbrirPedidos, userId, onTagClick }: {
  t: Topico; onOpen: (id: number) => void; onVote: (id: number, v: number) => void;
  podeGerir?: boolean; onDelete?: (id: number) => void;
  onPedirAcesso?: (id: number) => void; aPedirAcesso?: boolean;
  onCancelarAcesso?: (id: number) => void;
  onAbrirPedidos?: (t: Topico, e: React.MouseEvent) => void;
  userId?: number | null;
  onTagClick?: (tag: string) => void;
}) {
  const accent = t.fixado ? 'border-l-[3px] border-l-[#800020]' : t.resolvido ? 'border-l-[3px] border-l-[#1D9E75]' : '';
  const ehPrivado = t.tipo_privacidade === 'privado';
  const ehCriador = userId != null && t.criado_por === userId;
  const bloqueado = ehPrivado && !ehCriador && !podeGerir && t.acesso_pedido !== 'aprovado';

  return (
    <div
      onClick={() => !bloqueado && onOpen(t.id)}
      className={`bg-white border border-slate-200 rounded-xl p-3.5 flex gap-3.5 transition-colors ${bloqueado ? 'opacity-80' : 'cursor-pointer hover:border-slate-300'} ${accent}`}
    >
      <VotoCol votos={t.votos} meuVoto={t.meu_voto} onVote={(v) => onVote(t.id, v)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
          {t.fixado ? <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#FCEBEB] text-[#791F1F] flex items-center gap-1"><Pin className="w-2.5 h-2.5" /> Fixado</span> : null}
          {t.resolvido ? <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#E1F5EE] text-[#0F6E56] flex items-center gap-1"><CircleCheck className="w-2.5 h-2.5" /> Resolvido</span> : null}
          {ehPrivado ? <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 flex items-center gap-1"><Lock className="w-2.5 h-2.5" /> Privado</span> : null}
          <CatBadge cat={t.categoria} />
        </div>
        <div className="text-[14px] font-medium text-slate-900 mb-1 leading-snug">{t.titulo}</div>
        {!bloqueado && <div className="text-[12px] text-slate-500 leading-snug overflow-hidden text-ellipsis whitespace-nowrap mb-2">{t.descricao}</div>}
        {bloqueado && (
          <div className="mb-2">
            {t.acesso_pedido === 'pendente' ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  <Clock className="w-3 h-3" /> Pedido pendente
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); onCancelarAcesso?.(t.id); }}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-[#800020] border border-slate-200 hover:border-[#FBBCB8] px-2 py-0.5 rounded-full transition-colors"
                >
                  <X className="w-3 h-3" /> Cancelar
                </button>
              </div>
            ) : t.acesso_pedido === 'rejeitado' ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-[#800020] bg-[#FFF2F2] border border-[#FDD5D5] px-2 py-0.5 rounded-full">
                <X className="w-3 h-3" /> Acesso rejeitado
              </span>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); onPedirAcesso?.(t.id); }}
                disabled={aPedirAcesso}
                className="inline-flex items-center gap-1.5 text-[12px] font-medium text-white bg-[#800020] hover:bg-[#5C0016] disabled:opacity-50 px-3 py-1 rounded-lg transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5" /> Pedir acesso
              </button>
            )}
          </div>
        )}
        {/* Primeiras 3 hashtags */}
        {t.tags && (
          <div className="flex flex-wrap gap-1 mb-2">
            {t.tags.split(',').map(s => s.trim().toLowerCase()).filter(Boolean).slice(0, 3).map(tag => (
              <button
                key={tag}
                onClick={(e) => { e.stopPropagation(); onTagClick?.(tag); }}
                className="text-[11px] px-1.5 py-0.5 rounded-full bg-[#FEE8E8] text-[#800020] hover:bg-[#FDD5D5] transition-colors font-medium"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="w-5 h-5 rounded-full bg-[#FEE8E8] text-[#5C0016] flex items-center justify-center text-[9px] font-medium overflow-hidden">{avatarConteudo(t.autor_avatar, t.autor_nome)}</span>
            {t.autor_nome}{ehStaff(t.autor_tipo) ? <ShieldCheck className="w-3 h-3 text-[#800020]" /> : null}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-slate-400"><Clock className="w-3 h-3" /> {tempoRelativo(t.criado_em)}</span>
          {t.visualizacoes > 0 ? <span className="flex items-center gap-1 text-[11px] text-slate-400"><Eye className="w-3 h-3" /> {t.visualizacoes}</span> : null}
        </div>
      </div>
      <div className="flex flex-col items-center justify-center min-w-[56px] gap-1.5">
        {podeGerir && onDelete ? (
          <button onClick={(e) => { e.stopPropagation(); onDelete(t.id); }} aria-label="apagar tópico" title="Apagar tópico" className="text-slate-300 hover:text-[#800020] transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
        ) : null}
        {/* Botão de pedidos pendentes — visível ao criador e admins */}
        {(podeGerir || t.criado_por === userId) && t.tipo_privacidade === 'privado' && (t.pedidos_pendentes ?? 0) > 0 && (
          <button
            onClick={(e) => onAbrirPedidos?.(t, e)}
            className="relative flex items-center justify-center w-7 h-7 rounded-full bg-amber-500 hover:bg-amber-600 text-white transition-colors"
            title="Ver pedidos de acesso pendentes"
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#800020] rounded-full text-[9px] flex items-center justify-center font-bold">
              {t.pedidos_pendentes}
            </span>
          </button>
        )}
        {!bloqueado && <>
          <div className={`text-lg font-medium ${t.respostas === 0 ? 'text-slate-300' : 'text-slate-800'}`}>{t.respostas}</div>
          <div className={`text-[10px] ${t.respostas === 0 ? 'text-amber-600' : 'text-slate-400'}`}>{t.respostas === 0 ? 'sem resp.' : 'respostas'}</div>
        </>}
      </div>
    </div>
  );
}
