export const meta = {
  name: 'harness-articles',
  description: 'Write + verify the 33 remaining Harness Engineering book articles (deep but concise, from-foundations, build-along)',
  phases: [{ title: 'Write' }, { title: 'Verify' }],
}
const DIR = 'harness-book-site'
const PRE = `You are writing ONE article for the Harness Engineering book by Vizuara AI Labs — a from-scratch course on building a coding-agent HARNESS (the loop + tools + context engine + durability + orchestration wrapped around an LLM), in the spirit of pi (pi.dev), with Claude Code and Hermes as case studies. The reader builds their own pi-style coding agent layer by layer.

BEFORE WRITING, read these three files (they define the exact style and voice — match them closely):
- ${DIR}/STYLE.md  (the worklog article style: voice, the [[fig:]] figure grammar + semantic colors, [[sn:]] sidenotes)
- ${DIR}/articles/what-is-a-harness.md      (exemplar: a concept article)
- ${DIR}/articles/your-first-bare-harness.md (exemplar: a build article with code)

Then WRITE the markdown file at the path given. Rules:
- Output ONLY the article body markdown. Do NOT put the title as an H1 at the top (the site adds it). Start with a strong opening; use ## for internal sections.
- VOICE: first person, warm, from-foundations, honest — exactly like the two exemplars. Start simple, build up, explain WHY, question the obvious. For build/how-to articles use the rhythm: idea → the smallest code that shows it → what it buys you → what it still misses → bridge to the next layer.
- DEPTH: this is a leaner book than a deep systems text — aim **1,600–2,800 words**. Deep and clear, not padded. Substantive and technically correct.
- Inline code in backticks (renders red): identifiers, tool names, sizes (\`messages\`, \`stop_reason\`, \`run_bash\`, \`CLAUDE.md\`). Bold key terms on first mention.
- CODE BLOCKS: fenced with a language tag (\`\`\`python usually; pseudo-code fine). Build/loop/tools/context/durability articles SHOULD have concise realistic code; pure-concept articles may not.
- FIGURES: include **4–7** using EXACTLY this syntax, each on ITS OWN LINE (never mid-paragraph):
    [[fig: <a DETAILED hand-drawn Excalidraw scene, self-contained, following STYLE.md Part C — name the boxes, the colored handwritten annotations (blue=mechanism/data-flow, green=specs/sizes, red=labels/warnings, purple=code/config, orange=emphasis, yellow=containers/state), dashed arrows, numbered circles, and a dashed takeaway box> || <one-line caption>]]
  Vary the archetypes: an intuition/metaphor figure, a before/after comparison (naive vs the harness way), a loop/pipeline/timeline, a zoom-in, and the precise technical diagram. Draw the CONCEPT, not just a screenshot.
- SIDENOTES: include **2–5** using EXACTLY: [[sn: <caveat / real-world nuance / "one exception" / a cross-link to a sibling chapter>]] mid-sentence.
- Cross-link to sibling articles with markdown links to \`<slug>.html\` where natural.
- Ground it in how REAL harnesses do it (Claude Code, pi, Hermes, Cursor) — this is a practical, current book, not abstract.

Return ONLY: the slug, the word count, and the number of [[fig:]] and [[sn:]] you included. Do not paste the article back.`

function writePrompt(a) {
  return `${PRE}

WRITE THIS FILE: ${DIR}/articles/${a.slug}.md
ARTICLE TITLE (do not repeat as H1): "${a.title}"
SECTION: ${a.section}
WHAT IT MUST COVER: ${a.brief}
SOURCES / references to draw on (fetch if useful): ${a.src}`
}
function verifyPrompt(a) {
  return `Read ${DIR}/STYLE.md, then read ${DIR}/articles/${a.slug}.md.
You are the technical + style editor. FIX IN PLACE (with Edit) any of:
1) TECHNICAL ERRORS or hallucinated APIs (article "${a.title}"; must-cover: ${a.brief}). Cross-check against your knowledge of how coding-agent harnesses actually work (Claude Code, pi, Hermes) and the sources: ${a.src}. Keep code realistic.
2) STYLE: first-person from-foundations worklog voice; 1,600–2,800 words (expand if thin); 4–7 [[fig:]] with DETAILED semantic-color Excalidraw prompts; 2–5 [[sn:]]; no H1 title; internal ## headings.
3) CRITICAL FORMAT BUG: every [[fig:]] MUST start on its own line (not attached to the end of a sentence/paragraph). Fix any inline [[fig:]] by moving it to its own line with a blank line before it. Same for any [[note:]].
Return ONLY: slug, a one-word verdict (CLEAN or FIXED), and a terse list of changes (max 4).`
}

