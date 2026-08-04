import type { ReactElement } from 'react'
import { isSunk, key, shipAt } from '../game/board'
import {
  BOARD_SIZE,
  type Board,
  type Coord,
  type Ship,
  coordLabel,
} from '../game/types'
import { Grid } from './Grid'
import { ShipShape } from './ShipShape'

interface Props {
  playerBoard: Board
  cpuBoard: Board
  canFire: boolean
  onFire: (target: Coord) => void
}

function ShipOverlay({ ship, sunk }: { ship: Ship; sunk: boolean }) {
  const horizontal = ship.orientation === 'horizontal'
  return (
    <div
      className={`ship-overlay${sunk ? ' is-sunk' : ''}`}
      style={{
        gridColumn: horizontal ? `${ship.col + 2} / span ${ship.length}` : `${ship.col + 2}`,
        gridRow: horizontal ? `${ship.row + 2}` : `${ship.row + 2} / span ${ship.length}`,
      }}
      aria-hidden="true"
    >
      <ShipShape id={ship.id} orientation={ship.orientation} />
    </div>
  )
}

function Pegs({ board }: { board: Board }) {
  const pegs: ReactElement[] = []
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const state = board.shots[row][col]
      if (state === 'unknown') continue
      pegs.push(
        <div
          key={key({ row, col })}
          className={`peg peg-${state}`}
          style={{ gridColumn: col + 2, gridRow: row + 2 }}
          aria-hidden="true"
        />,
      )
    }
  }
  return pegs
}

function FleetStatus({
  board,
  title,
  revealHits,
}: {
  board: Board
  title: string
  revealHits: boolean
}) {
  return (
    <ul className="fleet-status" aria-label={title}>
      {board.ships.map((ship) => {
        const sunk = isSunk(ship)
        return (
          <li key={ship.id} className={sunk ? 'is-sunk' : undefined}>
            <span className="fleet-status-name">{ship.name}</span>
            <span className="fleet-status-pips" aria-hidden="true">
              {ship.hits.map((hit, index) => (
                <span key={index} className={`pip${(revealHits ? hit : sunk) ? ' pip-hit' : ''}`} />
              ))}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

export function BattlePhase({ playerBoard, cpuBoard, canFire, onFire }: Props) {
  const cpuSunkShips = cpuBoard.ships.filter(isSunk)

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
              const ship = state === 'hit' ? shipAt(cpuBoard.ships, { row, col }) : undefined
              const revealed = ship !== undefined && isSunk(ship)
              const label = coordLabel({ row, col })
              return (
                <button
                  key={id}
                  type="button"
                  className={`cell cell-target is-${state}`}
                  style={{ gridColumn: col + 2, gridRow: row + 2 }}
                  disabled={!canFire || state !== 'unknown'}
                  onClick={() => onFire({ row, col })}
                  aria-label={
                    state === 'unknown'
                      ? `Fire at ${label}`
                      : `${label}, ${state}${revealed ? `, ${ship.name} sunk` : ''}`
                  }
                />
              )
            }),
          )}
          {cpuSunkShips.map((ship) => (
            <ShipOverlay key={ship.id} ship={ship} sunk />
          ))}
          <Pegs board={cpuBoard} />
        </Grid>
        <FleetStatus board={cpuBoard} title="Enemy fleet" revealHits={false} />
      </section>

      <section className="panel board-panel">
        <div className="panel-header">
          <h3>Your fleet</h3>
        </div>
        <Grid label="Your fleet">
          {Array.from({ length: BOARD_SIZE }, (_, row) =>
            Array.from({ length: BOARD_SIZE }, (_, col) => (
              <div
                key={key({ row, col })}
                className={`cell is-${playerBoard.shots[row][col]}`}
                style={{ gridColumn: col + 2, gridRow: row + 2 }}
              />
            )),
          )}
          {playerBoard.ships.map((ship) => (
            <ShipOverlay key={ship.id} ship={ship} sunk={isSunk(ship)} />
          ))}
          <Pegs board={playerBoard} />
        </Grid>
        <FleetStatus board={playerBoard} title="Your fleet" revealHits />
      </section>
    </div>
  )
}
