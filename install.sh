#!/bin/bash
# Cost Guardian - Quick Install Script
# Usage: curl -fsSL https://raw.githubusercontent.com/Manavarya09/cost-guardian/main/install.sh | bash

set -e

INSTALL_DIR="${HOME}/.claude/plugins/cost-guardian"
REPO_URL="https://github.com/Manavarya09/cost-guardian.git"

echo ""
echo "  Cost Guardian Installer"
echo "  ======================="
echo ""

# Check dependencies
if ! command -v sqlite3 &> /dev/null; then
  echo "  [!] sqlite3 not found. Please install it first."
  exit 1
fi

if ! command -v node &> /dev/null; then
  echo "  [!] Node.js not found. Please install it first."
  exit 1
fi

echo "  [1/4] Cloning repository..."
if [ -d "$INSTALL_DIR" ]; then
  echo "        Updating existing installation..."
  cd "$INSTALL_DIR" && git pull --quiet
else
  git clone --quiet "$REPO_URL" "$INSTALL_DIR"
fi

echo "  [2/4] Making hooks executable..."
chmod +x "$INSTALL_DIR/hooks/"*.sh

echo "  [3/4] Initializing database..."
node "$INSTALL_DIR/scripts/store.js" init

echo "  [4/4] Done!"
echo ""
echo "  Next steps:"
echo ""
echo "  1. Add hooks to your Claude Code settings:"
echo ""
echo "     claude settings hooks add PreToolUse 'bash ${INSTALL_DIR}/hooks/budget-guard.sh'"
echo "     claude settings hooks add PostToolUse 'bash ${INSTALL_DIR}/hooks/track-usage.sh'"
echo ""
echo "  2. Or add manually to ~/.claude/settings.json:"
echo ""
echo '     "hooks": {'
echo '       "PreToolUse": [{"hooks": [{"type": "command", "command": "bash '"${INSTALL_DIR}"'/hooks/budget-guard.sh"}]}],'
echo '       "PostToolUse": [{"hooks": [{"type": "command", "command": "bash '"${INSTALL_DIR}"'/hooks/track-usage.sh"}]}]'
echo '     }'
echo ""
echo "  3. Start using:"
echo "     /cost-guardian        - Check current costs"
echo "     /cost-estimate <task> - Estimate task cost"
echo "     /cost-report          - View spending report"
echo ""
echo "  Stop guessing. Start tracking."
echo ""
