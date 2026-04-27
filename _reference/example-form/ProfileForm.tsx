'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { profileSchema, type ProfileFormValues } from './schema'
import { updateProfile } from './actions'

interface ProfileFormProps {
  defaultValues?: Partial<ProfileFormValues>
}

type FormState = 'idle' | 'submitting' | 'success' | 'error'

export function ProfileForm({ defaultValues }: ProfileFormProps) {
  const [formState, setFormState] = useState<FormState>('idle')
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      bio: defaultValues?.bio ?? '',
    },
  })

  async function onSubmit(values: ProfileFormValues) {
    setFormState('submitting')
    setFormError(null)

    const result = await updateProfile(values)

    if (result.success) {
      setFormState('success')
    } else {
      setFormState('error')
      setFormError(result.error)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
        aria-label="Profile settings form"
      >
        {/* Form-level error */}
        {formState === 'error' && formError && (
          <Alert variant="destructive" role="alert">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        {/* Form-level success */}
        {formState === 'success' && (
          <Alert role="status">
            <Check className="h-4 w-4" aria-hidden="true" />
            <AlertDescription>Profile updated successfully.</AlertDescription>
          </Alert>
        )}

        {/* Name field */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Your name"
                  aria-describedby={
                    form.formState.errors.name ? 'name-error' : undefined
                  }
                  disabled={formState === 'submitting'}
                />
              </FormControl>
              <FormMessage id="name-error" />
            </FormItem>
          )}
        />

        {/* Bio field */}
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Tell us a little about yourself"
                  rows={4}
                  aria-describedby={
                    form.formState.errors.bio ? 'bio-error' : undefined
                  }
                  disabled={formState === 'submitting'}
                />
              </FormControl>
              <FormMessage id="bio-error" />
            </FormItem>
          )}
        />

        {/* Submit */}
        <Button
          type="submit"
          disabled={formState === 'submitting'}
          className="w-full sm:w-auto"
        >
          {formState === 'submitting' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Saving...
            </>
          ) : (
            'Save changes'
          )}
        </Button>
      </form>
    </Form>
  )
}
