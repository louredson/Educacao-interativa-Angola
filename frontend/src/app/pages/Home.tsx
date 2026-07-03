import { Link } from 'react-router'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowRight, BookOpen, GraduationCap, MapPin, MessageSquare,
  TrendingUp, Compass, HelpCircle, Sparkles, Award, Zap, ChevronDown, ChevronUp, Lock
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import HeroCarousel from '../components/HeroCarousel'
import { useAuth } from '../contexts/AuthContext'
import AuthPrompt from '../components/AuthPrompt'
import { apiRequest } from '../services/api'

export default function Home() {
  const { isAuthenticated } = useAuth()
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)
  const [tooltip, setTooltip] = useState({ visible: false, content: '', x: 0, y: 0 })
  const [openFaqs, setOpenFaqs] = useState<number[]>([])
  const [platformStats, setPlatformStats] = useState({
    total_conteudos: 0,
    total_perguntas_quiz: 0,
    total_topicos: 0,
    total_utilizadores: 0,
  })

  useEffect(() => {
    apiRequest<typeof platformStats>('/stats')
      .then(data => { if (data) setPlatformStats(data) })
      .catch(() => { /* silencioso — mantém zeros */ })
  }, [])

  const toggleFaq = (index: number) => {
    setOpenFaqs(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  const PROVINCIAS: Record<string, { governador: string; capital: string; municipios: number; extensao: string; linguas: string; etnia: string }> = {
    cuando:       { governador: 'Carla Maria Domingas Cativa',                capital: 'Mavinga',      municipios: 9,  extensao: '199.049 km²', linguas: 'Português, Nganguela',          etnia: 'Ovanganguela' },
    cubango:      { governador: 'José Martins',                               capital: 'Menongue',     municipios: 11, extensao: '199.049 km²', linguas: 'Português, Nganguela',          etnia: 'Ovanganguela' },
    moxico:       { governador: 'Ernesto Muangala',                           capital: 'Luena',        municipios: 12, extensao: '223.023 km²', linguas: 'Português, Cokwe, Nganguela',   etnia: 'Ovanga' },
    moxico_leste: { governador: 'Crispiniano Vivaldino Evaristo dos Santos',  capital: 'Cazombo',      municipios: 9,  extensao: '223.023 km²', linguas: 'Português, Cokwe',              etnia: 'Lunda-Quioco' },
    lunda_sul:    { governador: 'Gildo Matias José',                          capital: 'Saurimo',      municipios: 14, extensao: '77.636 km²',  linguas: 'Português, Cokwe',              etnia: 'Cokwe' },
    lunda_norte:  { governador: 'Filomena Elizabete Chitula Miza Aires',      capital: 'Dundo',        municipios: 19, extensao: '103.760 km²', linguas: 'Português, Cokwe',              etnia: 'Cokwe' },
    malanje:      { governador: 'Marcos Alexandre Nhunga',                    capital: 'Malanje',      municipios: 27, extensao: '97.602 km²',  linguas: 'Português, Kimbundu',           etnia: 'Ambundu' },
    bie:          { governador: 'Celeste Elavoco David Adolfo',               capital: 'Cuito',        municipios: 19, extensao: '70.314 km²',  linguas: 'Português, Umbundu',            etnia: 'Bailundo' },
    uige:         { governador: 'José Carvalho da Rocha',                     capital: 'Uíge',         municipios: 23, extensao: '58.698 km²',  linguas: 'Português, Kimbundu, Kikongo',  etnia: 'Ambundu, Bakongo' },
    cunene:       { governador: 'Gerdina Ulipamue Didalelwa',                 capital: 'Cuanhama',     municipios: 14, extensao: '78.342 km²',  linguas: 'Português, Oshiwambo',          etnia: 'Ovambu' },
    huila:        { governador: 'Nuno Bernabé Mahapi Dala',                   capital: 'Lubango',      municipios: 23, extensao: '79.022 km²',  linguas: 'Português, Umbundu, Olunhaneka', etnia: 'Ovambu' },
    namibe:       { governador: 'Augusto Archer de Sousa Mangueira',          capital: 'Moçâmedes',    municipios: 9,  extensao: '58.137 km²',  linguas: 'Português, Oluherero',          etnia: 'Minoria Oluyaneka' },
    huambo:       { governador: 'Pereira Alfredo',                            capital: 'Huambo',       municipios: 17, extensao: '34.270 km²',  linguas: 'Português, Umbundu',            etnia: 'Ovimbundu' },
    benguela:     { governador: 'Manuel Nunes Júnior',                        capital: 'Benguela',     municipios: 23, extensao: '39.827 km²',  linguas: 'Português, Umbundu, Ohvanyaneka', etnia: 'Ovimbundu, Ohvanyaneka' },
    cuanza_sul:   { governador: 'Eugénio César Laborinho',                    capital: 'Sumbe',        municipios: 24, extensao: '55.660 km²',  linguas: 'Português, Kimbundu, Umbundu',  etnia: 'Ambundu, Ovimbundu' },
    zaire:        { governador: 'Adriano Mendes de Carvalho',                 capital: 'Mbanza Kongo', municipios: 11, extensao: '40.130 km²',  linguas: 'Português, Kikongo',            etnia: 'Bakongo' },
    cuanza_norte: { governador: 'João Diogo Gaspar',                          capital: 'Cazengo',      municipios: 17, extensao: '24.110 km²',  linguas: 'Português, Kimbundu',           etnia: 'Ambundu' },
    bengo:        { governador: 'Maria Antónia Nelumba',                      capital: 'Dande',        municipios: 12, extensao: '31.371 km²',  linguas: 'Português, Kimbundu, Kikongo',  etnia: 'Ambundu, Bakongo' },
    cabinda:      { governador: 'Suzana Fernanda Pemba Massiala de Abreu',    capital: 'Cabinda',      municipios: 10, extensao: '7.283 km²',   linguas: 'Português, Fiote, Kikongo',     etnia: 'Bakongo' },
    luanda:       { governador: 'Luís Manuel da Fonseca Nunes',               capital: 'Ingombota',    municipios: 16, extensao: '2.418 km²',   linguas: 'Português, Kimbundu',           etnia: 'Ambundu' },
    icolo_bengo:  { governador: 'Auzílio de Oliveira Martins Jacob',          capital: 'Catete',       municipios: 7,  extensao: '3.059 km²',   linguas: 'Português, Kimbundu',           etnia: 'Ambundu' },
  }

  const buildTooltip = (key: string) => {
    const p = PROVINCIAS[key]
    if (!p) return ''
    const y = '#FECD29'
    return `<b>Capital:</b> <span style="color:${y}">${p.capital}</span><br>` +
      `<b>Governador:</b> <span style="color:${y}">${p.governador}</span><br>` +
      `<b>Municípios:</b> <span style="color:${y}">${p.municipios}</span><br>` +
      `<b>Extensão:</b> <span style="color:${y}">${p.extensao}</span><br>` +
      `<b>Línguas:</b> <span style="color:${y}">${p.linguas}</span><br>` +
      `<b>Etnia:</b> <span style="color:${y}">${p.etnia}</span>`
  }

  useEffect(() => {
    const handleOver = (e: MouseEvent) => {
      const target = e.target as SVGElement | null
      const prov = target?.getAttribute?.('data-prov')
      if (prov) {
        setTooltip({ visible: true, content: buildTooltip(prov), x: e.clientX + 15, y: e.clientY - 10 })
      } else {
        setTooltip(prev => ({ ...prev, visible: false }))
      }
    }
    const handleMove = (e: MouseEvent) => {
      setTooltip(prev => prev.visible ? { ...prev, x: e.clientX + 15, y: e.clientY - 10 } : prev)
    }
    const handleOut = () => setTooltip(prev => ({ ...prev, visible: false }))

    document.addEventListener('mouseover', handleOver)
    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseout', handleOut)
    return () => {
      document.removeEventListener('mouseover', handleOver)
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseout', handleOut)
    }
  }, [])

  const fmt = (n: number) => n > 0 ? `${n}+` : '…'

  const features = [
    {
      icon: Compass,
      title: 'Explorar Biblioteca',
      description: 'Acesse vídeos envolventes, textos profundos, podcasts inspiradores e microtextos sobre economia e história.',
      link: '/explorar',
      color: 'from-yellow-500 to-yellow-600',
      bgGlow: 'from-yellow-500/20 to-transparent',
      stat: fmt(platformStats.total_conteudos) + ' Conteúdos',
    },
    {
      icon: MapPin,
      title: 'Recursos Interativos',
      description: 'Mapas, gráficos e visualizações de dados para compreender a economia angolana territorialmente.',
      link: '/resources',
      color: 'from-blue-500 to-blue-600',
      bgGlow: 'from-blue-500/20 to-transparent',
      stat: fmt(platformStats.total_perguntas_quiz) + ' Questões',
    },
    {
      icon: MessageSquare,
      title: 'Espaço de Debate',
      description: 'Participe de discussões sobre temas económicos e históricos relevantes para Angola.',
      link: '/forum',
      color: 'from-green-500 to-green-600',
      bgGlow: 'from-green-500/20 to-transparent',
      stat: 'Debates Ativos',
    },
  ]

  const statsData = [
    { value: fmt(platformStats.total_conteudos),      label: 'Conteúdos para Explorar', icon: BookOpen },
    { value: fmt(platformStats.total_perguntas_quiz), label: 'Questões de Quiz',         icon: GraduationCap },
    { value: fmt(platformStats.total_topicos),        label: 'Debates Temáticos',        icon: MessageSquare },
    { value: '3+',                                     label: 'Rankings Disponíveis',     icon: Award },
  ]

  const faqs = [
    { question: 'Como faço para me cadastrar?', answer: 'Clique em "Criar conta" no canto superior direito. Preencha seu nome, email e telemóvel. O cadastro é gratuito e instantâneo.' },
    { question: 'O que são "Textos com Jindungo"?', answer: 'São conteúdos exclusivos que exigem aprovação do administrador. Solicite acesso e expanda seu conhecimento.' },
    { question: 'Como ganho pontos no ranking?', answer: 'Participe dos quizzes, comente no fórum e interaja com os conteúdos. Cada atividade certa acumula pontos.' },
    { question: 'Posso sugerir novos temas?', answer: 'Sim! No fórum existe a opção "Sugerir Temas". A equipa analisa todas as sugestões enviadas pela comunidade.' },
    { question: 'Os conteúdos são gratuitos?', answer: 'Sim, a maioria dos conteúdos é gratuita. Apenas os "Textos com Jindungo" exigem solicitação de acesso.' },
    { question: 'Como entro em contato?', answer: 'Use o email suporte@economiacomhistoria.ao ou o telefone +244 923 456 789. Respondemos em até 24h.' },
  ]

  return (
    <div className="overflow-x-hidden">
      <AuthPrompt open={showAuthPrompt} onOpenChange={setShowAuthPrompt} action="aproveitar todas as funcionalidades da plataforma" />
        <HeroCarousel />

        {/* Stats - Ícones removidos */}
        <section className="bg-white border-b relative" style={{ borderBottomColor: '#d1d5db' }}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {statsData.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-xl md:text-2xl font-bold text-[#800020] mb-0.5">
                    {stat.value}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="bg-white py-14">
          <div className="bg-white w-full">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
              <div className="text-center mb-10 bg-white p-6 rounded-3xl shadow-sm">
                <div className="inline-flex items-center gap-2 bg-[#FFF2F2] px-4 py-1.5 rounded-full mb-4">
                  <Sparkles className="w-3 h-3 text-[#800020]" />
                  <span className="text-xs font-medium text-[#800020]">Plataforma Educacional</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-playfair font-bold text-slate-900 mb-3 tracking-tight">
                  Explore a Plataforma
                </h2>
              </div>
            </div>
          </div>

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="group">
                  <Card className="relative overflow-hidden !bg-white transition-all duration-500 ring-0 hover:shadow-sm hover:-translate-y-2 hover:border-slate-300/40 h-full border border-slate-300/60 shadow-none">
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-linear-to-r ${feature.color} scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left`} />
                    <div className={`absolute -top-24 -right-24 w-48 h-48 bg-linear-to-br ${feature.bgGlow} rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                    <CardHeader className="relative p-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${feature.color} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-full">
                          <Zap className="w-2.5 h-2.5 text-yellow-500" />
                          <span className="text-[10px] font-medium text-slate-500">{feature.stat}</span>
                        </div>
                      </div>
                      <CardTitle className="font-playfair font-bold text-lg group-hover:text-[#800020] transition-colors duration-300 mb-2">
                        {feature.title}
                      </CardTitle>
                      <CardDescription className="text-slate-600 leading-relaxed text-sm">
                        {feature.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 pt-0">
                      <Link to={feature.link}>
                        <Button variant="ghost" className="group/btn text-slate-600 hover:text-[#800020] p-0 hover:bg-transparent text-sm">
                          Explorar agora
                          <ArrowRight className="ml-2 w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </div>
              )
            })}
          </div>
        </div>
        </section>

        {/* Mapa */}
        <section className="bg-linear-to-br from-slate-50 to-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-1.5 rounded-full mb-4">
                <MapPin className="w-3 h-3 text-blue-600" />
                <span className="text-xs font-medium text-blue-600">Mapa Interativo</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-playfair font-bold text-slate-900 mb-3 tracking-tight">
                Explore Angola por Província
              </h2>
              <p className="text-slate-500 max-w-2xl mx-auto text-sm">
                Passe o mouse sobre qualquer província para descobrir informações detalhadas sobre governadores, capitais, municípios e muito mais
              </p>
            </div>

            <div className="max-w-5xl mx-auto">
              <div className="flex justify-center items-center bg-white rounded-xl shadow-md p-6 border border-slate-100">
                <svg
                  viewBox="0 0 400 500"
                  preserveAspectRatio="xMidYMid meet"
                  className="w-[90%] max-w-[500px] h-auto block"
                >
                  <path className="tooltipsMaps" d="M390.73,473.43l-64.34,10.98c-4.34-1.02-2.81,.77-4.34-1.02s-8.43-3.83-16.85,0c-8.43,3.83-13.28-3.32-13.28-3.32,0,0-3.08,.08-14.81-1.1l-5.36-1.46s-2.55-7.15-3.06-8.17,2.3,0,3.57-1.79-2.04-1.79,1.28-1.79h3.32s-1.15-2.07-1.15-2.07c-.08-.15-.19-.28-.32-.39-1.6-1.34-12.72-10.69-14.62-12.35-2.04-1.79-6.89-4.09-6.89-4.09,0,0-5.11-5.87-6.38-10.47s-4.85-9.7,1.79-23.49l.51-7.4-15.83-4.34v-18.38s-1.28-1.79-1.28-8.43v-10.98s-2.81-1.28-2.04-3.06-4.09-1.28,.77-1.79,1.28,1.28,4.85-.51l3.57-1.79,4.34-2.81s-.77-4.09,2.3-1.79l3.06,2.3,3.32,.26v-3.25l1.02-1.85s5.11,1.02,7.15,1.28l2.04,.26,1.79,2.3,1.79,5.11,6.13,5.11s6.68,12.3,13.79,12.77c19.4,1.28,14.3-.26,19.4,1.28s0-2.3,7.91,4.09l7.91,6.38,2.21,4.86c.2,.44,.61,.75,1.1,.81,1.24,.15,3.59,.69,3.59,2.76,0,2.81-3.32,0,0,2.81l3.32,2.81s-2.55,.51,.51,4.34-3.32-2.3,3.06,3.83l6.38,6.13h0s.26-.26,5.36,5.87c5.11,6.13,4.34,9.45,4.34,9.45,0,0,39.06,34.13,39.06,40.34v1.79Z" data-prov="cuando" />
                  <path className="tooltipsMaps" d="M241.37,351.9l-1.79-2.81s3.32-2.04,0-6.13l-3.32-4.09-2.55-2.81s.51-2.04-2.55-2.04-1.53,.26-3.06,0l-1.53-.26s.77,0-1.28-1.28,0-1.28-2.04-1.28,2.3,1.79-2.04,0-2.04-.51-4.34-1.79-.26-.26-2.3-1.28,0-.51-2.04-1.02,0,.51-2.04-.51-1.28-2.81-2.04-1.02l-.77,1.79s2.3-.51-1.02,.26-3.83-2.04-3.32,.77,.26,.26,.51,2.81,.26,0,.26,2.55,.77,1.02,0,2.55,3.06-1.28-.77,1.53,.26,2.55-3.83,2.81-2.04-.51-4.09,.26l-2.04,.77s0-1.28-1.28,.77,0-.51-1.28,2.04-.26-1.28-1.28,2.55,1.02,3.32-1.02,3.83,2.04,2.3-2.04,.51-2.55-.26-4.09-1.79,1.28,2.3-1.53-1.53-.77,.26-2.81-3.83l-2.04-4.09s2.55-.26,0,0,1.53-.77-2.55,.26-.77,1.53-4.09,1.02-.77-.26-3.32-.51-1.28-.26-2.55-.26,.51-.26-1.28,0-1.53-4.34-1.79,.26,0,.51-.26,4.6-.26,1.28-.26,4.09-.26-2.3,0,2.81,0,2.04,.26,5.11-2.81-.77,.26,3.06,2.3,2.81,3.06,3.83,0-3.32,.77,1.02,.51,1.53,.77,4.34l.26,2.81s-.26,2.04,1.79,5.11l2.04,3.06s-2.3-2.04,1.28,1.79l3.57,3.83s-1.79-1.79,1.28,2.3l3.06,4.09s.26-1.02,3.83,4.34,.77,0,3.57,5.36,1.79-.51,2.81,5.36,1.02,1.28,1.02,5.87v4.6s.34,1.96,.34,4.51,.34-.17,0,2.55,.51,.34-.34,2.72,1.53-2.89-.85,2.38,.68,2.89-2.38,5.28-4.09-.17-3.06,2.38,.85-.51,1.02,2.55-.17-.85,.17,3.06-.17,.34,.34,3.91,.34,.51,.51,4.26,0,.68,.17,3.74l.17,3.06h35.57s1.87-2.21,3.91,1.19l2.04,3.4,5.28,3.57,1.87,3.4,5.79,2.55,3.4,1.53s1.19-1.36,5.28,0l4.09,1.36s.68,1.02,4.6,1.36-3.4,.17,3.91,.34l7.32,.17,.56-1.26c.08-.18,.12-.37,.12-.57v-.55c0-.23-.05-.45-.16-.65-.16-.3-.46-.87-1.03-1.91-1.02-1.87-1.02,1.02-1.02-1.87s-1.19-2.21,0-2.89,0-.34,1.19-.68,0,2.21,1.19-.34-.51-2.04,1.19-2.55l1.7-.51v-1.02s.17,.68-2.04-1.7-.85-1.19-2.21-2.38,1.36,.34-1.36-1.19,.51,1.02-2.72-1.53,.51-.17-3.23-2.55,.51,.51-3.74-2.38-1.53-.17-4.26-2.89-.85,.34-2.72-2.72,.68,3.06-1.87-3.06l-2.55-6.13s.51,.34-.85-3.4-1.36,.34-1.36-3.74v-4.09s-3.06,.14,.34-3.57c3.4-3.71,1.19-4.63,1.19-4.63l2.21-4.05,.68-5.96-16-4.26s.34-9.19-.17-18.72l-.51-9.53s.17-3.23-.68-7.15,.17-1.19-.85-3.91,.51-1.36-1.02-2.72-1.53,.68-1.53-1.36-2.38-1.7,0-2.04l2.38-.34,1.02,.34s-.51,.17,1.87,0-.17,1.53,2.38-.17,.34,0,2.55-1.7l2.21-1.7,1.79-1.62Z" data-prov="cubango" />
                  <path className="tooltipsMaps" d="M346.05,416.8s0-.31-4.6-4.14c-4.6-3.83-2.3-1.28-4.6-3.83s-2.3,0-2.3-2.55v-2.55s3.32-2.3,0-3.83-2.55,2.55-3.32-1.53,2.3-.51-.77-4.09,1.02,1.53-3.06-3.57,1.28-1.53-4.09-5.11-2.55,0-5.36-3.57,.51-1.79-2.81-3.57,1.28,0-3.32-1.79,.26-1.53-4.6-1.79-.26,0-4.85-.26-.51,.51-4.6-.26,.26-.77-4.09-.77,0,1.28-4.34,0-1.28,.51-4.34-1.28,.51,1.53-3.06-1.79-2.3-1.28-3.57-3.32,2.81,4.6-1.28-2.04,1.02-3.83-4.09-6.64l-5.11-2.81s2.81,2.04,0-1.53-.77-1.79-2.81-3.57,3.32,0-2.04-1.79-1.02-1.79-5.36-1.79-3.06-.26-4.34,0,.51-2.81-1.28,.26l-1.76,3.03c0-.1-.32-.43-3.34-1.24-3.83-1.02-3.32,4.85-3.83-1.02s4.85,2.3-.51-5.87-4.6-7.4-5.36-8.17,5.62,.51-.77-.77l-6.38-1.28s3.32,.77-2.04-1.02,2.81-.77-5.36-1.79-5.54-1.53-6.98-2.55,2.64,1.28-1.44-1.02-3.06-.77-4.09-2.3-.77,.77-1.02-1.53-2.04,1.53-.26-2.3-1.02-2.81,1.79-3.83,4.6,4.85,2.81-1.02-3.83-3.06-1.79-5.87,.26-.51,2.04-2.81,1.02-1.02,1.79-2.3,1.02,1.28,.77-1.28,0-1.02-.26-2.55-4.6,.77-.26-1.53l4.34-2.3h0s-2.55-.26,.77-4.09,.51-.77,3.32-3.83-1.53,1.02,2.81-3.06l3.76-3.54c.11-.1,.28,0,.24,.15-.1,.42,.17,.66,2.12-.69,3.32-2.3,1.02,2.04,3.32-2.3l2.3-4.34s1.79,1.79,2.55-2.55,.26-1.79,.77-4.34-2.04,2.55,.51-2.55,1.79-3.32,2.55-5.11-.51,.51,.77-1.79-1.02,.26,1.28-2.3-.77-1.53,2.3-2.55-2.3,0,3.06-1.02-.51,1.02,5.36-1.02,2.55,2.55,5.87-2.04,.26-4.85,3.32-4.6-3.57,.26,3.06,.26-.77,.77,6.64,0,.51-.77,7.4-.77,2.3-2.04,6.89,0-.26-2.81,4.6,2.04,4.09,2.3,4.85,4.85-1.53-.51,.77,2.55,0,.51,2.3,3.06-.51-2.81,2.3,2.55,1.53,3.32,2.81,5.36-.26-1.79,1.28,2.04,.26,.26,1.53,3.83,1.79-1.53,1.28,3.57,1.28-1.02-.51,5.11-1.53,3.57-1.79,6.13,.51-1.02-.26,2.55l-.77,3.57h0s-3.57,5.87,1.79,4.34,2.3-4.09,5.36-1.53,1.02-1.79,3.06,2.55,2.55,5.36,2.55,5.36l4.09,6.89,2.81,4.6,3.83,5.62,8.68,3.32,2.81,1.02s-.26,1.03,1.53,1.54l1.79,.51-1.79,91.46Z" data-prov="moxico" />
                  <path className="tooltipsMaps" d="M347.83,322.79l-6.89-3.57s-5.08-.12-13.53-13.79l-8.68-14.04h-5.36v-1.28s-2.55,13.53,0-2.3l2.55-15.83h0l-3.69-7.66-3.72-6.13-6.38-7.4s4.6,6.89,10.98,3.57-10.47,3.57,7.66-3.57l18.13-7.15h1.28s-6.64,2.55-.26-6.64,4.34-6.13,6.38-9.19-5.36-2.81,2.04-3.06,2.55-.26,7.4-.26,1.28-3.57,4.85,0,6.64,.77,3.57,3.57-.51-1.79-3.06,2.81-3.83-1.53-2.55,4.6,1.53,4.57,1.53,7.52-7.66,4.48,0,2.95,5.62,3.57,7.66-1.53-4.85-6.64,2.04-5.11l6.89,1.53s-6.89,3.29,1.53,2.16,3.57-1.9,9.19-1.39-1.53,2.81,5.62,.51,2.3-1.02,7.15-2.3l3.82-1c.65-.17,1.33-.12,1.97,.1,1.87,.66,1.9-2.21,6.09-2.8l6.25,2.73c1.78-.62,2.69-2.64,1.9-4.35-.22-.47-.06,.3,1.17,4.55l2.81,9.7s1.28,3.06,0,7.66l-.35,1.26c-.37,1.33-1.13,2.49-1.98,3.59-.54,.7-1.12,2.55-1.24,7.15l-.23,8.25c-.01,.46-.1,.91-.19,1.36-.12,.58-.14,1.9,.68,4.69,1.28,4.34,2.04-1.28,1.28,4.34s2.55,2.04-.77,5.62-2.04-4.6-3.32,3.57-3.06,4.85-1.28,8.17,.77,.26,1.79,3.32-1.03,3-1.03,3l-69.96-2.3,.26,14.37Z" data-prov="moxico_leste" />
                  <path className="tooltipsMaps" d="M252.51,249.51c1.36-4.77,5.62-2.38,1.36-4.77l-4.26-2.38-3.23-2.21s-1.19-.34-4.43-3.91-.17,1.02-3.23-3.57-2.72-2.89-3.06-4.6-1.36,.85-.34-1.7,1.02,1.19,1.02-2.55,4.6-1.19,0-3.74-4.43,2.38-4.6-2.55-.51-1.36-.17-4.94-3.57,.85,.34-3.57,3.06-.68,3.91-4.43-.68-1.36,.85-3.74-.85-2.55,1.53-2.38,1.02-2.72,2.38,.17-1.02,.51,1.36,2.89-1.87,.17,2.38,2.38,4.94,2.38,4.94,2.38c0,0,0,.51,3.91-3.4s.34-.68,4.94-4.43,5.96,1.53,4.6-3.74-4.94-3.57-1.36-5.28,2.55-6.64,3.57-1.7-1.7-1.02,1.02,4.94,3.06,6.81,3.06,6.81c0,0-6.98,6.98,4.77,.68,11.74-6.3,7.66,.85,11.74-6.3l4.09-7.15s.51-1.87,4.94-5.11,2.38,5.45,4.43-3.23-2.21-5.79,2.04-8.68,5.11-3.4,5.11-3.4c0,0,2.72-1.7,8.17-6.13s0-4.26,5.45-4.43,.51-2.72,5.45-.17,1.02,2.38,4.94,2.55,1.53,3.74,3.91,.17l2.38-3.57s3.23-2.55,4.94-2.55-2.04,.85,1.7,0,.17,3.06,3.74-.85l3.57-3.91v10.21s-1.53,5.96-2.55,9.87-2.21,10.55-2.21,10.55c0,0-1.87,2.04,2.21,8.51s6.98,10.21,6.98,10.21l3.91,3.4v.85l1.36,5.79v4.6l4.26,5.79-1.7,3.91-6.64,.85-5.96-1.02s-1.7,.91-4.77,1.99-3.4-1.99-3.06,1.08,3.06-2.72,.34,3.06-.34,.85-2.72,5.79-.17,1.7-3.06,5.96,6.64,2.38-2.89,4.26l-9.53,1.87s4.77,3.91-6.64,4.6-6.81,5.45-11.4,.68,1.02-1.7-4.6-4.77,.51-1.53-5.62-3.06l-6.13-1.53-10.04-.85-10.38,.85s-5.28-4.26-6.98,1.02,3.4,5.62-1.7,5.96-1.87-1.02-5.11,.34l-3.23,1.36Z" data-prov="lunda_sul" />
                  <path className="tooltipsMaps" d="M348,143.3l-1.19,2.72s-1.53,1.53-5.11,3.4,2.04-1.02-3.57,1.87-.51,4.09-5.62,2.89-1.36-.17-5.11-1.19,.85-1.02-3.74-1.02,3.06-2.21-4.6,0-1.53-6.3-7.66,2.21-2.55,5.79-6.13,8.51-10.55,5.11-10.55,5.11c0,0-.31,6.88-2.72,10.38-3.4,4.94-.68,3.06-3.4,4.94s-6.13,2.55-6.47,3.4-1.87,2.21-4.09,4.77-4.09,5.28-7.15,1.87-1.87-5.96-3.23-8.17-3.06-2.89-4.09-2.89-1.19-.68-3.06,1.87-4.43,4.94-4.43,8.34,2.04,6.13-2.21,6.13-1.7,2.21-6.3,0-7.83-3.74-10.55-5.45-2.48-2.89-6.86-2.72-1.99,2.55-6.08,2.55-.85,1.87-6.64,1.02-8.85-.51-11.74-2.38-4.26-.51-6.81-4.09-6.81-1.36-5.28-7.49,4.43-5.79,5.28-6.81,6.47-2.55,4.94-6.98-2.38-11.4-3.4-13.96-3.06-4.6-1.87-7.15,1.7-3.91,1.7-6.64,4.77-3.4,6.64-3.57,8.51-1.36,11.23-2.38,4.6-2.72,8.17-1.02,12.43-2.21,14.3-1.87,1.7,1.87,6.64,1.7,13.45-.34,13.45-.34c0,0,.68-4.94,.85-5.79s1.19-7.83,2.04-9.02,3.23,.17,3.4-2.89,.34-4.09,.51-8.34,1.53-8.17,1.53-8.17c0,0,1.51-1.22,18.55-.85,7.83,.17,6.81,1.87,7.83,.17s5.45-2.55,7.32-2.55,2.89,.34,3.06,1.36-1.87,2.89-1.87,6.13-1.87,4.6,2.38,4.6h11.4l19.74,.51,5.28-.17s5.37,.51,5.28,5.11c-.17,8.34,.34,6.81-.17,8.34s-4.94,9.36-4.09,11.06,4.38,2.72,4.32,5.79-.06,7.15-.06,7.15Z" data-prov="lunda_norte" />
                  <path className="tooltipsMaps" d="M197.2,134.28c0,5.45,1.7,1.36,0,5.45s-3.74,3.88-2.38,6.7l1.36,2.83s.49-3.06,1.78,5.11l1.29,8.17s2.72-2.04,0,2.38-.34,.68-2.72,4.43,2.72-2.72-2.38,3.74-5.11,3.06-5.11,6.47-2.72-.68,0,3.4-1.36,.68,2.72,4.09,1.02,1.36,4.09,3.4-6.47-1.36,3.06,2.04c9.53,3.4,3.06,2.38,11.57,4.09s4.77,3.4,8.51,1.7-2.04,1.02,3.74-1.7-.34-3.06,5.79-2.72,5.45-2.72,6.13,.34,3.06,1.02,.68,3.06-.34-4.09-2.38,2.04,2.72,1.02-2.04,6.13-5.79,.34-4.77,5.11-1.02,0,1.02,4.77l2.04,4.77s-3.17-1.02,.97,4.43,2.09,.34,4.14,5.45l2.04,5.11v6.47s3.06,5.45-2.72,5.45h-5.79s0,3.06-3.4,3.4l-3.4,.34h-12.87s.27-8.51-2.45-3.4l-2.72,5.11s-3.4,4.77-4.09,2.38,1.7,10.89-.68-2.38l-2.38-13.28s1.73-1.36-2.54-5.79,1.18-2.38-4.27-4.43l-5.45-2.04-8.85-1-4.77-2.97-1.36-3.86s2.72,1.7-3.06-3.74c-5.79-5.45-4.09,0-5.79-5.45s.34,8.51-1.7-5.45,3.4-10.21-2.04-13.96,2.38-3.74-5.45-3.74,3.4-.34-7.83,0c-11.23,.34-1.7-2.72-11.23,.34-9.53,3.06-4.43,3.74-9.53,3.06s-3.74,1.7-5.11-.68-1.7,5.45-1.36-2.38-4.77-6.81,.34-7.83,2.04,0,5.11-1.02,.68,2.04,3.06-1.02,0-1.7,2.38-3.06-5.45,4.09,2.38-1.36,6.81,.68,7.83-5.45,2.38,.34,1.02-6.13-.34-3.4-1.36-6.47l-1.02-3.06v-2.38s-3.74,4.77,2.04-1.87l5.79-6.64h0s-.34,2.04,4.09-3.06c4.43-5.11,2.72-11.23,2.72-11.23l-.68-7.15s-.34,0,4.09-3.4-.34-1.02,4.43-3.4,2.04-3.74,4.77-2.38-1.36-3.74,2.72,1.36,2.38,3.06,4.09,5.11-6.81,3.74,1.7,2.04,4.09,4.09,8.51-1.7l4.43-5.79,13.28,23.15Z" data-prov="malanje" />
                  <path className="tooltipsMaps" d="M239.41,238.11c11.23,5.19,9.87,8.51,9.87,8.51h0c-3.06,4.77,.68-1.02-3.06,4.77s-2.72,.34-3.74,5.79,4.09-4.09-1.02,5.45,.68,3.4-5.11,9.53-.34,3.74-5.79,6.13,1.7-6.13-5.45,2.38,0-.34-7.15,8.51-4.77,0-7.15,8.85,1.7-1.02-2.38,8.85-1.7,3.06-4.09,9.87-.68,.34-2.38,6.81,2.38-1.02-1.7,6.47l-4.09,7.49s-7.91,.51-7.57,4,.09,5.79-1.45,5.79-5.19-.26-6.13-2.38-.6-6.04-2.55-7.23-3.74-2.3-6.04-1.36-2.98,3.83-5.62,2.64-3.57-1.02-4.85-2.55-1.28-1.11-.94-4.26,2.38-19.23,2.21-21.53,.94-5.7,.09-8.17-1.15-5.45-2.49-6.98-3.47-2.98-3.89-4.09-.85-.51,0-2.3,2.04-2.47,1.45-4.68-1.96-4.43-.68-5.02,1.11-1.45,2.72-2.55,2.21-1.53,2.98-3.83,1.36-1.79,2.21-4.26,1.02-2.55-1.53-5.11-3.74-3.32-4.6-4.68-1.45-1.87-2.38-3.74-.85-3.74-3.57-4.09-4.68-.94-6.81-.94h-4.43c-1.96,0-5.79,.85-6.21,.51s-.94,.17-.43-2.38,.6-3.66,2.13-5.7,1.7-4.43,3.83-5.28,.6-1.02,3.23-.85,2.81,.34,4.43,.34,2.21,1.28,3.49-1.79,1.19-2.64,2.81-4.17,1.45-1.96,2.38-2.3,1.28,1.19,2.81-1.53,1.02-4.51,3.49-2.89,5.28,3.15,6.89,3.74,1,.09,4.2,.51,7.12-.26,8.9,1.36,4.51,2.21,5.19,4.51-1.11-2.72,.68,2.3,2.72,6.47,2.55,8.34-.85,1.53-.26,4.43-.21,4.94,.62,7.15,3.89,5.02,5,5.19-.43,1.96,2.81-1.02,4.94-4.17,4.94-5.62-1.96-3.74,1.36-2.13,5.96,2.38,6.47,2.47,4.09,1.62,7.15,.77,5.79-.09,7.74-2.38,2.72-2.64,4.34-3.32,2.3-1.02,3.66-1.11,3.91,1.11,3.49-1.53,.34-5.62-.34-6.81-1.29-3.37-.26-2.89Z" data-prov="bie" />
                  <path className="tooltipsMaps" d="M181.24,109.15s1.28-1.59-1.02-5.93-4.34-10.85-5.49-11.74-3.7-3.7-3.96-4.47-3.45-10.72-3.45-13.4,2.94-6.26,.89-8.68-1.79-1.28-3.19-3.57-1.66-6.38-1.66-6.38h-61.15s.51,2.55,2.68,5.87,4.09,8.17,3.45,9.45-1.28,4.98-2.68,6.77-3.19,5.74-8.43,6-9.96,1.02-12.51,2.81-.26,4.72-3.32,4.98-3.32-.3-4.85,2.6-5.74,2.51-6.38,2.38-.51,4.09,1.4,4.85,2.94,1.4,1.91,2.94-2.43,2.17-1.91,3.57,2.43,3.19,1.91,4.72-1.4,3.57-1.53,3.96,6.13,.51,6.13,.51c0,0,2.94,.13,3.57,1.66s1.91,2.43,3.83,4.09,7.15,4.34,9.96,3.19,5.74,1.02,5.74,1.02c0,0,.13,2.68,0,3.7s1.02,4.6-.89,5.74-3.45,4.34-2.43,5.74,4.47,1.53,4.98,.64,.38-6.13,3.96-5.49,3.83,5.49,5.74-.51,1.02-5.74,4.47-7.79,3.96-.89,6.26,.13,.64,1.91,4.34,1.02,4.34-1.79,5.74-.13,3.7,5.23,5.36,4.98,3.4,2.55,4.7-.51,4.87-6.38,3.21-10.34-4.21-4.47-2.04-6.51,2.17-1.28,4.85-3.57,5.49-3.83,6.77-4.98-3.32-.89,1.28-1.15,4.85-1.28,6.51-.26,3.19,.13,4.47,3.06,.89,4.6,3.57,5.11,7.45,1.7,9.19-6.07Z" data-prov="uige" />
                  <path className="tooltipsMaps" d="M182.39,457.34s-6.01-10.33-2.04-18.64l2.81-5.87s3.06-.77,3.06-4.09,4.09-9.7,0-20.68c0,0-9.19-20.43-19.66-24.77,0,0-6.13-4.09-12.77,4.6,0,0-1.28,4.09-12.51,3.06,0,0-11.49-2.46-17.36,10.26,0,0-3.57,12.21-7.4,11.95,0,0,3.06,5.36-16.6-6.13,0,0-2.42-2.86-7.91,1.28l-9.32,7.02h0s-2.81,3.7-5.11,3.06-3.57-1.79-4.21-1.02-2.94,3.7-5.74,4.98-4.98,3.19-7.28,1.4-2.94-4.6-5.49,0c-2.55,4.6-1.79,7.28-3.32,7.4s-2.43,.89-1.66,2.68,1.02,2.3,4.09,6.64,16.6,16.21,21.7,16.85c0,0,7.15,.77,13.79,.89h93.32l-.38-.89Z" data-prov="cunene" />
                  <path className="tooltipsMaps" d="M161.94,379.64c-2.48,.35-6.11,2.11-11.23,7.25l-.19,.19c-.45,.44-3.22,2.55-14.48,1.75-.34-.02-.68-.15-.98-.32-1.51-.86-7.54-2.22-18.05,21.08,0,0-.13,5.36-14.68-3.83,0,0-6.38-4.98-13.91,2.55l-8.23,6.98c-.82,.7-1.99,.66-2.86,.02-.52-.38-1.3-.61-2.44-.37l-1.2,.26c-.62,.14-1.11,.57-1.42,1.14-.21,.38-.73,.95-1.85,1.8-3.19,2.43,1.28,1.66-3.19,2.43s-1.79,3.96-4.47,.77l-2.68-3.19s-1.53-1.15-.89-4.21l.53-2.52c.05-.24,.18-.46,.31-.67,.14-.24,.32-.9,.32-2.68,0-3.06,.89,5.49,0-3.06-.89-8.55-.89-6.64-.89-8.55s2.3,1.28,0-1.91,.38,.13-2.3-3.19-1.15,1.15-2.68-3.32,1.02,0-1.53-4.47-3.06-.77-2.55-4.47l.48-3.49c.02-.14,.03-.28,.02-.42l-.05-1.12c-.04-.9,.45-1.74,1.24-2.15l2.9-1.49s-.51,.38,2.94-2.55c1.81-1.54,2.85-2.49,3.42-3.03,.41-.39,.66-.92,.7-1.49,.09-1.29,.42-3.69,1.62-4.15,1.66-.64,2.17-7.4,.89-8.68s-1.91-2.3-1.91-3.19,.51-2.43,.38-4.34,1.79-1.53,.13-3.57-3.45-3.45-1.02-3.45,3.45-.26,5.74,0,4.09,1.15,6.38,.64,5.11-.51,6.77,.13,7.15,2.55,8.55,0,.51-5.36,2.43-6.77,4.09-.38,6.64-.77,3.7,.13,5.62-1.4,1.99-.77,4.06-2.17,3.73-1.4,4.49-3.06,.77-2.3,2.55-2.43,4.34-2.81,4.98,0-.77,5.87,0,7.02-1.28,4.09,1.91,4.34,4.34,2.3,6.38,.51,2.3-2.94,4.98-3.96,.89-1.91,4.85-3.96-.43-1.53,4.96-2.55,5-.26,7.43-2.04,2.94-2.94,5.23-1.79,4.34,1.28,4.34,2.68-1.25,10.84-1.36,11.68c0,.04-.01,.08-.02,.12-.13,.67-1.3,6.78-1.3,8.11,0,1.4-1.02,6.64-.38,9.32s.51,7.79,.13,8.68-1.08,6.26,1.56,7.53,4.05,1.53,4.18,3.45-2.17,3.45,.13,6.64c.02,.03,.05,.06,.07,.09,1.02,1.4,.23,3.4-1.49,3.64Z" data-prov="huila" />
                  <path className="tooltipsMaps" d="M52.51,335.64c-1.36-2.38-1.89-3.32-2.31-5.75s1.45-5.83-7.4-2.93c0,0-4.79,2.46-9.36,1.02-5.96-1.87-4.09-2.89-5.96-1.87s-3.91,6.98-3.91,6.98c0,0,1.7,2.04,1.36,3.23s-3.74-.68-3.91,2.21-2.04,5.79-1.36,8.77,.38,10.47-.15,14.04-1.55,8.85-3.43,12.26-5.11,7.49-5.45,9.7-.17,8-.85,10.38-1.19,7.83-3.23,9.02-6.13,1.02-5.45,4.09,2.04,4.94,2.04,7.49,1.36,20.09-1.36,24.85c-2.72,4.77-1.53,5.96-1.53,8.68s.51,6.64,.51,6.64c0,0-2.38,4.77,6.81-5.11,0,0,6.98-1.87,9.02,3.06,0,0,6.98,6.81,16.85-3.06,0,0,8.54-8.58,18.04-5.11,0,0,5.11,1.87-5.28-9.7,0,0-.26-3.93,3.38-5.45s1.9-2.89,2.24-4.94,.17-.92,2.38-3.86,3.91-4.65,3.4-7.2,2.04-7.15-.34-17.87c0,0,.12-.85-7.68-7.32,0,0-3.38-2.38-1.34-12.94,0,0-2.38-3.06,9.02-10.38,0,0,5.1-4.11,3.74-14.3-1.7-12.77-7.15-12.26-8.51-14.64Z" data-prov="namibe" />
                  <path className="tooltipsMaps" d="M160.17,316.15s5.19-15.15-6.89-23.91c0,0-2.47-.77,2.55-6.21,0,0,2.04-.94-.85-4.68,0,0-3.17-1.11,4.08-6.81,0,0,10.48-7.15-.84-12.68,0,0-7.23-7.06-8.09-7.57s-2.3-1.7-5.53-1.19-6.72,.43-8.68-.12-8.51-.13-9.62,1.57-5.47-2.16-3.15,3.87c0,0,2.58,8.74-.67,10.52,0,0-7.08,1.19-9.46,4.17,0,0-5.19,3.23-1.45,13.36,0,0,2.89,5.28-3.4,5.96,0,0-7.57,.6-2.98,7.91,0,0,3.91,6.55,2.55,8.43,0,0-3.15,7.15,3.4,9.36,0,0,2.21,1.97,7.91-.89,0,0,3.32-1.33,3.32,5.23,0,0-1.19,5.79-.26,6.64,0,0,4.68,3.91,7.23,0l5.62-4.94s.43-1.62,2.89-3.23c0,0,2.84-.3,6.98-1.87,8.94-3.4,7.83-2.98,8.94-3.4s3.23,0,3.23,0c0,0,1.11,1.19,3.15,.51Z" data-prov="huambo" />
                  <path className="tooltipsMaps" d="M68.26,263.05s-2.21,11.83-4.43,13.79-7.23,9.96-7.23,10.72-.77,3.32-4.68,3.23-5.87,1.11-6.3,2.04-.68,3.06-2.98,4.26-4.26,2.72-3.49,4.17,3.4,1.79,.77,3.83-10.72,10.72-10.72,10.72l-3.15,4.09s-2.24,3.16-.51,3.57c13.19,3.15,11.83,3.57,13.19,3.15s3.32-2.13,4.85-2.3,8.17-1.36,8.34,.43-.34,6.04,2.64,8.51c0,0,7.47-.48,13.7,0,0,0,14.72,2.21,15.57,1.79,0,0,5.45,2.55,4.94-6.21,0,0-.09-1.74,7.06-2.55,0,0,9.31,.79,10.81-2.3,0,0,8.43-1.36,3.23-4.26,0,0-7.83,0-5.28-11.66,0,0,.51-3.57-3.23-8.85,0,0-4.12-8.09,5.68-9.36,0,0,4.1,.17,2.57-3.49,0,0-2.72-6.13-2.13-8.51,0,0,.34-4.68-5.19-4.6s-4.26,1.96-5.96-.51l-1.53-3.74s-3.06-5.53-6.64-.17c0,0-3.95,6.79-9.28,.77l-3.23-3.66s-5.79-6.55-7.4-2.89Z" data-prov="benguela" />
                  <path className="tooltipsMaps" d="M95.2,193.09c2.12-6.27,13.4-2.43,13.4-2.43,0,0,4.6,3.19,8.3,3.06s12.98,.39,18.55-1.53c0,0,15.66-4.8,19.11,7.24,0,0,3.7,18.8,5.87,18.8,0,0,4.98,1.66-6.13,7.02,0,0-1.66,7.15-7.4,7.4,0,0-10.26-2.04-13.3,16.09,0,0,3.22,1.4-9.93,3.45,0,0-4.21-.86-4.09,6.21,0,0,6.34,6.64-6.03,10.77,0,0-2.65,3.19-13.63,2.17,0,0-2.97-8.13-5.87-6.89,0,0-1.53-1.53-10.72,4.6,0,0-8.01-9.48-10.72-9.19l-4.72,.51s-3.45-5.87-.77-15.06l2.68-9.19s-3.96-7.91-3.7-9.32,.77-4.34-.77-6.13-7.66-6.89-7.66-8.43,1.02-3.96,1.02-4.47,3.32,4.21,4.72,4.47,5.49,2.81,8.17,2.04,1.91-1.4,6.26-2.3,7.53,.13,9.45,1.02,3.52,5.45,5.49-4.47c2.95-14.87,1.26-12.01,2.43-15.45Z" data-prov="cuanza_sul" />
                  <path className="tooltipsMaps" d="M100.56,56.11s17.74,21.19-12.38,26.81c0,0-6.77,.89-7.66,4.98,0,0-5.62,3.57-8.04,4.6,0,0-5.11-.89-5.23,1.53s.51,5.49,1.4,6.64,1.19,4.34,1.19,4.34c0,0-.86,1.91,0,4.14s3.1,3,0,4.41-5.65,4.6-7.7,4.98-4.72,.64-6.51,.64-4.72,.13-6.26,.89-3.57,2.3-4.34,2.94-7.46-15.14-10.09-21.19c0,0,.51-8.55-4.34-11.49l-16.6-25.66s-1.91-.89,5.11-1.53c0,0,19.28-7.91,21.45-8.17s29.36-1.66,60,1.15Z" data-prov="zaire" />
                  <path className="tooltipsMaps" d="M107.83,140.37s5.98,3.65,8.43-4.6c0,0,.26-10.21,9.45-3.96,0,0,3.05,1.4,5.1-.77,0,0,2.17-2.68,6,7.28,0,0,.51,7.02-1.15,7.15,0,0-7.28,1.91-4.09,8.17,0,0,8.43,12.51-2.94,15.32,0,0-4.97,6.27-6.28,6.64-9.04,2.55-6.61,1.02-9.04,2.55s-.77,5.74-.77,7.53-1.79,2.55-4.72,2.17-4.34-.45-8.3,.1-7.53-2.39-11.11-1.37c0,0-8.17,.13-7.28-7.91,0,0,0-11.11-1.28-13.66,0,0-.77-4.34,5.62-3.96,0,0,19.05,3.35,19.53-2.68,0,0,5.88-5,2.17-11.93,0,0-4.76-6.18,.64-6.07Z" data-prov="cuanza_norte" />
                  <path className="tooltipsMaps" d="M45.28,124.92s3.7,11.74,6.13,13.66c0,0,4.09,9.19,2.68,14.68,0,0,9.78,9.7,15.74,8.43,0,0,9.79-4.8,17.07-2.78,0,0,19.96,5.72,18.85-10.11,0,0,2.6-.64-9.79-6.64,0,0-2.43-2.94,2.43-8.55,0,0,2.55-6.13-5.11-4.98,0,0-6.64,1.15-15.7-8.81,0,0-.51-4.21-20.81,1.53l-11.49,3.57Z" data-prov="bengo" />
                  <path className="tooltipsMaps" d="M39.56,11.22L30.6,2.37s-.33,.51-1.91,2.17c-2.68,2.81-4.72,5.49-8.68,6.13,0,0-2.3-.26-3.06,6.26,0,0,.51,3.45-4.09,1.02,0,0-.44-.09-2.81,2.43,0,0-5.74,5.23-3.7,7.4,0,0,4.09,6.26,3.96,8.17s0,10.09-.38,10.98,1.04,3.65,3.85,3.7l6.37,.13s2.59,2.81,2.04-9.32c-.51-11.23-.13-9.06-.51-11.23s-1.8-2.64,.77-4.21c0,0,4.3-.93,6.38-3.83,0,0,2.63-5.88,10.21-8.55h0c1-.35,1.29-1.64,.53-2.38Z" data-prov="cabinda" />
                  <path className="tooltipsMaps" d="M44.09,174.31c.62,.92,2.03,.89,2.56-.08,.34-.63,.83-1.25,1.5-1.65,0,0,4.58-2.76,6.16-5.49,.1-.17,.15-.34,.18-.53,.11-.73,.46-2.78,1.31-4.65,.2-.45,.59-.78,1.07-.88h0c1.13-.25,1.58-1.63,.8-2.48-.95-1.04-2.27-2.21-3.69-2.71,0,0-4.39-1.64-8.96,2.22,0,0-4.23,2.28-4.83,5.9-.02,.15-.03,.29,0,.43,.12,1.01,.78,5.34,3.92,9.94Z" data-prov="luanda" />
                  <path className="tooltipsMaps" d="M78.51,182.17c-.08,1.18,.41,2.31,1.3,3.09,.49,.43,1.04,.94,1.47,1.46,1.04,1.23,2.34,3.2,7.64,1.84,0,0,2.86-1.53,2.9,4.22,0,0,.18,4.68-.16,9.71-.08,1.18-.1,2.35-.07,3.53,.07,2.76-.25,8.02-3.86,5.89,0,0-3.49-4.68-14.36-.56,0,0-5.26,3.06-11.48-2.69-1.17-1.08-2.34-2.15-3.61-3.11-1.6-1.21-3.9-3.3-5.42-6.2-.09-.17-.16-.34-.22-.51-.61-1.71-4.01-11.36-4.89-17.77-.03-.22-.08-.42-.15-.63-.27-.86-.84-3.58,1.64-6.12,.19-.19,.4-.35,.62-.49,.93-.59,3.71-2.48,5.31-4.71,.32-.44,.53-.94,.63-1.48,.14-.72,.38-1.91,.71-2.97,.57-1.84,2.47-3.04,4.33-2.56,.53,.14,1.07,.4,1.56,.86,0,0,2.2,2.65,8.59,.94,0,0,8.06-1.62,6.38,3.01,0,0-1.89,2.82,.12,3.81,1.03,.51,1.84,1.4,2.01,2.54,.18,1.2,.15,2.98-.46,5.51,0,0-.41,1.66-.52,3.4Z" data-prov="icolo_bengo" />
                  <text className="cls-3" transform="translate(13.49 34.88) rotate(-46.3)"><tspan x="0" y="0" fontSize="7">CABINDA</tspan></text>
                  <text className="cls-3" transform="translate(45.28 81.29)"><tspan x="0" y="0">ZAIRE</tspan></text>
                  <text className="cls-3" transform="translate(111.57 98.84)"><tspan x="0" y="0">UÍGE</tspan></text>
                  <text className="cls-3" transform="translate(64.56 142.72)"><tspan x="0" y="0">BENGO</tspan></text>
                  <text className="cls-3" transform="translate(86.48 178.6) rotate(-35.29)"><tspan x="0" y="0" fontSize="7">CUANZA-NORTE</tspan></text>
                  <text className="cls-3" transform="translate(86.73 230.83)"><tspan x="0" y="0">CUANZA-SUL</tspan></text>
                  <text className="cls-3" transform="translate(115.27 300.93)"><tspan x="0" y="0">HUAMBO</tspan></text>
                  <text className="cls-3" transform="translate(57.66 308.31)"><tspan x="0" y="0">BENGUELA</tspan></text>
                  <text className="cls-3" transform="translate(89.59 367.19)"><tspan x="0" y="0">HUÍLA</tspan></text>
                  <text className="cls-3" transform="translate(20.57 405.09)"><tspan x="0" y="0">NAMIBE</tspan></text>
                  <text className="cls-3" transform="translate(111.57 435.56)"><tspan x="0" y="0">CUNENE</tspan></text>
                  <text className="cls-2" transform="translate(201.37 415.12)"><tspan x="0" y="0">CUBANGO</tspan></text>
                  <text className="cls-2" transform="translate(276.24 422.74)"><tspan x="0" y="0">CUANDO</tspan></text>
                  <text className="cls-2" transform="translate(262.9 318.54)"><tspan x="0" y="0">MOXICO</tspan></text>
                  <text className="cls-2" transform="translate(354.51 279.17)"><tspan x="0" y="0" dx="-20">MOXICO LESTE</tspan></text>
                  <text className="cls-3" transform="translate(149.82 163.25)"><tspan x="0" y="0">MALANJE</tspan></text>
                  <text className="cls-3" transform="translate(233.3 161.8)"><tspan x="0" y="0">LUNDA-NORTE</tspan></text>
                  <text className="cls-3" transform="translate(280.63 216.22)"><tspan x="16.9" y="0" dx="-20">LUNDA-SUL</tspan></text>
                  <text className="cls-3" transform="translate(175.36 281.65)"><tspan x="0" y="0">BIÉ</tspan></text>
                  <text className="cls-1" transform="translate(52.17 180.54) rotate(38.88)"><tspan x="12.75" y="0" dx="-18" fontSize="7">ICOLO E BENGO</tspan></text>
                  <text className="cls-3" transform="translate(22.35 167.25)"><tspan x="0" y="0" dx="-12" style={{ fill: '#ffa500' }}>LUANDA</tspan></text>
                </svg>
              </div>
            </div>

            <div className="text-center mt-6">
              <p className="text-xs text-slate-500">
                💡 Dica: Passe o mouse sobre qualquer província para ver informações detalhadas
              </p>
            </div>
          </div>
        </section>

        {/* Tooltip flutuante — renderizado num portal para document.body.
            O <main> do Layout tem transform (animação de fade), o que cria um
            containing block e quebrava o position:fixed, atirando o tooltip para
            fora do ecrã. O portal escapa a esse ancestral transformado. */}
        {tooltip.visible && createPortal(
          <div
            className="tooltipMapa"
            style={{ position: 'fixed', top: tooltip.y, left: tooltip.x, backgroundColor: '#1e293b', color: '#ffffff', padding: '8px 12px', borderRadius: '8px', maxWidth: '240px', zIndex: 9999, fontSize: '11px', lineHeight: '1.5', pointerEvents: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'system-ui, -apple-system, sans-serif' }}
            dangerouslySetInnerHTML={{ __html: tooltip.content }}
          />,
          document.body,
        )}

        <style>{`
          .cls-1 { font-size: 7px !important; font-weight: 600; }
          .cls-1, .cls-3, .cls-4 { fill: #000; }
          .cls-2 { fill: #000; }
          .cls-2, .cls-3 { font-size: 7px !important; font-weight: 600; }
          .cls-1, .cls-2, .cls-3, .cls-4 {
            pointer-events: none;
            user-select: none;
          }
          .cls-5, .cls-6 { fill: #e9d8c1; }
          .cls-6 { stroke: #e9d8c1; stroke-miterlimit: 10; stroke-width: 3px; }
          .tooltipsMaps { fill: #F7C600; cursor: pointer; stroke: #e9d8c1; stroke-miterlimit: 10; stroke-width: 3px; transition: fill 0.2s ease; pointer-events: all; }
          .tooltipsMaps:hover { fill: #D7181E; }
          .tooltipMapa strong { color: #FECD29; }
        `}</style>

        {/* Missão */}
        <section className="bg-linear-to-br from-[#FFF2F2] via-yellow-50/30 to-[#FFF2F2] relative overflow-hidden py-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#FDD5D5]/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-yellow-200/30 rounded-full blur-3xl" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-playfair font-bold text-slate-900 mb-4 tracking-tight">
                A Nossa Missão
              </h2>
              <p className="text-slate-500 max-w-2xl mx-auto text-sm">Comprometidos com a educação e valorização da história económica de Angola</p>
            </div>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-4">
                {[
                  { icon: TrendingUp, title: 'Integração de Conteúdos', desc: 'Unir história e economia Angolana numa narrativa coerente e contextualizada.', color: 'red' },
                  { icon: GraduationCap, title: 'Aprendizagem Crítica', desc: 'Desenvolver o pensamento crítico através de análises contextualizadas.', color: 'yellow' },
                  { icon: MessageSquare, title: 'Debate Público', desc: 'Criar espaços para discussão construtiva sobre temas relevantes.', color: 'blue' },
                  { icon: MapPin, title: 'Contextualização Territorial', desc: 'Compreender as especificidades regionais de Angola.', color: 'green' },
                ].map((item, idx) => (
                  <div key={idx} className="group bg-white/80 backdrop-blur-sm rounded-xl p-4 hover:shadow-lg transition-all duration-300 hover:-translate-x-1 border border-white/50">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg bg-linear-to-br from-${item.color}-100 to-${item.color}-200 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                        <item.icon className={`w-4 h-4 text-${item.color}-600`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 mb-0.5 text-sm">{item.title}</h3>
                        <p className="text-xs text-slate-600">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="relative">
                <div className="absolute -inset-4 bg-linear-to-r from-[#FDD5D5] to-yellow-200 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <img
                  src="https://images.unsplash.com/photo-1744809482817-9a9d4fc280af?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
                  alt="Estudantes a aprender"
                  className="rounded-2xl shadow-2xl relative z-10 w-full object-cover"
                />
                <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-yellow-400/20 rounded-full blur-2xl" />
              </div>
            </div>
          </div>
        </section>

        {/* FAQ - Accordion */}
        <section className="bg-white py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="p-1.5 bg-[#FEE8E8] rounded-full">
                  <HelpCircle className="w-4 h-4 text-[#800020]" />
                </div>
                <h2 className="text-2xl md:text-3xl font-playfair font-bold text-slate-900 tracking-tight">
                  Perguntas Frequentes
                </h2>
              </div>
              <p className="text-slate-500 max-w-2xl mx-auto text-sm">Respostas rápidas e claras para as dúvidas mais comuns sobre a nossa plataforma.</p>
            </div>
            <div className="space-y-3 mb-12">
              {faqs.map((faq, index) => (
                <div key={index} className="border border-slate-200 rounded-lg overflow-hidden bg-white hover:border-[#FDD5D5] transition-all duration-300">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between p-5 text-left bg-white hover:bg-slate-50 transition-colors duration-200"
                  >
                    <h3 className="font-semibold text-slate-800 text-sm group-hover:text-[#800020] transition-colors">
                      {faq.question}
                    </h3>
                    {openFaqs.includes(index) ? (
                      <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0 ml-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 ml-4" />
                    )}
                  </button>
                  {openFaqs.includes(index) && (
                    <div className="px-5 pb-5 pt-0 bg-slate-50/30 border-t border-slate-100">
                      <p className="text-slate-600 text-sm leading-relaxed pt-3">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="text-center">
              <Link to="/perguntas-frequentes">
                <Button variant="ghost" className="group text-[#800020] hover:text-[#5C0016] text-sm">
                  Ver todas as perguntas
                  <ArrowRight className="ml-2 w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA - Footer com a mesma cor do botão de login */}
        <section className="text-white py-12" style={{ backgroundColor: '#800020' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center text-center">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium mb-4">
                <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                FEITO EM ANGOLA - PARA ANGOLA
              </div>
              <h2 className="text-xl md:text-2xl font-bold mb-3 leading-tight">A NOSSA HISTÓRIA E ECONOMIA MERECEM SER CONHECIDAS</h2>
              <p className="text-white/90 mb-5 max-w-2xl leading-relaxed text-sm">
                Do glorioso Reino do Kongo à economia diversificada e vibrante de hoje — explore o conhecimento que nos define como povo resiliente.
              </p>
              <Link to="/explorar">
                <Button size="default" className="bg-white text-[#800020] hover:bg-yellow-50 hover:text-[#5C0016] shadow-lg group">
                  Começar agora
                  <ArrowRight className="ml-2 w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
    </div>
  )
}
