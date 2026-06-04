import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, Image, FlatList } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useStore } from '../store/useStore'
import * as audioPlayer from '../services/audioPlayer'
import { theme } from '../theme'
import { VideoView, useVideoPlayer } from 'expo-video'

export default function NowPlayingScreen({ navigation }: any) {
  const { currentStream, selectedQuality, queue, queueIndex, setQueueIndex,
    isPlaying, setIsPlaying, mode, setMode, setShowingLyrics } = useStore()

  const [audioPos, setAudioPos] = useState(0)
  const [audioDur, setAudioDur] = useState(0)
  const [audioState, setAudioState] = useState('idle')

  const videoPlayer = useVideoPlayer(
    mode === 'normal' && currentStream && selectedQuality?.url ? selectedQuality.url : null,
    (p) => {
      p.staysActiveInBackground = true
      p.play()
    }
  )

  useEffect(() => {
    const unsubPos = audioPlayer.onPosition((posMs, durMs) => {
      setAudioPos(posMs / 1000)
      setAudioDur(durMs / 1000)
    })
    const unsubStatus = audioPlayer.onStatusChange((s) => {
      setAudioState(s)
      setIsPlaying(s === 'playing')
    })
    return () => {
      unsubPos()
      unsubStatus()
    }
  }, [])

  if (!currentStream) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name="play-circle-outline" size={64} color={theme.textSecondary} />
        <Text style={{ color: theme.textSecondary, marginTop: 16, fontSize: 16 }}>Nothing playing</Text>
      </View>
    )
  }

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const progress = mode === 'music'
    ? (audioDur > 0 ? audioPos / audioDur : 0)
    : 0

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60 }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-down" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={{ color: theme.textSecondary, fontSize: 13, fontWeight: '600' }}>
          {mode === 'music' ? '♪ Music Player' : '▶ Video Player'}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Content */}
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
        {mode === 'normal' && selectedQuality?.url ? (
          <VideoView
            player={videoPlayer}
            style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 12 }}
            nativeControls
            allowsPictureInPicture
            contentFit="contain"
          />
        ) : (
          <>
            <Image
              source={{ uri: currentStream.thumbnail }}
              style={{
                width: '80%', aspectRatio: 1, borderRadius: 16,
                backgroundColor: theme.bgElevated, maxWidth: 280,
              }}
            />
            {/* Audio progress */}
            <View style={{ width: '100%', marginTop: 24, paddingHorizontal: 10 }}>
              <View style={{ height: 4, backgroundColor: theme.border, borderRadius: 2 }}>
                <View style={{
                  height: '100%', width: `${progress * 100}%`,
                  backgroundColor: theme.accent, borderRadius: 2,
                }} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                <Text style={{ color: theme.textSecondary, fontSize: 11 }}>{formatTime(audioPos)}</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 11 }}>{formatTime(audioDur)}</Text>
              </View>
            </View>
          </>
        )}

        <Text style={{ color: theme.text, fontSize: 20, fontWeight: '700', marginTop: 20, textAlign: 'center' }}>
          {currentStream.title}
        </Text>
        <Text style={{ color: theme.textSecondary, fontSize: 14, marginTop: 4 }}>
          {currentStream.uploader}
        </Text>

        {/* Controls */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 28, gap: 28 }}>
          <TouchableOpacity>
            <Ionicons name="play-skip-back" size={28} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (mode === 'music') {
                audioPlayer.toggle()
              } else {
                videoPlayer.playing ? videoPlayer.pause() : videoPlayer.play()
              }
            }}
            style={{
              width: 64, height: 64, borderRadius: 32,
              backgroundColor: theme.accent, justifyContent: 'center', alignItems: 'center',
            }}
          >
            <Ionicons
              name={mode === 'music'
              ? (audioState === 'playing' ? 'pause' : 'play')
              : (videoPlayer.playing ? 'pause' : 'play')
              }
              size={32} color="#fff"
            />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="play-skip-forward" size={28} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* Lyrics button (music mode) */}
        {mode === 'music' && (
          <TouchableOpacity
            onPress={() => { setShowingLyrics(true); navigation.goBack() }}
            style={{
              flexDirection: 'row', alignItems: 'center', marginTop: 20,
              backgroundColor: theme.bgCard, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
            }}
          >
            <Ionicons name="musical-notes" size={18} color={theme.accent} />
            <Text style={{ color: theme.text, marginLeft: 8, fontWeight: '600', fontSize: 13 }}>
              View Lyrics
            </Text>
          </TouchableOpacity>
        )}

        {/* Mode toggle */}
        <TouchableOpacity
          onPress={() => setMode(mode === 'music' ? 'normal' : 'music')}
          style={{
            flexDirection: 'row', alignItems: 'center', marginTop: 12,
            backgroundColor: theme.bgCard, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
          }}
        >
          <Ionicons
            name={mode === 'music' ? 'videocam' : 'musical-notes'}
            size={18}
            color={theme.textSecondary}
          />
          <Text style={{ color: theme.textSecondary, marginLeft: 8, fontWeight: '600', fontSize: 13 }}>
            Switch to {mode === 'music' ? 'Video' : 'Music'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Queue */}
      {queue.length > 0 && (
        <View style={{ paddingHorizontal: 20, paddingBottom: 40 }}>
          <Text style={{ color: theme.text, fontWeight: '700', fontSize: 15, marginBottom: 8 }}>
            Up Next ({queue.length} items)
          </Text>
          {queue.slice(queueIndex + 1, queueIndex + 4).map((item, i) => (
            <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Image
                source={{ uri: item.thumbnail }}
                style={{ width: 32, height: 32, borderRadius: 4, backgroundColor: theme.bgElevated }}
              />
              <View style={{ marginLeft: 10 }}>
                <Text style={{ color: theme.text, fontSize: 12 }} numberOfLines={1}>{item.title}</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 10 }}>{item.uploader}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}
