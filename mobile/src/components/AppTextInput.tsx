import { forwardRef } from 'react'
import { StyleSheet, TextInput, type TextInputProps, View } from 'react-native'
import { colors, radii, spacing } from '../constants/colors'
import { AppText } from './AppText'

interface AppTextInputProps extends TextInputProps {
  label?: string
  error?: string | null
}

export const AppTextInput = forwardRef<TextInput, AppTextInputProps>(function AppTextInput(
  { label, error, style, ...props },
  ref,
) {
  return (
    <View style={styles.wrapper}>
      {label ? <AppText variant="label">{label}</AppText> : null}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, error ? styles.inputError : null, style]}
        {...props}
      />
      {error ? <AppText style={styles.error}>{error}</AppText> : null}
    </View>
  )
})

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  input: {
    minHeight: 50,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: 15,
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    color: colors.danger,
    fontSize: 12,
  },
})

