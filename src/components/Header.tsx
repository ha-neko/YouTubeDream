import { View, Text, TextInput, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../theme/ThemeProvider'

interface Props {
  searchValue?: string
  onSearchChange?: (text: string) => void
  onSearchSubmit?: () => void
  searchPlaceholder?: string
  onSettingsPress?: () => void
  subtitle?: string
}

export default function Header({
  searchValue,
  onSearchChange,
  onSearchSubmit,
  searchPlaceholder = 'Search...',
  onSettingsPress,
  subtitle,
}: Props) {
  const { theme } = useTheme()

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 54, paddingBottom: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: subtitle ? 2 : 10 }}>
        <View style={{
          width: 36, height: 36, borderRadius: 10,
          backgroundColor: theme.accent,
          justifyContent: 'center', alignItems: 'center',
          marginRight: 10,
        }}>
          <Text style={{ fontSize: 18, lineHeight: 20 }}>⚈ ‿ ⚈</Text>
        </View>
        <Text style={{
          color: theme.text, fontSize: 22, fontWeight: '800',
          letterSpacing: -0.5,
        }}>
          YouTube
          <Text style={{ color: theme.accent }}>Dream</Text>
        </Text>
        <View style={{ flex: 1 }} />
        {onSettingsPress && (
          <TouchableOpacity
            onPress={onSettingsPress}
            style={{
              width: 36, height: 36, borderRadius: 10,
              backgroundColor: theme.bgCard,
              justifyContent: 'center', alignItems: 'center',
            }}
          >
            <Ionicons name="settings-outline" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {subtitle && (
        <Text style={{ color: theme.textSecondary, fontSize: 13, marginBottom: 10, marginLeft: 2 }}>
          {subtitle}
        </Text>
      )}

      {searchValue !== undefined && onSearchChange && onSearchSubmit && (
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          backgroundColor: theme.bgCard, borderRadius: 12,
          paddingHorizontal: 14, height: 44,
        }}>
          <Ionicons name="search" size={18} color={theme.textSecondary} />
          <TextInput
            value={searchValue}
            onChangeText={onSearchChange}
            onSubmitEditing={onSearchSubmit}
            placeholder={searchPlaceholder}
            placeholderTextColor={theme.textSecondary}
            returnKeyType="search"
            style={{
              flex: 1, color: theme.text, fontSize: 15,
              marginLeft: 10, paddingVertical: 0,
            }}
          />
          {searchValue.length > 0 && (
            <TouchableOpacity onPress={() => onSearchChange('')}>
              <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  )
}
