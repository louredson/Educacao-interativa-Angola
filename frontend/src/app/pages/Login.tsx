import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { BookOpen, LogIn, UserPlus, Mail, Lock, User, AlertCircle, MapPin, GraduationCap, Book, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [province, setProvince] = useState('Luanda');
  const [institution, setInstitution] = useState('');
  const [course, setCourse] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [formVisible, setFormVisible] = useState(true);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  // Animação de entrada da página
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const provinces = [
    'Luanda', 'Benguela', 'Huambo', 'Cabinda', 'Huíla', 'Lunda Norte',
    'Lunda Sul', 'Zaire', 'Namibe', 'Cuando Cubango', 'Bié', 'Moxico',
    'Malanje', 'Uíge', 'Cuanza Norte', 'Cuanza Sul', 'Bengo', 'Cunene'
  ];

  const institutions = [
    'ISPTEC - Instituto Superior Politécnico de Tecnologias e Ciências',
    'Universidade Agostinho Neto',
    'Universidade Católica de Angola',
    'Universidade Metodista de Angola',
    'Universidade Lusíada de Angola',
    'Universidade Independente de Angola',
    'Universidade Jean Piaget de Angola',
    'Universidade Gregório Semedo',
    'Universidade Privada de Angola',
    'Universidade Técnica de Angola',
    'Instituto Superior de Ciências Sociais e Relações Internacionais',
    'Instituto Superior Politécnico do Cazenga',
    'Instituto Superior de Ciências da Educação',
    'Instituto Superior de Gestão e Tecnologia',
    'Instituto Superior de Ciências Económicas e Empresariais',
    'Escola Superior de Hotelaria e Turismo',
    'Instituto Médio de Economia de Luanda',
    'Instituto Superior de Tecnologias de Informação e Comunicação',
    'Outra'
  ];

  const courses = [
    'Economia', 'Gestão de Empresas', 'Engenharia Informática', 'Engenharia Civil',
    'Engenharia Industrial', 'Direito', 'Medicina', 'Enfermagem',
    'Ciências da Educação', 'Psicologia', 'Relações Internacionais', 'Jornalismo',
    'Marketing', 'Contabilidade', 'Administração Pública', 'Arquitetura',
    'Geologia', 'Petróleo e Gás', 'Agricultura', 'Turismo', 'Outro'
  ];

  // Troca suave entre Login e Registo
  const switchMode = () => {
    setFormVisible(false);
    setError('');
    setSuccess('');
    setTimeout(() => {
      setIsLogin(prev => !prev);
      setFormVisible(true);
    }, 200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLogin) {
        const ok = await login(email, password);
        if (ok) {
          const savedUser = localStorage.getItem('currentUser');
          const currentUser = savedUser ? JSON.parse(savedUser) : null;
          navigate(currentUser?.isAdmin ? '/admin' : '/');
        } else {
          setError('Email ou palavra-passe incorretos');
        }
      } else {
        if (!name.trim()) { setError('Por favor, insira o seu nome'); setLoading(false); return; }
        if (!institution)  { setError('Por favor, selecione a sua instituição'); setLoading(false); return; }
        if (!course)       { setError('Por favor, selecione o seu curso'); setLoading(false); return; }

        const ok = await register(name, email, password, province, institution, course);
        if (ok) {
          setSuccess('Conta criada com sucesso! Faça login para continuar.');
          setName('');
          setPassword('');
          setInstitution('');
          setCourse('');
          setTimeout(() => switchMode(), 2500);
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
    <div
      className="min-h-screen bg-white flex items-center justify-center p-4"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
      }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center space-x-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-[#C1121F] to-[#8B0000] rounded-lg flex items-center justify-center shadow-md">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl text-slate-800">Economia com História</h1>
            <p className="text-sm text-slate-500">Angola</p>
          </div>
        </Link>

        <Card className="border-slate-200 shadow-xl overflow-hidden">
          <CardHeader className="space-y-1">
            <CardTitle
              className="text-2xl text-center"
              style={{
                color: '#C1121F',
                opacity: formVisible ? 1 : 0,
                transform: formVisible ? 'translateY(0)' : 'translateY(-8px)',
                transition: 'opacity 0.2s ease, transform 0.2s ease',
              }}
            >
              {isLogin ? 'Entrar na Plataforma' : 'Criar Conta'}
            </CardTitle>
            <CardDescription className="text-center text-slate-600">
              {isLogin
                ? 'Aceda à plataforma educativa'
                : 'Registe-se para começar a sua jornada de aprendizagem'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Mensagem de sucesso */}
            {success && (
              <div
                className="flex items-center space-x-3 text-green-700 bg-green-50 border border-green-200 p-4 rounded-lg mb-4"
                style={{ animation: 'fadeSlideIn 0.3s ease' }}
              >
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-green-500" />
                <p className="text-sm font-medium">{success}</p>
              </div>
            )}

            <div
              style={{
                opacity: formVisible ? 1 : 0,
                transform: formVisible ? 'translateY(0)' : 'translateY(10px)',
                transition: 'opacity 0.2s ease, transform 0.2s ease',
              }}
            >
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <>
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium text-slate-700">Nome Completo</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          id="name" type="text" value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#C1121F] focus:border-transparent transition-shadow"
                          placeholder="Digite o seu nome" required={!isLogin}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="province" className="text-sm font-medium text-slate-700">Província</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <select
                          id="province" value={province}
                          onChange={(e) => setProvince(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#C1121F] focus:border-transparent appearance-none bg-white transition-shadow"
                          required={!isLogin}
                        >
                          {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="institution" className="text-sm font-medium text-slate-700">Universidade/Instituição</label>
                      <div className="relative">
                        <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <select
                          id="institution" value={institution}
                          onChange={(e) => setInstitution(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#C1121F] focus:border-transparent appearance-none bg-white transition-shadow"
                          required={!isLogin}
                        >
                          <option value="">Selecione a instituição</option>
                          {institutions.map(i => <option key={i} value={i}>{i}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="course" className="text-sm font-medium text-slate-700">Curso</label>
                      <div className="relative">
                        <Book className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <select
                          id="course" value={course}
                          onChange={(e) => setCourse(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#C1121F] focus:border-transparent appearance-none bg-white transition-shadow"
                          required={!isLogin}
                        >
                          <option value="">Selecione o curso</option>
                          {courses.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-slate-700">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="email" type="email" value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#C1121F] focus:border-transparent transition-shadow"
                      placeholder="seu.email@exemplo.com" required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-slate-700">Palavra-passe</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="password" type="password" value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#C1121F] focus:border-transparent transition-shadow"
                      placeholder="••••••••" required minLength={6}
                    />
                  </div>
                </div>

                {error && (
                  <div
                    className="flex items-center space-x-2 text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg"
                    style={{ animation: 'fadeSlideIn 0.3s ease' }}
                  >
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full text-white transition-all duration-300 hover:shadow-lg hover:opacity-90 active:scale-95"
                  style={{ background: loading ? '#9B0E15' : '#C1121F' }}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      A processar...
                    </span>
                  ) : isLogin ? (
                    <span className="flex items-center justify-center gap-2">
                      <LogIn className="w-5 h-5" />
                      Entrar
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <UserPlus className="w-5 h-5" />
                      Criar Conta
                    </span>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={switchMode}
                  className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
                >
                  {isLogin ? (
                    <>Não tem conta? <span style={{ color: '#C1121F' }} className="font-medium">Registe-se</span></>
                  ) : (
                    <>Já tem conta? <span style={{ color: '#C1121F' }} className="font-medium">Entre aqui</span></>
                  )}
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-200">
                <p className="text-xs text-center text-slate-500">
                  Ao continuar, concorda com os termos de uso e política de privacidade da plataforma
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-slate-600 hover:text-slate-800 transition-colors">
            ← Voltar à página inicial
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
