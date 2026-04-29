import type { GameState } from '../types'
import { calculateHandPoints } from '../game/gameLogic'

type StatusBarProps = {
  state: GameState
  message: string
  isCpuThinking: boolean
}

export function StatusBar({ state, message, isCpuThinking }: StatusBarProps) {
  const turnLabel = state.currentTurn === 'player' ? 'プレイヤー' : 'CPU'
  const winnerLabel =
    state.winner === null ? null : state.winner === 'player' ? 'プレイヤーの勝ち' : 'CPUの勝ち'

  return (
    <section className="status-bar" aria-live="polite">
      <div>
        <span className="status-label">ターン</span>
        <strong>{turnLabel}</strong>
      </div>
      <div>
        <span className="status-label">山札</span>
        <strong>{state.deck.length}枚</strong>
      </div>
      <div>
        <span className="status-label">初回場出し</span>
        <strong>{state.hasPlayerOpened ? '完了' : '未完了'}</strong>
      </div>
      <div>
        <span className="status-label">手牌点</span>
        <strong>{calculateHandPoints(state.playerHand)}</strong>
      </div>
      <p className={winnerLabel ? 'winner-message' : 'message'}>
        {winnerLabel ?? (isCpuThinking ? 'CPU思考中...' : message)}
      </p>
    </section>
  )
}
