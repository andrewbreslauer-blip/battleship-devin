import type { Difficulty } from '../game/types'

const OPTIONS: { id: Difficulty; name: string; blurb: string }[] = [
  { id: 'easy', name: 'Easy', blurb: 'Fires blindly at random cells.' },
  { id: 'medium', name: 'Medium', blurb: 'Hunts, then chases every hit down the line.' },
  { id: 'hard', name: 'Hard', blurb: 'Ranks every cell by how likely it is to hide a ship.' },
]

interface Props {
  difficulty: Difficulty
  onSelect: (difficulty: Difficulty) => void
  onStart: () => void
}

export function StartScreen({ difficulty, onSelect, onStart }: Props) {
  return (
    <section className="panel start-screen">
      <h2>Choose your opponent</h2>
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
        Deploy fleet
      </button>
    </section>
  )
}
