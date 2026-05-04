import { TileView } from './TileView'
import type { Tile } from '../../_shared/types/types'

type CpuHandProps = {
  hand: Tile[]
  revealTiles: boolean
}

export function CpuHand({ hand, revealTiles }: CpuHandProps) {
  const tileCount = hand.length
  const visibleBacks = Math.min(tileCount, 18)

  return (
    <section className="cpu-zone" aria-label="cpu hand">
      <div className="zone-title">
        <h2>CPU</h2>
        <span>{revealTiles ? '手札公開' : `手牌 ${tileCount}枚`}</span>
      </div>
      <div className="tile-row cpu-row">
        {revealTiles
          ? hand.map((tile) => <TileView key={tile.id} tile={tile} disabled />)
          : Array.from({ length: visibleBacks }, (_, index) => (
              <TileView
                key={`cpu-hidden-${index}`}
                tile={{ id: `hidden-${index}`, color: 'joker', number: null }}
                isHidden
                disabled
              />
            ))}
        {!revealTiles && tileCount > visibleBacks ? (
          <span className="more-tiles">+{tileCount - visibleBacks}</span>
        ) : null}
      </div>
    </section>
  )
}
