import React, { useState } from 'react'
import { FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../theme/colors'

interface Props {
  label: string
  placeholder?: string
  value: string
  options: string[]
  onChange: (valor: string) => void
  /** Mostra uma caixa de pesquisa quando há muitas opções (ex: instituições). */
  pesquisavel?: boolean
}

/**
 * Substituto simples do <select> nativo do browser (que o React Native não
 * tem) — um campo que abre uma lista em modal. Sem dependências novas.
 */
export default function SelectModal({ label, placeholder, value, options, onChange, pesquisavel }: Props) {
  const [aberto, setAberto] = useState(false)
  const [pesquisa, setPesquisa] = useState('')

  const filtradas = pesquisa.trim()
    ? options.filter((o) => o.toLowerCase().includes(pesquisa.trim().toLowerCase()))
    : options

  return (
    <View style={styles.campo}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.campoBtn} onPress={() => setAberto(true)}>
        <Text style={value ? styles.valorTexto : styles.placeholderTexto} numberOfLines={1}>
          {value || placeholder || 'Selecionar'}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.muted} />
      </TouchableOpacity>

      <Modal visible={aberto} animationType="slide" transparent onRequestClose={() => setAberto(false)}>
        <View style={styles.overlay}>
          <View style={styles.folha}>
            <View style={styles.folhaTopo}>
              <Text style={styles.folhaTitulo}>{label}</Text>
              <TouchableOpacity onPress={() => setAberto(false)}>
                <Ionicons name="close" size={22} color={colors.muted} />
              </TouchableOpacity>
            </View>

            {pesquisavel && (
              <TextInput
                style={styles.pesquisaInput}
                placeholder="Pesquisar..."
                placeholderTextColor={colors.muted}
                value={pesquisa}
                onChangeText={setPesquisa}
              />
            )}

            <FlatList
              data={filtradas}
              keyExtractor={(item) => item}
              style={{ maxHeight: 380 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.opcao}
                  onPress={() => {
                    onChange(item)
                    setAberto(false)
                    setPesquisa('')
                  }}
                >
                  <Text style={[styles.opcaoTexto, item === value && styles.opcaoTextoAtiva]}>{item}</Text>
                  {item === value && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.vazio}>Sem resultados.</Text>}
            />
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  campo: { marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '700', color: colors.text, marginBottom: 6 },
  campoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  valorTexto: { fontSize: 15, color: colors.text, flex: 1 },
  placeholderTexto: { fontSize: 15, color: colors.muted, flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  folha: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 24,
    maxHeight: '75%',
  },
  folhaTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  folhaTitulo: { fontSize: 16, fontWeight: '800', color: colors.text },
  pesquisaInput: {
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  opcao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  opcaoTexto: { fontSize: 14, color: colors.text, flex: 1, paddingRight: 8 },
  opcaoTextoAtiva: { color: colors.primary, fontWeight: '700' },
  vazio: { textAlign: 'center', color: colors.muted, paddingVertical: 20 },
})
