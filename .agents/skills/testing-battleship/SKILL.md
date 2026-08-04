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

## Responsive check
Chrome's minimum window width is ~500 px; to test ~400 px CSS width, size the window to 500 px (`wmctrl -r :ACTIVE: -b remove,maximized_vert,maximized_horz` then `-e 0,0,0,500,1100`) and set 125% zoom (ctrl+equal twice), then assert `window.innerWidth === 400` and `scrollWidth === clientWidth`.

## Devin Secrets Needed
None.
