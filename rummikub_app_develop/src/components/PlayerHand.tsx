import type { Tile } from '../types'
import { TileView } from './TileView'

type PlayerHandProps = {
  hand: Tile[]
  selectedTileId: string | null
  disabled: boolean
  onSelectTile: (tileId: string) => void
}

export function PlayerHand({
  hand,
  selectedTileId,
  disabled,
  onSelectTile,
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
            isSelected={selectedTileId === tile.id}
            onClick={() => onSelectTile(tile.id)}
          />
        ))}
      </div>
    </section>
  )
}
