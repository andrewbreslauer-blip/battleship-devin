import { type Orientation, type ShipId, shipSpec } from '../game/types'

interface Props {
  id: ShipId
  orientation: Orientation
}

const U = 40

function hullPath(long: number): string {
  return [
    `M2 20`,
    `Q2 11 16 8`,
    `L${long - 30} 8`,
    `Q${long - 8} 12 ${long - 2} 20`,
    `Q${long - 8} 28 ${long - 30} 32`,
    `L16 32`,
    `Q2 29 2 20`,
    `Z`,
  ].join(' ')
}

function Turret({ x }: { x: number }) {
  return (
    <g className="ship-detail">
      <circle cx={x} cy={20} r={5.5} />
      <rect x={x} y={18.4} width={11} height={3.2} rx={1.6} />
    </g>
  )
}

function Details({ id, long }: { id: ShipId; long: number }) {
  switch (id) {
    case 'carrier':
      return (
        <>
          <path
            className="ship-deck"
            d={`M6 14 L${long - 26} 11 L${long - 10} 20 L${long - 26} 29 L6 26 Q3 20 6 14 Z`}
          />
          <path className="ship-line" d={`M14 20 L${long - 22} 20`} strokeDasharray="7 5" />
          <rect className="ship-detail" x={long * 0.42} y={27} width={22} height={7} rx={2} />
        </>
      )
    case 'battleship':
      return (
        <>
          <rect className="ship-detail" x={long * 0.42} y={13} width={long * 0.2} height={14} rx={3} />
          <Turret x={long * 0.16} />
          <Turret x={long * 0.28} />
          <Turret x={long * 0.74} />
        </>
      )
    case 'cruiser':
      return (
        <>
          <rect className="ship-detail" x={long * 0.44} y={14} width={long * 0.22} height={12} rx={3} />
          <Turret x={long * 0.2} />
        </>
      )
    case 'submarine':
      return (
        <>
          <rect className="ship-detail" x={long * 0.42} y={13} width={long * 0.18} height={9} rx={4} />
          <path className="ship-line" d={`M${long * 0.16} 20 L${long * 0.86} 20`} />
        </>
      )
    case 'destroyer':
      return <rect className="ship-detail" x={long * 0.4} y={14} width={long * 0.26} height={12} rx={3} />
  }
}

/** Top-down ship silhouette; drawn horizontally (bow to the right) and rotated for vertical ships. */
export function ShipShape({ id, orientation }: Props) {
  const long = shipSpec(id).length * U
  const horizontal = orientation === 'horizontal'
  const hull =
    id === 'submarine'
      ? `M2 20 Q4 9 22 8 L${long - 24} 8 Q${long - 4} 11 ${long - 2} 20 Q${long - 4} 29 ${long - 24} 32 L22 32 Q4 31 2 20 Z`
      : hullPath(long)

  return (
    <svg
      className="ship-svg"
      viewBox={horizontal ? `0 0 ${long} ${U}` : `0 0 ${U} ${long}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <g transform={horizontal ? undefined : `rotate(90 ${U / 2} ${U / 2})`}>
        <path className="ship-hull" d={hull} />
        <Details id={id} long={long} />
      </g>
    </svg>
  )
}
