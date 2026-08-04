import { isSunk, key, occupiedCells, shipAt } from '../game/board'
import {
  BOARD_SIZE,
  type Board,
  type Coord,
  coordLabel,
  shipCells,
} from '../game/types'
import { Grid } from './Grid'

interface Props {
  playerBoard: Board
  cpuBoard: Board
  canFire: boolean
  onFire: (target: Coord) => void
}

function sunkCells(board: Board): Set<string> {
  const cells = new Set<string>()
  for (const ship of board.ships) {
    if (!isSunk(ship)) continue
    for (const cell of shipCells(ship, ship.length)) cells.add(key(cell))
  }
  return cells
}

function FleetStatus({ board, title }: { board: Board; title: string }) {
  return (
    <ul className="fleet-status" aria-label={title}>
      {board.ships.map((ship) => (
        <li key={ship.id} className={isSunk(ship) ? 'is-sunk' : undefined}>
          <span className="fleet-status-name">{ship.name}</span>
          <span className="fleet-status-pips" aria-hidden="true">
            {ship.hits.map((hit, index) => (
              <span key={index} className={`pip${hit ? ' pip-hit' : ''}`} />
            ))}
          </span>
        </li>
      ))}
    </ul>
  )
}

export function BattlePhase({ playerBoard, cpuBoard, canFire, onFire }: Props) {
  const playerShipCells = occupiedCells(playerBoard.ships)
  const playerSunk = sunkCells(playerBoard)
  const cpuSunk = sunkCells(cpuBoard)

  return (
    <div className="battle">
      <section className="panel board-panel">
        <div className="panel-header">
          <h3>Enemy waters</h3>
          <span className="hint">Click a cell to fire</span>
        </div>
        <Grid label="Enemy waters">
          {Array.from({ length: BOARD_SIZE }, (_, row) =>
            Array.from({ length: BOARD_SIZE }, (_, col) => {
              const state = cpuBoard.shots[row][col]
              const id = key({ row, col })
              const revealed = cpuSunk.has(id)
              const label = coordLabel({ row, col })
              return (
                <button
                  key={id}
                  type="button"
                  className={`cell cell-target is-${state}${revealed ? ' is-revealed' : ''}`}
                  style={{ gridColumn: col + 2, gridRow: row + 2 }}
                  disabled={!canFire || state !== 'unknown'}
                  onClick={() => onFire({ row, col })}
                  aria-label={
                    state === 'unknown'
                      ? `Fire at ${label}`
                      : `${label}, ${state}${revealed ? `, ${shipAt(cpuBoard.ships, { row, col })?.name} sunk` : ''}`
                  }
                />
              )
            }),
          )}
        </Grid>
        <FleetStatus board={cpuBoard} title="Enemy fleet" />
      </section>

      <section className="panel board-panel">
        <div className="panel-header">
          <h3>Your fleet</h3>
        </div>
        <Grid label="Your fleet">
          {Array.from({ length: BOARD_SIZE }, (_, row) =>
            Array.from({ length: BOARD_SIZE }, (_, col) => {
              const state = playerBoard.shots[row][col]
              const id = key({ row, col })
              return (
                <div
                  key={id}
                  className={`cell is-${state}${playerShipCells.has(id) ? ' is-occupied' : ''}${
                    playerSunk.has(id) ? ' is-revealed' : ''
                  }`}
                  style={{ gridColumn: col + 2, gridRow: row + 2 }}
                />
              )
            }),
          )}
        </Grid>
        <FleetStatus board={playerBoard} title="Your fleet" />
      </section>
    </div>
  )
}
