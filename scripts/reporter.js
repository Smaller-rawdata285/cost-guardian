#!/usr/bin/env node
const store = require('./store');

const W = 52; // inner width between ║ chars

function bar(value, maxValue, width = 20) {
  if (maxValue === 0) return ' '.repeat(width);
  const ratio = Math.min(value / maxValue, 1);
  const filled = Math.round(ratio * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

function formatCost(usd) {
  if (usd < 0.01) return `$${(usd * 100).toFixed(2)}c`;
  return `$${usd.toFixed(2)}`;
}

function formatTokens(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function pad(str, len) {
  return str + ' '.repeat(Math.max(0, len - str.length));
}

function line(content) {
  return `║  ${pad(content, W - 4)}  ║`;
}

function sep() {
  return '╠' + '═'.repeat(W) + '╣';
}

function header(title) {
  return '║' + `  ${title}`.padEnd(W) + '║';
}

// --- Session Report (Enhanced) ---

function sessionReport(sessionId) {
  const cost = store.getSessionCost(sessionId);
  const tokens = store.getSessionTokens(sessionId);
  const startTime = store.getSessionStart(sessionId);
  const config = store.loadConfig();
  const budget = config.budgets?.session;

  let elapsed = 0;
  if (startTime) {
    elapsed = (Date.now() - new Date(startTime).getTime()) / 1000 / 60;
    if (isNaN(elapsed) || elapsed < 0) elapsed = 0;
  }
  const burnRate = elapsed > 0 ? cost / elapsed : 0;

  const out = [];
  out.push('');
  out.push('╔' + '═'.repeat(W) + '╗');
  out.push(header('COST GUARDIAN — Session Report'));
  out.push(sep());
  out.push(line(`Total Cost:     ${formatCost(cost)}`));
  out.push(line(`Total Tokens:   ${formatTokens(tokens)}`));
  out.push(line(`Duration:       ${elapsed.toFixed(1)} min`));
  out.push(line(`Burn Rate:      ${formatCost(burnRate)}/min`));

  // Budget section
  if (budget) {
    const pct = budget.limit > 0 ? Math.min((cost / budget.limit) * 100, 100) : 0;
    out.push(sep());
    out.push(line(`Budget:  ${formatCost(budget.limit)} (${budget.mode})`));
    out.push(line(`Used:    ${bar(cost, budget.limit, 24)} ${pct.toFixed(0).padStart(3)}%`));
    out.push(line(`Left:    ${formatCost(Math.max(0, budget.limit - cost))}`));
    if (burnRate > 0) {
      const minsLeft = (budget.limit - cost) / burnRate;
      out.push(line(`ETA:     ${minsLeft > 0 ? `~${minsLeft.toFixed(0)} min until limit` : 'EXCEEDED!'}`));
    }
  }

  // Tool breakdown
  const tools = store.getToolBreakdown(sessionId);
  if (tools.length > 0) {
    const maxCost = Math.max(...tools.map(t => t.cost));
    out.push(sep());
    out.push(line('Per-Tool Breakdown'));
    out.push(sep());
    for (const t of tools.slice(0, 8)) {
      const name = t.tool.padEnd(10).slice(0, 10);
      const b = bar(t.cost, maxCost, 14);
      const c = formatCost(t.cost).padStart(6);
      const n = String(t.count).padStart(3);
      out.push(line(`${name} ${b} ${c} ${n}x`));
    }
  }

  // Model breakdown
  const models = store.getModelBreakdown(sessionId);
  if (models.length > 1) {
    out.push(sep());
    out.push(line('Per-Model Breakdown'));
    out.push(sep());
    for (const m of models) {
      const name = (m.model || 'unknown').replace('claude-', '').padEnd(18).slice(0, 18);
      out.push(line(`${name} ${formatCost(m.cost).padStart(8)}  ${formatTokens(m.tokens).padStart(6)} tok`));
    }
  }

  // Top expensive calls
  const topCalls = store.getTopExpensiveCalls(sessionId, 3);
  if (topCalls.length > 0 && topCalls[0].cost > 0.01) {
    out.push(sep());
    out.push(line('Most Expensive Calls'));
    out.push(sep());
    for (let i = 0; i < topCalls.length; i++) {
      const t = topCalls[i];
      out.push(line(`${i + 1}. ${t.tool.padEnd(10)} ${formatCost(t.cost).padStart(6)} (${formatTokens(t.inputTokens + t.outputTokens)} tok)`));
    }
  }

  out.push('╚' + '═'.repeat(W) + '╝');
  out.push('');
  return out.join('\n');
}

// --- Daily Report (Enhanced) ---

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function dailyReport(days = 7) {
  const breakdown = store.getDailyBreakdown(days);
  const dailyCost = store.getDailyCost();
  const weeklyCost = store.getWeeklyCost();
  const monthlyCost = store.getMonthlyCost();
  const config = store.loadConfig();
  const budgets = config.budgets || {};

  const out = [];
  out.push('');
  out.push('╔' + '═'.repeat(W) + '╗');
  out.push(header('COST GUARDIAN — Usage Report'));
  out.push(sep());
  out.push(line(`Today:       ${formatCost(dailyCost)}`));
  out.push(line(`This Week:   ${formatCost(weeklyCost)}`));
  out.push(line(`This Month:  ${formatCost(monthlyCost)}`));

  // Averages and projections
  if (breakdown.length > 0) {
    const avgDaily = breakdown.reduce((s, d) => s + d.cost, 0) / breakdown.length;
    const projectedMonthly = avgDaily * 30;
    out.push(line(`Avg Daily:   ${formatCost(avgDaily)}`));
    out.push(line(`Proj Month:  ${formatCost(projectedMonthly)}`));
  }

  // Budget status
  out.push(sep());
  out.push(line('Budget Status'));
  out.push(sep());
  if (budgets.daily) {
    const pct = Math.min((dailyCost / budgets.daily.limit) * 100, 100);
    out.push(line(`Daily   ${bar(dailyCost, budgets.daily.limit, 22)} ${pct.toFixed(0).padStart(3)}% of ${formatCost(budgets.daily.limit)}`));
  }
  if (budgets.weekly) {
    const pct = Math.min((weeklyCost / budgets.weekly.limit) * 100, 100);
    out.push(line(`Weekly  ${bar(weeklyCost, budgets.weekly.limit, 22)} ${pct.toFixed(0).padStart(3)}% of ${formatCost(budgets.weekly.limit)}`));
  }
  if (budgets.monthly) {
    const pct = Math.min((monthlyCost / budgets.monthly.limit) * 100, 100);
    out.push(line(`Monthly ${bar(monthlyCost, budgets.monthly.limit, 22)} ${pct.toFixed(0).padStart(3)}% of ${formatCost(budgets.monthly.limit)}`));
  }

  // Daily chart with day-of-week labels
  if (breakdown.length > 0) {
    const maxCost = Math.max(...breakdown.map(d => d.cost));
    out.push(sep());
    out.push(line(`Daily Spend (last ${days} days)`));
    out.push(sep());
    for (const d of breakdown) {
      const dateObj = new Date(d.date + 'T12:00:00');
      const dayLabel = DAYS[dateObj.getDay()] || '???';
      const dateShort = d.date.slice(5);
      const b = bar(d.cost, maxCost, 22);
      out.push(line(`${dayLabel} ${dateShort} ${b} ${formatCost(d.cost).padStart(7)}`));
    }
  }

  // Trend
  if (breakdown.length >= 4) {
    const half = Math.floor(breakdown.length / 2);
    const recent = breakdown.slice(half).reduce((s, d) => s + d.cost, 0) / (breakdown.length - half);
    const older = breakdown.slice(0, half).reduce((s, d) => s + d.cost, 0) / half;
    if (older > 0) {
      const change = ((recent - older) / older * 100).toFixed(0);
      const arrow = recent > older ? '↑' : '↓';
      out.push(sep());
      out.push(line(`Trend: ${arrow} ${Math.abs(change)}% vs prior period`));
    }
  }

  out.push('╚' + '═'.repeat(W) + '╝');
  out.push('');
  return out.join('\n');
}

// --- Branch Report (NEW) ---

function branchReport(days = 30) {
  const branches = store.getBranchBreakdown(days);

  const out = [];
  out.push('');
  out.push('╔' + '═'.repeat(W) + '╗');
  out.push(header('COST GUARDIAN — Branch Costs'));

  if (branches.length === 0) {
    out.push(sep());
    out.push(line('No branch data yet. Costs are tracked per git branch'));
    out.push(line('automatically when you work in a git repository.'));
  } else {
    const maxCost = Math.max(...branches.map(b => b.cost));
    const totalCost = branches.reduce((s, b) => s + b.cost, 0);
    out.push(sep());
    out.push(line(`Total: ${formatCost(totalCost)} across ${branches.length} branches (${days}d)`));
    out.push(sep());

    for (const b of branches.slice(0, 12)) {
      const name = b.branch.padEnd(16).slice(0, 16);
      const br = bar(b.cost, maxCost, 14);
      const c = formatCost(b.cost).padStart(7);
      const n = String(b.count).padStart(4);
      const pct = totalCost > 0 ? Math.round((b.cost / totalCost) * 100) : 0;
      out.push(line(`${name} ${br} ${c} ${n}x ${String(pct).padStart(2)}%`));
    }
  }

  out.push('╚' + '═'.repeat(W) + '╝');
  out.push('');
  return out.join('\n');
}

// --- Status Line ---

function statusLine(sessionId) {
  const cost = store.getSessionCost(sessionId);
  const tokens = store.getSessionTokens(sessionId);
  const startTime = store.getSessionStart(sessionId);

  let burnRate = 0;
  if (startTime) {
    const elapsed = (Date.now() - new Date(startTime).getTime()) / 1000 / 60;
    burnRate = elapsed > 0 ? cost / elapsed : 0;
  }

  return `${formatCost(cost)} | ${formatTokens(tokens)} tok | ~${formatCost(burnRate)}/min`;
}

// --- Session Start Summary ---

function sessionStartSummary() {
  const dailyCost = store.getDailyCost();
  const weeklyCost = store.getWeeklyCost();
  const config = store.loadConfig();
  const weeklyBudget = config.budgets?.weekly;

  let budgetStr = '';
  if (weeklyBudget) {
    const pct = Math.round((weeklyCost / weeklyBudget.limit) * 100);
    budgetStr = ` (${pct}% of $${weeklyBudget.limit} weekly)`;
  }

  // Yesterday's cost
  const breakdown = store.getDailyBreakdown(2);
  const yesterday = breakdown.length > 0 ? breakdown[0] : null;
  const yesterdayStr = yesterday ? `Yesterday: ${formatCost(yesterday.cost)}` : '';

  return `📊 Cost Guardian: ${yesterdayStr}${yesterdayStr ? ' | ' : ''}This week: ${formatCost(weeklyCost)}${budgetStr}`;
}

module.exports = { sessionReport, dailyReport, branchReport, statusLine, sessionStartSummary, formatCost, formatTokens };

if (require.main === module) {
  const [,, cmd, ...args] = process.argv;
  switch (cmd) {
    case 'session': console.log(sessionReport(args[0] || 'unknown')); break;
    case 'daily': console.log(dailyReport(parseInt(args[0]) || 7)); break;
    case 'branch': console.log(branchReport(parseInt(args[0]) || 30)); break;
    case 'status': console.log(statusLine(args[0] || 'unknown')); break;
    case 'start-summary': console.log(sessionStartSummary()); break;
    default: console.log('Commands: session <id>, daily [days], branch [days], status <id>, start-summary');
  }
}
