import React, { useCallback, useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import type { CompositeNavigationProp } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'

import { getStats, type Stats } from '../services/statsService'
import { useAuth } from '../contexts/AuthContext'
import { colors } from '../theme/colors'
import type { AppStackParamList, TabsParamList } from '../navigation'

// Este ecrã espelha a estrutura da página principal da versão web
// (frontend/src/app/pages/Home.tsx): hero, estatísticas, cartões de
// funcionalidades, missão, FAQ e chamada final para ação. O mapa SVG
// interativo de províncias da web não foi replicado aqui (peso/
// complexidade elevada em React Native) — pode ser adicionado depois
// como um ecrã dedicado, se fizer sentido.

type HomeNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabsParamList, 'Inicio'>,
  NativeStackNavigationProp<AppStackParamList>
>

const FALLBACK: Stats = {
  total_conteudos: 0,
  total_perguntas_quiz: 0,
  total_topicos: 0,
  total_utilizadores: 0,
}

const fmt = (n: number) => (n > 0 ? `${n}+` : '…')

const MISSAO = [
  {
    icon: 'trending-up' as const,
    title: 'Integração de Conteúdos',
    desc: 'Unir história e economia angolana numa narrativa coerente e contextualizada.',
  },
  {
    icon: 'school' as const,
    title: 'Aprendizagem Crítica',
    desc: 'Desenvolver o pensamento crítico através de análises contextualizadas.',
  },
  {
    icon: 'chatbubbles' as const,
    title: 'Debate Público',
    desc: 'Criar espaços para discussão construtiva sobre temas relevantes.',
  },
  {
    icon: 'location' as const,
    title: 'Contextualização Territorial',
    desc: 'Compreender as especificidades regionais de Angola.',
  },
]

const FAQS = [
  {
    question: 'Como faço para me cadastrar?',
    answer:
      'Toca em "Criar conta" no ecrã de Perfil. Preenche o teu nome, email e telemóvel. O cadastro é gratuito e instantâneo.',
  },
  {
    question: 'O que são "Textos com Jindungo"?',
    answer:
      'São conteúdos exclusivos que exigem aprovação do administrador. Solicita acesso e expande o teu conhecimento.',
  },
  {
    question: 'Como ganho pontos no ranking?',
    answer:
      'Participa dos quizzes, comenta no fórum e interage com os conteúdos. Cada atividade certa acumula pontos.',
  },
  {
    question: 'Posso sugerir novos temas?',
    answer: 'Sim! No fórum existe a opção "Sugerir Temas". A equipa analisa todas as sugestões enviadas.',
  },
  {
    question: 'Os conteúdos são gratuitos?',
    answer: 'Sim, a maioria dos conteúdos é gratuita. Apenas os "Textos com Jindungo" exigem solicitação de acesso.',
  },
  {
    question: 'Como entro em contacto?',
    answer: 'Usa o email suporte@economiacomhistoria.ao ou o telefone +244 923 456 789. Respondemos em até 24h.',
  },
]

export function HomeScreen() {
  const { user, isAuthenticated } = useAuth()
  const navigation = useNavigation<HomeNavigationProp>()
  const [stats, setStats] = useState<Stats | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [openFaqs, setOpenFaqs] = useState<number[]>([])

  const carregar = useCallback(async () => {
    try {
      const data = await getStats()
      setStats(data)
    } catch {
      setStats(FALLBACK)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      void carregar()
    }, [carregar]),
  )

  const toggleFaq = (index: number) => {
    setOpenFaqs((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]))
  }

  const s = stats ?? FALLBACK
  const statCards = [
    { label: 'Conteúdos para Explorar', value: fmt(s.total_conteudos), icon: 'book' as const },
    { label: 'Questões de Quiz', value: fmt(s.total_perguntas_quiz), icon: 'help-circle' as const },
    { label: 'Debates Temáticos', value: fmt(s.total_topicos), icon: 'chatbubbles' as const },
    { label: 'Rankings Disponíveis', value: '3+', icon: 'ribbon' as const },
  ]

  const features = [
    {
      icon: 'compass' as const,
      title: 'Explorar Biblioteca',
      description:
        'Vídeos envolventes, textos profundos, podcasts inspiradores e microtextos sobre economia e história.',
      stat: `${fmt(s.total_conteudos)} Conteúdos`,
      color: colors.accent,
      onPress: () => navigation.navigate('Explorar'),
    },
    {
      icon: 'map' as const,
      title: 'Recursos Interativos',
      description: 'Testa o teu conhecimento com quizzes e questões sobre a economia e história de Angola.',
      stat: `${fmt(s.total_perguntas_quiz)} Questões`,
      color: '#3B82F6',
      onPress: () => navigation.navigate('Quizzes'),
    },
    {
      icon: 'chatbubbles' as const,
      title: 'Espaço de Debate',
      description: 'Participa em discussões sobre temas económicos e históricos relevantes para Angola.',
      stat: 'Debates Ativos',
      color: '#22C55E',
      onPress: () => navigation.navigate('Forum'),
    },
  ]

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true)
            await carregar()
            setRefreshing(false)
          }}
        />
      }
    >
      {/* HERO */}
      <View style={styles.hero}>
        <View style={styles.heroBlobTop} />
        <View style={styles.heroBlobBottom} />

        <View style={styles.heroTop}>
          <Text style={styles.ola}>Olá, {user?.name?.split(' ')[0] ?? 'visitante'} 👋</Text>
          {isAuthenticated ? (
            <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
              <Ionicons name="notifications-outline" size={22} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.entrarBtn} onPress={() => navigation.navigate('Login')}>
              <Ionicons name="log-in-outline" size={16} color={colors.primary} />
              <Text style={styles.entrarTexto}>Entrar</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.heroBadge}>
          <View style={styles.heroBadgeDot} />
          <Text style={styles.heroBadgeTexto}>Plataforma para todos os angolanos</Text>
        </View>

        <Text style={styles.heroTitulo}>Bem-vindo à plataforma</Text>
        <View style={styles.heroDivider} />
        <Text style={styles.heroSub}>
          Explora conteúdos educativos sobre economia e história de Angola. Participa em fóruns, testa os teus
          conhecimentos com o nosso quiz e faz parte da construção coletiva do saber angolano.
        </Text>

        <View style={styles.heroBotoes}>
          <TouchableOpacity style={styles.heroBotaoPrimario} onPress={() => navigation.navigate('Explorar')}>
            <Text style={styles.heroBotaoPrimarioTexto}>Ver Conteúdos</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
          {!isAuthenticated && (
            <TouchableOpacity style={styles.heroBotaoSecundario} onPress={() => navigation.navigate('Register')}>
              <Text style={styles.heroBotaoSecundarioTexto}>Criar conta gratuita</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ESTATÍSTICAS */}
      <View style={styles.grid}>
        {statCards.map((c) => (
          <View key={c.label} style={styles.statCard}>
            <Ionicons name={c.icon} size={20} color={colors.primary} />
            <Text style={styles.statValor}>{stats ? c.value : '—'}</Text>
            <Text style={styles.statLabel}>{c.label}</Text>
          </View>
        ))}
      </View>

      {/* FUNCIONALIDADES */}
      <View style={styles.secao}>
        <View style={styles.secaoCabecalhoCentro}>
          <View style={styles.pillClaro}>
            <Ionicons name="sparkles" size={12} color={colors.primary} />
            <Text style={styles.pillClaroTexto}>Plataforma Educacional</Text>
          </View>
          <Text style={styles.secaoTitulo}>Explore a Plataforma</Text>
        </View>

        {features.map((feature) => (
          <TouchableOpacity key={feature.title} style={styles.featureCard} onPress={feature.onPress} activeOpacity={0.85}>
            <View style={styles.featureTopo}>
              <View style={[styles.featureIcone, { backgroundColor: feature.color }]}>
                <Ionicons name={feature.icon} size={20} color="#fff" />
              </View>
              <View style={styles.featureStatPill}>
                <Ionicons name="flash" size={10} color={colors.accent} />
                <Text style={styles.featureStatTexto}>{feature.stat}</Text>
              </View>
            </View>
            <Text style={styles.featureTitulo}>{feature.title}</Text>
            <Text style={styles.featureDescricao}>{feature.description}</Text>
            <View style={styles.featureLink}>
              <Text style={styles.featureLinkTexto}>Explorar agora</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.primary} />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* MISSÃO */}
      <View style={[styles.secao, styles.secaoMissao]}>
        <View style={styles.secaoCabecalhoCentro}>
          <Text style={styles.secaoTitulo}>A Nossa Missão</Text>
          <Text style={styles.secaoSubtitulo}>
            Comprometidos com a educação e valorização da história económica de Angola
          </Text>
        </View>

        {MISSAO.map((item) => (
          <View key={item.title} style={styles.missaoItem}>
            <View style={styles.missaoIcone}>
              <Ionicons name={item.icon} size={16} color={colors.primary} />
            </View>
            <View style={styles.missaoTexto}>
              <Text style={styles.missaoTitulo}>{item.title}</Text>
              <Text style={styles.missaoDescricao}>{item.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* FAQ */}
      <View style={styles.secao}>
        <View style={styles.secaoCabecalhoCentro}>
          <View style={styles.pillClaro}>
            <Ionicons name="help-circle" size={12} color={colors.primary} />
            <Text style={styles.pillClaroTexto}>Dúvidas</Text>
          </View>
          <Text style={styles.secaoTitulo}>Perguntas Frequentes</Text>
          <Text style={styles.secaoSubtitulo}>Respostas rápidas para as dúvidas mais comuns sobre a plataforma</Text>
        </View>

        {FAQS.map((faq, index) => {
          const aberto = openFaqs.includes(index)
          return (
            <View key={faq.question} style={styles.faqItem}>
              <TouchableOpacity style={styles.faqCabecalho} onPress={() => toggleFaq(index)} activeOpacity={0.7}>
                <Text style={styles.faqPergunta}>{faq.question}</Text>
                <Ionicons name={aberto ? 'chevron-up' : 'chevron-down'} size={16} color={colors.muted} />
              </TouchableOpacity>
              {aberto && (
                <View style={styles.faqCorpo}>
                  <Text style={styles.faqResposta}>{faq.answer}</Text>
                </View>
              )}
            </View>
          )
        })}
      </View>

      {/* CTA FINAL */}
      <View style={styles.cta}>
        <View style={styles.ctaBadge}>
          <View style={styles.heroBadgeDot} />
          <Text style={styles.ctaBadgeTexto}>FEITO EM ANGOLA · PARA ANGOLA</Text>
        </View>
        <Text style={styles.ctaTitulo}>A NOSSA HISTÓRIA E ECONOMIA MERECEM SER CONHECIDAS</Text>
        <Text style={styles.ctaTexto}>
          Do glorioso Reino do Kongo à economia diversificada e vibrante de hoje — explora o conhecimento que nos
          define como povo resiliente.
        </Text>
        <TouchableOpacity style={styles.ctaBotao} onPress={() => navigation.navigate('Explorar')}>
          <Text style={styles.ctaBotaoTexto}>Começar agora</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: 32 },

  // Hero
  hero: {
    backgroundColor: colors.primary,
    padding: 24,
    paddingTop: 28,
    overflow: 'hidden',
  },
  heroBlobTop: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  heroBlobBottom: {
    position: 'absolute',
    bottom: -50,
    left: -50,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(254,205,41,0.08)',
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ola: { color: '#fff', fontSize: 15, opacity: 0.95 },
  entrarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  entrarTexto: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 18,
  },
  heroBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },
  heroBadgeTexto: { color: colors.accent, fontSize: 11, fontWeight: '600' },
  heroTitulo: { color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 14 },
  heroDivider: { width: 64, height: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginTop: 12, marginBottom: 12 },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 20 },
  heroBotoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 20 },
  heroBotaoPrimario: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  heroBotaoPrimarioTexto: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  heroBotaoSecundario: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  heroBotaoSecundarioTexto: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Stats
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 12 },
  statCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    width: '47%',
    flexGrow: 1,
  },
  statValor: { fontSize: 22, fontWeight: '800', color: colors.primary, marginTop: 8 },
  statLabel: { fontSize: 12, color: colors.muted, marginTop: 2 },

  // Seções genéricas
  secao: { paddingHorizontal: 20, paddingVertical: 24 },
  secaoMissao: { backgroundColor: colors.primaryLight },
  secaoCabecalhoCentro: { alignItems: 'center', marginBottom: 18 },
  pillClaro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 10,
  },
  pillClaroTexto: { color: colors.primary, fontSize: 11, fontWeight: '600' },
  secaoTitulo: { fontSize: 20, fontWeight: '800', color: colors.text, textAlign: 'center' },
  secaoSubtitulo: { fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 6, lineHeight: 18 },

  // Features
  featureCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 14,
  },
  featureTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  featureIcone: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  featureStatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  featureStatTexto: { fontSize: 10, color: colors.muted, fontWeight: '600' },
  featureTitulo: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 6 },
  featureDescricao: { fontSize: 13, color: colors.muted, lineHeight: 19 },
  featureLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  featureLinkTexto: { color: colors.primary, fontWeight: '700', fontSize: 13 },

  // Missão
  missaoItem: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  missaoIcone: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missaoTexto: { flex: 1 },
  missaoTitulo: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 2 },
  missaoDescricao: { fontSize: 12, color: colors.muted, lineHeight: 17 },

  // FAQ
  faqItem: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  faqCabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  faqPergunta: { flex: 1, fontSize: 13, fontWeight: '700', color: colors.text },
  faqCorpo: { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: colors.border },
  faqResposta: { fontSize: 12, color: colors.muted, lineHeight: 18, paddingTop: 10 },

  // CTA final
  cta: { backgroundColor: colors.primary, padding: 24, alignItems: 'center', marginTop: 4 },
  ctaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 14,
  },
  ctaBadgeTexto: { color: '#fff', fontSize: 10, fontWeight: '700' },
  ctaTitulo: { color: '#fff', fontSize: 18, fontWeight: '800', textAlign: 'center', lineHeight: 24 },
  ctaTexto: { color: 'rgba(255,255,255,0.9)', fontSize: 13, textAlign: 'center', marginTop: 12, lineHeight: 19 },
  ctaBotao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 18,
  },
  ctaBotaoTexto: { color: colors.primary, fontWeight: '700', fontSize: 13 },
})
