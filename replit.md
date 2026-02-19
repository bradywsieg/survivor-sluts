# Survivor Fantasy League

## Overview

A fantasy sports-style web application for tracking Survivor TV show leagues across multiple seasons. Users manage teams, contestants, and weekly scoring to track standings and performance. The app features a tropical/adventure theme inspired by the Survivor TV show aesthetic. Branding: "Survivor Sluts". Admin area is PIN-protected (PIN: 1911). Configured as a Progressive Web App (PWA) for home screen installation.

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
- **Admin Protection**: PIN-based authentication via `X-Commissioner-Pin` header, validated server-side

### Data Model
The application manages nine core entities:
1. **Seasons** - Seasons of the Survivor show (e.g., Season 49, Season 50)
2. **Tribes** - In-game tribes per season with name and hex color (e.g., Vatu #7B2D8E, Cila #E87722, Kalo #00A79D)
3. **Teams** - Fantasy league teams with name, image, and season association
4. **Contestants** - Survivor show contestants, assigned to teams, tribes, and seasons; have optional bio text; can be eliminated
5. **Weeks** - Episode/week tracking for scoring, tied to a season
6. **Contestant Scores** - Computed points earned by contestants per week (recalculated from events)
7. **Team Bonuses** - Additional team-level bonus points per week
8. **Season Event Settings** - Scoring rubric per season (event name, key, point value). Seeded from CSV on first access.
9. **Contestant Events** - Individual event assignments per contestant per week. Custom events use pointsOverride; standard events look up points from season_event_settings.

All teams, contestants, tribes, and weeks are scoped to a season via `seasonId` foreign key.

### Scoring System
- Event-based scoring: admins assign events to contestants per week using multi-select or custom events
- Points are computed from season_event_settings (rubric) unless overridden by pointsOverride
- Editing rubric point values retroactively recalculates all scores for that season
- contestant_scores table stores computed totals per contestant per week
- Default rubric seeded from `server/data/PointValues_Survivor.csv` (42 events)

### Pages
- `/` - Dashboard with hero banner, standings table, charts, season dropdown, Idol & Advantage Watch section
- `/teams` - Teams CRUD management with season filtering, tribe color treatments on contestant pills
- `/contestants` - Contestants CRUD management with season filtering, tribe assignment, bio field with See more/less
- `/rules` - Public read-only scoring rubric display with season selector
- `/admin` - PIN-protected admin area with 4 tabs: Enter Results, Point Value Settings, Seasons, Tribes

### Design System
- Survivor/adventure theme with tropical motifs
- Custom fonts: Slackey (headings - Survivor-style), Inter (body), Architects Daughter (accent)
- HSL-based color system with CSS custom properties for theming
- Responsive layout with mobile-first approach

### Project Structure
```
client/           # React frontend
  src/
    components/   # Reusable UI components (SeasonSelector, TeamCard, PinGate, etc.)
    pages/        # Route page components (Dashboard, Teams, Contestants, Admin, Rules, Seasons)
    hooks/        # Custom React hooks (use-season, use-toast)
    lib/          # Utilities, query client, adminApi helper
  public/         # Static assets (PWA manifest, icons, service worker)
server/           # Express backend
  routes.ts       # API route definitions with PIN middleware
  storage.ts      # Database access layer with event/recalc methods
  db.ts           # Database connection
  data/           # CSV data files for rubric seeding
shared/           # Shared types and schema
  schema.ts       # Drizzle schema definitions (8 tables)
```

## Recent Changes
- Added Tribes feature: tribes table with seasonId and hex color, tribeId/bio fields on contestants
- Tribe CRUD in Admin area (Tribes tab) with color picker UI
- Moved Seasons management into Admin as a tab, removed standalone /seasons page
- Admin now has 4 tabs: Enter Results, Point Value Settings, Seasons, Tribes
- ContestantCard shows tribe color left border, tribe name, and bio with See more/less toggle
- ContestantFormDialog includes tribe dropdown and bio textarea
- TeamCard contestant pills styled with tribe colors (background + border)
- ContestantPerformanceChart avatars have tribe color ring outlines
- Dashboard chart renamed to "Team Scoring by Week"
- Added Idol & Advantage Watch dashboard section (event-based idol/advantage tracking)
- Dashboard API returns tribes and idolWatch data
- Seeded Season 50 with 3 tribes (Vatu/purple, Cila/orange, Kalo/teal) and contestant bios
- PWA configured with custom app icon, manifest, and service worker

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
