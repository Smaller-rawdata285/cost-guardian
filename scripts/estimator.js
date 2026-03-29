#!/usr/bin/env node
const { charsToTokens, estimateCost } = require('./pricing');
const { recordUsage } = require('./store');

// Tool-specific multipliers for more accurate estimation
const TOOL_MULTIPLIERS = {
  Read:        { input: 0.3, output: 1.0 },   // Small request, large file content
  Edit:        { input: 0.8, output: 0.5 },    // Medium both ways
  Write:       { input: 1.0, output: 0.2 },    // Large input (file content), small confirmation
  Bash:        { input: 0.5, output: 1.2 },    // Command is small, output can be large
  Grep:        { input: 0.3, output: 1.0 },    // Small query, results can be large
  Glob:        { input: 0.2, output: 0.8 },    // Small pattern, file list output
  Agent:       { input: 2.0, output: 3.0 },    // Sub-conversations are expensive
  WebFetch:    { input: 0.5, output: 1.5 },    // URL small, content large
  WebSearch:   { input: 0.3, output: 1.0 },    // Query small, results moderate
  TodoWrite:   { input: 0.5, output: 0.1 },    // Small both ways
  NotebookEdit:{ input: 0.8, output: 0.3 },    // Cell content, small response
  default:     { input: 0.5, output: 0.5 }
};

function getMultiplier(toolName) {
  return TOOL_MULTIPLIERS[toolName] || TOOL_MULTIPLIERS.default;
}

function estimateFromToolCall(toolName, toolInput, toolOutput, model) {
  const inputStr = typeof toolInput === 'string' ? toolInput : JSON.stringify(toolInput || '');
  const outputStr = typeof toolOutput === 'string' ? toolOutput : JSON.stringify(toolOutput || '');

  const inputChars = inputStr.length;
  const outputChars = outputStr.length;

  const mult = getMultiplier(toolName);
  const inputTokens = Math.ceil(charsToTokens(inputChars) * mult.input);
  const outputTokens = Math.ceil(charsToTokens(outputChars) * mult.output);

  const cost = estimateCost(inputTokens, outputTokens, model);

  return {
    toolName,
    model: cost.model,
    inputChars,
    outputChars,
    inputTokens,
    outputTokens,
    costUsd: cost.totalCost
  };
}

function processHookInput(hookData) {
  const toolName = hookData.tool_name || hookData.tool || 'unknown';
  const toolInput = hookData.tool_input || hookData.input || '';
  const toolOutput = hookData.tool_output || hookData.output || hookData.result || '';
  const sessionId = hookData.session_id || process.env.CLAUDE_SESSION_ID || 'unknown';
  const model = hookData.model || process.env.CLAUDE_MODEL || 'claude-sonnet-4-6';

  // Get current git branch
  let branch = '';
  try {
    const { execSync } = require('child_process');
    branch = execSync('git rev-parse --abbrev-ref HEAD 2>/dev/null', { encoding: 'utf8' }).trim();
  } catch {}

  const est = estimateFromToolCall(toolName, toolInput, toolOutput, model);

  // Record to database
  recordUsage(
    sessionId, est.toolName, model,
    est.inputChars, est.outputChars,
    est.inputTokens, est.outputTokens,
    est.costUsd, branch
  );

  return est;
}

module.exports = { estimateFromToolCall, processHookInput, TOOL_MULTIPLIERS };

if (require.main === module) {
  // Read hook input from stdin
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => input += chunk);
  process.stdin.on('end', () => {
    try {
      const hookData = JSON.parse(input);
      const result = processHookInput(hookData);
      // Output to stderr so it shows as hook feedback
      process.stderr.write(`Cost Guardian: +$${result.costUsd.toFixed(4)} (${result.inputTokens + result.outputTokens} tokens) [${result.toolName}]\n`);
    } catch (e) {
      process.stderr.write(`Cost Guardian: estimation error - ${e.message}\n`);
    }
  });
}
