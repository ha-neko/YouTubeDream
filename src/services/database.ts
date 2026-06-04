import * as SQLite from 'expo-sqlite'
import type { DownloadedItem } from '../types'

let db: SQLite.SQLiteDatabase | null = null

async function getDb() {
  if (!db) {
    db = await SQLite.openDatabaseAsync('youtube-dream.db')
    await db.execAsync(`
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
  }
  return db
}

export async function insertDownload(item: DownloadedItem): Promise<void> {
  const d = await getDb()
  await d.runAsync(
    `INSERT OR REPLACE INTO downloads (id, youtube_id, title, uploader, thumbnail, duration, file_path, type, quality, added_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    item.id, item.youtubeId, item.title, item.uploader, item.thumbnail,
    item.duration, item.filePath, item.type, item.quality, item.addedAt
  )
}

export async function getDownloads(): Promise<DownloadedItem[]> {
  const d = await getDb()
  const rows = await d.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM downloads ORDER BY added_at DESC'
  )
  return rows.map(mapRow)
}

export async function removeDownload(id: string): Promise<void> {
  const d = await getDb()
  await d.runAsync('DELETE FROM downloads WHERE id = ?', id)
}

export async function getDownloadByYoutubeId(youtubeId: string): Promise<DownloadedItem | null> {
  const d = await getDb()
  const row = await d.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM downloads WHERE youtube_id = ?', youtubeId
  )
  return row ? mapRow(row) : null
}

function mapRow(row: Record<string, unknown>): DownloadedItem {
  return {
    id: row.id as string,
    youtubeId: row.youtube_id as string,
    title: row.title as string,
    uploader: row.uploader as string,
    thumbnail: row.thumbnail as string,
    duration: row.duration as number,
    filePath: row.file_path as string,
    type: row.type as 'audio' | 'video',
    quality: row.quality as string,
    addedAt: row.added_at as number,
  }
}
