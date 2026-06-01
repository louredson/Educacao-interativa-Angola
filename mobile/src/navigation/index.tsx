import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import { useMemo } from 'react'
import { StyleSheet } from 'react-native'
import type { ComponentProps } from 'react'
import { colors } from '../constants/colors'
import { useAuth } from '../context/AuthContext'
import { AboutScreen } from '../screens/AboutScreen'
import { ExploreScreen } from '../screens/ExploreScreen'
import { ContentDetailScreen } from '../screens/ContentDetailScreen'
import { ContentListScreen } from '../screens/ContentListScreen'
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen'
import { ForumScreen } from '../screens/ForumScreen'
import { HomeScreen } from '../screens/HomeScreen'
import { LoginScreen } from '../screens/LoginScreen'
import { NotificationsScreen } from '../screens/NotificationsScreen'
import { ProfileScreen } from '../screens/ProfileScreen'
import { RegisterScreen } from '../screens/RegisterScreen'
import { ResourcesScreen } from '../screens/ResourcesScreen'
import { SettingsScreen } from '../screens/SettingsScreen'
import { SplashScreen } from '../screens/SplashScreen'
import type {
  AppTabParamList,
  AuthStackParamList,
  ContentStackParamList,
  HomeStackParamList,
  ProfileStackParamList,
  RootStackParamList,
} from '../types/navigation'

type IoniconName = ComponentProps<typeof Ionicons>['name']

const RootStack = createNativeStackNavigator<RootStackParamList>()
const AuthStack = createNativeStackNavigator<AuthStackParamList>()
const HomeStack = createNativeStackNavigator<HomeStackParamList>()
const ContentStack = createNativeStackNavigator<ContentStackParamList>()
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>()
const Tab = createBottomTabNavigator<AppTabParamList>()

function stackOptions(title?: string) {
  return {
    title,
    headerStyle: {
      backgroundColor: colors.background,
    },
    headerTintColor: colors.text,
    headerShadowVisible: false,
    headerTitleStyle: {
      fontWeight: '700' as const,
    },
    contentStyle: {
      backgroundColor: colors.background,
    },
  }
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  )
}

function HomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={() => stackOptions('Início')}>
      <HomeStack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <HomeStack.Screen
        name="ContentDetail"
        component={ContentDetailScreen}
        options={{ title: 'Detalhe do conteúdo' }}
      />
    </HomeStack.Navigator>
  )
}

function ContentNavigator() {
  return (
    <ContentStack.Navigator screenOptions={() => stackOptions('Conteúdos')}>
      <ContentStack.Screen name="ContentList" component={ContentListScreen} options={{ headerShown: false }} />
      <ContentStack.Screen
        name="ContentDetail"
        component={ContentDetailScreen}
        options={{ title: 'Detalhe do conteúdo' }}
      />
    </ContentStack.Navigator>
  )
}

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={() => stackOptions('Perfil')}>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
      <ProfileStack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Configurações' }} />
    </ProfileStack.Navigator>
  )
}

function MainTabs() {
  const tabBarIcon = useMemo(
    () =>
      (iconName: IoniconName) =>
      ({ color, size }: { color: string; size: number }) =>
        <Ionicons name={iconName} size={size} color={color} />,
    [],
  )

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: styles.hiddenTabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeNavigator}
        options={{
          title: 'Início',
          tabBarIcon: tabBarIcon('home-outline'),
        }}
      />
      <Tab.Screen
        name="ExploreTab"
        component={ExploreScreen}
        options={{
          title: 'Explorar',
          tabBarIcon: tabBarIcon('compass-outline'),
        }}
      />
      <Tab.Screen
        name="ResourcesTab"
        component={ResourcesScreen}
        options={{
          title: 'Recursos',
          tabBarIcon: tabBarIcon('map-outline'),
        }}
      />
      <Tab.Screen
        name="ForumTab"
        component={ForumScreen}
        options={{
          title: 'Fórum',
          tabBarIcon: tabBarIcon('chatbubbles-outline'),
        }}
      />
      <Tab.Screen
        name="ContentsTab"
        component={ContentNavigator}
        options={{
          title: 'Conteúdos',
          tabBarIcon: tabBarIcon('library-outline'),
        }}
      />
      <Tab.Screen
        name="NotificationsTab"
        component={NotificationsScreen}
        options={{
          title: 'Notificações',
          tabBarIcon: tabBarIcon('notifications-outline'),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileNavigator}
        options={{
          title: 'Perfil',
          tabBarIcon: tabBarIcon('person-outline'),
        }}
      />
      <Tab.Screen
        name="AboutTab"
        component={AboutScreen}
        options={{
          title: 'Sobre',
          tabBarIcon: tabBarIcon('information-circle-outline'),
        }}
      />
    </Tab.Navigator>
  )
}

export function AppNavigator() {
  const { isBootstrapping } = useAuth()

  if (isBootstrapping) {
    return <SplashScreen />
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Main" component={MainTabs} />
      <RootStack.Screen name="Auth" component={AuthNavigator} />
    </RootStack.Navigator>
  )
}

const styles = StyleSheet.create({
  hiddenTabBar: {
    display: 'none',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
})

