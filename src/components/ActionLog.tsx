import { useEffect, useRef } from 'react'
import type { LogEntry } from '../game/types'

interface Props {
  entries: LogEntry[]
}

export function ActionLog({ entries }: Props) {
  const listRef = useRef<HTMLOListElement>(null)

  useEffect(() => {
    const list = listRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [entries.length])

  return (
    <div className="panel log">
      <div className="panel-header">
        <h3>Action log</h3>
        <span className="log-count">{entries.length}</span>
      </div>
      <ol className="log-list" ref={listRef} aria-live="polite" aria-label="Action log">
        {entries.map((entry) => (
          <li key={entry.id} className={`log-entry log-${entry.kind}`}>
            <span className="log-turn">{entry.turn ? `T${entry.turn}` : '--'}</span>
            <span className="log-text">{entry.text}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
