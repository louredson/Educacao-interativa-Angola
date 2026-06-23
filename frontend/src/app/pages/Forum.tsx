import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronUp, ChevronDown, Plus, Search, Pin, CircleCheck, Eye, Clock,
  MessageCircle, X, ArrowLeft, Flame, MessageSquare, ShieldCheck, Lock, Send, Trash2,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../services/api';
import AuthPrompt from '../components/AuthPrompt';
import { toast } from 'sonner';

// ── Tipos ───────────────────────────────────────────────────────────────────
interface Resposta {
  id: number;
  conteudo: string;
  autor_id: number;
  autor_nome: string;
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
  autor_tipo?: string;
  categoria: string | null;
  tags: string | null;
  tipo_privacidade: 'publico' | 'privado';
  fixado: number;
  resolvido: number;
  resposta_aceite_id: number | null;
  votos: number;
  meu_voto?: number | null;
  respostas: number;
  visualizacoes: number;
  criado_em: string;
  ultima_atividade: string;
}
interface TopicoDetalhe extends Topico {
  respostas_lista: Resposta[];
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

// ── Coluna de votação ───────────────────────────────────────────────────────
function VotoCol({ votos, meuVoto, onVote }: { votos: number; meuVoto?: number | null; onVote: (v: number) => void }) {
  return (
    <div className="flex flex-col items-center gap-1 min-w-[36px]">
      <button
        aria-label="votar positivo"
        onClick={(e) => { e.stopPropagation(); onVote(1); }}
        className={`w-8 h-7 flex items-center justify-center rounded-md border transition-colors ${
          meuVoto === 1 ? 'border-red-600 text-red-600 bg-red-50' : 'border-slate-200 text-slate-400 hover:border-red-400 hover:text-red-500'
        }`}
      ><ChevronUp className="w-4 h-4" /></button>
      <span className="text-sm font-medium text-slate-800">{votos}</span>
      <button
        aria-label="votar negativo"
        onClick={(e) => { e.stopPropagation(); onVote(-1); }}
        className={`w-8 h-7 flex items-center justify-center rounded-md border transition-colors ${
          meuVoto === -1 ? 'border-slate-500 text-slate-600 bg-slate-100' : 'border-slate-200 text-slate-400 hover:border-slate-400 hover:text-slate-600'
        }`}
      ><ChevronDown className="w-4 h-4" /></button>
    </div>
  );
}

export default function Forum() {
  const { isAuthenticated, user, isAdmin } = useAuth();

  const [todos, setTodos] = useState<Topico[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoria, setCategoria] = useState('all');
  const [filtro, setFiltro] = useState('recentes');
  const [busca, setBusca] = useState('');

  const [detalhe, setDetalhe] = useState<TopicoDetalhe | null>(null);
  const [loadingDetalhe, setLoadingDetalhe] = useState(false);

  const [showAuth, setShowAuth] = useState(false);
  const [authAction, setAuthAction] = useState('participar no fórum');

  const [showNovo, setShowNovo] = useState(false);
  const [novo, setNovo] = useState({ titulo: '', categoria: 'Economia', tags: '', descricao: '', privado: false });
  const [aCriar, setACriar] = useState(false);

  const [respostaTexto, setRespostaTexto] = useState('');
  const [aResponder, setAResponder] = useState(false);

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
  }, [todos, categoria, busca, filtro]);

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
    try {
      const data = await apiRequest<any>(`/topicos/${id}`);
      setDetalhe({ ...data, respostas_lista: data.respostas ?? [] });
      setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, visualizacoes: Number(data.visualizacoes ?? t.visualizacoes) } : t)));
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
        tags: novo.tags.trim() || null, tipo_privacidade: novo.privado ? 'privado' : 'publico',
      }});
      toast.success('Tópico publicado com sucesso!');
      setShowNovo(false);
      setNovo({ titulo: '', categoria: 'Economia', tags: '', descricao: '', privado: false });
      await carregar();
    } catch (e) { toast.error((e as Error).message); }
    finally { setACriar(false); }
  };

  // ── Responder ─────────────────────────────────────────────────────────────
  const responder = async () => {
    if (!detalhe) return;
    if (!isAuthenticated) return exigirLogin('responder a tópicos');
    if (!respostaTexto.trim()) return;
    setAResponder(true);
    try {
      const nova = await apiRequest<any>(`/topicos/${detalhe.id}/respostas`, { method: 'POST', json: { conteudo: respostaTexto.trim() } });
      setDetalhe((d) => d ? { ...d, respostas: d.respostas + 1, respostas_lista: [...d.respostas_lista, {
        id: nova.id, conteudo: nova.conteudo, autor_id: nova.autor_id, autor_nome: nova.autor_nome ?? (user as any)?.nome ?? 'Tu',
        autor_tipo: nova.autor_tipo, votos: 0, meu_voto: 0, publicado_em: nova.publicado_em ?? new Date().toISOString(), aceite: false,
      }] } : d);
      setTodos((prev) => prev.map((t) => t.id === detalhe.id ? { ...t, respostas: t.respostas + 1 } : t));
      setRespostaTexto('');
    } catch (e) { toast.error((e as Error).message); }
    finally { setAResponder(false); }
  };

  const podeResolver = (t: Topico) => isAuthenticated && (isAdmin || t.criado_por === Number((user as any)?.id));

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: DETALHE
  // ══════════════════════════════════════════════════════════════════════════
  if (detalhe) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <AuthPrompt open={showAuth} onOpenChange={setShowAuth} action={authAction} />

        <button onClick={() => setDetalhe(null)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 mb-4">
          <ArrowLeft className="w-4 h-4" /> Voltar ao fórum
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
                <span className="w-6 h-6 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-[10px] font-medium">{iniciais(detalhe.autor_nome)}</span>
                {detalhe.autor_nome}{ehStaff(detalhe.autor_tipo) ? <ShieldCheck className="w-3 h-3 text-red-500" /> : null} · {tempoRelativo(detalhe.criado_em)}
              </span>
              <span className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {detalhe.visualizacoes}</span>
                {isAdmin ? <button onClick={() => fixar(detalhe.id)} className="flex items-center gap-1 hover:text-red-600"><Pin className="w-3.5 h-3.5" /> {detalhe.fixado ? 'Desafixar' : 'Fixar'}</button> : null}
                {isAdmin ? <button onClick={() => apagarTopico(detalhe.id)} className="flex items-center gap-1 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /> Apagar</button> : null}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-1 mt-6 mb-3">
          <span className="text-sm font-medium text-slate-800">{detalhe.respostas_lista.length} {detalhe.respostas_lista.length === 1 ? 'resposta' : 'respostas'}</span>
        </div>

        <div className="flex flex-col gap-3">
          {detalhe.respostas_lista.map((r) => (
            <div key={r.id} className={`bg-white border rounded-xl p-4 flex gap-4 ${r.aceite ? 'border-[#1D9E75] border-l-[3px]' : 'border-slate-200'}`}>
              <VotoCol votos={r.votos} meuVoto={r.meu_voto} onVote={(v) => votarResposta(r.id, v)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[10px] font-medium">{iniciais(r.autor_nome)}</span>
                  <span className="text-[13px] font-medium text-slate-800">{r.autor_nome}</span>
                  {ehStaff(r.autor_tipo) ? <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#FAEEDA] text-[#854F0B] font-medium">Admin</span> : null}
                  {r.aceite ? <span className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#E1F5EE] text-[#0F6E56] flex items-center gap-1"><CircleCheck className="w-2.5 h-2.5" /> Solução aceite</span> : null}
                </div>
                <p className="text-[14px] text-slate-600 leading-relaxed whitespace-pre-wrap">{r.conteudo}</p>
                {podeResolver(detalhe) ? (
                  <div className="mt-2.5">
                    {r.aceite
                      ? <button onClick={() => aceitarSolucao(null)} className="text-xs text-slate-400 hover:text-slate-600">Remover solução</button>
                      : <button onClick={() => aceitarSolucao(r.id)} className="text-xs text-[#0F6E56] hover:underline flex items-center gap-1"><CircleCheck className="w-3.5 h-3.5" /> Marcar como solução</button>}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
          {detalhe.respostas_lista.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-400">Ainda sem respostas. Sê o primeiro a responder.</div>
          ) : null}
        </div>

        <div className="bg-white border border-slate-300 rounded-xl p-4 mt-4">
          <div className="text-xs font-medium text-slate-600 mb-2">A tua resposta</div>
          <textarea
            value={respostaTexto}
            onChange={(e) => setRespostaTexto(e.target.value)}
            placeholder="Partilha a tua perspetiva com detalhe..."
            className="w-full min-h-[80px] border border-slate-200 rounded-lg p-2.5 text-[13px] bg-slate-50 resize-y outline-none focus:border-red-400"
          />
          <div className="flex justify-end mt-2.5">
            <button onClick={responder} disabled={aResponder || !respostaTexto.trim()} className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-[13px] font-medium">
              <Send className="w-3.5 h-3.5" /> {aResponder ? 'A publicar…' : 'Publicar resposta'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: LISTA
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <AuthPrompt open={showAuth} onOpenChange={setShowAuth} action={authAction} />

      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[20px] font-semibold text-slate-900">Fórum da comunidade</h1>
          <p className="text-[13px] text-slate-400 mt-0.5">Debate, dúvidas e partilha sobre economia e história de Angola</p>
        </div>
        <button onClick={() => (isAuthenticated ? setShowNovo(true) : exigirLogin('criar um tópico'))} className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md px-3.5 py-2 text-[13px] font-medium">
          <Plus className="w-4 h-4" /> Novo tópico
        </button>
      </div>

      <div className="flex gap-4">
        {/* Sidebar */}
        <aside className="hidden md:flex w-[170px] flex-shrink-0 flex-col gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-3">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-2">Categorias</div>
            <button onClick={() => setCategoria('all')} className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] ${categoria === 'all' ? 'bg-red-50 text-red-800 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#C1121F' }} />
              Todas
              <span className="ml-auto text-[11px] text-slate-400">{todos.length}</span>
            </button>
            {categoriasLista.map(({ nome, n }) => (
              <button key={nome} onClick={() => setCategoria(nome)} className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] text-left ${categoria === nome ? 'bg-red-50 text-red-800 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: corCategoria(nome).dot }} />
                <span className="truncate">{nome}</span>
                <span className="ml-auto text-[11px] text-slate-400 flex-shrink-0">{n}</span>
              </button>
            ))}
          </div>
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

          <div className="flex items-center justify-between">
            <div className="flex gap-1 bg-slate-100 rounded-md p-0.5">
              {FILTROS.map((f) => (
                <button key={f.id} onClick={() => setFiltro(f.id)} className={`text-[12px] px-3 py-1.5 rounded-[6px] ${filtro === f.id ? 'bg-white text-slate-900 font-medium border border-slate-200' : 'text-slate-500'}`}>{f.label}</button>
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
              {fixados.map((t) => <Card key={t.id} t={t} onOpen={abrir} onVote={votarTopico} podeGerir={isAdmin} onDelete={apagarTopico} />)}
              {normais.length > 0 && <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wide pt-2 flex items-center gap-1"><Flame className="w-3 h-3 text-[#BA7517]" /> Discussões</div>}
              {normais.map((t) => <Card key={t.id} t={t} onOpen={abrir} onVote={votarTopico} podeGerir={isAdmin} onDelete={apagarTopico} />)}
            </>
          )}
        </main>
      </div>

      {/* Modal novo tópico */}
      <Dialog open={showNovo} onOpenChange={setShowNovo}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Criar novo tópico</DialogTitle>
            <DialogDescription className="sr-only">Formulário para publicar um novo tópico no fórum</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Título</label>
              <input value={novo.titulo} onChange={(e) => setNovo({ ...novo, titulo: e.target.value })} placeholder="Escreve um título claro e específico..." className="w-full border border-slate-200 rounded-md px-3 py-2 text-[13px] bg-slate-50 outline-none focus:border-red-400" />
            </div>
            <div className="flex gap-2.5">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Categoria</label>
                <select value={novo.categoria} onChange={(e) => setNovo({ ...novo, categoria: e.target.value })} className="w-full border border-slate-200 rounded-md px-3 py-2 text-[13px] bg-slate-50 outline-none focus:border-red-400">
                  {(categoriasLista.length ? categoriasLista.map((c) => c.nome) : ['Economia', 'História', 'Sociedade', 'Política']).map((nome) => <option key={nome} value={nome}>{nome}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Tags (opcional)</label>
                <input value={novo.tags} onChange={(e) => setNovo({ ...novo, tags: e.target.value })} placeholder="ex: sonangol, inflação" className="w-full border border-slate-200 rounded-md px-3 py-2 text-[13px] bg-slate-50 outline-none focus:border-red-400" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Conteúdo</label>
              <textarea value={novo.descricao} onChange={(e) => setNovo({ ...novo, descricao: e.target.value })} placeholder="Descreve a tua dúvida ou partilha a tua perspetiva..." className="w-full min-h-[100px] border border-slate-200 rounded-md px-3 py-2 text-[13px] bg-slate-50 resize-y outline-none focus:border-red-400" />
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input type="checkbox" checked={novo.privado} onChange={(e) => setNovo({ ...novo, privado: e.target.checked })} /> Tópico privado (requer aprovação de acesso)
            </label>
          </div>
          <DialogFooter>
            <button onClick={() => setShowNovo(false)} className="border border-slate-200 rounded-md px-4 py-2 text-[13px] text-slate-600">Cancelar</button>
            <button onClick={criar} disabled={aCriar} className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-md px-4 py-2 text-[13px] font-medium">{aCriar ? 'A publicar…' : 'Publicar tópico'}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Card de tópico ──────────────────────────────────────────────────────────
function Card({ t, onOpen, onVote, podeGerir, onDelete }: { t: Topico; onOpen: (id: number) => void; onVote: (id: number, v: number) => void; podeGerir?: boolean; onDelete?: (id: number) => void }) {
  const accent = t.fixado ? 'border-l-[3px] border-l-red-600' : t.resolvido ? 'border-l-[3px] border-l-[#1D9E75]' : '';
  return (
    <div onClick={() => onOpen(t.id)} className={`bg-white border border-slate-200 rounded-xl p-3.5 flex gap-3.5 cursor-pointer hover:border-slate-300 transition-colors ${accent}`}>
      <VotoCol votos={t.votos} meuVoto={t.meu_voto} onVote={(v) => onVote(t.id, v)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
          {t.fixado ? <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#FCEBEB] text-[#791F1F] flex items-center gap-1"><Pin className="w-2.5 h-2.5" /> Fixado</span> : null}
          {t.resolvido ? <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#E1F5EE] text-[#0F6E56] flex items-center gap-1"><CircleCheck className="w-2.5 h-2.5" /> Resolvido</span> : null}
          {t.tipo_privacidade === 'privado' ? <Lock className="w-3 h-3 text-slate-400" /> : null}
          <CatBadge cat={t.categoria} />
        </div>
        <div className="text-[14px] font-medium text-slate-900 mb-1 leading-snug">{t.titulo}</div>
        <div className="text-[12px] text-slate-500 leading-snug overflow-hidden text-ellipsis whitespace-nowrap mb-2">{t.descricao}</div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-[9px] font-medium">{iniciais(t.autor_nome)}</span>
            {t.autor_nome}{ehStaff(t.autor_tipo) ? <ShieldCheck className="w-3 h-3 text-red-500" /> : null}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-slate-400"><Clock className="w-3 h-3" /> {tempoRelativo(t.criado_em)}</span>
          {t.visualizacoes > 0 ? <span className="flex items-center gap-1 text-[11px] text-slate-400"><Eye className="w-3 h-3" /> {t.visualizacoes}</span> : null}
        </div>
      </div>
      <div className="flex flex-col items-center justify-center min-w-[46px] gap-1">
        {podeGerir && onDelete ? (
          <button onClick={(e) => { e.stopPropagation(); onDelete(t.id); }} aria-label="apagar tópico" title="Apagar tópico" className="text-slate-300 hover:text-red-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
        ) : null}
        <div className={`text-lg font-medium ${t.respostas === 0 ? 'text-slate-300' : 'text-slate-800'}`}>{t.respostas}</div>
        <div className={`text-[10px] ${t.respostas === 0 ? 'text-amber-600' : 'text-slate-400'}`}>{t.respostas === 0 ? 'sem resp.' : 'respostas'}</div>
      </div>
    </div>
  );
}
