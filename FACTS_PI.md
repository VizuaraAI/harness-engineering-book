# GROUND TRUTH — Pi (earendil-works/pi) internals + Vercel Academy mapping

Every fact below was read directly from the Pi source (`earendil-works/pi`, MIT, a.k.a. `badlogic/pi-mono`,
pi.dev). Use these EXACT numbers, file paths, and mechanisms. Do NOT invent details. If a fact isn't here,
say "the source leaves this to extensions" rather than guessing. Pi is TypeScript; the Vercel Academy course
("Build AI Agent Harness") builds a TS harness called **TeensyCode** on the Vercel AI SDK.

## Package map (the mental model for the whole section)
Pi is a monorepo of layered packages:
- `packages/ai` (`@earendil-works/pi-ai`) — unified multi-provider LLM API. The provider adapters live here.
  Cache control is implemented here: `packages/ai/src/api/anthropic-messages.ts`.
- `packages/agent` (`@earendil-works/pi-agent-core`) — the model-agnostic agent runtime: the loop, message
  types, compaction, skills, system-prompt assembly. Key: `packages/agent/src/harness/`.
- `packages/coding-agent` (`@earendil-works/pi-coding-agent`) — the actual coding agent: the toolbox
  (`src/core/tools/`), tool-output truncation, interactive/print/RPC surfaces, extensions.
- `packages/tui` — terminal UI library. `packages/orchestrator` — EXPERIMENTAL multi-agent orchestration.
Pi's tagline: "a minimal agent harness — adapt Pi to your workflows, not the other way around." Most policy
(sandboxing, permission UX, RAG, custom compaction) is exposed as **extensions** (TypeScript modules), so the
core stays small and the behavior is swappable.

