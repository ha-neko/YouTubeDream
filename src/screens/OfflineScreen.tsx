import { useEffect, useState, useCallback } from 'react'
import { View, FlatList, Text, TouchableOpacity, Image, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useStore } from '../store/useStore'
import { getDownloads, removeDownload } from '../services/database'
import type { DownloadedItem } from '../types'
import Header from '../components/Header'
import { useTheme } from '../theme/ThemeProvider'
import * as FileSystem from 'expo-file-system'

export default function OfflineScreen({ navigation }: any) {
  const { theme } = useTheme()
  const { downloadedItems, setDownloadedItems } = useStore()
  const [filter, setFilter] = useState<'all' | 'audio' | 'video'>('all')

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    const items = await getDownloads()
    setDownloadedItems(items)
  }

  const filtered = filter === 'all'
    ? downloadedItems
    : downloadedItems.filter(i => i.type === filter)

  const handleDelete = useCallback(async (item: DownloadedItem) => {
    Alert.alert('Delete', `Remove "${item.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await FileSystem.deleteAsync(item.filePath, { idempotent: true })
          } catch { }
          await removeDownload(item.id)
          load()
        },
      },
    ])
  }, [])

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <Header
        subtitle="Your library"
        onSettingsPress={() => navigation.navigate('Settings')}
      />

      <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12 }}>
        {(['all', 'audio', 'video'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={{
              paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20,
              backgroundColor: filter === f ? theme.accent : theme.bgCard,
              marginRight: 8,
            }}
          >
            <Text style={{
              color: filter === f ? '#fff' : theme.textSecondary,
              fontWeight: '600', fontSize: 13, textTransform: 'capitalize',
            }}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        onRefresh={load}
        refreshing={false}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <Ionicons name="cloud-download-outline" size={48} color={theme.textSecondary} />
            <Text style={{ color: theme.textSecondary, marginTop: 12, fontSize: 14 }}>
              {filter === 'all' ? 'No downloads yet' : `No ${filter} downloads`}
            </Text>
            <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }}>
              Download songs or videos from Music or Normal mode
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{
              flexDirection: 'row', alignItems: 'center', marginBottom: 10,
              backgroundColor: theme.bgCard, borderRadius: 12, padding: 10,
            }}
          >
            <Image
              source={{ uri: item.thumbnail }}
              style={{ width: 52, height: 52, borderRadius: 8, backgroundColor: theme.bgElevated }}
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: theme.text, fontWeight: '600', fontSize: 13 }} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 11 }} numberOfLines={1}>
                {item.uploader} · {item.type === 'audio' ? '♪' : '▶'} {item.quality}
              </Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item)}>
              <Ionicons name="trash-outline" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}
