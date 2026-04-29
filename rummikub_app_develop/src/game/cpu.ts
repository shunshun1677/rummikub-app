import type { CpuMove, GameState, Tile, TileSet } from '../types'
import {
  calculateSetPoints,
  cloneBoard,
  createSetId,
  isValidSet,
  sortHand,
} from './gameLogic'

type CandidateSet = TileSet & {
  points: number
}

type CandidateChoice = {
  sets: CandidateSet[]
  tileCount: number
  points: number
}

const MAX_CPU_CANDIDATES = 120

export function getCpuMove(state: GameState): CpuMove {
  const candidates = generateCandidateSets(state.cpuHand)
  const choice = chooseBestCandidateChoice(candidates, !state.hasCpuOpened)

  if (choice.tileCount === 0) {
    return {
      kind: 'draw',
      message: 'CPUは出せる手がなく、1枚引きました。',
    }
  }

  const playedTileIds = new Set(
    choice.sets.flatMap((set) => set.tiles.map((tile) => tile.id)),
  )
  const nextHand = sortHand(state.cpuHand.filter((tile) => !playedTileIds.has(tile.id)))
  const nextBoard = [
    ...cloneBoard(state.board),
    ...choice.sets.map((set) => ({
      id: createSetId(),
      type: set.type,
      tiles: [...set.tiles],
    })),
  ]
  const openedMessage = state.hasCpuOpened
    ? `${choice.tileCount}枚を場に出しました。`
    : `初回${choice.points}点で場出ししました。`

  return {
    kind: 'play',
    board: nextBoard,
    hand: nextHand,
    opened: true,
    message: `CPUは${openedMessage}`,
  }
}

function generateCandidateSets(hand: Tile[]): CandidateSet[] {
  const candidates = new Map<string, CandidateSet>()

  for (let size = 3; size <= Math.min(5, hand.length); size += 1) {
    getCombinations(hand, size).forEach((tiles) => {
      ;(['run', 'group'] as const).forEach((type) => {
        const set: TileSet = {
          id: `candidate-${type}-${tiles.map((tile) => tile.id).join('-')}`,
          type,
          tiles,
        }

        if (isValidSet(set)) {
          const key = `${type}:${[...tiles].map((tile) => tile.id).sort().join('|')}`
          candidates.set(key, { ...set, points: calculateSetPoints(set) })
        }
      })
    })
  }

  return [...candidates.values()]
    .sort((a, b) => {
      const tileDiff = b.tiles.length - a.tiles.length
      if (tileDiff !== 0) {
        return tileDiff
      }

      return b.points - a.points
    })
    .slice(0, MAX_CPU_CANDIDATES)
}

function chooseBestCandidateChoice(
  candidates: CandidateSet[],
  mustOpenWithThirtyPoints: boolean,
): CandidateChoice {
  let best: CandidateChoice = { sets: [], tileCount: 0, points: 0 }

  for (let startIndex = 0; startIndex < candidates.length; startIndex += 1) {
    const choice = buildGreedyChoice(candidates, startIndex)
    const canUseChoice = !mustOpenWithThirtyPoints || choice.points >= 30

    if (
      canUseChoice &&
      (choice.tileCount > best.tileCount ||
        (choice.tileCount === best.tileCount && choice.points > best.points))
    ) {
      best = choice
    }
  }

  return best
}

function buildGreedyChoice(candidates: CandidateSet[], startIndex: number): CandidateChoice {
  const selected: CandidateSet[] = []
  const usedTileIds = new Set<string>()
  const orderedCandidates = [
    candidates[startIndex],
    ...candidates.slice(0, startIndex),
    ...candidates.slice(startIndex + 1),
  ]

  orderedCandidates.forEach((candidate) => {
    const overlaps = candidate.tiles.some((tile) => usedTileIds.has(tile.id))

    if (!overlaps) {
      selected.push(candidate)
      candidate.tiles.forEach((tile) => usedTileIds.add(tile.id))
    }
  })

  return {
    sets: selected,
    tileCount: selected.reduce((sum, set) => sum + set.tiles.length, 0),
    points: selected.reduce((sum, set) => sum + set.points, 0),
  }
}

function getCombinations<T>(items: T[], size: number): T[][] {
  const results: T[][] = []

  function collect(startIndex: number, picked: T[]): void {
    if (picked.length === size) {
      results.push(picked)
      return
    }

    const remainingNeeded = size - picked.length
    for (
      let index = startIndex;
      index <= items.length - remainingNeeded;
      index += 1
    ) {
      collect(index + 1, [...picked, items[index]])
    }
  }

  collect(0, [])
  return results
}
