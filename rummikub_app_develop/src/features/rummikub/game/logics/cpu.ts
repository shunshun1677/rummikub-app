import {
  TILE_COLORS,
  type CpuMove,
  type GameState,
  type Tile,
  type TileSet,
} from '../../_shared/types/types'
import {
  calculateSetPoints,
  cloneBoard,
  createSetId,
  isValidSet,
  sortHand,
  sortTilesForSet,
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
  const playedTileIds = new Set(
    choice.sets.flatMap((set) => set.tiles.map((tile) => tile.id)),
  )
  const handAfterNewSets = sortHand(
    state.cpuHand.filter((tile) => !playedTileIds.has(tile.id)),
  )
  const boardAfterNewSets = [
    ...cloneBoard(state.board),
    ...choice.sets.map((set) => ({
      id: createSetId(),
      type: set.type,
      tiles: [...set.tiles],
    })),
  ]
  const canExtendBoard = state.hasCpuOpened || choice.tileCount > 0
  const extension = canExtendBoard
    ? extendBoardWithHandTiles(boardAfterNewSets, handAfterNewSets)
    : { board: boardAfterNewSets, hand: handAfterNewSets, tileCount: 0 }
  const totalPlayedTileCount = choice.tileCount + extension.tileCount

  if (totalPlayedTileCount === 0) {
    return {
      kind: 'draw',
      message: 'CPUは出せる手がなく、1枚引きました。',
    }
  }

  const nextHand = sortHand(extension.hand)
  const nextBoard = extension.board
  const openedMessage = state.hasCpuOpened
    ? `${totalPlayedTileCount}枚を場に出しました。`
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
  const addCandidate = (set: TileSet): void => {
    if (!isValidSet(set)) {
      return
    }

    const key = `${set.type}:${[...set.tiles].map((tile) => tile.id).sort().join('|')}`
    candidates.set(key, { ...set, points: calculateSetPoints(set) })
  }

  for (let size = 3; size <= Math.min(5, hand.length); size += 1) {
    getCombinations(hand, size).forEach((tiles) => {
      ;(['run', 'group'] as const).forEach((type) => {
        addCandidate({
          id: `candidate-${type}-${tiles.map((tile) => tile.id).join('-')}`,
          type,
          tiles,
        })
      })
    })
  }

  generateRunCandidates(hand).forEach(addCandidate)

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

function extendBoardWithHandTiles(
  board: TileSet[],
  hand: Tile[],
): { board: TileSet[]; hand: Tile[]; tileCount: number } {
  let nextBoard = cloneBoard(board)
  let nextHand = sortHand(hand)
  let tileCount = 0

  while (true) {
    const playableMove = findBestBoardExtension(nextBoard, nextHand)

    if (!playableMove) {
      break
    }

    nextBoard = nextBoard.map((set) =>
      set.id === playableMove.setId
        ? sortTilesForSet({ ...set, tiles: [...set.tiles, playableMove.tile] })
        : set,
    )
    nextHand = nextHand.filter((tile) => tile.id !== playableMove.tile.id)
    tileCount += 1
  }

  return {
    board: nextBoard,
    hand: nextHand,
    tileCount,
  }
}

function findBestBoardExtension(
  board: TileSet[],
  hand: Tile[],
): { setId: string; tile: Tile; score: number } | null {
  const candidates = hand.flatMap((tile) =>
    board.flatMap((set) => {
      const nextSet = { ...set, tiles: [...set.tiles, tile] }

      if (!isValidSet(nextSet)) {
        return []
      }

      return [{ setId: set.id, tile, score: getTilePlayScore(tile) }]
    }),
  )

  return (
    candidates.sort((a, b) => {
      const scoreDiff = b.score - a.score
      if (scoreDiff !== 0) {
        return scoreDiff
      }

      return a.tile.id.localeCompare(b.tile.id)
    })[0] ?? null
  )
}

function getTilePlayScore(tile: Tile): number {
  return tile.color === 'joker' ? 30 : (tile.number ?? 0)
}

function generateRunCandidates(hand: Tile[]): TileSet[] {
  const jokers = hand.filter((tile) => tile.color === 'joker')
  const candidates: TileSet[] = []

  TILE_COLORS.forEach((color) => {
    const tilesByNumber = new Map<number, Tile[]>()

    hand
      .filter((tile) => tile.color === color && tile.number !== null)
      .forEach((tile) => {
        const tiles = tilesByNumber.get(tile.number ?? 0) ?? []
        tilesByNumber.set(tile.number ?? 0, [...tiles, tile])
      })

    for (let start = 1; start <= 11; start += 1) {
      for (let length = 6; length <= 13 - start + 1; length += 1) {
        const usedJokers: Tile[] = []
        const tiles: Tile[] = []

        for (let number = start; number < start + length; number += 1) {
          const tile = tilesByNumber.get(number)?.[0]

          if (tile) {
            tiles.push(tile)
            continue
          }

          const joker = jokers[usedJokers.length]

          if (!joker) {
            break
          }

          usedJokers.push(joker)
          tiles.push(joker)
        }

        if (tiles.length === length) {
          candidates.push({
            id: `candidate-run-${tiles.map((tile) => tile.id).join('-')}`,
            type: 'run',
            tiles,
          })
        }
      }
    }
  })

  return candidates
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
