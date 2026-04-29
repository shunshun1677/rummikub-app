import type { SetType, TileSet } from '../types'
import { TileView } from './TileView'

type TileSetViewProps = {
  set: TileSet
  isLocked: boolean
  canAddSelected: boolean
  selectedTileId: string | null
  onAddSelected: (setId: string) => void
  onSelectTile: (setId: string, tileId: string) => void
  onChangeType: (setId: string, type: SetType) => void
  onRemoveEmptySet: (setId: string) => void
}

export function TileSetView({
  set,
  isLocked,
  canAddSelected,
  selectedTileId,
  onAddSelected,
  onSelectTile,
  onChangeType,
  onRemoveEmptySet,
}: TileSetViewProps) {
  return (
    <section className={`tile-set ${isLocked ? 'locked' : ''}`}>
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
