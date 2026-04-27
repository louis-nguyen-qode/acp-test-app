'use client'

import { useState, useEffect } from 'react'

interface ClientFormattedDateProps {
  dateString: string
}

export function ClientFormattedDate({ dateString }: ClientFormattedDateProps) {
  const [formatted, setFormatted] = useState<string>('')

  useEffect(() => {
    setFormatted(
      new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date(dateString))
    )
  }, [dateString])

  return <span>{formatted}</span>
}
