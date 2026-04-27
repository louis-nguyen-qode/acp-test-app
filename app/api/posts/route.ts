import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

const createPostSchema = z.object({
  content: z.string().min(1, 'Content cannot be empty').max(500, 'Content must be 500 characters or less'),
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const cursor = searchParams.get('cursor')
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : 10

    // Validate limit is a positive number
    if (isNaN(limit) || limit <= 0) {
      return NextResponse.json(
        { error: 'Invalid limit parameter' },
        { status: 400 }
      )
    }

    // Fetch limit + 1 to determine if there's a next page
    const posts = await prisma.post.findMany({
      where: {
        deletedAt: null,
      },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    })

    // Determine if there's a next page
    const hasMore = posts.length > limit
    const postsToReturn = hasMore ? posts.slice(0, limit) : posts
    const nextCursor = hasMore ? postsToReturn[postsToReturn.length - 1]?.id ?? null : null

    // Map avatarUrl to image for frontend consistency
    const formattedPosts = postsToReturn.map(post => ({
      ...post,
      mediaUrls: post.mediaUrls ? JSON.parse(post.mediaUrls) : [],
      user: {
        id: post.user.id,
        name: post.user.name,
        image: post.user.avatarUrl,
      },
    }))

    return NextResponse.json({
      posts: formattedPosts,
      nextCursor,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch posts'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await req.json()
    const validationResult = createPostSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 }
      )
    }

    const { content } = validationResult.data

    // Create post
    const post = await prisma.post.create({
      data: {
        content,
        type: 'text',
        mediaUrls: null,
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
    const formattedPost = {
      ...post,
      mediaUrls: post.mediaUrls ? JSON.parse(post.mediaUrls) : [],
      user: {
        id: post.user.id,
        name: post.user.name,
        image: post.user.avatarUrl,
      },
    }

    return NextResponse.json(formattedPost, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create post'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
