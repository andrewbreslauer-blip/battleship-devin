import {
  BOARD_SIZE,
  type Board,
  type CellState,
  type Coord,
  type Orientation,
  type Placement,
  type Ship,
  shipCells,
  shipSpec,
  FLEET,
} from './types'

export function inBounds({ row, col }: Coord): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE
}

export function emptyShots(): CellState[][] {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, (): CellState => 'unknown'),
  )
}

export function createBoard(placements: Placement[]): Board {
  return {
    ships: placements.map(toShip),
    shots: emptyShots(),
  }
}

export function toShip(placement: Placement): Ship {
  const spec = shipSpec(placement.id)
  return {
    ...placement,
    name: spec.name,
    length: spec.length,
    hits: Array.from({ length: spec.length }, () => false),
  }
}

export function occupiedCells(placements: Placement[], ignoreId?: string): Set<string> {
  const taken = new Set<string>()
  for (const placement of placements) {
    if (placement.id === ignoreId) continue
    for (const cell of shipCells(placement, shipSpec(placement.id).length)) {
      taken.add(key(cell))
    }
  }
  return taken
}

export function key({ row, col }: Coord): string {
  return `${row},${col}`
}

export function canPlace(placements: Placement[], candidate: Placement): boolean {
  const length = shipSpec(candidate.id).length
  const cells = shipCells(candidate, length)
  if (!cells.every(inBounds)) return false
  const taken = occupiedCells(placements, candidate.id)
  return cells.every((cell) => !taken.has(key(cell)))
}

export function placeShip(placements: Placement[], candidate: Placement): Placement[] {
  const rest = placements.filter((p) => p.id !== candidate.id)
  return [...rest, candidate]
}

export function randomFleet(rng: () => number = Math.random): Placement[] {
  const placements: Placement[] = []
  for (const spec of FLEET) {
    for (;;) {
      const orientation: Orientation = rng() < 0.5 ? 'horizontal' : 'vertical'
      const candidate: Placement = {
        id: spec.id,
        orientation,
        row: Math.floor(rng() * (orientation === 'vertical' ? BOARD_SIZE - spec.length + 1 : BOARD_SIZE)),
        col: Math.floor(rng() * (orientation === 'horizontal' ? BOARD_SIZE - spec.length + 1 : BOARD_SIZE)),
      }
      if (canPlace(placements, candidate)) {
        placements.push(candidate)
        break
      }
    }
  }
  return placements
}

export interface ShotResult {
  board: Board
  outcome: 'hit' | 'miss'
  sunk: Ship | null
  won: boolean
}

export function fireAt(board: Board, target: Coord): ShotResult {
  const shots = board.shots.map((row) => [...row])
  const ships = board.ships.map((ship) => ({ ...ship, hits: [...ship.hits] }))

  let sunk: Ship | null = null
  let outcome: 'hit' | 'miss' = 'miss'

  for (const ship of ships) {
    const index = shipCells(ship, ship.length).findIndex(
      (cell) => cell.row === target.row && cell.col === target.col,
    )
    if (index === -1) continue
    ship.hits[index] = true
    outcome = 'hit'
    if (ship.hits.every(Boolean)) sunk = ship
    break
  }

  shots[target.row][target.col] = outcome
  const board2: Board = { ships, shots }
  return { board: board2, outcome, sunk, won: isFleetSunk(board2) }
}

export function isFleetSunk(board: Board): boolean {
  return board.ships.every((ship) => ship.hits.every(Boolean))
}

export function isSunk(ship: Ship): boolean {
  return ship.hits.every(Boolean)
}

/** Hit cells belonging to ships that have not yet been sunk. */
export function openHits(board: Board): Coord[] {
  const hits: Coord[] = []
  for (const ship of board.ships) {
    if (isSunk(ship)) continue
    shipCells(ship, ship.length).forEach((cell, index) => {
      if (ship.hits[index]) hits.push(cell)
    })
  }
  return hits
}

export function remainingShipLengths(board: Board): number[] {
  return board.ships.filter((ship) => !isSunk(ship)).map((ship) => ship.length)
}

export function untriedCells(shots: CellState[][]): Coord[] {
  const cells: Coord[] = []
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (shots[row][col] === 'unknown') cells.push({ row, col })
    }
  }
  return cells
}

export function shipAt(ships: Ship[], target: Coord): Ship | undefined {
  return ships.find((ship) =>
    shipCells(ship, ship.length).some((cell) => cell.row === target.row && cell.col === target.col),
  )
}

export function countShots(shots: CellState[][], state: CellState): number {
  return shots.flat().filter((cell) => cell === state).length
}
