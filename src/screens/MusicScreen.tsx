import { useState, useCallback, useEffect, useRef } from 'react'
import { View, FlatList, Text, TouchableOpacity, Image, ActivityIndicator, ScrollView, Dimensions } from 'react-native'
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

const SCREEN_WIDTH = Dimensions.get('window').width
const SONG_CARD_SIZE = (SCREEN_WIDTH - 48) / 2

export default function MusicScreen({ navigation }: any) {
  const { theme } = useTheme()
  const { searchQuery, setSearchQuery, searchResults, setSearchResults,
    setCurrentStream, currentStream, selectedQuality, setSelectedQuality,
    addToQueue, queue, queueIndex, playNext, setQueueIndex,
    showingLyrics, setShowingLyrics } = useStore()

  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [showQuality, setShowQuality] = useState(false)
  const [lyrics, setLyrics] = useState<LyricLine[]>([])
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playState, setPlayState] = useState<string>('idle')
  const [downloading, setDownloading] = useState<string | null>(null)
  const [trending, setTrending] = useState<YouTubeSearchResult[]>([])
  const [trendingLoading, setTrendingLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [playError, setPlayError] = useState<string | null>(null)
  const nextPageRef = useRef<string | null>(null)
  const queryRef = useRef('')
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

    // Auto-advance queue when track ends
    const unsubEnd = audioPlayer.onTrackEnd(async () => {
      const next = playNext()
      if (next) {
        await playQueueItem(next)
      }
    })

    return () => {
      posUnsub.current?.()
      statusUnsub.current?.()
      unsubEnd()
    }
  }, [])

  const playQueueItem = useCallback(async (item: any) => {
    setPlayError(null)
    try {
      const stream = await getStream(item.id)
      setCurrentStream(stream)
      const playable = getPlayableStream(stream)
      if (!playable?.url) {
        setPlayError('No stream for queued item')
        return
      }
      setSelectedQuality({ label: playable.label, url: playable.url })
      await audioPlayer.loadAndPlay(playable.url)

      const found = await searchLyrics(item.title, item.uploader, item.duration)
      if (found) {
        const l = await getLyrics(found.id)
        if (l) setLyrics(l.synced)
      } else {
        setLyrics([])
      }
    } catch (e: any) {
      setPlayError(e?.message ?? 'Queue play failed')
    }
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

      const playable = getPlayableStream(stream)
      if (!playable?.url) {
        setPlayError('No playable stream found')
        return
      }

      setSelectedQuality({ label: playable.label, url: playable.url })
      await audioPlayer.loadAndPlay(playable.url)

      const found = await searchLyrics(result.title, result.uploader, result.duration)
      if (found) {
        const l = await getLyrics(found.id)
        if (l) setLyrics(l.synced)
      } else {
        setLyrics([])
      }

      // Add to queue so auto-advance works
      setQueueIndex(-1)
    } catch (e: any) {
      setPlayError(e?.message ?? 'Failed to play')
      console.error(e)
    }
  }, [])

  const handleDownload = useCallback(async (result: YouTubeSearchResult) => {
    setPlayError(null)
    try {
      const stream = currentStream?.id === result.id ? currentStream : await getStream(result.id)
      setCurrentStream(stream)

      const playable = getPlayableStream(stream)
      if (!playable?.url) {
        setPlayError('No stream available for download')
        return
      }

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
    } catch (e: any) {
      setPlayError(e?.message ?? 'Download failed')
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

  const renderSongCard = ({ item }: { item: YouTubeSearchResult }) => (
    <TouchableOpacity
      onPress={() => handlePlay(item)}
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
  )

  // Horizontal trending strip for YT Music feel
  const renderTrendingStrip = () => {
    if (trendingLoading || trending.length === 0) return null
    return (
      <View style={{ marginBottom: 16 }}>
        <Text style={{
          color: theme.textSecondary, fontSize: 13, fontWeight: '600',
          textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10,
          paddingHorizontal: 16,
        }}>
          Trending Songs
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
          {trending.slice(0, 10).map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => handlePlay(item)}
              style={{ width: SONG_CARD_SIZE }}
            >
              <Image
                source={{ uri: item.thumbnail }}
                style={{
                  width: SONG_CARD_SIZE, height: SONG_CARD_SIZE,
                  borderRadius: 12, backgroundColor: theme.bgElevated,
                }}
              />
              <Text style={{ color: theme.text, fontSize: 12, fontWeight: '600', marginTop: 6 }} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 10 }} numberOfLines={1}>
                {item.uploader}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    )
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

      {playError && (
        <View style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(255,80,80,0.15)' }}>
          <Text style={{ color: '#ff6666', fontSize: 12 }}>{playError}</Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: 40 }} />
      ) : isSearching ? (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 140 }}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator size="small" color={theme.accent} style={{ paddingVertical: 12 }} /> : null
          }
          ListEmptyComponent={
            <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 60 }}>{listEmpty}</Text>
          }
          renderItem={renderSongCard}
        />
      ) : (
        <FlatList
          data={[]}
          keyExtractor={(_: any, i: number) => String(i)}
          contentContainerStyle={{ paddingBottom: 140 }}
          ListHeaderComponent={renderTrendingStrip}
          ListEmptyComponent={
            trendingLoading ? (
              <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: 40 }} />
            ) : (
              <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 20 }}>
                Nothing to show
              </Text>
            )
          }
          renderItem={() => null}
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
              style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: theme.bg }}
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: theme.text, fontWeight: '600', fontSize: 13 }} numberOfLines={1}>
                {currentStream.title}
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 10 }}>
                {queueIndex >= 0 && queue[queueIndex]
                  ? `Queue ${queueIndex + 1}/${queue.length}`
                  : `${formatTime(currentTime)} / ${formatTime(duration)}`
                }
              </Text>
            </View>

            {/* Skip back */}
            <TouchableOpacity
              onPress={async () => {
                const prev = useStore.getState().playPrevious()
                if (prev) await playQueueItem(prev)
              }}
              style={{ marginHorizontal: 4 }}
            >
              <Ionicons name="play-skip-back" size={22} color={theme.text} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => audioPlayer.toggle()}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.accent, justifyContent: 'center', alignItems: 'center', marginHorizontal: 8 }}
            >
              <Ionicons
                name={playState === 'playing' ? 'pause' : 'play'}
                size={18} color="#fff"
              />
            </TouchableOpacity>

            {/* Skip forward */}
            <TouchableOpacity
              onPress={async () => {
                const next = playNext()
                if (next) await playQueueItem(next)
              }}
              style={{ marginHorizontal: 4 }}
            >
              <Ionicons name="play-skip-forward" size={22} color={theme.text} />
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
