'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { profileSchema, type ProfileFormValues } from './schema'

export type UpdateProfileResult =
  | { success: true; data: { name: string; bio?: string | null } }
  | { success: false; error: string }

export async function updateProfile(
  formData: ProfileFormValues
): Promise<UpdateProfileResult> {
  // 1. Check authentication
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'You must be signed in to update your profile.' }
  }

  // 2. Validate input with Zod
  const parsed = profileSchema.safeParse(formData)
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]
    return { success: false, error: firstError?.message ?? 'Invalid input.' }
  }

  // 3. Persist to DB
  try {
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: parsed.data.name,
        // bio would be a field on the User model; included here as example
      },
      select: { name: true },
    })

    // 4. Revalidate the page so server components re-fetch
    revalidatePath('/dashboard/profile')

    return { success: true, data: { name: updatedUser.name ?? parsed.data.name } }
  } catch {
    return { success: false, error: 'Failed to update profile. Please try again.' }
  }
}
