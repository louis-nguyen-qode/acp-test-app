import { z } from 'zod'

export const profileSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or fewer'),
  bio: z
    .string()
    .max(500, 'Bio must be 500 characters or fewer')
    .optional()
    .or(z.literal('')),
})

export type ProfileFormValues = z.infer<typeof profileSchema>
