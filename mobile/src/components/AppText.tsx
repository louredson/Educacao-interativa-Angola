import { Text, type TextProps, StyleSheet } from 'react-native'
import { colors } from '../constants/colors'

interface AppTextProps extends TextProps {
  variant?: 'title' | 'subtitle' | 'body' | 'muted' | 'label'
  align?: 'left' | 'center' | 'right'
}

export function AppText({ variant = 'body', align = 'left', style, children, ...props }: AppTextProps) {
  return (
    <Text
      {...props}
      style={[
        styles.base,
        styles[variant],
        { textAlign: align },
        style,
      ]}
    >
      {children}
    </Text>
  )
}

const styles = StyleSheet.create({
  base: {
    color: colors.text,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
  muted: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
})

