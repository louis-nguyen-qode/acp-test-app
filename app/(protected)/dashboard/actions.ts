'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export type PostActionResult = { success: true } | { success: false; error: string }

const createPostSchema = z.object({
  content: z.string().min(1, 'Post content is required').max(2000, 'Post is too long'),
  type: z.enum(['text', 'image', 'story']).default('text'),
  mediaUrl: z.string().url('Invalid media URL').optional().or(z.literal('')),
})

const updatePostSchema = z.object({
  content: z.string().min(1, 'Post content is required').max(2000, 'Post is too long'),
})

const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(500, 'Comment is too long'),
})

export async function createPost(formData: unknown): Promise<PostActionResult> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Not authenticated' }

  const parsed = createPostSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  await prisma.post.create({
    data: {
      content: parsed.data.content,
      type: parsed.data.type,
      mediaUrl: parsed.data.mediaUrl ?? null,
      userId: session.user.id,
    },
  })

  revalidatePath('/dashboard')
  return { success: true }
}

export async function deletePost(postId: string): Promise<PostActionResult> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Not authenticated' }

  const post = await prisma.post.findUnique({ where: { id: postId } })
  if (!post || post.userId !== session.user.id) {
    return { success: false, error: 'Post not found' }
  }

  await prisma.post.delete({ where: { id: postId } })
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updatePost(
  postId: string,
  formData: unknown,
): Promise<PostActionResult> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Not authenticated' }

  const post = await prisma.post.findUnique({ where: { id: postId } })
  if (!post || post.userId !== session.user.id) {
    return { success: false, error: 'Post not found' }
  }

  const parsed = updatePostSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  await prisma.post.update({
    where: { id: postId },
    data: { content: parsed.data.content },
  })

  revalidatePath('/dashboard')
  return { success: true }
}

export async function createComment(
  postId: string,
  formData: unknown,
): Promise<PostActionResult> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Not authenticated' }

  const parsed = createCommentSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const post = await prisma.post.findUnique({ where: { id: postId } })
  if (!post) return { success: false, error: 'Post not found' }

  await prisma.comment.create({
    data: {
      content: parsed.data.content,
      postId,
      userId: session.user.id,
    },
  })

  revalidatePath('/dashboard')
  return { success: true }
}

export async function toggleLike(postId: string): Promise<PostActionResult> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Not authenticated' }

  const post = await prisma.post.findUnique({ where: { id: postId } })
  if (!post) return { success: false, error: 'Post not found' }

  const existing = await prisma.like.findUnique({
    where: { postId_userId: { postId, userId: session.user.id } },
  })

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } })
  } else {
    await prisma.like.create({ data: { postId, userId: session.user.id } })
  }

  revalidatePath('/dashboard')
  return { success: true }
}
