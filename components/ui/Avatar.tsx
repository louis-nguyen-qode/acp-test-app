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
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size, minWidth: size, minHeight: size }}
      />
    )
  }

  const initial = name ? name.charAt(0).toUpperCase() : '?'
  const bgColor = getColorFromName(name || '')

  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-semibold shrink-0"
      style={{ width: size, height: size, minWidth: size, minHeight: size, backgroundColor: bgColor, fontSize: size / 2.5 }}
    >
      {initial}
    </div>
  )
}

function getColorFromName(name: string): string {
  // WCAG AA compliant colors (≥4.5:1 contrast with white text)
  const colors = [
    '#1d4ed8', // blue-700: ~7.0:1 with white
    '#047857', // emerald-700: ~7.4:1 with white
    '#b45309', // amber-700: ~5.9:1 with white
    '#b91c1c', // red-700: ~6.1:1 with white
    '#6d28d9', // violet-700: ~7.0:1 with white
    '#be185d', // pink-700: ~6.7:1 with white
    '#0e7490', // cyan-700: ~6.1:1 with white
  ]

  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }

  return colors[Math.abs(hash) % colors.length]
}
