import { useEffect, useState, useRef } from 'react'
import { View, Text, Modal, FlatList, TouchableOpacity, Dimensions } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { LyricLine } from '../types'
import { theme } from '../theme'

interface Props {
  visible: boolean
  lyrics: LyricLine[]
  currentTime: number
  onClose: () => void
}

const ITEM_HEIGHT = 48

export default function LyricsOverlay({ visible, lyrics, currentTime, onClose }: Props) {
  const flatRef = useRef<FlatList>(null)
  const [activeIdx, setActiveIdx] = useState(-1)

  useEffect(() => {
    if (!lyrics.length) return
    let idx = lyrics.length - 1
    for (let i = 0; i < lyrics.length; i++) {
      if (lyrics[i].time > currentTime) { idx = i - 1; break }
    }
    if (idx !== activeIdx) {
      setActiveIdx(idx)
      if (idx >= 0) {
        flatRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.4 })
      }
    }
  }, [currentTime, lyrics])

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{
        flex: 1, backgroundColor: 'rgba(0,0,0,0.95)',
        paddingTop: 60, paddingBottom: 40,
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20 }}>
          <Text style={{ color: theme.text, fontSize: 18, fontWeight: '700' }}>Lyrics</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        {lyrics.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="musical-notes-outline" size={48} color={theme.textSecondary} />
            <Text style={{ color: theme.textSecondary, marginTop: 12, fontSize: 15 }}>
              No synced lyrics available
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatRef}
            data={lyrics}
            keyExtractor={(_, i) => String(i)}
            getItemLayout={(_, i) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * i, index: i })}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            renderItem={({ item, index }) => (
              <View style={{ height: ITEM_HEIGHT, justifyContent: 'center' }}>
                <Text style={{
                  fontSize: index === activeIdx ? 20 : 14,
                  fontWeight: index === activeIdx ? '700' : '400',
                  color: index === activeIdx ? theme.accent : theme.textSecondary,
                }}>
                  {item.text}
                </Text>
              </View>
            )}
          />
        )}
      </View>
    </Modal>
  )
}
