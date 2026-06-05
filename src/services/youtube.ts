import { Platform } from 'react-native'
import type { YouTubeSearchResult, YouTubeStream, StreamQuality } from '../types'

const PIPED_INSTANCES = [
  'https://api.piped.private.coffee',
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.leptons.xyz',
  'https://pipedapi.nosebs.ru',
  'https://pipedapi-libre.kavin.rocks',
  'https://api.piped.yt',
  'https://piped-api.privacy.com.de',
  'https://pipedapi.adminforge.de',
  'https://pipedapi.drgns.space',
  'https://pipedapi.owo.si',
  'https://pipedapi.ducks.party',
  'https://pipedapi.reallyaweso.me',
  'https://api.piped.private.coffee',
  'https://pipedapi.darkness.services',
  'https://pipedapi.orangenet.cc',
]

const CORS_PROXY = 'https://api.codetabs.com/v1/proxy?quest='
const isWeb = Platform.OS === 'web'

function apiUrl(instance: string, path: string): string {
  const url = `${instance}${path}`
  return isWeb ? `${CORS_PROXY}${encodeURIComponent(url)}` : url
}

function fixThumbnail(url: string, videoId: string): string {
  if (url.includes('proxy.piped') || url.includes('i.ytimg.com') || url.includes('ytimg.com')) {
    return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
  }
  return url
}

function resultFromItem(item: any): YouTubeSearchResult | null {
  const id = item.url?.split('watch?v=')?.[1] ?? item.url ?? ''
  if (!id) return null
  return {
    id,
    title: item.title ?? 'Untitled',
    thumbnail: fixThumbnail(item.thumbnail ?? item.thumbnailUrl ?? '', id),
    duration: item.duration ?? 0,
    uploader: item.uploader ?? item.uploaderName ?? 'Unknown',
    uploaderAvatar: item.uploaderAvatar ?? '',
    views: item.views ?? 0,
  }
}

async function fetchFromInstances<T>(path: string, extract: (data: any) => T): Promise<T> {
  for (const instance of PIPED_INSTANCES) {
    try {
      const res = await fetch(apiUrl(instance, path), { signal: AbortSignal.timeout(8000) })
      if (!res.ok) continue
      const data = await res.json()
      if (data && !data.error) return extract(data)
    } catch { }
  }
  throw new Error('All instances failed')
}

export async function getTrending(): Promise<YouTubeSearchResult[]> {
  try {
    return await fetchFromInstances('/trending?region=US', (data) => {
      const items = Array.isArray(data) ? data : data.items ?? []
      return items.map(resultFromItem).filter(Boolean) as YouTubeSearchResult[]
    })
  } catch {
    return []
  }
}

export async function search(
  query: string,
  nextpage?: string
): Promise<{ results: YouTubeSearchResult[]; nextpage: string | null }> {
  const params = new URLSearchParams({ q: query, filter: 'videos' })
  if (nextpage) params.set('nextpage', nextpage)

  return await fetchFromInstances(`/search?${params}`, (data) => ({
    results: (data.items ?? []).map(resultFromItem).filter(Boolean) as YouTubeSearchResult[],
    nextpage: data.nextpage ?? null,
  }))
}

export async function getStream(videoId: string): Promise<YouTubeStream> {
  return await fetchFromInstances(`/streams/${videoId}`, (data) => {
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
  })
}

export function getPlayableStream(stream: YouTubeStream): { url: string; label: string } | null {
  const audio = stream.audioStreams?.find(s => s.url)
  if (audio?.url) return { url: audio.url, label: audio.label }

  const proxiedVideo = stream.videoStreams?.find(s => s.url && s.url.includes('proxy.piped') && !s.videoOnly)
  if (proxiedVideo?.url) return { url: proxiedVideo.url, label: proxiedVideo.label + ' (audio)' }

  const nonLbryVideo = stream.videoStreams?.find(s => s.url && !s.label.includes('LBRY') && !s.videoOnly)
  if (nonLbryVideo?.url) return { url: nonLbryVideo.url, label: nonLbryVideo.label + ' (audio)' }

  const anyVideo = stream.videoStreams?.find(s => s.url)
  if (anyVideo?.url) return { url: anyVideo.url, label: anyVideo.label }

  return null
}

export async function getAutocomplete(query: string): Promise<string[]> {
  for (const instance of PIPED_INSTANCES) {
    try {
      const params = new URLSearchParams({ query })
      const res = await fetch(apiUrl(instance, `/opensearch/suggestions?${params}`), { signal: AbortSignal.timeout(5000) })
      if (!res.ok) continue
      return await res.json()
    } catch { }
  }
  return []
}
