# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React-based status dashboard for Home Assistant that displays device status, system metrics, and historical data. The application has two main routes:
- `/` - Public dashboard view (read-only display of configured tiles)
- `/admin` - Admin interface for configuring Home Assistant connection and dashboard tiles

**Key Security Feature:** All credentials (Home Assistant URL and token) are stored only in browser localStorage, never in code or git.

## Development Commands

```bash
# Start development server (Vite on port 5173)
npm run dev

# Production build (TypeScript compilation + Vite build)
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Architecture

### Routing Structure

The app uses React Router with two main pages:
- **Dashboard** (`src/pages/Dashboard.tsx`) - Public view that renders configured tiles
- **Admin** (`src/pages/Admin.tsx`) - Admin view for configuration and tile management

### Home Assistant Integration

**Service Layer:** `src/services/homeassistant.ts` (`haService`)
- Singleton service that wraps Home Assistant REST API
- Must be configured with `configure({ url, token })` before use
- Stores axios client instance for all API calls
- Key methods:
  - `testConnection()` - Validates API connectivity
  - `getStates()` - Fetches all entity states
  - `getState(entityId)` - Fetches single entity state
  - `callService(domain, service, data)` - Calls HA services (turn_on, turn_off, etc.)
  - `getHistory(entityId, startTime, endTime)` - Fetches historical data

### Configuration Storage

Two separate localStorage keys:
1. `ha_config` - Home Assistant connection config `{ url, token }`
2. `dashboard_config` - Dashboard configuration `{ title, tiles[] }`

Both pages load these configs on mount. Changes are saved immediately to localStorage.

### Tile System

**Type Hierarchy:** Defined in `src/types/dashboard.ts`
- `BaseTile` - Common properties (id, type, title, order)
- Four tile types:
  - `ValueTile` - Display single entity value with optional icon/unit
  - `MultiValueTile` - Display multiple entity values in one tile
  - `ButtonTile` - Execute service on button press
  - `ToggleTile` - Toggle switch for entities (lights, switches)

**Tile Components:** Located in `src/components/tiles/`
- Each tile type has its own component
- Components fetch entity states from `haService` on mount and set up polling intervals
- Tiles are rendered dynamically in Dashboard based on their `type` property

**Tile Management:**
- Created/edited via `TileEditor` component in Admin page
- Stored in `dashboardConfig.tiles` array
- Each tile has unique ID (generated with `crypto.randomUUID()`)

### Component Structure

**Modal Components:**
- `ConfigModal` - Home Assistant connection setup with connection testing and CORS error handling
- `TileEditor` - Tile creation/editing with type-specific fields

**Tile Rendering:**
Dashboard page uses `renderTile(tile)` function that switches on tile type and returns appropriate component.

## CORS Configuration

The app requires CORS configuration in Home Assistant's `configuration.yaml`:

```yaml
http:
  cors_allowed_origins:
    - "http://localhost:5173"  # Development
    - "https://your-domain.com"  # Production
```

The `ConfigModal` component detects CORS errors and shows inline help with correct configuration.

## Deployment Notes

- Production builds go to `dist/` folder
- Designed to be served as static files (nginx, Docker, etc.)
- See README.md sections on "Deployment für Production" and "Nginx Proxy Manager Setup"
- HTTPS required for production to avoid mixed content issues
- The app detects HTTPS context and shows appropriate warnings in ConfigModal

## State Management

- No global state library (Redux, Zustand, etc.)
- State managed locally in components with React hooks
- Configuration persisted to localStorage
- Each tile component manages its own entity state and polling

## Important Patterns

1. **Lazy configuration loading:** Both pages check localStorage for configs on mount, only show content when configured
2. **Polling pattern:** Tile components use `setInterval` with cleanup in `useEffect` return
3. **Type safety:** Strong TypeScript types for all HA entities and tile configurations
4. **Error handling:** ConfigModal provides user-friendly error messages for common issues (CORS, auth, 404)
