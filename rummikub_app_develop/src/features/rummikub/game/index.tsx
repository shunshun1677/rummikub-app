import { useEffect, useMemo, useState, type DragEvent } from 'react'
import './styles/game.css'
import { Controls } from './components/Controls'
import { CpuHand } from './components/CpuHand'
import { GameResultDetails } from './components/GameResultDetails'
import { GameBoard } from './components/GameBoard'
import {
  GameTools,
  type HandSortMode,
} from './components/GameTools'
import { PlayerHand } from './components/PlayerHand'
import { StatusBar } from './components/StatusBar'
import { getCpuMove } from './logics/cpu'
import {
  cloneBoard,
  createDraftFromState,
  createInitialGameState,
  createSetId,
  determineWinnerByHandPoints,
  drawTile,
  inferSetType,
  sortHand,
  sortHandByNumber,
  sortTilesForSet,
  validatePlayerTurn,
} from './logics/gameLogic'
import type {
  DraftState,
  GameState,
  Tile,
  TileSet,
} from '../_shared/types/types'

type TileSelection =
  | {
      source: 'hand'
      tileId: string
    }
  | {
      source: 'board'
      setId: string
      tileId: string
    }

type TurnSnapshot = {
  board: TileSet[]
  hand: Tile[]
}

type TurnChangeStatus = {
  hasBoardChanges: boolean
  hasHandChanges: boolean
  hasAnyChanges: boolean
}

type DraftSnapshot = DraftState

const initialState = createInitialGameState()
const TILE_DRAG_MIME_TYPE = 'application/x-rummikub-tile-id'

