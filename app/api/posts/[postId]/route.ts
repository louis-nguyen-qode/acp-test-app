import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Fetch post with only necessary fields
    const post = await prisma.post.findUnique({
      where: { id: params.postId },
      select: {
        id: true,
        userId: true,
      },
    })

    // Check if post exists
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Check authorization (post author must match current user)
    if (post.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only delete your own posts' },
        { status: 403 }
      )
    }

    // Hard delete the post (comments cascade delete via schema)
    await prisma.post.delete({
      where: { id: params.postId },
    })

    // Return 204 No Content on success
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Delete failed'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
