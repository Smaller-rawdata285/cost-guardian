#!/bin/bash
# Notification hook: Show cost status in status line
SCRIPT_DIR="$(cd "$(dirname "$0")/../scripts" && pwd)"
SESSION_ID="${CLAUDE_SESSION_ID:-unknown}"

node -e "
  const reporter = require('$SCRIPT_DIR/reporter');
  console.log(reporter.statusLine('$SESSION_ID'));
"