export function RummikubGame() {
  const [gameState, setGameState] = useState<GameState>(initialState)
  const [draft, setDraft] = useState<DraftState>(() => createDraftFromState(initialState))
  const [draftHistory, setDraftHistory] = useState<DraftSnapshot[]>([])
  const [turnSnapshot, setTurnSnapshot] = useState<TurnSnapshot>(() => ({
    board: cloneBoard(initialState.board),
    hand: [...initialState.playerHand],
  }))
  const [selection, setSelection] = useState<TileSelection | null>(null)
  const [selectedHandTileIds, setSelectedHandTileIds] = useState<Set<string>>(() => new Set())
  const [lastDrawnTileId, setLastDrawnTileId] = useState<string | null>(null)
  const [handSortMode, setHandSortMode] = useState<HandSortMode>('color')
  const [confirmBeforeEndTurn, setConfirmBeforeEndTurn] = useState(true)
  const [message, setMessage] = useState('牌をドラッグして場に置いてください。')

  const isCpuThinking = gameState.currentTurn === 'cpu' && !gameState.winner
  const canPlayerAct = gameState.currentTurn === 'player' && !gameState.winner && !isCpuThinking
  const originalSetIds = useMemo(
    () => new Set(turnSnapshot.board.map((set) => set.id)),
    [turnSnapshot.board],
  )
  const lockedSetIds = useMemo(() => {
    if (gameState.hasPlayerOpened) {
      return new Set<string>()
    }

    return originalSetIds
  }, [gameState.hasPlayerOpened, originalSetIds])
  const selectedBoardTileId = selection?.source === 'board' ? selection.tileId : null
  const hasBoardSelection = selection?.source === 'board'
  const turnChangeStatus = useMemo(
    () => getTurnChangeStatus(draft, turnSnapshot),
    [draft, turnSnapshot],
  )
  const canDrawAndEndTurn = canPlayerAct && !turnChangeStatus.hasAnyChanges
  const canEndTurn = canPlayerAct && turnChangeStatus.hasAnyChanges
  const sortedDraftHand = useMemo(
    () => sortPlayerHand(draft.draftHand, handSortMode),
    [draft.draftHand, handSortMode],
  )

  useEffect(() => {
    if (gameState.currentTurn !== 'cpu' || gameState.winner) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      if (gameState.currentTurn !== 'cpu' || gameState.winner) {
        return
      }

      const move = getCpuMove(gameState)
      let nextMessage = move.message
      let nextState: GameState

      if (move.kind === 'play') {
        const winner = move.hand.length === 0 ? 'cpu' : null
        nextState = {
          ...gameState,
          board: move.board,
          cpuHand: move.hand,
          hasCpuOpened: move.opened,
          currentTurn: winner ? 'cpu' : 'player',
          winner,
        }
      } else {
        const { tile, newDeck } = drawTile(gameState.deck)
        const nextCpuHand = tile ? sortHand([...gameState.cpuHand, tile]) : gameState.cpuHand
        const winner =
          tile === null || newDeck.length === 0
            ? determineWinnerByHandPoints(gameState.playerHand, nextCpuHand)
            : null

        nextMessage =
          tile === null
            ? '山札が尽きたため手牌点で勝敗を判定しました。'
            : move.message
        nextState = {
          ...gameState,
          deck: newDeck,
          cpuHand: nextCpuHand,
          currentTurn: winner ? 'cpu' : 'player',
          winner,
        }
      }

      setGameState(nextState)

      if (nextState.currentTurn === 'player') {
        setDraft(createDraftFromState(nextState))
        setDraftHistory([])
        setTurnSnapshot({
          board: cloneBoard(nextState.board),
          hand: [...nextState.playerHand],
        })
        setSelection(null)
        setSelectedHandTileIds(new Set())
      }

      setMessage(nextMessage)
    }, 700)

    return () => window.clearTimeout(timeoutId)
  }, [gameState])

  function handleSelectHandTile(tileId: string): void {
    if (!canPlayerAct) {
      return
    }

    setSelection(null)
    setSelectedHandTileIds((current) => {
      const next = new Set(current)

      if (next.has(tileId)) {
        next.delete(tileId)
      } else {
        next.add(tileId)
      }

      return next
    })
  }

  function handleDragStartHandTile(
    tileId: string,
    event: DragEvent<HTMLButtonElement>,
  ): void {
    if (!canPlayerAct) {
      return
    }

    const draggedTileIds = selectedHandTileIds.has(tileId)
      ? [...selectedHandTileIds]
      : [tileId]

    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData(TILE_DRAG_MIME_TYPE, draggedTileIds.join('|'))
    setSelectedHandTileIds(new Set(draggedTileIds))
    setSelection(null)
  }

  function handleDragEndHandTile(): void {
    return
  }

  function handleDragStartBoardTile(
    setId: string,
    tileId: string,
    event: DragEvent<HTMLButtonElement>,
  ): void {
    if (!canPlayerAct || lockedSetIds.has(setId)) {
      return
    }

    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData(TILE_DRAG_MIME_TYPE, tileId)
    setSelectedHandTileIds(new Set())
    setSelection({ source: 'board', setId, tileId })
  }

  function handleDragEndBoardTile(): void {
    setSelection((current) => (current?.source === 'board' ? null : current))
  }

  function handleSelectBoardTile(setId: string, tileId: string): void {
    if (!canPlayerAct || lockedSetIds.has(setId)) {
      setMessage('初回30点を出す前は、既存の場のタイルを選択できません。')
      return
    }

    setSelectedHandTileIds(new Set())
    setSelection((current) =>
      current?.source === 'board' && current.tileId === tileId
        ? null
        : { source: 'board', setId, tileId },
    )
  }

  function handleDropTileToSet(
    setId: string,
    draggedTileIds: string,
    tileIndex?: number,
  ): void {
    if (!canPlayerAct) {
      return
    }

    if (lockedSetIds.has(setId)) {
      setMessage('初回30点を出す前は、既存の場へ追加できません。')
      return
    }

    const tileIds = parseDraggedTileIds(draggedTileIds)
    if (tileIds.length === 0) {
      return
    }

    const hasLockedSource = tileIds.some((tileId) => {
      const sourceSetId = getSetIdContainingTile(draft.draftBoard, tileId)
      return sourceSetId ? lockedSetIds.has(sourceSetId) : false
    })

    if (hasLockedSource) {
      setMessage('初回30点を出す前は、既存の場のタイルを移動できません。')
      return
    }

    updateDraftWithHistory((currentDraft) =>
      moveTilesToSet(currentDraft, tileIds, setId, tileIndex),
    )
    setSelection(null)
    setSelectedHandTileIds(new Set())
  }

  function handleDropTileToNewSet(draggedTileIds: string): void {
    if (!canPlayerAct) {
      return
    }

    const tileIds = parseDraggedTileIds(draggedTileIds)
    if (tileIds.length === 0) {
      return
    }

    const hasLockedSource = tileIds.some((tileId) => {
      const sourceSetId = getSetIdContainingTile(draft.draftBoard, tileId)
      return sourceSetId ? lockedSetIds.has(sourceSetId) : false
    })

    if (hasLockedSource) {
      setMessage('初回30点を出す前は、既存の場のタイルを移動できません。')
      return
    }

    updateDraftWithHistory((currentDraft) => moveTilesToNewSet(currentDraft, tileIds))
    setSelection(null)
    setSelectedHandTileIds(new Set())
  }

  function handleReturnSelectedToHand(): void {
    if (!canPlayerAct || selection?.source !== 'board') {
      return
    }

    if (lockedSetIds.has(selection.setId)) {
      setMessage('初回30点を出す前は、既存の場のタイルを手札へ戻せません。')
      return
    }

    updateDraftWithHistory((currentDraft) => {
      const result = takeSelectedTile(currentDraft, selection)

      if (!result) {
        return currentDraft
      }

      return {
        draftBoard: removeEmptySets(result.draftBoard),
        draftHand: sortPlayerHand([...result.draftHand, result.tile], handSortMode),
      }
    })
    setSelection(null)
    setSelectedHandTileIds(new Set())
  }

  function handleUndoDraft(): void {
    if (!canPlayerAct || draftHistory.length === 0) {
      return
    }

    const previousDraft = draftHistory.at(-1)

    if (!previousDraft) {
      return
    }

    setDraft(cloneDraft(previousDraft))
    setDraftHistory((current) => current.slice(0, -1))
    setSelection(null)
    setSelectedHandTileIds(new Set())
    setMessage('直前の操作を戻しました。')
  }

  function handleResetDraft(): void {
    if (!canPlayerAct) {
      return
    }

    setDraft({
      draftBoard: cloneBoard(turnSnapshot.board),
      draftHand: [...turnSnapshot.hand],
    })
    setDraftHistory([])
    setSelection(null)
    setSelectedHandTileIds(new Set())
    setMessage('このターン開始時点へ戻しました。')
  }

  function handleEndTurn(): void {
    if (!canPlayerAct) {
      return
    }

    if (!turnChangeStatus.hasAnyChanges) {
      setMessage('牌を場に出した場合だけターン終了できます。出せない場合は1枚引いて終了してください。')
      return
    }

    const validation = validatePlayerTurn(
      draft,
      turnSnapshot.board,
      turnSnapshot.hand,
      gameState.hasPlayerOpened,
    )

    if (!validation.ok) {
      setMessage(validation.message)
      window.alert(validation.message)
      return
    }

    if (
      confirmBeforeEndTurn &&
      turnChangeStatus.hasAnyChanges &&
      !window.confirm('このターンの変更を確定してターン終了します。よろしいですか？')
    ) {
      return
    }

    const nextPlayerHand = sortPlayerHand(draft.draftHand, handSortMode)
    const winner = nextPlayerHand.length === 0 ? 'player' : null

    setGameState((current) => ({
      ...current,
      board: cloneBoard(draft.draftBoard),
      playerHand: nextPlayerHand,
      hasPlayerOpened: validation.hasOpened,
      currentTurn: winner ? 'player' : 'cpu',
      winner,
    }))
    setDraftHistory([])
    setSelection(null)
    setSelectedHandTileIds(new Set())
    setLastDrawnTileId(null)
    setMessage(validation.message)
    window.alert(validation.message)
  }

  function handleDrawAndEndTurn(): void {
    if (!canPlayerAct) {
      return
    }

    if (turnChangeStatus.hasAnyChanges) {
      setMessage('場や手牌に未確定の変更があります。元に戻すか、ターン終了で確定してください。')
      return
    }

    const { tile, newDeck } = drawTile(gameState.deck)
    const nextPlayerHand = tile
      ? sortPlayerHand([...gameState.playerHand, tile], handSortMode)
      : gameState.playerHand
    const winner =
      tile === null || newDeck.length === 0
        ? determineWinnerByHandPoints(nextPlayerHand, gameState.cpuHand)
        : null
    const nextState: GameState = {
      ...gameState,
      deck: newDeck,
      board: cloneBoard(gameState.board),
      playerHand: nextPlayerHand,
      currentTurn: winner ? 'player' : 'cpu',
      winner,
    }

    setGameState(nextState)
    setDraft(createDraftFromState(nextState))
    setDraftHistory([])
    setTurnSnapshot({
      board: cloneBoard(nextState.board),
      hand: [...nextState.playerHand],
    })
    setSelection(null)
    setSelectedHandTileIds(new Set())
    setLastDrawnTileId(tile?.id ?? null)
    setMessage(
      tile === null
        ? '山札が尽きたため手牌点で勝敗を判定しました。'
        : '1枚引いてターンを終了しました。',
    )
  }

  function handleNewGame(): void {
    const nextState = createInitialGameState()

    setGameState(nextState)
    setDraft(createDraftFromState(nextState))
    setDraftHistory([])
    setTurnSnapshot({
      board: cloneBoard(nextState.board),
      hand: [...nextState.playerHand],
    })
    setSelection(null)
    setSelectedHandTileIds(new Set())
    setLastDrawnTileId(null)
    setMessage('新しいゲームを開始しました。')
  }

  function handleHandSortModeChange(mode: HandSortMode): void {
    setHandSortMode(mode)
    setDraft((current) => ({
      ...current,
      draftHand: sortPlayerHand(current.draftHand, mode),
    }))
    setTurnSnapshot((current) => ({
      ...current,
      hand: sortPlayerHand(current.hand, mode),
    }))
  }

  function updateDraftWithHistory(updater: (currentDraft: DraftState) => DraftState): void {
    const nextDraft = updater(draft)

    if (getDraftSignature(nextDraft) === getDraftSignature(draft)) {
      return
    }

    setDraftHistory((current) => [...current, cloneDraft(draft)])
    setDraft(nextDraft)
  }

  return (
    <main className="app-shell density-compact">
      <header className="app-header">
        <div>
          <p className="eyebrow">Rummikub style duel</p>
          <h1>ラミーキューブ</h1>
        </div>
      </header>

      <StatusBar state={gameState} message={message} isCpuThinking={isCpuThinking} />
      <GameResultDetails state={gameState} />
      <CpuHand hand={gameState.cpuHand} revealTiles={gameState.winner !== null} />
      <GameTools
        handSortMode={handSortMode}
        confirmBeforeEndTurn={confirmBeforeEndTurn}
        onHandSortModeChange={handleHandSortModeChange}
        onConfirmBeforeEndTurnChange={setConfirmBeforeEndTurn}
      />
      <GameBoard
        board={draft.draftBoard}
        lockedSetIds={lockedSetIds}
        canDropHandTile={canPlayerAct}
        selectedTileId={selectedBoardTileId}
        onDragStartTile={handleDragStartBoardTile}
        onDragEndTile={handleDragEndBoardTile}
        onSelectTile={handleSelectBoardTile}
        onDropTile={handleDropTileToSet}
        onDropTileToNewSet={handleDropTileToNewSet}
      />
      <Controls
        canAct={canPlayerAct}
        canEndTurn={canEndTurn}
        canDrawAndEndTurn={canDrawAndEndTurn}
        canUndo={draftHistory.length > 0}
        hasBoardSelection={hasBoardSelection}
        onUndo={handleUndoDraft}
        onReturnSelectedToHand={handleReturnSelectedToHand}
        onResetDraft={handleResetDraft}
        onEndTurn={handleEndTurn}
        onDrawAndEndTurn={handleDrawAndEndTurn}
        onNewGame={handleNewGame}
      />
      <PlayerHand
        hand={sortedDraftHand}
        selectedTileIds={selectedHandTileIds}
        recentlyDrawnTileId={lastDrawnTileId}
        disabled={!canPlayerAct}
        onSelectTile={handleSelectHandTile}
        onDragStartTile={handleDragStartHandTile}
        onDragEndTile={handleDragEndHandTile}
      />
    </main>
  )
}

