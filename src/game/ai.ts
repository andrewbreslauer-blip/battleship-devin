import {
  BOARD_SIZE,
  type Board,
  type CellState,
  type Coord,
  type Difficulty,
} from './types'
import { openHits, remainingShipLengths, untriedCells } from './board'

const DIRECTIONS: Coord[] = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
]

function pick<T>(items: T[], rng: () => number): T {
  return items[Math.floor(rng() * items.length)]
}

function isUnknown(shots: CellState[][], row: number, col: number): boolean {
  return (
    row >= 0 &&
    row < BOARD_SIZE &&
    col >= 0 &&
    col < BOARD_SIZE &&
    shots[row][col] === 'unknown'
  )
}

/**
 * Chooses the CPU's next target on `board` (the defender's board), given the
 * shots already taken against it.
 */
export function chooseTarget(
  board: Board,
  difficulty: Difficulty,
  rng: () => number = Math.random,
): Coord {
  const candidates = untriedCells(board.shots)
  if (candidates.length === 0) throw new Error('No cells left to fire at')

  if (difficulty === 'easy') return pick(candidates, rng)

  const hits = openHits(board)
  if (hits.length > 0) {
    const targeted = targetFromHits(board.shots, hits)
    if (targeted.length > 0) return pick(targeted, rng)
  }

  if (difficulty === 'medium') return pick(parityFilter(candidates, board), rng)

  return bestByProbability(board, candidates, rng)
}

/**
 * Cells adjacent to known hits on unsunk ships. Once two hits are collinear the
 * search collapses to the two ends of that line.
 */
function targetFromHits(shots: CellState[][], hits: Coord[]): Coord[] {
  const lineTargets: Coord[] = []

  for (const hit of hits) {
    for (const axis of ['row', 'col'] as const) {
      const other = axis === 'row' ? 'col' : 'row'
      const partner = hits.find((h) => h[axis] === hit[axis] && h[other] === hit[other] + 1)
      if (!partner) continue

      let low = hit[other]
      while (hits.some((h) => h[axis] === hit[axis] && h[other] === low - 1)) low -= 1
      let high = partner[other]
      while (hits.some((h) => h[axis] === hit[axis] && h[other] === high + 1)) high += 1

      for (const end of [low - 1, high + 1]) {
        const cell =
          axis === 'row' ? { row: hit.row, col: end } : { row: end, col: hit.col }
        if (isUnknown(shots, cell.row, cell.col)) lineTargets.push(cell)
      }
    }
  }

  if (lineTargets.length > 0) return dedupe(lineTargets)

  const neighbours: Coord[] = []
  for (const hit of hits) {
    for (const dir of DIRECTIONS) {
      const cell = { row: hit.row + dir.row, col: hit.col + dir.col }
      if (isUnknown(shots, cell.row, cell.col)) neighbours.push(cell)
    }
  }
  return dedupe(neighbours)
}

function dedupe(cells: Coord[]): Coord[] {
  const seen = new Set<string>()
  return cells.filter((cell) => {
    const id = `${cell.row},${cell.col}`
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })
}

/**
 * While hunting, only every Nth cell needs checking, where N is the smallest
 * remaining ship: no ship can hide entirely between two such cells.
 */
function parityFilter(candidates: Coord[], board: Board): Coord[] {
  const smallest = Math.min(...remainingShipLengths(board))
  const filtered = candidates.filter((cell) => (cell.row + cell.col) % smallest === 0)
  return filtered.length > 0 ? filtered : candidates
}

/**
 * Scores every untried cell by how many placements of the remaining ships could
 * cover it, then fires at the densest cell.
 */
function bestByProbability(board: Board, candidates: Coord[], rng: () => number): Coord {
  const lengths = remainingShipLengths(board)
  const scores = Array.from({ length: BOARD_SIZE }, () => Array.from({ length: BOARD_SIZE }, () => 0))
  const hits = openHits(board)
  const hitKeys = new Set(hits.map((hit) => `${hit.row},${hit.col}`))

  for (const length of lengths) {
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        for (const horizontal of [true, false]) {
          const cells: Coord[] = []
          for (let i = 0; i < length; i++) {
            cells.push({ row: row + (horizontal ? 0 : i), col: col + (horizontal ? i : 0) })
          }
          if (cells.some((c) => c.row >= BOARD_SIZE || c.col >= BOARD_SIZE)) continue
          if (cells.some((c) => board.shots[c.row][c.col] === 'miss')) continue
          if (cells.some((c) => board.shots[c.row][c.col] === 'hit' && !hitKeys.has(`${c.row},${c.col}`))) {
            continue
          }

          const overlap = cells.filter((c) => hitKeys.has(`${c.row},${c.col}`)).length
          const weight = 1 + overlap * 12
          for (const cell of cells) {
            if (board.shots[cell.row][cell.col] === 'unknown') scores[cell.row][cell.col] += weight
          }
        }
      }
    }
  }

  let best = -1
  let bestCells: Coord[] = []
  for (const cell of candidates) {
    const score = scores[cell.row][cell.col]
    if (score > best) {
      best = score
      bestCells = [cell]
    } else if (score === best) {
      bestCells.push(cell)
    }
  }
  return pick(bestCells.length > 0 ? bestCells : candidates, rng)
}
