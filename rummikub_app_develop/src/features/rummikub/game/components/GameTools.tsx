type HandSortMode = 'color' | 'number'
type DensityMode = 'comfortable' | 'compact'

type GameToolsProps = {
  handSortMode: HandSortMode
  densityMode: DensityMode
  confirmBeforeEndTurn: boolean
  onHandSortModeChange: (mode: HandSortMode) => void
  onDensityModeChange: (mode: DensityMode) => void
  onConfirmBeforeEndTurnChange: (enabled: boolean) => void
}

export function GameTools({
  handSortMode,
  densityMode,
  confirmBeforeEndTurn,
  onHandSortModeChange,
  onDensityModeChange,
  onConfirmBeforeEndTurnChange,
}: GameToolsProps) {
  return (
    <section className="game-tools" aria-label="settings and history">
      <div className="tool-group">
        <span className="tool-label">手牌ソート</span>
        <div className="segmented-control">
          <button
            type="button"
            className={handSortMode === 'color' ? 'active' : ''}
            onClick={() => onHandSortModeChange('color')}
          >
            色順
          </button>
          <button
            type="button"
            className={handSortMode === 'number' ? 'active' : ''}
            onClick={() => onHandSortModeChange('number')}
          >
            数字順
          </button>
        </div>
      </div>

      <div className="tool-group">
        <span className="tool-label">表示密度</span>
        <div className="segmented-control">
          <button
            type="button"
            className={densityMode === 'comfortable' ? 'active' : ''}
            onClick={() => onDensityModeChange('comfortable')}
          >
            標準
          </button>
          <button
            type="button"
            className={densityMode === 'compact' ? 'active' : ''}
            onClick={() => onDensityModeChange('compact')}
          >
            小
          </button>
        </div>
      </div>

      <label className="confirm-toggle">
        <input
          type="checkbox"
          checked={confirmBeforeEndTurn}
          onChange={(event) => onConfirmBeforeEndTurnChange(event.target.checked)}
        />
        ターン終了前に確認
      </label>
    </section>
  )
}

export type { DensityMode, HandSortMode }
