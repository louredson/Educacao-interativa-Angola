import type { ContentItem } from './api'

export type RootStackParamList = {
  Splash: undefined
  Main: undefined
  Auth: undefined
}

export type AuthStackParamList = {
  Login: undefined
  Register: undefined
  ForgotPassword: undefined
}

export type AppTabParamList = {
  HomeTab: undefined
  ExploreTab: undefined
  ResourcesTab: undefined
  ForumTab: undefined
  ContentsTab: undefined
  NotificationsTab: undefined
  ProfileTab: undefined
  AboutTab: undefined
}

export type HomeStackParamList = {
  Home: undefined
  ContentDetail: { contentId: number; content?: ContentItem }
}

export type ContentStackParamList = {
  ContentList: undefined
  ContentDetail: { contentId: number; content?: ContentItem }
}

export type ProfileStackParamList = {
  Profile: undefined
  Settings: undefined
}
