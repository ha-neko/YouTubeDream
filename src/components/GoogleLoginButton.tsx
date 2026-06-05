import { View, Text, TouchableOpacity, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../theme/ThemeProvider'
import { isGoogleAuthAvailable, getGoogleClientId, setGoogleToken, getGoogleUser } from '../services/googleAuth'
import * as profiles from '../services/profiles'
import { useEffect, useState } from 'react'

interface Props {
  onLogin?: (profile: any) => void
}

export default function GoogleLoginButton({ onLogin }: Props) {
  const { theme } = useTheme()
  const [available, setAvailable] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    setAvailable(isGoogleAuthAvailable())
    setUser(getGoogleUser())
  }, [])

  if (!available) {
    return (
      <View style={{
        backgroundColor: theme.bgCard, borderRadius: 12, padding: 14,
        marginBottom: 8, alignItems: 'center',
      }}>
        <Ionicons name="logo-google" size={24} color={theme.textSecondary} />
        <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 8, textAlign: 'center' }}>
          Google login requires a Client ID.{'\n'}
          Add your Client ID in Settings or create a local profile below.
        </Text>
      </View>
    )
  }

  if (user) {
    return (
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: theme.bgCard, borderRadius: 12, padding: 14, marginBottom: 8,
      }}>
        <View style={{
          width: 36, height: 36, borderRadius: 18,
          backgroundColor: theme.accent, justifyContent: 'center', alignItems: 'center',
        }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
            {user.name?.charAt(0) ?? 'G'}
          </Text>
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={{ color: theme.text, fontWeight: '600', fontSize: 14 }}>{user.name}</Text>
          <Text style={{ color: theme.textSecondary, fontSize: 11 }}>{user.email}</Text>
        </View>
        <Ionicons name="checkmark-circle" size={20} color={theme.accent} />
      </View>
    )
  }

  return null
}
