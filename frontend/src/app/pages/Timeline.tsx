import { useState } from 'react';
import { Calendar, TrendingUp, Users, Building2, Landmark, Factory, Globe, Coins } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';

interface TimelineEvent {
  year: string;
  title: string;
  description: string;
  category: 'colonial' | 'independencia' | 'guerra' | 'paz' | 'moderna';
  icon: any;
  details: string[];
}

export default function Timeline() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const events: TimelineEvent[] = [
    {
      year: '1482',
      title: 'Chegada dos Portugueses',
      description: 'Início do contacto europeu com o Reino do Congo',
      category: 'colonial',
      icon: Globe,
      details: [
        'Diogo Cão chega à foz do rio Congo',
        'Estabelecimento de relações comerciais',
        'Início do comércio transatlântico'
      ]
    },
    {
      year: '1575',
      title: 'Fundação de Luanda',
      description: 'Paulo Dias de Novais funda a cidade de São Paulo da Assunção de Loanda',
      category: 'colonial',
      icon: Building2,
      details: [
        'Estabelecimento como porto principal',
        'Centro do comércio colonial',
        'Base administrativa portuguesa'
      ]
    },
    {
      year: '1836',
      title: 'Abolição do Tráfico de Escravos',
      description: 'Proibição oficial do tráfico de escravos em territórios portugueses',
      category: 'colonial',
      icon: Users,
      details: [
        'Mudança no modelo económico colonial',
        'Transição para economia de plantação',
        'Início da exploração agrícola intensiva'
      ]
    },
    {
      year: '1885',
      title: 'Conferência de Berlim',
      description: 'Definição das fronteiras coloniais de Angola',
      category: 'colonial',
      icon: Landmark,
      details: [
        'Reconhecimento internacional das fronteiras',
        'Intensificação da ocupação colonial',
        'Expansão do controlo territorial'
      ]
    },
    {
      year: '1950-1970',
      title: 'Boom Económico Colonial',
      description: 'Desenvolvimento da indústria e infraestruturas',
      category: 'colonial',
      icon: Factory,
      details: [
        'Exploração de petróleo e diamantes',
        'Construção de caminhos de ferro',
        'Desenvolvimento agrícola (café, algodão)',
        'Crescimento urbano acelerado'
      ]
    },
    {
      year: '1961',
      title: 'Início da Luta Armada',
      description: 'Começo da guerra de independência',
      category: 'independencia',
      icon: Users,
      details: [
        'Formação dos movimentos de libertação',
        'MPLA, FNLA e UNITA',
        'Impacto na economia colonial'
      ]
    },
    {
      year: '1975',
      title: 'Independência de Angola',
      description: 'Proclamação da independência em 11 de Novembro',
      category: 'independencia',
      icon: Landmark,
      details: [
        'Fim do domínio colonial português',
        'Nacionalização de empresas',
        'Adopção do sistema socialista',
        'Êxodo de técnicos e empresários'
      ]
    },
    {
      year: '1975-2002',
      title: 'Guerra Civil',
      description: 'Conflito armado prolongado afeta a economia',
      category: 'guerra',
      icon: TrendingUp,
      details: [
        'Destruição de infraestruturas',
        'Deslocamento de populações',
        'Economia centralizada sob stress',
        'Dependência do petróleo para financiar guerra'
      ]
    },
    {
      year: '1991',
      title: 'Abertura Económica',
      description: 'Transição para economia de mercado',
      category: 'guerra',
      icon: Coins,
      details: [
        'Abandono do sistema socialista',
        'Privatizações iniciais',
        'Reformas económicas limitadas pela guerra'
      ]
    },
    {
      year: '2002',
      title: 'Fim da Guerra Civil',
      description: 'Acordo de paz e início da reconstrução',
      category: 'paz',
      icon: Landmark,
      details: [
        'Morte de Jonas Savimbi',
        'Cessar-fogo e desmobilização',
        'Início da reconstrução nacional',
        'Retorno de refugiados'
      ]
    },
    {
      year: '2002-2008',
      title: 'Boom Petrolífero',
      description: 'Crescimento económico acelerado',
      category: 'paz',
      icon: TrendingUp,
      details: [
        'Preços elevados do petróleo',
        'Reconstrução de infraestruturas',
        'Crescimento do PIB acima de 10%',
        'Investimento chinês massivo'
      ]
    },
    {
      year: '2014',
      title: 'Crise do Petróleo',
      description: 'Queda dos preços do petróleo afeta economia',
      category: 'moderna',
      icon: TrendingUp,
      details: [
        'Desvalorização do Kwanza',
        'Crise cambial e fiscal',
        'Necessidade de diversificação económica',
        'Cortes no orçamento público'
      ]
    },
    {
      year: '2017',
      title: 'Nova Liderança',
      description: 'João Lourenço assume presidência',
      category: 'moderna',
      icon: Landmark,
      details: [
        'Reformas económicas e políticas',
        'Combate à corrupção',
        'Programa de privatizações',
        'Acordos com FMI'
      ]
    },
    {
      year: '2020-2026',
      title: 'Diversificação Económica',
      description: 'Esforços para reduzir dependência do petróleo',
      category: 'moderna',
      icon: Factory,
      details: [
        'Investimento na agricultura',
        'Desenvolvimento do turismo',
        'Promoção das energias renováveis',
        'Transformação digital'
      ]
    }
  ];

  const categories = [
    { id: 'all', label: 'Todos', color: 'bg-slate-100 text-slate-900' },
    { id: 'colonial', label: 'Período Colonial', color: 'bg-amber-100 text-amber-900' },
    { id: 'independencia', label: 'Independência', color: 'bg-[#FEE8E8] text-[#3D0010]' },
    { id: 'guerra', label: 'Guerra Civil', color: 'bg-orange-100 text-orange-900' },
    { id: 'paz', label: 'Pós-Guerra', color: 'bg-green-100 text-green-900' },
    { id: 'moderna', label: 'Era Moderna', color: 'bg-blue-100 text-blue-900' },
  ];

  const filteredEvents = selectedCategory === 'all' 
    ? events 
    : events.filter(e => e.category === selectedCategory);

  const getCategoryColor = (category: string) => {
    const cat = categories.find(c => c.id === category);
    return cat?.color || 'bg-slate-100 text-slate-900';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <section className="bg-gradient-to-r from-[#800020] to-[#5C0016] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center space-x-3 mb-4">
            <Calendar className="w-8 h-8" />
            <h1 className="text-4xl font-bold">Linha do Tempo Histórica</h1>
          </div>
          <p className="text-xl text-[#FEE8E8] max-w-3xl">
            Explore os principais eventos históricos e económicos que moldaram Angola desde o período colonial até aos dias atuais
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="bg-white border-b sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category.id
                    ? category.color
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#FDD5D5] via-yellow-200 to-green-200"></div>

          {/* Events */}
          <div className="space-y-8">
            {filteredEvents.map((event, index) => {
              const Icon = event.icon;
              return (
                <div key={index} className="relative pl-20">
                  {/* Timeline Dot */}
                  <div className="absolute left-6 top-2 w-5 h-5 rounded-full bg-white border-4 border-[#800020] shadow-lg"></div>
                  
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 rounded-lg ${getCategoryColor(event.category)}`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <Badge variant="outline" className="text-lg font-bold">
                              {event.year}
                            </Badge>
                          </div>
                          <CardTitle className="text-xl">{event.title}</CardTitle>
                          <CardDescription className="text-base mt-2">
                            {event.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {event.details.map((detail, idx) => (
                          <li key={idx} className="flex items-start text-sm text-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#800020] mt-2 mr-3 flex-shrink-0"></span>
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Summary */}
      <section className="bg-gradient-to-r from-slate-800 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-bold mb-6">Contexto Histórico-Económico</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold mb-2 text-[#A0002A]">Período Colonial (1482-1975)</h3>
              <p className="text-sm text-slate-300">
                Economia baseada no comércio de escravos, posteriormente na agricultura de exportação e exploração de recursos naturais.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-yellow-400">Guerra e Transição (1975-2002)</h3>
              <p className="text-sm text-slate-300">
                Conflito prolongado impediu desenvolvimento económico, mas o petróleo tornou-se recurso estratégico.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-green-400">Era Contemporânea (2002-Presente)</h3>
              <p className="text-sm text-slate-300">
                Reconstrução, boom petrolífero, crise e esforços de diversificação da economia.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
