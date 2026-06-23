import { MapPin, TrendingUp, BarChart3, PieChart, ArrowRight, Check, X, Trophy, Medal, Award, Filter, Lock, Timer, Volume2, Landmark, Banknote, Factory, Building, Wheat, Globe, Heart, Scale, GraduationCap, ShoppingBag, Truck, Coins, Target, Users, Leaf, Sun, Cloud, Droplets, Mountain, Waves, Gem, Pickaxe, Ship, Plane, Train, Car, Bike, Bus, Home, Utensils, Wifi, Phone, Laptop, Smartphone, Tv, Watch, Camera, Video, Music, Book, Pen, Scissors, Shirt, Shoe, Ring, Gift, Cake, Coffee, Beer, Wine, Pizza, Burger, Apple, Carrot, Fish, Egg, Bread, Milk, Snowflake, Flame, Zap, Wind, Battery, Plug, Lightbulb, Settings, Tool, Wrench, Hammer, Trash, Recycle, Tree, Flower, Sprout, Seedling, Garden, Dog, Cat, Bird, Bug, Dragon, Dinosaur, Rocket, Space, Planet, Star, Moon, Rainbow, Umbrella, Compass, Map, Flag, Shield, Key, Eye, Ear, Mouth, Brain, Bone, Hand, Foot, Arm, Leg, HeartPulse, Stethoscope, Pill, Hospital, Ambulance, Fire, Police, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthPrompt from '../components/AuthPrompt';
import { apiRequest } from '../services/api';
import { shuffle } from '../utils/shuffle';
import { Link } from 'react-router';

export default function Resources() {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [activeQuiz, setActiveQuiz] = useState(null);
  // Perguntas do quiz local já baralhadas (ordem + opções) para a sessão actual
  const [localQuestions, setLocalQuestions] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState(0);
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [ranking, setRanking] = useState([]);
  const [showRanking, setShowRanking] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState('Todas');
  const [selectedInstitution, setSelectedInstitution] = useState('Todas');
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [authAction, setAuthAction] = useState('realizar esta ação');
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const timerRef = useRef(null);
  const audioContextRef = useRef(null);

  // ── Quizzes carregados da API ──────────────────────────────────────────────
  const [apiQuizzes, setApiQuizzes] = useState<any[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  // Quiz em execução via API (perguntas reais da BD)
  const [activeApiQuizId, setActiveApiQuizId] = useState<number | null>(null);
  const [apiQuizData, setApiQuizData] = useState<any>(null);
  const [apiAnswers, setApiAnswers] = useState<{pergunta_id: number; resposta_escolhida: number}[]>([]);

  useEffect(() => {
    const carregarQuizzes = async () => {
      try {
        const data = await apiRequest<any[]>('/quizzes');
        setApiQuizzes(data ?? []);
      } catch { /* silencioso */ }
      finally { setLoadingQuizzes(false); }
    };
    void carregarQuizzes();
  }, []);

  useEffect(() => {
    const carregarRanking = async () => {
      try {
        const rankingData = await apiRequest<any[]>('/ranking');
        const mapped = (rankingData ?? []).map((r: any) => ({
          name: r.nome,
          score: Number(r.pontuacao_total ?? 0),
          quizzes: Number(r.quizzes_completados ?? 0),
          province: r.provincia ?? '',
          institution: '',
        }));
        setRanking(mapped);
        if (user) {
          const pos = mapped.findIndex((r: any) =>
            r.name === ((user as any).nome ?? user.name)
          );
          if (pos >= 0) {
            setTotalScore(mapped[pos].score);
            setTotalQuizzes(mapped[pos].quizzes);
          }
        }
      } catch { /* silencioso */ }
    };
    void carregarRanking();
  }, [user]);

  const provinces = [
    'Todas', 'Luanda', 'Benguela', 'Huambo', 'Cabinda', 'Huíla', 'Lunda Norte', 
    'Lunda Sul', 'Zaire', 'Namibe', 'Cuando Cubango', 'Bié', 'Moxico',
    'Malanje', 'Uíge', 'Cuanza Norte', 'Cuanza Sul', 'Bengo', 'Cunene'
  ];

  const institutions = [
    'Todas',
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
    'Instituto Superior de Tecnologias de Informação e Comunicação'
  ];

  const loadRanking = () => { /* ranking via API no useEffect acima */ };

  // Função para tocar sons usando Web Audio API
  const playSound = (type) => {
    if (!soundEnabled) return;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      switch (type) {
        case 'correct':
          oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
          oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1);
          oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2);
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.4);
          break;

        case 'incorrect':
          oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.3);
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.3);
          break;

        case 'complete':
          oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
          oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.15);
          oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.3);
          oscillator.frequency.setValueAtTime(1046.50, audioContext.currentTime + 0.45);
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.7);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.7);
          break;

        case 'tick':
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.05);
          break;
      }
    } catch (error) {
      console.error('Erro ao tocar som:', error);
    }
  };

  // Timer effect — funciona para quizzes locais E quizzes da API
  useEffect(() => {
    const quizActivo = (activeQuiz || activeApiQuizId) && !showResult && selectedAnswer === null;
    if (quizActivo) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Timeout — chama o handler correcto
            if (activeApiQuizId) {
              handleApiAnswer(-1);
            } else {
              handleAnswer(-1);
            }
            return 30;
          }
          if (prev <= 5) {
            playSound('tick');
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [activeQuiz, activeApiQuizId, showResult, selectedAnswer, currentQuestion]);

  const updateRanking = () => {
    // Recarrega ranking da API após tentativa
    apiRequest<any[]>('/ranking').then((rankingData) => {
      const mapped = (rankingData ?? []).map((r: any) => ({
        name: r.nome,
        score: Number(r.pontuacao_total ?? 0),
        quizzes: Number(r.quizzes_completados ?? 0),
        province: r.provincia ?? '',
        institution: '',
      }));
      setRanking(mapped);
      if (user) {
        const pos = mapped.findIndex((r: any) =>
          r.name === ((user as any).nome ?? user.name)
        );
        if (pos >= 0) {
          setTotalScore(mapped[pos].score);
          setTotalQuizzes(mapped[pos].quizzes);
        }
      }
    }).catch(() => null);
  };

  const saveUserStats = () => { /* estatísticas via API */ };

  const quizzes = {
    economia: {
      title: 'Quiz de Economia',
      color: 'blue',
      icon: <TrendingUp className="w-8 h-8 text-blue-600" />,
      description: 'Teste seus conhecimentos sobre a economia angolana',
      expandedDescription: 'Explore os fundamentos da economia de Angola através de 10 perguntas desafiadoras. Este quiz aborda desde os principais produtos de exportação até indicadores macroeconómicos atuais, permitindo que você avalie e aprofunde seu conhecimento sobre o cenário económico nacional.',
      thumbnail: 'https://images.unsplash.com/photo-1734254807102-fbf62b0cc513?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwYnVzaW5lc3MlMjBwZW9wbGUlMjBlY29ub215fGVufDF8fHx8MTc3OTM3NDk0Mnww&ixlib=rb-4.1.0&q=80&w=1080',
      questions: [
        {
          question: 'Qual é o principal produto de exportação de Angola?',
          options: ['Diamantes', 'Café', 'Petróleo', 'Algodão'],
          correct: 2
        },
        {
          question: 'Que percentagem das exportações angolanas é representada pelo petróleo?',
          options: ['45%', '65%', '89%', '95%'],
          correct: 2
        },
        {
          question: 'Qual foi o ano do pico do PIB angolano?',
          options: ['2008', '2014', '2018', '2020'],
          correct: 1
        },
        {
          question: 'Qual setor representa cerca de 35% do PIB de Angola?',
          options: ['Agricultura', 'Petróleo e Gás', 'Serviços', 'Turismo'],
          correct: 1
        },
        {
          question: 'Qual é a moeda oficial de Angola?',
          options: ['Rand', 'Kwanza', 'Metical', 'Escudo'],
          correct: 1
        },
        {
          question: 'Qual província contribui com mais de 45% do PIB nacional?',
          options: ['Benguela', 'Cabinda', 'Luanda', 'Huambo'],
          correct: 2
        },
        {
          question: 'Além do petróleo, qual é outro recurso mineral importante em Angola?',
          options: ['Ouro', 'Diamantes', 'Cobre', 'Platina'],
          correct: 1
        },
        {
          question: 'Qual foi o impacto da crise do petróleo de 2014-2016?',
          options: ['Aumento do PIB', 'Estabilidade económica', 'Queda significativa do PIB', 'Crescimento da agricultura'],
          correct: 2
        },
        {
          question: 'Qual é o principal desafio económico de Angola?',
          options: ['Falta de recursos naturais', 'Dependência do petróleo', 'Excesso de diversificação', 'Baixa população'],
          correct: 1
        },
        {
          question: 'Que setor tem mostrado crescimento e representa cerca de 20% do PIB?',
          options: ['Mineração', 'Agricultura', 'Serviços', 'Turismo'],
          correct: 2
        }
      ]
    },
    historia: {
      title: 'Quiz de História',
      color: 'red',
      icon: <Landmark className="w-8 h-8 text-red-600" />,
      description: 'Explore a história económica de Angola',
      expandedDescription: 'Viaje pela história económica de Angola com 10 perguntas que abrangem desde a independência até os dias atuais. Descubra como os eventos históricos moldaram a economia nacional e teste seus conhecimentos sobre os momentos mais importantes do desenvolvimento do país.',
      thumbnail: 'https://images.unsplash.com/photo-1753892208873-3759f0734ae1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwc3R1ZGVudHMlMjBsZWFybmluZyUyMGhpc3Rvcnl8ZW58MXx8fHwxNzc5Mzc0OTY1fDA&ixlib=rb-4.1.0&q=80&w=1080',
      questions: [
        {
          question: 'Em que ano Angola conquistou a independência?',
          options: ['1973', '1975', '1980', '1991'],
          correct: 1
        },
        {
          question: 'Quanto tempo durou a guerra civil angolana?',
          options: ['10 anos', '17 anos', '27 anos', '35 anos'],
          correct: 2
        },
        {
          question: 'Em que ano terminou a guerra civil em Angola?',
          options: ['1998', '2000', '2002', '2005'],
          correct: 2
        },
        {
          question: 'Qual país colonizou Angola?',
          options: ['França', 'Inglaterra', 'Espanha', 'Portugal'],
          correct: 3
        },
        {
          question: 'Qual foi o primeiro presidente de Angola independente?',
          options: ['José Eduardo dos Santos', 'Agostinho Neto', 'Jonas Savimbi', 'João Lourenço'],
          correct: 1
        },
        {
          question: 'O que aconteceu com a economia angolana logo após a independência?',
          options: ['Crescimento rápido', 'Estabilidade total', 'Declínio devido à guerra', 'Industrialização massiva'],
          correct: 2
        },
        {
          question: 'Qual recurso impulsionou a economia no pós-guerra (após 2002)?',
          options: ['Agricultura', 'Turismo', 'Petróleo', 'Tecnologia'],
          correct: 2
        },
        {
          question: 'Em que década Angola viveu o boom económico?',
          options: ['1990-2000', '2000-2010', '2010-2020', '2020-2030'],
          correct: 1
        },
        {
          question: 'Qual foi o impacto histórico da descoberta de petróleo em Angola?',
          options: ['Nenhum impacto', 'Transformou a economia', 'Causou declínio', 'Gerou conflitos apenas'],
          correct: 1
        },
        {
          question: 'Que acordo pôs fim à guerra civil em 2002?',
          options: ['Acordo de Lusaka', 'Memorando de Luena', 'Tratado de Bicesse', 'Acordo de Gbadolite'],
          correct: 1
        }
      ]
    },
    provincial: {
      title: 'Quiz Provincial',
      color: 'green',
      icon: <MapPin className="w-8 h-8 text-green-600" />,
      description: 'Teste seus conhecimentos sobre as 18 províncias',
      expandedDescription: 'Conheça melhor as 18 províncias de Angola através de 10 perguntas interativas. Este quiz aborda capitais, características económicas, recursos naturais e curiosidades de cada região, ajudando você a entender a diversidade territorial do país.',
      thumbnail: 'https://images.unsplash.com/photo-1602516818688-715dfc1b77d5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBbmdvbGElMjBsYW5kc2NhcGUlMjBwcm92aW5jZXMlMjBBZnJpY2F8ZW58MXx8fHwxNzc5Mzc0OTcwfDA&ixlib=rb-4.1.0&q=80&w=1080',
      questions: [
        {
          question: 'Quantas províncias tem Angola?',
          options: ['15', '16', '18', '20'],
          correct: 2
        },
        {
          question: 'Qual é a capital de Angola?',
          options: ['Benguela', 'Lubango', 'Luanda', 'Huambo'],
          correct: 2
        },
        {
          question: 'Qual província é conhecida como o "celeiro de Angola"?',
          options: ['Huambo', 'Benguela', 'Malanje', 'Bié'],
          correct: 0
        },
        {
          question: 'Qual província é um enclave separado do resto de Angola?',
          options: ['Zaire', 'Cabinda', 'Cunene', 'Moxico'],
          correct: 1
        },
        {
          question: 'Que província é famosa pela produção de diamantes?',
          options: ['Huíla', 'Lunda Norte', 'Namibe', 'Cuando Cubango'],
          correct: 1
        },
        {
          question: 'Qual é o principal porto de Angola além de Luanda?',
          options: ['Porto de Benguela', 'Porto de Cabinda', 'Porto do Namibe', 'Porto do Lobito'],
          correct: 3
        },
        {
          question: 'Qual província tem a maior concentração de petróleo?',
          options: ['Luanda', 'Cabinda', 'Benguela', 'Zaire'],
          correct: 1
        },
        {
          question: 'Que província abriga a famosa Serra da Leba?',
          options: ['Cunene', 'Namibe', 'Huíla', 'Benguela'],
          correct: 2
        },
        {
          question: 'Qual é a maior província de Angola em área?',
          options: ['Moxico', 'Cuando Cubango', 'Lunda Sul', 'Cunene'],
          correct: 0
        },
        {
          question: 'Qual província é conhecida pela pesca e indústria pesqueira?',
          options: ['Huíla', 'Malanje', 'Namibe', 'Bié'],
          correct: 2
        }
      ]
    },
    macroeconomia: {
      title: 'Macroeconomia Angolana',
      color: 'purple',
      icon: <PieChart className="w-8 h-8 text-purple-600" />,
      description: 'Conceitos fundamentais da macroeconomia',
      expandedDescription: 'Aprofunde-se nos conceitos macroeconómicos aplicados à realidade angolana. Este quiz de 10 perguntas cobre indicadores como PIB, inflação, taxas de juros e políticas económicas, oferecendo uma visão abrangente da economia nacional.',
      thumbnail: 'https://images.unsplash.com/photo-1643962579745-bcaa05ffc573?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwZWNvbm9taXN0cyUyMGRhdGElMjBjaGFydHMlMjBhbmFseXNpc3xlbnwxfHx8fDE3NzkzNzQ5NzV8MA&ixlib=rb-4.1.0&q=80&w=1080',
      questions: [
        {
          question: 'O que é o PIB (Produto Interno Bruto)?',
          options: ['Soma de todas as importações', 'Valor total de bens e serviços produzidos no país', 'Total de impostos arrecadados', 'Soma das exportações líquidas'],
          correct: 1
        },
        {
          question: 'Qual é o principal índice de inflação medido em Angola?',
          options: ['IPCA (Índice de Preços ao Consumidor Amplo)', 'IGP (Índice Geral de Preços)', 'INPC (Índice Nacional de Preços ao Consumidor)', 'IPC (Índice de Preços ao Consumidor)'],
          correct: 0
        },
        {
          question: 'O que causa a inflação de demanda?',
          options: ['Redução da oferta de produtos', 'Aumento da produção', 'Aumento da procura superior à oferta', 'Diminuição do poder de compra'],
          correct: 2
        },
        {
          question: 'O que é o multiplicador Keynesiano?',
          options: ['Efeito do aumento da poupança na economia', 'Impacto do aumento do investimento no PIB', 'Relação entre inflação e desemprego', 'Taxa de câmbio ajustada'],
          correct: 1
        },
        {
          question: 'O que é a Curva de Phillips?',
          options: ['Relação inversa entre inflação e desemprego', 'Relação direta entre inflação e crescimento', 'Relação entre juros e investimento', 'Relação entre câmbio e exportações'],
          correct: 0
        },
        {
          question: 'O que significa "Dívida Pública" em Angola?',
          options: ['Dívida das empresas privadas', 'Dívida contraída pelo Estado angolano', 'Dívida dos bancos comerciais', 'Dívida externa apenas'],
          correct: 1
        },
        {
          question: 'O que é a Taxa de Câmbio Nominal?',
          options: ['Preço do Kwanza em relação ao Dólar', 'Poder de compra da moeda', 'Taxa de juros ajustada', 'Preço dos bens importados'],
          correct: 0
        },
        {
          question: 'O que é o défice fiscal?',
          options: ['Excesso de arrecadação sobre despesas', 'Excesso de despesas sobre arrecadação', 'Balança comercial positiva', 'Superávit primário'],
          correct: 1
        },
        {
          question: 'O que é a Taxa Básica de Juros do BNA?',
          options: ['Taxa cobrada entre bancos', 'Taxa para empréstimos ao consumidor', 'Taxa de referência para operações do banco central', 'Taxa para depósitos bancários'],
          correct: 2
        },
        {
          question: 'O que é a Balança de Pagamentos?',
          options: ['Registro das transações comerciais', 'Registro de todas as transações internacionais do país', 'Registro das reservas internacionais', 'Registro das dívidas externas'],
          correct: 1
        }
      ]
    },
    politicasEconomicas: {
      title: 'Políticas Económicas',
      color: 'indigo',
      icon: <Banknote className="w-8 h-8 text-indigo-600" />,
      description: 'Política monetária, fiscal e cambial',
      expandedDescription: 'Entenda como as políticas monetária, fiscal e cambial influenciam a economia angolana. Com 10 perguntas, este quiz aborda instrumentos de política económica, instituições reguladoras e estratégias de desenvolvimento adotadas no país.',
      thumbnail: 'https://images.unsplash.com/photo-1779357807569-18d3df9df645?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwZ292ZXJubWVudCUyMHBvbGljeSUyMGVjb25vbXklMjBvZmZpY2lhbHMlMjBtZWV0aW5nfGVufDF8fHx8MTc3OTM4NzkzMHww&ixlib=rb-4.1.0&q=80&w=1080',
      questions: [
        {
          question: 'O que é uma Política Monetária Expansiva?',
          options: ['Redução da base monetária', 'Aumento da oferta de moeda', 'Aumento da taxa de juros', 'Redução dos gastos públicos'],
          correct: 1
        },
        {
          question: 'Quem executa a Política Monetária em Angola?',
          options: ['Ministério das Finanças', 'Banco Nacional de Angola (BNA)', 'Assembleia Nacional', 'Banco Africano de Desenvolvimento'],
          correct: 1
        },
        {
          question: 'O que é a Política Fiscal Contracionista?',
          options: ['Aumento de impostos e redução de gastos', 'Redução de impostos e aumento de gastos', 'Aumento da base monetária', 'Redução da taxa de câmbio'],
          correct: 0
        },
        {
          question: 'O que significa "Carga Fiscal"?',
          options: ['Total de impostos pagos em relação ao PIB', 'Número de impostos existentes', 'Multas por atraso no pagamento', 'Incentivos fiscais concedidos'],
          correct: 0
        },
        {
          question: 'O que é o Orçamento Geral do Estado (OGE)?',
          options: ['Previsão anual de receitas e despesas do governo', 'Relatório do banco central', 'Plano de desenvolvimento nacional', 'Lei das finanças públicas'],
          correct: 0
        },
        {
          question: 'O que é um subsídio governamental?',
          options: ['Apoio financeiro do governo a setores específicos', 'Imposto extra sobre produtos', 'Multa por descumprimento fiscal', 'Taxa de importação'],
          correct: 0
        },
        {
          question: 'O que é a Dívida Externa de Angola?',
          options: ['Dívida com organizações internacionais', 'Dívida com credores estrangeiros', 'Dívida das empresas angolanas', 'Dívida dos cidadãos'],
          correct: 1
        },
        {
          question: 'O que é o Programa de Financiamento do FMI?',
          options: ['Empréstimo para projetos específicos', 'Apoio financeiro com condicionalidades', 'Doação para desenvolvimento', 'Investimento em infraestrutura'],
          correct: 1
        },
        {
          question: 'O que é a Diversificação Económica?',
          options: ['Aumento da dependência do petróleo', 'Redução da participação de múltiplos setores', 'Expansão de diferentes setores produtivos', 'Centralização da produção'],
          correct: 2
        },
        {
          question: 'O que é o Investimento Estrangeiro Direto (IED)?',
          options: ['Investimento em ações internacionais', 'Investimento de não residentes em empresas angolanas', 'Empréstimos internacionais', 'Doações externas'],
          correct: 1
        }
      ]
    },
    economiaPetrolifera: {
      title: 'Economia Petrolífera',
      color: 'orange',
      icon: <Factory className="w-8 h-8 text-orange-600" />,
      description: 'Indústria do petróleo em Angola',
      expandedDescription: 'Descubra os detalhes da indústria petrolífera angolana com 10 perguntas abrangentes. Este quiz explora desde a descoberta do petróleo até os acordos internacionais, contratos de partilha e o papel da SONANGOL na economia nacional.',
      thumbnail: 'https://images.unsplash.com/photo-1660448076231-6da14185d036?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvaWwlMjByZWZpbmVyeSUyMHBldHJvbGV1bSUyMGluZHVzdHJ5JTIwZmFjdG9yeSUyMGVuZXJneXxlbnwxfHx8fDE3NzkzODc5NTB8MA&ixlib=rb-4.1.0&q=80&w=1080',
      questions: [
        {
          question: 'Em que ano foi descoberto petróleo em Angola?',
          options: ['1955', '1965', '1975', '1985'],
          correct: 0
        },
        {
          question: 'O que é a "OPEP" (Organização dos Países Exportadores de Petróleo)?',
          options: ['Organização ambiental', 'Cartel de países produtores de petróleo', 'Agência de energia renovável', 'Fundo de desenvolvimento'],
          correct: 1
        },
        {
          question: 'Angola ingressou na OPEP em que ano?',
          options: ['2005', '2007', '2010', '2015'],
          correct: 1
        },
        {
          question: 'O que é "Pré-sal" na indústria petrolífera?',
          options: ['Petróleo extraído antes da salinização', 'Reservas profundas abaixo da camada de sal', 'Petróleo refinado', 'Petróleo de superfície'],
          correct: 1
        },
        {
          question: 'O que é a "Lei da Partilha de Produção" em Angola?',
          options: ['Divisão igual do petróleo', 'Modelo de contrato onde o Estado participa da produção', 'Imposto sobre exportação', 'Regulamentação ambiental'],
          correct: 1
        },
        {
          question: 'Qual é a principal refinaria de petróleo em Angola?',
          options: ['Refinaria de Cabinda', 'Refinaria de Luanda', 'Refinaria do Lobito', 'Refinaria de Soyo'],
          correct: 1
        },
        {
          question: 'O que é o "Bloco 15" em Angola?',
          options: ['Zona de pesca', 'Bloco de exploração petrolífera offshore', 'Área de conservação', 'Zona económica exclusiva'],
          correct: 1
        },
        {
          question: 'O que é a "SONANGOL"?',
          options: ['Empresa de telecomunicações', 'Empresa nacional de petróleo e gás de Angola', 'Banco de desenvolvimento', 'Agência reguladora de energia'],
          correct: 1
        },
        {
          question: 'O que é "Gás Natural Liquefeito (GNL)"?',
          options: ['Gás comprimido', 'Gás natural resfriado para transporte', 'Gás de cozinha', 'Gás de xisto'],
          correct: 1
        },
        {
          question: 'O que causa a volatilidade do preço do petróleo?',
          options: ['Fatores climáticos', 'Oferta e demanda global, tensões geopolíticas', 'Custos de produção', 'Tecnologia de extração'],
          correct: 1
        }
      ]
    },
    desenvolvimentoEconomico: {
      title: 'Desenvolvimento Económico',
      color: 'teal',
      icon: <Target className="w-8 h-8 text-teal-600" />,
      description: 'Indicadores e estratégias de desenvolvimento',
      expandedDescription: 'Analise os indicadores e estratégias de desenvolvimento económico em Angola através de 10 perguntas. O quiz aborda IDH, planos nacionais de desenvolvimento, cooperação internacional e os desafios para o crescimento sustentável.',
      thumbnail: 'https://images.unsplash.com/photo-1766330301270-e4c652b1c538?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwZGV2ZWxvcG1lbnQlMjBjb25zdHJ1Y3Rpb24lMjBidWlsZGluZyUyMGluZnJhc3RydWN0dXJlfGVufDF8fHx8MTc3OTM4NzkzMXww&ixlib=rb-4.1.0&q=80&w=1080',
      questions: [
        {
          question: 'O que é o IDH (Índice de Desenvolvimento Humano)?',
          options: ['Índice de crescimento económico', 'Medida de longevidade, educação e renda', 'Índice de pobreza', 'Medida de desigualdade social'],
          correct: 1
        },
        {
          question: 'O que significa "PNUD" (Programa das Nações Unidas para o Desenvolvimento)?',
          options: ['Agência de ajuda humanitária', 'Programa da ONU para desenvolvimento', 'Fundo monetário', 'Banco mundial'],
          correct: 1
        },
        {
          question: 'O que é a Agenda 2063 da União Africana?',
          options: ['Plano de desenvolvimento para África', 'Tratado comercial', 'Acordo ambiental', 'Plano de segurança'],
          correct: 0
        },
        {
          question: 'O que são Objetivos de Desenvolvimento Sustentável (ODS)?',
          options: ['Metas da ONU para desenvolvimento global', 'Plano da UE', 'Estratégia do G20', 'Programa do FMI'],
          correct: 0
        },
        {
          question: 'O que é o "Plano de Desenvolvimento Nacional (PDN)"?',
          options: ['Plano de curto prazo', 'Plano estratégico de médio/longo prazo do governo angolano', 'Plano de emergência', 'Plano empresarial'],
          correct: 1
        },
        {
          question: 'O que é a Cooperação Internacional?',
          options: ['Conflito entre nações', 'Parceria entre países para desenvolvimento', 'Isolamento económico', 'Competição global'],
          correct: 1
        },
        {
          question: 'O que é o "Fundo Soberano de Angola" (FSDEA)?',
          options: ['Fundo de pensão', 'Fundo de investimento público para futuras gerações', 'Fundo de emergência', 'Fundo cambial'],
          correct: 1
        },
        {
          question: 'O que significa "PPP" (Parceria Público-Privada)?',
          options: ['Programa de produtividade', 'Colaboração entre governo e setor privado', 'Plano de previdência', 'Projeto piloto'],
          correct: 1
        },
        {
          question: 'O que é o "Capital Humano" na economia?',
          options: ['Máquinas e equipamentos', 'Conhecimento e habilidades da força de trabalho', 'Recursos naturais', 'Infraestrutura'],
          correct: 1
        },
        {
          question: 'O que é a "Curva de Lorenz"?',
          options: ['Medida de crescimento', 'Representação gráfica da desigualdade de renda', 'Curva de demanda', 'Curva de oferta'],
          correct: 1
        }
      ]
    },
    historiaEconomica: {
      title: 'História Económica',
      color: 'rose',
      icon: <Book className="w-8 h-8 text-rose-600" />,
      description: 'Evolução económica de Angola',
      expandedDescription: 'Acompanhe a evolução económica de Angola através dos tempos com 10 questões históricas. Este quiz percorre desde o período colonial até os desafios contemporâneos, destacando os momentos que definiram o perfil económico do país.',
      thumbnail: 'https://images.unsplash.com/photo-1620829846940-dfa49f707ac7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwaGlzdG9yaWNhbCUyMGRvY3VtZW50cyUyMGFyY2hpdmUlMjBib29rcyUyMGxpYnJhcnl8ZW58MXx8fHwxNzc5Mzg3OTMyfDA&ixlib=rb-4.1.0&q=80&w=1080',
      questions: [
        {
          question: 'Qual era a principal atividade económica durante o período colonial?',
          options: ['Indústria', 'Agricultura de subsistência', 'Comércio e extração de recursos', 'Turismo'],
          correct: 2
        },
        {
          question: 'O que foi o "Café de Angola" na década de 1970?',
          options: ['Cultura local', 'Principal produto de exportação', 'Bebida tradicional', 'Marca internacional'],
          correct: 1
        },
        {
          question: 'Como a guerra civil (1975-2002) afetou a economia?',
          options: ['Crescimento acelerado', 'Destruição de infraestrutura e êxodo rural', 'Industrialização', 'Modernização agrícola'],
          correct: 1
        },
        {
          question: 'O que foi o "Plano da SADC" para Angola pós-guerra?',
          options: ['Plano militar', 'Iniciativa de desenvolvimento e reconstrução', 'Acordo comercial', 'Programa cultural'],
          correct: 1
        },
        {
          question: 'Quando Angola começou a se beneficiar significativamente do petróleo?',
          options: ['1970s', '1980s', '1990s', '2000s'],
          correct: 3
        },
        {
          question: 'Como a crise financeira de 2008 afetou Angola?',
          options: ['Sem impacto', 'Impacto moderado devido preço do petróleo', 'Crescimento acelerado', 'Reforma radical'],
          correct: 1
        },
        {
          question: 'O que foi o "Programa de Investimento Público (PIP)" em Angola?',
          options: ['Programa de austeridade', 'Investimento em infraestrutura pós-guerra', 'Plano de privatização', 'Programa social'],
          correct: 1
        },
        {
          question: 'Qual era a importância do Caminho de Ferro de Benguela?',
          options: ['Transporte de passageiros', 'Escoamento de minérios para exportação', 'Turismo', 'Uso militar'],
          correct: 1
        },
        {
          question: 'O que motivou a "crise cambial" em Angola na década de 2010?',
          options: ['Valorização do kwanza', 'Queda do preço do petróleo', 'Aumento das exportações', 'Crescimento do PIB'],
          correct: 1
        },
        {
          question: 'O que foi a "Lei das Águas" em Angola?',
          options: ['Lei de irrigação', 'Regulamentação do uso dos recursos hídricos', 'Lei de pesca', 'Lei ambiental'],
          correct: 1
        }
      ]
    },
    direitoEconomico: {
      title: 'Direito Económico',
      color: 'cyan',
      icon: <Scale className="w-8 h-8 text-cyan-600" />,
      description: 'Legislação económica e empresarial',
      expandedDescription: 'Compreenda o arcabouço legal da economia angolana com 10 perguntas sobre direito económico. Este quiz aborda leis de investimento, regulação do mercado de capitais, Código Comercial e outras normas que estruturam a atividade empresarial no país.',
      thumbnail: 'https://images.unsplash.com/photo-1764113697577-b5899b9a339d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwbGVnYWwlMjBqdXN0aWNlJTIwbGF3JTIwY291cnQlMjBzeXN0ZW18ZW58MXx8fHwxNzc5Mzg3OTMyfDA&ixlib=rb-4.1.0&q=80&w=1080',
      questions: [
        {
          question: 'O que é a "Constituição Económica" de Angola?',
          options: ['Lei da economia', 'Princípios e normas que regem a atividade económica na Constituição', 'Código comercial', 'Lei de empresas'],
          correct: 1
        },
        {
          question: 'Qual é a principal lei que regula o investimento privado em Angola?',
          options: ['Lei de Terras', 'Lei do Investimento Privado', 'Lei Cambial', 'Lei das Sociedades'],
          correct: 1
        },
        {
          question: 'O que é o "Direito da Concorrência"?',
          options: ['Lei de monopólios', 'Normas que previnem práticas anticompetitivas', 'Lei de cartéis', 'Regulamentação de preços'],
          correct: 1
        },
        {
          question: 'O que regula a "Lei do Petróleo" em Angola?',
          options: ['Exploração e produção de petróleo', 'Preços dos combustíveis', 'Importação de petróleo', 'Refino e distribuição'],
          correct: 0
        },
        {
          question: 'Qual é a entidade reguladora do mercado de capitais em Angola?',
          options: ['BNA', 'CMC (Comissão do Mercado de Capitais)', 'Ministério das Finanças', 'SONANGOL'],
          correct: 1
        },
        {
          question: 'O que é "Contrato de Concessão"?',
          options: ['Doação de terras', 'Acordo para exploração de serviços públicos por privados', 'Licença ambiental', 'Permissão de construção'],
          correct: 1
        },
        {
          question: 'O que é o "Código Comercial Angolano"?',
          options: ['Conjunto de leis sobre atividades comerciais', 'Lei de falências', 'Registro de empresas', 'Lei de contratos'],
          correct: 0
        },
        {
          question: 'Qual é o imposto que incide sobre lucros de empresas em Angola?',
          options: ['IVA', 'Imposto Industrial', 'Imposto sobre Rendimento de Trabalho', 'Imposto de Consumo'],
          correct: 1
        },
        {
          question: 'O que é o "IVA" (Imposto sobre o Valor Acrescentado)?',
          options: ['Imposto de renda', 'Imposto sobre consumo', 'Imposto de importação', 'Imposto de exportação'],
          correct: 1
        },
        {
          question: 'O que regula a "Lei do Ambiente" em Angola?',
          options: ['Proteção ambiental e uso sustentável dos recursos', 'Poluição industrial', 'Preservação da fauna', 'Gestão de resíduos'],
          correct: 0
        }
      ]
    },
    economiaAgricola: {
      title: 'Economia Agrícola',
      color: 'emerald',
      icon: <Wheat className="w-8 h-8 text-emerald-600" />,
      description: 'Setor agrícola e desenvolvimento rural',
      expandedDescription: 'Explore o potencial agrícola de Angola com 10 perguntas sobre produção, segurança alimentar e desenvolvimento rural. Este quiz aborda as principais culturas, desafios do setor, políticas agrícolas e estratégias para o fortalecimento do campo angolano.',
      thumbnail: 'https://images.unsplash.com/photo-1758573644044-c30d09a8b06d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwYWdyaWN1bHR1cmUlMjBmYXJtaW5nJTIwcnVyYWwlMjBkZXZlbG9wbWVudHxlbnwxfHx8fDE3NzkzODc5MzN8MA&ixlib=rb-4.1.0&q=80&w=1080',
      questions: [
        {
          question: 'Qual é o principal produto agrícola de Angola?',
          options: ['Café', 'Mandioca', 'Milho', 'Banana'],
          correct: 1
        },
        {
          question: 'Que percentagem do território angolano é arável?',
          options: ['10%', '20%', '30%', 'Mais de 50%'],
          correct: 3
        },
        {
          question: 'O que é agricultura familiar?',
          options: ['Agricultura empresarial', 'Produção em pequena escala para subsistência', 'Agricultura de exportação', 'Agricultura intensiva'],
          correct: 1
        },
        {
          question: 'O que é o "Desenvolvimento Rural"?',
          options: ['Urbanização', 'Melhoria das condições de vida e económica no campo', 'Industrialização', 'Modernização das cidades'],
          correct: 1
        },
        {
          question: 'Qual é o principal fator que limita a produção agrícola em Angola?',
          options: ['Falta de terra', 'Infraestrutura e tecnologia limitadas', 'Baixa demanda', 'Excesso de produção'],
          correct: 1
        },
        {
          question: 'O que é o "Crédito Agrícola"?',
          options: ['Empréstimo para agricultores', 'Doação do governo', 'Subsídio', 'Investimento estrangeiro'],
          correct: 0
        },
        {
          question: 'O que é "Segurança Alimentar"?',
          options: ['Estocagem de alimentos', 'Acesso físico e económico a alimentos suficientes', 'Controle de preços', 'Produção de alimentos'],
          correct: 1
        },
        {
          question: 'O que causa o desperdício de alimentos pós-colheita em Angola?',
          options: ['Excesso de produção', 'Falta de armazenamento e logística adequados', 'Baixo consumo', 'Pragas'],
          correct: 1
        },
        {
          question: 'O que é a "Reforma Agrária"?',
          options: ['Mudança na legislação de terras', 'Redistribuição de terras', 'Privatização', 'Estatização'],
          correct: 1
        },
        {
          question: 'Qual é a importância do "PRODESI" (Programa de Desenvolvimento Industrial) em Angola?',
          options: ['Programa industrial', 'Apoio à produção nacional e substituição de importações', 'Programa de exportação', 'Programa de tecnologia'],
          correct: 1
        }
      ]
    },
    economiaInternacional: {
      title: 'Economia Internacional',
      color: 'violet',
      icon: <Globe className="w-8 h-8 text-violet-600" />,
      description: 'Comércio e relações internacionais',
      expandedDescription: 'Entenda a posição de Angola no cenário global com 10 perguntas sobre comércio exterior, balança comercial, blocos económicos e relações internacionais. Este quiz aborda os principais parceiros comerciais, acordos e desafios da inserção internacional angolana.',
      thumbnail: 'https://images.unsplash.com/photo-1684835163759-660be64d33fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwaW50ZXJuYXRpb25hbCUyMHRyYWRlJTIwc2hpcHBpbmclMjBwb3J0cyUyMGNvbW1lcmNlfGVufDF8fHx8MTc3OTM4NzkzNHww&ixlib=rb-4.1.0&q=80&w=1080',
      questions: [
        {
          question: 'O que é a "Balança Comercial"?',
          options: ['Exportações menos importações', 'Importações totais', 'Exportações totais', 'Dívida externa'],
          correct: 0
        },
        {
          question: 'Quais são os principais parceiros comerciais de Angola?',
          options: ['Brasil e Portugal', 'China e Índia', 'Estados Unidos e Reino Unido', 'China e União Europeia'],
          correct: 3
        },
        {
          question: 'O que é "Globalização"?',
          options: ['Isolamento económico', 'Integração económica e cultural global', 'Regionalização', 'Protecionismo'],
          correct: 1
        },
        {
          question: 'O que é a "Zona de Livre Comércio Continental Africana (ZLECA)"?',
          options: ['Acordo militar', 'Mercado único para África', 'Bloco económico regional', 'União aduaneira'],
          correct: 1
        },
        {
          question: 'O que é "Protecionismo"?',
          options: ['Abertura comercial', 'Barreiras à importação para proteger indústria local', 'Estímulo às exportações', 'Desregulamentação'],
          correct: 1
        },
        {
          question: 'O que é "Vantagem Comparativa" na economia internacional?',
          options: ['Produzir tudo internamente', 'Especializar-se no que se faz melhor', 'Proteger indústrias nascentes', 'Subsidiar exportações'],
          correct: 1
        },
        {
          question: 'O que é "Dumping" no comércio internacional?',
          options: ['Exportar a preços abaixo do custo', 'Importar a preços baixos', 'Subsidiar exportações', 'Criar barreiras tarifárias'],
          correct: 0
        },
        {
          question: 'O que é o "G7" (Grupo dos Sete)?',
          options: ['Grupo dos 7 países mais desenvolvidos', 'Organização ambiental', 'Fórum tecnológico', 'Bloco comercial'],
          correct: 0
        },
        {
          question: 'O que é o "BRICS"?',
          options: ['Organização das Nações Unidas', 'Bloco de economias emergentes (Brasil, Rússia, Índia, China, África do Sul)', 'Acordo europeu', 'Fórum asiático'],
          correct: 1
        },
        {
          question: 'O que são "Tarifas Aduaneiras"?',
          options: ['Impostos sobre importação', 'Licenças de exportação', 'Regulamentações técnicas', 'Cotação de moedas'],
          correct: 0
        }
      ]
    },
    economiaSocial: {
      title: 'Economia Social',
      color: 'pink',
      icon: <Heart className="w-8 h-8 text-pink-600" />,
      description: 'Políticas sociais e bem-estar',
      expandedDescription: 'Analise as políticas sociais e indicadores de bem-estar em Angola com 10 perguntas. Este quiz aborda programas de transferência de renda, combate à pobreza, inclusão social, saúde, educação e os desafios para reduzir desigualdades no país.',
      thumbnail: 'https://images.unsplash.com/photo-1761666519882-59ab0dbe5059?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwY29tbXVuaXR5JTIwc29jaWFsJTIwd2VsZmFyZSUyMHBlb3BsZSUyMGhlbHBpbmd8ZW58MXx8fHwxNzc5Mzg3OTM0fDA&ixlib=rb-4.1.0&q=80&w=1080',
      questions: [
        {
          question: 'O que são "Políticas Públicas" económicas?',
          options: ['Leis criadas pelo setor privado', 'Ações do governo para influenciar a economia', 'Decisões empresariais', 'Acordos internacionais'],
          correct: 1
        },
        {
          question: 'O que é a "Taxa de Desemprego"?',
          options: ['Percentual de pessoas sem trabalho e à procura', 'Número de empregos criados', 'População economicamente ativa', 'Rendimento médio'],
          correct: 0
        },
        {
          question: 'O que é o "Salário Mínimo Nacional"?',
          options: ['Salário base definido por lei', 'Média salarial', 'Salário mais alto', 'Remuneração por hora'],
          correct: 0
        },
        {
          question: 'O que são "Políticas de Inclusão Social"?',
          options: ['Medidas para reduzir desigualdades e promover acesso a serviços', 'Programas de austeridade', 'Políticas de exclusão', 'Reformas trabalhistas'],
          correct: 0
        },
        {
          question: 'O que é o "Custo de Vida"?',
          options: ['Preço da cesta básica', 'Gasto médio com alimentação', 'Valor necessário para manter padrão de vida', 'Inflação acumulada'],
          correct: 2
        },
        {
          question: 'O que é a "Pobreza Multidimensional"?',
          options: ['Pobreza de renda', 'Privações em saúde, educação e padrão de vida', 'Desigualdade regional', 'Falta de emprego'],
          correct: 1
        },
        {
          question: 'O que é "Economia Informal"?',
          options: ['Economia ilegal', 'Atividades económicas sem registro formal', 'Economia doméstica', 'Microempresas'],
          correct: 1
        },
        {
          question: 'O que é "Transferência de Renda" na política social?',
          options: ['Pagamento de salários', 'Programas como o Kwenda de transferência condicionada', 'Doações internacionais', 'Aposentadorias'],
          correct: 1
        },
        {
          question: 'O que é o "IDH Ajustado à Desigualdade"?',
          options: ['IDH corrigido pela distribuição de renda', 'IDH regional', 'IDH por gênero', 'IDH étnico'],
          correct: 0
        },
        {
          question: 'O que é a "Agenda 2030" da ONU?',
          options: ['Plano de guerra', 'Objetivos de Desenvolvimento Sustentável (ODS)', 'Tratado comercial', 'Acordo climático'],
          correct: 1
        }
      ]
    }
  };

  const startQuiz = (quizType) => {
    if (!isAuthenticated) {
      setAuthAction('participar de quizzes e ganhar pontos');
      setShowAuthPrompt(true);
      return;
    }
    // Baralha a ordem das perguntas e das opções (remapeando o índice correcto)
    // para o utilizador não decorar posições nem respostas de antemão.
    const baralhadas = shuffle(quizzes[quizType].questions).map((q: any) => {
      const opcoes = shuffle(
        q.options.map((text: string, i: number) => ({ text, correct: i === q.correct })),
      );
      return {
        question: q.question,
        options: opcoes.map((o) => o.text),
        correct: opcoes.findIndex((o) => o.correct),
      };
    });
    setLocalQuestions(baralhadas);
    setActiveQuiz(quizType);
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setTimeRemaining(30);
  };

  // Inicia quiz carregado da API
  const startApiQuiz = async (quizId: number) => {
    if (!isAuthenticated) {
      setAuthAction('participar de quizzes e ganhar pontos');
      setShowAuthPrompt(true);
      return;
    }
    try {
      const data = await apiRequest<any>(`/quizzes/${quizId}`);
      if (!data.perguntas || data.perguntas.length === 0) {
        toast.error('Este quiz ainda não tem perguntas. Aguarda que o administrador as adicione.');
        return;
      }
      // Baralha a ordem das perguntas e das opções. Cada opção guarda o seu
      // valor original (1=A,2=B,3=C,4=D) para a submissão à API continuar correcta,
      // independentemente da posição em que é apresentada.
      const perguntasBaralhadas = shuffle(data.perguntas).map((p: any) => ({
        ...p,
        opcoesBaralhadas: shuffle([
          { texto: p.opcao_a, valor: 1 },
          { texto: p.opcao_b, valor: 2 },
          { texto: p.opcao_c, valor: 3 },
          { texto: p.opcao_d, valor: 4 },
        ]),
      }));
      setApiQuizData({ ...data, perguntas: perguntasBaralhadas });
      setActiveApiQuizId(quizId);
      setApiAnswers([]);
      setCurrentQuestion(0);
      setScore(0);
      setSelectedAnswer(null);
      setShowResult(false);
      setTimeRemaining(30);
    } catch {
      toast.error('Não foi possível carregar o quiz. Tenta novamente.');
    }
  };

  // Responde pergunta num quiz da API.
  // displayIndex = posição apresentada (para destacar a opção); -1 = tempo esgotado.
  // valorOriginal = valor real da opção (1..4) usado na submissão à API.
  const handleApiAnswer = (displayIndex: number, valorOriginal?: number) => {
    if (selectedAnswer !== null || !apiQuizData) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSelectedAnswer(displayIndex);

    const pergunta = apiQuizData.perguntas[currentQuestion];
    // resposta_correta é 1-based (1=A,2=B,3=C,4=D) e só vem para staff
    const respostaEscolhida1Based = displayIndex === -1 ? 0 : (valorOriginal ?? 0);
    const correta = displayIndex !== -1 && respostaEscolhida1Based === pergunta.resposta_correta;
    if (displayIndex === -1) { playSound('incorrect'); }
    else if (correta) { playSound('correct'); setScore(s => s + 10); }
    else { playSound('incorrect'); }

    // Guarda resposta em formato 1-based para a API
    const respostaEscolhida = respostaEscolhida1Based;
    setApiAnswers(prev => [...prev, { pergunta_id: pergunta.id, resposta_escolhida: respostaEscolhida }]);

    setTimeout(async () => {
      if (currentQuestion + 1 < apiQuizData.perguntas.length) {
        setCurrentQuestion(q => q + 1);
        setSelectedAnswer(null);
        setTimeRemaining(30);
      } else {
        // Última pergunta — envia tudo para a API
        const finalAnswers = [...apiAnswers, { pergunta_id: pergunta.id, resposta_escolhida: respostaEscolhida }];
        setShowResult(true);
        playSound('complete');
        try {
          await apiRequest(`/quizzes/${activeApiQuizId}/attempt`, {
            method: 'POST',
            json: { respostas: finalAnswers },
          });
          updateRanking();
        } catch (err: any) {
          if (err?.status === 429) {
            toast.info('Já realizaste este quiz hoje. Tenta amanhã!');
          }
        }
        setTotalQuizzes(q => q + 1);
      }
    }, 1500);
  };

  const handleAnswer = (answerIndex) => {
    if (selectedAnswer !== null) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setSelectedAnswer(answerIndex);

    const isCorrect = answerIndex === localQuestions[currentQuestion]?.correct;

    if (answerIndex === -1) {
      playSound('incorrect');
    } else if (isCorrect) {
      playSound('correct');
      setScore(score + 10);
    } else {
      playSound('incorrect');
    }

    setTimeout(() => {
      if (currentQuestion + 1 < localQuestions.length) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setTimeRemaining(30);
      } else {
        setShowResult(true);
        setAnsweredQuestions(answeredQuestions + localQuestions.length);
        setTotalQuizzes(totalQuizzes + 1);
        const finalScore = isCorrect ? score + 10 : score;
        setTotalScore(totalScore + finalScore);
        playSound('complete');
        if (user) {
          updateRanking();
          saveUserStats();
        }
      }
    }, 1500);
  };

  const resetQuiz = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setActiveQuiz(null);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setTimeRemaining(30);
  };

  // ── Render: Quiz da API em execução ────────────────────────────────────────
  if (activeApiQuizId && apiQuizData && !showResult) {
    const pergunta = apiQuizData.perguntas[currentQuestion];
    const totalPerguntas = apiQuizData.perguntas.length;
    const timePercentage = (timeRemaining / 30) * 100;
    const isTimeWarning  = timeRemaining <= 10;
    const isTimeCritical = timeRemaining <= 5;
    // Opções já baralhadas (cada uma com o seu valor original 1..4)
    const opcoes = pergunta.opcoesBaralhadas ?? [
      { texto: pergunta.opcao_a, valor: 1 },
      { texto: pergunta.opcao_b, valor: 2 },
      { texto: pergunta.opcao_c, valor: 3 },
      { texto: pergunta.opcao_d, valor: 4 },
    ];

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <section className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-8 h-8" />
                <h2 className="text-3xl font-bold">{apiQuizData?.titulo ?? 'Quiz'}</h2>
              </div>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                title={soundEnabled ? 'Desativar som' : 'Ativar som'}
              >
                <Volume2 className={`w-5 h-5 ${!soundEnabled ? 'opacity-50' : ''}`} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm mb-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="text-xs opacity-75 mb-1">Pergunta</div>
                <div className="font-bold">{currentQuestion + 1} / {totalPerguntas}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="text-xs opacity-75 mb-1">Pontuação</div>
                <div className="font-bold">{score} pts</div>
              </div>
              <div className={`backdrop-blur-sm rounded-lg p-3 ${
                isTimeCritical ? 'bg-red-500/30 animate-pulse' :
                isTimeWarning  ? 'bg-yellow-500/30' :
                'bg-white/10'
              }`}>
                <div className="text-xs opacity-75 mb-1 flex items-center gap-1">
                  <Timer className="w-3 h-3" />Tempo
                </div>
                <div className={`font-bold ${isTimeCritical ? 'text-red-200' : isTimeWarning ? 'text-yellow-200' : ''}`}>
                  {timeRemaining}s
                </div>
              </div>
            </div>

            <div className="mb-3">
              <div className="text-xs opacity-75 mb-2">Progresso do Quiz</div>
              <div className="bg-white/20 rounded-full h-2">
                <div
                  className="bg-white h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestion + 1) / totalPerguntas) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="text-xs opacity-75 mb-2">Tempo Restante</div>
              <div className="bg-white/20 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all duration-1000 ${
                    isTimeCritical ? 'bg-red-400' :
                    isTimeWarning  ? 'bg-yellow-400' :
                    'bg-green-400'
                  }`}
                  style={{ width: `${timePercentage}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {selectedAnswer === -1 && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-500 rounded-lg">
              <div className="flex items-center gap-3 text-red-700">
                <Timer className="w-6 h-6" />
                <div>
                  <p className="font-bold">Tempo Esgotado!</p>
                  <p className="text-sm">Não respondeste a tempo. A pergunta foi marcada como incorreta.</p>
                </div>
              </div>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{pergunta.pergunta}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {opcoes.map((opcao, index) => {
                const isSelected   = selectedAnswer === index;
                // Compara pelo valor original da opção (resposta_correta é 1-based e só vem para staff)
                const isCorreta    = opcao.valor === pergunta.resposta_correta;
                const showCorrect  = selectedAnswer !== null && isCorreta;
                const showWrong    = selectedAnswer !== null && isSelected && !isCorreta;

                return (
                  <button
                    key={index}
                    onClick={() => handleApiAnswer(index, opcao.valor)}
                    disabled={selectedAnswer !== null}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      showCorrect ? 'border-green-500 bg-green-50' :
                      showWrong   ? 'border-red-500 bg-red-50' :
                      isSelected  ? 'bg-red-50 border-red-300' :
                      'border-slate-200 hover:border-red-300 hover:bg-red-50/30'
                    } ${selectedAnswer !== null ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 flex-shrink-0">
                          {['A','B','C','D'][index]}
                        </span>
                        <span>{opcao.texto}</span>
                      </div>
                      {showCorrect && <Check className="w-5 h-5 text-green-600 flex-shrink-0" />}
                      {showWrong   && <X     className="w-5 h-5 text-red-600 flex-shrink-0" />}
                    </div>
                  </button>
                );
              })}

              {selectedAnswer !== null && pergunta.explicacao && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium mb-1">💡 Explicação</p>
                  <p className="text-sm text-blue-700">{pergunta.explicacao}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <button
            onClick={() => {
              setActiveApiQuizId(null);
              setApiQuizData(null);
              setApiAnswers([]);
              resetQuiz();
            }}
            className="mt-6 px-6 py-2 border-2 border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancelar Quiz
          </button>
        </section>
      </div>
    );
  }

  // ── Render: Resultado do Quiz da API ──────────────────────────────────────
  if (showResult && activeApiQuizId && apiQuizData) {
    const totalPerguntas = apiQuizData.perguntas.length;
    const percentage     = totalPerguntas > 0 ? Math.round((score / (totalPerguntas * 10)) * 100) : 0;

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <section className="bg-gradient-to-r from-red-600 to-red-800 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="text-6xl mb-4">
              {percentage >= 80 ? '🏆' : percentage >= 60 ? '🎯' : percentage >= 40 ? '📚' : '💪'}
            </div>
            <h2 className="text-4xl font-bold mb-2">Quiz Concluído!</h2>
            <p className="text-red-100 text-lg">{apiQuizData?.titulo}</p>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-3 gap-6 mb-8">
            <Card className="text-center p-6">
              <div className="text-4xl font-bold text-red-600 mb-1">{score}</div>
              <div className="text-sm text-slate-500">Pontuação</div>
            </Card>
            <Card className="text-center p-6">
              <div className="text-4xl font-bold text-green-600 mb-1">{percentage}%</div>
              <div className="text-sm text-slate-500">Acertos</div>
            </Card>
            <Card className="text-center p-6">
              <div className="text-4xl font-bold text-blue-600 mb-1">{totalPerguntas}</div>
              <div className="text-sm text-slate-500">Perguntas</div>
            </Card>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                setActiveApiQuizId(null);
                setApiQuizData(null);
                setApiAnswers([]);
                resetQuiz();
              }}
              className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
            >
              Tentar Novamente
            </button>
            <button
              onClick={() => {
                setActiveApiQuizId(null);
                setApiQuizData(null);
                setApiAnswers([]);
                resetQuiz();
              }}
              className="px-8 py-3 border-2 border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-semibold"
            >
              Voltar aos Quizzes
            </button>
          </div>
        </section>
      </div>
    );
  }

  if (activeQuiz && !showResult) {
    const currentQuiz = quizzes[activeQuiz];
    const question = localQuestions[currentQuestion];
    const totalLocais = localQuestions.length;
    const colorMap = {
      blue: { bg: 'bg-blue-600', hover: 'hover:bg-blue-700', light: 'bg-blue-50', text: 'text-blue-600' },
      red: { bg: 'bg-red-600', hover: 'hover:bg-red-700', light: 'bg-red-50', text: 'text-red-600' },
      green: { bg: 'bg-green-600', hover: 'hover:bg-green-700', light: 'bg-green-50', text: 'text-green-600' },
      purple: { bg: 'bg-purple-600', hover: 'hover:bg-purple-700', light: 'bg-purple-50', text: 'text-purple-600' },
      indigo: { bg: 'bg-indigo-600', hover: 'hover:bg-indigo-700', light: 'bg-indigo-50', text: 'text-indigo-600' },
      orange: { bg: 'bg-orange-600', hover: 'hover:bg-orange-700', light: 'bg-orange-50', text: 'text-orange-600' },
      teal: { bg: 'bg-teal-600', hover: 'hover:bg-teal-700', light: 'bg-teal-50', text: 'text-teal-600' },
      rose: { bg: 'bg-rose-600', hover: 'hover:bg-rose-700', light: 'bg-rose-50', text: 'text-rose-600' },
      cyan: { bg: 'bg-cyan-600', hover: 'hover:bg-cyan-700', light: 'bg-cyan-50', text: 'text-cyan-600' },
      emerald: { bg: 'bg-emerald-600', hover: 'hover:bg-emerald-700', light: 'bg-emerald-50', text: 'text-emerald-600' },
      violet: { bg: 'bg-violet-600', hover: 'hover:bg-violet-700', light: 'bg-violet-50', text: 'text-violet-600' },
      pink: { bg: 'bg-pink-600', hover: 'hover:bg-pink-700', light: 'bg-pink-50', text: 'text-pink-600' }
    };
    const colors = colorMap[currentQuiz.color] || colorMap.blue;

    const timePercentage = (timeRemaining / 30) * 100;
    const isTimeWarning = timeRemaining <= 10;
    const isTimeCritical = timeRemaining <= 5;

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <section className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {currentQuiz.icon}
                <h2 className="text-3xl font-bold">{currentQuiz.title}</h2>
              </div>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                title={soundEnabled ? 'Desativar som' : 'Ativar som'}
              >
                <Volume2 className={`w-5 h-5 ${!soundEnabled ? 'opacity-50' : ''}`} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm mb-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="text-xs opacity-75 mb-1">Pergunta</div>
                <div className="font-bold">{currentQuestion + 1} / {totalLocais}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="text-xs opacity-75 mb-1">Pontuação</div>
                <div className="font-bold">{score} pts</div>
              </div>
              <div className={`backdrop-blur-sm rounded-lg p-3 ${
                isTimeCritical ? 'bg-red-500/30 animate-pulse' :
                isTimeWarning ? 'bg-yellow-500/30' :
                'bg-white/10'
              }`}>
                <div className="text-xs opacity-75 mb-1 flex items-center gap-1">
                  <Timer className="w-3 h-3" />
                  Tempo
                </div>
                <div className={`font-bold ${isTimeCritical ? 'text-red-200' : isTimeWarning ? 'text-yellow-200' : ''}`}>
                  {timeRemaining}s
                </div>
              </div>
            </div>

            <div className="mb-3">
              <div className="text-xs opacity-75 mb-2">Progresso do Quiz</div>
              <div className="bg-white/20 rounded-full h-2">
                <div
                  className="bg-white h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestion + 1) / totalLocais) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="text-xs opacity-75 mb-2">Tempo Restante</div>
              <div className="bg-white/20 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all duration-1000 ${
                    isTimeCritical ? 'bg-red-400' :
                    isTimeWarning ? 'bg-yellow-400' :
                    'bg-green-400'
                  }`}
                  style={{ width: `${timePercentage}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {selectedAnswer === -1 && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-500 rounded-lg">
              <div className="flex items-center gap-3 text-red-700">
                <Timer className="w-6 h-6" />
                <div>
                  <p className="font-bold">Tempo Esgotado!</p>
                  <p className="text-sm">Você não respondeu a tempo. A pergunta foi marcada como incorreta.</p>
                </div>
              </div>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{question.question}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {question.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrect = index === question.correct;
                const showCorrect = selectedAnswer !== null && isCorrect;
                const showIncorrect = selectedAnswer !== null && isSelected && !isCorrect;

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    disabled={selectedAnswer !== null}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      showCorrect ? 'border-green-500 bg-green-50' :
                      showIncorrect ? 'border-red-500 bg-red-50' :
                      isSelected ? colors.light :
                      'border-slate-200 hover:border-slate-300'
                    } ${selectedAnswer !== null ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option}</span>
                      {showCorrect && <Check className="w-5 h-5 text-green-600" />}
                      {showIncorrect && <X className="w-5 h-5 text-red-600" />}
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <button
            onClick={resetQuiz}
            className="mt-6 px-6 py-2 border-2 border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancelar Quiz
          </button>
        </section>
      </div>
    );
  }

  if (showResult && activeQuiz) {
    const currentQuiz = quizzes[activeQuiz];
    const percentage = (score / (currentQuiz.questions.length * 10)) * 100;
    const colorMap = {
      blue: { bg: 'bg-blue-600', text: 'text-blue-600', light: 'from-blue-50 to-blue-100' },
      red: { bg: 'bg-red-600', text: 'text-red-600', light: 'from-red-50 to-red-100' },
      green: { bg: 'bg-green-600', text: 'text-green-600', light: 'from-green-50 to-green-100' },
      purple: { bg: 'bg-purple-600', text: 'text-purple-600', light: 'from-purple-50 to-purple-100' },
      indigo: { bg: 'bg-indigo-600', text: 'text-indigo-600', light: 'from-indigo-50 to-indigo-100' },
      orange: { bg: 'bg-orange-600', text: 'text-orange-600', light: 'from-orange-50 to-orange-100' },
      teal: { bg: 'bg-teal-600', text: 'text-teal-600', light: 'from-teal-50 to-teal-100' },
      rose: { bg: 'bg-rose-600', text: 'text-rose-600', light: 'from-rose-50 to-rose-100' },
      cyan: { bg: 'bg-cyan-600', text: 'text-cyan-600', light: 'from-cyan-50 to-cyan-100' },
      emerald: { bg: 'bg-emerald-600', text: 'text-emerald-600', light: 'from-emerald-50 to-emerald-100' },
      violet: { bg: 'bg-violet-600', text: 'text-violet-600', light: 'from-violet-50 to-violet-100' },
      pink: { bg: 'bg-pink-600', text: 'text-pink-600', light: 'from-pink-50 to-pink-100' }
    };
    const colors = colorMap[currentQuiz.color] || colorMap.blue;

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <section className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <Trophy className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-4xl font-bold mb-4">Quiz Concluído!</h2>
            <div className="flex items-center justify-center gap-3">
              {currentQuiz.icon}
              <p className="text-xl opacity-90">{currentQuiz.title}</p>
            </div>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-3xl mb-4">Resultado Final</CardTitle>
              <div className="text-6xl font-bold text-red-600 mb-2">{score}</div>
              <div className="text-slate-600">de {currentQuiz.questions.length * 10} pontos possíveis</div>
              <div className="mt-4">
                <div className="inline-block px-6 py-2 bg-gradient-to-r from-red-50 to-yellow-50 rounded-full text-red-600 font-semibold border-2 border-red-200">
                  {percentage.toFixed(0)}% de acerto
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-3">Avaliação:</h3>
                <p className="text-slate-600">
                  {percentage >= 90 ? '🏆 Excelente! Você domina o assunto!' :
                   percentage >= 70 ? '👏 Muito bom! Continue estudando!' :
                   percentage >= 50 ? '📚 Bom trabalho! Há espaço para melhorar.' :
                   '💪 Continue praticando! A aprendizagem é um processo.'}
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => startQuiz(activeQuiz)}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Tentar Novamente
                </button>
                <button
                  onClick={resetQuiz}
                  className="flex-1 px-6 py-3 border-2 border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Voltar aos Quizzes
                </button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <section className="text-white" style={{ background: '#C1121F' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" style={{ background: '#C1121F' }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4" style={{ background: '#C1121F' }}>
            <div className="flex items-center space-x-3">
              <GraduationCap className="w-8 h-8" />
              <h1 className="text-4xl font-bold">Teste o seu conhecimento</h1>
            </div>
            {(isAdmin || user?.pode_criar_quiz) && (
              <Link
                to="/admin/quizzes"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-red-700 font-semibold text-sm hover:bg-red-50 transition-colors shrink-0"
              >
                <PlusCircle className="w-4 h-4" /> Criar Quiz
              </Link>
            )}
          </div>
          <p className="text-xl text-red-100 max-w-3xl">
            Responda a perguntas sobre economia e história de Angola. Ganhe pontos, compare resultados e aprenda jogando.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!isAuthenticated && (
          <div className="mb-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-lg">
            <div className="flex items-start gap-4">
              <Lock className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 mb-2">Crie uma conta para participar!</h3>
                <p className="text-sm text-slate-700 mb-3">
                  Para realizar quizzes, ganhar pontos e competir no ranking, você precisa estar autenticado na plataforma.
                </p>
                <Button
                  onClick={() => {
                    setAuthAction('participar de quizzes');
                    setShowAuthPrompt(true);
                  }}
                  className="bg-gradient-to-r from-red-600 to-yellow-600 hover:from-red-700 hover:to-yellow-700"
                >
                  Entrar ou Cadastrar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Quizzes da Base de Dados ─────────────────────────────────── */}
        {loadingQuizzes ? (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2].map(i => <Card key={i}><CardContent className="p-6"><div className="h-32 bg-slate-100 rounded animate-pulse" /></CardContent></Card>)}
          </div>
        ) : apiQuizzes.length > 0 ? (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-600" /> Quizzes Disponíveis
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {apiQuizzes.filter(q => q.ativo).map((quiz: any) => (
                <Card key={quiz.id} className="hover:shadow-lg transition-shadow group overflow-hidden flex flex-col h-full">
                  {quiz.thumbnail_filename && (
                    <div className="w-full h-48 overflow-hidden flex-shrink-0">
                      <img src={quiz.thumbnail_filename} alt={quiz.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                    </div>
                  )}
                  <CardHeader className="flex-shrink-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-red-100 to-yellow-100">
                        <GraduationCap className="w-6 h-6 text-red-600" />
                      </div>
                      <CardTitle className="text-base">{quiz.titulo}</CardTitle>
                    </div>
                    <CardDescription>{quiz.descricao ?? ''}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{quiz.categoria ?? 'Geral'}</span>
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">{quiz.total_perguntas ?? 0} perguntas</span>
                    </div>
                    <button
                      onClick={() => startApiQuiz(quiz.id)}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 mt-auto"
                    >
                      {!isAuthenticated && <Lock className="w-4 h-4" />}
                      Começar Quiz
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : null}

        {/* ── Quizzes Locais (exemplos) ─────────────────────────────────── */}
        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-red-600" /> Quizzes de Exemplo
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(quizzes).map(([key, quiz]) => (
            <Card key={key} className="hover:shadow-lg transition-shadow group overflow-hidden flex flex-col h-full">
              {quiz.thumbnail && (
                <div className="w-full h-48 overflow-hidden flex-shrink-0">
                  <img
                    src={quiz.thumbnail}
                    alt={quiz.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <CardHeader className="flex-shrink-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-slate-100 to-white group-hover:scale-110 transition-transform">
                    {quiz.icon}
                  </div>
                  <CardTitle>{quiz.title}</CardTitle>
                </div>
                <CardDescription>
                  {quiz.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col">
                <p className="text-sm text-slate-600 mb-4 flex-grow">
                  {quiz.expandedDescription}
                </p>
                <button
                  onClick={() => startQuiz(key)}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 mt-auto"
                >
                  {!isAuthenticated && <Lock className="w-4 h-4" />}
                  Começar Quiz
                  <ArrowRight className="w-4 h-4" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg">
            <div className="text-3xl font-bold text-blue-600 mb-2">{totalScore}</div>
            <div className="text-sm text-slate-700">Pontos Totais</div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-lg">
            <div className="text-3xl font-bold text-red-600 mb-2">{totalQuizzes}</div>
            <div className="text-sm text-slate-700">Quizzes Completos</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-lg">
            <div className="text-3xl font-bold text-yellow-600 mb-2">
              {totalQuizzes === 0 ? '-' : totalQuizzes >= 5 ? '⭐ Expert' : totalQuizzes >= 3 ? '🥈 Avançado' : '🥉 Iniciante'}
            </div>
            <div className="text-sm text-slate-700">Classificação</div>
          </div>
        </div>

        <div className="mt-12">
          <Card>
            <CardHeader className="px-[24px] pt-[15px] pb-[0px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Trophy className="w-6 h-6 text-yellow-600" />
                  <CardTitle className="text-2xl">Ranking de Participantes</CardTitle>
                </div>
                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      setAuthAction('ver o ranking completo');
                      setShowAuthPrompt(true);
                      return;
                    }
                    setShowRanking(!showRanking);
                  }}
                  className="bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center gap-2 px-[16px] py-[8px]"
                >
                  {!isAuthenticated && <Lock className="w-4 h-4" />}
                  {showRanking ? 'Ocultar' : 'Ver Ranking'}
                </button>
              </div>
              <CardDescription className="py-[5px] px-[0px]">
                Veja os melhores participantes da plataforma
              </CardDescription>
            </CardHeader>
            {showRanking && (
              <CardContent>
                <div className="mb-6 flex flex-col sm:flex-row gap-4">
                  <div className="flex items-center gap-3">
                    <Filter className="w-5 h-5 text-slate-600" />
                    <label htmlFor="province-filter" className="text-sm font-medium text-slate-700">
                      Filtrar por província:
                    </label>
                    <select
                      id="province-filter"
                      value={selectedProvince}
                      onChange={(e) => setSelectedProvince(e.target.value)}
                      className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white"
                    >
                      {provinces.map((prov) => (
                        <option key={prov} value={prov}>
                          {prov}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <GraduationCap className="w-5 h-5 text-slate-600" />
                    <label htmlFor="institution-filter" className="text-sm font-medium text-slate-700">
                      Filtrar por instituição:
                    </label>
                    <select
                      id="institution-filter"
                      value={selectedInstitution}
                      onChange={(e) => setSelectedInstitution(e.target.value)}
                      className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white min-w-[250px]"
                    >
                      {institutions.map((inst) => (
                        <option key={inst} value={inst}>
                          {inst}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {ranking.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>Ainda não há participantes no ranking.</p>
                    <p className="text-sm mt-2">Complete um quiz para aparecer aqui!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {ranking
                      .filter(participant => 
                        (selectedProvince === 'Todas' || participant.province === selectedProvince) &&
                        (selectedInstitution === 'Todas' || participant.institution === selectedInstitution)
                      )
                      .map((participant, index) => {
                      const isCurrentUser = user && participant.name === user.name;
                      return (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                            isCurrentUser ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-12 h-12">
                              {index === 0 && (
                                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600">
                                  <Trophy className="w-6 h-6 text-white" />
                                </div>
                              )}
                              {index === 1 && (
                                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-slate-300 to-slate-500">
                                  <Medal className="w-6 h-6 text-white" />
                                </div>
                              )}
                              {index === 2 && (
                                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600">
                                  <Award className="w-6 h-6 text-white" />
                                </div>
                              )}
                              {index > 2 && (
                                <div className="text-2xl font-bold text-slate-400">
                                  #{index + 1}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 flex items-center gap-2">
                                {participant.name}
                                {isCurrentUser && (
                                  <span className="text-xs px-2 py-1 bg-blue-600 text-white rounded">Você</span>
                                )}
                              </div>
                              <div className="text-sm text-slate-600 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                <span>{participant.quizzes} {participant.quizzes === 1 ? 'quiz completo' : 'quizzes completos'}</span>
                                <span className="hidden sm:inline text-slate-400">•</span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {participant.province || 'Luanda'}
                                </span>
                                <span className="hidden sm:inline text-slate-400">•</span>
                                <span className="flex items-center gap-1">
                                  <GraduationCap className="w-3 h-3" />
                                  {participant.institution || 'ISPTEC'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-slate-900">
                              {participant.score}
                            </div>
                            <div className="text-xs text-slate-500">pontos</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {user && ranking.length > 0 && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-sm text-slate-900 mb-2">Sua Posição no Ranking</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-700">
                        {ranking.findIndex(r => r.name === user.name) >= 0 
                          ? `${ranking.findIndex(r => r.name === user.name) + 1}º lugar de ${ranking.length} participantes`
                          : 'Complete um quiz para entrar no ranking'}
                      </span>
                      {ranking.findIndex(r => r.name === user.name) >= 0 && (
                        <span className="text-lg font-bold text-blue-600">
                          {ranking.find(r => r.name === user.name)?.score} pts
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        </div>
      </section>

      <AuthPrompt
        open={showAuthPrompt}
        onOpenChange={setShowAuthPrompt}
        action={authAction}
      />
    </div>
  );
}