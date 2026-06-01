import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import { AppButton } from '../components/AppButton'
import { AppCard } from '../components/AppCard'
import { AppScreen } from '../components/AppScreen'
import { AppText } from '../components/AppText'
import { AngolaMap } from '../components/home/AngolaMap'
import { HeroCarousel } from '../components/home/HeroCarousel'
import { colors, radii, spacing } from '../constants/colors'
import { faqs, features, missionItems, statsData } from '../constants/home'
import type { HomeStackParamList } from '../types/navigation'
import { navigateToTopLevel } from '../utils/navigation'

type Props = NativeStackScreenProps<HomeStackParamList, 'Home'>

export function HomeScreen({ navigation }: Props) {
  const [openFaqs, setOpenFaqs] = useState<number[]>([])

  const toggleFaq = (index: number) => {
    setOpenFaqs((prev) =>
      prev.includes(index) ? prev.filter((item) => item !== index) : [...prev, index],
    )
  }

  return (
    <AppScreen>
      <View style={styles.root}>
        <HeroCarousel onExplore={() => navigateToTopLevel(navigation, 'ContentsTab')} />

        <AppCard>
          <View style={styles.statsGrid}>
            {statsData.map((stat) => (
              <View key={stat.label} style={styles.statBox}>
                <AppText variant="subtitle" style={styles.statValue}>
                  {stat.value}
                </AppText>
                <AppText variant="muted">{stat.label}</AppText>
              </View>
            ))}
          </View>
        </AppCard>

        <View style={styles.sectionHeader}>
          <View style={styles.badge}>
            <Ionicons name="sparkles" size={12} color={colors.primary} />
            <AppText style={styles.badgeText}>Plataforma Educacional</AppText>
          </View>
          <AppText variant="subtitle">Explore a Plataforma</AppText>
          <AppText variant="muted">
            As mesmas áreas da web, adaptadas para o ecrã móvel com navegação rápida e direta.
          </AppText>
        </View>

        <View style={styles.featureGrid}>
          {features.map((feature) => (
            <AppCard key={feature.title}>
              <View style={styles.featureTop}>
                <View style={styles.featureIcon}>
                  <Ionicons name={feature.icon} size={20} color="#FFF" />
                </View>
                <View style={styles.featureStat}>
                  <Ionicons name="flash" size={12} color="#EAB308" />
                  <AppText style={styles.featureStatText}>{feature.stat}</AppText>
                </View>
              </View>
              <AppText variant="subtitle" style={styles.featureTitle}>
                {feature.title}
              </AppText>
              <AppText variant="muted">{feature.description}</AppText>
              <AppButton
                label="Explorar agora"
                variant="ghost"
                onPress={() => navigateToTopLevel(navigation, 'ContentsTab')}
              />
            </AppCard>
          ))}
        </View>

        <AngolaMap />

        <View style={styles.sectionHeader}>
          <AppText variant="subtitle">A Nossa Missão</AppText>
          <AppText variant="muted">
            Comprometidos com a educação e valorização da história económica de Angola.
          </AppText>
        </View>

        <View style={styles.missionGrid}>
          {missionItems.map((item) => (
            <AppCard key={item.title}>
              <View style={styles.missionTop}>
                <View style={[styles.missionIcon, { backgroundColor: `${item.color}20` }]}>
                  <Ionicons name={item.icon} size={18} color={item.color} />
                </View>
                <View style={styles.missionText}>
                  <AppText variant="subtitle" style={styles.missionTitle}>
                    {item.title}
                  </AppText>
                  <AppText variant="muted">{item.description}</AppText>
                </View>
              </View>
            </AppCard>
          ))}
        </View>

        <AppCard>
          <View style={styles.sectionHeaderCompact}>
            <View style={styles.badge}>
              <Ionicons name="help-circle" size={12} color={colors.primary} />
              <AppText style={styles.badgeText}>Perguntas Frequentes</AppText>
            </View>
            <AppText variant="subtitle">Dúvidas rápidas e úteis</AppText>
          </View>

          <View style={styles.faqList}>
            {faqs.map((faq, index) => {
              const open = openFaqs.includes(index)
              return (
                <View key={faq.question} style={styles.faqItem}>
                  <Pressable onPress={() => toggleFaq(index)} style={styles.faqButton}>
                    <AppText variant="body" style={styles.faqQuestion}>
                      {faq.question}
                    </AppText>
                    <Ionicons
                      name={open ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={colors.textMuted}
                    />
                  </Pressable>
                  {open ? (
                    <View style={styles.faqAnswerWrap}>
                      <AppText variant="muted" style={styles.faqAnswer}>
                        {faq.answer}
                      </AppText>
                    </View>
                  ) : null}
                </View>
              )
            })}
          </View>
        </AppCard>

        <AppCard>
          <View style={styles.ctaBadge}>
            <View style={styles.ctaDot} />
            <AppText style={styles.ctaBadgeText}>Feito em Angola - para Angola</AppText>
          </View>
          <AppText variant="subtitle" style={styles.ctaTitle}>
            A nossa história e economia merecem ser conhecidas
          </AppText>
          <AppText variant="muted" style={styles.ctaDescription}>
            Do glorioso Reino do Kongo à economia diversificada e vibrante de hoje, explora o
            conhecimento que nos define como povo resiliente.
          </AppText>
          <AppButton label="Começar agora" onPress={() => navigateToTopLevel(navigation, 'ContentsTab')} />
        </AppCard>
      </View>
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statBox: {
    flexBasis: '48%',
    flexGrow: 1,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  statValue: {
    color: colors.primary,
  },
  sectionHeader: {
    gap: 6,
  },
  sectionHeaderCompact: {
    gap: 6,
    marginBottom: spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  featureGrid: {
    gap: spacing.md,
  },
  featureTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  featureIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  featureStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
  },
  featureStatText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '700',
  },
  featureTitle: {
    marginTop: spacing.xs,
  },
  missionGrid: {
    gap: spacing.md,
  },
  missionTop: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  missionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missionText: {
    flex: 1,
    gap: 4,
  },
  missionTitle: {
    marginBottom: 0,
  },
  faqList: {
    gap: spacing.sm,
  },
  faqItem: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  faqButton: {
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  faqQuestion: {
    flex: 1,
    fontWeight: '700',
  },
  faqAnswerWrap: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.surfaceAlt,
  },
  faqAnswer: {
    lineHeight: 21,
  },
  ctaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.primary,
    marginBottom: spacing.sm,
  },
  ctaDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FACC15',
  },
  ctaBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  ctaTitle: {
    textAlign: 'center',
  },
  ctaDescription: {
    textAlign: 'center',
  },
})
