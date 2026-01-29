# I8: Advanced Features & Polish (Time Travel, Health Check, Print)

**Goal**: Implement "Wow" features for user engagement and "Trust" features for data quality, plus a high-value output (Print).

## 1. Time Travel Slider (Premium UI)
- **Concept**: A cinematic slider to visualize the family tree growth over time.
- **Features**:
  - Dual-thumb slider (Range) or Single thumb (Point in time).
  - Play/Pause auto-advance.
  - "Living at this time" vs "Cumulative" modes.
  - Smooth node appearance/disappearance animations.
- **Tech**: `@radix-ui/react-slider` (Shadcn), `framer-motion` for animations.

## 2. Advanced Consistency Checker (Data Health)
- **Concept**: A "Doctor" for your family tree.
- **Rules**:
  - Birth > Death.
  - Child older than Parent.
  - Parent < 13 years old at child birth.
  - Sibling gap < 9 months.
  - Marriage before Birth/after Death.
- **UI**: A report panel with "Fix it" quick actions.

## 3. High-Quality Print (A0 Poster)
- **Concept**: Generate a museum-quality family tree poster.
- **Challenges**: Browser memory limits for A0 (9933 x 14043 px @ 300dpi).
- **Solution**:
  - **Vector Export (SVG)**: Best for infinite scaling.
  - **Print-specific Node Styling**: Remove interactive elements, increase font contrast, show full details (no truncation).
  - **Custom Layout**: A specific "Print Layout" that might differ from the interactive "Screen Layout" to optimize space on A0 paper.

## 4. GEDCOM & Standards
- **GEDCOM**: The standard file format for genealogy data exchange.
- **Plan**: Ensure our Import/Export is robust (already in Phase 4, but we will polish it here).

---

## Execution Plan

### Step 1: Time Travel Spec & Proto
- Design the slider UI.
- Implement filtering logic in `useFamilyTreeLayout` or a new hook `useTimeTravel`.

### Step 2: Consistency Checker Logic
- Create `lib/validation/consistency-rules.ts`.
- Build the UI report.

### Step 3: Print Engine
- Create `components/dashboard/print/PrintCanvas.tsx`.
- Implement `toSvg` export.
- Design "Print Mode" node variants.
