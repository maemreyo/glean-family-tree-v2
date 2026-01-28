# Technical Debt & Known Issues
*Last Updated: 2026-01-28*

This document tracks technical debt, known issues, and areas for improvement identified during development.

## 1. Code Quality & Maintenance

### 1.1 Deprecated Linter
- **Issue**: The project currently uses `next lint` which is deprecated in newer Next.js versions.
- **Impact**: Potential compatibility issues in future upgrades; warning messages during build/test.
- **Remediation**: Migrate to ESLint CLI using `npx @next/codemod@canary next-lint-to-eslint-cli .`.
- **Priority**: Medium

### 1.2 Legacy Code Cleanup
- **Issue**: The `store/` directory and `use-tree-store.ts` file are remnants of an older state management approach.
- **Impact**: Confusing for new developers; dead code bloat.
- **Remediation**: Delete `store/` directory after verifying no remaining imports.
- **Priority**: Low

### 1.3 Hardcoded UI Logic
- **Issue**: `PrintProfileClient.tsx` contains hardcoded logic for event icons and colors (`getEventIcon`, `getEventColor`).
- **Impact**: Adding new event types requires modifying the component code; hard to theme.
- **Remediation**: Move configuration to a constant file or database table (`event_types`).
- **Priority**: Low

## 2. Testing

### 2.1 Test Coverage
- **Issue**: While key components (`PhotoGallery`, `LifeEventTimeline`) have tests, overall coverage is not comprehensive.
- **Impact**: Regressions might go unnoticed in less critical paths.
- **Remediation**: Add integration tests for the full "Add Person -> Add Event -> Add Photo" flow.
- **Priority**: Medium

### 2.2 Test Environment
- **Issue**: Some tests require `CI=true` to run reliably without watch mode hanging.
- **Impact**: Developer friction when running local tests.
- **Remediation**: Configure Jest/npm scripts to handle watch mode better or default to single run in `npm test`.
- **Priority**: Low

## 3. Performance & Scalability

### 3.1 Large Tree Rendering
- **Issue**: `ReactFlow` renders all nodes at once.
- **Impact**: Performance degradation with trees > 100 nodes.
- **Remediation**: Implement virtualization or lazy loading for tree branches.
- **Priority**: High (for growth)

### 3.2 Image Optimization
- **Issue**: User uploads are not strictly compressed or limited in resolution server-side (relying on client/Supabase limits).
- **Impact**: High storage costs and slow load times for profiles with many photos.
- **Remediation**: Implement server-side resizing/compression (Supabase Edge Functions).
- **Priority**: Medium

## 4. User Experience (UX)

### 4.1 Relationship Management
- **Issue**: `RelationshipModal` uses native HTML selects.
- **Impact**: Poor UX for large lists of people.
- **Remediation**: Replace with `Combobox` (Shadcn UI) with search capabilities.
- **Priority**: High

### 4.2 Mobile Responsiveness
- **Issue**: The Family Tree view is optimized for desktop; mobile interaction is basic.
- **Impact**: Difficult to navigate large trees on phones.
- **Remediation**: Implement mobile-specific controls or list-view fallback.
- **Priority**: Medium
