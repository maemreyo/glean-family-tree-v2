# Phase 3: Rich Person Profiles Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform basic nodes into rich profiles with photos, biographies, and life events timeline.

**Architecture:** 
- **Database:** New tables for `person_photos` and `life_events`. Update `persons` for metadata.
- **Frontend:** New Shadcn UI components for timeline and photo gallery. Integration with Supabase Storage.
- **State:** React Query for fetching rich data (lazy loading or separate queries).

**Tech Stack:** Next.js 15, Supabase (Auth/DB/Storage), React Query, Shadcn UI, React Dropzone.

---

### Task 1: Database Schema & Migration

**Files:**
- Create: `docs/database/PHASE_3_MIGRATION.sql`
- Modify: `types/database.types.ts` (Manual update or re-gen if possible, but we'll do manual first to unblock)

**Step 1: Create SQL Migration File**
Define SQL for:
- `persons` table updates: `nickname`, `birth_place`, `death_place`, `occupation`, `biography`, `notes`.
- `person_photos` table: `id`, `person_id`, `url`, `description`, `is_profile_picture`.
- `life_events` table: `id`, `person_id`, `event_type`, `date`, `title`, `description`, `location`.
- Storage bucket: `photos`.
- RLS Policies for new tables.

**Step 2: Execute Migration**
Run the SQL in Supabase Dashboard (user to do this or we simulate success if we can't). 
*Note: Since I cannot access the real Supabase instance, I will assume the user runs this or I will generate the SQL for them.*

**Step 3: Update Types**
Update `types/database.types.ts` to reflect the new schema so TypeScript is happy.

### Task 2: Extended Metadata UI

**Files:**
- Modify: `components/PersonDetailSheet.tsx`
- Create: `components/PersonMetadataForm.tsx` (or update existing edit form)
- Modify: `lib/supabase/queries.ts` (Update `useUpdatePerson` and types)

**Step 1: Update Queries**
Ensure `useUpdatePerson` can handle new fields.

**Step 2: Create/Update Edit Form**
Add fields for Nickname, Birth Place, Occupation, Biography (Textarea).

**Step 3: Display Metadata**
Show these fields in `PersonDetailSheet` in a "Details" tab or section.

### Task 3: Media Gallery (Photos)

**Files:**
- Install: `react-dropzone`
- Create: `components/PhotoGallery.tsx`
- Create: `components/ImageUpload.tsx`
- Modify: `lib/supabase/queries.ts` (Add `usePhotos`, `useUploadPhoto`, `useSetProfilePicture`)

**Step 1: Install Dependencies**
`npm install react-dropzone`

**Step 2: Implement Image Upload**
Create `ImageUpload` component handling drag-n-drop and upload to Supabase Storage.

**Step 3: Implement Photo Gallery**
Display grid of photos in `PersonDetailSheet`.

**Step 4: Profile Picture Logic**
Allow selecting a photo as "Profile Picture". Update `FamilyTree` node to show it if available.

### Task 4: Life Events Timeline

**Files:**
- Create: `components/LifeTimeline.tsx`
- Modify: `lib/supabase/queries.ts` (Add `useLifeEvents`, `useCreateLifeEvent`, `useDeleteLifeEvent`)

**Step 1: Queries**
Add hooks for CRUD on `life_events`.

**Step 2: Timeline Component**
Create a vertical timeline component showing events sorted by date.

**Step 3: Integration**
Add "Timeline" tab to `PersonDetailSheet`.

---

**Execution Order:**
1. Database Migration (Task 1)
2. Extended Metadata (Task 2)
3. Media Gallery (Task 3)
4. Life Events (Task 4)
