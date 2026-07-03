import React from 'react'
import { ActivityIndicator, View } from 'react-native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'

import { useAuth } from '../contexts/AuthContext'
import { colors } from '../theme/colors'

import { LoginScreen } from '../screens/auth/LoginScreen'
import { RegisterScreen } from '../screens/auth/RegisterScreen'
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen'
import { HomeScreen } from '../screens/HomeScreen'
import { ExplorarScreen } from '../screens/ExplorarScreen'
import { ContentDetailScreen } from '../screens/ContentDetailScreen'
import { PlaylistScreen } from '../screens/PlaylistScreen'
import { HistoryScreen } from '../screens/HistoryScreen'
import { JindungoRequestsScreen } from '../screens/JindungoRequestsScreen'
import { ForumScreen } from '../screens/ForumScreen'
import { ForumTopicScreen } from '../screens/ForumTopicScreen'
import { QuizzesScreen } from '../screens/QuizzesScreen'
import { QuizPlayScreen } from '../screens/QuizPlayScreen'
import { ProfileScreen } from '../screens/ProfileScreen'
import { EditProfileScreen } from '../screens/EditProfileScreen'
import { NotificationsScreen } from '../screens/NotificationsScreen'
import { SalasScreen } from '../screens/SalasScreen'
import type { ConteudoRaw } from '../services/contentService'

export type TabsParamList = {
  Inicio: undefined
  Explorar: undefined
  Forum: undefined
  Salas: undefined
  Quizzes: undefined
  Perfil: undefined
}

export type AppStackParamList = {
  Tabs: undefined
  ContentDetail: { conteudo: ConteudoRaw }
  ForumTopic: { id: number; titulo: string }
  QuizPlay: { id: number; titulo: string }
  Notifications: undefined
  Login: undefined
  Register: undefined
  ForgotPassword: undefined
  EditProfile: undefined
  Playlist: undefined
  History: undefined
  JindungoRequests: undefined
}

const AppStack = createNativeStackNavigator<AppStackParamList>()
const Tabs = createBottomTabNavigator<TabsParamList>()

const ICONS: Record<keyof TabsParamList, keyof typeof Ionicons.glyphMap> = {
  Inicio: 'home',
  Explorar: 'compass',
  Forum: 'chatbubbles',
  Salas: 'people',
  Quizzes: 'help-circle',
  Perfil: 'person',
}

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#fff',
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONS[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tabs.Screen name="Inicio" component={HomeScreen} options={{ title: 'Início' }} />
      <Tabs.Screen name="Explorar" component={ExplorarScreen} />
      <Tabs.Screen name="Forum" component={ForumScreen} options={{ title: 'Fórum' }} />
      <Tabs.Screen name="Salas" component={SalasScreen} options={{ title: 'Salas' }} />
      <Tabs.Screen name="Quizzes" component={QuizzesScreen} />
      <Tabs.Screen name="Perfil" component={ProfileScreen} />
    </Tabs.Navigator>
  )
}

export function AppNavigation() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  // As tabs principais estão sempre acessíveis (navegação como visitante).
  // Login e Registo são ecrãs opcionais, abertos a partir do Perfil/Início.
  return (
    <AppStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#fff',
      }}
    >
      <AppStack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />
      <AppStack.Screen name="ContentDetail" component={ContentDetailScreen} options={{ title: 'Conteúdo' }} />
      <AppStack.Screen name="ForumTopic" component={ForumTopicScreen} options={{ title: 'Tópico' }} />
      <AppStack.Screen name="QuizPlay" component={QuizPlayScreen} options={{ title: 'Quiz' }} />
      <AppStack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notificações' }}
      />
      <AppStack.Screen name="Login" component={LoginScreen} options={{ title: 'Entrar' }} />
      <AppStack.Screen name="Register" component={RegisterScreen} options={{ title: 'Criar conta' }} />
      <AppStack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ title: 'Recuperar senha' }}
      />
      <AppStack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Editar perfil' }} />
      <AppStack.Screen name="Playlist" component={PlaylistScreen} options={{ title: 'A minha playlist' }} />
      <AppStack.Screen name="History" component={HistoryScreen} options={{ title: 'Histórico' }} />
      <AppStack.Screen
        name="JindungoRequests"
        component={JindungoRequestsScreen}
        options={{ title: 'Pedidos de Acesso Jindungo' }}
      />
    </AppStack.Navigator>
  )
}
