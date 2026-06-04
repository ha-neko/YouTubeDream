import { useState, useCallback, useRef } from 'react'
import { View, FlatList, Text, TouchableOpacity, Image, ActivityIndicator, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useStore } from '../store/useStore'
import { search, getStream } from '../services/youtube'
import type { YouTubeSearchResult } from '../types'
import SearchBar from '../components/SearchBar'
import QualityPicker from '../components/QualityPicker'
import { useTheme } from '../theme/ThemeProvider'
import { VideoView, useVideoPlayer } from 'expo-video'

export default function HomeScreen() {
  const { theme } = useTheme()
  const { searchQuery, setSearchQuery, searchResults, setSearchResults,
    setCurrentStream, currentStream, selectedQuality, setSelectedQuality,
    addToQueue } = useStore()

  const [loading, setLoading] = useState(false)
  const [showQuality, setShowQuality] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const [isPipActive, setIsPipActive] = useState(false)
  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const player = useVideoPlayer(selectedQuality?.url ?? null, (p) => {
    p.staysActiveInBackground = true
    p.play()
  })

  const toggleControls = () => {
    setShowControls(true)
    if (controlsTimer.current) clearTimeout(controlsTimer.current)
    controlsTimer.current = setTimeout(() => setShowControls(false), 4000)
  }

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return
    setLoading(true)
    try {
      const results = await search(searchQuery.trim())
      setSearchResults(results)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [searchQuery])

  const handlePlay = useCallback(async (result: YouTubeSearchResult) => {
    try {
      const stream = await getStream(result.id)
      setCurrentStream(stream)
      const video = stream.videoStreams.find(s => s.url) ?? stream.videoStreams[0]
      if (video) setSelectedQuality(video)
      setShowControls(false)
      setIsPipActive(false)
    } catch (e) {
      console.error(e)
    }
  }, [])

  const handleAddToQueue = useCallback((result: YouTubeSearchResult) => {
    addToQueue({
      id: result.id, title: result.title, uploader: result.uploader,
      thumbnail: result.thumbnail, duration: result.duration,
    })
  }, [addToQueue])

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 60, paddingBottom: 8 }}>
        <Text style={{ color: theme.text, fontSize: 26, fontWeight: '800', marginBottom: 12 }}>
          ▶ Normal
        </Text>
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onSubmit={handleSearch}
          placeholder="Search videos..."
        />
      </View>

      {currentStream && selectedQuality?.url ? (
        <TouchableOpacity activeOpacity={1} onPress={toggleControls} style={{ height: 240, backgroundColor: '#000' }}>
          <VideoView
            player={player}
            style={{ flex: 1 }}
            nativeControls={showControls}
            allowsPictureInPicture
            contentFit="contain"
          />

          {isPipActive && (
            <View style={{
              position: 'absolute', top: 8, left: 8,
              backgroundColor: theme.accent, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
            }}>
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>PiP</Text>
            </View>
          )}

          {showControls && (
            <View style={{
              ...StyleSheet.absoluteFillObject,
              justifyContent: 'center', alignItems: 'center',
              backgroundColor: 'rgba(0,0,0,0.4)',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 40 }}>
                <TouchableOpacity>
                  <Ionicons name="play-skip-back" size={28} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { player.playing ? player.pause() : player.play() }}
                  style={{
                    width: 56, height: 56, borderRadius: 28,
                    backgroundColor: theme.accent, justifyContent: 'center', alignItems: 'center',
                  }}
                >
                  <Ionicons name={player.playing ? 'pause' : 'play'} size={28} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity>
                  <Ionicons name="play-skip-forward" size={28} color="#fff" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={() => setShowQuality(true)}
                style={{ position: 'absolute', bottom: 12, right: 12 }}
              >
                <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '600' }}>
                  {selectedQuality?.label ?? 'Quality'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      ) : null}

      {loading ? (
        <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 }}
          ListEmptyComponent={
            <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 60 }}>
              Search for videos to start
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
                  <TouchableOpacity onPress={() => handleAddToQueue(item)}>
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
