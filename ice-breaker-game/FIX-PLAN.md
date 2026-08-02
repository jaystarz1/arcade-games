# Ice Breaker: Arctic Survival — Fix Plan

Status: **OUT OF ORDER**. The game is locked out (see "Removing the lockout" at the
bottom). Findings from a full playthrough on 2026-08-01: the game boots and the
authored content is strong (11 narrative events from the Cole Black novel, 5
scenarios, working weather/resource sim), but engine gaps mean it can never be
finished and restarts corrupt state. This file is the repair plan.

## Fixes, ranked

### 1. No ending is ever reachable
`checkGameOver()` (`js/main.js:196`) is defined but called from nowhere. The
243-day timeline just runs forever.
**Fix:** call it from `onDayChange` after daily processing (consumption,
personnel, ice); when it returns a result, route it through `handleGameOver`.

### 2. Event-listener leak on restart
`setupEventSubscriptions()` runs on every `newGame()` AND `resumeGame()` with no
teardown. Observed: "Day 11 begins" fired 4x in one day after restarts, which
means daily food/fuel consumption and frostbite checks run multiplied. Silent
state corruption.
**Fix:** either unsubscribe existing handlers before re-subscribing, or move the
subscription into one-time `Game.init()` so it happens exactly once.

### 3. Clock stalls after scenario restart
After selecting a new scenario the sim sits paused even though "Resuming
game..." logs. The intro modal also blocks the clock on every scenario start.
**Fix:** on scenario start, explicitly set the run/speed state after the intro
modal is dismissed, not before.

### 4. UI staleness
- The scenario-select overlay stays open over a running game. Close it on
  selection.
- The date display lagged the engine by 2 days (Day 10 shown at engine Day 12).
  Drive the readout from the engine tick, not cached strings.

### 5. Ships never move
`js/map.js:142-144` hardcodes all three ships (Xuelong 3, Type 075, Qingdao) at
the "trapped" center position from Day 1, but the story doesn't trap them until
the Day 35 "Trapped" event.
**Fix:** move the ships along a Northwest Passage route each day until the
Trapped narrative event fires, then freeze them.

### 6. Dead air between story beats
After the Day 1 intro the next authored event is Day 15, then 20, 25, 35. A day
is 24 ticks at 1s each at normal speed, so that's minutes of watching numbers on
a static map.
**Fix (pick one or more):** a "fast-forward to next event" control; auto-
accelerate eventless days; interstitial flavor log lines from the perspective
characters.

### 7. Map layout
The hex map fills only the top ~40% of the viewport with black void below. Size
the canvas/hex layout to its container.

### 8. Game over is a blocking alert()
`handleGameOver` (bottom of `js/main.js`) uses `alert()`. Replace with an
in-game end screen via the existing `UI.showScreen` system, showing days
survived, casualties, and the ending text.

### 9. Housekeeping
`data/`, `assets/map/`, `assets/ui/` are empty vestigial folders. Delete or
populate.

## Effort estimate
Roughly one focused day. The hard parts (writing, sim systems, scenario
branching) are already done and good; this is all wiring.

## Removing the lockout (do this as the LAST step of the fix pass)
1. `index.html`: delete the `<script>window.OUT_OF_ORDER = true;</script>` line
   in `<head>` and the entire `<!-- OUT OF ORDER lockout -->` block at the top
   of `<body>` (overlay div + its style + its script).
2. `js/main.js`: remove the `if (window.OUT_OF_ORDER) return;` guard in the
   DOMContentLoaded handler.
3. `../arcade/index.html`: remove `outOfOrder: true` from the ice-breaker entry
   in `GAMES` (the sign/guards key off that flag and can stay in the code).
4. Verify: serve locally, play from the arcade shell AND by direct URL, confirm
   a game-over is reachable and restarts don't double-fire day events.
