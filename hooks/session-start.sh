#!/bin/bash
# SessionStart hook: Show cost summary at the beginning of each session
SCRIPT_DIR="$(cd "$(dirname "$0")/../scripts" && pwd)"

# Read stdin (hook input) but we don't need it
cat > /dev/null

# Show yesterday's spend and budget status
node -e "
  const reporter = require('${SCRIPT_DIR}/reporter');
  const summary = reporter.sessionStartSummary();
  if (summary) console.error(summary);
" 2>&1 | head -5 >&2

exit 0
