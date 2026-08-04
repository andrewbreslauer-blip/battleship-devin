# battleship-devin

Browser Battleship against a computer opponent.

**Play: https://andrewbreslauer-blip.github.io/battleship-devin/**

## Game

- Classic 10x10 board, standard fleet: Carrier 5, Battleship 4, Cruiser 3, Submarine 3, Destroyer 2.
- Drag and drop your ships (or hit **Randomize**); click a ship or press <kbd>R</kbd> to rotate.
- Alternating single shots; first side to sink the whole enemy fleet wins.
- Every shot, sinking and result is recorded in the running action log.

### Difficulty

| Level | Behaviour |
| --- | --- |
| Easy | Fires at a random untried cell. |
| Medium | Hunts with parity search, then chases hits along the line they form. |
| Hard | Scores every cell by how many valid placements of the remaining ships cover it, weighted towards open hits. |

## Development

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # game-core unit tests
npm run lint       # oxlint
npm run typecheck  # tsc
npm run build      # production build into dist/
```

`src/game/` holds the pure, framework-free rules and AI; `src/state/gameReducer.ts` drives the
game; `src/components/` is the React UI. Pushing to `main` builds and publishes to GitHub Pages.