function takeSelectedTile(
  draft: DraftState,
  selection: TileSelection,
): (DraftState & { tile: Tile }) | null {
  if (selection.source === 'hand') {
    const tile = draft.draftHand.find((handTile) => handTile.id === selection.tileId)

    if (!tile) {
      return null
    }

    return {
      tile,
      draftHand: draft.draftHand.filter((handTile) => handTile.id !== selection.tileId),
      draftBoard: cloneBoard(draft.draftBoard),
    }
  }

  let movedTile: Tile | null = null
  const draftBoard = draft.draftBoard.map((set) => {
    if (set.id !== selection.setId) {
      return { ...set, tiles: [...set.tiles] }
    }

    movedTile = set.tiles.find((tile) => tile.id === selection.tileId) ?? null
    return getSetWithInferredType({
      ...set,
      tiles: set.tiles.filter((tile) => tile.id !== selection.tileId),
    })
  })

  if (!movedTile) {
    return null
  }

  return {
    tile: movedTile,
    draftHand: [...draft.draftHand],
    draftBoard,
  }
}

function removeEmptySets(board: TileSet[]): TileSet[] {
  return board.filter((set) => set.tiles.length > 0)
}

function cloneDraft(draft: DraftState): DraftState {
  return {
    draftBoard: cloneBoard(draft.draftBoard),
    draftHand: [...draft.draftHand],
  }
}

