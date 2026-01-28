# 🗺️ Glean Family Tree V2 - Product Roadmap

*Last Updated: 2026-01-28*

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
  - [x] Implement `RelationshipModal` using **Shadcn UI** (Dialog, Command/Combobox).
  - [x] Add validation to prevent duplicate parent-child links.
  - [x] Improve form validation feedback.
- **Tech**: Shadcn UI, React Hook Form, Zod.

### 1.2 Interactive Family Tree
- **Objective**: Make the tree nodes clickable and informative.
- **Tasks**:
  - [x] Implement **Node Click Handler** in ReactFlow.
  - [x] Build **Person Detail Side Panel** (Sheet component) to view/edit details without leaving the tree.
  - [x] Add visual feedback on hover/selection.
- **Tech**: ReactFlow events, Shadcn Sheet.

### 1.3 Loading & Empty States
- **Objective**: Eliminate layout shifts and confusion during data fetch.
- **Tasks**:
  - [x] Add Skeleton loaders for Tree and List views.
  - [x] Design friendly "Empty State" for new users (Call to action to add first person).

---

## 🛠️ Phase 2: Stability & Data Integrity
**Goal**: Fix "jumping nodes" issue and support complex family structures.
**Estimated Duration**: 1-2 weeks
**Priority**: HIGH

- [x] **Database Schema Update** (Completed)
  - [x] Add `relationship_type` to `relationships` table (parent/child, spouse).
  - [x] Add `position_x`, `position_y` to `persons` table for custom layout persistence.
- [x] **UI for Complex Relationships** (Completed)
  - [x] Update `RelationshipModal` to support "Spouse" type.
  - [x] Dynamic form fields based on relationship type.
  - [x] Display spouse in Person Detail Sheet.

### 2.3 Logic Validation
- **Objective**: Prevent impossible family trees.
- **Tasks**:
  - [x] Implement **Cycle Detection** (A -> B -> A).
  - [x] Validate birth dates (Parent must be older than Child).

---

## 🎨 Phase 3: Rich Person Profiles
**Goal**: Make the family tree "alive" with memories and stories.
**Estimated Duration**: 2-3 weeks
**Priority**: MEDIUM

### 3.1 Media Gallery
- **Tasks**:
  - [x] Create `person_photos` table (Supabase Storage).
  - [x] Implement Image Upload with drag-and-drop.
  - [x] Photo Gallery view in Person Detail Panel.
  - [x] Set "Profile Picture" for Tree Nodes.

### 3.2 Life Events Timeline
- **Tasks**:
  - [x] Create `life_events` table (Birth, Death, Marriage, Career).
  - [x] Build Timeline UI component.
  - [x] Sort events chronologically.

### 3.3 Extended Metadata
- **Tasks**:
  - [x] Add fields: Nickname, Birth Place, Death Place, Occupation, Notes.
  - [x] Rich Text Editor for "Biography".

---

## 📤 Phase 4: Export & Sharing
**Goal**: Allow users to take their data out and share it with others.
**Estimated Duration**: 1 week
**Priority**: MEDIUM

### 4.1 Export Visuals
- **Objective**: Generate high-quality images of the tree.
- **Tasks**:
  - [x] Export Tree as PNG/SVG (using `html-to-image`).
  - [x] Export Profile as PDF (via Print View).

### 4.2 Data Portability
- **Objective**: Standard genealogy format support.
- **Tasks**:
  - [x] GEDCOM Import/Export.
  - [x] JSON Backup/Restore.

### 4.3 Sharing
- **Objective**: Share the tree with family members.
- **Tasks**:
  - [x] Generate "Read-only" public links.
  - [x] Invite collaborators (roles: viewer/editor, email invite).
  - [x] Privacy controls for living people (hide details by default).
  - [x] Per-profile visibility toggles (override defaults).
  - [x] Confidence/source tagging for facts (confirmed vs speculative).
  - [x] Stories & traditions on profiles (long-form narrative, timeline integration).
  - [x] Photo albums grouped by events (weddings, birthdays, reunions).
  - [x] Timeline view enhancements (printable charts, export-friendly layouts).


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
