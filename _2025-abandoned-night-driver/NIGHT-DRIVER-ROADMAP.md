# Night Driver: C+ → A Implementation Roadmap

## Vision: "Night Driver - 3 Minute Time Attack"

**Core Loop:**
- 3-minute countdown clock
- Race around circuit avoiding AI cars (appear/disappear as obstacles)
- Max speed for max distance = high score
- Stay on track, avoid collisions, survive with 3 lives

**Scoring:**
- Distance traveled (primary metric)
- Average speed
- Personal best tracking (session-based)

**Penalty System:**
- 2 tires off road: -50 km/h instant penalty
- 4 tires off road: locked to 50 km/h until back on track
- Car contact: -20 km/h per second of contact
- Hard collision: explosion, lose 1 life, restart from 0 km/h at roadside

**Track Design:**
- Shallow S-curves (current style)
- Wide sweeping turns requiring sustained steering adjustments
- Track actively tries to push you off if you don't counter-steer

**Visual Style:**
- Colored cars (avoid copyright issues)
- Authentic 1976 arcade cabinet limitations
- Pole Position-inspired elements

---

## Phase 1: Track Improvements (Foundation)

### 1.1 Horizon/Vanishing Point Shift
- Make vanishing point shift left/right based on upcoming road curve
- Posts converge toward the SHIFTED vanishing point (not center)
- Visual cue: "Road is bending left ahead"

### 1.2 Enhanced Moon Indicator
- Moon shifts more dramatically with curves
- Larger scaling factor for turn visualization
- Acts as "look ahead" indicator

### 1.3 Variety of Turn Types
Create distinct turn sections:
- **Shallow S-curves** (current: 30 posts at ±50 rate)
- **Wide sweeping turns** (100+ posts at ±20-30 rate) - sustained steering required
- **Hairpin turns** (20 posts at ±80-100 rate) - sharp corners
- **Chicanes** (quick left-right-left combinations)

### 1.4 Track Layout Design
Build a proper circuit with variety:
```javascript
const track1 = [
  { length: 100, turn: 0 },      // Long straight - speed up
  { length: 10, turn: -20 },     // Ease into wide left
  { length: 120, turn: -30 },    // LONG wide left sweep - sustained steering
  { length: 10, turn: -20 },     // Ease out
  { length: 80, turn: 0 },       // Straight recovery
  { length: 5, turn: 60 },       // Sharp right hairpin
  { length: 30, turn: 60 },      // Continue hairpin
  { length: 5, turn: 60 },       // Exit hairpin
  { length: 60, turn: 0 },       // Straight
  // ... more variety
];
```

---

## Phase 2: AI Cars (Simple Spawn System)

### 2.1 AI Car Data Structure
```javascript
{
  z: 5000,              // Position ahead on track
  laneOffset: -800,     // Left/center/right position
  speed: 4000,          // Their speed (80-200 km/h range)
  color: '#FF0000',     // Red, blue, yellow, green
}
```

### 2.2 Spawn Logic
- Max 4 cars on screen
- Random spawn at far distance (when old cars pass behind you)
- Random lane positions (left/center/right of road curve)
- Random speeds (slower than player for overtaking challenge)

### 2.3 AI Car Rendering
- Simple colored rectangles (wider at bottom, narrower at top - car shape)
- Follow same 3D projection as posts
- Scale with distance
- Follow road curve (same curveOffset system)

### 2.4 AI Car Movement
- Cars stay at fixed Z position relative to track
- Player catches up from behind (overtaking)
- When player passes, car despawns and new one spawns ahead

---

## Phase 3: Collision Detection & Penalties

### 3.1 Car Sprite Width Detection
Define car collision zones:
```javascript
// Car sprite width = assume 400 units
const leftWheelX = carX - 200;   // Left side of car
const rightWheelX = carX + 200;  // Right side of car
```

### 3.2 Road Boundary Detection (Enhanced)
```javascript
// 2 tires off = one wheel outside road boundary
if (leftWheelX < leftMarkerX || rightWheelX > rightMarkerX) {
  // Instant -50 km/h penalty (one time hit)
  velocity -= 1000;
  twoTiresOffRoad = true;
}

// 4 tires off = BOTH wheels outside
if (leftWheelX < leftMarkerX && rightWheelX < leftMarkerX) {
  // Lock to 50 km/h
  velocity = 1000;
  fourTiresOffRoad = true;
}
```

### 3.3 AI Car Collision Detection
Check overlap between player car and each AI car:
```javascript
// Simple rectangle collision
const playerCarZ = cameraZ;
const carWidth = 400;
const carLength = 300;

for (each AI car) {
  const zOverlap = Math.abs(playerCarZ - aiCar.z) < carLength;
  const xOverlap = Math.abs(carX - aiCar.laneOffset) < carWidth;

  if (zOverlap && xOverlap) {
    // Collision detected!
  }
}
```

