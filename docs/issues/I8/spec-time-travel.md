# Feature Spec: Time Travel Slider

## 1. Overview
A specialized control to filter the Family Tree visualization based on a specific year or time range. This allows users to see:
- "Who was alive in 1950?"
- "How did the family grow from 1900 to 2000?"

## 2. User Interface (Premium/Cinematic)
- **Location**: Bottom center of the screen (floating overlay).
- **Components**:
  - **Slider**: A wide horizontal slider with years (Min Year in DB to Current Year).
  - **Controls**:
    - Play/Pause button (to animate the timeline automatically).
    - Speed control (1x, 2x, 5x).
    - "Jump to" input.
  - **Display**: Large, elegant typography showing the current year.
- **Visuals**:
  - Glassmorphism background (`bg-background/80 backdrop-blur`).
  - Smooth transitions using `framer-motion`.

## 3. Technical Implementation

### 3.1 Data Requirements
- Need `birth_year` and `death_year` for all nodes.
- If `birth_year` is missing -> Treat as "Always visible" or "Unknown".

### 3.2 Filtering Logic
Two modes:
1.  **Cumulative (Growth)**: Show everyone born on or before `Selected Year`.
    - `isVisible = person.birth_year <= selected_year`
2.  **Snapshot (Living)**: Show only people alive during `Selected Year`.
    - `isVisible = person.birth_year <= selected_year AND (person.death_year >= selected_year OR person.is_alive)`

### 3.3 State Management
```typescript
interface TimeTravelState {
  isActive: boolean
  currentYear: number
  isPlaying: boolean
  mode: 'cumulative' | 'snapshot'
  playbackSpeed: number
}
```

### 3.4 Integration
- Hook into `useFamilyTreeLayout`.
- When `currentYear` changes, filter `nodes` and `edges`.
- *Optimization*: Avoid re-calculating Dagre layout if possible. Just toggle `hidden` property on nodes/edges?
  - **Issue**: If we hide nodes, the layout might look empty/gapped.
  - **Solution**: Re-run layout for smooth "organic growth" effect, OR keep layout static and just fade nodes (better for "Snapshot", worse for "Growth").
  - **Decision**: Re-run layout for "Growth" mode (Cumulative). Fade out for "Snapshot" mode.

## 4. Libraries
- UI: `@radix-ui/react-slider` (Shadcn UI).
- Animation: `framer-motion`.
- Icons: `lucide-react` (Play, Pause, Rewind).
