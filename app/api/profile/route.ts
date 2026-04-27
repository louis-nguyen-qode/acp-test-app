import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

const updateProfileSchema = z.object({
  avatarUrl: z.string().optional(),
  name: z.string().min(1).max(100).optional(),
})

export async function PATCH(req: NextRequest) {
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
    const parsed = updateProfileSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { avatarUrl, name } = parsed.data

    // Build update data
    const updateData: { avatarUrl?: string | null; name?: string } = {}
    if (avatarUrl !== undefined) {
      updateData.avatarUrl = avatarUrl === '' ? null : avatarUrl
    }
    if (name !== undefined) {
      updateData.name = name
    }

    // Update user profile
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        role: true,
      },
    })

    return NextResponse.json({ user }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Update failed'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
