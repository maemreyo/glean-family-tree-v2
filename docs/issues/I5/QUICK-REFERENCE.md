# Quick Reference Cheatsheet

## 📋 5-Minute Setup Guide

```bash
# 1. Backup
cd YourProject/FamilyTree
cp PersonNode.tsx PersonNode.tsx.backup
cp FamilyTreeCanvas.tsx FamilyTreeCanvas.tsx.backup  
cp utils/dagre-layout.ts utils/dagre-layout.ts.backup

# 2. Copy files
cp path/to/SpouseEdge.tsx ./
cp path/to/PersonNode.tsx ./
cp path/to/FamilyTreeCanvas.tsx ./
cp path/to/dagre-layout.ts ./utils/

# 3. Install deps (if needed)
npm install reactflow lucide-react dagre

# 4. Restart
npm run dev
```

## 🎨 Quick Customizations

### Change Color
```typescript
// In SpouseEdge.tsx & PersonNode.tsx
#ec4899 → Your color hex
text-pink-500 → text-yourcolor-500
bg-pink-500 → bg-yourcolor-500
```

### Change Spacing
```typescript
// In dagre-layout.ts, line 7
const spouseGap = 50  // 30=closer, 80=wider
```

### Disable Animation
```typescript
// In SpouseEdge.tsx, line ~35
// Remove: animation: 'dash 20s linear infinite',
```

## 🧪 Quick Test

Create these relationships:
```
Person A --spouse--> Person B
Person A --spouse--> Person C

Expected result:
[A] [B] [C] in horizontal line
Badge "2" on A
Pink lines with hearts
```

## 🐛 Quick Fixes

### TypeScript errors?
```bash
npm install -D @types/dagre
```

### Edges not showing?
Check `edgeTypes` registered in FamilyTreeCanvas.tsx

### Nodes overlapping?
Increase `spouseGap` in dagre-layout.ts

### Badge not showing?
Verify `spouseCount` in node data

## 📊 File Changes Summary

| File | Status | Changes |
|------|--------|---------|
| SpouseEdge.tsx | NEW | Custom edge component |
| PersonNode.tsx | REPLACE | +badges +names +handles |
| FamilyTreeCanvas.tsx | REPLACE | +edgeTypes registration |
| dagre-layout.ts | REPLACE | +spouse grouping logic |

## 🎯 Key Features

✅ Heart badge on nodes with spouses
✅ Counter badge for multiple spouses
✅ Pink animated lines with heart icons
✅ Horizontal spouse grouping
✅ Spouse names on nodes
✅ Dark mode support

## 🔄 Rollback (if needed)

```bash
cd YourProject/FamilyTree
cp PersonNode.tsx.backup PersonNode.tsx
cp FamilyTreeCanvas.tsx.backup FamilyTreeCanvas.tsx
cp utils/dagre-layout.ts.backup utils/dagre-layout.ts
rm SpouseEdge.tsx
npm run dev
```

## 📞 Need Help?

1. Check docs/ folder for detailed guides
2. Review VISUAL-COMPARISON.md for examples
3. See MIGRATION-GUIDE.md for troubleshooting

---

**Setup time**: 5-10 min
**Difficulty**: Easy
**Impact**: High visual improvement
