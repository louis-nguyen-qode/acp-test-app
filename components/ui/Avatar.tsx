'use client'

import Image from 'next/image'

interface AvatarProps {
  src?: string | null
  name?: string | null
  size?: number
}

export function Avatar({ src, name, size = 40 }: AvatarProps) {
  if (src) {
    return (
      <Image
        src={src}
        alt={name || 'User avatar'}
        width={size}
        height={size}
        className="rounded-full object-cover"
      />
    )
  }

  const initial = name ? name.charAt(0).toUpperCase() : '?'
  const bgColor = getColorFromName(name || '')

  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-semibold"
      style={{ width: size, height: size, backgroundColor: bgColor, fontSize: size / 2.5 }}
    >
      {initial}
    </div>
  )
}

function getColorFromName(name: string): string {
  const colors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
  ]

  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }

  return colors[Math.abs(hash) % colors.length]
}
