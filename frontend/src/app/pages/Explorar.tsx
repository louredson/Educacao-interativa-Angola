import { useState, useEffect } from "react";
import { apiRequest } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import {
  Search,
  Filter,
  BookOpen,
  Clock,
  TrendingUp,
  Globe,
  Landmark,
  Factory,
  Users,
  ChevronRight,
  Star,
  Eye,
  Play,
  FileText,
  Headphones,
  Image as ImageIcon,
  Video,
  Mic,
  X,
  Plus,
  Upload,
  Lock,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Share2,
  Flag,
  Send,
  User,
  SkipBack,
  SkipForward,
  Pause,
  Volume2,
  List,
  Heart,
  Edit3,
  Trash2,
  MoreHorizontal,
  Check,
  AlertTriangle,
  Sparkles,
  Bookmark,
  Quote,
  Calendar,
  ArrowLeft,
  ArrowRight,
  Music,
  FileAudio,
} from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../components/ui/dialog";

// Imagens para os cards de conteúdo baseado no título
const cardImages = {
  // Vídeos
  inflacaoAngola: "https://images.unsplash.com/photo-1761666520258-e6de315a61c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxBZnJpY2FuJTIwZWNvbm9teSUyMGluZmxhdGlvbiUyMHByaWNlcyUyMG1hcmtldCUyMG1vbmV5fGVufDF8fHx8MTc3OTM4ODMwM3ww&ixlib=rb-4.1.0&q=80&w=1080",
  mulheresNegocios: "https://images.unsplash.com/photo-1584539724758-7aecb6b87fb9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwd29tZW4lMjBidXNpbmVzcyUyMGVudHJlcHJlbmV1cnMlMjBzdWNjZXNzfGVufDF8fHx8MTc3OTM4ODMwNHww&ixlib=rb-4.1.0&q=80&w=1080",
  independenciaAngola: "https://images.unsplash.com/photo-1739221857002-353c06f1e9b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwbmF0aW9uYWwlMjBjZWxlYnJhdGlvbiUyMGZyZWVkb20lMjBpbmRlcGVuZGVuY2UlMjBtb251bWVudHxlbnwxfHx8fDE3NzkzODgzMzB8MA&ixlib=rb-4.1.0&q=80&w=1080",

  // Textos Normais
  comercioColonial: "https://images.unsplash.com/photo-1575478105734-56d6847e220b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwY29sb25pYWwlMjBoaXN0b3J5JTIwdHJhZGUlMjBjb21tZXJjZSUyMGhlcml0YWdlfGVufDF8fHx8MTc3OTM4ODMwNHww&ixlib=rb-4.1.0&q=80&w=1080",

  // Textos com Jindungo
  economiaMixa: "https://images.unsplash.com/photo-1729077548491-0df37e844eb2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxBZnJpY2FuJTIwY29tbXVuaXR5JTIwc2F2aW5ncyUyMG1vbmV5JTIwZ3JvdXAlMjBmaW5hbmNlfGVufDF8fHx8MTc3OTM4ODMwNXww&ixlib=rb-4.1.0&q=80&w=1080",
  doutoresMatumbos: "https://images.unsplash.com/photo-1594750852517-f37738fa2384?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwZWR1Y2F0aW9uJTIwdW5pdmVyc2l0eSUyMHN0dWRlbnRzJTIwZ3JhZHVhdGlvbiUyMGxlYXJuaW5nfGVufDF8fHx8MTc3OTM4ODMwNnww&ixlib=rb-4.1.0&q=80&w=1080",
};

// Imagens adicionais para melhorar os cards
const economiaImg = "https://images.unsplash.com/photo-1751130562241-3323a0362831?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxBZnJpY2FuJTIwY3VsdHVyZSUyMGVudHJlcHJlbmV1cnNoaXAlMjBidXNpbmVzcyUyMHRyYWRpdGlvbmFsJTIwbW9kZXJufGVufDF8fHx8MTc3OTM4ODMwN3ww&ixlib=rb-4.1.0&q=80&w=1080";
const historiaImg = "https://images.unsplash.com/photo-1461360370896-922624d12aa1?q=80&w=1000";
const culturaImg = "https://images.unsplash.com/photo-1544531585-9847b68c8c6e?q=80&w=1000";
const videoImg = "https://images.unsplash.com/photo-1536240474400-bc3e7c2f1a2f?q=80&w=1000";
const textoImg = "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1000";
const podcastImg = "https://images.unsplash.com/photo-1632800237110-f9c87acc2222?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwcG9kY2FzdCUyMHJlY29yZGluZyUyMHN0dWRpbyUyMG1pY3JvcGhvbmUlMjBob3N0fGVufDF8fHx8MTc3OTM4ODMwNXww&ixlib=rb-4.1.0&q=80&w=1080";

// Imagens para os autores dos livros
const autorImages = {
  pepetela: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1000",
  agualusa: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?q=80&w=1000",
  manuelRui: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=1000",
};

interface Content {
  id: string;
  title: string;
  description: string;
  category: "historia" | "economia" | "provincial" | "cultura";
  type: "video" | "texto_normal" | "texto_jindungo" | "podcast";
  duration: string;
  level: "iniciante" | "intermediario" | "avancado";
  views: number;
  rating: number;
  imageColor?: string;
  imageIcon?: React.ReactNode;
  thumbnail?: string;
  author: string;
  date: string;
  tags: string[];
  requiresAccess?: boolean;
  content?: string;
  episodes?: PodcastEpisode[];
}

interface PodcastEpisode {
  id: string;
  title: string;
  duration: string;
  description: string;
  date: string;
  audioFile?: File | null;
  audioFileName?: string;
}

interface Comment {
  id: string;
  author: string;
  avatar: string;
  text: string;
  time: string;
  likes: number;
  isEditing?: boolean;
  editText?: string;
  replies?: Comment[];
}

// Dados do Livro do Dia - Literatura Angolana
const livrosDoDia = [
  {
    id: "livro1",
    titulo: "Mayombe",
    autor: "Pepetela",
    ano: "1980",
    editora: "Publicações Dom Quixote",
    genero: "Romance Histórico",
    autorImage: autorImages.pepetela,
    sobreAutor: "Pepetela (Artur Carlos Maurício Pestana dos Santos) é um dos mais importantes escritores angolanos. Nascido em Benguela em 1941, participou ativamente da luta de libertação nacional. A sua obra reflete profundamente a história e a identidade angolana, tendo recebido o Prémio Camões em 1997.",
    trecho: "Mayombe é uma montanha mágica, coberta de uma densa floresta tropical, situada no enclave de Cabinda. Lá, durante a guerra de libertação, um grupo de guerrilheiros do MPLA vive isolado, enfrentando não só o inimigo colonial mas também os seus próprios conflitos internos. A história explora as contradições entre os combatentes — as diferenças tribais, os desejos pessoais e a disciplina revolucionária. Cada personagem carrega consigo uma Angola diferente, e é no confronto dessas diferenças que nasce a verdadeira luta pela identidade nacional. 'O homem mais corajoso que conheci tinha medo de cobras', escreve Pepetela, revelando a humanidade por trás dos heróis. Através de uma narrativa que mescla ação e reflexão, o autor constrói um retrato íntimo e poderoso daqueles que deram a vida pela liberdade de Angola.",
    citacaoDestaque: "«A guerra é uma escola onde se aprende a ser homem. Mas que homem?»",
    likes: 156,
    comentarios: 23,
  },
  {
    id: "livro2",
    titulo: "A Geração da Utopia",
    autor: "Pepetela",
    ano: "1992",
    editora: "Publicações Dom Quixote",
    genero: "Romance Político",
    autorImage: autorImages.pepetela,
    sobreAutor: "Pepetela (Artur Carlos Maurício Pestana dos Santos) nasceu em Benguela, Angola, em 1941. Sociólogo de formação, participou ativamente na guerra de libertação. Recebeu o Prémio Camões em 1997 pelo conjunto da sua obra.",
    trecho: "A Geração da Utopia acompanha a trajetória de um grupo de jovens angolanos desde os tempos de estudantes em Lisboa, passando pela luta de libertação, até ao desencanto pós-independência. O romance começa na Casa dos Estudantes do Império, onde os futuros líderes sonhavam com uma Angola livre e próspera. Décadas depois, esses mesmos idealistas encontram-se confrontados com a corrupção e a desigualdade que assolaram o país. 'Quem parte da utopia para a realidade nunca chega são e salvo', reflete uma das personagens. Pepetela disseca a alma de uma geração que apostou tudo num sonho e viu esse sonho transformar-se em algo irreconhecível.",
    citacaoDestaque: "«Partimos do princípio que o homem é bom e a sociedade é que o corrompe. E se for o contrário?»",
    likes: 189,
    comentarios: 31,
  },
  {
    id: "livro3",
    titulo: "O Vendedor de Passados",
    autor: "José Eduardo Agualusa",
    ano: "2004",
    editora: "Publicações Dom Quixote",
    genero: "Romance Contemporâneo",
    autorImage: autorImages.agualusa,
    sobreAutor: "José Eduardo Agualusa nasceu no Huambo, Angola, em 1960. É jornalista, escritor e um dos nomes mais reconhecidos da literatura lusófona contemporânea. As suas obras exploram as complexidades da identidade angolana e as conexões entre África, Brasil e Portugal.",
    trecho: "Félix Ventura é um vendedor de passados — um homem que cria genealogias fictícias para novos-ricos angolanos. O seu ofício é fabricar memórias, fornecer árvores genealógicas ilustres a quem pode pagar por elas. Um dia, um misterioso estrangeiro entra na sua vida exigindo uma identidade angolana completa. O que começa como uma transação comercial torna-se uma jornada pelas sombras da história recente de Angola, onde as fronteiras entre verdade e mentira se desfazem. 'Nós somos aquilo que lembramos, mas também aquilo que esquecemos', escreve Agualusa. O romance é uma meditação brilhante sobre memória, identidade e o poder das histórias que contamos sobre nós mesmos.",
    citacaoDestaque: "«A memória é uma paisagem que vai mudando com o tempo e com a luz.»",
    likes: 210,
    comentarios: 42,
  },
  {
    id: "livro4",
    titulo: "Quem Me Dera Ser Onda",
    autor: "Manuel Rui",
    ano: "1982",
    editora: "Edições 70",
    genero: "Novela Satírica",
    autorImage: autorImages.manuelRui,
    sobreAutor: "Manuel Rui Monteiro nasceu no Huambo em 1941. É um dos escritores mais versáteis de Angola, com obras que vão do conto ao teatro. Participou ativamente na luta de libertação e foi Ministro da Informação no primeiro governo independente.",
    trecho: "Quem Me Dera Ser Onda é uma novela satírica que retrata o quotidiano de Luanda nos anos pós-independência. A história acompanha uma família que decide criar um porco no apartamento, no sétimo andar de um prédio na capital. O animal, chamado 'Camarada Porco', torna-se o centro de situações hilariantes que expõem as contradições do socialismo africano e as dificuldades da vida urbana. Com um humor fino e mordaz, Manuel Rui critica a burocracia, o racionamento e os desvios do poder. 'Em Luanda, o impossível acontece todos os dias antes do pequeno-almoço', brinca o narrador, capturando o espírito resiliente e criativo do povo angolano.",
    citacaoDestaque: "«Nesta terra, quem não se adapta morre. Mas quem se adapta também morre — só que mais devagar.»",
    likes: 134,
    comentarios: 18,
  },
];

