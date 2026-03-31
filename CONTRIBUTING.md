# Contributing to Cost Guardian

Thanks for your interest! Cost Guardian is the most advanced Claude Code cost tracking plugin — and there's a lot more to build.

## Quick Start

1. Fork and clone the repo
2. `node scripts/store.js init` to set up the database
3. Symlink to `~/.claude/plugins/cost-guardian`
4. Start using Claude Code — data flows automatically

## Architecture

```
scripts/
├── pricing.js     # Model pricing + multi-model comparison
├── store.js       # SQLite storage, queries, budget checks, export
├── estimator.js   # Token estimation from tool I/O with configurable multipliers
├── reporter.js    # ASCII reports (session, daily, branch)
└── insights.js    # Efficiency score, waste detection, ROI, anomaly detection

hooks/
├── budget-guard.sh    # PreToolUse: blocks/warns when over budget
├── track-usage.sh     # PostToolUse: logs every tool call
└── session-start.sh   # SessionStart: shows yesterday's summary

skills/
├── cost-guardian/      # Main: status, budget, resume, reset, export
├── cost-estimate/      # Pre-task cost estimation with model comparison
├── cost-report/        # Session/daily/weekly/monthly/branch reports
└── cost-insights/      # Efficiency score, waste, ROI, savings, anomaly, badge
```

## Areas Where Help is Needed

### High Impact (Would Be Amazing)
- [ ] **Cost-per-PR attribution** — When a PR is opened, total up all Claude costs for that branch and post as a PR comment
- [ ] **Webhook/Slack alerts** — Send notifications when budget thresholds are hit
- [ ] **Historical pattern analysis** — "You spend more on Mondays" / "Refactoring tasks cost 3x more than bug fixes"
- [ ] **Integration with Anthropic Usage API** — Compare estimates to actual billing for accuracy calibration
- [ ] **TUI dashboard** — Real-time terminal dashboard with live-updating charts

### Medium Impact
- [ ] **More accurate waste detection** — Parse tool output to detect actual file paths and find true duplicate reads
- [ ] **Cost forecasting** — Predict monthly spend based on last 30 days of data
- [ ] **Team aggregation** — Merge data from multiple developers (shared SQLite or JSON export → merge)
- [ ] **Custom budget periods** — Sprint budgets, per-project budgets
- [ ] **Prompt cost estimation** — Estimate cost based on prompt length before Claude processes it

### Nice to Have
- [ ] **Interactive HTML report** — Export a beautiful standalone HTML report with charts (d3/chart.js)
- [ ] **VS Code extension** — Show cost in VS Code status bar when using Claude Code
- [ ] **Cost comparison benchmarks** — "You spend $X/day, average Claude Code user spends $Y/day"
- [ ] **Achievement system** — Fun milestones ("Saved $10 this week", "100% efficiency score")

## Code Style

- Zero external dependencies (Node.js built-ins only)
- SQLite via system `sqlite3` binary (file-based queries for safety)
- ASCII art reports must fit in 56-char-wide boxes
- Error logging to `~/.cost-guardian/error.log`
- All SQL uses `escapeSQL()` — never raw string interpolation

## Testing

```bash
# Initialize
node scripts/store.js init

# Check pricing
node scripts/pricing.js list
node scripts/pricing.js compare 10000 5000 claude-sonnet-4-6

# Generate reports
node scripts/reporter.js session test
node scripts/reporter.js daily 7
node scripts/reporter.js branch 30

# Run insights
node scripts/insights.js insights test
node scripts/insights.js badge monthly

# Test estimator
echo '{"tool_name":"Read","tool_input":{"file_path":"test.js"},"tool_output":"const x = 1;"}' | node scripts/estimator.js
```

## Commit Messages

Use conventional commits:
- `feat: add cost-per-PR attribution`
- `fix: improve waste detection accuracy`
- `docs: add troubleshooting guide`

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
