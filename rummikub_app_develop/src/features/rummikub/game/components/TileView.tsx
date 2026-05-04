import type { DragEvent } from 'react'
import type { Tile } from '../../_shared/types/types'

type TileViewProps = {
  tile: Tile
  isSelected?: boolean
  isRecentlyDrawn?: boolean
  isHidden?: boolean
  disabled?: boolean
  draggable?: boolean
  onClick?: () => void
  onDragStart?: (tileId: string, event: DragEvent<HTMLButtonElement>) => void
  onDragEnd?: () => void
  onDragOver?: (event: DragEvent<HTMLButtonElement>) => void
  onDrop?: (event: DragEvent<HTMLButtonElement>) => void
}

export function TileView({
  tile,
  isSelected = false,
  isRecentlyDrawn = false,
  isHidden = false,
  disabled = false,
  draggable = false,
  onClick,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: TileViewProps) {
  const label = isHidden ? '' : tile.color === 'joker' ? 'J' : tile.number
  const ariaLabel = isHidden
    ? 'hidden tile'
    : tile.color === 'joker'
      ? 'joker'
      : `${tile.color} ${tile.number}`
  const tileStateClassNames = [
    'tile',
    `tile-${isHidden ? 'hidden' : tile.color}`,
    isSelected ? 'selected' : '',
    isRecentlyDrawn ? 'recently-drawn' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type="button"
      className={tileStateClassNames}
      disabled={disabled}
      aria-pressed={isSelected}
      aria-label={isRecentlyDrawn ? `${ariaLabel}, 直近で引いた牌` : ariaLabel}
      draggable={draggable && !disabled}
      onClick={onClick}
      onDragStart={(event) => onDragStart?.(tile.id, event)}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <span>{label}</span>
    </button>
  )
}
