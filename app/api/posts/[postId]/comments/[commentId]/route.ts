import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { postId: string; commentId: string } }
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

    // Fetch the comment
    const comment = await prisma.comment.findUnique({
      where: {
        id: params.commentId,
      },
    })

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    // Check if the user is the author of the comment
    if (comment.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden: Only the comment author can delete this comment' },
        { status: 403 }
      )
    }

    // Delete the comment
    await prisma.comment.delete({
      where: {
        id: params.commentId,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete comment'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
