import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router';
import {
  BookOpen, LogIn, UserPlus, Mail, Lock, User,
  AlertCircle, MapPin, GraduationCap, Book, CheckCircle2, Loader2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from '../components/ui/card';

/* ── Dados estáticos ─────────────────────────────────────────────────────── */
const provinces = [
  'Luanda','Benguela','Huambo','Cabinda','Huíla','Lunda Norte',
  'Lunda Sul','Zaire','Namibe','Cuando Cubango','Bié','Moxico',
  'Malanje','Uíge','Cuanza Norte','Cuanza Sul','Bengo','Cunene',
];
const institutions = [
  'ISPTEC - Instituto Superior Politécnico de Tecnologias e Ciências',
  'Universidade Agostinho Neto','Universidade Católica de Angola',
  'Universidade Metodista de Angola','Universidade Lusíada de Angola',
  'Universidade Independente de Angola','Universidade Jean Piaget de Angola',
  'Universidade Gregório Semedo','Universidade Privada de Angola',
  'Universidade Técnica de Angola',
  'Instituto Superior de Ciências Sociais e Relações Internacionais',
  'Instituto Superior Politécnico do Cazenga',
  'Instituto Superior de Ciências da Educação',
  'Instituto Superior de Gestão e Tecnologia',
  'Instituto Superior de Ciências Económicas e Empresariais',
  'Escola Superior de Hotelaria e Turismo',
  'Instituto Médio de Economia de Luanda',
  'Instituto Superior de Tecnologias de Informação e Comunicação',
  'Outra',
];
const courses = [
  'Economia','Gestão de Empresas','Engenharia Informática','Engenharia Civil',
  'Engenharia Industrial','Direito','Medicina','Enfermagem',
  'Ciências da Educação','Psicologia','Relações Internacionais','Jornalismo',
  'Marketing','Contabilidade','Administração Pública','Arquitetura',
  'Geologia','Petróleo e Gás','Agricultura','Turismo','Outro',
];

/* ── Componente de campo reutilizável ────────────────────────────────────── */
function Field({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
      {children}
    </div>
  );
}

const inputCls =
  'w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg ' +
  'focus:ring-2 focus:ring-[#800020] focus:border-transparent ' +
  'transition-all duration-200 bg-white cursor-text ' +
  'hover:border-slate-400';

/* ── Página de Login / Registo ───────────────────────────────────────────── */
export default function Login() {
  const [isLogin,     setIsLogin]     = useState(true);
  const [name,        setName]        = useState('');
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [province,    setProvince]    = useState('Luanda');
  const [institution, setInstitution] = useState('');
  const [course,      setCourse]      = useState('');
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');
  const [loading,     setLoading]     = useState(false);

  /* animação de entrada da página */
  const [pageIn,  setPageIn]  = useState(false);
  const [pageOut, setPageOut] = useState(false);
  useEffect(() => { const t = setTimeout(() => setPageIn(true), 40); return () => clearTimeout(t); }, []);

  /* animação de slide entre Login ↔ Registo */
  const [slide,    setSlide]    = useState<'idle'|'out'|'in'>('idle');
  const [goingTo,  setGoingTo]  = useState<boolean>(true); // true = login
  const switchTimer = useRef<ReturnType<typeof setTimeout>>();

  const { login, register } = useAuth();
  const navigate = useNavigate();

  /* navegar com transição de saída */
  const navigateWithTransition = (to: string) => {
    setPageOut(true);
    setTimeout(() => navigate(to), 380);
  };

  const switchMode = (toLogin?: boolean) => {
    const target = toLogin !== undefined ? toLogin : !isLogin;
    if (target === isLogin) return;
    setError(''); setSuccess('');
    setGoingTo(target);
    setSlide('out');
    switchTimer.current = setTimeout(() => {
      setIsLogin(target);
      setSlide('in');
      setTimeout(() => setSlide('idle'), 300);
    }, 220);
  };
  useEffect(() => () => { if (switchTimer.current) clearTimeout(switchTimer.current); }, []);

  /* estilos do slide */
  const slideStyle = (): React.CSSProperties => {
    const dir = goingTo ? -1 : 1; // login ← direita; registo → esquerda
    if (slide === 'out') return { opacity: 0, transform: `translateX(${dir * 40}px)`,   transition: 'opacity .22s ease, transform .22s ease' };
    if (slide === 'in')  return { opacity: 0, transform: `translateX(${dir * -40}px)`,  transition: 'none' };
    return                       { opacity: 1, transform: 'translateX(0)',               transition: 'opacity .28s ease, transform .28s ease' };
  };

  /* submit */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      if (isLogin) {
        const ok = await login(email, password);
        if (ok) {
          const pendingInvite = sessionStorage.getItem('pendingInviteCode');
          if (pendingInvite) {
            sessionStorage.removeItem('pendingInviteCode');
            navigateWithTransition(`/entrar-convite?codigo=${pendingInvite}`);
          } else {
            const cu = localStorage.getItem('currentUser');
            navigateWithTransition(cu && JSON.parse(cu)?.isAdmin ? '/admin' : '/');
          }
        } else {
          setError('Email ou palavra-passe incorretos');
        }
      } else {
        if (!name.trim())  { setError('Por favor, insira o seu nome');          setLoading(false); return; }
        if (!institution)  { setError('Por favor, selecione a sua instituição'); setLoading(false); return; }
        if (!course)       { setError('Por favor, selecione o seu curso');       setLoading(false); return; }
        const ok = await register(name, email, password, province, institution, course);
        if (ok) {
          setSuccess('Conta criada com sucesso! A entrar na plataforma…');
          setName(''); setPassword(''); setInstitution(''); setCourse('');
          const pendingInvite = sessionStorage.getItem('pendingInviteCode');
          if (pendingInvite) {
            sessionStorage.removeItem('pendingInviteCode');
            setTimeout(() => navigateWithTransition(`/entrar-convite?codigo=${pendingInvite}`), 1800);
          } else {
            setTimeout(() => navigateWithTransition('/'), 1800);
          }
        } else {
          setError('Este email já está registado');
        }
      }
    } catch {
      setError('Ocorreu um erro. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes fadeDown  { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeUp    { from { opacity:0; transform:translateY( 8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulse-bar { 0%,100%{opacity:.6} 50%{opacity:1} }
        .anim-fade-down { animation: fadeDown .3s ease forwards; }
        .anim-fade-up   { animation: fadeUp  .3s ease forwards; }
      `}</style>

      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          background: 'linear-gradient(135deg,#fff 60%,#fff5f5 100%)',
          opacity:    pageOut ? 0 : pageIn ? 1 : 0,
          transform:  pageOut ? 'translateY(-16px) scale(0.98)' : pageIn ? 'translateY(0)' : 'translateY(20px)',
          transition: pageOut
            ? 'opacity .35s ease, transform .35s ease'
            : 'opacity .45s ease, transform .45s ease',
        }}
      >
        <div className="w-full max-w-md">

          {/* Logo */}
          <Link to="/" className="flex items-center justify-center space-x-3 mb-8 cursor-pointer group">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105"
              style={{ background: 'linear-gradient(135deg,#800020,#8B0000)' }}
            >
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-slate-800">Economia com História</h1>
              <p className="text-sm text-slate-500">Angola</p>
            </div>
          </Link>

          {/* Card */}
          <Card className="border-slate-200 shadow-2xl overflow-hidden">

            {/* Barra de progresso no topo enquanto carrega */}
            {loading && (
              <div className="h-1 w-full" style={{ background:'#f1f5f9' }}>
                <div
                  className="h-1"
                  style={{
                    background: 'linear-gradient(90deg,#800020,#A0002A)',
                    width: '60%',
                    animation: 'pulse-bar 1s ease infinite',
                    borderRadius: 4,
                  }}
                />
              </div>
            )}

            {/* Abas Login / Criar Conta */}
            <div className="flex border-b border-slate-100">
              {(['login','register'] as const).map(tab => {
                const active = (tab === 'login') === isLogin;
                return (
                  <button
                    key={tab}
                    onClick={() => switchMode(tab === 'login')}
                    className="flex-1 py-3 text-sm font-medium transition-all duration-200 cursor-pointer hover:bg-slate-50"
                    style={{
                      color:       active ? '#800020' : '#94a3b8',
                      borderBottom: active ? '2px solid #800020' : '2px solid transparent',
                      background:  'transparent',
                    }}
                  >
                    {tab === 'login' ? 'Entrar' : 'Criar Conta'}
                  </button>
                );
              })}
            </div>

            <CardHeader className="space-y-1 pb-2">
              <CardTitle className="text-xl text-center" style={{ color:'#800020' }}>
                {isLogin ? 'Bem-vindo de volta' : 'Crie a sua conta'}
              </CardTitle>
              <CardDescription className="text-center text-slate-500 text-sm">
                {isLogin
                  ? 'Aceda à plataforma educativa'
                  : 'Registe-se para começar a sua jornada de aprendizagem'}
              </CardDescription>
            </CardHeader>

            <CardContent>

              {/* Toast de sucesso */}
              {success && (
                <div className="anim-fade-down flex items-center gap-3 text-green-700 bg-green-50 border border-green-200 p-4 rounded-lg mb-4">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-green-500" />
                  <p className="text-sm font-medium">{success}</p>
                </div>
              )}

              {/* Formulário com slide */}
              <div style={slideStyle()}>
                <form onSubmit={handleSubmit} className="space-y-4">

                  {!isLogin && (
                    <>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Nome Completo</label>
                        <Field icon={User}>
                          <input type="text" value={name} onChange={e => setName(e.target.value)}
                            className={inputCls} placeholder="Digite o seu nome" required={!isLogin} />
                        </Field>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Província</label>
                        <Field icon={MapPin}>
                          <select value={province} onChange={e => setProvince(e.target.value)}
                            className={inputCls + ' appearance-none cursor-pointer'} required={!isLogin}>
                            {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </Field>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Instituição</label>
                        <Field icon={GraduationCap}>
                          <select value={institution} onChange={e => setInstitution(e.target.value)}
                            className={inputCls + ' appearance-none cursor-pointer'} required={!isLogin}>
                            <option value="">Selecione a instituição</option>
                            {institutions.map(i => <option key={i} value={i}>{i}</option>)}
                          </select>
                        </Field>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Curso</label>
                        <Field icon={Book}>
                          <select value={course} onChange={e => setCourse(e.target.value)}
                            className={inputCls + ' appearance-none cursor-pointer'} required={!isLogin}>
                            <option value="">Selecione o curso</option>
                            {courses.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </Field>
                      </div>
                    </>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</label>
                    <Field icon={Mail}>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                        className={inputCls} placeholder="seu.email@exemplo.com" required />
                    </Field>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Palavra-passe</label>
                    <Field icon={Lock}>
                      <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                        className={inputCls} placeholder="••••••••" required minLength={6} />
                    </Field>
                    {isLogin && (
                      <div className="flex justify-end pt-1">
                        <Link
                          to="/recuperar-senha"
                          className="text-xs text-[#800020] hover:text-[#8B0000] hover:underline font-medium transition-colors cursor-pointer"
                          tabIndex={-1}
                        >
                          Esqueceu a senha?
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Erro */}
                  {error && (
                    <div className="anim-fade-up flex items-center gap-2 text-[#800020] bg-[#FFF2F2] border border-[#FDD5D5] p-3 rounded-lg">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <p className="text-sm">{error}</p>
                    </div>
                  )}

                  {/* Botão */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full text-white font-semibold py-2.5 rounded-lg transition-all duration-200 hover:shadow-lg hover:brightness-110 active:scale-95"
                    style={{ background: 'linear-gradient(135deg,#800020,#8B0000)' }}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> A processar…
                      </span>
                    ) : isLogin ? (
                      <span className="flex items-center justify-center gap-2">
                        <LogIn className="w-4 h-4" /> Entrar na Plataforma
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <UserPlus className="w-4 h-4" /> Criar Conta
                      </span>
                    )}
                  </Button>
                </form>

                <div className="mt-6 pt-5 border-t border-slate-100">
                  <p className="text-xs text-center text-slate-400">
                    Ao continuar, concorda com os termos de uso e política de privacidade da plataforma
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-5 text-center">
            <Link to="/" className="text-sm text-slate-500 hover:text-slate-800 transition-colors">
              ← Voltar à página inicial
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