interface LivroComentario {
  id: string;
  autor: string;
  avatar: string;
  texto: string;
  tempo: string;
  likes: number;
  isEditing?: boolean;
  editText?: string;
}

export default function Explorar() {
  // Estados existentes
  const { user, isAuthenticated } = useAuth();
  const [apiContents, setApiContents] = useState<Content[]>([]);
  const [loadingContents, setLoadingContents] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");
  const [showFilters, setShowFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);
  const [isLoading, setIsLoading] = useState(false);

  // Estados do Livro do Dia
  const [livroAtualIndex, setLivroAtualIndex] = useState(0);
  const [isLivroFavorito, setIsLivroFavorito] = useState(false);
  const [isLivroModalOpen, setIsLivroModalOpen] = useState(false);
  const [novoComentarioLivro, setNovoComentarioLivro] = useState("");
  const [comentariosLivro, setComentariosLivro] = useState<LivroComentario[]>([
    {
      id: "lc1",
      autor: "Maria Santos",
      avatar: "MS",
      texto: "Que trecho maravilhoso! Pepetela é realmente um mestre da literatura angolana.",
      tempo: "3h atrás",
      likes: 12,
    },
    {
      id: "lc2",
      autor: "Carlos Nunes",
      avatar: "CN",
      texto: "Li este livro na universidade e mudou completamente a minha perspetiva sobre a nossa história.",
      tempo: "5h atrás",
      likes: 8,
    },
  ]);
  const [likedComentariosLivro, setLikedComentariosLivro] = useState<{ [key: string]: boolean }>({});
  const [editandoComentarioLivro, setEditandoComentarioLivro] = useState<string | null>(null);
  const [textoEdicaoLivro, setTextoEdicaoLivro] = useState("");

  // Modal states
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [accessReason, setAccessReason] = useState("");

  // Add content modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modoAdicao, setModoAdicao] = useState<"editor" | "preview">("editor");
  const [newContent, setNewContent] = useState({
    title: "",
    description: "",
    category: "",
    type: "",
    duration: "",
    coverImage: null as File | null,
    isRestricted: false,
    episodes: [] as PodcastEpisode[],
    newEpisode: { title: "", duration: "", description: "", date: "", audioFile: null as File | null, audioFileName: "" },
  });

  // Video content modal states
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [videoContent, setVideoContent] = useState<Content | null>(null);
  
  // Text content modal states
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [textContent, setTextContent] = useState<Content | null>(null);
  
  // Podcast content modal states
  const [isPodcastModalOpen, setIsPodcastModalOpen] = useState(false);
  const [podcastContent, setPodcastContent] = useState<Content | null>(null);
  const [currentEpisode, setCurrentEpisode] = useState<PodcastEpisode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingEpisodeId, setPlayingEpisodeId] = useState<string | null>(null);
  
  // Delete/Report confirmation modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "comment"; id: string } | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  
  // Interaction states
  const [likedContents, setLikedContents] = useState<{ [key: string]: boolean }>({});
  const [dislikedContents, setDislikedContents] = useState<{ [key: string]: boolean }>({});
  const [savedContents, setSavedContents] = useState<{ [key: string]: boolean }>({});
  const [podcastFavorites, setPodcastFavorites] = useState<{ [key: string]: boolean }>({});
  const [playlistItems, setPlaylistItems] = useState<{ [key: string]: boolean }>({});
  const [showShareToast, setShowShareToast] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  
  // Comments state
  const [newComment, setNewComment] = useState("");
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([
    {
      id: "1",
      author: "Maria Santos",
      avatar: "MS",
      text: "Excelente análise sobre o período inflacionário! Muito esclarecedor.",
      time: "2h atrás",
      likes: 15,
    },
    {
      id: "2",
      author: "Carlos Nunes",
      avatar: "CN",
      text: "Seria interessante ver uma comparação com outros países da região.",
      time: "5h atrás",
      likes: 8,
    },
  ]);
  const [likedComments, setLikedComments] = useState<{ [key: string]: boolean }>({});

  const livroAtual = livrosDoDia[livroAtualIndex];

  // Handlers do Livro do Dia
  const handleLivroAnterior = () => {
    setLivroAtualIndex((prev) => (prev === 0 ? livrosDoDia.length - 1 : prev - 1));
  };

  const handleLivroProximo = () => {
    setLivroAtualIndex((prev) => (prev === livrosDoDia.length - 1 ? 0 : prev + 1));
  };

  const handleFavoritarLivro = () => {
    setIsLivroFavorito(!isLivroFavorito);
  };

  const handleAdicionarComentarioLivro = () => {
    if (novoComentarioLivro.trim()) {
      const comentario: LivroComentario = {
        id: String(Date.now()),
        autor: "Ana Fernandes",
        avatar: "AF",
        texto: novoComentarioLivro,
        tempo: "Agora mesmo",
        likes: 0,
      };
      setComentariosLivro([comentario, ...comentariosLivro]);
      setNovoComentarioLivro("");
    }
  };

  const handleDeletarComentarioLivro = (id: string) => {
    setComentariosLivro(comentariosLivro.filter((c) => c.id !== id));
  };

  const handleEditarComentarioLivro = (id: string) => {
    setEditandoComentarioLivro(id);
    const comentario = comentariosLivro.find((c) => c.id === id);
    if (comentario) {
      setTextoEdicaoLivro(comentario.texto);
    }
  };

  const handleSalvarEdicaoLivro = (id: string) => {
    setComentariosLivro(
      comentariosLivro.map((c) =>
        c.id === id ? { ...c, texto: textoEdicaoLivro, isEditing: false } : c
      )
    );
    setEditandoComentarioLivro(null);
    setTextoEdicaoLivro("");
  };

  const handleLikeComentarioLivro = (id: string) => {
    setLikedComentariosLivro((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const contents: Content[] = [
    {
      id: "1",
      title: "Inflação em Angola 1990–2014",
      description: "Análise histórica das mudanças económicas e suas consequências no período pós-independência.",
      category: "economia",
      type: "video",
      duration: "15 min",
      level: "intermediario",
      views: 892,
      rating: 4.5,
      author: "Oikawa Toru",
      date: "15 Abr 2026",
      tags: ["Inflação", "Economia", "1990-2014"],
      requiresAccess: false,
      imageColor: "from-red-500 to-red-700",
      imageIcon: <Video className="w-12 h-12 text-white" />,
      thumbnail: cardImages.inflacaoAngola,
      content: `O período entre 1990 e 2014 marcou uma das fases mais desafiadoras da economia angolana. A inflação atingiu níveis estratosféricos, chegando a ultrapassar os 4.000% em alguns anos da década de 1990. Este fenómeno teve raízes profundas na guerra civil que assolou o país, na má gestão de recursos e na dependência excessiva do petróleo.

A guerra civil destruiu infraestruturas essenciais e desorganizou a produção agrícola, forçando Angola a depender fortemente de importações. Com a moeda em constante desvalorização, os preços dos produtos importados dispararam, alimentando um ciclo vicioso de inflação.

Após o fim da guerra em 2002, o governo implementou várias medidas de estabilização macroeconómica, incluindo reformas monetárias e fiscais. A criação do Kwanza reajustado em 1999 foi um marco importante neste processo.`,
    },
    {
      id: "2",
      title: "Mulheres nos Negócios",
      description: "Empreendedorismo feminino e desenvolvimento económico em Angola.",
      category: "economia",
      type: "video",
      duration: "12 min",
      level: "iniciante",
      views: 654,
      rating: 4.8,
      author: "Maria Silva",
      date: "12 Abr 2026",
      tags: ["Empreendedorismo", "Mulheres", "Negócios"],
      requiresAccess: false,
      imageColor: "from-pink-500 to-rose-700",
      imageIcon: <Users className="w-12 h-12 text-white" />,
      thumbnail: cardImages.mulheresNegocios,
      content: `O empreendedorismo feminino tem sido um motor silencioso mas poderoso da economia angolana. Apesar dos desafios sistémicos, as mulheres angolanas têm demonstrado resiliência e criatividade notáveis nos negócios.`,
    },
    {
      id: "3",
      title: "Comércio no período colonial",
      description: "Recursos naturais e impacto económico das florestas angolanas.",
      category: "historia",
      type: "texto_normal",
      duration: "6 min",
      level: "iniciante",
      views: 578,
      rating: 4.3,
      author: "Prof. António Neto",
      date: "10 Abr 2026",
      tags: ["Comércio Colonial", "História de Angola", "Economia Colonial"],
      requiresAccess: false,
      imageColor: "from-green-600 to-emerald-800",
      imageIcon: <Globe className="w-12 h-12 text-white" />,
      thumbnail: cardImages.comercioColonial,
      content: `O comércio no período colonial desempenhou um papel central na organização económica de Angola sob domínio português. As atividades comerciais eram orientadas principalmente para beneficiar a metrópole, com a exportação de matérias-primas como marfim, cera, borracha, café e algodão. Em troca, produtos manufaturados europeus eram introduzidos no território angolano, criando uma relação de dependência económica. As rotas comerciais ligavam o interior às zonas costeiras, facilitando o escoamento de recursos naturais e fortalecendo o controlo colonial sobre diferentes regiões. Este sistema teve impactos profundos na estrutura social, económica e política de Angola, muitos dos quais continuaram a influenciar o país mesmo após a independência.`,
    },
    {
      id: "4",
      title: "Dinâmicas Macroeconómicas",
      description: "Políticas fiscais e monetárias em Angola nas últimas décadas.",
      category: "economia",
      type: "podcast",
      duration: "20 min",
      level: "avancado",
      views: 745,
      rating: 4.7,
      author: "Zuko Kita",
      date: "8 Abr 2026",
      tags: ["Macroeconomia", "Políticas Fiscais", "Políticas Monetárias"],
      requiresAccess: false,
      imageColor: "from-blue-500 to-indigo-700",
      imageIcon: <Mic className="w-12 h-12 text-white" />,
      thumbnail: podcastImg,
      episodes: [
        { id: "ep1", title: "Introdução à Macroeconomia Angolana", duration: "20:15", description: "Panorama geral da economia angolana e seus principais indicadores.", date: "8 Abr 2026" },
        { id: "ep2", title: "Política Monetária e Inflação", duration: "18:42", description: "Análise das políticas do BNA e controle inflacionário.", date: "1 Abr 2026" },
        { id: "ep3", title: "Desafios Fiscais Contemporâneos", duration: "22:10", description: "Receitas, despesas e sustentabilidade fiscal.", date: "25 Mar 2026" },
      ],
    },
    {
      id: "5",
      title: "A Economia da Mixa",
      description: "Exploração sobre a Mixa como sistema económico informal e o seu impacto nas dinâmicas sociais e financeiras em Angola.",
      category: "economia",
      type: "texto_jindungo",
      duration: "8 min",
      level: "intermediario",
      views: 423,
      rating: 4.6,
      author: "Prof. Carlos Lopes",
      date: "5 Abr 2026",
      tags: ["Mixa", "Economia Informal", "Finanças Comunitárias"],
      requiresAccess: true,
      imageColor: "from-amber-600 to-orange-800",
      imageIcon: <BookOpen className="w-12 h-12 text-white" />,
      thumbnail: cardImages.economiaMixa,
      content: `A Mixa representa uma das formas mais tradicionais e populares de organização financeira comunitária em Angola. Baseada na contribuição periódica de um grupo de pessoas, este sistema funciona como uma rede informal de apoio económico, permitindo que os participantes tenham acesso rotativo a valores monetários sem recorrer a instituições bancárias. Ao longo dos anos, a Mixa tornou-se uma alternativa importante para famílias, pequenos comerciantes e trabalhadores informais, fortalecendo laços de confiança, solidariedade e cooperação dentro das comunidades. Apesar de não fazer parte do sistema financeiro formal, a sua influência na economia local é significativa, especialmente em contextos onde o acesso ao crédito tradicional é limitado.`,
    },
    {
      id: "6",
      title: "Doutores Matumbos",
      description: "Impacto da indústria petrolífera no desenvolvimento económico angolano.",
      category: "historia",
      type: "texto_jindungo",
      duration: "10 min",
      level: "intermediario",
      views: 934,
      rating: 4.9,
      author: "Prof. Carlos Lopes",
      date: "3 Abr 2026",
      tags: ["Educação", "Sociedade", "Conhecimento"],
      requiresAccess: true,
      imageColor: "from-slate-600 to-gray-900",
      imageIcon: <Factory className="w-12 h-12 text-white" />,
      thumbnail: cardImages.doutoresMatumbos,
      content: `O termo 'Doutores Matumbos' é frequentemente utilizado de forma crítica para descrever indivíduos com elevado nível académico, mas com pouca capacidade prática, visão estratégica ou entendimento das realidades sociais à sua volta. Em muitos contextos angolanos, este fenómeno tornou-se símbolo da desconexão entre formação teórica e competência real. O debate em torno dos Doutores Matumbos levanta questões importantes sobre a qualidade do ensino, a valorização excessiva de títulos académicos e a necessidade de desenvolver pensamento crítico, criatividade e capacidade de resolução de problemas. Mais do que possuir diplomas, a sociedade moderna exige indivíduos capazes de aplicar conhecimento de forma útil, ética e transformadora.`,
    },
    {
      id: "7",
      title: "Independência de Angola",
      description: "Os eventos que marcaram a independência e as transformações económicas subsequentes.",
      category: "historia",
      type: "video",
      duration: "18 min",
      level: "intermediario",
      views: 1247,
      rating: 4.7,
      author: "Sae Michael",
      date: "28 Mar 2026",
      tags: ["Independência", "1975", "Transformação"],
      requiresAccess: false,
      imageColor: "from-yellow-600 to-amber-800",
      imageIcon: <Landmark className="w-12 h-12 text-white" />,
      thumbnail: cardImages.independenciaAngola,
      content: `A independência de Angola, proclamada a 11 de Novembro de 1975, representou um marco histórico fundamental para o país. Após 14 anos de luta armada contra o regime colonial português, Angola finalmente conquistava sua soberania. No entanto, o período que se seguiu foi marcado por uma guerra civil devastadora que duraria 27 anos, impactando profundamente o desenvolvimento económico e social do país.`,
    },
    {
      id: "8",
      title: "Cultura Empreendedora em Angola",
      description: "Como a cultura angolana influencia o ambiente de negócios e empreendedorismo.",
      category: "cultura",
      type: "podcast",
      duration: "25 min",
      level: "iniciante",
      views: 567,
      rating: 4.4,
      author: "Rin Itashi",
      date: "25 Mar 2026",
      tags: ["Cultura", "Empreendedorismo", "Negócios"],
      requiresAccess: false,
      imageColor: "from-purple-500 to-purple-800",
      imageIcon: <Headphones className="w-12 h-12 text-white" />,
      thumbnail: economiaImg,
      episodes: [
        { id: "ep1", title: "Raízes Culturais do Empreendedorismo", duration: "25:10", description: "Explorando as tradições comerciais angolanas.", date: "25 Mar 2026" },
        { id: "ep2", title: "Mulheres no Mercado Informal", duration: "22:30", description: "O papel das mulheres na economia informal.", date: "18 Mar 2026" },
        { id: "ep3", title: "Inovação e Tradição", duration: "28:45", description: "Como unir práticas tradicionais com inovação.", date: "10 Mar 2026" },
      ],
    },
  ];

  // Carrega conteúdos da API ao montar o componente
  useEffect(() => {
    const carregarConteudos = async () => {
      try {
        const dados = await apiRequest<any[]>("/conteudos");
        if (dados && dados.length > 0) {
          const mapeados: Content[] = dados.map((c: any) => ({
            id: String(c.id),
            title: c.titulo ?? "",
            description: c.descricao ?? "",
            category: (c.categoria ?? "geral").toLowerCase(),
            type: c.tipo ?? "texto_normal",
            duration: c.duracao ?? "",
            level: "iniciante",
            views: 0,
            rating: 0,
            author: c.publicado_por ? String(c.publicado_por) : "Redação",
            date: new Date(c.publicado_em).toLocaleDateString("pt-PT"),
            tags: c.tema ? [c.tema] : [],
            requiresAccess: c.tipo === "texto_jindungo",
            imageColor: "from-red-500 to-red-700",
            imageIcon: null,
            thumbnail: c.imagem_filename ?? undefined,
            content: c.conteudo_completo ?? c.descricao ?? "",
          }));
          setApiContents(mapeados);
        }
      } catch {
        // Usa conteúdos estáticos como fallback
      } finally {
        setLoadingContents(false);
      }
    };
    void carregarConteudos();
  }, []);

  // Usa conteúdos da API se disponíveis, senão os estáticos
  const activeContents = apiContents.length > 0 ? apiContents : contents;

  const categories = [
    { id: "all", label: "Todos", icon: Globe, count: activeContents.length },
    { id: "historia", label: "História", icon: Landmark, count: activeContents.filter((c) => c.category === "historia").length },
    { id: "economia", label: "Economia", icon: TrendingUp, count: activeContents.filter((c) => c.category === "economia").length },
    { id: "cultura", label: "Cultura", icon: Users, count: activeContents.filter((c) => c.category === "cultura").length },
  ];

  const contentTypes = [
    { id: "all", label: "Todos", icon: BookOpen },
    { id: "video", label: "Vídeos", icon: Play },
    { id: "texto_normal", label: "Textos", icon: FileText },
    { id: "texto_jindungo", label: "Texto com Jindungo", icon: BookOpen },
    { id: "podcast", label: "Podcasts", icon: Headphones },
  ];

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "video": return "Vídeo";
      case "texto_normal": return "Texto Normal";
      case "texto_jindungo": return "Texto com Jindungo";
      case "podcast": return "Podcast";
      default: return "Conteúdo";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video": return Play;
      case "texto_normal": return FileText;
      case "texto_jindungo": return BookOpen;
      case "podcast": return Headphones;
      default: return BookOpen;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "video": return "bg-blue-100 text-blue-700 border-blue-200";
      case "texto_normal": return "bg-green-100 text-green-700 border-green-200";
      case "texto_jindungo": return "bg-orange-100 text-orange-700 border-orange-200";
      case "podcast": return "bg-purple-100 text-purple-700 border-purple-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "iniciante": return "bg-emerald-100 text-emerald-700";
      case "intermediario": return "bg-amber-100 text-amber-700";
      case "avancado": return "bg-rose-100 text-rose-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const getLevelLabel = (level: string) => {
    switch (level) {
      case "iniciante": return "Iniciante";
      case "intermediario": return "Intermediário";
      case "avancado": return "Avançado";
      default: return level;
    }
  };

  // Interactive handlers
  const handleLike = (contentId: string) => {
    setLikedContents((prev) => ({ ...prev, [contentId]: !prev[contentId] }));
    if (dislikedContents[contentId]) {
      setDislikedContents((prev) => ({ ...prev, [contentId]: false }));
    }
  };

  const handleDislike = (contentId: string) => {
    setDislikedContents((prev) => ({ ...prev, [contentId]: !prev[contentId] }));
    if (likedContents[contentId]) {
      setLikedContents((prev) => ({ ...prev, [contentId]: false }));
    }
  };

  const handleShare = () => {
    setShareMessage("Link copiado para a área de transferência!");
    setShowShareToast(true);
    setTimeout(() => setShowShareToast(false), 3000);
  };

  const handleReport = () => {
    setIsReportModalOpen(true);
  };

  const handleSubmitReport = () => {
    console.log("Denúncia enviada:", { motivo: reportReason, descricao: reportDescription });
    alert("Denúncia enviada com sucesso! A equipa de moderação irá analisar.");
    setIsReportModalOpen(false);
    setReportReason("");
    setReportDescription("");
  };

  const handleSave = async (contentId: string) => {
    const isSaved = savedContents[contentId];
    setSavedContents((prev) => ({ ...prev, [contentId]: !isSaved }));
    try {
      if (isSaved) {
        await apiRequest(`/conteudos/${contentId}/favoritar`, { method: "DELETE" });
      } else {
        await apiRequest(`/conteudos/${contentId}/favoritar`, { method: "POST" });
      }
    } catch { /* best-effort */ }
  };

  const handlePodcastFavorite = (contentId: string) => {
    setPodcastFavorites((prev) => ({ ...prev, [contentId]: !prev[contentId] }));
  };

  const handleAddToPlaylist = (episodeId: string) => {
    setPlaylistItems((prev) => ({ ...prev, [episodeId]: !prev[episodeId] }));
  };

  const handlePlayEpisode = (episodeId: string) => {
    if (playingEpisodeId === episodeId && isPlaying) {
      setIsPlaying(false);
      setPlayingEpisodeId(null);
    } else {
      setIsPlaying(true);
      setPlayingEpisodeId(episodeId);
    }
  };

  const handleAccessRequest = (content: Content) => {
    setSelectedContent(content);
    setIsAccessModalOpen(true);
  };

  const handleSubmitAccess = async () => {
    if (!selectedContent) return;
    try {
      await apiRequest(`/conteudos/${selectedContent.id}/solicitar-acesso`, {
        method: "POST",
        json: { motivo: accessReason || "Sem motivo informado" },
      });
      alert(`Solicitação enviada para "${selectedContent.title}"! A solicitação será analisada em breve.`);
    } catch (err: any) {
      if (err?.status === 409) {
        alert("Já enviaste uma solicitação para este conteúdo.");
      } else {
        alert("Não foi possível enviar a solicitação. Tenta novamente.");
      }
    } finally {
      setIsAccessModalOpen(false);
      setAccessReason("");
      setSelectedContent(null);
    }
  };

  const handleAddContent = () => {
    if (!newContent.title || !newContent.category || !newContent.type) {
      alert("Por favor, preencha os campos obrigatórios: Título, Categoria e Tipo.");
      return;
    }
    console.log("Novo conteúdo:", newContent);
    alert(`Conteúdo "${newContent.title}" adicionado com sucesso!`);
    setIsAddModalOpen(false);
    setModoAdicao("editor");
    setNewContent({
      title: "",
      description: "",
      category: "",
      type: "",
      duration: "",
      coverImage: null,
      isRestricted: false,
      episodes: [],
      newEpisode: { title: "", duration: "", description: "", date: "", audioFile: null, audioFileName: "" },
    });
  };

  const handleAddEpisode = () => {
    if (newContent.newEpisode.title && newContent.newEpisode.duration) {
      const episode: PodcastEpisode = {
        id: String(Date.now()),
        title: newContent.newEpisode.title,
        duration: newContent.newEpisode.duration,
        description: newContent.newEpisode.description,
        date: new Date().toLocaleDateString("pt-AO", { day: "numeric", month: "short", year: "numeric" }),
        audioFile: newContent.newEpisode.audioFile,
        audioFileName: newContent.newEpisode.audioFileName,
      };
      setNewContent({
        ...newContent,
        episodes: [...newContent.episodes, episode],
        newEpisode: { title: "", duration: "", description: "", date: "", audioFile: null, audioFileName: "" },
      });
    }
  };

  const handleRemoveEpisode = (episodeId: string) => {
    setNewContent({
      ...newContent,
      episodes: newContent.episodes.filter((ep) => ep.id !== episodeId),
    });
  };

  const handleOpenVideo = (content: Content) => {
    setVideoContent(content);
    setIsVideoModalOpen(true);
  };

  const handleOpenText = (content: Content) => {
    setTextContent(content);
    setIsTextModalOpen(true);
  };

  const handleOpenPodcast = (content: Content) => {
    setPodcastContent(content);
    setCurrentEpisode(content.episodes?.[0] || null);
    setIsPlaying(false);
    setPlayingEpisodeId(null);
    setIsPodcastModalOpen(true);
  };

  // Comment handlers
  const handleLikeComment = (commentId: string) => {
    setLikedComments((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    const conteudoId = videoContent?.id ?? textContent?.id ?? podcastContent?.id;
    const comment: Comment = {
      id: String(Date.now()),
      author: user?.name ?? "Utilizador",
      avatar: (user?.name ?? "U").split(" ").map((p: string) => p[0]).join("").slice(0, 2).toUpperCase(),
      text: newComment,
      time: "Agora mesmo",
      likes: 0,
    };
    setComments([comment, ...comments]);
    setNewComment("");
    // Persiste na API (best-effort)
    if (conteudoId) {
      apiRequest(`/conteudos/${conteudoId}/comentarios`, {
        method: "POST",
        json: { comentario: newComment.trim() },
      }).catch(() => null);
    }
  };

  const handleDeleteCommentClick = (commentId: string) => {
    setDeleteTarget({ type: "comment", id: commentId });
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deleteTarget?.type === "comment") {
      setComments(comments.filter((c) => c.id !== deleteTarget.id));
    }
    setIsDeleteModalOpen(false);
    setDeleteTarget(null);
  };

  const handleEditComment = (commentId: string) => {
    setComments(
      comments.map((c) =>
        c.id === commentId
          ? { ...c, isEditing: true, editText: c.text }
          : c
      )
    );
  };

  const handleSaveEditComment = (commentId: string) => {
    setComments(
      comments.map((c) =>
        c.id === commentId && c.editText?.trim()
          ? { ...c, text: c.editText, isEditing: false, editText: "" }
          : c
      )
    );
  };

  const handleCancelEditComment = (commentId: string) => {
    setComments(
      comments.map((c) =>
        c.id === commentId
          ? { ...c, isEditing: false, editText: "" }
          : c
      )
    );
  };

  const handleReply = (commentId: string) => {
    setReplyingTo(replyingTo === commentId ? null : commentId);
    setReplyText("");
  };

  const handleAddReply = (commentId: string) => {
    if (replyText.trim()) {
      const reply: Comment = {
        id: String(Date.now()),
        author: "Ana Fernandes",
        avatar: "AF",
        text: replyText,
        time: "Agora mesmo",
        likes: 0,
      };
      setComments(
        comments.map((c) =>
          c.id === commentId
            ? { ...c, replies: [...(c.replies || []), reply] }
            : c
        )
      );
      setReplyText("");
      setReplyingTo(null);
    }
  };

  const filterAndSortContents = () => {
    let filtered = contents;

    if (searchQuery) {
      filtered = filtered.filter(
        (content) =>
          content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          content.description.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((content) => content.category === selectedCategory);
    }

    if (selectedType !== "all") {
      filtered = filtered.filter((content) => content.type === selectedType);
    }

    switch (sortBy) {
      case "recent":
        filtered = [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case "popular":
        filtered = [...filtered].sort((a, b) => b.views - a.views);
        break;
      case "rating":
        filtered = [...filtered].sort((a, b) => b.rating - a.rating);
        break;
    }

    return filtered;
  };

  const filteredContents = filterAndSortContents();
  const displayedContents = filteredContents.slice(0, visibleCount);
  const hasMore = visibleCount < filteredContents.length;

  const loadMore = () => {
    setIsLoading(true);
    setTimeout(() => {
      setVisibleCount((prev) => prev + 6);
      setIsLoading(false);
    }, 800);
  };

  // Shared comment section component
  const CommentSection = ({ isDarkMode = false }: { isDarkMode?: boolean }) => (
    <div className={`mt-8 pt-6 border-t ${isDarkMode ? 'border-gray-200' : 'border-slate-200'}`}>
      <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-slate-800' : 'text-slate-900'} mb-6 flex items-center gap-2`}>
        <MessageCircle className={`w-5 h-5 ${isDarkMode ? 'text-purple-600' : 'text-red-600'}`} />
        Comentários ({comments.length})
      </h3>

      <div className="flex gap-3 mb-8">
        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 shadow-sm">
          AF
        </div>
        <div className="flex-1">
          <div className="relative">
            <Textarea
              placeholder="Adicione um comentário..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
              className={`w-full resize-none pr-12 ${isDarkMode ? 'bg-gray-50 border-gray-300 text-slate-800 placeholder:text-gray-400' : 'border-slate-200'} focus:border-red-300 focus:ring focus:ring-red-200 transition-all rounded-xl`}
            />
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              className="absolute bottom-3 right-3 bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all transform hover:scale-105"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-400 to-slate-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 shadow-sm">
              {comment.avatar}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`font-semibold ${isDarkMode ? 'text-slate-800' : 'text-slate-900'} text-sm`}>{comment.author}</span>
                <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-slate-500'}`}>{comment.time}</span>
              </div>
              
              {comment.isEditing ? (
                <div className="mb-3">
                  <Textarea
                    value={comment.editText}
                    onChange={(e) =>
                      setComments(
                        comments.map((c) =>
                          c.id === comment.id ? { ...c, editText: e.target.value } : c
                        )
                      )
                    }
                    rows={2}
                    className={`w-full resize-none text-sm ${isDarkMode ? 'bg-gray-50 border-gray-300 text-slate-800' : 'border-slate-200'} focus:border-blue-300 rounded-lg`}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleSaveEditComment(comment.id)}
                      className="text-xs bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 transition-colors flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Salvar
                    </button>
                    <button
                      onClick={() => handleCancelEditComment(comment.id)}
                      className="text-xs bg-slate-500 text-white px-3 py-1 rounded-md hover:bg-slate-600 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <p className={`text-sm ${isDarkMode ? 'text-slate-700' : 'text-slate-700'} mb-2 leading-relaxed`}>{comment.text}</p>
              )}
              
              <div className="flex items-center gap-4 opacity-70 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleLikeComment(comment.id)}
                  className={`flex items-center gap-1 text-xs transition-all ${
                    likedComments[comment.id] ? "text-red-600 font-semibold" : `${isDarkMode ? 'text-gray-600 hover:text-purple-600' : 'text-slate-500 hover:text-red-600'}`
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" fill={likedComments[comment.id] ? "currentColor" : "none"} />
                  <span>{comment.likes + (likedComments[comment.id] ? 1 : 0)}</span>
                </button>
                <button
                  onClick={() => handleReply(comment.id)}
                  className={`text-xs ${isDarkMode ? 'text-gray-600 hover:text-purple-600' : 'text-slate-500 hover:text-red-600'} transition-colors font-medium`}
                >
                  Responder
                </button>
                <button
                  onClick={() => handleEditComment(comment.id)}
                  className={`text-xs ${isDarkMode ? 'text-gray-600 hover:text-blue-600' : 'text-slate-500 hover:text-blue-600'} transition-colors font-medium flex items-center gap-1`}
                >
                  <Edit3 className="w-3 h-3" /> Editar
                </button>
                <button
                  onClick={() => handleDeleteCommentClick(comment.id)}
                  className={`text-xs ${isDarkMode ? 'text-gray-600 hover:text-red-600' : 'text-slate-500 hover:text-red-600'} transition-colors font-medium flex items-center gap-1 ml-auto`}
                >
                  <Trash2 className="w-3 h-3" /> Eliminar
                </button>
              </div>

              {replyingTo === comment.id && (
                <div className={`mt-4 ${isDarkMode ? 'bg-gray-50' : 'bg-slate-50'} rounded-lg p-4 border ${isDarkMode ? 'border-gray-200' : 'border-slate-200'}`}>
                  <Textarea
                    placeholder="Escreva sua resposta..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={2}
                    className={`w-full resize-none text-sm ${isDarkMode ? 'bg-white border-gray-300 text-slate-800' : 'border-slate-200'} focus:border-red-300 rounded-lg`}
                  />
                  <div className="flex justify-end gap-2 mt-3">
                    <button
                      onClick={() => setReplyingTo(null)}
                      className={`px-3 py-1.5 text-xs ${isDarkMode ? 'text-gray-600 hover:bg-gray-200' : 'text-slate-600 hover:bg-slate-200'} rounded transition-colors`}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleAddReply(comment.id)}
                      disabled={!replyText.trim()}
                      className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      Responder
                    </button>
                  </div>
                </div>
              )}

              {comment.replies && comment.replies.length > 0 && (
                <div className={`mt-4 pl-4 border-l-2 ${isDarkMode ? 'border-gray-200' : 'border-slate-200'} space-y-3`}>
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="flex gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-slate-300 to-slate-500 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                        {reply.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-semibold ${isDarkMode ? 'text-slate-800' : 'text-slate-900'} text-xs`}>{reply.author}</span>
                          <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-slate-500'}`}>{reply.time}</span>
                        </div>
                        <p className={`text-xs ${isDarkMode ? 'text-slate-600' : 'text-slate-600'} leading-relaxed`}>{reply.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Share Toast */}
      {showShareToast && (
        <div className="fixed top-6 right-6 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">{shareMessage}</span>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* SEÇÃO DO LIVRO DO DIA - ESTILO IMAGEM ANEXADA */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto relative z-10 px-[32px] py-[80px]">
          {/* Cabeçalho com ícone e botão explorar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 font-serif">
                  O Teu Espaço Literário
                  <span className="bg-amber-100 text-amber-700 text-xs px-2.5 py-0.5 rounded-full font-semibold font-sans">Trecho Diário</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Um momento de inspiração e cultura angolana</p>
              </div>
            </div>
            <button
              onClick={() => setIsLivroModalOpen(true)}
              className="text-amber-600 hover:text-amber-700 text-sm font-semibold flex items-center gap-1 transition-all hover:gap-2"
            >
              Explorar detalhes
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card Principal - Layout como na imagem */}
          <Card className="overflow-hidden border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-500">
            <div className="flex flex-col md:flex-row">
              {/* Lado esquerdo - Imagem do Livro/Capa com overlay */}
              <div 
                className="md:w-2/5 relative overflow-hidden min-h-[380px] flex items-center justify-center cursor-pointer group"
                onClick={() => setIsLivroModalOpen(true)}
                style={{
                  backgroundImage: `url(${livroAtual.autorImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center 30%',
                }}
              >
                {/* Overlay com gradiente escuro para destaque do texto */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/40"></div>
                
                {/* Conteúdo sobreposto - Centralizado e elegante */}
                <div className="relative z-10 text-center p-8 w-full transform transition-transform duration-300 group-hover:scale-105">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl mb-5 mx-auto border border-white/20">
                    <BookOpen className="w-8 h-8 text-white/90" />
                  </div>
                  <h3 className="font-bold text-white text-2xl leading-tight mb-2 font-serif">{livroAtual.titulo}</h3>
                  <p className="text-amber-200 text-base font-medium mb-2">{livroAtual.autor}</p>
                  <p className="text-white/70 text-xs mb-3">{livroAtual.ano} · {livroAtual.editora}</p>
                  <div className="flex justify-center gap-2 mb-4">
                    <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full font-medium">
                      {livroAtual.genero}
                    </span>
                  </div>
                  <div className="flex justify-center gap-4 text-white/60 text-xs">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" /> {livroAtual.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" /> {livroAtual.comentarios}
                    </span>
                  </div>
                </div>
              </div>

              {/* Lado direito - Trecho e citação */}
              <div className="md:w-3/5 relative p-8">
                {/* Ícone de citação decorativo */}
                <Quote className="absolute top-6 right-6 w-10 h-10 text-amber-200 opacity-60" />
                
                <div className="space-y-5">
                  {/* Data */}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    <span className="text-xs text-amber-600 font-semibold uppercase tracking-wide">
                      {new Date().toLocaleDateString("pt-AO", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  
                  {/* Título do trecho */}
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    Trecho do Dia
                    <span className="h-px flex-1 bg-gradient-to-r from-amber-200 to-transparent"></span>
                  </h3>
                  
                  {/* Trecho do livro */}
                  <p className="text-slate-700 leading-relaxed text-base italic">
                    "{livroAtual.trecho.substring(0, 280)}..."
                  </p>

                  {/* Citação em destaque com fundo amarelado */}
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-500 rounded-r-xl p-4 my-4">
                    <p className="text-amber-800 text-sm font-medium italic leading-relaxed">
                      {livroAtual.citacaoDestaque}
                    </p>
                  </div>

                  {/* Botões de ação */}
                  <div className="flex items-center gap-4 pt-2">
                    <button
                      onClick={() => setIsLivroModalOpen(true)}
                      className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all transform hover:scale-105 shadow-md"
                    >
                      <BookOpen className="w-4 h-4" />
                      Continuar lendo
                    </button>
                    
                    
                  </div>
                </div>

                {/* Navegação entre livros */}
                <div className="absolute bottom-6 right-6 flex items-center gap-2">
                  <button
                    onClick={handleLivroAnterior}
                    className="w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-300 flex items-center justify-center transition-all text-slate-600 hover:text-amber-600"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
                    {livroAtualIndex + 1}/{livrosDoDia.length}
                  </span>
                  <button
                    onClick={handleLivroProximo}
                    className="w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-300 flex items-center justify-center transition-all text-slate-600 hover:text-amber-600"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Hero Section - Minimalista e Focado */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent mb-4 text-[40px]">
              Biblioteca de Conteúdos
            </h1>
            <p className="text-xl text-slate-600 mb-8 leading-relaxed">
              Explore vídeos, textos e podcasts sobre a economia e história de Angola
            </p>

            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-md hover:shadow-lg transition-all transform hover:scale-105 px-6 py-2.5 rounded-xl font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Contribuir com Conteúdo
            </Button>

            <div className="relative max-w-xl mx-auto mt-10">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Pesquisar conteúdos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-slate-200 text-slate-900 rounded-xl focus:border-red-400 focus:ring-4 focus:ring-red-100 transition-all"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Categories Tabs */}
        <div className="mb-10">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const Icon = category.icon;
                const isActive = selectedCategory === category.id;

                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`group px-5 py-2.5 rounded-xl text-sm font-semibold transition-all transform hover:scale-105 ${
                      isActive
                        ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {category.label}
                      <span className={`text-xs ml-1 ${isActive ? "text-red-200" : "text-slate-500"}`}>
                        ({category.count})
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 border-slate-300 hover:border-red-400 hover:bg-red-50 transition-all rounded-xl"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? "Ocultar Filtros" : "Mostrar Filtros"}
            </Button>
          </div>

          {/* Type Filters */}
          <div className={`overflow-hidden transition-all duration-300 ${showFilters ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
            <div className="flex flex-wrap gap-2 mb-6 p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
              {contentTypes.map((type) => {
                const Icon = type.icon;
                const isActive = selectedType === type.id;

                return (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all transform hover:scale-105 ${
                      isActive
                        ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {type.label}
                  </button>
                );
              })}

              <div className="ml-auto flex items-center gap-3">
                <span className="text-sm text-slate-500 font-medium">Ordenar por:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 bg-white focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
                >
                  <option value="recent">📅 Mais Recentes</option>
                  <option value="popular">🔥 Mais Populares</option>
                  <option value="rating">⭐ Melhor Avaliados</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        {displayedContents.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayedContents.map((content, index) => {
                const TypeIcon = getTypeIcon(content.type);
                const typeColor = getTypeColor(content.type);

                return (
                  <Card
                    key={content.id}
                    className="group overflow-hidden hover:shadow-2xl transition-all duration-500 border-0 bg-white rounded-2xl hover:-translate-y-2 animate-fade-in-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div
                      className={`relative w-full h-56 overflow-hidden cursor-pointer`}
                      onClick={() => {
                        if (!content.requiresAccess) {
                          if (content.type === "video") handleOpenVideo(content);
                          else if (content.type === "texto_normal" || content.type === "texto_jindungo") handleOpenText(content);
                          else if (content.type === "podcast") handleOpenPodcast(content);
                        }
                      }}
                    >
                      {content.thumbnail ? (
                        <>
                          <img
                            src={content.thumbnail}
                            alt={content.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </>
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${content.imageColor} flex items-center justify-center`}>
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-all duration-300" />
                          <div className="relative z-10 transform group-hover:scale-110 transition-transform duration-300">
                            {content.imageIcon}
                          </div>
                        </div>
                      )}
                      <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md rounded-full px-3 py-1 text-xs text-white font-medium z-20 shadow-lg">
                        {content.duration}
                      </div>
                      <div className="absolute bottom-3 left-3 z-20">
                        <Badge className={`${typeColor} border-0 text-xs font-semibold px-2.5 py-1 shadow-md`}>
                          <TypeIcon className="w-3 h-3 mr-1" />
                          {getTypeLabel(content.type)}
                        </Badge>
                      </div>
                      {content.requiresAccess && (
                        <div className="absolute top-3 left-3 z-20">
                          <Badge className="bg-amber-500 text-white border-0 text-xs font-semibold px-2.5 py-1 shadow-md">
                            <Lock className="w-3 h-3 mr-1" />
                            Restrito
                          </Badge>
                        </div>
                      )}
                    </div>

                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-slate-800 mb-2 line-clamp-2 group-hover:text-red-600 transition-colors cursor-pointer"
                              onClick={() => {
                                if (!content.requiresAccess) {
                                  if (content.type === "video") handleOpenVideo(content);
                                  else if (content.type === "texto_normal" || content.type === "texto_jindungo") handleOpenText(content);
                                  else if (content.type === "podcast") handleOpenPodcast(content);
                                }
                              }}>
                            {content.title}
                          </h3>
                          <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                            {content.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-4 mb-3 text-xs">
                        <div className="flex items-center gap-1 text-slate-500">
                          <Eye className="w-3.5 h-3.5" />
                          <span>{content.views.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1 text-amber-500">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span className="font-semibold">{content.rating}</span>
                        </div>
                        
                      </div>

                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                        <div className="w-8 h-8 bg-gradient-to-br from-slate-500 to-slate-700 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {content.author.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-700 truncate">{content.author}</p>
                          <p className="text-xs text-slate-400">{content.date}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleLike(content.id)}
                            className={`p-1.5 rounded-lg transition-all hover:scale-110 ${
                              likedContents[content.id] ? "text-red-600 bg-red-50" : "text-slate-400 hover:text-red-600 hover:bg-red-50"
                            }`}
                            title="Gostei"
                          >
                            <ThumbsUp className="w-4 h-4" fill={likedContents[content.id] ? "currentColor" : "none"} />
                          </button>
                          <button
                            onClick={() => handleSave(content.id)}
                            className={`p-1.5 rounded-lg transition-all hover:scale-110 ${
                              savedContents[content.id] ? "text-amber-600 bg-amber-50" : "text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                            }`}
                            title="Guardar"
                          >
                            <Bookmark className="w-4 h-4" fill={savedContents[content.id] ? "currentColor" : "none"} />
                          </button>
                        </div>
                      </div>

                      {content.requiresAccess ? (
                        <Button
                          onClick={() => handleAccessRequest(content)}
                          variant="outline"
                          className="w-full mt-5 border-2 border-amber-500 text-amber-600 hover:bg-amber-50 hover:border-amber-600 rounded-xl font-semibold transition-all"
                        >
                          <Lock className="w-4 h-4 mr-2" />
                          Solicitar Acesso
                        </Button>
                      ) : (
                        <Button
                          onClick={() => {
                            if (content.type === "video") handleOpenVideo(content);
                            else if (content.type === "texto_normal" || content.type === "texto_jindungo") handleOpenText(content);
                            else if (content.type === "podcast") handleOpenPodcast(content);
                          }}
                          className="w-full mt-5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-semibold transition-all transform hover:scale-105 shadow-md"
                        >
                          {content.type === "video" && "▶ Assistir Agora"}
                          {content.type === "texto_normal" && "📖 Ler Agora"}
                          {content.type === "texto_jindungo" && "🌶️ Ler com Jindungo"}
                          {content.type === "podcast" && "🎧 Ouvir Agora"}
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-12">
                <Button
                  onClick={loadMore}
                  disabled={isLoading}
                  variant="outline"
                  className="px-8 py-3 border-2 border-red-600 text-red-600 hover:bg-red-50 hover:border-red-700 rounded-xl font-semibold transition-all transform hover:scale-105 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-2" />
                      Carregando...
                    </>
                  ) : (
                    <>
                      Carregar mais conteúdos
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card className="p-16 text-center bg-gradient-to-b from-slate-50 to-white border-0 shadow-sm rounded-2xl">
            <Search className="w-20 h-20 text-slate-300 mx-auto mb-5" />
            <h3 className="text-2xl font-bold text-slate-800 mb-3">Nenhum resultado encontrado</h3>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">
              Tente ajustar os filtros ou usar termos de pesquisa diferentes para encontrar o que procura.
            </p>
            <Button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setSelectedType("all");
              }}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl"
            >
              Limpar todos os filtros
            </Button>
          </Card>
        )}
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* MODAL DO LIVRO DO DIA */}
      {/* ═══════════════════════════════════════════════ */}
      <Dialog open={isLivroModalOpen} onOpenChange={setIsLivroModalOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0">
          <DialogTitle className="sr-only">Detalhes do Livro - {livroAtual.titulo}</DialogTitle>
          <DialogDescription className="sr-only">
            Visualização completa dos detalhes e informações sobre o livro selecionado
          </DialogDescription>
          <div className="bg-gradient-to-b from-slate-100 to-white">
            <div className="bg-gradient-to-r from-slate-700 to-red-800 p-8 text-white relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full -ml-24 -mb-24"></div>
              </div>
              <div className="relative z-10 flex items-start gap-6">
                <div className="w-32 h-44 bg-white rounded-lg shadow-2xl flex items-center justify-center flex-shrink-0 transform -rotate-3">
                  <BookOpen className="w-12 h-12 text-red-700" />
                </div>
                <div>
                  <span className="text-red-200 text-xs font-medium uppercase tracking-wider">Literatura Angolana</span>
                  <h2 className="text-2xl font-bold mt-1 mb-1">{livroAtual.titulo}</h2>
                  <p className="text-white/90 text-sm">{livroAtual.autor}</p>
                  <div className="flex items-center gap-3 mt-2 text-white/70 text-xs">
                    <span>{livroAtual.ano}</span>
                    <span>·</span>
                    <span>{livroAtual.editora}</span>
                    <span>·</span>
                    <Badge className="bg-white/20 text-white border-0 text-xs">
                      {livroAtual.genero}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="mb-6 bg-slate-50 rounded-xl p-5 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Sobre o Autor
                </h3>
                <p className="text-slate-700 text-sm leading-relaxed">{livroAtual.sobreAutor}</p>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Trecho do Dia
                </h3>
                <div className="bg-white border border-slate-200 rounded-xl p-6 relative">
                  <Quote className="absolute top-4 left-4 w-6 h-6 text-slate-300 opacity-50" />
                  <p className="text-slate-700 leading-relaxed text-sm whitespace-pre-line pl-6">
                    {livroAtual.trecho}
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-slate-100 to-slate-200 border-l-4 border-red-500 rounded-r-xl p-5 mb-6">
                <p className="text-red-800 text-base font-medium italic">
                  {livroAtual.citacaoDestaque}
                </p>
              </div>

              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-200">
                <button
                  onClick={handleFavoritarLivro}
                  className={`flex items-center gap-2 text-sm transition-all ${
                    isLivroFavorito ? "text-yellow-500 font-semibold" : "text-slate-600 hover:text-yellow-500"
                  }`}
                >
                  <Star className="w-5 h-5" fill={isLivroFavorito ? "currentColor" : "none"} />
                  <span>{isLivroFavorito ? "Favoritado" : "Favoritar"} ({livroAtual.likes})</span>
                </button>
                <button onClick={handleShare} className="flex items-center gap-2 text-sm text-slate-600 hover:text-red-600 transition-colors">
                  <Share2 className="w-4 h-4" />
                  <span>Compartilhar</span>
                </button>
                <button onClick={handleReport} className="flex items-center gap-2 text-sm text-slate-600 hover:text-red-600 transition-colors ml-auto">
                  <Flag className="w-4 h-4" />
                  <span>Denunciar</span>
                </button>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Comentários sobre esta leitura ({comentariosLivro.length})
                </h3>

                <div className="flex gap-3 mb-6">
                  <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    AF
                  </div>
                  <div className="flex-1">
                    <div className="relative">
                      <Textarea
                        placeholder="Compartilhe a sua reflexão sobre esta leitura..."
                        value={novoComentarioLivro}
                        onChange={(e) => setNovoComentarioLivro(e.target.value)}
                        rows={3}
                        className="w-full resize-none pr-12"
                      />
                      <button
                        onClick={handleAdicionarComentarioLivro}
                        disabled={!novoComentarioLivro.trim()}
                        className="absolute bottom-3 right-3 bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {comentariosLivro.map((comentario) => (
                    <div key={comentario.id} className="flex gap-3">
                      <div className="w-10 h-10 bg-slate-400 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {comentario.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-slate-900 text-sm">{comentario.autor}</span>
                          <span className="text-xs text-slate-500">{comentario.tempo}</span>
                        </div>
                        
                        {editandoComentarioLivro === comentario.id ? (
                          <div className="mb-2">
                            <Textarea
                              value={textoEdicaoLivro}
                              onChange={(e) => setTextoEdicaoLivro(e.target.value)}
                              rows={2}
                              className="w-full resize-none text-sm"
                            />
                            <div className="flex gap-2 mt-1">
                              <button
                                onClick={() => handleSalvarEdicaoLivro(comentario.id)}
                                className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" /> Salvar
                              </button>
                              <button
                                onClick={() => setEditandoComentarioLivro(null)}
                                className="text-xs text-slate-500 hover:text-slate-700 font-medium"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-700 mb-2">{comentario.texto}</p>
                        )}
                        
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => handleLikeComentarioLivro(comentario.id)}
                            className={`flex items-center gap-1 text-xs transition-colors ${
                              likedComentariosLivro[comentario.id] ? "text-red-600 font-semibold" : "text-slate-500 hover:text-red-600"
                            }`}
                          >
                            <ThumbsUp className="w-3.5 h-3.5" fill={likedComentariosLivro[comentario.id] ? "currentColor" : "none"} />
                            <span>{comentario.likes + (likedComentariosLivro[comentario.id] ? 1 : 0)}</span>
                          </button>
                          <button
                            onClick={() => handleEditarComentarioLivro(comentario.id)}
                            className="text-xs text-slate-500 hover:text-blue-600 transition-colors font-medium flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3" /> Editar
                          </button>
                          <button
                            onClick={() => handleDeletarComentarioLivro(comentario.id)}
                            className="text-xs text-slate-500 hover:text-red-600 transition-colors font-medium flex items-center gap-1 ml-auto"
                          >
                            <Trash2 className="w-3 h-3" /> Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════ */}
      {/* MODAL DE VÍDEO */}
      {/* ═══════════════════════════════════════════════ */}
      <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <DialogTitle className="sr-only">
            {videoContent?.title || "Visualização de Vídeo"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Player de vídeo e informações sobre o conteúdo selecionado
          </DialogDescription>
          {videoContent && (
            <div>
              <div className={`relative w-full aspect-video ${videoContent.thumbnail ? 'bg-slate-200' : `bg-gradient-to-br ${videoContent.imageColor}`} flex items-center justify-center overflow-hidden`}>
                {videoContent.thumbnail ? (
                  <img
                    src={videoContent.thumbnail}
                    alt={videoContent.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <>
                    <div className="absolute inset-0 bg-black/40" />
                    <div className="relative z-10 flex items-center justify-center">
                      <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center shadow-2xl cursor-pointer hover:scale-110 transition-transform">
                        <Play className="w-8 h-8 text-red-600 ml-1" fill="currentColor" />
                      </div>
                    </div>
                  </>
                )}
                <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm rounded-md px-3 py-1 text-white text-sm z-10">
                  {videoContent.duration}
                </div>
              </div>

              <div className="p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-3">{videoContent.title}</h2>

                <div className="flex items-center justify-between flex-wrap gap-4 mb-4 pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {videoContent.author.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{videoContent.author}</p>
                      <p className="text-xs text-slate-500">{videoContent.date} · {videoContent.duration}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-sm text-slate-600">
                      <Eye className="w-4 h-4" />
                      <span>{videoContent.views}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-slate-600">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span>{videoContent.rating}</span>
                    </div>
                    
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {videoContent.tags.map((tag) => (
                    <span key={tag} className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-xs">
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="bg-slate-50 rounded-lg p-5 mb-6">
                  <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                    {videoContent.content || videoContent.description}
                  </p>
                </div>

                <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-200">
                  <button
                    onClick={() => handleLike(videoContent.id)}
                    className={`flex items-center gap-2 text-sm transition-colors ${
                      likedContents[videoContent.id] ? "text-red-600 font-semibold" : "text-slate-600 hover:text-red-600"
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4" fill={likedContents[videoContent.id] ? "currentColor" : "none"} />
                    <span>Gostei</span>
                  </button>
                  <button
                    onClick={() => handleDislike(videoContent.id)}
                    className={`flex items-center gap-2 text-sm transition-colors ${
                      dislikedContents[videoContent.id] ? "text-red-600 font-semibold" : "text-slate-600 hover:text-red-600"
                    }`}
                  >
                    <ThumbsDown className="w-4 h-4" fill={dislikedContents[videoContent.id] ? "currentColor" : "none"} />
                  </button>
                  <button onClick={handleShare} className="flex items-center gap-2 text-sm text-slate-600 hover:text-red-600 transition-colors">
                    <Share2 className="w-4 h-4" />
                    <span>Compartilhar</span>
                  </button>
                  <button onClick={handleReport} className="flex items-center gap-2 text-sm text-slate-600 hover:text-red-600 transition-colors ml-auto">
                    <Flag className="w-4 h-4" />
                    <span>Denunciar</span>
                  </button>
                </div>

                <CommentSection />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════ */}
      {/* MODAL DE TEXTO */}
      {/* ═══════════════════════════════════════════════ */}
      <Dialog open={isTextModalOpen} onOpenChange={setIsTextModalOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0">
          <DialogTitle className="sr-only">
            {textContent?.title || "Visualização de Texto"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Conteúdo de texto completo com informações e seção de comentários
          </DialogDescription>
          {textContent && (
            <div>
              <div className={`relative w-full ${textContent.thumbnail ? 'h-56' : 'h-40'} ${textContent.thumbnail ? 'bg-slate-200' : `bg-gradient-to-br ${textContent.imageColor}`} flex items-center justify-center overflow-hidden`}>
                {textContent.thumbnail ? (
                  <img
                    src={textContent.thumbnail}
                    alt={textContent.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <>
                    <div className="absolute inset-0 bg-black/30" />
                    <div className="relative z-10 text-center text-white">
                      {textContent.imageIcon}
                    </div>
                  </>
                )}
              </div>

              <div className="p-8">
                <div className="mb-6">
                  <span className="inline-block bg-red-100 text-red-700 text-xs px-3 py-1 rounded-full font-medium mb-4">
                    {textContent.tags[0]}
                  </span>
                  <h1 className="text-3xl font-bold text-slate-900 mb-3 leading-tight">{textContent.title}</h1>
                  <p className="text-lg text-slate-600 mb-6">{textContent.description}</p>
                  
                  <div className="flex items-center gap-3 pb-6 border-b border-slate-200">
                    <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {textContent.author.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{textContent.author}</p>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span>{textContent.date}</span>
                        <span>·</span>
                        <span>{textContent.duration} de leitura</span>
                      </div>
                    </div>
                  </div>
                </div>

                <article className="prose prose-slate max-w-none mb-8">
                  <div className="text-slate-700 leading-relaxed text-base whitespace-pre-line">
                    {textContent.content || textContent.description}
                  </div>
                </article>

                <div className="flex flex-wrap gap-2 mb-6 pt-4 border-t border-slate-200">
                  {textContent.tags.map((tag) => (
                    <span key={tag} className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-medium">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-200">
                  <button
                    onClick={() => handleLike(textContent.id)}
                    className={`flex items-center gap-2 text-sm transition-colors ${
                      likedContents[textContent.id] ? "text-red-600 font-semibold" : "text-slate-600 hover:text-red-600"
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4" fill={likedContents[textContent.id] ? "currentColor" : "none"} />
                    <span>Gostei</span>
                  </button>
                  <button onClick={handleShare} className="flex items-center gap-2 text-sm text-slate-600 hover:text-red-600 transition-colors">
                    <Share2 className="w-4 h-4" />
                    <span>Compartilhar</span>
                  </button>
                  <button
                    onClick={() => handleSave(textContent.id)}
                    className={`flex items-center gap-2 text-sm transition-colors ${
                      savedContents[textContent.id] ? "text-red-600 font-semibold" : "text-slate-600 hover:text-red-600"
                    }`}
                  >
                    <BookOpen className="w-4 h-4" fill={savedContents[textContent.id] ? "currentColor" : "none"} />
                    <span>{savedContents[textContent.id] ? "Guardado" : "Guardar"}</span>
                  </button>
                  <button onClick={handleReport} className="flex items-center gap-2 text-sm text-slate-600 hover:text-red-600 transition-colors ml-auto">
                    <Flag className="w-4 h-4" />
                    <span>Denunciar</span>
                  </button>
                </div>

                <CommentSection />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════ */}
      {/* MODAL DE PODCAST */}
      {/* ═══════════════════════════════════════════════ */}
      <Dialog open={isPodcastModalOpen} onOpenChange={setIsPodcastModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto p-0 bg-gradient-to-b from-gray-50 to-white">
          <DialogTitle className="sr-only">
            {podcastContent?.title || "Visualização de Podcast"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Player de podcast com episódios e seção de comentários
          </DialogDescription>
          {podcastContent && (
            <div className="text-slate-800">
              <div className="bg-gradient-to-b from-gray-100 to-white p-8 border-b border-gray-200">
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
                  <div className={`w-52 h-52 ${podcastContent.thumbnail ? 'bg-gray-100' : `bg-gradient-to-br ${podcastContent.imageColor}`} rounded-lg shadow-lg flex-shrink-0 flex items-center justify-center overflow-hidden relative`}>
                    {podcastContent.thumbnail ? (
                      <img
                        src={podcastContent.thumbnail}
                        alt={podcastContent.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Mic className="w-24 h-24 text-gray-500/60" />
                    )}
                  </div>
                  
                  <div className="flex-1 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-red-600 mb-2 block">Podcast</span>
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4 leading-tight">{podcastContent.title}</h2>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
                      <span className="text-slate-700 font-medium">{podcastContent.author}</span>
                      <span>•</span>
                      <span>{podcastContent.episodes?.length || 0} Episódios</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handlePlayEpisode(podcastContent.episodes?.[0]?.id || "")}
                        className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-md hover:bg-red-700"
                      >
                        {isPlaying && playingEpisodeId ? (
                          <Pause className="w-6 h-6 text-white" fill="currentColor" />
                        ) : (
                          <Play className="w-6 h-6 text-white ml-1" fill="currentColor" />
                        )}
                      </button>
                      <button
                        onClick={() => handlePodcastFavorite(podcastContent.id)}
                        className={`transition-colors ${
                          podcastFavorites[podcastContent.id] ? "text-red-600" : "text-gray-500 hover:text-red-600"
                        }`}
                      >
                        <Heart className="w-6 h-6" fill={podcastFavorites[podcastContent.id] ? "currentColor" : "none"} />
                      </button>
                      <button onClick={handleShare} className="text-gray-500 hover:text-red-600 transition-colors">
                        <Share2 className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {isPlaying && playingEpisodeId && (
                <div className="bg-gray-100 border-b border-gray-200 px-6 py-3 flex items-center gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-red-100 rounded flex items-center justify-center">
                      <Volume2 className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-slate-800 text-sm font-medium truncate">
                        {podcastContent.episodes?.find((ep) => ep.id === playingEpisodeId)?.title || "Reproduzindo..."}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="h-1 w-24 bg-gray-300 rounded-full overflow-hidden">
                          <div className="h-full bg-red-600 rounded-full w-1/3 animate-pulse"></div>
                        </div>
                        <span className="text-xs text-gray-500">Em reprodução</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => { setIsPlaying(false); setPlayingEpisodeId(null); }}
                    className="text-gray-500 hover:text-red-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}

              <div className="p-8">
                <div className="mb-6">
                  <p className="text-gray-700 text-sm leading-relaxed">{podcastContent.description}</p>
                </div>

                <h3 className="text-lg font-bold text-slate-800 mb-4">Episódios</h3>
                <div className="space-y-1">
                  {podcastContent.episodes?.map((ep) => (
                    <div
                      key={ep.id}
                      className={`bg-gray-50 hover:bg-gray-100 rounded-lg p-4 transition-colors group ${
                        currentEpisode?.id === ep.id ? 'border border-red-300 bg-red-50/30' : 'border border-transparent'
                      } ${playingEpisodeId === ep.id ? 'border border-red-300 bg-red-50/30' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <button
                            onClick={() => handlePlayEpisode(ep.id)}
                            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-red-600 flex-shrink-0 transition-colors"
                          >
                            {playingEpisodeId === ep.id && isPlaying ? (
                              <Pause className="w-5 h-5" fill="currentColor" />
                            ) : (
                              <Play className="w-5 h-5" fill="currentColor" />
                            )}
                          </button>
                          <div className="min-w-0 cursor-pointer" onClick={() => setCurrentEpisode(ep)}>
                            <p className="text-slate-800 font-medium text-sm group-hover:text-red-600 transition-colors truncate">
                              {ep.title}
                            </p>
                            <p className="text-gray-500 text-xs mt-0.5">{ep.duration} · {ep.date}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddToPlaylist(ep.id)}
                          className={`ml-2 text-xs font-medium transition-colors ${
                            playlistItems[ep.id] ? "text-red-600" : "text-gray-500 hover:text-red-600"
                          }`}
                        >
                          {playlistItems[ep.id] ? "✓ Na playlist" : "+ Adicionar à playlist"}
                        </button>
                      </div>
                      {currentEpisode?.id === ep.id && (
                        <div className="mt-3 pl-12 text-sm text-gray-600">
                          {ep.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <CommentSection isDarkMode={false} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════ */}
      {/* MODAL DE SOLICITAR ACESSO */}
      {/* ═══════════════════════════════════════════════ */}
      <Dialog open={isAccessModalOpen} onOpenChange={setIsAccessModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">
              Solicitar Acesso
            </DialogTitle>
            <DialogDescription className="sr-only">
              Formulário para solicitar acesso a conteúdo privado
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <p className="text-sm text-slate-600 mb-4">
              Este conteúdo requer aprovação. A solicitação será analisada.
            </p>

            <div className="bg-slate-50 rounded-lg p-4 mb-4 border border-slate-200">
              <p className="font-semibold text-slate-900 mb-1">Conteúdo:</p>
              <p className="text-red-600 font-medium">{selectedContent?.title}</p>
              <p className="text-sm text-slate-600 mt-1">{selectedContent?.description}</p>
            </div>

            <div className="mb-4">
              <Label htmlFor="reason" className="text-sm font-medium text-slate-700 mb-2 block">
                Por que deseja acesso? (Opcional)
              </Label>
              <Textarea
                id="reason"
                placeholder="Ex: Pesquisa acadêmica..."
                value={accessReason}
                onChange={(e) => setAccessReason(e.target.value)}
                rows={4}
                className="w-full resize-none"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-3 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setIsAccessModalOpen(false);
                setAccessReason("");
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmitAccess} className="bg-red-600 hover:bg-red-700">
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════ */}
      {/* MODAL DE DENÚNCIA */}
      {/* ═══════════════════════════════════════════════ */}
      <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Denunciar Conteúdo
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600">
              A sua denúncia será analisada pela equipa de moderação.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div>
              <Label htmlFor="reportReason" className="text-sm font-medium text-slate-700 mb-2 block">
                Motivo da denúncia *
              </Label>
              <select
                id="reportReason"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              >
                <option value="">Selecione um motivo...</option>
                <option value="ofensivo">Linguagem Ofensiva</option>
                <option value="spam">Spam ou Publicidade</option>
                <option value="assedio">Assédio ou Bullying</option>
                <option value="desinformacao">Desinformação</option>
                <option value="inapropriado">Conteúdo Inapropriado</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            <div>
              <Label htmlFor="reportDescription" className="text-sm font-medium text-slate-700 mb-2 block">
                Detalhes adicionais
              </Label>
              <Textarea
                id="reportDescription"
                placeholder="Descreva o problema com mais detalhes..."
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                rows={4}
                className="w-full resize-none"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-3 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setIsReportModalOpen(false);
                setReportReason("");
                setReportDescription("");
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitReport}
              disabled={!reportReason}
              className="bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              Enviar Denúncia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════ */}
      {/* MODAL DE CONFIRMAÇÃO DE ELIMINAÇÃO */}
      {/* ═══════════════════════════════════════════════ */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              Confirmar Eliminação
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600">
              Tem certeza que deseja eliminar este comentário? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-3 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDeleteTarget(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════ */}
      {/* MODAL DE ADICIONAR CONTEÚDO */}
      {/* ═══════════════════════════════════════════════ */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sticky top-0 bg-white z-10 pb-4 border-b">
            <DialogTitle className="text-2xl font-bold text-slate-900">
              Adicionar Novo Conteúdo
            </DialogTitle>
            <DialogDescription className="sr-only">
              Formulário para adicionar novo conteúdo educativo à plataforma
            </DialogDescription>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setModoAdicao("editor")}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  modoAdicao === "editor"
                    ? "bg-red-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Editor
              </button>
              <button
                onClick={() => setModoAdicao("preview")}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  modoAdicao === "preview"
                    ? "bg-red-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Preview
              </button>
            </div>
          </DialogHeader>

          {modoAdicao === "editor" ? (
            <div className="mt-4 space-y-4">
              <div>
                <Label className="text-sm font-medium text-slate-700 mb-2 block">
                  Tipo de Conteúdo *
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "video", label: "Vídeo", icon: Play },
                    { id: "texto", label: "Texto", icon: FileText },
                    { id: "podcast", label: "Podcast", icon: Headphones },
                    { id: "jindungo", label: "Texto Jindungo", icon: BookOpen },
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() =>
                        setNewContent({
                          ...newContent,
                          type: type.id,
                        })
                      }
                      className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                        newContent.type === type.id
                          ? "border-red-500 bg-red-50 text-red-600"
                          : "border-slate-200 hover:border-slate-300 text-slate-600"
                      }`}
                    >
                      <type.icon className="w-5 h-5" />
                      <span className="text-xs font-medium">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="title" className="text-sm font-medium text-slate-700 mb-2 block">
                  Título *
                </Label>
                <Input
                  id="title"
                  placeholder="Digite o título do conteúdo..."
                  value={newContent.title}
                  onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium text-slate-700 mb-2 block">
                  Descrição
                </Label>
                <Textarea
                  id="description"
                  placeholder="Descreva o conteúdo..."
                  value={newContent.description}
                  onChange={(e) => setNewContent({ ...newContent, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="category" className="text-sm font-medium text-slate-700 mb-2 block">
                  Categoria *
                </Label>
                <select
                  id="category"
                  value={newContent.category}
                  onChange={(e) => setNewContent({ ...newContent, category: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Selecione...</option>
                  <option value="historia">História</option>
                  <option value="economia">Economia</option>
                  <option value="cultura">Cultura</option>
                </select>
              </div>

              <div>
                <Label htmlFor="duration" className="text-sm font-medium text-slate-700 mb-2 block">
                  Duração
                </Label>
                <Input
                  id="duration"
                  placeholder="Ex: 15 min"
                  value={newContent.duration}
                  onChange={(e) => setNewContent({ ...newContent, duration: e.target.value })}
                />
              </div>

              {/* Podcast Episodes Section */}
              {newContent.type === "podcast" && (
                <div className="border border-slate-300 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-slate-900">Episódios do Podcast</h4>
                  
                  {newContent.episodes.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {newContent.episodes.map((ep) => (
                        <div key={ep.id} className="flex items-center justify-between bg-slate-50 rounded-lg p-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{ep.title}</p>
                            <p className="text-xs text-slate-500">{ep.duration} · {ep.date}</p>
                            {ep.audioFileName && (
                              <p className="text-xs text-green-600 flex items-center gap-1 mt-0.5">
                                <FileAudio className="w-3 h-3" />
                                {ep.audioFileName}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveEpisode(ep.id)}
                            className="text-red-500 hover:text-red-700 ml-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2 p-3 bg-slate-50 rounded-lg">
                    <Input
                      placeholder="Título do episódio"
                      value={newContent.newEpisode.title}
                      onChange={(e) =>
                        setNewContent({
                          ...newContent,
                          newEpisode: { ...newContent.newEpisode, title: e.target.value },
                        })
                      }
                    />
                    <div className="flex gap-2">
                      <Input
                        placeholder="Duração (ex: 20:15)"
                        value={newContent.newEpisode.duration}
                        onChange={(e) =>
                          setNewContent({
                            ...newContent,
                            newEpisode: { ...newContent.newEpisode, duration: e.target.value },
                          })
                        }
                        className="flex-1"
                      />
                      <Input
                        placeholder="Data"
                        value={newContent.newEpisode.date}
                        onChange={(e) =>
                          setNewContent({
                            ...newContent,
                            newEpisode: { ...newContent.newEpisode, date: e.target.value },
                          })
                        }
                        className="flex-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-slate-700 mb-1 block">
                        Arquivo de Áudio
                      </Label>
                      <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-red-400 transition-colors cursor-pointer">
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setNewContent({
                              ...newContent,
                              newEpisode: {
                                ...newContent.newEpisode,
                                audioFile: file,
                                audioFileName: file?.name || "",
                              },
                            });
                          }}
                          className="hidden"
                          id="audio-upload"
                        />
                        <label htmlFor="audio-upload" className="cursor-pointer">
                          <Music className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                          <p className="text-xs text-slate-600">
                            {newContent.newEpisode.audioFileName || "Clique ou arraste para enviar áudio"}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">MP3, WAV, AAC</p>
                        </label>
                      </div>
                    </div>
                    <Textarea
                      placeholder="Descrição do episódio"
                      value={newContent.newEpisode.description}
                      onChange={(e) =>
                        setNewContent({
                          ...newContent,
                          newEpisode: { ...newContent.newEpisode, description: e.target.value },
                        })
                      }
                      rows={2}
                    />
                    <Button
                      onClick={handleAddEpisode}
                      disabled={!newContent.newEpisode.title || !newContent.newEpisode.duration}
                      className="w-full bg-slate-700 hover:bg-slate-800 text-white"
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Adicionar Episódio
                    </Button>
                  </div>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium text-slate-700 mb-2 block">
                  Imagem de Capa
                </Label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-red-400 transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">Clique ou arraste</p>
                  <p className="text-xs text-slate-400 mt-1">PNG, JPG até 5MB</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">Conteúdo Restrito</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newContent.isRestricted}
                    onChange={(e) =>
                      setNewContent({
                        ...newContent,
                        isRestricted: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 rounded-full peer peer-checked:bg-red-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-6">
              <div className="bg-slate-50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    AF
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Ana Fernandes</p>
                    <p className="text-sm text-slate-500">Agora mesmo</p>
                  </div>
                </div>

                {newContent.category && (
                  <span className="inline-block bg-red-100 text-red-700 text-xs px-3 py-1 rounded-full font-medium mb-4">
                    {newContent.category}
                  </span>
                )}

                <h3 className="text-2xl font-bold text-slate-900 mb-3">
                  {newContent.title || "Título do conteúdo"}
                </h3>

                {newContent.type === "podcast" && newContent.episodes.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-slate-700 mb-2">Episódios:</p>
                    <div className="space-y-1">
                      {newContent.episodes.map((ep, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                          <Play className="w-3 h-3" />
                          <span>{ep.title}</span>
                          <span className="text-slate-400">· {ep.duration}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {newContent.description || "Nenhuma descrição adicionada ainda..."}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="sticky bottom-0 bg-white z-10 pt-4 border-t mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false);
                setModoAdicao("editor");
                setNewContent({
                  title: "",
                  description: "",
                  category: "",
                  type: "",
                  duration: "",
                  coverImage: null,
                  isRestricted: false,
                  episodes: [],
                  newEpisode: { title: "", duration: "", description: "", date: "", audioFile: null, audioFileName: "" },
                });
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleAddContent} className="bg-red-600 hover:bg-red-700">
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}