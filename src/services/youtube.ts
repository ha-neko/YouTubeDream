import { Platform } from 'react-native'
import type { YouTubeSearchResult, YouTubeStream, StreamQuality } from '../types'

const PIPED_API = 'https://pipedapi.kavin.rocks'

// Free public CORS proxy for web (browsers block cross-origin)
const CORS_PROXY = 'https://api.allorigins.win/raw?url='

const isWeb = Platform.OS === 'web'

function apiUrl(path: string): string {
  const url = `${PIPED_API}${path}`
  return isWeb ? `${CORS_PROXY}${encodeURIComponent(url)}` : url
}

export async function search(query: string): Promise<YouTubeSearchResult[]> {
  const params = new URLSearchParams({ q: query, filter: 'videos' })
  const res = await fetch(apiUrl(`/search?${params}`))
  if (!res.ok) throw new Error(`Search failed: ${res.status}`)
  const data = await res.json()

  return (data.items ?? []).map((item: any) => ({
    id: item.url?.split('watch?v=')?.[1] ?? item.url ?? '',
    title: item.title ?? 'Untitled',
    thumbnail: item.thumbnail ?? '',
    duration: item.duration ?? 0,
    uploader: item.uploader ?? 'Unknown',
    uploaderAvatar: item.uploaderAvatar ?? '',
    views: item.views ?? 0,
  })).filter((r: YouTubeSearchResult) => r.id)
}

export async function getStream(videoId: string): Promise<YouTubeStream> {
  const res = await fetch(apiUrl(`/streams/${videoId}`))
  if (!res.ok) throw new Error(`Stream fetch failed: ${res.status}`)
  const data = await res.json()

  const videoStreams: StreamQuality[] = (data.videoStreams ?? []).map((s: any) => ({
    label: `${s.quality ?? s.resolution ?? 'Unknown'}${s.videoOnly ? ' (video only)' : ''}`,
    itag: s.itag,
    url: s.url,
    mimeType: s.mimeType,
    width: s.width,
    height: s.height,
    contentLength: s.contentLength,
  }))

  const audioStreams: StreamQuality[] = (data.audioStreams ?? []).map((s: any) => ({
    label: `${s.bitrate ? Math.round(s.bitrate / 1000) + 'kbps' : 'Unknown'} ${s.mimeType ?? ''}`,
    itag: s.itag,
    url: s.url,
    mimeType: s.mimeType,
    bitrate: s.bitrate,
    contentLength: s.contentLength,
  }))

  return {
    id: videoId,
    title: data.title ?? 'Untitled',
    thumbnail: data.thumbnailUrl ?? data.thumbnail ?? '',
    duration: data.duration ?? 0,
    uploader: data.uploader ?? 'Unknown',
    uploaderAvatar: data.uploaderAvatar ?? '',
    description: data.description ?? '',
    videoStreams,
    audioStreams,
  }
}

export async function getAutocomplete(query: string): Promise<string[]> {
  try {
    const params = new URLSearchParams({ query })
    const res = await fetch(apiUrl(`/opensearch/suggestions?${params}`))
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}
