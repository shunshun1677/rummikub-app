import { useState, type DragEvent } from 'react'
import type { TileSet } from '../../_shared/types/types'
import { getInvalidSetReason, inferSetType } from '../logics/gameLogic'
import { TileView } from './TileView'

type TileSetViewProps = {
  set: TileSet
  isLocked: boolean
  isHighlighted: boolean
  selectedTileId: string | null
  canDropHandTile: boolean
  onDragStartTile: (
    setId: string,
    tileId: string,
    event: DragEvent<HTMLButtonElement>,
  ) => void
  onDragEndTile: () => void
  onSelectTile: (setId: string, tileId: string) => void
  onDropTile: (setId: string, tileId: string, tileIndex?: number) => void
}

export function TileSetView({
  set,
  isLocked,
  isHighlighted,
  selectedTileId,
  canDropHandTile,
  onDragStartTile,
  onDragEndTile,
  onSelectTile,
  onDropTile,
}: TileSetViewProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const inferredType = inferSetType(set.tiles)
  const setTypeLabel = inferredType ?? '未確定'
  const isUnconfirmed = set.tiles.length > 0 && inferredType === null
  const invalidReason = getInvalidSetReason(set.tiles)

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
      onDropTile(set.id, tileId)
    }
  }

  function handleTileDragOver(event: DragEvent<HTMLButtonElement>): void {
    if (isLocked || !canDropHandTile) {
      return
    }

    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }

  function handleTileDrop(
    tileIndex: number,
    event: DragEvent<HTMLButtonElement>,
  ): void {
    if (isLocked || !canDropHandTile) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    setIsDragOver(false)

    const tileId = event.dataTransfer.getData('application/x-rummikub-tile-id')
    if (tileId) {
      onDropTile(set.id, tileId, tileIndex)
    }
  }

  return (
    <section
      className={`tile-set ${isLocked ? 'locked' : ''} ${isDragOver ? 'drag-over' : ''} ${
        isUnconfirmed ? 'unconfirmed' : ''
      } ${isHighlighted ? 'cpu-played' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="tile-set-header">
        <span className={`set-type-badge ${isUnconfirmed ? 'unconfirmed' : ''}`}>
          {setTypeLabel}
        </span>
        <span>{isHighlighted ? `CPU ${set.tiles.length}枚` : `${set.tiles.length}枚`}</span>
      </div>

      <div className="tile-row set-row">
        {set.tiles.length === 0 ? (
          <span className="empty-set">空のセット</span>
        ) : (
          set.tiles.map((tile, index) => (
            <TileView
              key={tile.id}
              tile={tile}
              disabled={isLocked}
              draggable={!isLocked && canDropHandTile}
              isSelected={selectedTileId === tile.id}
              onClick={() => onSelectTile(set.id, tile.id)}
              onDragStart={(tileId, event) => onDragStartTile(set.id, tileId, event)}
              onDragEnd={onDragEndTile}
              onDragOver={handleTileDragOver}
              onDrop={(event) => handleTileDrop(index, event)}
            />
          ))
        )}
      </div>
      {invalidReason ? <p className="invalid-reason">{invalidReason}</p> : null}
    </section>
  )
}
