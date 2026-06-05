import { create } from 'zustand'
import type { YouTubeSearchResult, YouTubeStream, DownloadedItem, Mode, StreamQuality } from '../types'

interface QueueItem {
  id: string
  title: string
  uploader: string
  thumbnail: string
  duration: number
  streamUrl?: string
  quality?: string
}

interface StoreState {
  mode: Mode
  searchQuery: string
  searchResults: YouTubeSearchResult[]
  currentStream: YouTubeStream | null
  selectedQuality: StreamQuality | null
  queue: QueueItem[]
  queueIndex: number
  isPlaying: boolean
  isOfflineMode: boolean
  downloadedItems: DownloadedItem[]
  showingLyrics: boolean
  downloadProgress: Record<string, number>

  setMode: (mode: Mode) => void
  setSearchQuery: (query: string) => void
  setSearchResults: (results: YouTubeSearchResult[]) => void
  setCurrentStream: (stream: YouTubeStream | null) => void
  setSelectedQuality: (quality: StreamQuality | null) => void
  setQueue: (queue: QueueItem[]) => void
  addToQueue: (item: QueueItem) => void
  removeFromQueue: (id: string) => void
  setQueueIndex: (index: number) => void
  playNext: () => QueueItem | null
  playPrevious: () => QueueItem | null
  setIsPlaying: (playing: boolean) => void
  setIsOfflineMode: (offline: boolean) => void
  setDownloadedItems: (items: DownloadedItem[]) => void
  setShowingLyrics: (show: boolean) => void
  setDownloadProgress: (id: string, progress: number) => void
}

export const useStore = create<StoreState>((set) => ({
  mode: 'music',
  searchQuery: '',
  searchResults: [],
  currentStream: null,
  selectedQuality: null,
  queue: [],
  queueIndex: -1,
  isPlaying: false,
  isOfflineMode: false,
  downloadedItems: [],
  showingLyrics: false,
  downloadProgress: {},

  setMode: (mode) => set({ mode }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSearchResults: (searchResults) => set({ searchResults }),
  setCurrentStream: (currentStream) => set({ currentStream }),
  setSelectedQuality: (selectedQuality) => set({ selectedQuality }),
  setQueue: (queue) => set({ queue }),
  addToQueue: (item) => set((s) => ({ queue: [...s.queue, item] })),
  removeFromQueue: (id) => set((s) => ({ queue: s.queue.filter((q) => q.id !== id) })),
  setQueueIndex: (queueIndex) => set({ queueIndex }),
  playNext: () => {
    let next: QueueItem | null = null
    set((s) => {
      const i = s.queueIndex + 1
      if (i < s.queue.length) {
        next = s.queue[i]
        return { queueIndex: i }
      }
      return {}
    })
    return next
  },
  playPrevious: () => {
    let prev: QueueItem | null = null
    set((s) => {
      const i = s.queueIndex - 1
      if (i >= 0) {
        prev = s.queue[i]
        return { queueIndex: i }
      }
      return {}
    })
    return prev
  },
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setIsOfflineMode: (isOfflineMode) => set({ isOfflineMode }),
  setDownloadedItems: (downloadedItems) => set({ downloadedItems }),
  setShowingLyrics: (showingLyrics) => set({ showingLyrics }),
  setDownloadProgress: (id, progress) =>
    set((s) => ({ downloadProgress: { ...s.downloadProgress, [id]: progress } })),
}))
