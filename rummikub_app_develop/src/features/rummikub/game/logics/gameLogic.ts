import {
  TILE_COLORS,
  type DraftState,
  type GameState,
  type NormalTileColor,
  type PlayerTurnValidation,
  type Tile,
  type TileSet,
} from '../../_shared/types/types'

const HAND_SIZE = 14
const JOKER_HAND_POINTS = 30

export function createTilePool(): Tile[] {
  const tiles: Tile[] = []

  TILE_COLORS.forEach((color) => {
    for (let number = 1; number <= 13; number += 1) {
      tiles.push({ id: `${color}-${number}-a`, color, number })
      tiles.push({ id: `${color}-${number}-b`, color, number })
    }
  })

  tiles.push({ id: 'joker-1', color: 'joker', number: null })
  tiles.push({ id: 'joker-2', color: 'joker', number: null })

  return tiles
}

export function shuffleTiles(tiles: Tile[]): Tile[] {
  const shuffled = [...tiles]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const current = shuffled[index]
    const swap = shuffled[swapIndex]
    shuffled[index] = swap
    shuffled[swapIndex] = current
  }

  return shuffled
}

export function createInitialGameState(): GameState {
  const shuffled = shuffleTiles(createTilePool())

  return {
    playerHand: sortHand(shuffled.slice(0, HAND_SIZE)),
    cpuHand: sortHand(shuffled.slice(HAND_SIZE, HAND_SIZE * 2)),
    deck: shuffled.slice(HAND_SIZE * 2),
    board: [],
    currentTurn: 'player',
    hasPlayerOpened: false,
    hasCpuOpened: false,
    winner: null,
  }
}

export function createDraftFromState(state: GameState): DraftState {
  return {
    draftBoard: cloneBoard(state.board),
    draftHand: [...state.playerHand],
  }
}

export function cloneBoard(board: TileSet[]): TileSet[] {
  return board.map((set) => ({ ...set, tiles: [...set.tiles] }))
}

export function sortHand(hand: Tile[]): Tile[] {
  const colorRank: Record<Tile['color'], number> = {
    red: 0,
    blue: 1,
    yellow: 2,
    black: 3,
    joker: 4,
  }

  return [...hand].sort((a, b) => {
    const colorDiff = colorRank[a.color] - colorRank[b.color]
    if (colorDiff !== 0) {
      return colorDiff
    }

    return (a.number ?? 99) - (b.number ?? 99)
  })
}

export function sortHandByNumber(hand: Tile[]): Tile[] {
  const colorRank: Record<Tile['color'], number> = {
    red: 0,
    blue: 1,
    yellow: 2,
    black: 3,
    joker: 4,
  }

  return [...hand].sort((a, b) => {
    const numberDiff = (a.number ?? 99) - (b.number ?? 99)
    if (numberDiff !== 0) {
      return numberDiff
    }

    return colorRank[a.color] - colorRank[b.color]
  })
}

export function isValidSet(set: TileSet): boolean {
  if (set.tiles.length === 0) {
    return false
  }

  return set.type === 'run' ? isValidRun(set.tiles) : isValidGroup(set.tiles)
}

export function inferSetType(tiles: Tile[]): TileSet['type'] | null {
  if (isValidRun(tiles)) {
    return 'run'
  }

  if (isValidGroup(tiles)) {
    return 'group'
  }

  return null
}

export function getInvalidSetReason(tiles: Tile[]): string | null {
  if (inferSetType(tiles)) {
    return null
  }

  if (tiles.length === 0) {
    return null
  }

  if (tiles.length < 3) {
    return '3枚以上必要です。'
  }

  if (tiles.length > 13) {
    return 'runは13枚までです。'
  }

  const normalTiles = tiles.filter(isNormalTile)
  const normalNumbers = normalTiles.map((tile) => tile.number)
  const uniqueNumbers = new Set(normalNumbers)
  const normalColors = normalTiles.map((tile) => tile.color)
  const uniqueColors = new Set(normalColors)

  if (uniqueNumbers.size === 1 && normalColors.length !== uniqueColors.size) {
    return 'groupは同じ数字で色違いにしてください。'
  }

  if (uniqueNumbers.size === 1 && tiles.length > 4) {
    return 'groupは4枚までです。'
  }

  if (uniqueColors.size === 1 && normalNumbers.length !== uniqueNumbers.size) {
    return 'runは同じ数字を重複できません。'
  }

  if (uniqueColors.size === 1) {
    return 'runは同じ色の連番にしてください。'
  }

  return 'runまたはgroupとして成立していません。'
}