const S = {
  PI:'https://pi.dev', HERMES:'https://hermes-agent.nousresearch.com',
  CC:'https://docs.claude.com/en/docs/claude-code/overview',
  RASCHKA:'https://magazine.sebastianraschka.com/p/components-of-a-coding-agent',
  ANTHROPIC:'https://www.anthropic.com/engineering/building-effective-agents',
  CTX:'https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents',
  WOODX:'https://github.com/woodx9/build-your-claude-code-from-scratch',
  FAREED:'https://github.com/FareedKhan-dev/claude-code-from-scratch',
}
const ARTICLES = [
  // §0 Start Here (5 remaining)
  {slug:'why-just-call-the-api-fails', section:'00 Start Here', title:"Why 'just call the API' fails", brief:'Make the transaction-vs-agent gap concrete: walk a two-line script that calls the model, then show every place it breaks when asked to "fix the failing test" (no files, no shell, no memory, no safety, no recovery). Each break = a harness layer. Motivating, concrete.', src:`${S.RASCHKA}, ${S.ANTHROPIC}`},
  {slug:'prompt-vs-context-vs-harness', section:'00 Start Here', title:'Prompt vs. context vs. harness engineering', brief:'The three disciplines with precise boundaries, drawn as three concentric circles: prompt = what you say (one completion), context = what the model sees each turn (the scarce window), harness = the whole runtime it lives inside. Context engineering is ONE subsystem of the harness. The clarifying chapter.', src:`${S.CTX}, ${S.ANTHROPIC}`},
  {slug:'the-five-layers', section:'00 Start Here', title:'The anatomy: five layers of a harness', brief:'The map: loop, tools+guardrails, context engine, durability, orchestration — one borrowed model at the bottom, five layers of "body" on top. Each layer gives the agent a power the bare model lacked. This chapter is the overview the whole book builds toward.', src:`${S.RASCHKA}, ${S.PI}`},
  {slug:'what-you-will-build', section:'00 Start Here', title:'What you will build: a pi-style harness', brief:'The concrete project: a terminal coding agent you own end to end, in the spirit of pi — reads/edits real files, asks before dangerous actions, compacts its own context, checkpoints every step, resumes after a crash, dispatches sub-agents. Small enough to understand, real enough to use.', src:`${S.PI}, ${S.CC}`},
  {slug:'how-to-use-this-site', section:'00 Start Here', title:'How to use this site', brief:'Orientation: the two surfaces (terminal shell + paper article), the build-along code, how the 6 sections map to the 5 live days, and a suggested reading order for beginners vs people who have built agents before.', src:`${S.PI}`},
  // §1 The Agent Loop (5 remaining)
  {slug:'the-agent-loop-from-first-principles', section:'01 The Agent Loop', title:'The agent loop from first principles', brief:'Derive the loop from nothing: the model can only emit one message, so to make it ACT you call it, check whether it asked for a tool, run the tool, feed the result back, and repeat until it stops asking. The while-loop IS agency. Inversion of control (the agent decides when it is done). Pseudocode + figure.', src:`${S.RASCHKA}, ${S.ANTHROPIC}`},
  {slug:'messages-turns-and-roles', section:'01 The Agent Loop', title:'Messages, turns & roles', brief:'The conversation as an array of typed messages (system, user, assistant, tool_result). A "turn" = one model call + its tool round-trip. The message array IS the agent state — appending to it is the agent remembering. How tool calls and tool_results thread together by id.', src:`${S.CC}, ${S.RASCHKA}`},
  {slug:'stop-conditions', section:'01 The Agent Loop', title:'Stop conditions: when does the loop end?', brief:'The loop ends when the model stops asking for tools (stop_reason). Why you also need a max-turns guard (avoid infinite loops), an interrupt/cancel path, and how "the model decides when it is done" is both powerful and dangerous. Real stop-condition bugs.', src:`${S.RASCHKA}, ${S.PI}`},
  {slug:'streaming-responses', section:'01 The Agent Loop', title:'Streaming responses into a terminal', brief:'Why stream tokens and tool calls as they arrive instead of blocking for the full reply: responsiveness, partial tool-call rendering, the terminal UI that makes the agent feel alive and trustworthy. How streaming changes the loop (accumulate deltas, detect tool_use). Event-based UI updates.', src:`${S.CC}, ${S.PI}`},
  {slug:'the-model-client', section:'01 The Agent Loop', title:'The model client & provider abstraction', brief:'One thin interface over the model API so the harness is model-agnostic — the pi models.json idea. What the client owns (auth, retries, token counting, the request shape) vs what the loop owns. Swapping providers as a config change, and why that boundary matters.', src:`${S.PI}, ${S.ANTHROPIC}`},
  // §2 Tools & Execution (6)
  {slug:'tool-schemas-as-contracts', section:'02 Tools & the Execution Environment', title:'Tool schemas as contracts', brief:'A tool = name + description + JSON-schema for args + a function. The schema is the contract the model reads to call it correctly; the description is prompt-engineering the tool. How schema shape (required fields, enums, good descriptions) teaches the model to call well, and how bad schemas cause bad calls. Code for a couple of tools.', src:`${S.CC}, ${S.RASCHKA}`},
  {slug:'the-core-file-and-shell-tools', section:'02 Tools & the Execution Environment', title:'The core tools: read, write, edit, bash, search', brief:'The handful a coding agent actually needs. Why EDIT (targeted string replace) beats overwrite (less context, fewer mistakes), why a good SEARCH/grep tool is a force multiplier, and how read/write/bash round out the set. The design choices Claude Code made and why. Concise code.', src:`${S.CC}, ${S.WOODX}`},
  {slug:'streaming-tool-calls-to-the-ui', section:'02 Tools & the Execution Environment', title:'Streaming tool calls to the UI', brief:'Showing the user what the agent is doing as it does it: rendering a tool call (name + args) before it runs, then its result; the terminal UX that builds trust; diffs for edits. Why visibility is a safety feature, not just polish.', src:`${S.CC}, ${S.PI}`},
  {slug:'permission-gates-and-approval-modes', section:'02 Tools & the Execution Environment', title:'Permission gates & approval modes', brief:'Why Claude Code asks before rm. The gate sits between a tool call and its execution: allow-lists, per-tool approval, "always allow this", and modes (auto-accept vs ask). Human-in-the-loop for dangerous actions, and how to design gates that are safe without being annoying.', src:`${S.CC}, ${S.ANTHROPIC}`},
  {slug:'sandboxing-and-blast-radius', section:'02 Tools & the Execution Environment', title:'Sandboxing & the blast-radius problem', brief:'An agent runs arbitrary commands, so contain what a mistaken/malicious call can touch: working-directory limits, filesystem/network sandboxes, containers, and permission tiers by app category. The blast-radius mental model. Real risks (prompt injection → destructive tool call).', src:`${S.ANTHROPIC}, ${S.CC}`},
  {slug:'code-mode-vs-tool-mode', section:'02 Tools & the Execution Environment', title:'Code-mode vs. tool-mode', brief:'Sometimes the best tool is a sandbox that runs code the model writes (compute, data-wrangle, chain operations) instead of many fixed tool calls. When code-mode wins (arithmetic, multi-step data ops), when tool-mode wins (safety, determinism), and the tradeoffs. A worked contrast.', src:`${S.ANTHROPIC}, ${S.RASCHKA}`},
  // §3 Context Engineering (6)
  {slug:'the-context-window-as-a-resource', section:'03 Context Engineering', title:'The context window as a resource', brief:'Attention is finite; every token costs money and focus and can dilute the important stuff. Context engineering = deciding what enters the window each turn. The harness is the allocator. Why "just stuff everything in" fails (cost, latency, lost-in-the-middle). Sets up budgets/compaction/memory.', src:`${S.CTX}, ${S.ANTHROPIC}`},
  {slug:'context-budgets', section:'03 Context Engineering', title:'Context budgets: what goes in, what gets evicted', brief:'Accounting for the window: system prompt + memory + recent turns + tool results, each a line item. Token counting, reserving headroom for the reply, and eviction order (what to drop/summarize first). A concrete budget worked out. Tool-result truncation.', src:`${S.CTX}, ${S.CC}`},
  {slug:'compaction-and-summarization', section:'03 Context Engineering', title:'Compaction & summarization', brief:'Surviving a 200-turn session: summarize old turns into a running summary and hydrate it back so the agent never loses the plot. When to compact (threshold), what to preserve verbatim (recent + key facts) vs summarize, and the risk of summarizing away something crucial. The Claude Code /compact idea. Code sketch.', src:`${S.CTX}, ${S.CC}`},
  {slug:'memory-and-claude-md', section:'03 Context Engineering', title:'Memory systems & the CLAUDE.md pattern', brief:'Three memory tiers: in-context (the array), session state, and persistent files. The CLAUDE.md pattern: durable project facts the harness loads EVERY session so the agent starts already knowing the codebase/conventions. Writing vs reading memory; when the agent updates its own memory.', src:`${S.CC}, ${S.CTX}`},
  {slug:'system-prompts-as-infrastructure', section:'03 Context Engineering', title:'System prompts as infrastructure, not prose', brief:'The system prompt is not a personality blurb — the harness ASSEMBLES it every turn from tool definitions, rules, current state, mode, and memory. Treat it like code: templated, versioned, tested. What belongs in system vs a tool result vs memory. How Claude Code layers it.', src:`${S.CC}, ${S.CTX}`},
  {slug:'building-the-context-engine', section:'03 Context Engineering', title:'Build: the context engine', brief:'Wire compaction + persistent memory into the loop from earlier days: count tokens each turn, compact when over budget, load CLAUDE.md at start, assemble the system prompt. Show the agent surviving a long session. Build-along with code, tying Layer 3 into the loop.', src:`${S.CTX}, ${S.CC}`},
  // §4 Durability & Orchestration (6)
  {slug:'durable-execution-and-checkpointing', section:'04 Durability, Recovery & Orchestration', title:'Durable execution & checkpointing', brief:'Wrap every model turn and tool call as a STEP whose result is persisted to a log/db. If the process dies, replay returns cached step results instead of re-running (and re-charging, re-side-effecting). The durable-execution idea (à la DBOS/Temporal) applied to an agent. Idempotency of steps. Code sketch of a run_step wrapper + event log.', src:`${S.ANTHROPIC}, ${S.RASCHKA}`},
  {slug:'replay-and-resumable-sessions', section:'04 Durability, Recovery & Orchestration', title:'Replay & resumable sessions', brief:'How a durable event log makes a session resume exactly where it left off after crash/disconnect/restart — no lost work, no duplicate side effects. Replay semantics (return cached vs re-run), the "already did this tool call" guard, and reconnecting a UI to a running session. Streaming + durability together.', src:`${S.ANTHROPIC}, ${S.RASCHKA}`},
  {slug:'self-healing-loops', section:'04 Durability, Recovery & Orchestration', title:'Self-healing loops: retries & failure classification', brief:'Not every error is fatal. Classify failures (transient: rate-limit/network/5xx — retry with backoff; terminal: bad tool args/logic — surface or let the model fix). Retry policy, giving the model the error to self-correct, and when to stop. Keeping the loop alive instead of crashing on the first hiccup.', src:`${S.ANTHROPIC}, ${S.RASCHKA}`},
  {slug:'sub-agents-and-handoffs', section:'04 Durability, Recovery & Orchestration', title:'Sub-agents & handoffs', brief:'When one context can\'t hold the job, spawn a focused sub-agent with its own context + tools, let it work, and return ONLY its conclusion (context isolation). Sub-agents (parallel investigators, return a result) vs handoffs (transfer control to a specialist). When to use each; how the parent dispatches and synthesizes. Cross-link orchestration.', src:`${S.ANTHROPIC}, ${S.CC}`},
  {slug:'supervision-and-plan-mode', section:'04 Durability, Recovery & Orchestration', title:'Supervision & plan mode', brief:'A supervisor that makes a PLAN, dispatches sub-agents to execute steps (possibly in parallel), and synthesizes their findings. Plan-mode as a safety + quality mechanism (read-only investigation, human approves the plan before execution). Structured-output plans. How Claude Code plan mode + sub-agent types work.', src:`${S.CC}, ${S.ANTHROPIC}`},
  {slug:'human-in-the-loop', section:'04 Durability, Recovery & Orchestration', title:'Human-in-the-loop: plans, approvals, escalation', brief:'Some actions should wait for a human: build the approval gate (pause the durable loop, surface the proposed action, resume on approve/deny) and escalation paths. Tie durability + orchestration together: the checkpointed dispatcher with an approval gate. The Day-4 build capstone. Code sketch.', src:`${S.ANTHROPIC}, ${S.CC}`},
  // §5 Production Harnesses (5)
  {slug:'pi-internals', section:'05 Production Harnesses & Capstone', title:'pi internals: the minimal-surface philosophy', brief:'How pi (pi.dev) stays tiny: a small core, extensions, models.json for model-agnosticism, and a deliberately minimal surface. The proof a real harness need not be enormous. Map pi\'s design onto the five layers you built. What it chooses to keep small and why.', src:`${S.PI}`},
  {slug:'hermes-internals', section:'05 Production Harnesses & Capstone', title:"Hermes internals: a research lab's harness", brief:'Nous Research\'s Hermes as a contrast case: a different set of design choices for the same problems (loop, tools, memory, control). What a research-lab harness optimizes for vs a product one. Map it onto the five layers; highlight where it diverges from pi and Claude Code.', src:`${S.HERMES}`},
  {slug:'claude-code-internals', section:'05 Production Harnesses & Capstone', title:'Claude Code internals: skills, hooks, MCP, sub-agents', brief:'The reference production harness, mapped onto the layers you built: permission modes, hooks (deterministic automation around tool calls), skills (packaged capabilities), MCP servers (external tools), sub-agent types, and compaction. How each is a productionized version of something in this book.', src:`${S.CC}`},
  {slug:'evaluating-a-harness', section:'05 Production Harnesses & Capstone', title:'Evaluating a harness: how you know yours works', brief:'Beyond "it ran": task success rate, recovery under injected failure (kill the process — does it resume?), token efficiency, latency, and safe-by-default behavior (does the gate actually stop a bad command?). How to build a small eval harness for your harness. What "good" looks like per layer.', src:`${S.ANTHROPIC}, ${S.CC}`},
  {slug:'the-capstone', section:'05 Production Harnesses & Capstone', title:'The capstone: your own harness', brief:'Assemble all five layers (loop, tools+guardrails, context engine, durability, orchestration) into your own pi-style coding agent; a checklist of what "done" means per layer; ideas to extend it; and how to demo it live. The victory-lap chapter that ties the whole book together.', src:`${S.PI}, ${S.CC}`},
]

phase('Write')
log(`Writing ${ARTICLES.length} harness articles (write -> verify), moderate depth, 4-7 figures each…`)
const results = await pipeline(
  ARTICLES,
  a => agent(writePrompt(a), { label: `write:${a.slug}`, phase: 'Write' }),
  (prev, a) => agent(verifyPrompt(a), { label: `verify:${a.slug}`, phase: 'Verify' }).then(v => ({ slug: a.slug, v })),
)
const ok = results.filter(Boolean)
log(`Done: ${ok.length}/${ARTICLES.length} articles written + verified.`)
return { total: ARTICLES.length, completed: ok.length }
