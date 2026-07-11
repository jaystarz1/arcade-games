# Night Driver (1976) - Classic Arcade Game Recreation

A faithful recreation of Atari's 1976 arcade classic **Night Driver**, built with vanilla HTML5, CSS3, and JavaScript.

## About the Game

Night Driver was one of the earliest racing games, featuring a first-person perspective as you navigate a treacherous highway at night. The game uses simple vector graphics to simulate a 3D perspective, with white road markers indicating the track edges.

### Original Game Features
- First-person driving perspective
- Progressive difficulty (speed increases over time)
- Night-time racing atmosphere
- Simple but addictive gameplay
- Time-based scoring system

## This Recreation

This modern HTML5 recreation stays true to the original while adding some quality-of-life improvements:

### Features
- **Authentic gameplay** - Maintains the feel of the 1976 original
- **Responsive controls** - Keyboard controls with smooth car movement
- **Progressive difficulty** - Speed increases as you survive longer
- **Score tracking** - Track your best runs
- **Modern web technologies** - Pure HTML5 Canvas, no dependencies
- **Mobile-friendly** - Responsive design (touch controls coming)

### Controls
- **Arrow Keys** or **A/D** - Steer left/right
- **Space** - Start game / Restart after game over

## Project Structure

```
night-driver/
├── night-driver.html           # Main game file (current version)
├── night-driver-v2.html        # Version 2 - baseline with basic gameplay
├── night-driver-v3.html        # Version 3 - improved physics
├── night-driver-v4.html        # Version 4 - added scoring
├── night-driver-v5.html        # Version 5 - enhanced graphics
├── night-driver-v6.html        # Version 6 - difficulty progression
├── night-driver-v7.html        # Version 7 - AI cars attempt (in progress)
├── night-driver-v8.html        # Version 8 - refined AI cars
├── night-driver-v9.html        # Version 9 - current stable version
├── car.png                     # Player car sprite
├── manifest.json               # PWA manifest (future use)
├── README.md                   # This file
├── AI-CARS-WORKING-BASELINE.md # Development notes for AI cars
├── NIGHT-DRIVER-ROADMAP.md     # Development roadmap
├── PHASE1-STATUS.md            # Phase 1 development status
└── PHASE2-STATUS.md            # Phase 2 development status
```

## Development Roadmap

### Phase 1: Core Gameplay ✅
- [x] Basic track rendering with perspective
- [x] Car control (left/right steering)
- [x] Collision detection with road edges
- [x] Speed and difficulty progression
- [x] Score tracking system
- [x] Game over and restart functionality

### Phase 2: AI Traffic 🚧
- [ ] Traffic cars with proper spacing
- [ ] Multiple traffic patterns
- [ ] Collision detection with traffic
- [ ] Traffic speed variations
- [ ] Overtaking mechanics

### Phase 3: Enhanced Features (Future)
- [ ] Sound effects and music
- [ ] High score persistence (localStorage)
- [ ] Power-ups and bonuses
- [ ] Different track layouts
- [ ] Touch/mobile controls
- [ ] Multiplayer/leaderboard

## Technical Details

### Canvas Rendering
- Uses HTML5 Canvas for all rendering
- 60 FPS game loop using `requestAnimationFrame`
- Perspective simulation using scale calculations
- Smooth scrolling background effect

### Physics
- Simple velocity-based movement
- Gradual acceleration/deceleration
- Collision detection using road boundaries
- Progressive speed increases

### Code Quality
- Well-commented code
- Modular structure for easy feature additions
- No external dependencies
- Performance-optimized rendering

## Running the Game

### Option 1: Direct HTML
Simply open any of the `.html` files in a modern web browser.

### Option 2: Local Server (Recommended)
```bash
# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (if you have http-server installed)
npx http-server
```

Then navigate to `http://localhost:8000/night-driver.html`

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Partial support (keyboard required for now)

## Development Notes

See the following files for detailed development information:
- `NIGHT-DRIVER-ROADMAP.md` - Full feature roadmap
- `PHASE1-STATUS.md` - Phase 1 completion details
- `PHASE2-STATUS.md` - Phase 2 progress
- `AI-CARS-WORKING-BASELINE.md` - Notes on AI traffic implementation

## Version History

- **v9** (Current) - Stable baseline without AI cars
- **v8** - Attempted AI car integration (performance issues)
- **v7** - First AI car implementation
- **v6** - Added difficulty progression
- **v5** - Enhanced graphics and visual effects
- **v4** - Scoring system implementation
- **v3** - Improved physics and controls
- **v2** - Basic gameplay foundation
- **v1** - Initial prototype

## Credits

**Original Game**: Atari, Inc. (1976)
**Recreation by**: Jay Tarzwell
**Purpose**: Educational/portfolio project

## License

This is a fan recreation for educational purposes. Night Driver is a trademark of Atari, Inc.

## Contributing

This is a personal project, but suggestions and improvements are welcome! Feel free to:
- Report bugs
- Suggest features
- Share your high scores
- Fork and experiment

## Contact

**Jay Tarzwell**
- Website: [thechatbotgenius.com](https://thechatbotgenius.com)
- Email: jay@barkerhrs.com
- GitHub: @jaytarzwell

---

**Play responsibly and enjoy the nostalgia!** 🏎️💨
