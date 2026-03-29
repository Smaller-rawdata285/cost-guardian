# Changelog

All notable changes to Cost Guardian will be documented in this file.

## [1.0.0] - 2026-03-30

### Added
- Real-time cost tracking via PostToolUse hooks
- Budget guardrails with hard and soft modes (PreToolUse hooks)
- Per-session, daily, weekly, and monthly budget scopes
- Pre-task cost estimation (`/cost-estimate`)
- ASCII-formatted spending reports (`/cost-report`)
- Session cost summary (`/cost-guardian`)
- Budget management commands (`budget`, `resume`, `reset`, `config`)
- Status line integration showing burn rate
- SQLite-based local storage (no external dependencies)
- Tool-specific token estimation multipliers
- Git branch-based cost attribution
- Warning notifications at configurable thresholds (50%, 75%, 90%)
- One-line install script
- Example configuration file
- Comprehensive documentation and contributing guide
