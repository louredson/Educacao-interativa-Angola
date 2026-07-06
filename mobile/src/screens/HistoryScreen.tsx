import React, { useCallback, useState } from 'react'
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'

import { getHistorico, limparHistorico } from '../services/historyService'
import type { ConteudoRaw } from '../services/contentService'
import { colors } from '../theme/colors'
import type { AppStackParamList } from '../navigation'

const TIPO_LABEL: Record<string, string> = {
  video: 'Vídeo',
  texto_normal: 'Texto',
  texto_jindungo: 'Jindungo',
  podcast: 'Podcast',
}

export function HistoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>()
  const [itens, setItens] = useState<ConteudoRaw[]>([])

  useFocusEffect(
    useCallback(() => {
      getHistorico().then(setItens)
    }, []),
  )

  function confirmarLimpar() {
    Alert.alert('Limpar histórico', 'Isto remove todos os conteúdos vistos recentemente. Continuar?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Limpar',
        style: 'destructive',
        onPress: async () => {
          await limparHistorico()
          setItens([])
        },
      },
    ])
  }

  return (
    <View style={styles.flex}>
      {itens.length > 0 && (
        <TouchableOpacity style={styles.limparBtn} onPress={confirmarLimpar}>
          <Ionicons name="trash-outline" size={14} color={colors.danger} />
          <Text style={styles.limparTexto}>Limpar histórico</Text>
        </TouchableOpacity>
      )}

      <FlatList
        contentContainerStyle={{ padding: 12 }}
        data={itens}
        keyExtractor={(i) => String(i.id)}
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="time-outline" size={40} color={colors.muted} />
            <Text style={styles.vazio}>Ainda não viste nenhum conteúdo.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => navigation.navigate('ContentDetail', { conteudo: item })}
          >
            <View style={styles.badge}>
              <Text style={styles.badgeTexto}>{TIPO_LABEL[item.tipo] ?? item.tipo}</Text>
            </View>
            <Text style={styles.itemTitulo} numberOfLines={2}>{item.titulo}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  vazio: { color: colors.muted, fontSize: 13, textAlign: 'center', marginTop: 12 },
  limparBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  limparTexto: { color: colors.danger, fontSize: 12, fontWeight: '700' },
  item: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FBEAEA',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    marginBottom: 6,
  },
  badgeTexto: { color: colors.primary, fontSize: 10, fontWeight: '700' },
  itemTitulo: { fontSize: 14, fontWeight: '700', color: colors.text },
})
