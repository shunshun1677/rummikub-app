import { useState, type DragEvent } from 'react'
import type { SetType, TileSet } from '../types'
import { TileView } from './TileView'

type TileSetViewProps = {
  set: TileSet
  isLocked: boolean
  canAddSelected: boolean
  selectedTileId: string | null
  canDropHandTile: boolean
  onAddSelected: (setId: string) => void
  onSelectTile: (setId: string, tileId: string) => void
  onDropHandTile: (setId: string, tileId: string) => void
  onChangeType: (setId: string, type: SetType) => void
  onRemoveEmptySet: (setId: string) => void
}

export function TileSetView({
  set,
  isLocked,
  canAddSelected,
  selectedTileId,
  canDropHandTile,
  onAddSelected,
  onSelectTile,
  onDropHandTile,
  onChangeType,
  onRemoveEmptySet,
}: TileSetViewProps) {
  const [isDragOver, setIsDragOver] = useState(false)

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
      className={`tile-set ${isLocked ? 'locked' : ''} ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="tile-set-header">
        <select
          value={set.type}
          disabled={isLocked}
          aria-label="set type"
          onChange={(event) => onChangeType(set.id, event.target.value as SetType)}
        >
          <option value="run">run</option>
          <option value="group">group</option>
        </select>
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

      <div className="tile-set-actions">
        <button
          type="button"
          disabled={isLocked || !canAddSelected}
          onClick={() => onAddSelected(set.id)}
        >
          選択タイルを追加
        </button>
        <button
          type="button"
          disabled={isLocked || set.tiles.length > 0}
          onClick={() => onRemoveEmptySet(set.id)}
        >
          空セット削除
        </button>
      </div>
    </section>
  )
}
