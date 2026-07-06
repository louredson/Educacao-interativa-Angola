import { Bell, Trophy, MessageCircle, ThumbsUp, Target, TrendingUp, CheckCircle, Lock, UserCheck, Trash2, BookOpen, Flame, Users, X, Flag, Eye } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { useEffect, useState } from 'react';
import { apiRequest } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router';

interface Notificacao {
  id: number;
  tipo: string;
  entidade_id: number | null;
  titulo: string | null;
  mensagem: string;
  link_destino: string | null;
  lida: number;
  criada_em: string;
}

function iconeETipo(tipo: string): { icon: React.ReactNode; color: string } {
  switch (tipo) {
    case 'novo_quiz':               return { icon: <Target className="w-4 h-4" />,       color: 'bg-blue-500' };
    case 'novo_topico':             return { icon: <MessageCircle className="w-4 h-4" />, color: 'bg-green-500' };
    case 'nova_resposta_forum':     return { icon: <MessageCircle className="w-4 h-4" />, color: 'bg-purple-500' };
    case 'like_comentario':         return { icon: <ThumbsUp className="w-4 h-4" />,      color: 'bg-[#800020]' };
    case 'resposta_comentario':     return { icon: <MessageCircle className="w-4 h-4" />, color: 'bg-indigo-500' };
    case 'acesso_jindungo_aprovado':return { icon: <BookOpen className="w-4 h-4" />,      color: 'bg-amber-500' };
    case 'acesso_topico_aprovado':  return { icon: <UserCheck className="w-4 h-4" />,     color: 'bg-green-600' };
    case 'pedido_acesso_topico':    return { icon: <Lock className="w-4 h-4" />,          color: 'bg-orange-500' };
    case 'pedido_acesso_jindungo':  return { icon: <Flame className="w-4 h-4" />,         color: 'bg-amber-600' };
    case 'acesso_jindungo_rejeitado': return { icon: <BookOpen className="w-4 h-4" />,    color: 'bg-slate-400' };
    case 'convite_sala':            return { icon: <Users className="w-4 h-4" />,         color: 'bg-teal-600' };
    case 'convite_topico':          return { icon: <Users className="w-4 h-4" />,         color: 'bg-teal-600' };
    case 'comentario_denunciado':   return { icon: <Flag className="w-4 h-4" />,          color: 'bg-red-600' };
    default:                        return { icon: <Bell className="w-4 h-4" />,           color: 'bg-slate-500' };
  }
}

function tempoRelativo(dataStr: string): string {
  const diff = Date.now() - new Date(dataStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1)  return 'agora mesmo';
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24)  return `há ${h}h`;
  const d = Math.floor(h / 24);
  return `há ${d} ${d === 1 ? 'dia' : 'dias'}`;
}