function sortPlayerHand(hand: Tile[], mode: HandSortMode): Tile[] {
  return mode === 'number' ? sortHandByNumber(hand) : sortHand(hand)
}

function getSetIdContainingTile(board: TileSet[], tileId: string): string | null {
  return board.find((set) => set.tiles.some((tile) => tile.id === tileId))?.id ?? null
}

function parseDraggedTileIds(value: string): string[] {
  return value.split('|').filter(Boolean)
}

function moveTilesToSet(
  draft: DraftState,
  tileIds: string[],
  targetSetId: string,
  targetTileIndex?: number,
): DraftState {
  return tileIds.reduce<DraftState>((currentDraft, tileId, index) => {
    const insertionIndex = targetTileIndex === undefined ? undefined : targetTileIndex + index
    return moveSingleTileToSet(currentDraft, tileId, targetSetId, insertionIndex)
  }, draft)
}

function moveSingleTileToSet(
  draft: DraftState,
  tileId: string,
  targetSetId: string,
  targetTileIndex?: number,
): DraftState {
  const result = takeTileById(draft, tileId)

  if (!result) {
    return draft
  }

  const adjustedIndex =
    result.source?.setId === targetSetId &&
    targetTileIndex !== undefined &&
    result.source.tileIndex < targetTileIndex
      ? targetTileIndex - 1
      : targetTileIndex
  let didInsert = false
  const draftBoard = result.draftBoard.map((set) => {
    if (set.id !== targetSetId) {
      return set
    }

    didInsert = true
    return getSetWithInferredType({
      ...set,
      tiles: insertTileAt(set.tiles, result.tile, adjustedIndex),
    })
  })

  if (!didInsert) {
    return draft
  }

  return {
    draftHand: result.draftHand,
    draftBoard: removeEmptySets(draftBoard),
  }
}

