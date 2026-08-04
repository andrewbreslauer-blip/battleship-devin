import { useEffect, useReducer } from 'react'
import { ActionLog } from './components/ActionLog'
import { BattlePhase } from './components/BattlePhase'
import { PlacementPhase } from './components/PlacementPhase'
import { StartScreen } from './components/StartScreen'
import { countShots } from './game/board'
import { gameReducer, initialState, labelFor } from './state/gameReducer'

const CPU_DELAY_MS = 650

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, initialState)
  const { phase, playerBoard, cpuBoard, activeSide, winner } = state

  useEffect(() => {
    if (phase !== 'battle' || activeSide !== 'cpu') return
    const timer = window.setTimeout(() => dispatch({ type: 'cpuFire' }), CPU_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [phase, activeSide])

  const shotsFired = cpuBoard
    ? countShots(cpuBoard.shots, 'hit') + countShots(cpuBoard.shots, 'miss')
    : 0
  const hits = cpuBoard ? countShots(cpuBoard.shots, 'hit') : 0
  const accuracy = shotsFired > 0 ? Math.round((hits / shotsFired) * 100) : 0

  return (
    <div className="app">
      <header className="app-header">
        <h1>Battleship</h1>
        {phase !== 'setup' && (
          <div className="status-bar">
            <span className="badge">{labelFor(state.difficulty)}</span>
            {phase === 'battle' && (
              <span className="turn-indicator">
                {activeSide === 'player' ? 'Your turn' : 'Enemy is aiming...'}
              </span>
            )}
            {phase !== 'placement' && (
              <span className="stats">
                {shotsFired} shots &middot; {hits} hits &middot; {accuracy}% accuracy
              </span>
            )}
            <button type="button" onClick={() => dispatch({ type: 'restart' })}>
              New game
            </button>
          </div>
        )}
      </header>

      {phase === 'setup' && (
        <StartScreen
          difficulty={state.difficulty}
          onSelect={(difficulty) => dispatch({ type: 'setDifficulty', difficulty })}
          onStart={() => dispatch({ type: 'beginPlacement' })}
        />
      )}

      {phase === 'placement' && (
        <PlacementPhase
          placements={state.placements}
          onPlace={(placement) => dispatch({ type: 'placeShip', placement })}
          onRemove={(id) => dispatch({ type: 'removeShip', id })}
          onRandomize={() => dispatch({ type: 'randomize' })}
          onClear={() => dispatch({ type: 'clearBoard' })}
          onStart={() => dispatch({ type: 'startBattle' })}
        />
      )}

      {(phase === 'battle' || phase === 'over') && playerBoard && cpuBoard && (
        <main className="game-layout">
          <BattlePhase
            playerBoard={playerBoard}
            cpuBoard={cpuBoard}
            canFire={phase === 'battle' && activeSide === 'player'}
            onFire={(target) => dispatch({ type: 'playerFire', target })}
          />
          <ActionLog entries={state.log} />
        </main>
      )}

      {phase === 'over' && (
        <div className="game-over" role="alertdialog" aria-label="Game over">
          <div className="panel game-over-card">
            <h2>{winner === 'player' ? 'Victory' : 'Defeat'}</h2>
            <p>
              {winner === 'player'
                ? `You sank the enemy fleet in ${shotsFired} shots (${accuracy}% accuracy).`
                : 'The enemy sank your entire fleet.'}
            </p>
            <button type="button" className="primary" onClick={() => dispatch({ type: 'restart' })}>
              Play again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