export function sortTilesForSet(set: TileSet): TileSet {
  if (set.type === 'run' && isValidRun(set.tiles)) {
    return { ...set, tiles: sortRunTiles(set.tiles) }
  }

  if (set.type === 'group' && isValidGroup(set.tiles)) {
    return { ...set, tiles: sortGroupTiles(set.tiles) }
  }

  return set
}

export function validateBoard(board: TileSet[]): boolean {
  const tileIds = board.flatMap((set) => set.tiles.map((tile) => tile.id))
  const uniqueIds = new Set(tileIds)

  if (tileIds.length !== uniqueIds.size) {
    return false
  }

  return board.every(isValidSet)
}

export function calculateSetPoints(set: TileSet): number {
  if (set.type === 'run') {
    const values = getBestRunValues(set.tiles)
    return values.reduce((sum, value) => sum + value, 0)
  }

  const number = set.tiles.find((tile) => tile.number !== null)?.number ?? 0
  return number * set.tiles.length
}

export function calculateHandPoints(hand: Tile[]): number {
  return hand.reduce((sum, tile) => {
    if (tile.color === 'joker') {
      return sum + JOKER_HAND_POINTS
    }

    return sum + (tile.number ?? 0)
  }, 0)
}

export function drawTile(deck: Tile[]): { tile: Tile | null; newDeck: Tile[] } {
  if (deck.length === 0) {
    return { tile: null, newDeck: [] }
  }

  const [tile, ...newDeck] = deck
  return { tile, newDeck }
}

export function determineWinnerByHandPoints(
  playerHand: Tile[],
  cpuHand: Tile[],
): 'player' | 'cpu' {
  const playerPoints = calculateHandPoints(playerHand)
  const cpuPoints = calculateHandPoints(cpuHand)

  return playerPoints <= cpuPoints ? 'player' : 'cpu'
}

export function validatePlayerTurn(
  draft: DraftState,
  turnStartBoard: TileSet[],
  turnStartHand: Tile[],
  hasPlayerOpened: boolean,
): PlayerTurnValidation {
  if (!validateBoard(draft.draftBoard)) {
    return {
      ok: false,
      message: '場に不正なセットがあります。すべて3枚以上の有効なrun/groupにしてください。',
    }
  }

  if (!hasSameTileInventory(draft, turnStartBoard, turnStartHand)) {
    return {
      ok: false,
      message: 'タイルの移動状態が不正です。元に戻してから操作し直してください。',
    }
  }

  if (hasPlayerOpened) {
    if (!allOriginalBoardTilesRemainOnBoard(draft.draftBoard, turnStartBoard)) {
      return {
        ok: false,
        message: '場にあったタイルは手札へ持ち帰れません。場の有効セットに戻してください。',
      }
    }

    return { ok: true, hasOpened: true, message: 'ターンを終了しました。' }
  }

  if (!originalBoardIsUnchanged(draft.draftBoard, turnStartBoard)) {
    return {
      ok: false,
      message: '初回30点を出す前は、既存の場を組み換えできません。',
    }
  }

  const originalSetIds = new Set(turnStartBoard.map((set) => set.id))
  const newlyPlayedSets = draft.draftBoard.filter((set) => !originalSetIds.has(set.id))
  const openingPoints = newlyPlayedSets.reduce(
    (sum, set) => sum + calculateSetPoints(set),
    0,
  )

  if (newlyPlayedSets.length === 0 || openingPoints < 30) {
    return {
      ok: false,
      message: `初回場出しは自分の手牌だけで30点以上必要です。現在は${openingPoints}点です。`,
    }
  }

  return {
    ok: true,
    hasOpened: true,
    message: `初回${openingPoints}点で場出ししました。`,
  }
}

