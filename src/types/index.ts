export type Mode = 'normal' | 'music' | 'offline'

export interface StreamQuality {
  label: string
  itag?: number
  url?: string
  mimeType?: string
  bitrate?: number
  width?: number
  height?: number
  contentLength?: string
  videoOnly?: boolean
}

export interface YouTubeSearchResult {
  id: string
  title: string
  thumbnail: string
  duration: number
  uploader: string
  uploaderAvatar?: string
  views?: number
}

export interface YouTubeStream {
  id: string
  title: string
  thumbnail: string
  duration: number
  uploader: string
  uploaderAvatar?: string
  description?: string
  videoStreams: StreamQuality[]
  audioStreams: StreamQuality[]
}

export interface DownloadedItem {
  id: string
  youtubeId: string
  title: string
  uploader: string
  thumbnail: string
  duration: number
  filePath: string
  type: 'audio' | 'video'
  quality: string
  addedAt: number
}

export interface LyricLine {
  time: number
  text: string
}

export interface Playlist {
  id: string
  name: string
  items: string[]
  createdAt: number
}
