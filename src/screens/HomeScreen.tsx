import { useState, useCallback, useEffect, useRef } from 'react'
import { View, FlatList, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native'
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
  const [loadingMore, setLoadingMore] = useState(false)
  const [showQuality, setShowQuality] = useState(false)
  const [trending, setTrending] = useState<YouTubeSearchResult[]>([])
  const [trendingLoading, setTrendingLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [playError, setPlayError] = useState<string | null>(null)
  const nextPageRef = useRef<string | null>(null)
  const queryRef = useRef('')

  const player = useVideoPlayer(null, (p) => {
    p.staysActiveInBackground = true
  })

  useEffect(() => {
    if (selectedQuality?.url && player) {
      player.replace(selectedQuality.url)
      player.play()
      setPlayError(null)
    }
  }, [selectedQuality?.url])

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
    setPlayError(null)
    queryRef.current = searchQuery.trim()
    try {
      const { results, nextpage } = await search(searchQuery.trim())
      setSearchResults(results)
      nextPageRef.current = nextpage
    } catch (e: any) {
      console.error(e)
      setPlayError(e?.message ?? 'Search failed')
    } finally {
      setLoading(false)
    }
  }, [searchQuery])

  const loadMore = useCallback(async () => {
    if (loadingMore || !nextPageRef.current || !queryRef.current) return
    setLoadingMore(true)
    try {
      const { results, nextpage } = await search(queryRef.current, nextPageRef.current)
      const prev = useStore.getState().searchResults
      setSearchResults([...prev, ...results])
      nextPageRef.current = nextpage
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore])

  const clearSearch = useCallback(() => {
    setSearchQuery('')
    setSearchResults([])
    setIsSearching(false)
    nextPageRef.current = null
    queryRef.current = ''
    setPlayError(null)
  }, [])

  const handlePlay = useCallback(async (result: YouTubeSearchResult) => {
    setPlayError(null)
    try {
      const stream = await getStream(result.id)
      setCurrentStream(stream)
      const video = stream.videoStreams.find(s => s.url && s.url.includes('proxy.piped'))
        ?? stream.videoStreams.find(s => s.url && !s.label.includes('LBRY'))
        ?? stream.videoStreams.find(s => s.url)
      if (video) {
        setSelectedQuality(video)
      } else {
        setPlayError('No playable stream found')
      }
    } catch (e: any) {
      setPlayError(e?.message ?? 'Failed to load video')
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
        <TouchableOpacity activeOpacity={1} style={{ height: 240, backgroundColor: '#000' }}>
          <VideoView
            player={player}
            style={{ flex: 1 }}
            nativeControls
            allowsPictureInPicture
            contentFit="contain"
          />
        </TouchableOpacity>
      ) : null}

      {playError && (
        <View style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(255,80,80,0.15)' }}>
          <Text style={{ color: '#ff6666', fontSize: 12 }}>{playError}</Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={displayItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 }}
          onEndReached={isSearching ? loadMore : undefined}
          onEndReachedThreshold={0.5}
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
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator size="small" color={theme.accent} style={{ paddingVertical: 12 }} />
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
