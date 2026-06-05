import { Platform } from 'react-native'
import type { DownloadedItem } from '../types'

const isWeb = Platform.OS === 'web'

let SQLite: any = null
try {
  SQLite = require('expo-sqlite')
} catch {}

function webStorage() {
  const KEY = 'ytdream_downloads'
  return {
    getAll: (): DownloadedItem[] => {
      try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
    },
    save: (items: DownloadedItem[]) => {
      localStorage.setItem(KEY, JSON.stringify(items))
    },
  }
}

let nativeDb: any = null

async function getNativeDb() {
  if (nativeDb) return nativeDb
  nativeDb = await SQLite.openDatabaseAsync('youtube-dream.db')
  await nativeDb.execAsync(`
    CREATE TABLE IF NOT EXISTS downloads (
      id TEXT PRIMARY KEY,
      youtube_id TEXT NOT NULL,
      title TEXT NOT NULL,
      uploader TEXT NOT NULL,
      thumbnail TEXT NOT NULL,
      duration REAL NOT NULL DEFAULT 0,
      file_path TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('audio','video')),
      quality TEXT NOT NULL,
      added_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS playlists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      items TEXT NOT NULL DEFAULT '[]',
      created_at INTEGER NOT NULL
    );
  `)
  return nativeDb
}

export async function insertDownload(item: DownloadedItem): Promise<void> {
  if (isWeb || !SQLite) {
    const store = webStorage()
    const items = store.getAll()
    const idx = items.findIndex(i => i.id === item.id)
    if (idx >= 0) items[idx] = item
    else items.unshift(item)
    store.save(items)
    return
  }
  const d = await getNativeDb()
  await d.runAsync(
    `INSERT OR REPLACE INTO downloads (id, youtube_id, title, uploader, thumbnail, duration, file_path, type, quality, added_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    item.id, item.youtubeId, item.title, item.uploader, item.thumbnail,
    item.duration, item.filePath, item.type, item.quality, item.addedAt
  )
}

export async function getDownloads(): Promise<DownloadedItem[]> {
  if (isWeb || !SQLite) return webStorage().getAll()
  const d = await getNativeDb()
  const rows = await d.getAllAsync(
    'SELECT * FROM downloads ORDER BY added_at DESC'
  )
  return (rows as any[]).map(mapRow)
}

export async function removeDownload(id: string): Promise<void> {
  if (isWeb || !SQLite) {
    const store = webStorage()
    store.save(store.getAll().filter(i => i.id !== id))
    return
  }
  const d = await getNativeDb()
  await d.runAsync('DELETE FROM downloads WHERE id = ?', id)
}

export async function getDownloadByYoutubeId(youtubeId: string): Promise<DownloadedItem | null> {
  const items = await getDownloads()
  return items.find(i => i.youtubeId === youtubeId) ?? null
}

function mapRow(row: any): DownloadedItem {
  return {
    id: row.id,
    youtubeId: row.youtube_id,
    title: row.title,
    uploader: row.uploader,
    thumbnail: row.thumbnail,
    duration: row.duration,
    filePath: row.file_path,
    type: row.type,
    quality: row.quality,
    addedAt: row.added_at,
  }
}
