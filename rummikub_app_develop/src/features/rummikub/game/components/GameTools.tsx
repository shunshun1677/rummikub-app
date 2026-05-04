type HandSortMode = 'color' | 'number'

type GameToolsProps = {
  handSortMode: HandSortMode
  confirmBeforeEndTurn: boolean
  onHandSortModeChange: (mode: HandSortMode) => void
  onConfirmBeforeEndTurnChange: (enabled: boolean) => void
}

export function GameTools({
  handSortMode,
  confirmBeforeEndTurn,
  onHandSortModeChange,
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

export type { HandSortMode }
