import type { ComponentProps } from 'react'
import { Ionicons } from '@expo/vector-icons'

export type IoniconName = ComponentProps<typeof Ionicons>['name']

export interface HeroSlide {
  eyebrow: string
  title: string
  description: string
}

export interface FeatureItem {
  icon: IoniconName
  title: string
  description: string
  stat: string
}

export interface MissionItem {
  icon: IoniconName
  title: string
  description: string
  color: string
}

export interface FaqItem {
  question: string
  answer: string
}

export interface ProvinceInfo {
  name: string
  capital: string
  governor: string
  municipalities: string
  extension: string
  language: string
  ethnicity: string
}

export const heroSlides: HeroSlide[] = [
  {
    eyebrow: 'Plataforma para todos os angolanos',
    title: 'Bem-vindo à plataforma',
    description:
      'Explore conteúdos educativos sobre Economia e História de Angola. Participe de fóruns de discussão, teste os seus conhecimentos com o quiz e faça parte da construção colectiva do saber angolano.',
  },
  {
    eyebrow: 'Mapa interativo',
    title: 'Explore Angola por província',
    description:
      'Toque nas províncias para ver informações detalhadas sobre capitais, governadores, municípios e contexto territorial.',
  },
  {
    eyebrow: 'Conteúdo gratuito',
    title: 'Crie conta gratuita e comece agora',
    description:
      'A plataforma foi desenhada para aprendizagem, debate e descoberta. Crie a sua conta e acompanhe as novidades da comunidade.',
  },
]

export const statsData = [
  { value: '50+', label: 'Conteúdos para Explorar' },
  { value: '100+', label: 'Questões de Quiz' },
  { value: '60+', label: 'Debates Temáticos' },
  { value: '3+', label: 'Rankings Disponíveis' },
]

export const features: FeatureItem[] = [
  {
    icon: 'compass',
    title: 'Explorar Biblioteca',
    description:
      'Acesse vídeos envolventes, textos profundos, podcasts inspiradores e microtextos sobre economia e história.',
    stat: '200+ Conteúdos',
  },
  {
    icon: 'map',
    title: 'Recursos Interativos',
    description:
      'Mapas, gráficos e visualizações de dados para compreender a economia angolana territorialmente.',
    stat: '50+ Visualizações',
  },
  {
    icon: 'chatbubbles',
    title: 'Espaço de Debate',
    description:
      'Participe de discussões sobre temas económicos e históricos relevantes para Angola.',
    stat: '60+ Debates',
  },
]

export const missionItems: MissionItem[] = [
  {
    icon: 'trending-up',
    title: 'Integração de Conteúdos',
    description:
      'Unir história e economia angolana numa narrativa coerente e contextualizada.',
    color: '#DC2626',
  },
  {
    icon: 'school',
    title: 'Aprendizagem Crítica',
    description:
      'Desenvolver o pensamento crítico através de análises contextualizadas.',
    color: '#D97706',
  },
  {
    icon: 'chatbubble-ellipses',
    title: 'Debate Público',
    description:
      'Criar espaços para discussão construtiva sobre temas relevantes.',
    color: '#2563EB',
  },
  {
    icon: 'location',
    title: 'Contextualização Territorial',
    description: 'Compreender as especificidades regionais de Angola.',
    color: '#16A34A',
  },
]

export const faqs: FaqItem[] = [
  {
    question: 'Como faço para me cadastrar?',
    answer:
      'Clique em "Criar conta" no ecrã de login. Preencha o nome, email e telemóvel. O cadastro é gratuito e instantâneo.',
  },
  {
    question: 'O que são "Textos com Jindungo"?',
    answer:
      'São conteúdos exclusivos que exigem aprovação do administrador. Solicite acesso e expanda o seu conhecimento.',
  },
  {
    question: 'Como ganho pontos no ranking?',
    answer:
      'Participe dos quizzes, comente no fórum e interaja com os conteúdos. Cada atividade certa acumula pontos.',
  },
  {
    question: 'Posso sugerir novos temas?',
    answer:
      'Sim. No fórum existe a opção "Sugerir Temas". A equipa analisa todas as sugestões enviadas pela comunidade.',
  },
  {
    question: 'Os conteúdos são gratuitos?',
    answer:
      'Sim, a maioria dos conteúdos é gratuita. Apenas os "Textos com Jindungo" exigem solicitação de acesso.',
  },
  {
    question: 'Como entro em contato?',
    answer:
      'Use o email suporte@economiacomhistoria.ao ou o telefone +244 923 456 789. Respondemos em até 24h.',
  },
]

