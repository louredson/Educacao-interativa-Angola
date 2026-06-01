import { Pressable, StyleSheet, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Video, ResizeMode } from 'expo-av'
import { AppButton } from '../AppButton'
import { AppText } from '../AppText'
import { colors, radii, spacing } from '../../constants/colors'
import { heroSlides } from '../../constants/home'
import { useAuth } from '../../context/AuthContext'

interface HeroCarouselProps {
  onExplore?: () => void
}

export function HeroCarousel({ onExplore }: HeroCarouselProps) {
  const { isAuthenticated } = useAuth()
  const hero = heroSlides[0]

  return (
    <View style={styles.card}>
      <View style={styles.videoWrap}>
        <Video
          source={require('../../assets/hero.mp4')}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping
          isMuted
        />
        <View style={styles.videoOverlay} />
        <View style={styles.videoBadge}>
          <View style={styles.badgeDot} />
          <AppText style={styles.badgeText}>{hero.eyebrow}</AppText>
        </View>
      </View>

      <View style={styles.heroTop}>
        <View style={styles.iconBubble}>
          <Ionicons name="book-outline" size={20} color="#FFF" />
        </View>
      </View>

      <AppText variant="title" style={styles.title}>
        {hero.title}
      </AppText>
      <View style={styles.divider} />
      <AppText variant="body" style={styles.description}>
        {hero.description}
      </AppText>

      <View style={styles.actions}>
        <AppButton label="Ver conteúdos" onPress={onExplore} />
        {!isAuthenticated ? <AppButton label="Criar conta gratuita" variant="secondary" /> : null}
      </View>

      <View style={styles.slideStrip}>
        {heroSlides.map((slide, index) => (
          <Pressable key={slide.title} style={[styles.slidePill, index === 0 && styles.slidePillActive]}>
            <AppText style={[styles.slideText, index === 0 && styles.slideTextActive]}>{slide.title}</AppText>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  videoWrap: {
    height: 180,
    borderRadius: radii.lg,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#111827',
  },
  video: {
    ...StyleSheet.absoluteFill,
  },
  videoOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  videoBadge: {
    position: 'absolute',
    left: spacing.md,
    top: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(17, 24, 39, 0.72)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  badgeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FACC15',
  },
  badgeText: {
    color: '#FACC15',
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  iconBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  title: {
    marginTop: spacing.sm,
  },
  divider: {
    height: 1,
    width: 96,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  description: {
    color: colors.textMuted,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  slideStrip: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    flexWrap: 'wrap',
  },
  slidePill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  slidePillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  slideText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  slideTextActive: {
    color: '#FFFFFF',
  },
})
