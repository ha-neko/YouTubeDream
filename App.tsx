import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { ThemeProvider } from './src/theme/ThemeProvider'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { getGoogleClientId } from './src/services/googleAuth'
import AppNavigator from './src/navigation/AppNavigator'

export default function App() {
  const clientId = getGoogleClientId()

  const inner = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </ThemeProvider>
    </GestureHandlerRootView>
  )

  if (clientId) {
    return (
      <GoogleOAuthProvider clientId={clientId}>
        {inner}
      </GoogleOAuthProvider>
    )
  }

  return inner
}
