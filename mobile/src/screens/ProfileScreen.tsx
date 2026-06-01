import { ScrollView, StyleSheet, View } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { AppButton } from '../components/AppButton'
import { AppCard } from '../components/AppCard'
import { AppScreen } from '../components/AppScreen'
import { AppText } from '../components/AppText'
import { colors, radii, spacing } from '../constants/colors'
import { useAuth } from '../context/AuthContext'
import type { ProfileStackParamList } from '../types/navigation'
import { formatRole } from '../utils/format'

type Props = NativeStackScreenProps<ProfileStackParamList, 'Profile'>

export function ProfileScreen({ navigation }: Props) {
  const { user, signOut, refreshProfile } = useAuth()

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppCard>
          <View style={styles.badge}>
            <AppText style={styles.badgeText}>Perfil</AppText>
          </View>
          <AppText variant="title">{user?.name ?? 'Utilizador'}</AppText>
          <AppText variant="muted">{user?.email ?? '-'}</AppText>
          <View style={styles.statsGrid}>
            <Stat label="Tipo" value={formatRole(user?.role)} />
            <Stat label="Província" value={user?.province ?? '-'} />
            <Stat label="Instituição" value={user?.institution ?? '-'} />
            <Stat label="Curso" value={user?.course ?? '-'} />
          </View>
        </AppCard>

        <AppCard>
          <AppText variant="subtitle">Conta</AppText>
          <AppButton label="Atualizar perfil" variant="secondary" onPress={refreshProfile} />
          <AppButton label="Definições" variant="secondary" onPress={() => navigation.navigate('Settings')} />
          <AppButton label="Terminar sessão" variant="danger" onPress={signOut} />
        </AppCard>
      </ScrollView>
    </AppScreen>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBox}>
      <AppText style={styles.statLabel}>{label}</AppText>
      <AppText style={styles.statValue}>{value}</AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFF1F2',
  },
  badgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
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
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: '800',
  },
  statValue: {
    fontWeight: '700',
    color: colors.text,
  },
})

