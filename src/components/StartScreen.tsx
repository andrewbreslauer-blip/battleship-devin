import type { Difficulty } from '../game/types'

const OPTIONS: { id: Difficulty; name: string; blurb: string }[] = [
  { id: 'easy', name: 'Easy', blurb: 'The computer fires at random. A relaxed game.' },
  { id: 'medium', name: 'Medium', blurb: 'The computer searches the board and finishes off any ship it hits.' },
  { id: 'hard', name: 'Hard', blurb: 'The computer calculates the most likely spot for your ships before every shot.' },
]

interface Props {
  difficulty: Difficulty
  onSelect: (difficulty: Difficulty) => void
  onStart: () => void
}

export function StartScreen({ difficulty, onSelect, onStart }: Props) {
  return (
    <section className="panel start-screen">
      <h2>Battleship</h2>
      <p className="start-intro">
        Sink all five of the computer's ships before it sinks yours. First, pick how tough the
        computer should be:
      </p>
      <div className="difficulty-options" role="radiogroup" aria-label="Difficulty">
        {OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={difficulty === option.id}
            className={`difficulty-option${difficulty === option.id ? ' is-selected' : ''}`}
            onClick={() => onSelect(option.id)}
          >
            <span className="difficulty-name">{option.name}</span>
            <span className="difficulty-blurb">{option.blurb}</span>
          </button>
        ))}
      </div>
      <button type="button" className="primary" onClick={onStart}>
        Next: place your ships
      </button>
    </section>
  )
}
