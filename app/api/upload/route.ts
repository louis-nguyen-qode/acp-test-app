import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { uploadMedia } from '@/lib/upload'

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Parse multipart form data
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate MIME type
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      return NextResponse.json(
        { error: 'Only image and video files are allowed' },
        { status: 400 }
      )
    }

    // Upload file
    const url = await uploadMedia(file)

    return NextResponse.json({ url }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
