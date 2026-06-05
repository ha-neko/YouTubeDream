import { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../theme/ThemeProvider'
import Header from '../components/Header'
import * as profiles from '../services/profiles'
import type { Theme } from '../theme/types'

export default function SettingsScreen({ navigation }: any) {
  const { theme, fullTheme, setTheme, availableThemes } = useTheme()
  const [activeProfile, setActiveProfile] = useState<any>(null)

  useEffect(() => {
    setActiveProfile(profiles.getActiveProfile())
  }, [])

  const handleSelect = (t: Theme) => setTheme(t)

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <Header subtitle="Customize your experience" />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}>
        {/* Profile */}
        <Text style={{
          color: theme.textSecondary, fontSize: 12, fontWeight: '700',
          textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginTop: 8,
        }}>
          Profile
        </Text>

        <TouchableOpacity
          onPress={() => navigation.navigate('Profiles')}
          style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: theme.bgCard, borderRadius: 12, padding: 14, marginBottom: 8,
          }}
        >
          <View style={{
            width: 44, height: 44, borderRadius: 22,
            backgroundColor: activeProfile ? theme.accent : theme.bgElevated,
            justifyContent: 'center', alignItems: 'center',
          }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>
              {activeProfile?.avatar ?? '?'}
            </Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ color: theme.text, fontWeight: '600', fontSize: 15 }}>
              {activeProfile?.name ?? 'No profile'}
            </Text>
            <Text style={{ color: theme.textSecondary, fontSize: 11 }}>
              {activeProfile
                ? `${activeProfile.subscriptions.length} subs · ${activeProfile.history.length} watched`
                : 'Create a profile to save history'
              }
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        </TouchableOpacity>

        {/* Themes section */}
        <Text style={{
          color: theme.textSecondary, fontSize: 12, fontWeight: '700',
          textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginTop: 24,
        }}>
          Themes
        </Text>

        {availableThemes.length === 0 ? (
          <Text style={{ color: theme.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 20 }}>
            No themes available
          </Text>
        ) : (
          availableThemes.map((t) => {
            const isActive = t.id === fullTheme.id
            const c = t.colors
            return (
              <TouchableOpacity
                key={t.id}
                onPress={() => handleSelect(t)}
                style={{
                  flexDirection: 'row', alignItems: 'center',
                  backgroundColor: theme.bgCard, borderRadius: 12,
                  padding: 14, marginBottom: 8,
                  borderWidth: 2, borderColor: isActive ? theme.accent : 'transparent',
                }}
              >
                <View style={{
                  width: 44, height: 44, borderRadius: 10,
                  backgroundColor: c.bg, overflow: 'hidden',
                  borderWidth: 1, borderColor: c.border,
                }}>
                  <View style={{ flex: 1, padding: 4 }}>
                    <View style={{ flexDirection: 'row', gap: 3, marginBottom: 3 }}>
                      <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: c.accent }} />
                      <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: c.textSecondary }} />
                    </View>
                    <View style={{ width: '60%', height: 4, borderRadius: 2, backgroundColor: c.text }} />
                  </View>
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: theme.text, fontWeight: '600', fontSize: 14 }}>
                    {t.name}
                  </Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 11 }}>
                    by {t.author}{t.description ? ` · ${t.description}` : ''}
                  </Text>
                </View>

                {isActive && (
                  <Ionicons name="checkmark-circle" size={22} color={theme.accent} />
                )}
              </TouchableOpacity>
            )
          })
        )}

        <View style={{ marginTop: 24, paddingHorizontal: 4 }}>
          <Text style={{ color: theme.textSecondary, fontSize: 12, lineHeight: 18 }}>
            Want more themes? Create a JSON file with color tokens and place it in the app's themes folder.
            Profiles, history, and subscriptions are stored locally on your device.
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}
