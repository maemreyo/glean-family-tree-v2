## Nhận xét Plan

### Overall Assessment

Plan ambitious nhưng **thiếu user validation**. Features này là "nice to have" chứ chưa proven ROI. Priority nên dựa trên usage data, không phải coolness factor.

---

### Feature 1: Time Travel Slider

**Technical Feasibility**: ⚠️ Medium complexity

- Không có library nào fit exact use case (filter by year + animate)
- Phải tự implement filtering logic + animation
- Framer Motion + Radix Slider OK cho UI

**Critical Issues**:

1. **Layout re-calculation**: Khi filter nodes, có 2 options:
   - Re-run dagre → smooth "growth" nhưng **expensive** (could lag với 100+ nodes)
   - Fade nodes → keeps layout nhưng looks "gappy"
2. **Missing dates**: Spec nói "treat as always visible" - sẽ confusing cho users

3. **Edge cases**: Twins, posthumous births, date ranges ("circa 1900") - không được mention

**Research Findings**: Các timeline libraries (react-chrono, react-timeline-editor) đều cho display, không phải filtering. Bạn phải tự code logic.

**Recommendation**:

- Start với simple "Snapshot" mode (fade only, no re-layout)
- Measure performance trước khi làm "Growth" mode
- Add date quality indicator (precise vs estimated)

---

### Feature 2: Consistency Checker

**Technical Feasibility**: ✅ Straightforward

- MyHeritage có 36 checks, Geni có 28 checks - tham khảo được
- Rules engine đơn giản, không cần ML
- UI straightforward với Radix Dialog

**Strengths**:

- Proven feature - competitors đã validate
- High user value (data quality)
- Easy to implement incrementally

**Notes từ research**:

- MyHeritage phân 3 severity: Error (red), Warning (yellow), Notice (blue)
- "Ignore" feature là must-have (cultural differences: "married name and maiden name identical" valid ở một số cultures)
- Auto-fix chỉ cho formatting, không cho logic errors

**Recommendation**:
✅ **Do this first** - highest ROI, lowest risk

- Start với 10-15 critical rules
- Add "Why is this an issue?" explanations
- Include source linking (which record has conflict)

---

### Feature 3: High-Quality Print (A0)

**Technical Feasibility**: ⚠️ High complexity

- SVG concept correct nhưng **DOM rendering is the bottleneck**
- Browser limits: Chrome ~16k pixels, but **memory** is real issue
- A0 at 300dpi = 9933x14043px = massive

**Research Findings**:

- `html-to-image` toSvg works nhưng scrapes DOM → layout shifts
- Large SVG on mobile crashes (per DEV.to article)
- Pure SVG generation (không qua DOM) robust hơn nhưng phức tạp

**Approaches ranked**:

1. **Pragmatic** (Recommend):
   - Scale factor (2x-4x) instead of true 300dpi
   - Export in tiles cho large trees
   - Add "Optimize for print" layout mode (compact)

2. **Ideal** (Complex):
   - Generate pure SVG from `getNodes()/getEdges()` data
   - Bypass DOM completely
   - Requires custom SVG renderer

3. **Hybrid**:
   - Use React Flow Pro's export features (if budget allows)
   - Less code to maintain

**Critical Missing**:

- Spec không mention **memory testing** với large trees
- Không có fallback nếu browser crashes
- "Print Mode" styling chưa có mockups

**Recommendation**:

- Validate demand first (add "Export as PDF" at lower res, measure usage)
- If proven, do tile-based approach
- A0 là overkill - A2/A3 là sweet spot cho home printing

---

## Priority Ranking

### Must Have (Week 1-2)

1. **Consistency Checker** - proven value, low risk

### Should Have (Week 3-4)

2. **Print Export** - pragmatic version (A3, scale=2, tiles)

### Could Have (Week 5+)

3. **Time Travel** - cool demo nhưng daily usage questionable

---

## Missing Pieces

1. **User Research**: Có bao nhiêu users actually cần print A0? Time travel?
2. **Performance Budget**: Spec không mention target metrics
3. **Mobile**: Print và Time Travel hoạt động thế nào trên mobile?
4. **Undo/Redo**: Consistency Checker "Auto-fix" cần undo mechanism

---

## Quick Win Alternative

Thay vì Time Travel (complex, uncertain value), làm **"Filter by Generation"** - simpler, proven useful:

- Radial buttons: "Parents only", "2 generations", "All"
- No animation needed
- Easier to understand
- Pairs well với Consistency Checker

**Verdict**: Consistency Checker first, Print pragmatic version second, Time Travel là nice-to-have chứ không phải priority.
