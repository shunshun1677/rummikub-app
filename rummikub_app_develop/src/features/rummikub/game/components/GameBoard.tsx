import { useState, type DragEvent } from 'react'
import type { TileSet } from '../../_shared/types/types'
import { TileSetView } from './TileSetView'

type GameBoardProps = {
  board: TileSet[]
  lockedSetIds: Set<string>
  canDropHandTile: boolean
  selectedTileId: string | null
  onSelectTile: (setId: string, tileId: string) => void
  onDropHandTile: (setId: string, tileId: string) => void
  onDropHandTileToNewSet: (tileId: string) => void
}

export function GameBoard({
  board,
  lockedSetIds,
  canDropHandTile,
  selectedTileId,
  onSelectTile,
  onDropHandTile,
  onDropHandTileToNewSet,
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
              canDropHandTile={canDropHandTile}
              selectedTileId={selectedTileId}
              onSelectTile={onSelectTile}
              onDropHandTile={onDropHandTile}
            />
          ))}
        </div>
      )}
    </section>
  )
}
