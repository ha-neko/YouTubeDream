import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av'
import type { LyricLine } from '../types'

type PlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error'

type StatusListener = (status: PlaybackStatus) => void
type PositionListener = (positionMs: number, durationMs: number) => void
type ErrorListener = (error: string) => void

let sound: Audio.Sound | null = null
let statusListeners = new Set<StatusListener>()
let positionListeners = new Set<PositionListener>()
let errorListeners = new Set<ErrorListener>()
let playbackStatus: PlaybackStatus = 'idle'
let positionInterval: ReturnType<typeof setInterval> | null = null
let _durationMs = 0

export function onStatusChange(cb: StatusListener) {
  statusListeners.add(cb)
  return () => statusListeners.delete(cb)
}

export function onPosition(cb: PositionListener) {
  positionListeners.add(cb)
  return () => positionListeners.delete(cb)
}

export function onError(cb: ErrorListener) {
  errorListeners.add(cb)
  return () => errorListeners.delete(cb)
}

function setStatus(s: PlaybackStatus) {
  playbackStatus = s
  statusListeners.forEach(l => l(s))
}

async function initAudio() {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    staysActiveInBackground: true,
    playsInSilentModeIOS: true,
    shouldDuckAndroid: true,
    interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
    interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
  })
}

export async function loadAndPlay(uri: string) {
  try {
    await initAudio()

    if (sound) {
      await sound.unloadAsync()
      sound = null
    }

    setStatus('loading')

    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true, progressUpdateIntervalMillis: 250 },
      onPlaybackUpdate
    )
    sound = newSound

    const status = await sound.getStatusAsync()
    if (status.isLoaded) {
      _durationMs = status.durationMillis ?? 0
      setStatus('playing')
    }

    startPositionInterval()
  } catch (e: any) {
    setStatus('error')
    errorListeners.forEach(l => l(e?.message ?? 'Failed to load audio'))
  }
}

export async function play() {
  if (!sound) return
  await sound.playAsync()
  setStatus('playing')
  startPositionInterval()
}

export async function pause() {
  if (!sound) return
  await sound.pauseAsync()
  setStatus('paused')
  stopPositionInterval()
}

export async function toggle() {
  if (playbackStatus === 'playing') {
    await pause()
  } else if (playbackStatus === 'paused' || playbackStatus === 'idle') {
    await play()
  }
}

export async function seekTo(positionMs: number) {
  if (!sound) return
  await sound.setPositionAsync(positionMs)
}

export async function unload() {
  stopPositionInterval()
  if (sound) {
    await sound.unloadAsync()
    sound = null
  }
  setStatus('idle')
}

export function getStatus() { return playbackStatus }
export function getDurationMs() { return _durationMs }

function onPlaybackUpdate(status: any) {
  if (!status.isLoaded) {
    if (status.error) {
      setStatus('error')
      errorListeners.forEach(l => l(status.error))
    }
    return
  }

  if (status.didJustFinish) {
    setStatus('ended')
    stopPositionInterval()
  }

  if (status.isPlaying) {
    _durationMs = status.durationMillis ?? 0
    positionListeners.forEach(l => l(status.positionMillis, status.durationMillis ?? 0))
  }
}

function startPositionInterval() {
  stopPositionInterval()
  positionInterval = setInterval(async () => {
    if (!sound) return
    try {
      const s = await sound.getStatusAsync()
      if (s.isLoaded && s.isPlaying) {
        positionListeners.forEach(l => l(s.positionMillis, s.durationMillis ?? 0))
      }
    } catch { }
  }, 250)
}

function stopPositionInterval() {
  if (positionInterval) {
    clearInterval(positionInterval)
    positionInterval = null
  }
}