function moveTilesToNewSet(draft: DraftState, tileIds: string[]): DraftState {
  const result = takeTilesByIds(draft, tileIds)

  if (!result) {
    return draft
  }

  return {
    draftHand: result.draftHand,
    draftBoard: [
      ...removeEmptySets(result.draftBoard),
      getSetWithInferredType({ id: createSetId(), type: 'run', tiles: result.tiles }),
    ],
  }
}

function takeTilesByIds(
  draft: DraftState,
  tileIds: string[],
): (DraftState & { tiles: Tile[] }) | null {
  const results = tileIds.reduce<{
    currentDraft: DraftState
    tiles: Tile[]
    ok: boolean
  }>(
    (state, tileId) => {
      if (!state.ok) {
        return state
      }

      const result = takeTileById(state.currentDraft, tileId)

      if (!result) {
        return { ...state, ok: false }
      }

      return {
        currentDraft: {
          draftBoard: result.draftBoard,
          draftHand: result.draftHand,
        },
        tiles: [...state.tiles, result.tile],
        ok: true,
      }
    },
    { currentDraft: draft, tiles: [], ok: true },
  )

  if (!results.ok || results.tiles.length === 0) {
    return null
  }

  return {
    ...results.currentDraft,
    tiles: results.tiles,
  }
}

