# Feature Spec: Advanced Consistency Checker

## 1. Overview
An automated auditing tool that scans the family tree for logical errors, impossible dates, and data inconsistencies.

## 2. Rules Engine
We will implement a `validateTree(persons, relationships)` function that returns a list of `Issues`.

### 2.1 Error Categories
1.  **Critical (Red)**: Physically impossible.
    - `Birth Date` > `Death Date`.
    - `Child Birth Date` < `Parent Birth Date`.
    - `Marriage Date` < `Spouse Birth Date`.
    - Cycle detected (Person is their own ancestor) - *Already handled by backend, but good to double check*.

2.  **Warning (Yellow)**: Unlikely but possible.
    - Parent < 13 years old at child birth.
    - Parent > 70 years old at child birth (father) or > 55 (mother).
    - Sibling birth gap < 9 months (unless twins - check exact date).
    - Person living > 120 years.
    - Marriage date > Death date (Posthumous marriage? Rare).

3.  **Data Quality (Blue)**: Missing info.
    - Missing `Birth Date`.
    - Missing `Gender`.
    - Duplicate Names in same immediate family.

## 3. UI/UX
- **Entry Point**: "Doctor" icon or "Health Check" button in the Controls bar.
- **Panel**: A modal or drawer listing all issues.
- **Actions**:
  - "Ignore" (Whitelist this specific error for this person).
  - "Fix" (Opens the Person Edit modal).
  - "Auto-fix" (Only for simple things like formatting, rarely used in genealogy).

## 4. Implementation
- File: `lib/validation/consistency-checker.ts`
- Hook: `useConsistencyCheck` that runs in background or on-demand.
