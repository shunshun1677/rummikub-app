export const TILE_COLORS = ['red', 'blue', 'yellow', 'black'] as const
export const SET_TYPES = ['run', 'group'] as const

export type NormalTileColor = (typeof TILE_COLORS)[number]
export type TileColor = NormalTileColor | 'joker'
export type SetType = (typeof SET_TYPES)[number]
export type Turn = 'player' | 'cpu'
export type Winner = Turn | null

export type Tile = {
  id: string
  color: TileColor
  number: number | null
}

export type TileSet = {
  id: string
  tiles: Tile[]
  type: SetType
}

export type GameState = {
  deck: Tile[]
  board: TileSet[]
  playerHand: Tile[]
  cpuHand: Tile[]
  currentTurn: Turn
  hasPlayerOpened: boolean
  hasCpuOpened: boolean
  winner: Winner
}

export type DraftState = {
  draftBoard: TileSet[]
  draftHand: Tile[]
}

export type CpuMove =
  | {
      kind: 'play'
      board: TileSet[]
      hand: Tile[]
      opened: boolean
      message: string
    }
  | {
      kind: 'draw'
      message: string
    }

export type PlayerTurnValidation =
  | {
      ok: true
      hasOpened: boolean
      message: string
    }
  | {
      ok: false
      message: string
    }
