import type { LyricLine } from '../types'

const LRCLIB_API = 'https://lrclib.net/api'

export async function searchLyrics(
  track: string,
  artist: string,
  duration?: number
): Promise<{ id: number; name: string; artistName: string } | null> {
  try {
    const params = new URLSearchParams({
      q: `${track} ${artist}`,
      ...(duration ? { duration: String(Math.floor(duration)) } : {}),
    })
    const res = await fetch(`${LRCLIB_API}/search?${params}`)
    if (!res.ok) return null
    const data = await res.json()
    return data?.[0] ?? null
  } catch {
    return null
  }
}

export async function getLyrics(
  id: number
): Promise<{ synced: LyricLine[]; plain: string } | null> {
  try {
    const res = await fetch(`${LRCLIB_API}/get/${id}`)
    if (!res.ok) return null
    const data = await res.json()

    const synced: LyricLine[] = []
    const raw = data.syncedLyrics ?? ''
    const lines = raw.split('\n')
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/

    for (const line of lines) {
      const match = timeRegex.exec(line)
      if (match) {
        const mins = parseInt(match[1])
        const secs = parseInt(match[2])
        const millis = parseInt(match[3].padEnd(3, '0'))
        const time = mins * 60 + secs + millis / 1000
        const text = line.replace(timeRegex, '').trim()
        if (text) synced.push({ time, text })
      }
    }

    return {
      synced,
      plain: data.plainLyrics ?? '',
    }
  } catch {
    return null
  }
}
