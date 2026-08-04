import { chooseTarget } from '../game/ai'
import { canPlace, countShots, createBoard, fireAt, placeShip, randomFleet } from '../game/board'
import {
  type Board,
  type Coord,
  type Difficulty,
  type LogEntry,
  type Phase,
  type Placement,
  type ShipId,
  coordLabel,
  FLEET,
} from '../game/types'

export interface GameState {
  phase: Phase
  difficulty: Difficulty
  placements: Placement[]
  playerBoard: Board | null
  cpuBoard: Board | null
  turn: number
  activeSide: 'player' | 'cpu'
  log: LogEntry[]
  winner: 'player' | 'cpu' | null
  nextLogId: number
}

export type GameAction =
  | { type: 'setDifficulty'; difficulty: Difficulty }
  | { type: 'beginPlacement' }
  | { type: 'placeShip'; placement: Placement }
  | { type: 'removeShip'; id: ShipId }
  | { type: 'randomize' }
  | { type: 'clearBoard' }
  | { type: 'startBattle' }
  | { type: 'playerFire'; target: Coord }
  | { type: 'cpuFire' }
  | { type: 'restart' }

export const initialState: GameState = {
  phase: 'setup',
  difficulty: 'medium',
  placements: [],
  playerBoard: null,
  cpuBoard: null,
  turn: 0,
  activeSide: 'player',
  log: [],
  winner: null,
  nextLogId: 1,
}

function log(state: GameState, kind: LogEntry['kind'], text: string): GameState {
  return {
    ...state,
    log: [...state.log, { id: state.nextLogId, turn: state.turn, kind, text }],
    nextLogId: state.nextLogId + 1,
  }
}

export function isFleetPlaced(placements: Placement[]): boolean {
  return FLEET.every((spec) => placements.some((p) => p.id === spec.id))
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'setDifficulty':
      return { ...state, difficulty: action.difficulty }

    case 'beginPlacement':
      return { ...state, phase: 'placement', placements: randomFleet() }

    case 'placeShip':
      if (!canPlace(state.placements, action.placement)) return state
      return { ...state, placements: placeShip(state.placements, action.placement) }

    case 'removeShip':
      return { ...state, placements: state.placements.filter((p) => p.id !== action.id) }

    case 'randomize':
      return { ...state, placements: randomFleet() }

    case 'clearBoard':
      return { ...state, placements: [] }

    case 'startBattle': {
      if (!isFleetPlaced(state.placements)) return state
      const started: GameState = {
        ...state,
        phase: 'battle',
        playerBoard: createBoard(state.placements),
        cpuBoard: createBoard(randomFleet()),
        turn: 1,
        activeSide: 'player',
        log: [],
        winner: null,
        nextLogId: 1,
      }
      return log(started, 'info', `Battle stations — ${labelFor(state.difficulty)} opponent. Fire when ready.`)
    }

    case 'playerFire': {
      if (state.phase !== 'battle' || state.activeSide !== 'player' || !state.cpuBoard) return state
      if (state.cpuBoard.shots[action.target.row][action.target.col] !== 'unknown') return state

      const result = fireAt(state.cpuBoard, action.target)
      let next: GameState = { ...state, cpuBoard: result.board }
      next = log(
        next,
        result.outcome,
        `You fired at ${coordLabel(action.target)} — ${result.outcome === 'hit' ? 'HIT' : 'miss'}`,
      )
      if (result.sunk) next = log(next, 'sunk', `You sank the enemy ${result.sunk.name}!`)
      if (result.won) {
        next = log(next, 'result', `Victory — enemy fleet destroyed in ${countShots(result.board.shots, 'hit') + countShots(result.board.shots, 'miss')} shots.`)
        return { ...next, phase: 'over', winner: 'player' }
      }
      return { ...next, activeSide: 'cpu' }
    }

    case 'cpuFire': {
      if (state.phase !== 'battle' || state.activeSide !== 'cpu' || !state.playerBoard) return state

      const target = chooseTarget(state.playerBoard, state.difficulty)
      const result = fireAt(state.playerBoard, target)
      let next: GameState = { ...state, playerBoard: result.board }
      next = log(
        next,
        result.outcome,
        `Enemy fired at ${coordLabel(target)} — ${result.outcome === 'hit' ? 'HIT' : 'miss'}`,
      )
      if (result.sunk) next = log(next, 'sunk', `Your ${result.sunk.name} was sunk!`)
      if (result.won) {
        next = log(next, 'result', 'Defeat — your fleet has been destroyed.')
        return { ...next, phase: 'over', winner: 'cpu' }
      }
      return { ...next, activeSide: 'player', turn: state.turn + 1 }
    }

    case 'restart':
      return { ...initialState, difficulty: state.difficulty }

    default:
      return state
  }
}

export function labelFor(difficulty: Difficulty): string {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
}
