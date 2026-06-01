import { navigationRef } from '../navigation/navigationRef'

const tabRoutes = new Set([
  'HomeTab',
  'ExploreTab',
  'ResourcesTab',
  'ForumTab',
  'ContentsTab',
  'NotificationsTab',
  'ProfileTab',
  'AboutTab',
])

const authRoutes = new Set(['Auth', 'Login', 'Register', 'ForgotPassword'])

export function navigateToTopLevel(_navigation: any, route: string, params?: object) {
  if (!navigationRef.isReady()) return
  const nav = navigationRef as any

  if (tabRoutes.has(route)) {
    nav.navigate('Main', { screen: route })
    return
  }

  if (authRoutes.has(route)) {
    if (route === 'Login' || route === 'Register' || route === 'ForgotPassword') {
      nav.navigate('Auth', { screen: route })
      return
    }

    nav.navigate('Auth')
    return
  }

  nav.navigate(route, params)
}
