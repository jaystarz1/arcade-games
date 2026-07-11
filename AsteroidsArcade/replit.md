# Asteroids Clone - Classic Arcade Game

## Overview

This is a faithful recreation of Atari's 1979 Asteroids arcade game as a persistent web application. The project implements the original game mechanics including vector-style graphics, physics-based ship movement, asteroid splitting, UFO enemies, and authentic sound effects. The game is built as a cross-platform web application that runs in modern browsers and supports both desktop and mobile gameplay.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Rendering**
- React 18+ with TypeScript for UI components and game state management
- React Three Fiber (R3F) for 3D/WebGL rendering using Three.js under the hood
- Vector-style graphics rendered using Three.js Line geometries to replicate the original's distinctive visual aesthetic
- Canvas-based rendering with full-screen game viewport

**State Management**
- Zustand for game state management (player, asteroids, bullets, UFOs, scoring, lives)
- Single game store (`useAsteroidsGame`) manages all gameplay state including:
  - Game phase (menu, playing, paused, game_over, enter_initials)
  - Ship state (position, velocity, rotation, invincibility)
  - Asteroids with size-based splitting mechanics
  - Bullet lifecycle and collision detection
  - UFO spawning and AI behavior
  - Score tracking and database-backed high score leaderboard (top 10)
- Async high score operations with server API integration

**Input Handling**
- Keyboard controls using React Three Drei's KeyboardControls system
- Touch controls for mobile devices with virtual buttons that dispatch KeyboardEvents
- Control mapping: Arrow keys for movement, Space for fire, H/Shift for hyperspace
- Unified control system that abstracts keyboard and touch inputs
- Touch events simulate keyboard presses for seamless cross-platform gameplay

**Audio System**
- Web Audio API through singleton AudioContext manager
- Sound effects for thrust, firing, explosions, and UFO presence
- Dynamic heartbeat sound that speeds up based on asteroid count
- Audio context management for browser autoplay policies

**UI Components**
- Radix UI primitives for accessible UI components
- Tailwind CSS for styling with custom theme configuration
- Custom CSS variables for theming (HSL-based color system)
- Responsive HUD displaying score, lives, high score, and wave number
- Multiple game screens: Menu, Pause, Game Over, Initials Entry

### Backend Architecture

**Server Framework**
- Express.js server with TypeScript
- Vite development server integration with HMR support
- Custom middleware for request logging and error handling
- Static file serving in production mode

**Build System**
- Vite for frontend bundling with React plugin
- esbuild for backend compilation
- GLSL shader support via vite-plugin-glsl
- Separate build outputs: client to `dist/public`, server to `dist`

**Development Workflow**
- TypeScript strict mode enabled across entire codebase
- Path aliases: `@/` for client source, `@shared/` for shared code
- Module resolution using bundler strategy for modern ESM support

### Data Storage

**Database Layer**
- Drizzle ORM configured for PostgreSQL
- Neon serverless PostgreSQL database (@neondatabase/serverless) with WebSocket support (ws package)
- Schema defined in `shared/schema.ts` for type-safe database operations
- PostgresStorage class implements database persistence for users and high scores
- High scores table: id, initials (3 chars), score (non-negative), createdAt timestamp
- Migration support via drizzle-kit

**API Layer**
- RESTful API endpoints for high scores (GET /api/high-scores, POST /api/high-scores)
- Zod schema validation on server: initials must be 3 chars, score must be non-negative
- Error handling with proper HTTP status codes
- Client-side API utilities with async/await and error logging

**PWA Capabilities**
- Web app manifest with 192x192 and 512x512 PNG icons
- Service worker with cache-first strategy and offline fallback
- Installable as standalone app on mobile/desktop
- Custom install prompt component
- Runtime caching of assets for offline gameplay

### Game Physics & Mechanics

**Physics Implementation**
- Custom physics engine in game controller
- Inertia-based ship movement with velocity decay
- Screen wrapping for all game objects (ship, asteroids, bullets, UFOs)
- Circular collision detection between entities
- Constants defined for gameplay balance (speeds, rotation, lifespans)

**Game Loop**
- React Three Fiber's `useFrame` hook for 60fps game loop
- Frame-based updates for all entity positions and states
- Collision detection runs every frame
- Explosion animations with timer-based fade-out

**Entity Management**
- Asteroids split into smaller sizes when destroyed (large → 2 medium → 2 small each)
- Bullets have limited lifespan and despawn automatically
- UFO spawning on timer with difficulty-based behavior
- Wave progression increases asteroid count

## External Dependencies

### Core Libraries
- **React Three Fiber & Drei**: 3D rendering and utilities for WebGL-based vector graphics
- **Three.js**: Low-level 3D engine powering the rendering
- **React Three Postprocessing**: Visual effects and post-processing pipeline

### UI Framework
- **Radix UI**: Complete suite of accessible UI primitives (dialogs, menus, tooltips, etc.)
- **Tailwind CSS**: Utility-first CSS framework
- **class-variance-authority & clsx**: Dynamic className composition
- **cmdk**: Command menu component

### State & Data Management
- **Zustand**: Lightweight state management
- **TanStack Query (React Query)**: Server state management and caching
- **Drizzle ORM**: Type-safe SQL ORM
- **Zod**: Schema validation (used with Drizzle)

### Database
- **Neon Serverless PostgreSQL**: Cloud PostgreSQL database
- **DATABASE_URL**: Environment variable for database connection string

### Build Tools
- **Vite**: Frontend build tool and dev server
- **TypeScript**: Type safety across the stack
- **esbuild**: Fast JavaScript bundler for server code
- **PostCSS & Autoprefixer**: CSS processing

### Development Tools
- **tsx**: TypeScript execution for development
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay
- **vite-plugin-glsl**: GLSL shader support

### Asset Management
- **@fontsource/inter**: Self-hosted Inter font
- Large asset support configured for GLTF/GLB models and audio files (MP3, OGG, WAV)