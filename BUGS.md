# Bugs

A running log of bugs flagged for the Battleship game, with status and the PR that addressed each.

Live game: https://andrewbreslauer-blip.github.io/battleship-devin/

| # | Bug | Area | Status | PR |
|---|-----|------|--------|----|
| 1 | Directions on the first screen ("choose your opponent") were confusingly worded | Start screen | Fixed | [#3](https://github.com/andrewbreslauer-blip/battleship-devin/pull/3) |
| 2 | Ship outlines were plain rectangles instead of the shape of the actual ship type | Placement / battle boards | Fixed | [#3](https://github.com/andrewbreslauer-blip/battleship-devin/pull/3) |
| 3 | The fleet key revealed hidden info — opponent ship positions and which ship you hit | Battle / fleet key | Fixed | [#3](https://github.com/andrewbreslauer-blip/battleship-devin/pull/3) |
| 4 | The defeat/victory screen was not overlaid on top of the shot icons (pegs showed through) | Game-over overlay | Fixed | [#5](https://github.com/andrewbreslauer-blip/battleship-devin/pull/5) |
| 5 | On a minimized/narrow screen, the "Destroyer" label expanded beyond the ship icon | Placement (responsive) | Fixed | [#6](https://github.com/andrewbreslauer-blip/battleship-devin/pull/6) |
| 6 | Start-screen button text "place your ships" should be capitalized | Start screen | Fixed | [#7](https://github.com/andrewbreslauer-blip/battleship-devin/pull/7) |
| 7 | Placement rotation was unreliable: tapping sometimes didn't rotate, it only turned one direction, and there was no feedback when a ship had no room to rotate | Placement (rotation) | Fixed | [#8](https://github.com/andrewbreslauer-blip/battleship-devin/pull/8) |

## Game logic testing

The core game logic has been fully stress-tested and **no defects were found**.

The pure game rules and AI are separated from the React UI and covered by an automated unit-test suite (Vitest). Rather than a handful of fixed cases, the board tests validate hundreds of seeded random fleets for bounds and no-overlap, plus hit/miss, sinking, and win detection. The AI tests play many complete, seeded games at every difficulty (Easy, Medium, Hard), asserting that every shot is legal and unique, that games always terminate, and that stronger difficulties win in fewer shots on average — exercising the hunt/target and probability-density logic across a wide range of board states. The suite runs in CI on every change and is currently fully green. All defects listed below were UI/presentation issues surfaced by end-to-end browser testing, not flaws in the game logic itself.

## Manual play testing

Manual play testing surfaced the UI/UX issues below. Playing the game end-to-end in the browser — placing ships, rotating, and running full matches at each difficulty — revealed presentation and interaction problems that automated logic tests don't catch, such as confusing wording, ships rendered as rectangles, information leaks in the fleet key, overlay stacking, responsive label overflow, and unreliable rotation feedback. Each was reproduced, fixed, and re-verified in the browser.

## Details

### 1. Confusing start-screen directions
The first screen didn't make it clear you play against the computer and must pick a difficulty before placing ships. Reworded with a goal sentence, plain difficulty blurbs, and a clearer CTA.

### 2. Ships drawn as rectangles
Ships were generic rectangles. Added per-class top-down SVG silhouettes (carrier, battleship, cruiser, submarine, destroyer) used on the placement board, fleet tray, your battle board, and revealed sunk enemy ships.

### 3. Fleet key leaked hidden information
The enemy fleet key filled hit pips as you hit a ship, revealing which ship you'd struck before sinking it. The enemy key now stays neutral until a ship is fully sunk; hits show only anonymous pegs and the ship's identity/position appears only once sunk (standard rules). Your own fleet still shows per-segment damage.

### 4. Defeat screen behind shot icons
A z-index fix that lifted shot pegs above ship silhouettes also lifted them above the game-over overlay. Gave the overlay its own higher stacking context so the victory/defeat screen sits on top.

### 5. Destroyer label overflowing at narrow widths
The fixed-size nowrap ship label spilled into neighboring cells on small screens. The label now scales with cell size and is clipped to the ship's footprint.

### 6. Uncapitalized CTA
Start-screen button changed from "Next: place your ships" to "Next: Place Your Ships".

### 7. Unreliable placement rotation
- Tap-vs-drag detection misclassified small taps as drags; switched to a Euclidean distance threshold.
- Rotation kept a fixed corner origin, so it silently failed (felt one-way) when that corner didn't fit; it now pivots on the grabbed cell and slides to the nearest legal fit, rotating in place without drifting.
- When no orientation fits, the ship briefly flashes red and shakes (replayed on every tap; disabled under reduced-motion).
