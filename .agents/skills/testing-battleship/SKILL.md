---
name: testing-battleship
description: How to run and E2E-test the Battleship React app (dev server base path, drag-and-drop testing, fast win/loss strategies, known pitfalls).
---

# Testing the Battleship app

## Run
- `npm run dev` → app is at **http://localhost:5173/battleship-devin/** (note the base path; the bare root 404s).
- No backend/auth/secrets. React 19 + TS + Vite.

## Flow
Start screen (Easy/Medium/Hard) → "Deploy fleet" → placement (pre-randomized) → "Start game" → battle (two boards + action log) → game-over modal → "Play again".

## Drag-and-drop testing (PlacementPhase)
- Placement uses pointer events + `document.elementFromPoint`; test with **real** mouse down/move/up (computer-use `left_mouse_down` takes no coordinate — `mouse_move` first, then press).
- Capture preview evidence **while the button is held**: `.cell.is-preview-ok` (green) / `.is-preview-bad` (red).
- Ship positions are readable from each ship's `aria-label` ("Carrier, 5 cells, horizontal...") and grid styles; battle cells expose `aria-label` like "Fire at C3" / "C3, miss" / "J1, hit, Carrier sunk" — the stripped page HTML is the fastest way to assert state without pixel-reading.
- Keyboard path: focus a ship, arrows nudge, `R` rotates, Delete removes.
- A plain click (pointer-up with <4px movement) rotates a placed ship in place; the rotation is handled in the pointer-up handler, not a click event.

## Fast win / loss through the UI
- Win (Easy): fire a checkerboard parity pattern ((row+col) even), then chase hits along the line. Takes ~50 shots / ~10 min of batched clicks (1 s wait per shot for the 650 ms CPU reply).
- Loss (Hard): just fire row-by-row misses; the Hard CPU sinks all 17 player cells in ~40 turns.
- Enemy grid geometry (maximized 1024x768 coordinate space): col A x≈178, +23 px/col; row 1 y≈166, +23 px/row. Re-measure from a screenshot after any layout change.

## SVG silhouettes & pegs (post PR #3)
- Ships render as `svg.ship-svg` inside `.ship` (placement) / `.ship-overlay` (battle); tray minis use `.tray-shape`. Sunk ships get `.ship-overlay.is-sunk` (red wreck palette). Shots are `.peg.peg-hit` (red) / `.peg-miss` (white) rendered after overlays; pegs need `position: relative; z-index: 1` or positioned `.ship-overlay` paints above them — verify peg visibility with pixel zooms, not just DOM order.
- Enemy fleet key hides per-hit info: pips use `revealHits=false` (stay neutral until sunk, then all red + strikethrough). Player key uses `revealHits=true` (per-segment). Assert both states around a sink.
- To sink a specific enemy ship quickly, read `cpuBoard.ships` read-only from the React fiber (`document.getElementById('root')`, walk `memoizedState`) and fire only at that ship's cells; a 2-cell Destroyer sinks in 2 shots.
- To get CPU hits on your own ships fast, start a Hard game and fire throwaway shots; Hard finds ships within a few turns. Medium can miss 15+ turns in a row.

## Responsive check
Chrome's minimum window width is ~500 px; to test ~400 px CSS width, size the window to 500 px (`wmctrl -r :ACTIVE: -b remove,maximized_vert,maximized_horz` then `-e 0,0,0,500,1100`) and set 125% zoom (ctrl+equal twice), then assert `window.innerWidth === 400` and `scrollWidth === clientWidth`.

## Devin Secrets Needed
None.
