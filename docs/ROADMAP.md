# 🗺️ Glean Family Tree V2 - Product Roadmap

*Last Updated: 2026-01-27*

This document outlines the strategic development plan for **Glean Family Tree V2**, consolidated from previous planning documents (R1, R2). It prioritizes user experience, data integrity, and feature richness.

## 📊 Executive Summary

- **Current Status**: Core infrastructure (Next.js 15, Supabase, React Query, Zustand, nuqs) is stable. Basic CRUD and visualization are functional.
- **Immediate Focus**: Polishing UX and fixing graph layout stability.
- **Next Big Bet**: Rich person profiles (Media, Timeline) and Export capabilities.

---

## ✅ Phase 0: Foundation & Cleanup (Completed/Maintenance)
**Goal**: Ensure a stable, type-safe, and clean codebase before major feature work.

- [x] **Tech Stack**: Next.js 15 (App Router), Supabase Auth/DB, React Query, Zustand.
- [x] **State Management**: Integrated `nuqs` for URL state (Search/Tabs).
- [x] **Security**: RLS Policies configured for `persons` and `relationships`.
- [x] **DevOps**: Environment separation (Staging/Production).
- [x] **Quality**: Linting & Type-checking passed.

---

## ⭐ Phase 1: UX Polish & Interaction (Current Focus)
**Goal**: Transform the "developer prototype" feel into a smooth user experience.
**Estimated Duration**: 1 week
**Priority**: HIGH

### 1.1 Advanced Relationship Modal
- **Objective**: Replace native HTML selects with a searchable, intuitive UI.
- **Tasks**:
  - [ ] Implement `RelationshipModal` using **Shadcn UI** (Dialog, Command/Combobox).
  - [ ] Add validation to prevent duplicate parent-child links.
  - [ ] Improve form validation feedback.
- **Tech**: Shadcn UI, React Hook Form, Zod.

### 1.2 Interactive Family Tree
- **Objective**: Make the tree nodes clickable and informative.
- **Tasks**:
  - [ ] Implement **Node Click Handler** in ReactFlow.
  - [ ] Build **Person Detail Side Panel** (Sheet component) to view/edit details without leaving the tree.
  - [ ] Add visual feedback on hover/selection.
- **Tech**: ReactFlow events, Shadcn Sheet.

### 1.3 Loading & Empty States
- **Objective**: Eliminate layout shifts and confusion during data fetch.
- **Tasks**:
  - [ ] Add Skeleton loaders for Tree and List views.
  - [ ] Design friendly "Empty State" for new users (Call to action to add first person).

---

## 🛠️ Phase 2: Stability & Data Integrity
**Goal**: Fix "jumping nodes" issue and support complex family structures.
**Estimated Duration**: 1-2 weeks
**Priority**: HIGH

### 2.1 Persist Node Positions (Fix "Lost Connections" Perception)
- **Problem**: Dagre auto-layout recalculates positions on every add, causing nodes to jump.
- **Solution**: Save X/Y coordinates to DB.
- **Tasks**:
  - [ ] Add `position_x`, `position_y` columns to `persons` table.
  - [ ] Update `usePersons` to save position on drag end.
  - [ ] Implement "Auto Layout" button (manual trigger) vs "Save Layout".
- **Success Criteria**: Nodes stay in place after adding a new person.

### 2.2 Complex Relationships (Spouses)
- **Objective**: Support husband/wife/partner relationships visually.
- **Tasks**:
  - [ ] Add `relationship_type` ('parent', 'spouse') to database.
  - [ ] Update Graph logic to render spouse edges (distinct style).
  - [ ] Handle bidirectional updates (A is spouse of B -> B is spouse of A).

### 2.3 Logic Validation
- **Objective**: Prevent impossible family trees.
- **Tasks**:
  - [ ] Implement **Cycle Detection** (A -> B -> A).
  - [ ] Validate birth dates (Parent must be older than Child).

---

## 🎨 Phase 3: Rich Person Profiles
**Goal**: Make the family tree "alive" with memories and stories.
**Estimated Duration**: 2-3 weeks
**Priority**: MEDIUM

### 3.1 Media Gallery
- **Tasks**:
  - [ ] Create `person_photos` table (Supabase Storage).
  - [ ] Implement Image Upload with drag-and-drop.
  - [ ] Photo Gallery view in Person Detail Panel.
  - [ ] Set "Profile Picture" for Tree Nodes.

### 3.2 Life Events Timeline
- **Tasks**:
  - [ ] Create `life_events` table (Birth, Death, Marriage, Career).
  - [ ] Build Timeline UI component.
  - [ ] Sort events chronologically.

### 3.3 Extended Metadata
- **Tasks**:
  - [ ] Add fields: Nickname, Birth Place, Death Place, Occupation, Notes.
  - [ ] Rich Text Editor for "Biography".

---

## 📤 Phase 4: Export & Sharing
**Goal**: Allow users to share their work and backup data.
**Estimated Duration**: 1-2 weeks
**Priority**: LOW

### 4.1 Visual Export
- **Tasks**:
  - [ ] Export Tree as **PNG/SVG** (using `html-to-image`).
  - [ ] Export Profile as **PDF**.

### 4.2 Data Portability
- **Tasks**:
  - [ ] **GEDCOM Import/Export** (Standard genealogy format).
  - [ ] JSON Backup/Restore.

### 4.3 Sharing
- **Tasks**:
  - [ ] Generate "Read-only" public links.
  - [ ] Invite collaborators (email invite).

---

## ⚠️ Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Performance (Large Trees)** | Slow rendering, laggy drag | Implement **Virtualization**, limit initial render depth, lazy load branches. |
| **Complex Layouts** | Spouses + Ex-spouses break Dagre layout | Research advanced layout algorithms (Elkjs) or custom positioning logic. |
| **Storage Costs** | High cost for media storage | Enforce file size limits (e.g., 5MB), compress images on upload. |

## 📅 Estimated Timeline (Aggressive)

- **Week 1**: Phase 1 (UX Polish)
- **Week 2**: Phase 2 (Layout Stability)
- **Week 3-4**: Phase 3 (Rich Profiles)
- **Week 5**: Phase 4 (Export)

---

*Reference Codebase:*
- Roadmap R1: `docs/roadmap/R1/`
- Roadmap R2: `docs/roadmap/R2/`
