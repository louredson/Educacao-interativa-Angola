import { Bell, Trophy, MessageCircle, ThumbsUp, Target, TrendingUp, CheckCircle, Trash2 } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Notificacao {
  id: number;
  tipo: string;
  titulo: string | null;
  mensagem: string;
  lida: boolean;
  criada_em: string;
  link_destino: string | null;
}

function tipoParaIcone(tipo: string): { icon: React.ReactNode; color: string } {
  switch (tipo) {
    case 'novo_quiz':
      return { icon: <Target className="w-4 h-4" />, color: 'bg-blue-500' };
    case 'nova_resposta_forum':
    case 'novo_topico':
      return { icon: <MessageCircle className="w-4 h-4" />, color: 'bg-green-500' };
    case 'like_comentario':
    case 'resposta_comentario':
      return { icon: <ThumbsUp className="w-4 h-4" />, color: 'bg-red-500' };
    case 'acesso_jindungo_aprovado':
    case 'acesso_topico_aprovado':
      return { icon: <TrendingUp className="w-4 h-4" />, color: 'bg-yellow-500' };
    default:
      return { icon: <Bell className="w-4 h-4" />, color: 'bg-slate-500' };
  }
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

export default function Notifications() {
  const { isAuthenticated } = useAuth();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    try {
      const data = await apiRequest<{ notificacoes: Notificacao[]; nao_lidas: number }>('/notificacoes');
      setNotificacoes(data.notificacoes);
      setNaoLidas(data.nao_lidas);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { void carregar(); }, [carregar]);

  const marcarLida = async (id: number) => {
    setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
    setNaoLidas(prev => Math.max(0, prev - 1));
    try {
      await apiRequest(`/notificacoes/${id}/ler`, { method: 'PATCH' });
    } catch { /* best-effort */ }
  };

  const marcarTodasLidas = async () => {
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
    setNaoLidas(0);
    try {
      await apiRequest('/notificacoes/ler-todas', { method: 'PATCH' });
    } catch { /* best-effort */ }
  };

  const apagar = async (id: number) => {
    setNotificacoes(prev => prev.filter(n => n.id !== id));
    try {
      await apiRequest(`/notificacoes/${id}`, { method: 'DELETE' });
    } catch { /* best-effort */ }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <section className="text-white" style={{ background: '#C1121F' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Bell className="w-7 h-7" />
                <h1 className="text-3xl font-bold">Notificações</h1>
              </div>
              <p className="text-red-100 text-base">
                Mantenha-se atualizado sobre tudo que acontece na plataforma
              </p>
            </div>
            {naoLidas > 0 && (
              <Badge className="bg-white text-red-600 text-base px-3 py-1.5">
                {naoLidas} {naoLidas === 1 ? 'nova' : 'novas'}
              </Badge>
            )}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-slate-900">Todas as Notificações</h2>
          {naoLidas > 0 && (
            <Button
              onClick={marcarTodasLidas}
              variant="outline"
              className="text-red-600 hover:text-red-700 text-sm py-1.5 h-auto"
            >
              <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
              Marcar todas como lidas
            </Button>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => (
              <Card key={i}><CardContent className="p-3"><div className="h-10 bg-slate-100 rounded animate-pulse" /></CardContent></Card>
            ))}
          </div>
        ) : notificacoes.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-600 mb-1">Nenhuma notificação</h3>
            <p className="text-sm text-slate-500">Você está em dia! Não há notificações novas.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notificacoes.map((n) => {
              const { icon, color } = tipoParaIcone(n.tipo);
              return (
                <Card
                  key={n.id}
                  className={`transition-all hover:shadow-md ${!n.lida ? 'border-l-4 border-l-red-600 bg-red-50/30' : ''}`}
                  onClick={() => !n.lida && marcarLida(n.id)}
                  style={{ cursor: !n.lida ? 'pointer' : 'default' }}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className={`${color} rounded-full p-2 text-white flex-shrink-0`}>
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-0.5">
                          <h3 className={`text-sm text-slate-900 ${!n.lida ? 'font-semibold' : 'font-medium'}`}>
                            {n.titulo ?? n.tipo}
                          </h3>
                          <div className="flex items-center gap-2">
                            {!n.lida && (
                              <span className="w-1.5 h-1.5 bg-red-600 rounded-full flex-shrink-0 mt-1"></span>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); void apagar(n.id); }}
                              className="text-slate-300 hover:text-red-500 transition-colors"
                              title="Apagar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-slate-600 text-xs mb-1 line-clamp-2">{n.mensagem}</p>
                        <span className="text-xs text-slate-400">{tempoRelativo(n.criada_em)}</span>
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
