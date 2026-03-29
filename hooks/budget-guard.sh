#!/bin/bash
# PreToolUse hook: Check budget before allowing tool execution
# Exit 0 = allow, Exit 2 = block (stderr = reason)

SCRIPT_DIR="$(cd "$(dirname "$0")/../scripts" && pwd)"
SESSION_ID="${CLAUDE_SESSION_ID:-unknown}"

# Read stdin but we don't need it for budget checking
cat > /dev/null

# Check budget violations
RESULT=$(node -e "
  const store = require('$SCRIPT_DIR/store');
  store.initDb();
  const violations = store.checkBudget('$SESSION_ID');
  const hardViolations = violations.filter(v => v.mode === 'hard');
  const warns = violations.filter(v => v.mode === 'warn' || v.mode === 'soft');

  // Check for override
  if (hardViolations.length > 0 && store.isOverridden('$SESSION_ID')) {
    process.exit(0);
  }

  if (hardViolations.length > 0) {
    const v = hardViolations[0];
    process.stderr.write(
      '\\n⛔ COST GUARDIAN: Budget exceeded!\\n' +
      '   Scope: ' + v.scope + '\\n' +
      '   Spent: \$' + v.spent.toFixed(2) + ' / \$' + v.limit.toFixed(2) + ' limit\\n' +
      '   Run /cost-guardian resume to override\\n' +
      '   Run /cost-guardian budget to adjust limits\\n\\n'
    );
    process.exit(2);
  }

  if (warns.length > 0) {
    for (const w of warns) {
      if (w.mode === 'warn') {
        process.stderr.write(
          '⚠️  Cost Guardian: ' + (w.percent || 100) + '% of ' + w.scope + ' budget used (\$' + w.spent.toFixed(2) + '/\$' + w.limit.toFixed(2) + ')\\n'
        );
      } else if (w.mode === 'soft') {
        process.stderr.write(
          '⚠️  Cost Guardian: ' + w.scope + ' budget exceeded (\$' + w.spent.toFixed(2) + '/\$' + w.limit.toFixed(2) + ') [soft mode - continuing]\\n'
        );
      }
    }
  }
  process.exit(0);
" 2>&1)

EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
  echo "$RESULT" >&2
  exit 2
fi

# Output any warnings to stderr
if [ -n "$RESULT" ]; then
  echo "$RESULT" >&2
fi

exit 0
