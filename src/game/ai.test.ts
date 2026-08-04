import { describe, expect, it } from 'vitest'
import { chooseTarget } from './ai'
import { createBoard, fireAt, randomFleet } from './board'
import { BOARD_SIZE, type Difficulty } from './types'

function seeded(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']

/** Plays a full game and returns how many shots it took to sink the fleet. */
function playGame(difficulty: Difficulty, seed: number): number {
  const rng = seeded(seed)
  let board = createBoard(randomFleet(rng))
  const fired = new Set<string>()
  let shots = 0

  while (!board.ships.every((ship) => ship.hits.every(Boolean))) {
    const target = chooseTarget(board, difficulty, rng)
    const key = `${target.row},${target.col}`
    expect(fired.has(key)).toBe(false)
    expect(target.row).toBeGreaterThanOrEqual(0)
    expect(target.row).toBeLessThan(BOARD_SIZE)
    expect(target.col).toBeGreaterThanOrEqual(0)
    expect(target.col).toBeLessThan(BOARD_SIZE)
    fired.add(key)
    board = fireAt(board, target).board
    shots++
    expect(shots).toBeLessThanOrEqual(BOARD_SIZE * BOARD_SIZE)
  }
  return shots
}

describe('chooseTarget', () => {
  for (const difficulty of DIFFICULTIES) {
    it(`${difficulty} always fires at a legal, untried cell until the fleet sinks`, () => {
      for (let seed = 1; seed <= 30; seed++) playGame(difficulty, seed)
    })
  }

  it('finishes faster as difficulty increases', () => {
    const average = (difficulty: Difficulty) => {
      let total = 0
      for (let seed = 1; seed <= 40; seed++) total += playGame(difficulty, seed)
      return total / 40
    }
    const easy = average('easy')
    const medium = average('medium')
    const hard = average('hard')
    expect(medium).toBeLessThan(easy)
    expect(hard).toBeLessThan(medium)
  })

  it('targets a cell adjacent to an open hit', () => {
    const board = fireAt(
      createBoard([
        { id: 'carrier', row: 0, col: 0, orientation: 'horizontal' },
        { id: 'battleship', row: 2, col: 0, orientation: 'horizontal' },
        { id: 'cruiser', row: 4, col: 0, orientation: 'horizontal' },
        { id: 'submarine', row: 6, col: 0, orientation: 'horizontal' },
        { id: 'destroyer', row: 8, col: 0, orientation: 'horizontal' },
      ]),
      { row: 4, col: 1 },
    ).board

    for (const difficulty of ['medium', 'hard'] as const) {
      const target = chooseTarget(board, difficulty, seeded(7))
      expect(Math.abs(target.row - 4) + Math.abs(target.col - 1)).toBe(1)
    }
  })

  it('extends along a line of two hits rather than probing sideways', () => {
    let board = createBoard([
      { id: 'carrier', row: 0, col: 0, orientation: 'horizontal' },
      { id: 'battleship', row: 2, col: 0, orientation: 'horizontal' },
      { id: 'cruiser', row: 4, col: 0, orientation: 'horizontal' },
      { id: 'submarine', row: 6, col: 0, orientation: 'horizontal' },
      { id: 'destroyer', row: 8, col: 0, orientation: 'horizontal' },
    ])
    board = fireAt(board, { row: 0, col: 1 }).board
    board = fireAt(board, { row: 0, col: 2 }).board

    for (const difficulty of ['medium', 'hard'] as const) {
      for (let seed = 1; seed <= 10; seed++) {
        const target = chooseTarget(board, difficulty, seeded(seed))
        expect(target.row).toBe(0)
        expect([0, 3]).toContain(target.col)
      }
    }
  })
})
