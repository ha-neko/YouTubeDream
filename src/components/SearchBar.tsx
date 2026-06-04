import { TextInput, View, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { theme } from '../theme'

interface Props {
  value: string
  onChange: (text: string) => void
  onSubmit: () => void
  placeholder?: string
}

export default function SearchBar({ value, onChange, onSubmit, placeholder }: Props) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: theme.bgCard, borderRadius: 12,
      paddingHorizontal: 14, height: 44,
    }}>
      <Ionicons name="search" size={18} color={theme.textSecondary} />
      <TextInput
        value={value}
        onChangeText={onChange}
        onSubmitEditing={onSubmit}
        placeholder={placeholder ?? 'Search...'}
        placeholderTextColor={theme.textSecondary}
        returnKeyType="search"
        style={{
          flex: 1, color: theme.text, fontSize: 15,
          marginLeft: 10, paddingVertical: 0,
        }}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChange('')}>
          <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  )
}
