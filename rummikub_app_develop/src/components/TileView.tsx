import type { Tile } from '../types'

type TileViewProps = {
  tile: Tile
  isSelected?: boolean
  isHidden?: boolean
  disabled?: boolean
  onClick?: () => void
}

export function TileView({
  tile,
  isSelected = false,
  isHidden = false,
  disabled = false,
  onClick,
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
      onClick={onClick}
    >
      <span>{label}</span>
    </button>
  )
}
