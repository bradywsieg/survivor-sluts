# Survivor Fantasy League

## Overview

A fantasy sports-style web application for tracking Survivor TV show leagues across multiple seasons. Users manage teams, contestants, and weekly scoring to track standings and performance. The app features a tropical/adventure theme inspired by the Survivor TV show aesthetic. No authentication required - all users can edit data.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack React Query for server state, local React state for UI
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style variant)
- **Charts**: Recharts for data visualization (standings, performance charts)
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Runtime**: Node.js with Express
- **API Pattern**: RESTful JSON API under `/api/*` routes
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Validation**: Zod with drizzle-zod for type-safe validation

### Data Model
The application manages six core entities:
1. **Seasons** - Seasons of the Survivor show (e.g., Season 49, Season 50)
2. **Teams** - Fantasy league teams with name, image, and season association
3. **Contestants** - Survivor show contestants, assigned to teams and seasons, can be eliminated
4. **Weeks** - Episode/week tracking for scoring, tied to a season
5. **Contestant Scores** - Points earned by contestants per week
6. **Team Bonuses** - Additional team-level bonus points per week

All teams, contestants, and weeks are scoped to a season via `seasonId` foreign key.

### Pages
- `/` - Dashboard with hero banner, standings table, charts, season dropdown
- `/teams` - Teams CRUD management with season filtering
- `/contestants` - Contestants CRUD management with season filtering
- `/scoring` - Weekly scoring entry with season and week selectors
- `/seasons` - Seasons CRUD management

### Design System
- Survivor/adventure theme with tropical motifs
- Custom fonts: Slackey (headings - Survivor-style), Inter (body), Architects Daughter (accent)
- HSL-based color system with CSS custom properties for theming
- Responsive layout with mobile-first approach

### Project Structure
```
client/           # React frontend
  src/
    components/   # Reusable UI components (SeasonSelector, TeamCard, etc.)
    pages/        # Route page components (Dashboard, Teams, Contestants, Scoring, Seasons)
    hooks/        # Custom React hooks (use-season, use-toast)
    lib/          # Utilities and query client
server/           # Express backend
  routes.ts       # API route definitions
  storage.ts      # Database access layer
  db.ts           # Database connection
shared/           # Shared types and schema
  schema.ts       # Drizzle schema definitions
```

## Recent Changes
- Added Seasons entity for multi-season support
- All data (teams, contestants, weeks) scoped to seasons via `seasonId`
- Season dropdown added to all pages (Dashboard, Teams, Contestants, Scoring)
- Seasons CRUD page at /seasons
- Existing data migrated to Season 49
- Changed heading font from Titan One to Slackey (closer to Survivor TV show aesthetic)
- Fixed contestant edit dialog to properly persist existing data
- Fixed avatar fallback showing "??" when no name entered

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connected via `DATABASE_URL` environment variable
- **Drizzle Kit**: Database migrations and schema management (`db:push` command)

### Frontend Libraries
- **@tanstack/react-query**: Async state management and caching
- **shadcn/ui + Radix UI**: Accessible component primitives
- **Recharts**: Data visualization for standings and charts
- **wouter**: Client-side routing

### Backend Libraries
- **express**: HTTP server framework
- **drizzle-orm**: Type-safe database queries
- **zod**: Runtime schema validation
- **connect-pg-simple**: PostgreSQL session storage (available if sessions needed)
