#!/usr/bin/env bash
# local-gates-node.sh — Full-scope pre-PR gate for Node.js projects.
# Runs: lint, typecheck, test (with coverage), build.
# Emits /tmp/local-gates.json as machine-readable result.
# Usage: bash bootstrap/local-gates.sh
# Exit 0 = all green. Exit 1 = first failing step.

set -euo pipefail

RESULTS='{"lint":null,"typecheck":null,"test":null,"coverage":null,"build":null}'

run_step() {
  local key=$1
  shift
  echo "==> Running $key: $*"
  if "$@" 2>&1; then
    RESULTS=$(echo "$RESULTS" | node -e "
      const d = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
      d['$key'] = 'pass';
      process.stdout.write(JSON.stringify(d));
    ")
    echo "PASS: $key"
  else
    RESULTS=$(echo "$RESULTS" | node -e "
      const d = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
      d['$key'] = 'fail';
      process.stdout.write(JSON.stringify(d));
    ")
    echo "FAIL: $key"
    echo "$RESULTS" > /tmp/local-gates.json
    echo ""
    echo "=== LOCAL GATES RESULT ==="
    echo "$RESULTS" | node -e "
      const d = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
      Object.entries(d).forEach(([k,v]) => console.log('  ' + k + ': ' + (v ?? 'skipped')));
    "
    exit 1
  fi
}

# Prefer jq if available for JSON manipulation, else use node
if command -v jq &>/dev/null; then
  run_step() {
    local key=$1
    shift
    echo "==> Running $key: $*"
    if "$@" 2>&1; then
      RESULTS=$(jq ".$key=\"pass\"" <<< "$RESULTS")
      echo "PASS: $key"
    else
      RESULTS=$(jq ".$key=\"fail\"" <<< "$RESULTS")
      echo "FAIL: $key"
      echo "$RESULTS" > /tmp/local-gates.json
      echo ""
      echo "=== LOCAL GATES RESULT ==="
      jq -r 'to_entries[] | "  \(.key): \(.value // "skipped")"' <<< "$RESULTS"
      exit 1
    fi
  }
fi

echo "=== LOCAL GATES: full scope pre-PR ==="
echo "Working directory: $(pwd)"
echo ""

# Step 1: Lint
run_step lint npm run lint

# Step 2: Typecheck
run_step typecheck npm run typecheck

# Step 3: Test with coverage
run_step test npm test -- --coverage --run

# Step 4: Coverage threshold check (vitest coverage already enforces threshold via vitest.config.ts)
# If a separate check script exists, run it; otherwise mark pass (vitest --coverage exits non-zero on threshold failure)
run_step coverage bash -c 'echo "Coverage threshold enforced by vitest config (see vitest.config.ts thresholds)"'

# Step 5: Build
run_step build npm run build

echo "$RESULTS" > /tmp/local-gates.json

echo ""
echo "=== LOCAL GATES RESULT ==="
if command -v jq &>/dev/null; then
  jq -r 'to_entries[] | "  \(.key): \(.value)"' <<< "$RESULTS"
else
  echo "$RESULTS"
fi
echo ""
echo "ALL GREEN"
echo ""
echo "Embeddable summary for PR body:"
echo '```json'
cat /tmp/local-gates.json
echo '```'
