# Moon Lander Game

## Overview

This is a physics-based Moon Lander game built as a full-stack web application. The game features a lunar lander that players must guide to a safe landing on randomly generated terrain while managing fuel consumption. The application includes desktop keyboard controls and mobile touch controls, with game state management, scoring systems, and persistent high scores.

The tech stack combines React Three Fiber for 3D rendering, Express for the backend server, and Drizzle ORM with PostgreSQL for data persistence. The UI is built with Radix UI components and styled with Tailwind CSS.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**3D Game Engine**: React Three Fiber (@react-three/fiber) with Drei helpers provides WebGL-based 3D rendering in the browser. The game uses canvas-based rendering with physics calculations performed in JavaScript, ensuring frame-rate independent movement through delta time calculations.

**Game State Management**: Zustand stores manage global game state with two primary stores:
- `useGame` - Controls game phases (ready, playing, ended) and lifecycle methods (start, restart, end)
- `useAudio` - Manages sound effects and background music with mute/unmute functionality

**Component Structure**: The main game component (`LunarLander.tsx`) is a self-contained canvas implementation that handles:
- Physics simulation (gravity, thrust, rotation)
- Collision detection
- Procedural terrain generation
- Particle effects for thrust visualization
- Touch and keyboard input handling
- Game screens (start, playing, game over)

**UI Layer**: Radix UI primitives provide accessible, unstyled components that are styled with Tailwind CSS using a custom theme system with CSS custom properties for colors and spacing. The UI includes buttons, cards, and dialogs for game controls and information display.

**Responsive Design**: The application detects mobile devices using a custom `useIsMobile` hook and adapts controls accordingly:
- Desktop: Arrow keys for rotation/thrust, Space for start/restart
- Mobile: Virtual D-pad with visual feedback and touch event handling

### Backend Architecture

**Server Framework**: Express.js server with TypeScript, using ES modules. The server provides:
- API route registration through a modular routes system
- Request/response logging middleware
- Error handling middleware
- Static file serving in production
- Vite development server integration in development mode

**Development vs Production**: The server conditionally sets up Vite's development middleware with HMR support during development, while serving pre-built static assets in production. Build process uses Vite for frontend bundling and esbuild for server bundling.

**Storage Layer**: An abstraction layer (`IStorage` interface) with an in-memory implementation (`MemStorage`) provides CRUD operations for user data. This design allows easy migration to database-backed storage without changing application code.

### Data Storage

**ORM**: Drizzle ORM configured for PostgreSQL with schema definitions in `shared/schema.ts`. The schema currently defines a users table with id, username, and password fields.

**Database**: PostgreSQL via Neon's serverless driver (`@neondatabase/serverless`), configured through environment variables (`DATABASE_URL`). Migrations are stored in the `./migrations` directory.

**Schema Validation**: Zod schemas derived from Drizzle table definitions provide runtime type validation for insert operations.

**Session Management**: The application includes `connect-pg-simple` for PostgreSQL-backed session storage, though session implementation appears incomplete in the current codebase.

### External Dependencies

**UI Component Library**: Extensive use of Radix UI primitives (@radix-ui/react-*) for accessible, unstyled components including dialogs, dropdowns, accordions, tooltips, and form elements.

**3D Graphics Stack**:
- @react-three/fiber - React renderer for Three.js
- @react-three/drei - Useful helpers and abstractions for React Three Fiber
- @react-three/postprocessing - Post-processing effects
- three.js (peer dependency) - WebGL 3D library

**Data Fetching**: TanStack Query (@tanstack/react-query) for server state management with custom fetch wrappers that handle authentication and error states.

**Styling**: 
- Tailwind CSS for utility-first styling
- class-variance-authority for variant-based component styling
- clsx for conditional className composition
- @fontsource/inter for typography

**Build Tools**:
- Vite - Frontend build tool and dev server
- esbuild - Server-side bundling
- TypeScript - Type checking
- PostCSS with Autoprefixer

**Database Tools**:
- Drizzle Kit - Schema migrations and management
- @neondatabase/serverless - Serverless PostgreSQL client
- drizzle-zod - Zod schema generation from Drizzle schemas

**Game-Specific**: The game appears designed to include audio support (references to background music and sound effects) though audio file handling is configured but implementation details are in the game component.