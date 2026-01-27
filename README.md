# Glean Family Tree V2

A modern Family Tree application built with Next.js 15, Supabase, React Query, and ReactFlow.

## Documentation
> **[👉 View Detailed Implementation Status](docs/CURRENT_IMPLEMENTATION.md)**

## Features
- **Family Tree Visualization**: Interactive graph view using ReactFlow + Dagre layout.
- **Realtime Updates**: Live synchronization across clients using Supabase Realtime.
- **Person Management**: Create, edit, and delete family members.
- **Relationship Tracking**: Define parent-child relationships.
- **Secure**: Row Level Security (RLS) ensures data privacy.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL)
- **State Management**:
  - Server: React Query
  - Client: Zustand
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript

## Getting Started

The best way to start with this template is using `create-next-app`.

```
npx create-next-app my-app -e https://github.com/maemreyo/glean-family-tree-v2
```

1. **Install Dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

2. **Environment Setup**
   Copy `.env.local.example` to `.env.local` and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Open in Browser**
   Visit [http://localhost:3000](http://localhost:3000).

## Project Structure
- `app/dashboard`: Main application logic.
- `components/FamilyTree.tsx`: Visualization component.
- `lib/supabase`: Database and realtime logic.
- `docs/`: Detailed documentation and setup guides.

## License
MIT
