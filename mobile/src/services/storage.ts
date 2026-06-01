import AsyncStorage from '@react-native-async-storage/async-storage'
import { storageKeys } from '../constants/storage'
import type { User } from '../types/api'

export async function saveSession(token: string, user: User) {
  await AsyncStorage.multiSet([
    [storageKeys.token, token],
    [storageKeys.user, JSON.stringify(user)],
  ])
}

export async function clearSession() {
  await AsyncStorage.multiRemove([storageKeys.token, storageKeys.user])
}

export async function getStoredToken() {
  return AsyncStorage.getItem(storageKeys.token)
}

export async function getStoredUser() {
  const value = await AsyncStorage.getItem(storageKeys.user)
  return value ? (JSON.parse(value) as User) : null
}

export async function setDemoMode(enabled: boolean) {
  if (enabled) {
    await AsyncStorage.setItem(storageKeys.demoMode, 'true')
    return
  }

  await AsyncStorage.removeItem(storageKeys.demoMode)
}

export async function isDemoModeStored() {
  return (await AsyncStorage.getItem(storageKeys.demoMode)) === 'true'
}
