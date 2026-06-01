import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native'
import { colors, radii, spacing } from '../constants/colors'

interface AppButtonProps {
  label: string
  onPress?: () => void
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  style?: ViewStyle
  disabled?: boolean
}

export function AppButton({
  label,
  onPress,
  loading = false,
  variant = 'primary',
  style,
  disabled = false,
}: AppButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !disabled ? styles.pressed : null,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? '#FFFFFF' : colors.primary} />
      ) : (
        <Text style={[styles.label, variant === 'secondary' || variant === 'ghost' ? styles.labelDark : styles.labelLight]}>
          {label}
        </Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: colors.danger,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.6,
  },
  label: {
    fontSize: 15,
    fontWeight: '800',
  },
  labelLight: {
    color: '#FFFFFF',
  },
  labelDark: {
    color: colors.text,
  },
})

