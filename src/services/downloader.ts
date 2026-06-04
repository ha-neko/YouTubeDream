import * as FileSystem from 'expo-file-system'
import type { DownloadedItem } from '../types'
import { insertDownload } from './database'

const DOWNLOADS_DIR = `${FileSystem.documentDirectory}downloads/`

export interface DownloadProgress {
  id: string
  title: string
  bytesWritten: number
  contentLength: number
  progress: number
  status: 'downloading' | 'completed' | 'error'
  error?: string
}

type ProgressCallback = (progress: DownloadProgress) => void

const activeDownloads = new Map<string, DownloadProgress>()
const listeners = new Set<ProgressCallback>()

export function onProgress(cb: ProgressCallback) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function notify(p: DownloadProgress) {
  listeners.forEach(l => l(p))
}

export async function ensureDir() {
  const info = await FileSystem.getInfoAsync(DOWNLOADS_DIR)
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(DOWNLOADS_DIR, { intermediates: true })
  }
}

export function getActiveDownloads(): DownloadProgress[] {
  return Array.from(activeDownloads.values())
}

export async function startDownload(
  youtubeId: string,
  title: string,
  uploader: string,
  thumbnail: string,
  duration: number,
  streamUrl: string,
  quality: string,
  type: 'audio' | 'video'
): Promise<string> {
  await ensureDir()

  const id = `${youtubeId}_${Date.now()}`
  const ext = type === 'audio' ? '.m4a' : '.mp4'
  const filePath = `${DOWNLOADS_DIR}${id}${ext}`

  const progress: DownloadProgress = {
    id, title, bytesWritten: 0, contentLength: 0, progress: 0,
    status: 'downloading',
  }
  activeDownloads.set(id, progress)
  notify(progress)

  try {
    const result = await FileSystem.createDownloadResumable(
      streamUrl,
      filePath,
      {},
      (p) => {
        const bp = progress
        bp.bytesWritten = p.totalBytesWritten
        bp.contentLength = p.totalBytesExpectedToWrite
        bp.progress = p.totalBytesExpectedToWrite > 0
          ? p.totalBytesWritten / p.totalBytesExpectedToWrite
          : 0
        notify({ ...bp })
      }
    )

    await result.downloadAsync()

    const item: DownloadedItem = {
      id: youtubeId,
      youtubeId,
      title,
      uploader,
      thumbnail,
      duration,
      filePath,
      type,
      quality,
      addedAt: Date.now(),
    }
    await insertDownload(item)

    progress.status = 'completed'
    progress.progress = 1
    notify({ ...progress })
    activeDownloads.delete(id)

    return filePath
  } catch (e: any) {
    progress.status = 'error'
    progress.error = e?.message ?? 'Download failed'
    notify({ ...progress })
    activeDownloads.delete(id)
    throw e
  }
}
