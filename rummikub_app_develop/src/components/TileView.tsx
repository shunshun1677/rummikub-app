import type { DragEvent } from 'react'
import type { Tile } from '../types'

type TileViewProps = {
  tile: Tile
  isSelected?: boolean
  isHidden?: boolean
  disabled?: boolean
  draggable?: boolean
  onClick?: () => void
  onDragStart?: (tileId: string, event: DragEvent<HTMLButtonElement>) => void
  onDragEnd?: () => void
}

export function TileView({
  tile,
  isSelected = false,
  isHidden = false,
  disabled = false,
  draggable = false,
  onClick,
  onDragStart,
  onDragEnd,
}: TileViewProps) {
  const label = isHidden ? '' : tile.color === 'joker' ? 'J' : tile.number
  const ariaLabel = isHidden
    ? 'hidden tile'
    : tile.color === 'joker'
      ? 'joker'
      : `${tile.color} ${tile.number}`

  return (
    <button
      type="button"
      className={`tile tile-${isHidden ? 'hidden' : tile.color} ${isSelected ? 'selected' : ''}`}
      disabled={disabled}
      aria-pressed={isSelected}
      aria-label={ariaLabel}
      draggable={draggable && !disabled}
      onClick={onClick}
      onDragStart={(event) => onDragStart?.(tile.id, event)}
      onDragEnd={onDragEnd}
    >
      <span>{label}</span>
    </button>
  )
}