function takeTileById(
  draft: DraftState,
  tileId: string,
): (DraftState & { tile: Tile; source: { setId: string; tileIndex: number } | null }) | null {
  const handTile = draft.draftHand.find((tile) => tile.id === tileId)

  if (handTile) {
    return {
      tile: handTile,
      source: null,
      draftHand: draft.draftHand.filter((tile) => tile.id !== tileId),
      draftBoard: cloneBoard(draft.draftBoard),
    }
  }

  let movedTile: Tile | null = null
  let source: { setId: string; tileIndex: number } | null = null
  const draftBoard = draft.draftBoard.map((set) => {
    const tileIndex = set.tiles.findIndex((tile) => tile.id === tileId)

    if (tileIndex === -1) {
      return { ...set, tiles: [...set.tiles] }
    }

    movedTile = set.tiles[tileIndex]
    source = { setId: set.id, tileIndex }
    return getSetWithInferredType({
      ...set,
      tiles: set.tiles.filter((tile) => tile.id !== tileId),
    })
  })

  if (!movedTile || !source) {
    return null
  }

  return {
    tile: movedTile,
    source,
    draftHand: [...draft.draftHand],
    draftBoard,
  }
}

function insertTileAt(tiles: Tile[], tile: Tile, index?: number): Tile[] {
  if (index === undefined) {
    return [...tiles, tile]
  }

  const nextTiles = [...tiles]
  nextTiles.splice(Math.max(0, Math.min(index, nextTiles.length)), 0, tile)
  return nextTiles
}

function getSetWithInferredType(set: TileSet): TileSet {
  const nextSet = {
    ...set,
    type: inferSetType(set.tiles) ?? set.type,
  }

  return sortTilesForSet(nextSet)
}

function getTurnChangeStatus(
  draft: DraftState,
  snapshot: TurnSnapshot,
): TurnChangeStatus {
  const hasBoardChanges = getBoardSignature(draft.draftBoard) !== getBoardSignature(snapshot.board)
  const hasHandChanges = getHandSignature(draft.draftHand) !== getHandSignature(snapshot.hand)

  return {
    hasBoardChanges,
    hasHandChanges,
    hasAnyChanges: hasBoardChanges || hasHandChanges,
  }
}

function getBoardSignature(board: TileSet[]): string {
  return board
    .map((set) => `${set.id}:${set.type}:${set.tiles.map((tile) => tile.id).join(',')}`)
    .join('|')
}

function getHandSignature(hand: Tile[]): string {
  return hand
    .map((tile) => tile.id)
    .sort()
    .join('|')
}

function getDraftSignature(draft: DraftState): string {
  return `${getBoardSignature(draft.draftBoard)}::${getHandSignature(draft.draftHand)}`
}

export default RummikubGame
