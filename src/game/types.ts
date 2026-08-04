export const BOARD_SIZE = 10

export type Orientation = 'horizontal' | 'vertical'

export type ShipId = 'carrier' | 'battleship' | 'cruiser' | 'submarine' | 'destroyer'

export interface ShipSpec {
  id: ShipId
  name: string
  length: number
}

export const FLEET: readonly ShipSpec[] = [
  { id: 'carrier', name: 'Carrier', length: 5 },
  { id: 'battleship', name: 'Battleship', length: 4 },
  { id: 'cruiser', name: 'Cruiser', length: 3 },
  { id: 'submarine', name: 'Submarine', length: 3 },
  { id: 'destroyer', name: 'Destroyer', length: 2 },
]

export interface Coord {
  row: number
  col: number
}

export interface Placement {
  id: ShipId
  row: number
  col: number
  orientation: Orientation
}

export interface Ship extends Placement {
  name: string
  length: number
  hits: boolean[]
}

export type CellState = 'unknown' | 'hit' | 'miss'

export interface Board {
  ships: Ship[]
  shots: CellState[][]
}

export type Difficulty = 'easy' | 'medium' | 'hard'

export type Side = 'player' | 'cpu'

export type Phase = 'setup' | 'placement' | 'battle' | 'over'

export interface LogEntry {
  id: number
  turn: number
  kind: 'info' | 'hit' | 'miss' | 'sunk' | 'result'
  text: string
}

export function coordLabel({ row, col }: Coord): string {
  return `${String.fromCharCode(65 + col)}${row + 1}`
}

export function shipCells(placement: Placement, length: number): Coord[] {
  const cells: Coord[] = []
  for (let i = 0; i < length; i++) {
    cells.push({
      row: placement.row + (placement.orientation === 'vertical' ? i : 0),
      col: placement.col + (placement.orientation === 'horizontal' ? i : 0),
    })
  }
  return cells
}

export function shipSpec(id: ShipId): ShipSpec {
  const spec = FLEET.find((s) => s.id === id)
  if (!spec) throw new Error(`Unknown ship: ${id}`)
  return spec
}