export function createSetId(): string {
  return `set-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function isValidRun(tiles: Tile[]): boolean {
  if (tiles.length < 3 || tiles.length > 13) {
    return false
  }

  const normalTiles = tiles.filter(isNormalTile)
  const colors = new Set(normalTiles.map((tile) => tile.color))
  const numbers = normalTiles.map((tile) => tile.number)
  const uniqueNumbers = new Set(numbers)

  if (colors.size > 1 || numbers.length !== uniqueNumbers.size) {
    return false
  }

  if (normalTiles.length === 0) {
    return true
  }

  return getPossibleRunStarts(tiles).length > 0
}

function isValidGroup(tiles: Tile[]): boolean {
  if (tiles.length < 3 || tiles.length > 4) {
    return false
  }

  const normalTiles = tiles.filter(isNormalTile)
  const numbers = new Set(normalTiles.map((tile) => tile.number))
  const colors = normalTiles.map((tile) => tile.color)
  const uniqueColors = new Set(colors)

  return numbers.size <= 1 && colors.length === uniqueColors.size
}

function getBestRunValues(tiles: Tile[]): number[] {
  const starts = getPossibleRunStarts(tiles)
  const start = starts.at(-1)

  if (start === undefined) {
    return tiles.map((tile) => tile.number ?? 0)
  }

  return Array.from({ length: tiles.length }, (_, index) => start + index)
}

function sortRunTiles(tiles: Tile[]): Tile[] {
  const starts = getPossibleRunStarts(tiles)
  const start = starts.at(-1)

  if (start === undefined) {
    return tiles
  }

  const usedTileIds = new Set<string>()

  return Array.from({ length: tiles.length }, (_, index) => {
    const number = start + index
    const normalTile = tiles.find(
      (tile) => !usedTileIds.has(tile.id) && tile.number === number,
    )

    if (normalTile) {
      usedTileIds.add(normalTile.id)
      return normalTile
    }

    const joker = tiles.find(
      (tile) => !usedTileIds.has(tile.id) && tile.color === 'joker',
    )

    if (!joker) {
      return tiles[index]
    }

    usedTileIds.add(joker.id)
    return joker
  })
}

function sortGroupTiles(tiles: Tile[]): Tile[] {
  const colorRank: Record<Tile['color'], number> = {
    red: 0,
    blue: 1,
    yellow: 2,
    black: 3,
    joker: 4,
  }

  return [...tiles].sort((a, b) => colorRank[a.color] - colorRank[b.color])
}

function getPossibleRunStarts(tiles: Tile[]): number[] {
  const normalNumbers = tiles
    .filter(isNormalTile)
    .map((tile) => tile.number)

  if (normalNumbers.length !== new Set(normalNumbers).size) {
    return []
  }

  const latestStart = 14 - tiles.length
  const starts: number[] = []

  for (let start = 1; start <= latestStart; start += 1) {
    const end = start + tiles.length - 1
    const containsAllNumbers = normalNumbers.every(
      (number) => number >= start && number <= end,
    )

    if (containsAllNumbers) {
      starts.push(start)
    }
  }

  return starts
}

function isNormalTile(tile: Tile): tile is Tile & {
  color: NormalTileColor
  number: number
} {
  return tile.color !== 'joker' && tile.number !== null
}

function hasSameTileInventory(
  draft: DraftState,
  turnStartBoard: TileSet[],
  turnStartHand: Tile[],
): boolean {
  const startIds = [...getBoardTileIds(turnStartBoard), ...turnStartHand.map((tile) => tile.id)]
  const draftIds = [
    ...getBoardTileIds(draft.draftBoard),
    ...draft.draftHand.map((tile) => tile.id),
  ]

  return sortedIds(startIds).join('|') === sortedIds(draftIds).join('|')
}

function allOriginalBoardTilesRemainOnBoard(
  draftBoard: TileSet[],
  turnStartBoard: TileSet[],
): boolean {
  const draftBoardIds = new Set(getBoardTileIds(draftBoard))
  return getBoardTileIds(turnStartBoard).every((tileId) => draftBoardIds.has(tileId))
}

function originalBoardIsUnchanged(
  draftBoard: TileSet[],
  turnStartBoard: TileSet[],
): boolean {
  const draftById = new Map(draftBoard.map((set) => [set.id, set]))

  return turnStartBoard.every((originalSet) => {
    const draftSet = draftById.get(originalSet.id)

    if (!draftSet || draftSet.type !== originalSet.type) {
      return false
    }

    return sameTileIds(originalSet.tiles, draftSet.tiles)
  })
}

function sameTileIds(left: Tile[], right: Tile[]): boolean {
  return (
    left.length === right.length &&
    sortedIds(left.map((tile) => tile.id)).join('|') ===
      sortedIds(right.map((tile) => tile.id)).join('|')
  )
}

function getBoardTileIds(board: TileSet[]): string[] {
  return board.flatMap((set) => set.tiles.map((tile) => tile.id))
}

function sortedIds(ids: string[]): string[] {
  return [...ids].sort((a, b) => a.localeCompare(b))
}
