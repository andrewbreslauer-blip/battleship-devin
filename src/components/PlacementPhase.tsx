import { useCallback, useEffect, useRef, useState } from 'react'
import { canPlace, key, occupiedCells } from '../game/board'
import {
  BOARD_SIZE,
  FLEET,
  type Coord,
  type Orientation,
  type Placement,
  type ShipId,
  shipCells,
  shipSpec,
} from '../game/types'
import { Grid } from './Grid'

interface Props {
  placements: Placement[]
  onPlace: (placement: Placement) => void
  onRemove: (id: ShipId) => void
  onRandomize: () => void
  onClear: () => void
  onStart: () => void
}

interface DragState {
  id: ShipId
  /** Which segment of the ship the pointer grabbed, 0-indexed from the bow. */
  offset: number
  orientation: Orientation
  hover: Coord | null
}

function cellFromPoint(x: number, y: number): Coord | null {
  const element = document.elementFromPoint(x, y)
  const cell = element?.closest<HTMLElement>('[data-row]')
  if (!cell) return null
  return { row: Number(cell.dataset.row), col: Number(cell.dataset.col) }
}

function originFor(drag: DragState, hover: Coord): Placement {
  return {
    id: drag.id,
    orientation: drag.orientation,
    row: hover.row - (drag.orientation === 'vertical' ? drag.offset : 0),
    col: hover.col - (drag.orientation === 'horizontal' ? drag.offset : 0),
  }
}

