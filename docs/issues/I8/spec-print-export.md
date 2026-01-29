# Feature Spec: High-Quality Print (A0 Poster)

## 1. The Challenge
User wants to print the family tree on an **A0 paper (841 x 1189 mm)**.
- **Resolution**: At 300 DPI, this is **9,933 x 14,043 pixels**.
- **Browser Limits**: Canvas size limits vary. Chrome is usually ~16k pixels, but memory usage is the real bottleneck.
- **Node Readability**: Screen nodes are small cards. On A0, they need to be high-contrast, beautiful "plaques".

## 2. Solution Strategy: SVG Vector Export
SVG is resolution-independent. We can generate a 100kb SVG that prints perfectly at any size.

### 2.1 "Print Mode" Styling
We need a separate rendering mode or CSS class `.print-mode`.
- **Nodes**:
  - Remove "Edit", "Add", "Handle" buttons.
  - Increase font weight.
  - Remove shadows (or use SVG filters carefully).
  - Show *full* name and dates (no `...` truncation).
  - Optional: Decorative borders/frames for "Classy" look.
- **Edges**: Thicker lines, solid colors (black/dark grey instead of light grey).
- **Background**: White or paper texture (remove grid dots).

### 2.2 Export Pipeline
1.  **User clicks "Export for Print"**.
2.  **Configuration Modal**:
    - Paper Size: A0, A1, A2, Custom.
    - Theme: Classic, Modern, Minimal.
    - Content: Ancestors only, Descendants only, Full Tree.
3.  **Processing**:
    - We temporarily render the tree in "Print Mode" (hidden off-screen or in a portal).
    - We use `html-to-image`'s `toSvg` method.
    - OR we construct the SVG manually from the node data (more robust for huge trees).
      - *Given ReactFlow structures, `toSvg` on the DOM nodes is easier but risky for layout shift.*
      - *Better approach*: Use `getNodes()` and `getEdges()` to generate a pure SVG string server-side or client-side without DOM scraping?
      - *Pragmatic approach*: Use `reactflow`'s built-in export guide (using `toPng` with `transform` scale). For A0, we might need to export in tiles or just use a high scale factor (e.g., scale=4) which usually works for moderate trees.

### 2.3 Custom "Print Node" Component
Create `PrintNode.tsx` which is a simplified, high-fidelity version of `PersonNode.tsx`.
When exporting, we switch the `nodeTypes` to use `PrintNode`.

## 3. GEDCOM
- **Explanation**: GEDCOM is just a text file standard (like JSON for genealogy).
- **Relevance**: It's how we get data IN/OUT to other apps.
- **For this feature**: Irrelevant to the printing itself, other than ensuring we have the data.
