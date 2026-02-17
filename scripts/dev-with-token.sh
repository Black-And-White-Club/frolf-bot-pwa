#!/bin/bash
# Start dev server and open with test token

TOKEN=${1:-$FROLF_TEST_TOKEN}

if [ -z "$TOKEN" ]; then
  echo "Usage: ./scripts/dev-with-token.sh <jwt-token>"
  echo "Or set FROLF_TEST_TOKEN environment variable"
  exit 1
fi

# Start dev server in background
bun run dev &
DEV_PID=$!

# Wait for server to start
sleep 3

# Open browser with token in hash (preferred over query for reduced leakage)
open "http://localhost:5173/#t=$TOKEN"

# Wait for Ctrl+C
trap "kill $DEV_PID" EXIT
wait $DEV_PID