export function PlacementPhase({
  placements,
  onPlace,
  onRemove,
  onRandomize,
  onClear,
  onStart,
}: Props) {
  const [drag, setDrag] = useState<DragState | null>(null)
  const movedRef = useRef(false)
  const originRef = useRef({ x: 0, y: 0 })

  const preview = drag?.hover ? originFor(drag, drag.hover) : null
  const previewCells = preview ? shipCells(preview, shipSpec(preview.id).length) : []
  const previewValid = preview ? canPlace(placements, preview) : false
  const previewKeys = new Set(previewCells.map(key))

  const startDrag = useCallback(
    (id: ShipId, offset: number, orientation: Orientation, event: React.PointerEvent) => {
      movedRef.current = false
      originRef.current = { x: event.clientX, y: event.clientY }
      setDrag({ id, offset, orientation, hover: null })
    },
    [],
  )

  useEffect(() => {
    if (!drag) return

    const onMove = (event: PointerEvent) => {
      const { x, y } = originRef.current
      if (Math.abs(event.clientX - x) > 4 || Math.abs(event.clientY - y) > 4) movedRef.current = true
      setDrag((current) =>
        current ? { ...current, hover: cellFromPoint(event.clientX, event.clientY) } : current,
      )
    }

    const onUp = (event: PointerEvent) => {
      const hover = cellFromPoint(event.clientX, event.clientY)
      setDrag((current) => {
        if (current && hover) {
          const candidate = originFor(current, hover)
          if (canPlace(placements, candidate)) onPlace(candidate)
        }
        return null
      })
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'r') return
      event.preventDefault()
      setDrag((current) =>
        current
          ? { ...current, orientation: current.orientation === 'horizontal' ? 'vertical' : 'horizontal' }
          : current,
      )
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      window.removeEventListener('keydown', onKey)
    }
  }, [drag, placements, onPlace])

  const rotate = (placement: Placement) => {
    const rotated: Placement = {
      ...placement,
      orientation: placement.orientation === 'horizontal' ? 'vertical' : 'horizontal',
    }
    if (canPlace(placements, rotated)) onPlace(rotated)
  }

  const nudge = (placement: Placement, delta: Coord) => {
    const moved = { ...placement, row: placement.row + delta.row, col: placement.col + delta.col }
    if (canPlace(placements, moved)) onPlace(moved)
  }

  const occupied = occupiedCells(placements)
  const unplaced = FLEET.filter((spec) => !placements.some((p) => p.id === spec.id))
  const allPlaced = unplaced.length === 0

  return (
    <section className="placement">
      <div className="panel">
        <header className="panel-header">
          <h2>Position your fleet</h2>
          <p className="hint">
            Drag a ship to move it. Press <kbd>R</kbd> while dragging, or click a ship, to rotate.
          </p>
        </header>

        <Grid label="Your fleet" className={drag ? 'is-dragging' : undefined}>
          {Array.from({ length: BOARD_SIZE }, (_, row) =>
            Array.from({ length: BOARD_SIZE }, (_, col) => {
              const id = key({ row, col })
              const inPreview = previewKeys.has(id)
              return (
                <div
                  key={id}
                  data-row={row}
                  data-col={col}
                  className={`cell${occupied.has(id) ? ' is-occupied' : ''}${
                    inPreview ? (previewValid ? ' is-preview-ok' : ' is-preview-bad') : ''
                  }`}
                  style={{ gridColumn: col + 2, gridRow: row + 2 }}
                />
              )
            }),
          )}

          {placements.map((placement) => {
            const spec = shipSpec(placement.id)
            const horizontal = placement.orientation === 'horizontal'
            return (
              <div
                key={placement.id}
                className={`ship${drag?.id === placement.id ? ' is-dragging' : ''}`}
                style={{
                  gridColumn: horizontal
                    ? `${placement.col + 2} / span ${spec.length}`
                    : `${placement.col + 2}`,
                  gridRow: horizontal
                    ? `${placement.row + 2}`
                    : `${placement.row + 2} / span ${spec.length}`,
                }}
                onPointerDown={(event) => {
                  event.preventDefault()
                  const rect = event.currentTarget.getBoundingClientRect()
                  const along = horizontal
                    ? (event.clientX - rect.left) / (rect.width / spec.length)
                    : (event.clientY - rect.top) / (rect.height / spec.length)
                  const offset = Math.max(0, Math.min(spec.length - 1, Math.floor(along)))
                  startDrag(placement.id, offset, placement.orientation, event)
                }}
                onClick={() => {
                  if (!movedRef.current) rotate(placement)
                }}
                onKeyDown={(event) => {
                  const actions: Record<string, () => void> = {
                    r: () => rotate(placement),
                    R: () => rotate(placement),
                    ArrowUp: () => nudge(placement, { row: -1, col: 0 }),
                    ArrowDown: () => nudge(placement, { row: 1, col: 0 }),
                    ArrowLeft: () => nudge(placement, { row: 0, col: -1 }),
                    ArrowRight: () => nudge(placement, { row: 0, col: 1 }),
                    Backspace: () => onRemove(placement.id),
                    Delete: () => onRemove(placement.id),
                  }
                  const action = actions[event.key]
                  if (!action) return
                  event.preventDefault()
                  action()
                }}
                tabIndex={0}
                role="button"
                aria-label={`${spec.name}, ${spec.length} cells, ${placement.orientation}. Arrow keys to move, R to rotate.`}
              >
                <span className="ship-label">{spec.name}</span>
              </div>
            )
          })}
        </Grid>
      </div>

      <div className="panel tray">
        <h3>Fleet</h3>
        <ul className="tray-list">
          {FLEET.map((spec) => {
            const placed = placements.some((p) => p.id === spec.id)
            return (
              <li key={spec.id}>
                <div
                  className={`tray-ship${placed ? ' is-placed' : ''}${drag?.id === spec.id ? ' is-dragging' : ''}`}
                  onPointerDown={(event) => {
                    if (placed) return
                    event.preventDefault()
                    startDrag(spec.id, 0, 'horizontal', event)
                  }}
                  role={placed ? undefined : 'button'}
                  aria-label={placed ? `${spec.name} placed` : `Drag ${spec.name} onto the board`}
                >
                  <span className="tray-name">{spec.name}</span>
                  <span className="tray-pips" aria-hidden="true">
                    {Array.from({ length: spec.length }, (_, i) => (
                      <span key={i} className="pip" />
                    ))}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>

        <div className="tray-actions">
          <button type="button" onClick={onRandomize}>
            Randomize
          </button>
          <button type="button" onClick={onClear}>
            Clear
          </button>
          <button type="button" className="primary" disabled={!allPlaced} onClick={onStart}>
            Start game
          </button>
        </div>
        {!allPlaced && <p className="hint">Place all five ships to start.</p>}
      </div>
    </section>
  )
}
