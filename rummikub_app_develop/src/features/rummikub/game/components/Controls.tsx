type ControlsProps = {
  canAct: boolean
  canDrawAndEndTurn: boolean
  hasBoardSelection: boolean
  onReturnSelectedToHand: () => void
  onResetDraft: () => void
  onEndTurn: () => void
  onDrawAndEndTurn: () => void
  onNewGame: () => void
}

export function Controls({
  canAct,
  canDrawAndEndTurn,
  hasBoardSelection,
  onReturnSelectedToHand,
  onResetDraft,
  onEndTurn,
  onDrawAndEndTurn,
  onNewGame,
}: ControlsProps) {
  return (
    <section className="controls" aria-label="controls">
      <div className="control-buttons">
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