export default function Notifications() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [naoLidas, setNaoLidas]         = useState(0);
  const [loading, setLoading]           = useState(true);
  const [aProcessar, setAProcessar]     = useState<number | null>(null);
  const [resultados, setResultados]     = useState<Record<number, 'aprovado' | 'rejeitado' | 'aceite' | 'apagado' | 'ignorado' | 'erro'>>({});

  useEffect(() => {
    if (!isAuthenticated) return;
    void carregar();
  }, [isAuthenticated]);

  async function carregar() {
    setLoading(true);
    try {
      const data = await apiRequest<{ notificacoes: Notificacao[]; nao_lidas: number }>('/notificacoes');
      setNotificacoes(data.notificacoes);
      setNaoLidas(data.nao_lidas);
    } catch {
      // sem acesso
    } finally {
      setLoading(false);
    }
  }

  async function marcarLida(id: number) {
    try {
      await apiRequest(`/notificacoes/${id}/ler`, { method: 'PATCH' });
      setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: 1 } : n));
      setNaoLidas(prev => Math.max(0, prev - 1));
    } catch { /* silencioso */ }
  }

  async function marcarTodasLidas() {
    try {
      await apiRequest('/notificacoes/ler-todas', { method: 'PATCH' });
      setNotificacoes(prev => prev.map(n => ({ ...n, lida: 1 })));
      setNaoLidas(0);
    } catch { /* silencioso */ }
  }

  async function apagar(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await apiRequest(`/notificacoes/${id}`, { method: 'DELETE' });
      setNotificacoes(prev => {
        const removida = prev.find(n => n.id === id);
        if (removida && !removida.lida) setNaoLidas(c => Math.max(0, c - 1));
        return prev.filter(n => n.id !== id);
      });
    } catch { /* silencioso */ }
  }

  function clicarNotificacao(n: Notificacao) {
    if (!n.lida) void marcarLida(n.id);
    if (n.link_destino) navigate(n.link_destino);
  }

  async function responderPedidoJindungo(n: Notificacao, status: 'aprovado' | 'rejeitado', e: React.MouseEvent) {
    e.stopPropagation();
    if (!n.entidade_id || aProcessar) return;
    setAProcessar(n.id);
    try {
      await apiRequest(`/content/access-requests/${n.entidade_id}`, {
        method: 'PATCH',
        json: { status },
      });
      setResultados(prev => ({ ...prev, [n.id]: status }));
      if (!n.lida) void marcarLida(n.id);
    } catch {
      setResultados(prev => ({ ...prev, [n.id]: 'erro' }));
    } finally {
      setAProcessar(null);
    }
  }

  async function aceitarConvite(n: Notificacao, e: React.MouseEvent) {
    e.stopPropagation();
    const codigo = n.link_destino?.match(/codigo=([A-Z0-9]+)/i)?.[1];
    if (!codigo || aProcessar) return;
    setAProcessar(n.id);
    try {
      await apiRequest('/convites/usar', { method: 'POST', json: { codigo } });
      setResultados(prev => ({ ...prev, [n.id]: 'aceite' }));
      if (!n.lida) void marcarLida(n.id);
    } catch {
      setResultados(prev => ({ ...prev, [n.id]: 'erro' }));
    } finally {
      setAProcessar(null);
    }
  }

  async function resolverComentarioDenunciado(n: Notificacao, acao: 'apagar' | 'ignorar', e: React.MouseEvent) {
    e.stopPropagation();
    if (!n.entidade_id || aProcessar) return;
    setAProcessar(n.id);
    try {
      await apiRequest(`/admin/comentarios-denunciados/${n.entidade_id}`, {
        method: 'PATCH',
        json: { acao },
      });
      setResultados(prev => ({ ...prev, [n.id]: acao === 'apagar' ? 'apagado' : 'ignorado' }));
      if (!n.lida) void marcarLida(n.id);
    } catch {
      setResultados(prev => ({ ...prev, [n.id]: 'erro' }));
    } finally {
      setAProcessar(null);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <section className="text-white" style={{ background: '#800020' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Bell className="w-7 h-7" />
                <h1 className="text-3xl font-bold">Notificações</h1>
              </div>
              <p className="text-[#FEE8E8] text-base">
                Mantenha-se atualizado sobre tudo que acontece na plataforma
              </p>
            </div>
            {naoLidas > 0 && (
              <Badge className="bg-white text-[#800020] text-base px-3 py-1.5">
                {naoLidas} {naoLidas === 1 ? 'nova' : 'novas'}
              </Badge>
            )}
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-slate-900">Todas as Notificações</h2>
          {naoLidas > 0 && (
            <Button onClick={marcarTodasLidas} variant="outline" className="text-[#800020] hover:text-[#5C0016] text-sm py-1.5 h-auto">
              <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
              Marcar todas como lidas
            </Button>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />)}
          </div>
        ) : notificacoes.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-600 mb-1">Nenhuma notificação</h3>
            <p className="text-sm text-slate-500">Você está em dia! Não há notificações novas.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notificacoes.map((n) => {
              const { icon, color } = iconeETipo(n.tipo);
              return (
                <Card
                  key={n.id}
                  onClick={() => clicarNotificacao(n)}
                  className={`transition-all hover:shadow-md cursor-pointer group ${!n.lida ? 'border-l-4 border-l-[#800020] bg-[#FFF2F2]/30' : ''}`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className={`${color} rounded-full p-2 text-white flex-shrink-0`}>
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-0.5">
                          <h3 className={`text-sm text-slate-900 ${!n.lida ? 'font-semibold' : 'font-medium'}`}>
                            {n.titulo ?? tipoParaTitulo(n.tipo)}
                          </h3>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {!n.lida && <span className="w-1.5 h-1.5 bg-[#800020] rounded-full mt-1" />}
                            <button
                              onClick={(e) => apagar(n.id, e)}
                              className="text-slate-300 hover:text-[#800020] opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Apagar notificação"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-slate-600 text-xs mb-1 line-clamp-2">{n.mensagem}</p>
                        <span className="text-xs text-slate-400">{tempoRelativo(n.criada_em)}</span>

                        {n.tipo === 'pedido_acesso_jindungo' && (
                          resultados[n.id] ? (
                            <p className={`mt-2 text-xs font-semibold ${resultados[n.id] === 'aprovado' ? 'text-green-600' : resultados[n.id] === 'rejeitado' ? 'text-slate-500' : 'text-[#800020]'}`}>
                              {resultados[n.id] === 'aprovado' ? '✓ Acesso aprovado' : resultados[n.id] === 'rejeitado' ? 'Pedido recusado' : 'Não foi possível processar.'}
                            </p>
                          ) : (
                            <div className="flex items-center gap-2 mt-2">
                              <Button
                                size="sm"
                                disabled={aProcessar === n.id}
                                onClick={(e) => responderPedidoJindungo(n, 'aprovado', e)}
                                className="h-7 px-3 text-xs bg-[#800020] hover:bg-[#5C0016] text-white"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" /> Aceitar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={aProcessar === n.id}
                                onClick={(e) => responderPedidoJindungo(n, 'rejeitado', e)}
                                className="h-7 px-3 text-xs"
                              >
                                <X className="w-3 h-3 mr-1" /> Recusar
                              </Button>
                            </div>
                          )
                        )}

                        {(n.tipo === 'convite_sala' || n.tipo === 'convite_topico') && (
                          resultados[n.id] ? (
                            <p className={`mt-2 text-xs font-semibold ${resultados[n.id] === 'aceite' ? 'text-green-600' : 'text-[#800020]'}`}>
                              {resultados[n.id] === 'aceite' ? '✓ Convite aceite' : 'Não foi possível aceitar — pode já ter expirado.'}
                            </p>
                          ) : (
                            <Button
                              size="sm"
                              disabled={aProcessar === n.id}
                              onClick={(e) => aceitarConvite(n, e)}
                              className="h-7 px-3 text-xs bg-[#800020] hover:bg-[#5C0016] text-white mt-2"
                            >
                              <Users className="w-3 h-3 mr-1" /> Aceitar convite
                            </Button>
                          )
                        )}

                        {n.tipo === 'comentario_denunciado' && (
                          resultados[n.id] ? (
                            <p className={`mt-2 text-xs font-semibold ${resultados[n.id] === 'apagado' ? 'text-[#800020]' : resultados[n.id] === 'ignorado' ? 'text-slate-500' : 'text-[#800020]'}`}>
                              {resultados[n.id] === 'apagado' ? '✓ Comentário apagado' : resultados[n.id] === 'ignorado' ? 'Denúncia ignorada' : 'Não foi possível processar.'}
                            </p>
                          ) : (
                            <div className="flex items-center gap-2 mt-2">
                              <Button
                                size="sm"
                                disabled={aProcessar === n.id}
                                onClick={(e) => resolverComentarioDenunciado(n, 'apagar', e)}
                                className="h-7 px-3 text-xs bg-[#800020] hover:bg-[#5C0016] text-white"
                              >
                                <Trash2 className="w-3 h-3 mr-1" /> Apagar comentário
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={aProcessar === n.id}
                                onClick={(e) => resolverComentarioDenunciado(n, 'ignorar', e)}
                                className="h-7 px-3 text-xs"
                              >
                                <Eye className="w-3 h-3 mr-1" /> Ignorar
                              </Button>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function tipoParaTitulo(tipo: string): string {
  const mapa: Record<string, string> = {
    novo_quiz:                'Novo Quiz Disponível',
    novo_topico:              'Novo Tópico no Fórum',
    nova_resposta_forum:      'Resposta ao teu tópico',
    like_comentario:          'Gostaram do teu comentário',
    resposta_comentario:      'Resposta ao teu comentário',
    acesso_jindungo_aprovado: 'Acesso aprovado',
    acesso_topico_aprovado:   'Acesso ao tópico aprovado',
    pedido_acesso_topico:     'Pedido de acesso ao teu tópico',
    pedido_acesso_jindungo:   'Pedido de acesso Jindungo',
    acesso_jindungo_rejeitado: 'Pedido de acesso não aceite',
    convite_sala:             'Convite para uma sala',
    convite_topico:           'Convite para um tópico',
    comentario_denunciado:    'Comentário denunciado',
  };
  return mapa[tipo] ?? 'Notificação';
}
