import { describe, expect, it } from 'vitest'
import {
  canPlace,
  createBoard,
  fireAt,
  isFleetSunk,
  openHits,
  randomFleet,
  untriedCells,
} from './board'
import { BOARD_SIZE, FLEET, type Placement, coordLabel, shipCells } from './types'

function seeded(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

describe('placement', () => {
  it('rejects ships that run off the board', () => {
    expect(canPlace([], { id: 'carrier', row: 0, col: 6, orientation: 'horizontal' })).toBe(false)
    expect(canPlace([], { id: 'carrier', row: 6, col: 0, orientation: 'vertical' })).toBe(false)
    expect(canPlace([], { id: 'carrier', row: 0, col: 5, orientation: 'horizontal' })).toBe(true)
  })

  it('rejects overlapping ships but allows touching ones', () => {
    const existing: Placement[] = [{ id: 'carrier', row: 0, col: 0, orientation: 'horizontal' }]
    expect(canPlace(existing, { id: 'cruiser', row: 0, col: 4, orientation: 'vertical' })).toBe(false)
    expect(canPlace(existing, { id: 'cruiser', row: 1, col: 0, orientation: 'horizontal' })).toBe(true)
  })

  it('ignores the ship being moved when validating its own new position', () => {
    const existing: Placement[] = [{ id: 'carrier', row: 0, col: 0, orientation: 'horizontal' }]
    expect(canPlace(existing, { id: 'carrier', row: 0, col: 1, orientation: 'horizontal' })).toBe(true)
  })
})

describe('randomFleet', () => {
  it('places the whole fleet without overlaps, every time', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const fleet = randomFleet(seeded(seed))
      expect(fleet).toHaveLength(FLEET.length)
      const cells = new Set<string>()
      for (const placement of fleet) {
        const spec = FLEET.find((s) => s.id === placement.id)!
        for (const cell of shipCells(placement, spec.length)) {
          expect(cell.row).toBeGreaterThanOrEqual(0)
          expect(cell.row).toBeLessThan(BOARD_SIZE)
          expect(cell.col).toBeGreaterThanOrEqual(0)
          expect(cell.col).toBeLessThan(BOARD_SIZE)
          const key = `${cell.row},${cell.col}`
          expect(cells.has(key)).toBe(false)
          cells.add(key)
        }
      }
    }
  })
})

describe('firing', () => {
  const fleet: Placement[] = [
    { id: 'carrier', row: 0, col: 0, orientation: 'horizontal' },
    { id: 'battleship', row: 2, col: 0, orientation: 'horizontal' },
    { id: 'cruiser', row: 4, col: 0, orientation: 'horizontal' },
    { id: 'submarine', row: 6, col: 0, orientation: 'horizontal' },
    { id: 'destroyer', row: 8, col: 0, orientation: 'horizontal' },
  ]

  it('records hits and misses', () => {
    const board = createBoard(fleet)
    expect(fireAt(board, { row: 0, col: 0 }).outcome).toBe('hit')
    expect(fireAt(board, { row: 1, col: 0 }).outcome).toBe('miss')
  })

  it('reports a ship as sunk only on its final hit', () => {
    let board = createBoard(fleet)
    let result = fireAt(board, { row: 8, col: 0 })
    expect(result.sunk).toBeNull()
    board = result.board
    result = fireAt(board, { row: 8, col: 1 })
    expect(result.sunk?.name).toBe('Destroyer')
  })

  it('declares a win once every ship is sunk', () => {
    let board = createBoard(fleet)
    let won = false
    for (const placement of fleet) {
      const spec = FLEET.find((s) => s.id === placement.id)!
      for (const cell of shipCells(placement, spec.length)) {
        const result = fireAt(board, cell)
        board = result.board
        won = result.won
      }
    }
    expect(won).toBe(true)
    expect(isFleetSunk(board)).toBe(true)
  })

  it('leaves only unshot cells untried', () => {
    const board = fireAt(createBoard(fleet), { row: 5, col: 5 }).board
    expect(untriedCells(board.shots)).toHaveLength(BOARD_SIZE * BOARD_SIZE - 1)
  })

  it('stops reporting open hits once the ship sinks', () => {
    let board = createBoard(fleet)
    board = fireAt(board, { row: 8, col: 0 }).board
    expect(openHits(board)).toHaveLength(1)
    board = fireAt(board, { row: 8, col: 1 }).board
    expect(openHits(board)).toHaveLength(0)
  })
})

describe('coordLabel', () => {
  it('formats coordinates as letter + 1-based row', () => {
    expect(coordLabel({ row: 0, col: 0 })).toBe('A1')
    expect(coordLabel({ row: 9, col: 9 })).toBe('J10')
  })
})
