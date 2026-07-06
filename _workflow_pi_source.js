export const meta = {
  name: 'harness-pi-source',
  description: 'Write the 5 "Pi, for Real" source-study articles (Vercel Academy ↔ Pi), grounded in FACTS_PI.md',
  phases: [{ title: 'Write' }, { title: 'Verify' }],
}
const DIR = 'harness-book-site'
const PISRC = '/private/tmp/claude-501/-Users-rajat-Desktop-Ramco-Rise-Claude-3/71a9f140-76d8-4ea8-a35a-49c100fa0b3f/scratchpad/pi-src'

const PRE = `You are writing ONE article for Vizuara's HARNESS ENGINEERING book — a NEW appendix section
"Pi, for Real: Two Harnesses, Line by Line". This section puts Vercel Academy's teaching harness
(TeensyCode, TypeScript on the Vercel AI SDK) next to the ACTUAL source of Pi (earendil-works/pi,
a.k.a. badlogic/pi-mono, pi.dev) and answers, with real code, what a production coding agent actually
does. The reader has already read the conceptual book (loop, tools, context, durability, orchestration).

READ THESE FIRST (they define the exact style — match voice + figure grammar precisely):
- ${DIR}/STYLE.md            (the worklog article style: warm-white serif page, red inline code, sidenotes, figure grammar + semantic colors)
- ${DIR}/articles/what-is-a-harness.md      (STYLE exemplar — concept voice)
- ${DIR}/articles/your-first-bare-harness.md (STYLE exemplar — code-forward voice)

GROUND TRUTH — READ AND OBEY (this is the ONLY source of truth for Pi internals):
- ${DIR}/FACTS_PI.md   (exact constants, file paths, mechanisms, and the full Vercel→Pi mapping table).
You MAY also read the real Pi source to quote/verify (it is cloned at ${PISRC}); e.g.
  ${PISRC}/packages/agent/src/harness/compaction/compaction.ts
  ${PISRC}/packages/ai/src/api/anthropic-messages.ts
  ${PISRC}/packages/coding-agent/src/core/tools/truncate.ts
  ${PISRC}/packages/coding-agent/src/core/tools/output-accumulator.ts
  ${PISRC}/packages/coding-agent/src/core/tools/{read,bash,grep,find}.ts

HARD ACCURACY RULES:
- Use ONLY the numbers/paths/mechanisms in FACTS_PI.md (or verified against the cloned source). Do NOT invent
  constants, file names, or behaviors. If a detail isn't established, say "Pi leaves this to extensions" — do
  not guess. Every specific number (16384, 20000, 2000 lines, 50 KB, 100 matches, 500 chars, 1000 results) must
  match FACTS_PI.md exactly.
- Cite real Pi file paths inline in \`red code\` (e.g. \`packages/agent/src/harness/compaction/compaction.ts\`)
  so a reader can open them. Short quoted code snippets are welcome; keep them faithful to the real API shape.
- Where useful, contrast Pi's real choice with the simpler thing Vercel Academy teaches (name the module).

STYLE requirements (match STYLE.md + the pilots):
- Warm, precise, Socratic. Short sentences. Explain from the reader's existing mental model of the five layers.
- 1,300–2,200 words. Do NOT put an H1 title (the site adds it); open with a strong hook sentence; use ## internally.
- 3–6 [[fig:]] figures, EACH ON ITS OWN LINE, each a detailed self-contained Excalidraw scene with the semantic
  color grammar (blue=mechanism/flow, green=specs/values, red=labels/warnings, purple=code, orange=emphasis,
  yellow=state/containers), numbered circles + a dashed takeaway box. Prefer before/after and "where the
  breakpoint sits" / "what gets kept vs summarized" / "bounded slice + pointer to more" style diagrams.
- A few [[sn: ...]] sidenotes for nuance. Use real \`inline code\` for identifiers, constants, and file paths.
- Cross-link sibling articles with relative .html links where natural (e.g. compaction-and-summarization.html,
  the-context-window-as-a-resource.html, pi-internals.html, and the other four articles in THIS section).

Return ONLY: the slug, word count, and how many [[fig:]] and [[sn:]] you included. Do not paste the article back.`

function wp(a) {
  return `${PRE}

WRITE THIS FILE: ${DIR}/articles/${a.slug}.md
ARTICLE TITLE (do not repeat as H1): "${a.title}"
WHAT THIS ARTICLE MUST COVER (all facts from FACTS_PI.md):
${a.brief}`
}

