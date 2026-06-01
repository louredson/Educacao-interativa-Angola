import { ScrollView, StyleSheet } from 'react-native'
import { AppCard } from '../components/AppCard'
import { AppScreen } from '../components/AppScreen'
import { AppText } from '../components/AppText'
import { SectionHeader } from '../components/SectionHeader'
import { spacing } from '../constants/colors'

export function AboutScreen() {
  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionHeader title="Sobre" subtitle="Informações da plataforma móvel" />
        <AppCard>
          <AppText variant="subtitle">Economia com História</AppText>
          <AppText variant="body">
            Esta app mobile foi criada para consumir a mesma API da versão web, sem backend próprio nem base de dados local.
          </AppText>
          <AppText variant="body">
            A autenticação, conteúdos, notificações e recuperação de senha são sincronizados com o backend principal.
          </AppText>
        </AppCard>
      </ScrollView>
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
})


