'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function createPost(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Not authenticated')
  }

  const type = formData.get('type') as string
  const content = formData.get('content') as string | null
  const mediaUrlsString = formData.get('mediaUrls') as string | null

  const mediaUrls = mediaUrlsString ? JSON.parse(mediaUrlsString) : []

  await prisma.post.create({
    data: {
      type: type || 'text',
      content: content || null,
      mediaUrls: mediaUrls.length > 0 ? JSON.stringify(mediaUrls) : null,
      userId: session.user.id,
    },
  })

  revalidatePath('/')
}

export async function updatePost(
  postId: string,
  data: { content?: string; mediaUrls?: string[] }
) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Not authenticated')
  }

  // Verify ownership
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { userId: true },
  })

  if (!post || post.userId !== session.user.id) {
    throw new Error('Not authorized')
  }

  await prisma.post.update({
    where: { id: postId },
    data: {
      content: data.content,
      mediaUrls: data.mediaUrls ? JSON.stringify(data.mediaUrls) : undefined,
    },
  })

  revalidatePath('/')
}

export async function deletePost(postId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Not authenticated')
  }

  // Verify ownership
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { userId: true },
  })

  if (!post || post.userId !== session.user.id) {
    throw new Error('Not authorized')
  }

  // Soft delete
  await prisma.post.update({
    where: { id: postId },
    data: { deletedAt: new Date() },
  })

  revalidatePath('/')
}

export interface PostWithRelations {
  id: string
  type: string
  content: string | null
  mediaUrl: string | null
  mediaUrls: string[]
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
  userId: string
  user: {
    id: string
    name: string | null
    email: string
    avatarUrl: string | null
  }
  _count: {
    comments: number
    likes: number
  }
  likes: {
    userId: string
  }[]
}

export async function getPosts(cursor?: string): Promise<PostWithRelations[]> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Not authenticated')
  }

  const posts = await prisma.post.findMany({
    where: {
      deletedAt: null,
    },
    take: 10,
    ...(cursor
      ? {
          cursor: { id: cursor },
          skip: 1,
        }
      : {}),
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
      _count: {
        select: {
          comments: true,
          likes: true,
        },
      },
      likes: {
        select: {
          userId: true,
        },
      },
    },
  })

  // Parse mediaUrls from JSON string to array
  return posts.map((post) => ({
    ...post,
    mediaUrls: post.mediaUrls ? (JSON.parse(post.mediaUrls) as string[]) : [],
  })) as PostWithRelations[]
}