### 3.4 Collision Penalty Types

**Soft Contact** (glancing blow):
```javascript
contactTime += deltaTime;
velocity -= 20 * contactTime; // -20 km/h per second
```

**Hard Collision** (head-on or high speed):
```javascript
const speedDifference = Math.abs(velocity - aiCar.speed);
if (speedDifference > 2000) { // 100+ km/h difference
  // EXPLOSION!
  triggerExplosion();
  loseLife();
  velocity = 0;
  isOffTrack = true; // Start at roadside
}
```

---

## Phase 4: Scoring & Timer System

### 4.1 Countdown Timer
```javascript
this.timeRemaining = 180; // 3 minutes in seconds
this.timeRemaining -= deltaTime;
if (this.timeRemaining <= 0) {
  endRace(); // Game over, show results
}
```

### 4.2 Distance Tracking
```javascript
this.totalDistance += velocity * deltaTime;
// Convert to km or miles for display
const distanceKm = Math.floor(this.totalDistance / 1000);
```

### 4.3 Average Speed Calculation
```javascript
const elapsedTime = 180 - this.timeRemaining;
this.averageSpeed = this.totalDistance / elapsedTime;
// Display as km/h
const avgSpeedDisplay = Math.floor(this.averageSpeed / 20);
```

### 4.4 Personal Best Tracking
```javascript
// Session-based (resets on page refresh)
let sessionBestDistance = 0;
let sessionBestAvgSpeed = 0;

// At end of race:
if (totalDistance > sessionBestDistance) {
  sessionBestDistance = totalDistance;
}
```

### 4.5 HUD Display
```
┌─────────────────────────────────┐
│ TIME: 2:34  LIVES: ♥♥♡         │
│ SPEED: 287 km/h                 │
│ DISTANCE: 8.4 km                │
│ AVG SPEED: 215 km/h             │
│ BEST: 12.3 km                   │
└─────────────────────────────────┘
```

---

## Phase 5: Lives & Restart System

### 5.1 Lives Counter
```javascript
this.lives = 3;
this.isRespawning = false;
this.respawnTimer = 0;
```

### 5.2 Explosion Effect
```javascript
function triggerExplosion() {
  // Flash screen white
  // Draw expanding circle (explosion)
  // Play crash sound (future)
  this.isRespawning = true;
  this.respawnTimer = 2.0; // 2 second respawn delay
}
```

### 5.3 Respawn Logic
```javascript
if (isRespawning) {
  respawnTimer -= deltaTime;
  if (respawnTimer <= 0) {
    // Reset car state
    velocity = 0;
    carX = roadCurve + 1200; // Place at roadside (off track)
    lives -= 1;

    if (lives <= 0) {
      gameOver();
    }

    // Respawn AI cars (clear and regenerate)
    aiCars = [];
    spawnAICars();

    isRespawning = false;
  }
}
```

---

## Phase 6: Polish & Refinement

### 6.1 Visual Polish
- Colored AI cars (randomize: red, blue, yellow, green)
- Car headlights (white circles at front)
- Explosion particle effect
- Screen shake on collision
- Better moon graphic (circle with craters?)

### 6.2 Gameplay Tuning
- Test different AI car speeds
- Balance collision penalties
- Adjust track difficulty curve
- Fine-tune turn rates for challenge

### 6.3 End-of-Race Screen
```
┌─────────────────────────────────┐
│        RACE COMPLETE!           │
│                                  │
│  Final Distance:  12.3 km       │
│  Average Speed:   248 km/h      │
│  Lives Remaining: 2/3           │
│                                  │
│  SESSION BEST:    12.3 km ★     │
│                                  │
│  Press SPACE to race again      │
└─────────────────────────────────┘
```

---

## Implementation Order (Step-by-Step)

**Week 1: Track Foundation**
1. Implement horizon/vanishing point shift
2. Enhance moon indicator movement
3. Design varied turn types
4. Build full circuit track layout

**Week 2: AI Cars**
5. Create AI car data structure
6. Implement spawn/despawn system
7. Render colored AI cars
8. AI car movement (relative to player)

**Week 3: Collisions & Penalties**
9. Enhanced road boundary detection (2 vs 4 tires)
10. AI car collision detection
11. Soft contact penalty (-20 km/h/sec)
12. Hard collision with explosion

**Week 4: Scoring & Lives**
13. Countdown timer (3 minutes)
14. Distance tracking
15. Average speed calculation
16. Lives system & respawn
17. HUD display
18. End-of-race screen

**Week 5: Polish**
19. Visual effects (explosion, screen shake)
20. Colored AI cars with variety
21. Gameplay balance tuning
22. Session best tracking

---

## Current Status: Step 0 - Planning Complete ✅

**Next Step:** Phase 1.1 - Implement horizon/vanishing point shift
