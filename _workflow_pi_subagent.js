export const meta = {
  name: 'harness-pi-subagent',
  description: 'Write the "How Pi does subagents" deep-dive (three mechanisms), grounded in FACTS_PI.md MECHANISM 4',
  phases: [{ title: 'Write' }, { title: 'Verify' }],
}
const DIR = 'harness-book-site'
const PISRC = '/private/tmp/claude-501/-Users-rajat-Desktop-Ramco-Rise-Claude-3/71a9f140-76d8-4ea8-a35a-49c100fa0b3f/scratchpad/pi-src'
const slug = 'how-pi-does-subagents'

const brief = `You are writing ONE article for the HARNESS ENGINEERING book's appendix section
"Pi, for Real: Two Harnesses, Line by Line". Title (do NOT repeat as H1): "How Pi does subagents: three mechanisms, three scales".

READ FIRST (match voice + figure grammar EXACTLY):
- ${DIR}/STYLE.md
- ${DIR}/articles/what-is-a-harness.md and ${DIR}/articles/your-first-bare-harness.md (style exemplars)
GROUND TRUTH (the ONLY source for Pi internals — obey it, invent nothing):
- ${DIR}/FACTS_PI.md  → especially "MECHANISM 4 — SUBAGENTS / DELEGATION". You may verify against the cloned
  source at ${PISRC}, notably:
  ${PISRC}/packages/coding-agent/examples/extensions/subagent/{index.ts,agents.ts,README.md}
  ${PISRC}/packages/coding-agent/examples/extensions/subagent/agents/{scout,planner,worker,reviewer}.md
  ${PISRC}/packages/coding-agent/examples/extensions/subagent/prompts/{implement,scout-and-plan,implement-and-review}.md
  ${PISRC}/packages/coding-agent/examples/extensions/handoff.ts
  ${PISRC}/packages/orchestrator/src/{supervisor.ts,radius.ts,types.ts}

WHAT THE ARTICLE MUST COVER (all from FACTS_PI.md MECHANISM 4 — be precise, use the real names):
- The framing: "one job too big for one context" has THREE answers in Pi, at three scales. Vercel Academy
  Module 6 (explorer/executor + Task tool) covers only the first; Pi shows the whole ladder.
- (a) The **subagent extension** — isolated child PROCESSES. A single tool \`subagent\` (registered via
  \`pi.registerTool\`) with three modes: \`single\`, \`parallel\` (a \`tasks\` array, capped at \`MAX_PARALLEL_TASKS\`),
  \`chain\` (sequential, output passed via a \`{previous}\` placeholder). Each invocation SPAWNS A SEPARATE \`pi\`
  SUBPROCESS (\`spawn\` from \`node:child_process\`) → a fully isolated context window; only the result returns to
  the parent (this is WHY delegation saves the parent's context). Roles are **markdown files** in
  \`~/.pi/agent/agents/*.md\` (user) and \`.pi/agents/*.md\` (project), frontmatter \`{name, description, tools, model,
  systemPrompt=body}\`; sample roles **scout** (recon; read-only tools; cheap model \`claude-haiku-4-5\`; returns a
  compressed "Files Retrieved/Key Code/Architecture/Start Here" digest), **planner**, **worker** (full), **reviewer**.
  Each role constrains its own tools + model — the generalized explorer/executor idea. Streaming (child JSON RPC
  stream parsed line-by-line → live UI updates; parallel tasks stream together; per-agent usage tracked). Abort via
  signal kills the subprocess. Workflow PRESETS in \`~/.pi/agent/prompts/*.md\`: \`implement\` = scout→planner→worker
  (chain via {previous}), \`scout-and-plan\`, \`implement-and-review\` = worker→reviewer→worker. Security: project-local
  agent md files are a trust surface (they can read files / run bash).
- (b) The **handoff extension** — start a FRESH focused session (lossless), the alternative to lossy compaction.
  Contrast the trio crisply: compaction = summarize older messages IN PLACE; handoff = clean session with only the
  distilled goal; subagent = isolated child returns an answer. Same problem (finite context), three answers.
- (c) The **orchestrator package** (EXPERIMENTAL) — a FLEET of instances. \`OrchestratorSupervisor\` manages many Pi
  INSTANCES (each an RPC subprocess w/ own session+cwd), \`InstanceStatus\` state machine
  (starting|online|stopping|stopped|error), routes RpcCommands (new_session/switch_session/fork/clone/prompt/get_state)
  over unix-socket IPC; \`fork\`/\`clone\` branch a running session; cross-machine presence via \`radius.pi.dev\`
  (register machine + pi, heartbeat with backoff). Mark clearly as experimental.

STYLE: warm, precise, Socratic; short sentences; 1,400–2,200 words; NO H1 (site adds it); open with a strong hook;
use ## internally. 4–6 [[fig:]] figures EACH ON ITS OWN LINE using the semantic color grammar
(blue=mechanism/flow, green=specs/values, red=labels/warnings, purple=code, orange=emphasis, yellow=state/containers),
numbered circles + a dashed takeaway box. Great figure ideas: "three answers at three scales" ladder (subagent→handoff→orchestrator);
the subagent tool's single/parallel/chain modes; a role markdown file's frontmatter → an isolated child process;
the scout→planner→worker chain passing {previous}; the orchestrator supervisor driving N instances + radius presence.
A few [[sn:]] sidenotes. Use real \`inline code\` for identifiers/paths. Cross-link siblings
(sub-agents-and-handoffs.html, supervision-and-plan-mode.html, how-pi-manages-context.html, vercel-academy-to-pi-mapping.html).
Return ONLY: slug, word count, #figs, #sidenotes. Do not paste the article back.

WRITE THIS FILE: ${DIR}/articles/${slug}.md`

phase('Write')
log('Writing how-pi-does-subagents (facts pinned)…')
await agent(brief, { label: `write:${slug}`, phase: 'Write' })
phase('Verify')
const v = await agent(
  `Verify ${DIR}/articles/${slug}.md against ${DIR}/FACTS_PI.md "MECHANISM 4" and the cloned source at ${PISRC}. ` +
  `Confirm the three mechanisms are correct and named right (subagent extension w/ single/parallel/chain + spawned pi subprocesses + markdown roles scout/planner/worker/reviewer w/ per-role tools+model; handoff = fresh session; orchestrator = fleet of instances w/ fork/clone + radius.pi.dev). ` +
  `Check no invented APIs, no H1 at top, every [[fig:]] on its own line, 4-6 figures, real file paths in inline code, style matches the pilots. Fix any issue in place with Edit. Return one line: "OK" or the fixes made.`,
  { label: `verify:${slug}`, phase: 'Verify' }
)
log('subagent article done: ' + v)
return { done: true }
