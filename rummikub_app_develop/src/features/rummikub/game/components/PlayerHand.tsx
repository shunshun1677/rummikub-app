import type { DragEvent } from 'react'
import type { Tile } from '../../_shared/types/types'
import { TileView } from './TileView'

type PlayerHandProps = {
  hand: Tile[]
  selectedTileId: string | null
  recentlyDrawnTileId: string | null
  disabled: boolean
  onSelectTile: (tileId: string) => void
  onDragStartTile: (tileId: string, event: DragEvent<HTMLButtonElement>) => void
  onDragEndTile: () => void
}

export function PlayerHand({
  hand,
  selectedTileId,
  recentlyDrawnTileId,
  disabled,
  onSelectTile,
  onDragStartTile,
  onDragEndTile,
}: PlayerHandProps) {
  return (
    <section className="hand-zone" aria-label="player hand">
      <div className="zone-title">
        <h2>プレイヤー手牌</h2>
        <span>{hand.length}枚</span>
      </div>
      <div className="tile-row hand-row">
        {hand.map((tile) => (
          <TileView
            key={tile.id}
            tile={tile}
            disabled={disabled}
            draggable={!disabled}
            isSelected={selectedTileId === tile.id}
            isRecentlyDrawn={recentlyDrawnTileId === tile.id}
            onClick={() => onSelectTile(tile.id)}
            onDragStart={onDragStartTile}
            onDragEnd={onDragEndTile}
          />
        ))}
      </div>
    </section>
  )
}
