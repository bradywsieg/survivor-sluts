# Survivor Fantasy League

## Overview

A fantasy sports-style web application for tracking Survivor TV show leagues. Users manage teams, contestants, and weekly scoring to track standings and performance across a season. The app features a tropical/adventure theme inspired by the Survivor TV show aesthetic.

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
The application manages five core entities:
1. **Teams** - Fantasy league teams with name and image
2. **Contestants** - Survivor show contestants, assigned to teams, can be eliminated
3. **Weeks** - Episode/week tracking for scoring
4. **Contestant Scores** - Points earned by contestants per week
5. **Team Bonuses** - Additional team-level bonus points per week

### Design System
- Survivor/adventure theme with tropical motifs
- Custom fonts: Titan One (headings), Inter (body), Architects Daughter (accent)
- HSL-based color system with CSS custom properties for theming
- Responsive layout with mobile-first approach

### Project Structure
```
client/           # React frontend
  src/
    components/   # Reusable UI components
    pages/        # Route page components
    hooks/        # Custom React hooks
    lib/          # Utilities and query client
server/           # Express backend
  routes.ts       # API route definitions
  storage.ts      # Database access layer
  db.ts           # Database connection
shared/           # Shared types and schema
  schema.ts       # Drizzle schema definitions
```

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