const ART = [
  { slug: 'two-reference-harnesses', title: 'Two reference harnesses: TeensyCode vs. Pi',
    brief: `Frame the whole section. Two real coding-agent harnesses worth studying: (1) Vercel Academy's TeensyCode — a TEACHING harness built lesson-by-lesson where "each step exists because the previous one broke something" (38 lessons / 11 modules, TypeScript on the Vercel AI SDK); brilliant for LEARNING. (2) Pi (earendil-works/pi, MIT, pi.dev) — a real PRODUCTION harness whose defining choice is a small core plus an extension surface: "a minimal agent harness — adapt Pi to your workflows." Explain Pi's PACKAGE MAP from FACTS_PI.md (pi-ai = unified provider API incl. cache control; pi-agent-core = loop + messages + compaction + skills + system prompt; pi-coding-agent = toolbox + truncation + surfaces + extensions; tui; experimental orchestrator) and the actual toolbox (read/write/edit/bash/grep/find/ls + MCP). Thesis: they agree on the fundamentals (loop, bounded outputs, compaction, cache control, skills-as-progressive-disclosure), which is why reading BOTH is the fastest way to understand a real coding agent. End by pointing to the four deep-dives that follow. One clear figure of the two harnesses side by side, one of Pi's layered packages.` },
  { slug: 'vercel-academy-to-pi-mapping', title: 'The full mapping: 11 modules to the Pi source',
    brief: `The anchor reference page. Reproduce the FULL Vercel-Academy(11 modules) → Pi mapping TABLE from FACTS_PI.md as a real markdown table (module | where Pi does it, with the real file path | Pi's real choice/difference). Then walk the reader through the interesting rows in prose: the loop (agent-loop.ts), tool design (rich instructional descriptions + tool-definition-wrapper; approval as an extension), the deliberately MINIMAL system prompt + AGENTS.md project context (loaded from ~/.pi, parents, cwd), the pluggable execution env (agent/src/harness/env/nodejs.ts) vs Vercel's fixed 3-backend sandbox interface, subagents/orchestrator (experimental), Skills = progressive disclosure (skills.ts) which matches Vercel EXACTLY, and Pi's multi-surface design (TUI + --print/JSON + RPC + SDK from one core). Keep Module 5 (context) brief here and defer to the three deep-dives. A figure of the mapping as two columns with arrows; a figure of "one Pi core, many surfaces (TUI/print/RPC/SDK)".` },
  { slug: 'how-pi-manages-context', title: 'How Pi manages context (not "the last three messages")',
    brief: `THE correction to the common belief. Vercel Academy teaches a simple pruneMessages that drops the oldest/stale tool results (a sliding window). Show that Pi's DEFAULT is different: summarization-based compaction on a REAL token budget (packages/agent/src/harness/compaction/compaction.ts). Cover EXACTLY, from FACTS_PI.md: shouldCompact triggers when contextTokens > contextWindow − reserveTokens; DEFAULT_COMPACTION_SETTINGS = { enabled:true, reserveTokens:16384, keepRecentTokens:20000 }; token count comes from the PROVIDER'S REAL usage block on the last assistant message (calculateContextTokens = usage.totalTokens || input+output+cacheRead+cacheWrite) plus an estimate only for trailing messages (estimateContextTokens) — i.e. cache-aware and exact, not a char guess. What compaction DOES: keep ~20,000 tokens of the most recent conversation verbatim, and summarize everything older into a single role:"compactionSummary" message (COMPACTION_SUMMARY_PREFIX) that is STRUCTURED — it preserves [Decision] rationales and an explicit list of files read vs files modified (extractFileOperations/formatFileOperations). It's a first-class harness PHASE (this.phase="compaction") with hooks session_before_compact (cancelable / overridable) and session_compact, plus branch-summarization for side branches. Contrast crisply with the sliding-window/last-N approach: Pi keeps a recent window AND a durable digest of WHY, so it doesn't forget decisions from 40 turns ago. Figures: "budget trigger" (a bar filling toward contextWindow with a 16,384 reserve band), and "what's kept vs summarized" (recent 20k verbatim + older→structured summary with decisions/files).` },
  { slug: 'how-pi-does-cache-control', title: 'How Pi does cache control: the rolling breakpoint',
    brief: `Deep-dive on prompt caching (packages/ai/src/api/anthropic-messages.ts). Start from why caching matters: a coding session re-sends the entire growing prefix every turn; without caching you pay full price for the same system prompt + tool schemas + history over and over. Vercel Academy says "add provider cache headers"; show what Pi actually does. From FACTS_PI.md: cacheControl = { type:"ephemeral", ...(ttl && {ttl}) } with 1-hour TTL support (usage.cacheWrite1h from cache_creation.ephemeral_1h_input_tokens). The key move (quote the source comment): "Add cache_control to the last user message to cache conversation history" — Pi puts the breakpoint on the LAST content block of the LAST user message (newest tool_result/text/image). Because Anthropic caches the whole prefix UP TO a breakpoint, a breakpoint at the tail caches everything before it; next turn the breakpoint moves forward to the new tail, so only the delta is a fresh cache write — a ROLLING breakpoint that follows the conversation. Pi ALSO breakpoints the LAST tool in the tools array (convertTools: index === tools.length−1) so the entire tool-schema block caches as one chunk, and threads cache_control onto the system blocks. Net effect: a 100-turn Pi session stays cheap because system + tools + history are served from cache; only the newest turn writes. Explain the mental model of "prefix cache" and why the breakpoint must sit at the END, not the start. Figures: "where the breakpoint sits" (system → tools[last]✦ → messages… → last-user-block✦, prefix highlighted as cached), and a before/after cost bar (no cache: every turn full price vs rolling: only delta priced).` },
  { slug: 'how-pi-truncates-tool-output', title: 'Does Pi serve the agent everything? (No, it truncates)',
    brief: `Answer the exact question: does Pi dump full tool output into context, or bound it? ANSWER: Pi BOUNDS every tool (packages/coding-agent/src/core/tools/truncate.ts + output-accumulator.ts). From FACTS_PI.md, use these EXACT values: DEFAULT_MAX_LINES=2000, DEFAULT_MAX_BYTES=50*1024 (50 KB), GREP_MAX_LINE_LENGTH=500. Universal rule: truncate at 2,000 lines OR 50 KB, whichever first. Two directions: truncateHead (keep beginning) vs truncateTail (keep end), chosen per tool. Per tool: read → truncateHead (top of file), offset/limit paging, description tells the model to "continue with offset until complete"; a single >50KB line is refused with a sed suggestion. bash → OutputAccumulator streams with bounded memory, keeps the TAIL, and when output exceeds the cap SPILLS THE FULL OUTPUT to a temp file (/tmp/pi-output-<hex>.log) and appends "[Showing lines X-Y of TOTAL (50KB limit). Full output: <path>]" — nothing lost, escape hatch provided. grep → 100 matches (DEFAULT_LIMIT, overridable) or 50KB, lines truncated to 500 chars, "N matches limit reached. Use limit=2N or refine pattern". find → 1000 results. Explain the OutputAccumulator streaming design (incremental UTF-8 decode, keep a rolling tail = maxBytes*2, lazily open temp file) so memory stays bounded even for a 500MB command. PHILOSOPHY: "bounded by default, with a pointer to more" — the model gets a 50KB/2000-line slice plus a way to fetch the rest (temp file, offset/limit, or refine). This is EXACTLY Vercel Academy Module 5 Lesson 18 ("cap every tool's output") but shipped as uniform core infrastructure. Figures: a table/diagram of per-tool caps (read/bash/grep/find with their numbers + head-vs-tail), and "bounded slice + pointer to temp file" (giant raw output → 50KB slice to the model + full file on disk).` },
]

