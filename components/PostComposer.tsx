'use client'

import { useState, useTransition } from 'react'
import { useSession } from 'next-auth/react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Toast } from '@/components/ui/Toast'
import { createPost } from '@/actions/posts'

interface PostComposerProps {
  onPostCreated?: () => void
}

type PostType = 'TEXT' | 'IMAGE' | 'STORY'

export function PostComposer({ onPostCreated }: PostComposerProps) {
  const { data: session } = useSession()
  const [content, setContent] = useState('')
  const [type, setType] = useState<PostType>('TEXT')
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const uploadedUrls: string[] = []

      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error('Upload failed')
        }

        const data = await response.json()
        uploadedUrls.push(data.url)
      }

      setMediaUrls((prev) => [...prev, ...uploadedUrls])
      setToast({ message: 'Files uploaded successfully', type: 'success' })
    } catch {
      setToast({ message: 'Failed to upload files', type: 'error' })
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const removeMedia = (index: number) => {
    setMediaUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim() && mediaUrls.length === 0) {
      setToast({ message: 'Please add some content or media', type: 'error' })
      return
    }

    const formData = new FormData()
    formData.append('type', type)
    formData.append('content', content)
    formData.append('mediaUrls', JSON.stringify(mediaUrls))

    startTransition(async () => {
      try {
        await createPost(formData)
        setContent('')
        setMediaUrls([])
        setType('TEXT')
        setToast({ message: 'Post created successfully!', type: 'success' })
        onPostCreated?.()
      } catch (error) {
        setToast({
          message: error instanceof Error ? error.message : 'Failed to create post',
          type: 'error'
        })
      }
    })
  }

  if (!session?.user) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      <form onSubmit={handleSubmit}>
        <div className="flex gap-3 mb-3">
          <Avatar
            src={session.user.image}
            name={session.user.name}
            size={40}
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[60px]"
            disabled={isPending || uploading}
          />
        </div>

        {/* Type selector pills */}
        <div className="flex gap-2 mb-3">
          {(['TEXT', 'IMAGE', 'STORY'] as PostType[]).map((postType) => (
            <button
              key={postType}
              type="button"
              onClick={() => setType(postType)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                type === postType
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              disabled={isPending || uploading}
            >
              {postType}
            </button>
          ))}
        </div>

        {/* Media previews */}
        {mediaUrls.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mb-3">
            {mediaUrls.map((url, index) => (
              <div key={index} className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-24 object-cover rounded-md"
                />
                <button
                  type="button"
                  onClick={() => removeMedia(index)}
                  className="absolute top-1 right-1 bg-gray-800 bg-opacity-70 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={isPending || uploading}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Bottom action bar */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <label className="cursor-pointer">
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={isPending || uploading}
            />
            <span className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-800 text-sm">
              📎 Photo/Video
            </span>
          </label>

          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isPending || uploading || (!content.trim() && mediaUrls.length === 0)}
            loading={isPending}
          >
            Post
          </Button>
        </div>
      </form>
    </div>
  )
}
