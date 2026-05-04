import { useState, type DragEvent } from 'react'
import type { TileSet } from '../../_shared/types/types'
import { inferSetType } from '../logics/gameLogic'
import { TileView } from './TileView'

type TileSetViewProps = {
  set: TileSet
  isLocked: boolean
  selectedTileId: string | null
  canDropHandTile: boolean
  onSelectTile: (setId: string, tileId: string) => void
  onDropHandTile: (setId: string, tileId: string) => void
}

export function TileSetView({
  set,
  isLocked,
  selectedTileId,
  canDropHandTile,
  onSelectTile,
  onDropHandTile,
}: TileSetViewProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const inferredType = inferSetType(set.tiles)
  const setTypeLabel = inferredType ?? '未確定'
  const isUnconfirmed = set.tiles.length > 0 && inferredType === null

  function handleDragOver(event: DragEvent<HTMLElement>): void {
    if (isLocked || !canDropHandTile) {
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
    if (isLocked || !canDropHandTile) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    setIsDragOver(false)

    const tileId = event.dataTransfer.getData('application/x-rummikub-tile-id')
    if (tileId) {
      onDropHandTile(set.id, tileId)
    }
  }

  return (
    <section
      className={`tile-set ${isLocked ? 'locked' : ''} ${isDragOver ? 'drag-over' : ''} ${
        isUnconfirmed ? 'unconfirmed' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="tile-set-header">
        <span className={`set-type-badge ${isUnconfirmed ? 'unconfirmed' : ''}`}>
          {setTypeLabel}
        </span>
        <span>{set.tiles.length}枚</span>
      </div>

      <div className="tile-row set-row">
        {set.tiles.length === 0 ? (
          <span className="empty-set">空のセット</span>
        ) : (
          set.tiles.map((tile) => (
            <TileView
              key={tile.id}
              tile={tile}
              disabled={isLocked}
              isSelected={selectedTileId === tile.id}
              onClick={() => onSelectTile(set.id, tile.id)}
            />
          ))
        )}
      </div>
    </section>
  )
}
