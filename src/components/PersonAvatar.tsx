const PALETTES = [
  { bg: '#e7f0ea', fg: '#145c46' },
  { bg: '#eeeafa', fg: '#615087' },
  { bg: '#e9f0f5', fg: '#2f5f80' },
  { bg: '#fbf0dc', fg: '#96621a' },
  { bg: '#f8e9e4', fg: '#a64932' },
]

interface PersonAvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function PersonAvatar({ name, size = 'md', className = '' }: PersonAvatarProps) {
  const palette = PALETTES[name.charCodeAt(0) % PALETTES.length]
  return (
    <span
      className={`person-avatar person-avatar-${size} ${className}`.trim()}
      style={{ background: palette.bg, color: palette.fg }}
      aria-hidden
    >
      {name.slice(0, 1)}
    </span>
  )
}
