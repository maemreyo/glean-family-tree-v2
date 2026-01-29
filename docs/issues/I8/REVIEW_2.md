## Giải pháp In Chất Lượng Cao

### Option 1: Server-Side SVG Generation (Recommended)

**Tại sao**: Tránh browser memory limits, infinite scaling

```typescript
// app/api/export-tree/route.ts
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const { userId, layoutData } = await req.json();

  // Fetch data
  const supabase = await createClient();
  const { data: persons } = await supabase
    .from("persons")
    .select("*")
    .eq("user_id", userId);

  // Generate pure SVG (no DOM)
  const svg = generateSVG(persons, layoutData);

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Content-Disposition": 'attachment; filename="family-tree.svg"',
    },
  });
}

function generateSVG(persons: Person[], layout: Layout) {
  const width = 9933; // A0 width @ 300dpi
  const height = 14043;

  const nodes = persons
    .map(
      (p) => `
    <g transform="translate(${p.position_x}, ${p.position_y})">
      <rect width="200" height="80" fill="white" stroke="black"/>
      <text x="100" y="30" text-anchor="middle" font-size="14" font-weight="bold">
        ${p.name}
      </text>
      <text x="100" y="50" text-anchor="middle" font-size="10">
        ${formatDates(p)}
      </text>
    </g>
  `
    )
    .join("");

  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="white"/>
      ${nodes}
      ${generateEdges(layout.edges)}
    </svg>
  `;
}
```

**Pros**: Không giới hạn kích thước, vector perfect, fast
**Cons**: Phải implement SVG rendering manually

---

### Option 2: PDF Generation với Puppeteer

**Tại sao**: Professional output, print-ready

```typescript
// app/api/export-pdf/route.ts
import puppeteer from "puppeteer";

export async function POST(req: Request) {
  const { userId } = await req.json();

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Load special print page
  await page.goto(
    `${process.env.NEXT_PUBLIC_URL}/print-preview?userId=${userId}`
  );
  await page.waitForSelector(".family-tree-ready");

  // Generate PDF at A0
  const pdf = await page.pdf({
    format: "A0",
    printBackground: true,
    margin: { top: 0, bottom: 0, left: 0, right: 0 },
  });

  await browser.close();

  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="family-tree.pdf"',
    },
  });
}
```

**Pros**: Print-ready, handles CSS, includes photos
**Cons**: Needs Puppeteer on server, slower

---

### Option 3: Tile-Based Export (Pragmatic)

**Tại sao**: Works in browser, no server needed

```typescript
// components/ExportTiled.tsx
async function exportInTiles() {
  const nodesBounds = getRectOfNodes(nodes);
  const tileSize = 4000; // Max safe canvas size

  const tiles: Blob[] = [];

  for (let y = 0; y < nodesBounds.height; y += tileSize) {
    for (let x = 0; x < nodesBounds.width; x += tileSize) {
      // Render each tile
      const blob = await captureTile(x, y, tileSize, tileSize);
      tiles.push(blob);
    }
  }

  // Stitch tiles on server
  await stitchTiles(tiles);
}
```

**Pros**: Works without server changes
**Cons**: Complex stitching logic, not true vector

---

## Recommendation Stack

**Best approach**: Server-side SVG → PDF pipeline

```typescript
// 1. Client exports layout data
const exportData = {
  nodes: nodes.map((n) => ({
    id: n.id,
    x: n.position.x,
    y: n.position.y,
    data: n.data,
  })),
  edges: edges,
};

// 2. Server generates SVG
const svg = await fetch("/api/export-tree", {
  method: "POST",
  body: JSON.stringify(exportData),
});

// 3. Optional: Convert SVG to PDF with sharp/imagemagick
// For professional print shops
```

**Libraries needed**:

```bash
npm install sharp puppeteer  # Server-side
npm install @react-pdf/renderer  # Alternative
```

---

## Quick Win: Use Existing Service

**Easiest**: Integrate with print API like [Printful](https://www.printful.com/api) or [Gelato](https://www.gelatoapis.com/)

```typescript
// They handle all complexity
await printful.createOrder({
  recipient: user,
  items: [
    {
      variant_id: 4011, // A0 poster
      file_url: generatedSVGUrl,
    },
  ],
});
```

**Verdict**: Server-side SVG generation là cleanest. Puppeteer PDF nếu cần photos/complex styling. Tránh pure client-side cho A0.
