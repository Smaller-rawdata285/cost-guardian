# Changelog

All notable changes to Cost Guardian will be documented in this file.

## [2.0.0] - 2026-03-30

### Added
- **Per-tool cost feedback** after every tool call (`⚡ +$0.03 (Read) | Session: $2.41`)
- **Multi-model cost comparison** in `/cost-estimate` — shows cost across all Claude models
- **Per-branch cost tracking** — `/cost-report branch` shows cost per git branch
- **CSV/JSON export** — `/cost-guardian export csv` and `/cost-guardian export json`
- **Session start summary** — shows yesterday's spend and budget status on session start
- **Model breakdown** in session reports — see cost per model used
- **Top 3 most expensive calls** in session reports
- **Average daily spend** and **projected monthly cost** in daily reports
- **Day-of-week labels** in daily spend charts
- **Configurable tool multipliers** — customize estimation accuracy per tool in config
- **Error logging** to `~/.cost-guardian/error.log` for debugging
- **Database schema versioning** for safe future migrations
- **Override expiry** — budget overrides auto-expire after 24 hours
- 8 Anthropic models in pricing data (including extended thinking variants)

### Fixed
- **SQL injection vulnerability** — replaced shell interpolation with file-based queries
- **Silent database failures** — all errors now logged with timestamps
- **Race condition in recordUsage** — wrapped in SQLite transaction
- **Budget comparison off-by-one** — changed `>=` to `>` for limit checks
- **Timezone fragility** — use ISO 8601 format consistently
- **Stale override files** — auto-cleanup with 24-hour expiry

### Changed
- Wider report boxes (52 chars) for better readability
- Tool multipliers now loaded from config.json instead of hardcoded
- Session report now shows model and expensive-call breakdowns
- Daily report now includes averages and projected monthly spend
- Budget guard uses proper variable quoting

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
