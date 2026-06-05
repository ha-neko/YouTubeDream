import { Platform } from 'react-native'
import type { YouTubeSearchResult, YouTubeStream, StreamQuality } from '../types'

const PIPED_API = 'https://api.piped.private.coffee'
const CORS_PROXY = 'https://api.codetabs.com/v1/proxy?quest='

const isWeb = Platform.OS === 'web'

function apiUrl(path: string): string {
  const url = `${PIPED_API}${path}`
  return isWeb ? `${CORS_PROXY}${encodeURIComponent(url)}` : url
}

export async function getTrending(): Promise<YouTubeSearchResult[]> {
  try {
    const res = await fetch(apiUrl('/trending?region=US'))
    if (!res.ok) return []
    const data = await res.json()
    return (Array.isArray(data) ? data : data.items ?? []).map((item: any) => ({
      id: item.url?.split('watch?v=')?.[1] ?? item.url ?? '',
      title: item.title ?? 'Untitled',
      thumbnail: item.thumbnail ?? item.thumbnailUrl ?? '',
      duration: item.duration ?? 0,
      uploader: item.uploader ?? item.uploaderName ?? 'Unknown',
      uploaderAvatar: item.uploaderAvatar ?? '',
      views: item.views ?? 0,
    })).filter((r: YouTubeSearchResult) => r.id)
  } catch {
    return []
  }
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
    label: s.quality && !s.quality.includes('LBRY')
      ? `${s.quality}${s.videoOnly ? ' (video only)' : ''}`
      : s.label ?? s.quality ?? 'Unknown',
    itag: s.itag,
    url: s.url,
    mimeType: s.mimeType,
    width: s.width,
    height: s.height,
    contentLength: s.contentLength,
    videoOnly: s.videoOnly,
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

export function getPlayableStream(stream: YouTubeStream): { url: string; label: string } | null {
  const audio = stream.audioStreams?.find(s => s.url)
  if (audio?.url) return { url: audio.url, label: audio.label }

  const videoWithAudio = stream.videoStreams?.find(s => s.url && !s.videoOnly)
  if (videoWithAudio?.url) return { url: videoWithAudio.url, label: videoWithAudio.label + ' (audio)' }

  const anyVideo = stream.videoStreams?.find(s => s.url)
  if (anyVideo?.url) return { url: anyVideo.url, label: anyVideo.label }

  return null
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
