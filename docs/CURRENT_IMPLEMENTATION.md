# Current Implementation Documentation

## Overview
This application is a Family Tree management system built with Next.js 15, Supabase, and ReactFlow. It allows users to manage family members and relationships, visualizing them in an interactive family tree.

## Architecture

### Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database & Auth**: Supabase
- **State Management**:
  - **Server State**: React Query (TanStack Query)
  - **Client State**: Zustand
- **Visualization**: ReactFlow + Dagre (Auto-layout)
- **Styling**: Tailwind CSS 4 + shadcn/ui

### Directory Structure
- `app/`: Next.js App Router pages and layouts.
  - `dashboard/`: Main application interface (protected).
  - `auth/`: Authentication callback routes.
- `components/`: React components.
  - `FamilyTree.tsx`: Core visualization component.
- `lib/supabase/`: Supabase integration.
  - `client.ts`: Browser client.
  - `server.ts`: Server client (cookies).
  - `queries.ts`: React Query hooks (`usePersons`, `useRelationships`).
  - `realtime.ts`: Realtime subscription hooks.
- `providers/`: Context providers (QueryClient, Zustand).
- `stores/`: Zustand stores (`ui-store.ts`).
- `types/`: Database and application types.

## Key Features & Implementation Details

### 1. State Management Strategy
We strictly follow the separation of concerns:
- **Server State** (Data from DB) is managed by **React Query**.
  - Automatic caching and background refetching.
  - Optimistic updates (ready for implementation).
- **Client State** (UI state like modals, sidebar) is managed by **Zustand**.
  - Implements the Factory Pattern (`providers/ui-store-provider.tsx`) to ensure safe SSR compatibility in Next.js.
- **Realtime State**:
  - `useRealtimeMultiple` hook subscribes to Supabase Postgres changes.
  - On event (INSERT/UPDATE/DELETE), it invalidates relevant React Query keys to trigger a refetch.

### 2. Family Tree Visualization
- **Component**: `components/FamilyTree.tsx`
- **Libraries**: `reactflow` for rendering, `dagre` for automatic hierarchical layout.
- **Data Flow**:
  - Fetches `persons` and `relationships` via React Query.
  - Computes layout using `dagre` in a `useMemo` hook.
  - **Stability Fix**: To prevent "Maximum update depth exceeded" errors, we use `EMPTY_RELATIONSHIPS` constant and strict dependency management in `useMemo` and `useEffect`.

### 3. Authentication & Security
- **Middleware**: `middleware.ts` protects `/dashboard` routes and refreshes Supabase sessions.
- **RLS (Row Level Security)**: Database tables (`persons`, `relationships`) are protected so users can only access their own data (`user_id`).

### 4. Database Schema
- **persons**: Stores individual data (name, birthdate, gender, etc.).
- **relationships**: Stores links between persons (parent_id, child_id).
- **Types**: Auto-generated in `types/database.types.ts`.

## Current Status & Known Issues
- **Infinite Loop Fixed**: The FamilyTree component previously had an infinite update loop due to unstable object references. This has been resolved by stabilizing the `relationships` data reference.
- **Realtime**: Subscriptions are active for `persons` and `relationships` tables.

## Future Plans (To-Do)
- Implement "Add Relationship" UI on the Dashboard.
- Enhance node styling in the Family Tree.
- Add "Edit Person" functionality.
- Configure Supabase Auth Providers (Google, etc.).
