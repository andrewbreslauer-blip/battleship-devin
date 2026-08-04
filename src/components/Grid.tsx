import type { ReactNode } from 'react'
import { BOARD_SIZE } from '../game/types'

interface Props {
  label: string
  children: ReactNode
  gridRef?: React.Ref<HTMLDivElement>
  className?: string
}

const COLUMNS = Array.from({ length: BOARD_SIZE }, (_, i) => String.fromCharCode(65 + i))

/** 10x10 board with A-J / 1-10 rulers. Cells and ship overlays are passed in as children. */
export function Grid({ label, children, gridRef, className }: Props) {
  return (
    <div className={`grid${className ? ` ${className}` : ''}`} ref={gridRef} aria-label={label} role="group">
      <div className="ruler-corner" aria-hidden="true" />
      {COLUMNS.map((letter, index) => (
        <div key={letter} className="ruler" style={{ gridColumn: index + 2, gridRow: 1 }} aria-hidden="true">
          {letter}
        </div>
      ))}
      {Array.from({ length: BOARD_SIZE }, (_, index) => (
        <div key={index} className="ruler" style={{ gridColumn: 1, gridRow: index + 2 }} aria-hidden="true">
          {index + 1}
        </div>
      ))}
      {children}
    </div>
  )
}
