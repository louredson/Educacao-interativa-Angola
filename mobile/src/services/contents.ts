import { api } from './api'
import { demoModeEnabled } from '../constants/mode'
import { demoContents } from '../mocks/data'
import { isDemoModeStored } from './storage'
import type { ContentItem } from '../types/api'

export async function listContents() {
  if (demoModeEnabled || (await isDemoModeStored())) {
    return demoContents
  }

  const { data } = await api.get<ContentItem[]>('/conteudos')
  return data
}

export async function getContentById(id: number) {
  if (demoModeEnabled || (await isDemoModeStored())) {
    const item = demoContents.find((content) => content.id === id)
    if (!item) {
      throw new Error('Conteúdo não encontrado')
    }
    return item
  }

  const { data } = await api.get<ContentItem>(`/conteudos/${id}`)
  return data
}
