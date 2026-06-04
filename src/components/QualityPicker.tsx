import { View, Text, TouchableOpacity, Modal, FlatList } from 'react-native'
import type { StreamQuality } from '../types'
import { theme } from '../theme'

interface Props {
  visible: boolean
  title: string
  options: StreamQuality[]
  onSelect: (quality: StreamQuality) => void
  onClose: () => void
}

export default function QualityPicker({ visible, title, options, onSelect, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{
        flex: 1, justifyContent: 'center', alignItems: 'center',
        backgroundColor: theme.overlay,
      }}>
        <View style={{
          width: '85%', maxHeight: '70%',
          backgroundColor: theme.bgElevated, borderRadius: 16,
          padding: 20,
        }}>
          <Text style={{
            color: theme.text, fontSize: 18, fontWeight: '700',
            marginBottom: 16, textAlign: 'center',
          }}>
            {title}
          </Text>
          <FlatList
            data={options}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => onSelect(item)}
                style={{
                  paddingVertical: 14, paddingHorizontal: 16,
                  borderBottomWidth: 1, borderBottomColor: theme.border,
                }}
              >
                <Text style={{ color: theme.text, fontSize: 15 }}>{item.label}</Text>
                {item.contentLength && (
                  <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>
                    {(parseInt(item.contentLength) / 1_000_000).toFixed(1)} MB
                  </Text>
                )}
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity
            onPress={onClose}
            style={{ marginTop: 12, paddingVertical: 12, alignItems: 'center' }}
          >
            <Text style={{ color: theme.accent, fontSize: 15, fontWeight: '600' }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}
