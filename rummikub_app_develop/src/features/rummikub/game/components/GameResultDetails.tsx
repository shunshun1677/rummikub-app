import type { GameState } from '../../_shared/types/types'
import { calculateHandPoints } from '../logics/gameLogic'

type GameResultDetailsProps = {
  state: GameState
}

export function GameResultDetails({ state }: GameResultDetailsProps) {
  if (!state.winner) {
    return null
  }

  const playerPoints = calculateHandPoints(state.playerHand)
  const cpuPoints = calculateHandPoints(state.cpuHand)
  const pointDiff = Math.abs(playerPoints - cpuPoints)
  const winnerLabel = state.winner === 'player' ? 'プレイヤー' : 'CPU'
  const reason =
    state.playerHand.length === 0
      ? 'プレイヤーが手牌を出し切りました。'
      : state.cpuHand.length === 0
        ? 'CPUが手牌を出し切りました。'
        : '山札切れのため、残り手牌点で判定しました。'

  return (
    <section className="result-details" aria-label="game result details">
      <div className="zone-title">
        <h2>結果詳細</h2>
        <span>{winnerLabel}の勝ち</span>
      </div>
      <div className="result-grid">
        <div>
          <span className="status-label">勝敗理由</span>
          <strong>{reason}</strong>
        </div>
        <div>
          <span className="status-label">プレイヤー残り点</span>
          <strong>{playerPoints}点</strong>
        </div>
        <div>
          <span className="status-label">CPU残り点</span>
          <strong>{cpuPoints}点</strong>
        </div>
        <div>
          <span className="status-label">点差</span>
          <strong>{pointDiff}点</strong>
        </div>
      </div>
    </section>
  )
}
