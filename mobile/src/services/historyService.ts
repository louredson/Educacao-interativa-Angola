import AsyncStorage from '@react-native-async-storage/async-storage'
import type { ConteudoRaw } from './contentService'

// Histórico de conteúdos vistos. Tal como na versão web, é guardado apenas
// no dispositivo (não há tabela no backend para isto) — a diferença é que
// aqui persiste entre aberturas da app via AsyncStorage, em vez de se perder
// ao fechar a aba como acontece na web (useState em memória).
const CHAVE = 'historicoConteudos'
const MAX_ITENS = 20

export async function getHistorico(): Promise<ConteudoRaw[]> {
  try {
    const raw = await AsyncStorage.getItem(CHAVE)
    return raw ? (JSON.parse(raw) as ConteudoRaw[]) : []
  } catch {
    return []
  }
}

export async function registarNoHistorico(conteudo: ConteudoRaw): Promise<ConteudoRaw[]> {
  const atual = await getHistorico()
  const atualizado = [conteudo, ...atual.filter((c) => c.id !== conteudo.id)].slice(0, MAX_ITENS)
  try {
    await AsyncStorage.setItem(CHAVE, JSON.stringify(atualizado))
  } catch {
    /* falha a guardar não deve impedir a navegação */
  }
  return atualizado
}

export async function limparHistorico(): Promise<void> {
  await AsyncStorage.removeItem(CHAVE)
}
