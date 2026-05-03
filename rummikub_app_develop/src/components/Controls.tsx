import type { SetType } from '../types'

type ControlsProps = {
  selectedLabel: string
  newSetType: SetType
  canAct: boolean
  canDrawAndEndTurn: boolean
  hasBoardSelection: boolean
  onNewSetTypeChange: (type: SetType) => void
  onCreateSet: () => void
  onReturnSelectedToHand: () => void
  onResetDraft: () => void
  onEndTurn: () => void
  onDrawAndEndTurn: () => void
  onNewGame: () => void
}

export function Controls({
  selectedLabel,
  newSetType,
  canAct,
  canDrawAndEndTurn,
  hasBoardSelection,
  onNewSetTypeChange,
  onCreateSet,
  onReturnSelectedToHand,
  onResetDraft,
  onEndTurn,
  onDrawAndEndTurn,
  onNewGame,
}: ControlsProps) {
  return (
    <section className="controls" aria-label="controls">
      <div className="selection-panel">
        <span>選択中</span>
        <strong>{selectedLabel}</strong>
      </div>

      <label className="type-picker">
        新規セット
        <select
          value={newSetType}
          disabled={!canAct}
          onChange={(event) => onNewSetTypeChange(event.target.value as SetType)}
        >
          <option value="run">run</option>
          <option value="group">group</option>
        </select>
      </label>

      <div className="control-buttons">
        <button type="button" disabled={!canAct} onClick={onCreateSet}>
          新しいセット
        </button>
        <button
          type="button"
          disabled={!canAct || !hasBoardSelection}
          onClick={onReturnSelectedToHand}
        >
          選択を手札へ
        </button>
        <button type="button" disabled={!canAct} onClick={onResetDraft}>
          元に戻す
        </button>
        <button type="button" disabled={!canAct} onClick={onEndTurn}>
          ターン終了
        </button>
        <button
          type="button"
          disabled={!canDrawAndEndTurn}
          title={
            canAct && !canDrawAndEndTurn
              ? '未確定の変更があるため、元に戻すかターン終了で確定してください。'
              : undefined
          }
          onClick={onDrawAndEndTurn}
        >
          1枚引いて終了
        </button>
        <button type="button" onClick={onNewGame}>
          新しいゲーム
        </button>
      </div>
    </section>
  )
}
