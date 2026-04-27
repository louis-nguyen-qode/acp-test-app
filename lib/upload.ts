import { randomUUID } from 'crypto'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

export async function uploadMedia(file: File): Promise<string> {
  // Validate MIME type
  if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
    throw new Error('Only image and video files are allowed')
  }

  // Ensure upload directory exists
  await mkdir(UPLOAD_DIR, { recursive: true })

  // Generate unique filename
  const ext = file.name.split('.').pop() || 'bin'
  const filename = `${randomUUID()}.${ext}`
  const filepath = path.join(UPLOAD_DIR, filename)

  // Convert file to buffer and save
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  await writeFile(filepath, buffer)

  // Return public URL
  return `/uploads/${filename}`
}
