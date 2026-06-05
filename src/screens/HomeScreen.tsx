import { useState, useCallback, useEffect } from 'react'
import { View, FlatList, Text, TouchableOpacity, Image, ActivityIndicator, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useStore } from '../store/useStore'
import { search, getStream, getTrending } from '../services/youtube'
import type { YouTubeSearchResult } from '../types'
import Header from '../components/Header'
import QualityPicker from '../components/QualityPicker'
import { useTheme } from '../theme/ThemeProvider'
import { VideoView, useVideoPlayer } from 'expo-video'

export default function HomeScreen({ navigation }: any) {
  const { theme } = useTheme()
  const { searchQuery, setSearchQuery, searchResults, setSearchResults,
    setCurrentStream, currentStream, selectedQuality, setSelectedQuality,
    addToQueue } = useStore()

  const [loading, setLoading] = useState(false)
  const [showQuality, setShowQuality] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const [trending, setTrending] = useState<YouTubeSearchResult[]>([])
  const [trendingLoading, setTrendingLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)

  const player = useVideoPlayer(selectedQuality?.url ?? null, (p) => {
    p.staysActiveInBackground = true
  })

  useEffect(() => {
    getTrending().then((items) => {
      setTrending(items)
      setTrendingLoading(false)
    })
  }, [])

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setIsSearching(false)
      return
    }
    setLoading(true)
    setIsSearching(true)
    try {
      const results = await search(searchQuery.trim())
      setSearchResults(results)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [searchQuery])

  const clearSearch = useCallback(() => {
    setSearchQuery('')
    setSearchResults([])
    setIsSearching(false)
  }, [])

  const handlePlay = useCallback(async (result: YouTubeSearchResult) => {
    try {
      const stream = await getStream(result.id)
      setCurrentStream(stream)
      const video = stream.videoStreams.find(s => s.url && !s.label.includes('LBRY'))
        ?? stream.videoStreams.find(s => s.url)
      if (video) setSelectedQuality(video)
    } catch (e) {
      console.error(e)
    }
  }, [])

  const displayItems = isSearching ? searchResults : trending
  const listEmpty = isSearching
    ? 'No results found'
    : (trendingLoading ? 'Loading...' : 'Nothing to show')

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <Header
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearch}
        searchPlaceholder="Search videos..."
        onSettingsPress={() => navigation.navigate('Settings')}
      />

      {(isSearching || searchQuery.length > 0) && (
        <View style={{ paddingHorizontal: 16, marginBottom: 4 }}>
          <TouchableOpacity onPress={clearSearch} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="arrow-back" size={18} color={theme.accent} />
            <Text style={{ color: theme.accent, marginLeft: 6, fontSize: 13, fontWeight: '600' }}>
              Back to trending
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {currentStream && selectedQuality?.url ? (
        <TouchableOpacity activeOpacity={1} onPress={() => setShowControls(true)} style={{ height: 240, backgroundColor: '#000' }}>
          <VideoView
            player={player}
            style={{ flex: 1 }}
            nativeControls={showControls}
            allowsPictureInPicture
            contentFit="contain"
          />
        </TouchableOpacity>
      ) : null}

      {loading ? (
        <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={displayItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 }}
          ListHeaderComponent={
            !isSearching && !trendingLoading && trending.length > 0 ? (
              <Text style={{
                color: theme.textSecondary, fontSize: 13, fontWeight: '600',
                marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1,
              }}>
                Trending Now
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 60 }}>
              {listEmpty}
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handlePlay(item)}
              style={{
                flexDirection: 'row', marginBottom: 12,
                backgroundColor: theme.bgCard, borderRadius: 12, overflow: 'hidden',
              }}
            >
              <Image
                source={{ uri: item.thumbnail }}
                style={{ width: 140, height: 80, backgroundColor: theme.bgElevated }}
              />
              <View style={{ flex: 1, padding: 10, justifyContent: 'center' }}>
                <Text style={{ color: theme.text, fontWeight: '600', fontSize: 13 }} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 4 }}>
                  {item.uploader}
                </Text>
                <View style={{ flexDirection: 'row', marginTop: 6 }}>
                  <TouchableOpacity onPress={() => addToQueue({
                    id: item.id, title: item.title, uploader: item.uploader,
                    thumbnail: item.thumbnail, duration: item.duration,
                  })}>
                    <Ionicons name="add-circle-outline" size={20} color={theme.accent} />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <QualityPicker
        visible={showQuality}
        title="Video Quality"
        options={currentStream?.videoStreams ?? []}
        onSelect={(q) => { setSelectedQuality(q); setShowQuality(false) }}
        onClose={() => setShowQuality(false)}
      />
    </View>
  )
}
