import { useState, useCallback, useEffect, useRef } from 'react'
import { View, FlatList, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useStore } from '../store/useStore'
import { search, getStream, getPlayableStream, getTrending } from '../services/youtube'
import { searchLyrics, getLyrics } from '../services/lyrics'
import { startDownload } from '../services/downloader'
import * as audioPlayer from '../services/audioPlayer'
import type { YouTubeSearchResult, LyricLine } from '../types'
import Header from '../components/Header'
import QualityPicker from '../components/QualityPicker'
import LyricsOverlay from '../components/LyricsOverlay'
import { useTheme } from '../theme/ThemeProvider'

export default function MusicScreen({ navigation }: any) {
  const { theme } = useTheme()
  const { searchQuery, setSearchQuery, searchResults, setSearchResults,
    setCurrentStream, currentStream, selectedQuality, setSelectedQuality,
    addToQueue, showingLyrics, setShowingLyrics } = useStore()

  const [loading, setLoading] = useState(false)
  const [showQuality, setShowQuality] = useState(false)
  const [lyrics, setLyrics] = useState<LyricLine[]>([])
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playState, setPlayState] = useState<string>('idle')
  const [downloading, setDownloading] = useState<string | null>(null)
  const [trending, setTrending] = useState<YouTubeSearchResult[]>([])
  const [trendingLoading, setTrendingLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const posUnsub = useRef<(() => void) | null>(null)
  const statusUnsub = useRef<(() => void) | null>(null)

  useEffect(() => {
    posUnsub.current = audioPlayer.onPosition((posMs, durMs) => {
      setCurrentTime(posMs / 1000)
      setDuration(durMs / 1000)
    })
    statusUnsub.current = audioPlayer.onStatusChange((s) => setPlayState(s))
    getTrending().then((items) => {
      setTrending(items)
      setTrendingLoading(false)
    })
    return () => {
      posUnsub.current?.()
      statusUnsub.current?.()
    }
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

      const playable = getPlayableStream(stream)
      if (!playable?.url) return

      setSelectedQuality({
        label: playable.label,
        url: playable.url,
      })

      await audioPlayer.loadAndPlay(playable.url)

      const found = await searchLyrics(result.title, result.uploader, result.duration)
      if (found) {
        const l = await getLyrics(found.id)
        if (l) setLyrics(l.synced)
      } else {
        setLyrics([])
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  const handleDownload = useCallback(async (result: YouTubeSearchResult) => {
    try {
      const stream = currentStream?.id === result.id ? currentStream : await getStream(result.id)
      setCurrentStream(stream)

      const audio = stream.audioStreams?.find(s => s.url)
      const video = stream.videoStreams?.find(s => s.url && !s.videoOnly)
      const playable = audio ?? video

      if (!playable?.url) return

      setDownloading(result.id)
      try {
        await startDownload(
          result.id, result.title, result.uploader,
          result.thumbnail, result.duration,
          playable.url, playable.label, 'audio'
        )
      } catch (e) {
        console.error(e)
      } finally {
        setDownloading(null)
      }
    } catch (e) {
      console.error(e)
    }
  }, [currentStream])

  const displayItems = isSearching ? searchResults : trending
  const listEmpty = isSearching
    ? 'No results found'
    : (trendingLoading ? 'Loading...' : 'Nothing to show')

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <Header
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearch}
        searchPlaceholder="Search songs..."
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

      {loading ? (
        <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={displayItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 140 }}
          ListHeaderComponent={
            !isSearching && !trendingLoading && trending.length > 0 ? (
              <Text style={{
                color: theme.textSecondary, fontSize: 13, fontWeight: '600',
                marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1,
              }}>
                Popular Songs
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
                flexDirection: 'row', alignItems: 'center', marginBottom: 10,
                backgroundColor: theme.bgCard, borderRadius: 12, padding: 10,
              }}
            >
              <Image
                source={{ uri: item.thumbnail }}
                style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: theme.bgElevated }}
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: theme.text, fontWeight: '600', fontSize: 14 }} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={{ color: theme.textSecondary, fontSize: 12 }} numberOfLines={1}>
                  {item.uploader}
                </Text>
              </View>
              <TouchableOpacity onPress={() => addToQueue({
                id: item.id, title: item.title, uploader: item.uploader,
                thumbnail: item.thumbnail, duration: item.duration,
              })} style={{ marginHorizontal: 6 }}>
                <Ionicons name="add-circle-outline" size={22} color={theme.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDownload(item)} disabled={downloading === item.id}>
                <Ionicons
                  name={downloading === item.id ? 'cloud-download-outline' : 'download-outline'}
                  size={22}
                  color={downloading === item.id ? theme.accent : theme.textSecondary}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Mini player */}
      {currentStream && (
        <View style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          backgroundColor: theme.bgElevated, borderTopWidth: 1, borderTopColor: theme.border,
        }}>
          <View style={{ height: 3, backgroundColor: theme.border }}>
            <View style={{
              height: '100%', width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%',
              backgroundColor: theme.accent,
            }} />
          </View>

          <View style={{
            flexDirection: 'row', alignItems: 'center',
            paddingHorizontal: 16, paddingVertical: 10,
          }}>
            <Image
              source={{ uri: currentStream.thumbnail }}
              style={{ width: 40, height: 40, borderRadius: 6, backgroundColor: theme.bg }}
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: theme.text, fontWeight: '600', fontSize: 13 }} numberOfLines={1}>
                {currentStream.title}
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 10 }}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => audioPlayer.toggle()}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.accent, justifyContent: 'center', alignItems: 'center', marginHorizontal: 8 }}
            >
              <Ionicons
                name={playState === 'playing' ? 'pause' : 'play'}
                size={18} color="#fff"
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowingLyrics(true)} style={{ marginHorizontal: 6 }}>
              <Ionicons name="musical-notes" size={22} color={theme.accent} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowQuality(true)} style={{ marginHorizontal: 4 }}>
              <Ionicons name="options-outline" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <QualityPicker
        visible={showQuality}
        title="Audio Quality"
        options={currentStream?.audioStreams?.length ? currentStream.audioStreams
          : currentStream?.videoStreams?.filter(s => !s.videoOnly) ?? []}
        onSelect={(q) => { setSelectedQuality(q); setShowQuality(false) }}
        onClose={() => setShowQuality(false)}
      />

      <LyricsOverlay
        visible={showingLyrics}
        lyrics={lyrics}
        currentTime={currentTime}
        onClose={() => setShowingLyrics(false)}
      />
    </View>
  )
}
