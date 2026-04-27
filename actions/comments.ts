'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function addComment(postId: string, body: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Not authenticated')
  }

  // Validate body
  if (!body || body.trim().length === 0) {
    throw new Error('Comment body cannot be empty')
  }

  if (body.length > 1000) {
    throw new Error('Comment body cannot exceed 1000 characters')
  }

  await prisma.comment.create({
    data: {
      content: body,
      postId,
      userId: session.user.id,
    },
  })

  revalidatePath('/')
}

export async function deleteComment(commentId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Not authenticated')
  }

  // Get the comment with post info
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: {
      post: {
        select: { userId: true },
      },
    },
  })

  if (!comment) {
    throw new Error('Comment not found')
  }

  // Verify caller is comment author or post author
  if (comment.userId !== session.user.id && comment.post.userId !== session.user.id) {
    throw new Error('Not authorized')
  }

  // Hard delete
  await prisma.comment.delete({
    where: { id: commentId },
  })

  revalidatePath('/')
}

export interface CommentWithUser {
  id: string
  content: string
  createdAt: Date
  userId: string
  user: {
    id: string
    name: string | null
    email: string
    avatarUrl: string | null
  }
}

export async function getComments(postId: string): Promise<CommentWithUser[]> {
  const comments = await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: 'asc' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  })

  return comments
}
