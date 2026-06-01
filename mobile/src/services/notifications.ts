import { api } from './api'
import { demoModeEnabled } from '../constants/mode'
import { demoNotifications } from '../mocks/data'
import { isDemoModeStored } from './storage'
import type { NotificationItem } from '../types/api'

export async function listNotifications() {
  if (demoModeEnabled || (await isDemoModeStored())) {
    return demoNotifications
  }

  const { data } = await api.get<NotificationItem[]>('/notificacoes')
  return data
}

export async function markNotificationAsRead(id: number) {
  if (demoModeEnabled || (await isDemoModeStored())) {
    return { message: 'Notificação marcada como lida em modo demo.' }
  }

  const { data } = await api.patch<{ message: string }>(`/notificacoes/${id}/lida`)
  return data
}

export async function markAllNotificationsAsRead() {
  if (demoModeEnabled || (await isDemoModeStored())) {
    return { message: 'Todas as notificações foram marcadas como lidas em modo demo.' }
  }

  const { data } = await api.patch<{ message: string }>('/notificacoes/ler-todas')
  return data
}
