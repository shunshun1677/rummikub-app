import type { SetType, TileSet } from '../types'
import { TileSetView } from './TileSetView'

type GameBoardProps = {
  board: TileSet[]
  lockedSetIds: Set<string>
  canAddSelected: boolean
  selectedTileId: string | null
  onAddSelected: (setId: string) => void
  onSelectTile: (setId: string, tileId: string) => void
  onChangeType: (setId: string, type: SetType) => void
  onRemoveEmptySet: (setId: string) => void
}

export function GameBoard({
  board,
  lockedSetIds,
  canAddSelected,
  selectedTileId,
  onAddSelected,
  onSelectTile,
  onChangeType,
  onRemoveEmptySet,
}: GameBoardProps) {
  return (
    <section className="board-zone" aria-label="board">
      <div className="zone-title">
        <h2>場</h2>
        <span>{board.length}セット</span>
      </div>

      {board.length === 0 ? (
        <p className="notice">まだ場にセットはありません。</p>
      ) : (
        <div className="board-grid">
          {board.map((set) => (
            <TileSetView
              key={set.id}
              set={set}
              isLocked={lockedSetIds.has(set.id)}
              canAddSelected={canAddSelected}
              selectedTileId={selectedTileId}
              onAddSelected={onAddSelected}
              onSelectTile={onSelectTile}
              onChangeType={onChangeType}
              onRemoveEmptySet={onRemoveEmptySet}
            />
          ))}
        </div>
      )}
    </section>
  )
}
