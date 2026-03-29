#!/bin/bash
# PostToolUse hook: Track token usage and cost after each tool call
# Reads JSON from stdin, estimates tokens, logs to SQLite

SCRIPT_DIR="$(cd "$(dirname "$0")/../scripts" && pwd)"
node "$SCRIPT_DIR/estimator.js"