export const provinces: ProvinceInfo[] = [
  {
    name: 'Cabinda',
    governor: 'Suzana Fernanda Pemba Massiala de Abreu',
    capital: 'Cabinda',
    municipalities: '10',
    extension: '7.283 km²',
    language: 'Português, Fiote, Kikongo',
    ethnicity: 'Bakongo',
  },
  {
    name: 'Zaire',
    governor: 'Adriano Mendes de Carvalho',
    capital: 'Mbanza Kongo',
    municipalities: '11',
    extension: '40.130 km²',
    language: 'Português, Kikongo',
    ethnicity: 'Bakongo',
  },
  {
    name: 'Uíge',
    governor: 'José Carvalho da Rocha',
    capital: 'Uíge',
    municipalities: '23',
    extension: '58.698 km²',
    language: 'Português, Kikongo, Kimbundu',
    ethnicity: 'Bakongo, Ambundu',
  },
  {
    name: 'Bengo',
    governor: 'João Diogo Gaspar',
    capital: 'Caxito',
    municipalities: '17',
    extension: '24.110 km²',
    language: 'Português, Kimbundu',
    ethnicity: 'Ambundu',
  },
  {
    name: 'Luanda',
    governor: 'Luís Manuel da Fonseca Nunes',
    capital: 'Ingombota',
    municipalities: '16',
    extension: '1.000 km²',
    language: 'Português, Kimbundu',
    ethnicity: 'Ambundu',
  },
  {
    name: 'Cuanza Norte',
    governor: 'Maria Antónia Nelumba',
    capital: 'Dande',
    municipalities: '12',
    extension: '31.371 km²',
    language: 'Português, Kimbundu, Kikongo',
    ethnicity: 'Ambundos, Bakongos',
  },
  {
    name: 'Cuanza Sul',
    governor: 'Narciso Damásio dos Santos Benedito',
    capital: 'Sumbe',
    municipalities: '24',
    extension: '55.660 km²',
    language: 'Português, Kimbundu, Umbundu',
    ethnicity: 'Ambundu, Ovimbundu',
  },
  {
    name: 'Malanje',
    governor: 'Marcos Alexandre Nhunga',
    capital: 'Malanje',
    municipalities: '14',
    extension: '97.602 km²',
    language: 'Português, Kimbundu',
    ethnicity: 'Ambundu',
  },
  {
    name: 'Lunda Norte',
    governor: 'Filomena Elizabete Chitula Miza Aires',
    capital: 'Dundo',
    municipalities: '19',
    extension: '103.760 km²',
    language: 'Português, Cokwe',
    ethnicity: 'Cokwe',
  },
  {
    name: 'Lunda Sul',
    governor: 'Crispiniano Vivaldino Evaristo dos Santos',
    capital: 'Saurimo',
    municipalities: '9',
    extension: '77.636 km²',
    language: 'Português, Cokwe',
    ethnicity: 'Cokwe',
  },
  {
    name: 'Moxico',
    governor: 'Ernesto Muangala',
    capital: 'Luena',
    municipalities: '12',
    extension: '223.023 km²',
    language: 'Português, Cokwe, Nganguela',
    ethnicity: 'Ovanga',
  },
  {
    name: 'Moxico Leste',
    governor: 'Ernesto Muangala',
    capital: 'Luena',
    municipalities: '12',
    extension: '223.023 km²',
    language: 'Português, Cokwe, Nganguela',
    ethnicity: 'Ovanga',
  },
  {
    name: 'Bié',
    governor: 'Celeste Elavoco David Adolfo',
    capital: 'Cuito',
    municipalities: '19',
    extension: '70.314 km²',
    language: 'Português, Umbundu',
    ethnicity: 'Bailundo',
  },
  {
    name: 'Huambo',
    governor: 'Pereira Alfredo',
    capital: 'Huambo',
    municipalities: '17',
    extension: '2.609 km²',
    language: 'Português, Umbundu',
    ethnicity: 'Ovimbundu',
  },
  {
    name: 'Benguela',
    governor: 'Manuel Nunes Júnior',
    capital: 'Benguela',
    municipalities: '23',
    extension: '35.771 km²',
    language: 'Português, Umbundu, Ohvanyaneka',
    ethnicity: 'Ovimbundu, Ohvanyaneka',
  },
  {
    name: 'Huila',
    governor: 'Nuno Bernabé Mahapi Dala',
    capital: 'Lubango',
    municipalities: '23',
    extension: '79.022 km²',
    language: 'Português, Olunhaneka, Umbundu',
    ethnicity: 'Ovambu',
  },
  {
    name: 'Namibe',
    governor: 'Augusto Archer de Sousa Mangueira',
    capital: 'Moçâmedes',
    municipalities: '9',
    extension: '89.16 km²',
    language: 'Português, Oluherero',
    ethnicity: 'Minoria Oluyaneka',
  },
  {
    name: 'Cunene',
    governor: 'Gerdina Ulipamue Didalewa',
    capital: 'Cuanhama',
    municipalities: '14',
    extension: '78.342 km²',
    language: 'Português, Oshiwambo',
    ethnicity: 'Ovambu',
  },
]

