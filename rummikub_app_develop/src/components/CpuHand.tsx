import { TileView } from './TileView'

type CpuHandProps = {
  tileCount: number
}

export function CpuHand({ tileCount }: CpuHandProps) {
  const visibleBacks = Math.min(tileCount, 18)

  return (
    <section className="cpu-zone" aria-label="cpu hand">
      <div className="zone-title">
        <h2>CPU</h2>
        <span>手牌 {tileCount}枚</span>
      </div>
      <div className="tile-row cpu-row">
        {Array.from({ length: visibleBacks }, (_, index) => (
          <TileView
            key={`cpu-hidden-${index}`}
            tile={{ id: `hidden-${index}`, color: 'joker', number: null }}
            isHidden
            disabled
          />
        ))}
        {tileCount > visibleBacks ? <span className="more-tiles">+{tileCount - visibleBacks}</span> : null}
      </div>
    </section>
  )
}
