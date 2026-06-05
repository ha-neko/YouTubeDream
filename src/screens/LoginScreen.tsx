import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../theme/ThemeProvider'
import * as profiles from '../services/profiles'
import type { Profile } from '../services/profiles'

export default function LoginScreen({ navigation }: any) {
  const { theme } = useTheme()
  const [profileList, setProfileList] = useState<Profile[]>([])
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null)
  const [newName, setNewName] = useState('')

  const load = () => {
    setProfileList(profiles.getProfiles())
    setActiveProfile(profiles.getActiveProfile())
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
    Alert.alert('Delete Profile', `Remove "${p?.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => { profiles.deleteProfile(id); load() },
      },
    ])
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
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <Ionicons name="person-outline" size={48} color={theme.textSecondary} />
            <Text style={{ color: theme.textSecondary, marginTop: 12, fontSize: 14 }}>
              No profiles yet
            </Text>
            <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }}>
              Create one to save your subscriptions and history
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
                <Text style={{
                  color: isActive ? '#fff' : theme.text,
                  fontSize: 18, fontWeight: '700',
                }}>
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
        <Text style={{ color: theme.textSecondary, fontSize: 11, textAlign: 'center', lineHeight: 16 }}>
          Profiles are stored locally on your device. No accounts are synced to the cloud.
          Your watch history and subscriptions stay private.
        </Text>
      </View>
    </View>
  )
}