phase('Write')
log(`Writing ${ART.length} Pi source-study articles (facts pinned to FACTS_PI.md)…`)
const results = await pipeline(
  ART,
  a => agent(wp(a), { label: `write:${a.slug}`, phase: 'Write' }).then(() => a),
  (a) => agent(
    `Verify the article ${DIR}/articles/${a.slug}.md for FACTUAL ACCURACY against ${DIR}/FACTS_PI.md and the cloned Pi source at ${PISRC}. ` +
    `Check EVERY number, file path, and mechanism matches FACTS_PI.md exactly (16384/20000 reserve+keep, 2000 lines, 50KB, 100 matches, 500 chars, 1000 results, rolling cache breakpoint on last-user-block + last-tool, head-vs-tail truncation, temp-file spill). ` +
    `Also check: no H1 title at top, every [[fig:]] is on its OWN line, 3-6 figures present, inline code uses real file paths, style matches the pilots. ` +
    `If anything is wrong or invented, FIX it in place with Edit (correct numbers/paths, move a mid-line [[fig:]] to its own line, tighten style). ` +
    `Return one line: slug + "OK" or the list of fixes you made.`,
    { label: `verify:${a.slug}`, phase: 'Verify' }
  )
)
log(`Done: ${results.filter(Boolean).length}/${ART.length} articles written + verified.`)
return { total: ART.length, completed: results.filter(Boolean).length }
