import { useEffect, useMemo, useState, type DragEvent } from 'react'
import './App.css'
import { Controls } from './components/Controls'
import { CpuHand } from './components/CpuHand'
import { GameBoard } from './components/GameBoard'
import { PlayerHand } from './components/PlayerHand'
import { StatusBar } from './components/StatusBar'
import { getCpuMove } from './game/cpu'
import {
  cloneBoard,
  createDraftFromState,
  createInitialGameState,
  createSetId,
  determineWinnerByHandPoints,
  drawTile,
  sortHand,
  validatePlayerTurn,
} from './game/gameLogic'
import type { DraftState, GameState, SetType, Tile, TileSet } from './types'

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

const initialState = createInitialGameState()
const TILE_DRAG_MIME_TYPE = 'application/x-rummikub-tile-id'

function App() {
  const [gameState, setGameState] = useState<GameState>(initialState)
  const [draft, setDraft] = useState<DraftState>(() => createDraftFromState(initialState))
  const [turnSnapshot, setTurnSnapshot] = useState<TurnSnapshot>(() => ({
    board: cloneBoard(initialState.board),
    hand: [...initialState.playerHand],
  }))
  const [selection, setSelection] = useState<TileSelection | null>(null)
  const [newSetType, setNewSetType] = useState<SetType>('run')
  const [lastDrawnTileId, setLastDrawnTileId] = useState<string | null>(null)
  const [message, setMessage] = useState('手牌を選択して、新しいセットか場のセットに追加してください。')

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
  const selectedTileId = selection?.tileId ?? null
  const selectedLabel = useMemo(
    () => getSelectedLabel(selection, draft),
    [draft, selection],
  )
  const hasBoardSelection = selection?.source === 'board'
  const turnChangeStatus = useMemo(
    () => getTurnChangeStatus(draft, turnSnapshot),
    [draft, turnSnapshot],
  )
  const canDrawAndEndTurn = canPlayerAct && !turnChangeStatus.hasAnyChanges

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
        setTurnSnapshot({
          board: cloneBoard(nextState.board),
          hand: [...nextState.playerHand],
        })
        setSelection(null)
      }

      setMessage(nextMessage)
    }, 700)

    return () => window.clearTimeout(timeoutId)
  }, [gameState])

  function handleSelectHandTile(tileId: string): void {
    if (!canPlayerAct) {
      return
    }

    setSelection((current) =>
      current?.source === 'hand' && current.tileId === tileId
        ? null
        : { source: 'hand', tileId },
    )
  }

  function handleDragStartHandTile(
    tileId: string,
    event: DragEvent<HTMLButtonElement>,
  ): void {
    if (!canPlayerAct) {
      return
    }

    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData(TILE_DRAG_MIME_TYPE, tileId)
    setSelection({ source: 'hand', tileId })
  }

  function handleDragEndHandTile(): void {
    setSelection((current) => (current?.source === 'hand' ? null : current))
  }

  function handleSelectBoardTile(setId: string, tileId: string): void {
    if (!canPlayerAct || lockedSetIds.has(setId)) {
      setMessage('初回30点を出す前は、既存の場のタイルを選択できません。')
      return
    }

    setSelection((current) =>
      current?.source === 'board' && current.tileId === tileId
        ? null
        : { source: 'board', setId, tileId },
    )
  }

  function handleCreateSet(): void {
    if (!canPlayerAct) {
      return
    }

    setDraft((currentDraft) => {
      if (!selection) {
        return {
          ...currentDraft,
          draftBoard: [
            ...currentDraft.draftBoard,
            { id: createSetId(), type: newSetType, tiles: [] },
          ],
        }
      }

      const result = takeSelectedTile(currentDraft, selection)

      if (!result) {
        return currentDraft
      }

      return {
        draftHand: result.draftHand,
        draftBoard: [
          ...removeEmptySets(result.draftBoard),
          { id: createSetId(), type: newSetType, tiles: [result.tile] },
        ],
      }
    })
    setSelection(null)
  }

  function handleAddSelectedToSet(setId: string): void {
    if (!canPlayerAct || !selection) {
      return
    }

    if (lockedSetIds.has(setId)) {
      setMessage('初回30点を出す前は、既存の場へ追加できません。')
      return
    }

    setDraft((currentDraft) => {
      const result = takeSelectedTile(currentDraft, selection)

      if (!result) {
        return currentDraft
      }

      return {
        draftHand: result.draftHand,
        draftBoard: removeEmptySets(
          result.draftBoard.map((set) =>
            set.id === setId ? { ...set, tiles: [...set.tiles, result.tile] } : set,
          ),
        ),
      }
    })
    setSelection(null)
  }

  function handleDropHandTileToSet(setId: string, tileId: string): void {
    if (!canPlayerAct) {
      return
    }

    if (lockedSetIds.has(setId)) {
      setMessage('初回30点を出す前は、既存の場へ追加できません。')
      return
    }

    setDraft((currentDraft) => {
      const tile = currentDraft.draftHand.find((handTile) => handTile.id === tileId)

      if (!tile) {
        return currentDraft
      }

      return {
        draftHand: currentDraft.draftHand.filter((handTile) => handTile.id !== tileId),
        draftBoard: removeEmptySets(
          currentDraft.draftBoard.map((set) =>
            set.id === setId ? { ...set, tiles: [...set.tiles, tile] } : set,
          ),
        ),
      }
    })
    setSelection(null)
  }

  function handleDropHandTileToNewSet(tileId: string): void {
    if (!canPlayerAct) {
      return
    }

    setDraft((currentDraft) => {
      const tile = currentDraft.draftHand.find((handTile) => handTile.id === tileId)

      if (!tile) {
        return currentDraft
      }

      return {
        draftHand: currentDraft.draftHand.filter((handTile) => handTile.id !== tileId),
        draftBoard: [
          ...removeEmptySets(currentDraft.draftBoard),
          { id: createSetId(), type: newSetType, tiles: [tile] },
        ],
      }
    })
    setSelection(null)
  }

  function handleReturnSelectedToHand(): void {
    if (!canPlayerAct || selection?.source !== 'board') {
      return
    }

    if (lockedSetIds.has(selection.setId)) {
      setMessage('初回30点を出す前は、既存の場のタイルを手札へ戻せません。')
      return
    }

    setDraft((currentDraft) => {
      const result = takeSelectedTile(currentDraft, selection)

      if (!result) {
        return currentDraft
      }

      return {
        draftBoard: removeEmptySets(result.draftBoard),
        draftHand: sortHand([...result.draftHand, result.tile]),
      }
    })
    setSelection(null)
  }

  function handleChangeSetType(setId: string, type: SetType): void {
    if (!canPlayerAct || lockedSetIds.has(setId)) {
      return
    }

    setDraft((currentDraft) => ({
      ...currentDraft,
      draftBoard: currentDraft.draftBoard.map((set) =>
        set.id === setId ? { ...set, type } : set,
      ),
    }))
  }

  function handleRemoveEmptySet(setId: string): void {
    if (!canPlayerAct || lockedSetIds.has(setId)) {
      return
    }

    setDraft((currentDraft) => ({
      ...currentDraft,
      draftBoard: currentDraft.draftBoard.filter(
        (set) => set.id !== setId || set.tiles.length > 0,
      ),
    }))
    setSelection((current) =>
      current?.source === 'board' && current.setId === setId ? null : current,
    )
  }

  function handleResetDraft(): void {
    if (!canPlayerAct) {
      return
    }

    setDraft({
      draftBoard: cloneBoard(turnSnapshot.board),
      draftHand: [...turnSnapshot.hand],
    })
    setSelection(null)
    setMessage('このターン開始時点へ戻しました。')
  }

  function handleEndTurn(): void {
    if (!canPlayerAct) {
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

    const nextPlayerHand = sortHand(draft.draftHand)
    const winner = nextPlayerHand.length === 0 ? 'player' : null

    setGameState((current) => ({
      ...current,
      board: cloneBoard(draft.draftBoard),
      playerHand: nextPlayerHand,
      hasPlayerOpened: validation.hasOpened,
      currentTurn: winner ? 'player' : 'cpu',
      winner,
    }))
    setSelection(null)
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
    const nextPlayerHand = tile ? sortHand([...gameState.playerHand, tile]) : gameState.playerHand
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
    setTurnSnapshot({
      board: cloneBoard(nextState.board),
      hand: [...nextState.playerHand],
    })
    setSelection(null)
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
    setTurnSnapshot({
      board: cloneBoard(nextState.board),
      hand: [...nextState.playerHand],
    })
    setSelection(null)
    setLastDrawnTileId(null)
    setMessage('新しいゲームを開始しました。')
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Rummikub style duel</p>
          <h1>ラミーキューブ</h1>
        </div>
      </header>

      <StatusBar state={gameState} message={message} isCpuThinking={isCpuThinking} />
      <CpuHand tileCount={gameState.cpuHand.length} />
      <GameBoard
        board={draft.draftBoard}
        lockedSetIds={lockedSetIds}
        canAddSelected={canPlayerAct && selection !== null}
        canDropHandTile={canPlayerAct}
        selectedTileId={selectedTileId}
        onAddSelected={handleAddSelectedToSet}
        onSelectTile={handleSelectBoardTile}
        onDropHandTile={handleDropHandTileToSet}
        onDropHandTileToNewSet={handleDropHandTileToNewSet}
        onChangeType={handleChangeSetType}
        onRemoveEmptySet={handleRemoveEmptySet}
      />
      <Controls
        selectedLabel={selectedLabel}
        newSetType={newSetType}
        canAct={canPlayerAct}
        canDrawAndEndTurn={canDrawAndEndTurn}
        hasBoardSelection={hasBoardSelection}
        onNewSetTypeChange={setNewSetType}
        onCreateSet={handleCreateSet}
        onReturnSelectedToHand={handleReturnSelectedToHand}
        onResetDraft={handleResetDraft}
        onEndTurn={handleEndTurn}
        onDrawAndEndTurn={handleDrawAndEndTurn}
        onNewGame={handleNewGame}
      />
      <PlayerHand
        hand={draft.draftHand}
        selectedTileId={selectedTileId}
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
    return {
      ...set,
      tiles: set.tiles.filter((tile) => tile.id !== selection.tileId),
    }
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

function getSelectedLabel(selection: TileSelection | null, draft: DraftState): string {
  if (!selection) {
    return 'なし'
  }

  const tile =
    selection.source === 'hand'
      ? draft.draftHand.find((handTile) => handTile.id === selection.tileId)
      : draft.draftBoard
          .flatMap((set) => set.tiles)
          .find((boardTile) => boardTile.id === selection.tileId)

  if (!tile) {
    return 'なし'
  }

  const label = tile.color === 'joker' ? 'Joker' : `${tile.color} ${tile.number}`
  return selection.source === 'hand' ? `手札: ${label}` : `場: ${label}`
}

export default App
