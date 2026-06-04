import { useState, useCallback, useEffect, useRef } from 'react'
import { View, FlatList, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useStore } from '../store/useStore'
import { search, getStream } from '../services/youtube'
import { searchLyrics, getLyrics } from '../services/lyrics'
import { startDownload } from '../services/downloader'
import * as audioPlayer from '../services/audioPlayer'
import type { YouTubeSearchResult, LyricLine } from '../types'
import SearchBar from '../components/SearchBar'
import QualityPicker from '../components/QualityPicker'
import LyricsOverlay from '../components/LyricsOverlay'
import { theme } from '../theme'

export default function MusicScreen() {
  const { searchQuery, setSearchQuery, searchResults, setSearchResults,
    setCurrentStream, currentStream, selectedQuality, setSelectedQuality,
    addToQueue, queue, showingLyrics, setShowingLyrics } = useStore()

  const [loading, setLoading] = useState(false)
  const [showQuality, setShowQuality] = useState(false)
  const [lyrics, setLyrics] = useState<LyricLine[]>([])
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playState, setPlayState] = useState<string>('idle')
  const [downloading, setDownloading] = useState<string | null>(null)
  const [offlineUri, setOfflineUri] = useState<string | null>(null)
  const posUnsub = useRef<(() => void) | null>(null)
  const statusUnsub = useRef<(() => void) | null>(null)

  useEffect(() => {
    posUnsub.current = audioPlayer.onPosition((posMs, durMs) => {
      setCurrentTime(posMs / 1000)
      setDuration(durMs / 1000)
    })
    statusUnsub.current = audioPlayer.onStatusChange((s) => setPlayState(s))
    return () => {
      posUnsub.current?.()
      statusUnsub.current?.()
    }
  }, [])

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

  const handlePlay = useCallback(async (result: YouTubeSearchResult, playUri?: string) => {
    try {
      const stream = playUri ? currentStream : await getStream(result.id)
      if (!playUri) {
        const s = await getStream(result.id)
        setCurrentStream(s)
        const audio = s.audioStreams?.[0]
        if (audio) setSelectedQuality(audio)
      }

      const audioUrl = playUri ?? selectedQuality?.url
      if (!audioUrl) return

      await audioPlayer.loadAndPlay(audioUrl)

      const trackTitle = result.title
      const trackUploader = result.uploader ?? currentStream?.uploader ?? ''
      const trackDuration = result.duration ?? currentStream?.duration ?? 0

      const found = await searchLyrics(trackTitle, trackUploader, trackDuration)
      if (found) {
        const l = await getLyrics(found.id)
        if (l) setLyrics(l.synced)
      } else {
        setLyrics([])
      }
    } catch (e) {
      console.error(e)
    }
  }, [currentStream, selectedQuality])

  const handlePlayDownloaded = useCallback(async (item: any) => {
    setCurrentStream({
      id: item.youtubeId,
      title: item.title,
      thumbnail: item.thumbnail,
      duration: item.duration,
      uploader: item.uploader,
      videoStreams: [],
      audioStreams: [{ label: item.quality, url: item.filePath } as any],
    })
    setOfflineUri(item.filePath)
    await audioPlayer.loadAndPlay(item.filePath)

    const found = await searchLyrics(item.title, item.uploader, item.duration)
    if (found) {
      const l = await getLyrics(found.id)
      if (l) setLyrics(l.synced)
    } else {
      setLyrics([])
    }
  }, [])

  const handleDownload = useCallback(async (result: YouTubeSearchResult) => {
    if (!currentStream || currentStream.id !== result.id) {
      const stream = await getStream(result.id)
      setCurrentStream(stream)
      const audio = stream.audioStreams?.[0]
      if (audio) setSelectedQuality(audio)
    }
    const stream = currentStream?.id === result.id ? currentStream : await getStream(result.id)
    const audio = stream.audioStreams?.[0]
    if (!audio?.url) return

    setDownloading(result.id)
    try {
      await startDownload(
        result.id, result.title, result.uploader,
        result.thumbnail, result.duration,
        audio.url, audio.label, 'audio'
      )
    } catch (e) {
      console.error(e)
    } finally {
      setDownloading(null)
    }
  }, [currentStream])

  const handleAddToQueue = useCallback((result: YouTubeSearchResult) => {
    addToQueue({
      id: result.id, title: result.title, uploader: result.uploader,
      thumbnail: result.thumbnail, duration: result.duration,
    })
  }, [addToQueue])

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 60, paddingBottom: 8 }}>
        <Text style={{ color: theme.text, fontSize: 26, fontWeight: '800', marginBottom: 12 }}>
          ♪ Music
        </Text>
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onSubmit={handleSearch}
          placeholder="Search songs..."
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 }}
          ListEmptyComponent={
            <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 60 }}>
              Search for songs to start
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
              <TouchableOpacity onPress={() => handleAddToQueue(item)} style={{ marginHorizontal: 6 }}>
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

      {/* Mini player with progress + lyrics */}
      {currentStream && (
        <View style={{
          backgroundColor: theme.bgElevated, borderTopWidth: 1, borderTopColor: theme.border,
        }}>
          {/* Progress bar */}
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

            {/* Play/pause */}
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
        options={currentStream?.audioStreams ?? []}
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
