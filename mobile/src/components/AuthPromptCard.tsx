import { View, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, radii, spacing } from '../constants/colors'
import { AppButton } from './AppButton'
import { AppCard } from './AppCard'
import { AppText } from './AppText'

interface AuthPromptCardProps {
  title: string
  description: string
  loginLabel?: string
  registerLabel?: string
  onLogin: () => void
  onRegister: () => void
}

export function AuthPromptCard({
  title,
  description,
  loginLabel = 'Entrar',
  registerLabel = 'Criar conta gratuita',
  onLogin,
  onRegister,
}: AuthPromptCardProps) {
  return (
    <AppCard>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name="lock-closed-outline" size={18} color={colors.primary} />
        </View>
        <View style={styles.textWrap}>
          <AppText variant="subtitle">{title}</AppText>
          <AppText variant="muted">{description}</AppText>
        </View>
      </View>

      <View style={styles.actions}>
        <AppButton label={loginLabel} onPress={onLogin} />
        <AppButton label={registerLabel} variant="secondary" onPress={onRegister} />
      </View>
    </AppCard>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF1F2',
  },
  textWrap: {
    flex: 1,
    gap: 4,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
})