## The actual toolbox (`packages/coding-agent/src/core/tools/`)
`read`, `write`, `edit` (+ `edit-diff`, `file-mutation-queue`), `bash` (+ `bash-executor.ts`), `grep`, `find`,
`ls`. Plus MCP tools. Each tool is `{name, description, parameters(schema), execute}`. The `description`
strings are long and instructional (e.g. read's description literally tells the model "Use offset/limit for
large files. When you need the full file, continue with offset until complete.").

## MECHANISM 1 — CONTEXT MANAGEMENT / COMPACTION  (`packages/agent/src/harness/compaction/compaction.ts`)
This is the headline correction: Pi does **NOT** keep "the last three messages" or do naive message pruning by
default. Vercel Academy teaches a simple `pruneMessages` that drops stale tool results; Pi's DEFAULT is
**summarization-based compaction on a real token budget**.
- Trigger: `shouldCompact(contextTokens, contextWindow, settings)` returns `contextTokens > contextWindow - reserveTokens`.
- `DEFAULT_COMPACTION_SETTINGS = { enabled: true, reserveTokens: 16384, keepRecentTokens: 20000 }`.
  So compaction fires when usage climbs to within **16,384 tokens** of the model's context ceiling.
- Token measurement is NOT a char estimate: `calculateContextTokens(usage)` reads the **provider's real usage
  block** off the most recent assistant message (`usage.totalTokens || input+output+cacheRead+cacheWrite`), then
  ADDS an estimate only for the trailing messages after that block (`estimateContextTokens`). Cache-aware, exact.
- What compaction does: keeps roughly **`keepRecentTokens = 20,000` tokens of the most recent conversation
  verbatim**, and **summarizes everything older** into a single structured summary message. The summary is a
  `role: "compactionSummary"` entry, prefixed with `COMPACTION_SUMMARY_PREFIX` = "The conversation history before
  this point was compacted into the following summary:". The summary template is STRUCTURED — it preserves
  **[Decision]** rationales and an explicit list of **file operations** (files read vs files modified) extracted
  via `extractFileOperations` / `formatFileOperations`. So code context (which files were touched) survives.
- Compaction is a first-class harness **phase** (`agent-harness.ts`: `this.phase = "compaction"`), fully
  hookable: emits `session_before_compact` (an extension can cancel it or supply its own `compaction` result)
  and `session_compact`. There are example extensions `custom-compaction.ts`, `summarize.ts`, `trigger-compact.ts`,
  `handoff.ts`. `branch-summarization.ts` summarizes side branches of the session tree.
- CONTRAST for the article: Vercel's "keep the last N / prune old tool outputs" is a blunt sliding window;
  Pi's is budget-triggered summarization that keeps a 20k recent window AND a durable structured digest of
  everything before it (decisions + files), so the agent doesn't forget WHY it did things 40 turns ago.

## MECHANISM 2 — CACHE CONTROL  (`packages/ai/src/api/anthropic-messages.ts`)
Vercel teaches "add provider cache headers to reduce repeated context cost." Pi does incremental prefix caching
with a **rolling breakpoint**:
- Uses Anthropic ephemeral caching: `cacheControl = { type: "ephemeral", ...(ttl && { ttl }) }`. Supports the
  1-hour TTL — usage tracks `cacheWrite1h` from `cache_creation.ephemeral_1h_input_tokens`.
- Comment in source, verbatim: **"Add cache_control to the last user message to cache conversation history."**
  Pi attaches `cache_control` to the **last content block of the last user message** (the newest tool_result or
  text/image block). Because Anthropic caches the entire prefix UP TO a breakpoint, putting the breakpoint at the
  tail means the whole conversation-so-far (system + tools + every prior turn) is cached; next turn the breakpoint
  moves forward to the new tail, so only the delta is fresh. That's a **rolling cache breakpoint** that follows
  the conversation — not a static "cache the system prompt once."
- It ALSO puts a breakpoint on the **last tool** in the tools array (`convertTools`: `cacheControl && index === tools.length - 1`), so the entire tool-schema block (all tool definitions) is cached as one prefix chunk.
- System blocks also carry cache_control (the same `cacheControl` is threaded onto system content).
- Net effect: across a long coding session, Pi re-sends almost nothing at full price — system prompt, tool
  schemas, and the growing message history are served from Anthropic's cache; only the newest turn is a cache
  write. This is why a 100-turn Pi session stays cheap.

## MECHANISM 3 — TOOL OUTPUT TRUNCATION  (`packages/coding-agent/src/core/tools/truncate.ts` + `output-accumulator.ts`)
The user's exact question: "does Pi truncate tool output, or serve the agent everything?" ANSWER: **Pi truncates —
it does NOT dump everything into context.** Every tool is bounded by default.
- Constants (`truncate.ts`): `DEFAULT_MAX_LINES = 2000`, `DEFAULT_MAX_BYTES = 50 * 1024` (50 KB),
  `GREP_MAX_LINE_LENGTH = 500`. Rule everywhere: truncate at **2,000 lines OR 50 KB, whichever is hit first**.
- Two directions of truncation: `truncateHead` (keep the BEGINNING) and `truncateTail` (keep the END). The choice
  is deliberate per tool.
- `read` (`read.ts`): truncates with **`truncateHead`** (you want the top of a file); default 2000 lines / 50KB;
  exposes `offset` + `limit` params to page through big files; description tells the model to "continue with
  offset until complete." If a single line exceeds 50KB it refuses and suggests `sed -n 'Np' file | head -c 50KB`.
- `bash` (`bash.ts` + `bash-executor.ts` + `OutputAccumulator`): streams output with **bounded memory**, keeps the
  **TAIL** (`truncateTail` — for a command you usually want the end), and when output exceeds the cap it **spills
  the FULL output to a temp file** (`/tmp/pi-output-<hex>.log`) and appends a pointer to the tool result:
  "[Showing lines X-Y of TOTAL (50KB limit). Full output: <path>]". So nothing is lost — the model gets a bounded
  view plus an escape hatch to read more deliberately.
- `grep` (`grep.ts`): default **100 matches** (`DEFAULT_LIMIT = 100`, overridable via `limit`) OR 50KB, whichever
  first; each matching line truncated to **500 chars**; on hitting the cap it tells the model
  "N matches limit reached. Use limit=2N for more, or refine pattern."
- `find` (`find.ts`): default **1000 results** (`DEFAULT_LIMIT = 1000`).
- `OutputAccumulator` design (streaming): decodes UTF-8 incrementally, keeps only a decoded **tail** for display
  snapshots (`maxRollingBytes = maxBytes*2`), and opens the temp file lazily once `totalBytes/totalLines` exceed
  the cap. Memory stays bounded even if a command prints 500 MB.
- PHILOSOPHY for the article: "bounded by default, with a pointer to more." The model never gets a giant blob
  shoved into its context; it gets a 50KB/2000-line slice + a way to fetch the rest (temp file, offset/limit, or a
  refine-your-query hint). This is EXACTLY the "cap every tool's output" prevention strategy Vercel Academy Module 5
  Lesson 18 preaches — Pi ships it as core infrastructure, applied uniformly across the whole toolbox.

## FULL VERCEL-ACADEMY (11 modules) → PI MAPPING  (for the mapping-table article)
| Vercel Academy module (TeensyCode) | Where Pi does it (real code) | Pi's real choice / difference |
|---|---|---|
| M1 The Agent Loop (chat→agent, read/grep/bash, execute-safety) | `packages/agent/src/agent-loop.ts`, `agent.ts`; tools in `coding-agent/src/core/tools/` | Same loop shape; toolbox is read/write/edit/bash/grep/find/ls + MCP. |
| M2 Tool Design (5-section descriptions, factory, approval discriminated-union) | tool `description` strings per tool; `tool-definition-wrapper.ts`; permission UX via extensions (`interactive-mode.ts`) | Rich instructional descriptions; approval is an extension concern, not hardcoded. |
| M3 System Prompt (Agency/Guardrails/Ambiguity, buildSystemPrompt, AGENTS.md, verification gates) | `packages/agent/src/harness/system-prompt.ts`; AGENTS.md/SYSTEM.md loaded at startup from ~/.pi, parents, cwd | Deliberately **minimal** system prompt; project context via AGENTS.md; verification left to the agent + extensions. |
| M4 Sandbox Abstraction (local / in-memory / cloud, lifecycle hooks) | env abstraction `packages/agent/src/harness/env/nodejs.ts`; `coding-agent/bun/restore-sandbox-env.ts`; SSH/path-protection extensions | Execution env is pluggable; sandboxing + path protection + SSH exec are extensions, not a fixed 3-backend interface. |
| M5 Context Management (prune, bounded tool output, cache control) | compaction (`agent/.../compaction/`), truncation (`coding-agent/.../truncate.ts`), cache (`ai/.../anthropic-messages.ts`) | See the three deep-dives — Pi does summarization (not prune), 50KB/2000-line caps, and rolling cache breakpoints. |
| M6 Subagent Delegation (explorer/executor, task tool, per-role model) | `packages/orchestrator` (experimental) + subagents via extensions | Subagents exist via extensions/orchestrator; per-role model selection through the unified `pi-ai` model registry. |
| M7 Sandbox Lifecycle (state machine, snapshot/restore, durable workflows) | session tree persistence in `agent/src/harness/`; branch summarization | Sessions are a persisted tree (resumable); durable long-run workflows are orchestrator territory. |
| M8 Human-in-the-Loop (askUser, approval config) | permission gates + interactive-mode prompts (extensions) | Ask-the-human is an extension hook around tool execution. |
| M9 Planning & Verification (todo tool, verification contract) | todo + plan-mode via extensions (`examples/extensions/todo.ts`) | Plan mode and todo are shipped as extensions, not core. |
| M10 Surfaces (CLI, streaming, web) | `coding-agent/main.ts`, `cli/args.ts`, interactive TUI, print/JSON mode, **RPC protocol** (`docs/rpc.md`), SDK embed | Pi is explicitly multi-surface from day one: TUI + `--print`/JSON + RPC + SDK — one core, many front-ends. |
| M11 Extensibility (skills, custom tools, event bus) | `packages/agent/src/harness/skills.ts`; extensions API (`coding-agent/src/core/extensions/`) | **Skills = progressive disclosure** (names in prompt, body loaded on demand) — matches Vercel exactly. Extensions add tools/commands/shortcuts/events/TUI. Everything is an extension. |

Big-picture contrast to state in the overview article: **TeensyCode is a teaching harness** (built lesson-by-lesson
so each step fixes what the last one broke — brilliant for learning); **Pi is a production harness** (a small MIT
core + an extension surface where all the policy lives). They agree on the fundamentals — loop, tools, bounded
outputs, compaction, cache control, skills-as-progressive-disclosure — which is exactly why studying both is the
fastest way to understand what a real coding agent is.

## MECHANISM 4 — SUBAGENTS / DELEGATION (three distinct mechanisms — read from source)
Pi does NOT have one "subagent" feature; it has THREE separate delegation/scale mechanisms. Use all three.

### (a) The `subagent` extension — isolated child processes (in-task delegation)
Source: `packages/coding-agent/examples/extensions/subagent/` (index.ts, agents.ts, agents/*.md, prompts/*.md).
- Registers a single tool via `pi.registerTool({ name: "subagent", ... })` with THREE modes:
  `single` (one agent + task), `parallel` (a `tasks` array of {agent, task} run concurrently, capped at
  `MAX_PARALLEL_TASKS`), and `chain` (sequential, each step gets the previous step's output via a `{previous}`
  placeholder).
- KEY isolation mechanism: each invocation **spawns a separate `pi` SUBPROCESS** (`spawn` from
  `node:child_process`). So every subagent gets a **fully isolated context window** — its own process, its own
  message history — and its result is the only thing that returns to the parent. Isolation is by PROCESS, not by
  clever message trimming. This is why delegation saves the parent's context: the child burns tokens exploring,
  the parent only sees the compressed answer.
- Roles are **markdown files** with YAML frontmatter, discovered from `~/.pi/agent/agents/*.md` (user scope) and
  `.pi/agents/*.md` (project scope, nearest-ancestor), merged by `discoverAgents(cwd, scope)` where scope ∈
  user|project|both. Frontmatter = `{ name, description, tools (comma list → subset), model, systemPrompt = body }`.
  Sample roles shipped: **scout** (fast recon; tools `read,grep,find,ls,bash`; cheap model `claude-haiku-4-5`;
  returns a COMPRESSED context digest: "## Files Retrieved (with line ranges) / ## Key Code / ## Architecture /
  ## Start Here" so the next agent needn't re-read the files), **planner** (makes an implementation plan),
  **worker** (general-purpose, full tools/strong model), **reviewer** (code review). This is EXACTLY Vercel
  Academy Module 6's explorer(read-only+cheap) / executor(full+strong) split — but generalized to arbitrary
  named roles, each a markdown file that constrains its own tool set and model.
- Streaming: the child emits a JSON RPC stream; the parent parses it line-by-line and forwards tool calls +
  progress to the UI live (`onUpdate`); parallel tasks stream simultaneously; per-agent usage (turns/tokens/cost/
  context) is tracked. Abort: a `signal` `abort` listener kills the subprocess (Ctrl+C propagates).
- Workflow PRESETS are prompt templates in `~/.pi/agent/prompts/*.md`: `implement` = scout → planner → worker
  (a chain passing `{previous}`), `scout-and-plan` = scout → planner, `implement-and-review` = worker → reviewer
  → worker. Composable recipes over the role library.
- Security note (from README): a subagent runs a real `pi` subprocess with a delegated system prompt + tool/model
  config; project-local `.pi/agents/*.md` are repo-controlled prompts that can read files / run bash, so they are
  a trust surface (tie to permission gates / project-trust).

### (b) The `handoff` extension — a fresh focused session (lossless transfer, not delegation)
Source: `packages/coding-agent/examples/extensions/handoff.ts`. `/handoff <goal>` extracts what matters from the
current session branch and starts a NEW focused thread — the alternative to compaction when compaction would be
too lossy. Contrast the trio cleanly: **compaction** = summarize older messages IN PLACE; **handoff** = start a
clean session carrying only the distilled goal/context; **subagent** = spawn an isolated child and get its
answer back. Same problem (finite context), three different answers.

### (c) The `orchestrator` package — a FLEET of instances across machines (experimental)
Source: `packages/orchestrator/src/` (supervisor.ts, radius.ts, ipc/, rpc-process.ts, storage.ts, types.ts).
- `OrchestratorSupervisor` manages many **Pi INSTANCES**, each a separate RPC subprocess with its own
  session + cwd, tracked in `instances.json` with an `InstanceStatus` state machine
  (`starting|online|stopping|stopped|error`).
- It routes `RpcCommand`s to instances over **unix-socket IPC** (`ipc/`): `new_session`, `switch_session`,
  `fork`, `clone`, `set_session_name`, `prompt`, `get_state`. `fork`/`clone` branch a running session into a new
  instance.
- Cross-MACHINE presence via **`radius.pi.dev`** (hosted service, `DEFAULT_RADIUS_URL="https://radius.pi.dev/"`):
  register machine, register pi instance, then heartbeat with exponential backoff
  (`HEARTBEAT_BACKOFF_BASE_MS=1000 … MAX=30000`, drop after `NOT_FOUND_RETRY_THRESHOLD=3`). This is how you can
  see/drive Pi instances running on other machines from one orchestrator. EXPERIMENTAL — mark it as such.

Article framing: "one job too big for one context" has three answers in Pi, at three scales — a child process
(subagent), a fresh thread (handoff), or a fleet of instances (orchestrator). Vercel Academy Module 6 covers only
the first; Pi shows the whole ladder.
