import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

const createCommentSchema = z.object({
  content: z.string().min(1, 'Content cannot be empty').max(300, 'Content must be 300 characters or less'),
})

export async function GET(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const comments = await prisma.comment.findMany({
      where: {
        postId: params.postId,
      },
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    })

    // Map avatarUrl to image for frontend consistency
    const formattedComments = comments.map(comment => ({
      ...comment,
      user: {
        id: comment.user.id,
        name: comment.user.name,
        image: comment.user.avatarUrl,
      },
    }))

    return NextResponse.json({ comments: formattedComments })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch comments'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await req.json()
    const validationResult = createCommentSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 }
      )
    }

    const { content } = validationResult.data

    if (!session.user.id) {
      return NextResponse.json(
        { error: 'User ID not found in session' },
        { status: 401 }
      )
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content,
        postId: params.postId,
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    })

    // Map avatarUrl to image for frontend consistency
    const formattedComment = {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      postId: comment.postId,
      userId: comment.userId,
      user: {
        id: comment.user.id,
        name: comment.user.name,
        image: comment.user.avatarUrl,
      },
    }

    return NextResponse.json(formattedComment, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create comment'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
