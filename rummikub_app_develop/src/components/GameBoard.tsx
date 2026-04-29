import { useState, type DragEvent } from 'react'
import type { SetType, TileSet } from '../types'
import { TileSetView } from './TileSetView'

type GameBoardProps = {
  board: TileSet[]
  lockedSetIds: Set<string>
  canAddSelected: boolean
  canDropHandTile: boolean
  selectedTileId: string | null
  onAddSelected: (setId: string) => void
  onSelectTile: (setId: string, tileId: string) => void
  onDropHandTile: (setId: string, tileId: string) => void
  onDropHandTileToNewSet: (tileId: string) => void
  onChangeType: (setId: string, type: SetType) => void
  onRemoveEmptySet: (setId: string) => void
}

export function GameBoard({
  board,
  lockedSetIds,
  canAddSelected,
  canDropHandTile,
  selectedTileId,
  onAddSelected,
  onSelectTile,
  onDropHandTile,
  onDropHandTileToNewSet,
  onChangeType,
  onRemoveEmptySet,
}: GameBoardProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  function handleDragOver(event: DragEvent<HTMLElement>): void {
    if (!canDropHandTile) {
      return
    }

    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)
  }

  function handleDragLeave(event: DragEvent<HTMLElement>): void {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsDragOver(false)
    }
  }

  function handleDrop(event: DragEvent<HTMLElement>): void {
    if (!canDropHandTile) {
      return
    }

    event.preventDefault()
    setIsDragOver(false)

    const tileId = event.dataTransfer.getData('application/x-rummikub-tile-id')
    if (tileId) {
      onDropHandTileToNewSet(tileId)
    }
  }

  return (
    <section
      className={`board-zone ${isDragOver ? 'drag-over' : ''}`}
      aria-label="board"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
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
              canDropHandTile={canDropHandTile}
              selectedTileId={selectedTileId}
              onAddSelected={onAddSelected}
              onSelectTile={onSelectTile}
              onDropHandTile={onDropHandTile}
              onChangeType={onChangeType}
              onRemoveEmptySet={onRemoveEmptySet}
            />
          ))}
        </div>
      )}
    </section>
  )
}
