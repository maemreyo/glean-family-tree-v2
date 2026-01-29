#!/bin/bash

# Script to easily create git patches
# Usage: ./scripts/create_patch.sh [mode] [args]

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

show_usage() {
    echo "Usage: $0 [mode] [arguments]"
    echo ""
    echo "Modes:"
    echo "  single <commit-hash>               Create patch for a single commit"
    echo "  range <start-commit> <end-commit>  Create patch for a range of commits (start..end)"
    echo "  head <start-commit>                Create patch from start-commit to HEAD"
    echo ""
    echo "Options:"
    echo "  -o, --output <filename>            Specify output filename (default: patch_bundle.patch)"
    echo ""
    echo "Examples:"
    echo "  $0 single a1b2c3d"
    echo "  $0 range a1b2c3d e5f6g7h -o my_feature.patch"
    echo "  $0 head a1b2c3d"
}

# Default output file
OUTPUT_FILE="patch_bundle.patch"

# Check if git is available
if ! command -v git &> /dev/null; then
    echo -e "${RED}Error: git is not installed or not in PATH.${NC}"
    exit 1
fi

# Need at least 2 arguments
if [ $# -lt 2 ]; then
    show_usage
    exit 1
fi

MODE=$1
shift

# Parse remaining arguments
ARGS=()
while [[ $# -gt 0 ]]; do
    case $1 in
        -o|--output)
            OUTPUT_FILE="$2"
            shift 2
            ;;
        *)
            ARGS+=("$1")
            shift
            ;;
    esac
done

# Restore arguments
set -- "${ARGS[@]}"

case $MODE in
    single)
        if [ -z "$1" ]; then
            echo -e "${RED}Error: Missing commit hash.${NC}"
            show_usage
            exit 1
        fi
        COMMIT=$1
        echo "Creating patch for commit $COMMIT..."
        git format-patch --stdout -1 "$COMMIT" > "$OUTPUT_FILE"
        ;;
    range)
        if [ -z "$1" ] || [ -z "$2" ]; then
            echo -e "${RED}Error: Missing start or end commit hash.${NC}"
            show_usage
            exit 1
        fi
        START=$1
        END=$2
        echo "Creating patch for range $START..$END..."
        git format-patch --stdout "$START..$END" > "$OUTPUT_FILE"
        ;;
    head)
        if [ -z "$1" ]; then
            echo -e "${RED}Error: Missing start commit hash.${NC}"
            show_usage
            exit 1
        fi
        START=$1
        echo "Creating patch from $START to HEAD..."
        git format-patch --stdout "$START..HEAD" > "$OUTPUT_FILE"
        ;;
    *)
        echo -e "${RED}Invalid mode: $MODE${NC}"
        show_usage
        exit 1
        ;;
esac

# Check if file was created and has content
if [ -s "$OUTPUT_FILE" ]; then
    echo -e "${GREEN}Success! Patch created at: $OUTPUT_FILE${NC}"
    echo "You can apply this patch using: git apply $OUTPUT_FILE"
else
    echo -e "${RED}Error: Patch file is empty or was not created.${NC}"
    rm -f "$OUTPUT_FILE"
    exit 1
fi
