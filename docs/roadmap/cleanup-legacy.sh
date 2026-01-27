#!/bin/bash

# cleanup-legacy.sh
# Phase 0: Cleanup script for removing legacy code

set -e

echo "🧹 Starting cleanup of legacy code..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if directory/file exists
check_and_remove() {
    local path=$1
    local type=$2
    
    if [ -e "$path" ]; then
        echo -e "${YELLOW}Found $type: $path${NC}"
        echo "  Removing..."
        rm -rf "$path"
        echo -e "${GREEN}  ✓ Removed${NC}"
    else
        echo -e "${GREEN}✓ $type already removed: $path${NC}"
    fi
}

echo ""
echo "Step 1: Removing legacy store directory..."
check_and_remove "store" "directory"

echo ""
echo "Step 2: Checking for legacy imports..."

# Check for imports of legacy store
if grep -r "from '@/store/use-tree-store'" . --exclude-dir={node_modules,.next,dist} 2>/dev/null; then
    echo -e "${RED}⚠ Found legacy imports! Please update these files:${NC}"
    grep -r "from '@/store/use-tree-store'" . --exclude-dir={node_modules,.next,dist} -l
    echo ""
    echo "Replace with:"
    echo "  import { useUIStore } from '@/providers/ui-store-provider'"
else
    echo -e "${GREEN}✓ No legacy imports found${NC}"
fi

echo ""
echo "Step 3: Checking for correct Zustand pattern..."

# Check if using Provider pattern
if grep -r "createStore" stores/ 2>/dev/null | grep -q "zustand/vanilla"; then
    echo -e "${GREEN}✓ Using correct Zustand Provider pattern${NC}"
else
    echo -e "${YELLOW}⚠ Zustand store might not be using Provider pattern${NC}"
    echo "  Check stores/ui-store.ts - should use createStore from 'zustand/vanilla'"
fi

echo ""
echo "Step 4: Verifying environment setup..."

if [ -f ".env.local" ]; then
    echo -e "${GREEN}✓ .env.local exists${NC}"
    
    if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local; then
        echo -e "${GREEN}✓ Supabase URL configured${NC}"
    else
        echo -e "${RED}⚠ Missing NEXT_PUBLIC_SUPABASE_URL${NC}"
    fi
    
    if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local; then
        echo -e "${GREEN}✓ Supabase Anon Key configured${NC}"
    else
        echo -e "${RED}⚠ Missing NEXT_PUBLIC_SUPABASE_ANON_KEY${NC}"
    fi
else
    echo -e "${RED}⚠ .env.local not found${NC}"
    echo "  Copy .env.example to .env.local and configure"
fi

echo ""
echo "Step 5: Checking package.json dependencies..."

if grep -q '"@tanstack/react-query"' package.json; then
    echo -e "${GREEN}✓ React Query installed${NC}"
else
    echo -e "${RED}⚠ React Query not found in package.json${NC}"
fi

if grep -q '"zustand"' package.json; then
    echo -e "${GREEN}✓ Zustand installed${NC}"
else
    echo -e "${RED}⚠ Zustand not found in package.json${NC}"
fi

if grep -q '"@supabase/ssr"' package.json; then
    echo -e "${GREEN}✓ Supabase SSR installed${NC}"
else
    echo -e "${RED}⚠ Supabase SSR not found in package.json${NC}"
fi

echo ""
echo "Step 6: Checking for common anti-patterns..."

# Check for useState in place of React Query
if grep -r "useState.*persons" app/ components/ --exclude-dir=node_modules 2>/dev/null | grep -v "// @allow-useState"; then
    echo -e "${YELLOW}⚠ Found useState for 'persons' - should use React Query${NC}"
    grep -r "useState.*persons" app/ components/ --exclude-dir=node_modules -n | head -5
else
    echo -e "${GREEN}✓ No useState for server data${NC}"
fi

# Check for createClientComponentClient (old Supabase pattern)
if grep -r "createClientComponentClient" . --exclude-dir={node_modules,.next} 2>/dev/null; then
    echo -e "${RED}⚠ Found old Supabase client pattern!${NC}"
    echo "  Replace with createClientSupabase from '@/lib/supabase/client'"
else
    echo -e "${GREEN}✓ Using correct Supabase client pattern${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}Cleanup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Review any warnings above"
echo "  2. Run 'npm run dev' to test"
echo "  3. Commit changes: git add . && git commit -m 'chore: cleanup legacy code'"
echo ""
