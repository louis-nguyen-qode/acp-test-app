#!/usr/bin/env bash
# iter-gates-node.sh — Scoped iteration gate for Node.js projects.
# Takes changed file paths as arguments.
# Runs lint/typecheck on changed files only; tests on changed files' siblings
# and test files matching the same paths.
# Emits /tmp/iter-gates.json as machine-readable result.
# Usage: bash bootstrap/iter-gates.sh <file1> <file2> ...
# Exit 0 = all green. Exit 1 = first failing step.

set -euo pipefail

if [ $# -eq 0 ]; then
  echo "Usage: $0 <changed-file1> [changed-file2] ..."
  echo "Pass changed file paths relative to repo root."
  exit 1
fi

CHANGED_FILES=("$@")
RESULTS='{"lint":null,"typecheck":null,"test":null}'

# Resolve jq or node for JSON manipulation
update_result() {
  local key=$1
  local value=$2
  if command -v jq &>/dev/null; then
    RESULTS=$(jq ".$key=\"$value\"" <<< "$RESULTS")
  else
    RESULTS=$(echo "$RESULTS" | node -e "
      const d = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
      d['$key'] = '$value';
      process.stdout.write(JSON.stringify(d));
    ")
  fi
}

print_result() {
  local key=$1
  local verdict=$2
  if command -v jq &>/dev/null; then
    jq -r 'to_entries[] | "  \(.key): \(.value // "skipped")"' <<< "$RESULTS"
  else
    echo "$RESULTS"
  fi
}

echo "=== ITER GATES: scoped to changed files ==="
echo "Changed files:"
for f in "${CHANGED_FILES[@]}"; do
  echo "  $f"
done
echo ""

# Build a list of source files (non-test TypeScript/JavaScript files)
SOURCE_FILES=()
for f in "${CHANGED_FILES[@]}"; do
  if [[ "$f" =~ \.(ts|tsx|js|jsx)$ ]] && [[ ! "$f" =~ \.(test|spec)\. ]]; then
    if [ -f "$f" ]; then
      SOURCE_FILES+=("$f")
    fi
  fi
done

# Build a list of test files to run
# Strategy: for each changed source file, look for:
#   1. Sibling test file: same path with .test.ts/.spec.ts
#   2. __tests__ directory at same level
#   3. Changed test files directly
TEST_GLOBS=()
for f in "${CHANGED_FILES[@]}"; do
  if [[ "$f" =~ \.(test|spec)\.(ts|tsx|js|jsx)$ ]]; then
    # It's already a test file
    if [ -f "$f" ]; then
      TEST_GLOBS+=("$f")
    fi
  else
    # Look for sibling test files
    dir=$(dirname "$f")
    base=$(basename "$f" | sed 's/\.\(ts\|tsx\|js\|jsx\)$//')
    for ext in ts tsx js jsx; do
      for suffix in test spec; do
        candidate="$dir/$base.$suffix.$ext"
        if [ -f "$candidate" ]; then
          TEST_GLOBS+=("$candidate")
        fi
      done
    done
    # Look in __tests__ directory
    tests_dir="$dir/__tests__"
    if [ -d "$tests_dir" ]; then
      for tf in "$tests_dir"/*; do
        if [[ "$tf" =~ $base ]]; then
          TEST_GLOBS+=("$tf")
        fi
      done
    fi
  fi
done

# Step 1: Lint on changed source files only
echo "==> Running lint on changed files..."
if [ ${#SOURCE_FILES[@]} -eq 0 ]; then
  echo "No changed source files to lint — skipping"
  update_result "lint" "pass"
  echo "PASS: lint (no source files changed)"
else
  FILES_ARGS="${SOURCE_FILES[*]}"
  if npm run lint -- --max-warnings=0 $FILES_ARGS 2>&1; then
    update_result "lint" "pass"
    echo "PASS: lint"
  else
    update_result "lint" "fail"
    echo "FAIL: lint"
    echo "$RESULTS" > /tmp/iter-gates.json
    echo ""
    echo "=== ITER GATES RESULT ==="
    print_result
    exit 1
  fi
fi

# Step 2: Typecheck (incremental — tsc --noEmit is whole-project but fast with incremental)
echo ""
echo "==> Running typecheck..."
if npm run typecheck 2>&1; then
  update_result "typecheck" "pass"
  echo "PASS: typecheck"
else
  update_result "typecheck" "fail"
  echo "FAIL: typecheck"
  echo "$RESULTS" > /tmp/iter-gates.json
  echo ""
  echo "=== ITER GATES RESULT ==="
  print_result
  exit 1
fi

# Step 3: Run only the relevant test files
echo ""
echo "==> Running tests on related files..."
if [ ${#TEST_GLOBS[@]} -eq 0 ]; then
  echo "No related test files found for changed files — skipping test step"
  update_result "test" "pass"
  echo "PASS: test (no related test files)"
else
  echo "Test files to run:"
  for tf in "${TEST_GLOBS[@]}"; do
    echo "  $tf"
  done
  TEST_FILES_ARGS="${TEST_GLOBS[*]}"
  if npx vitest run $TEST_FILES_ARGS 2>&1; then
    update_result "test" "pass"
    echo "PASS: test"
  else
    update_result "test" "fail"
    echo "FAIL: test"
    echo "$RESULTS" > /tmp/iter-gates.json
    echo ""
    echo "=== ITER GATES RESULT ==="
    print_result
    exit 1
  fi
fi

echo "$RESULTS" > /tmp/iter-gates.json

echo ""
echo "=== ITER GATES RESULT ==="
if command -v jq &>/dev/null; then
  jq -r 'to_entries[] | "  \(.key): \(.value)"' <<< "$RESULTS"
else
  echo "$RESULTS"
fi
echo ""
echo "ALL GREEN (scoped)"
