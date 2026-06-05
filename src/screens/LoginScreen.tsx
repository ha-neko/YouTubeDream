import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../theme/ThemeProvider'
import * as profiles from '../services/profiles'
import * as googleAuth from '../services/googleAuth'
import type { Profile } from '../services/profiles'
import GoogleLoginButton from '../components/GoogleLoginButton'

export default function LoginScreen({ navigation }: any) {
  const { theme } = useTheme()
  const [profileList, setProfileList] = useState<Profile[]>([])
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null)
  const [newName, setNewName] = useState('')
  const [clientIdInput, setClientIdInput] = useState('')
  const [hasGoogleClientId, setHasGoogleClientId] = useState(false)

  const load = () => {
    setProfileList(profiles.getProfiles())
    setActiveProfile(profiles.getActiveProfile())
    setHasGoogleClientId(!!googleAuth.getGoogleClientId())
  }

  useEffect(() => { load() }, [])

  const handleCreate = () => {
    const name = newName.trim()
    if (!name) return
    profiles.createProfile(name)
    setNewName('')
    load()
  }

  const handleSwitch = (id: string) => {
    profiles.switchProfile(id)
    load()
  }

  const handleDelete = (id: string) => {
    const p = profileList.find(x => x.id === id)
    Alert.alert('Delete Profile', `Remove "${p?.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => { profiles.deleteProfile(id); load() },
      },
    ])
  }

  const saveClientId = () => {
    const cid = clientIdInput.trim()
    if (!cid) return
    googleAuth.configureGoogleAuth(cid)
    setHasGoogleClientId(true)
    Alert.alert('Saved', 'Google Client ID saved. Reload the app and sign in with Google.')
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 54, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={{ color: theme.text, fontSize: 22, fontWeight: '800' }}>Profiles</Text>
        </View>

        {/* Google login */}
        <Text style={{
          color: theme.textSecondary, fontSize: 11, fontWeight: '700',
          textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8,
        }}>
          Sign in with Google
        </Text>
        <GoogleLoginButton />

        {!hasGoogleClientId && Platform.OS === 'web' && (
          <View style={{
            backgroundColor: theme.bgCard, borderRadius: 12, padding: 12, marginBottom: 16,
          }}>
            <Text style={{ color: theme.textSecondary, fontSize: 11, marginBottom: 8 }}>
              Enter your Google OAuth Client ID to enable Google sign-in:
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                value={clientIdInput}
                onChangeText={setClientIdInput}
                placeholder="xxx.apps.googleusercontent.com"
                placeholderTextColor={theme.textSecondary}
                style={{
                  flex: 1, color: theme.text, fontSize: 13,
                  backgroundColor: theme.bgElevated, borderRadius: 8,
                  paddingHorizontal: 10, height: 36, marginRight: 8,
                }}
              />
              <TouchableOpacity
                onPress={saveClientId}
                style={{
                  height: 36, borderRadius: 8, backgroundColor: theme.accent,
                  paddingHorizontal: 12, justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Save</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ color: theme.textSecondary, fontSize: 9, marginTop: 6 }}>
              Get one at https://console.cloud.google.com/apis/credentials
            </Text>
          </View>
        )}

        {/* Local profiles */}
        <Text style={{
          color: theme.textSecondary, fontSize: 11, fontWeight: '700',
          textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 8,
        }}>
          Local Profiles
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder="New profile name..."
            placeholderTextColor={theme.textSecondary}
            onSubmitEditing={handleCreate}
            style={{
              flex: 1, color: theme.text, fontSize: 15,
              backgroundColor: theme.bgCard, borderRadius: 12,
              paddingHorizontal: 14, height: 44, marginRight: 8,
            }}
          />
          <TouchableOpacity
            onPress={handleCreate}
            style={{
              width: 44, height: 44, borderRadius: 12,
              backgroundColor: theme.accent, justifyContent: 'center', alignItems: 'center',
            }}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={profileList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Ionicons name="person-outline" size={48} color={theme.textSecondary} />
            <Text style={{ color: theme.textSecondary, marginTop: 12, fontSize: 14 }}>
              No profiles yet
            </Text>
            <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }}>
              Create one above to save your subscriptions and history
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isActive = item.id === activeProfile?.id
          return (
            <TouchableOpacity
              onPress={() => handleSwitch(item.id)}
              style={{
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: theme.bgCard, borderRadius: 12,
                padding: 14, marginBottom: 8,
                borderWidth: 2, borderColor: isActive ? theme.accent : 'transparent',
              }}
            >
              <View style={{
                width: 44, height: 44, borderRadius: 22,
                backgroundColor: isActive ? theme.accent : theme.bgElevated,
                justifyContent: 'center', alignItems: 'center',
              }}>
                <Text style={{ color: isActive ? '#fff' : theme.text, fontSize: 18, fontWeight: '700' }}>
                  {item.avatar}
                </Text>
              </View>

              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: theme.text, fontWeight: '600', fontSize: 15 }}>
                  {item.name}
                </Text>
                <Text style={{ color: theme.textSecondary, fontSize: 11 }}>
                  {item.subscriptions.length} subs · {item.history.length} watched
                </Text>
              </View>

              {isActive && (
                <Ionicons name="checkmark-circle" size={22} color={theme.accent} style={{ marginRight: 8 }} />
              )}

              {profileList.length > 1 && !isActive && (
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                  <Ionicons name="trash-outline" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          )
        }}
      />

      <View style={{ padding: 16 }}>
        <Text style={{ color: theme.textSecondary, fontSize: 10, textAlign: 'center', lineHeight: 14 }}>
          Profiles are stored locally on your device.{'\n'}
          Google sign-in is optional and only used to access your YouTube subscriptions.
        </Text>
      </View>
    </View>
  )
}
