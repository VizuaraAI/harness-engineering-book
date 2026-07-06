export const meta = {
  name: 'harness-pi-scratch',
  description: 'Write the 8 "Pi from Scratch" build chapters, grounded in FACTS_PI.md (mechanisms 5-11)',
  phases: [{ title: 'Write' }, { title: 'Verify' }],
}
const DIR = 'harness-book-site'
const PISRC = '/private/tmp/claude-501/-Users-rajat-Desktop-Ramco-Rise-Claude-3/71a9f140-76d8-4ea8-a35a-49c100fa0b3f/scratchpad/pi-src'

const PRE = `You are writing ONE chapter of the "Pi from Scratch" section of Vizuara's HARNESS ENGINEERING book.
GOAL OF THE SECTION: teach how the REAL Pi coding agent (earendil-works/pi, MIT) actually works, built up from an
empty file ONE LAYER AT A TIME — each layer motivated by what the previous chapter left missing (the same causal,
"each step exists because the last one broke something" pedagogy that makes a great from-scratch course). This is
NOT a comparison to any other tool. Do NOT frame it as "TeensyCode vs Pi" or map modules to Pi. The subject is Pi's
own real code, start to finish. (A single passing sentence acknowledging the from-scratch teaching style is fine;
the focus is 100% Pi.)

READ FIRST (match voice + figure grammar EXACTLY):
- ${DIR}/STYLE.md
- ${DIR}/articles/what-is-a-harness.md  and  ${DIR}/articles/your-first-bare-harness.md  (style exemplars)
GROUND TRUTH (the ONLY source for Pi internals — obey it, invent nothing):
- ${DIR}/FACTS_PI.md  (use the sections named below). You MAY open the cloned source to quote real code:
  ${PISRC}/  (packages: ai, agent, coding-agent, orchestrator, tui).

HARD ACCURACY RULES:
- Use ONLY names/paths/constants/mechanisms from FACTS_PI.md (or verified against the cloned source). Invent nothing.
  If a detail isn't established, say "Pi leaves this to an extension" rather than guessing.
- Cite real Pi file paths inline in \`code\` (e.g. \`packages/agent/src/agent-loop.ts\`). Short faithful code
  excerpts are welcome and encouraged — quote the real API shape (real type/function/event names), do not fabricate.
- This is a BUILD chapter: open by motivating the layer (what the last chapter left missing), then show how Pi
  builds it, with real code + a concrete "watch it happen" moment.

STYLE: warm, precise, Socratic; short sentences; 1,400–2,300 words; NO H1 title (site adds it); open with a strong
hook; use ## internally. 4–6 [[fig:]] figures EACH ON ITS OWN LINE, semantic color grammar (blue=mechanism/flow,
green=specs/values, red=labels/warnings, purple=code, orange=emphasis, yellow=state/containers), numbered circles +
a dashed takeaway box. A few [[sn:]] sidenotes. Cross-link siblings with relative .html links (the other Pi
chapters: pi-how-it-all-fits, pi-from-chat-to-agent, pi-the-toolbox, pi-tool-safety, pi-the-system-prompt,
pi-the-execution-environment, how-pi-manages-context, how-pi-does-cache-control, how-pi-truncates-tool-output,
how-pi-does-subagents, pi-surfaces, pi-extensibility).
Return ONLY: slug, word count, #figs, #sidenotes. Do not paste the chapter back.`

function wp(a) {
  return `${PRE}

WRITE THIS FILE: ${DIR}/articles/${a.slug}.md
CHAPTER TITLE (do not repeat as H1): "${a.title}"
GROUND-TRUTH SECTION(S) OF FACTS_PI.md TO USE: ${a.facts}
WHAT THIS CHAPTER MUST TEACH:
${a.brief}`
}

const ART = [
  { slug: 'pi-how-it-all-fits', title: 'Pi from scratch: the plan',
    facts: 'Package map + "The actual toolbox" + skim all mechanisms',
    brief: `The section's front door — the whole of Pi on one page before we build it. Cover: (1) What Pi is —
"a minimal agent harness; adapt Pi to your workflows" — a small core plus an extension surface where the policy
lives (earendil-works/pi, MIT). (2) The THREE package layers and what each owns: \`packages/ai\` (pi-ai: unified
multi-provider LLM API + cache control), \`packages/agent\` (pi-agent-core: the loop, message/session model,
compaction, skills, system-prompt assembly), \`packages/coding-agent\` (pi-coding-agent: the toolbox, tool-output
truncation, surfaces, extensions) — plus \`tui\` and the experimental \`orchestrator\`. (3) The build order we'll
follow, one layer per chapter, each because the last left something missing: loop → toolbox → tool safety → system
prompt → execution environment → context/cache/truncation → subagents → surfaces → extensibility. Set expectations:
every claim is read from the source. A figure of the three layers, a figure of the build-order ladder.` },
  { slug: 'pi-from-chat-to-agent', title: 'The loop: from a chat call to an agent',
    facts: 'MECHANISM 5 — THE LOOP',
    brief: `The beating heart. Start from "a model call answers once; an agent keeps going until the job is done —
what turns one into the other is a loop." Then teach Pi's real \`runLoop()\` (\`packages/agent/src/agent-loop.ts\`):
the turn shape (emit turn_start → stream the assistant message with a \`stopReason\` → extract tool calls
\`message.content.filter(c => c.type === "toolCall")\` → \`executeToolCalls()\` → append tool results → repeat).
The THREE stop conditions (stopReason error/aborted; \`shouldStopAfterTurn\`; no tool calls AND no pending/steering
AND no follow-up) and that there is NO hard max-turns; abort via AbortSignal → stopReason "aborted". The message
model: roles \`user | assistant | toolResult\` plus harness custom \`bashExecution | compactionSummary |
branchSummary | custom\`; a toolResult is threaded back by matching \`toolCallId\` to the assistant's \`toolCall.id\`.
The key subtlety worth its own figure: the LOOP sees a FLAT array (\`AgentContext.messages\`), but the HARNESS stores
a SESSION TREE of \`SessionTreeEntry\` nodes (which is what makes fork/clone + branch navigation possible) and
flattens the current branch for the loop — "the loop is linear; the harness remembers a tree." Mention phases
(idle→turn→idle, plus compaction/branch_summary) and that tool execution defaults to PARALLEL. Figures: one lap of
runLoop; the flat-array-vs-session-tree distinction.` },
  { slug: 'pi-the-toolbox', title: 'The toolbox: giving Pi hands',
    facts: 'MECHANISM 6 — THE TOOLBOX + TOOL SHAPE',
    brief: `A loop that can only talk is a chatbot; this chapter gives it hands. Pi's real toolbox
(\`packages/coding-agent/src/core/tools/\`): \`read, write, edit, bash, grep, find, ls\` (+ MCP tools). The SHAPE of a
Pi tool: \`{ name, label, description, parameters (a TypeBox schema), execute(toolCallId, params, signal, onUpdate,
ctx) }\` with optional \`prepareArguments\` / \`renderCall\` / \`renderResult\` / \`executionMode\`. Make the central
point: the \`description\` string IS the model's real API — it's how the model learns when and how to call the tool
(quote read's instructional description telling the model to page with offset/limit). Walk one tool end to end
(e.g. read or bash) showing name+description+schema+execute. Foreshadow the next chapters: these tools can do damage
(→ tool safety) and their output can be huge (→ how-pi-truncates-tool-output, link it). Figures: the two halves of a
tool (schema the model reads + execute we run); the toolbox as a labeled set.` },
  { slug: 'pi-tool-safety', title: 'Tool safety: permission gates, protected paths, trust',
    facts: 'MECHANISM 7 — TOOL SAFETY',
    brief: `Motivate viscerally: the first time \`bash\` runs a command you didn't expect, you understand why this
layer exists. Teach Pi's real safety model — it hooks the \`tool_call\` event BEFORE a tool executes. Permission gate
(\`examples/extensions/permission-gate.ts\`): \`pi.on("tool_call", handler)\` fires before execution; return
\`{ block: true, reason }\` to stop it; \`event.input\` is MUTABLE (mutate to patch args, no re-validation);
non-interactive (\`!ctx.hasUI\`) blocks dangerous commands by default, interactive calls \`ctx.ui.select(...)\`.
Protected paths (\`protected-paths.ts\`): same hook, block \`write\`/\`edit\` to \`.env\`, \`.git/\`, \`node_modules/\`.
Project trust (\`core/project-trust.ts\`): a STARTUP event \`project_trust {cwd}\` resolved BEFORE project extensions /
\`.pi\` config / AGENTS.md load — decision yes/no/undecided(+remember) — the gate on whether a repo's own code is
trusted to run. Sandbox (\`examples/extensions/sandbox/\`): wraps \`BashOperations\` with
\`SandboxManager.wrapWithSandbox()\` (\`@anthropic-ai/sandbox-runtime\` → sandbox-exec on macOS, bubblewrap on Linux)
with FS/network allow-deny lists — this is the "blast radius" idea. Emphasize the design: safety is POLICY expressed
as hooks around tool execution, so it's visible and swappable, not buried. Figures: the tool_call gate (tool → hook →
block? → execute); the trust-before-load ordering.` },
  { slug: 'pi-the-system-prompt', title: 'The system prompt: how Pi tells the model who it is',
    facts: 'MECHANISM 8 — THE SYSTEM PROMPT',
    brief: `Correct the myth up front: it's not one magic string, and although Pi's CORE is small, the assembled
prompt is COMPOSITIONAL. Teach \`buildSystemPrompt()\` (\`packages/coding-agent/src/core/system-prompt.ts\`), assembled
in order: (1) a base template ("a coding assistant operating inside pi" + a tools section) OR a supplied
\`customPrompt\`; (2) appended \`appendSystemPrompt\`; (3) a \`<project_context>\` XML block of every AGENTS.md/CLAUDE.md
found; (4) an \`<available_skills>\` XML block — ONLY if the \`read\` tool is present; (5) the current date + working
directory, stamped last. Then project-context loading (\`core/resource-loader.ts loadProjectContextFiles()\`):
candidates \`AGENTS.md|AGENTS.MD|CLAUDE.md|CLAUDE.MD\`; load GLOBAL from \`~/.pi/agent/\` first, then walk UP the
ancestor chain from cwd collecting files (dedup by path), merged global-first then furthest→closest — reloaded on
each resource reload. Point to skills detail in pi-extensibility.html. The teaching idea: the model's sense of "who
am I, where am I, what do I know about this project" is ASSEMBLED fresh, not hardcoded. Figures: the layered prompt
assembly (5 stacked pieces); the AGENTS.md walk-up from cwd + global.` },
  { slug: 'pi-the-execution-environment', title: 'The execution environment: local, SSH, sandboxed',
    facts: 'MECHANISM 9 — THE EXECUTION ENVIRONMENT',
    brief: `Ask the question the toolbox chapter left open: where do the tools actually RUN? Teach two layers.
(1) The harness-level \`ExecutionEnv extends FileSystem, Shell\` (\`packages/agent/src/harness/types.ts\`, impl
\`env/nodejs.ts NodeExecutionEnv\`): every method returns \`Result<T, Error>\` and NEVER throws (errors are values) —
\`FileSystem\` (readTextFile/writeFile/listDir/…) + \`Shell\` (\`exec → {stdout, stderr, exitCode}\`). (2) The
per-tool OPERATIONS injection that makes the backend swap without touching the tool: \`BashOperations.exec\`,
\`ReadOperations.{readFile, access, detectImageMimeType}\`, plus Write/Edit/Grep ops; default
\`createLocalBashOperations()\` / \`defaultReadOperations\`. Show the payoff: the SSH extension
(\`examples/extensions/ssh.ts\`) supplies \`createRemoteBashOps\`/\`createRemoteReadOps\` that shell out over \`ssh\`
with path translation; the sandbox extension supplies sandboxed bash ops — SAME \`read\`/\`bash\`/\`edit\`, three
places to run: local, SSH, sandbox. The idea: decouple WHAT a tool does from WHERE it runs. Figures: the same tool
over three swappable backends (local / SSH / sandbox); the Result-not-throw error model.` },
  { slug: 'pi-surfaces', title: 'Surfaces: one headless core, four front-ends',
    facts: 'MECHANISM 10 — SURFACES',
    brief: `The realization that a harness is not a UI. Teach Pi's core \`AgentSession\` (\`packages/coding-agent/src/
core/agent-session.ts\`) — mode-agnostic: \`prompt()\`, \`subscribe(event)\`, \`setModel\`, \`navigateTree\`, \`dispose\`
— and the FOUR surfaces selected by \`resolveAppMode\` in \`src/main.ts\` / \`cli/args.ts\`: interactive TUI (default
on a TTY), print (\`--print\`/\`-p\`, or when stdin/stdout isn't a TTY: run once, emit text, exit), json
(\`--mode json\`), and rpc (\`--mode rpc\`: strict JSONL over stdin/stdout, 100+ commands — prompt/steer/follow_up/
abort, get_state/get_messages/get_tree, set_model, compact, new_session/switch_session/fork/clone). Plus the SDK:
\`createAgentSession()\` (auto-discovers extensions/skills/prompts) and \`createAgentSessionRuntime()\` (full control:
your own ResourceLoader, model, explicit tool allowlist) to embed Pi in your own app. The teaching point: separating
the agent from the way you talk to it is WHY the same engine can be a terminal, a script, a server, and a library.
Figures: one core with four front-ends fanning out; an RPC JSONL exchange (prompt in → events out).` },
  { slug: 'pi-extensibility', title: 'Extensibility: everything is an extension',
    facts: 'MECHANISM 11 — EXTENSIBILITY',
    brief: `The last layer, and the one that makes Pi Pi — how a small core becomes anything. Teach the extension
model: \`export default function (pi: ExtensionAPI) {…}\` loaded via jiti from \`~/.pi/agent/extensions/*.ts\`
(global), \`.pi/extensions/*.ts\` (project, AFTER the trust gate), \`-e <path>\`, or \`settings.json\`
(\`extensions\`/\`packages\` incl. \`npm:\`/\`git:\`). The \`pi.*\` API: \`registerTool\`, \`registerCommand\` (slash
commands), \`registerShortcut\`, \`registerFlag\`, \`registerProvider\` (whole custom LLM providers + OAuth),
\`registerMessageRenderer\`; session actions; and the cross-extension \`pi.events\` bus. The heart: \`pi.on(EVENT,
handler)\` over ~31 lifecycle events — name the important ones and what they enable: \`context\` (rewrite messages
before the LLM call — RAG, memory), \`session_before_compact\` (custom compaction / handoff), \`tool_call\`
(blockable — this is where the whole safety chapter plugged in), \`tool_result\`, \`before_provider_request\`,
turn_start/turn_end, etc. Then SKILLS as progressive disclosure (\`core/skills.ts\`): a skill is a markdown file
(\`SKILL.md\` at a dir root, or a \`.md\`) with frontmatter \`{name, description, disable-model-invocation}\`; only
name+description+location go into the \`<available_skills>\` prompt block, and the model loads the full body ON DEMAND
with the read tool; skills live in \`~/.pi/agent/skills/\` and \`.pi/skills/\`. Close the section: the small core +
this event/registration surface is the whole thesis — you adapt Pi to you, not the other way around. Figures: the
ExtensionAPI surface (register* + on(events) + events bus); progressive disclosure (skill names in prompt → body
read on demand).` },
]

phase('Write')
log(`Writing ${ART.length} Pi-from-scratch chapters (facts pinned)…`)
const results = await pipeline(
  ART,
  a => agent(wp(a), { label: `write:${a.slug}`, phase: 'Write' }).then(() => a),
  (a) => agent(
    `Verify ${DIR}/articles/${a.slug}.md against ${DIR}/FACTS_PI.md (${a.facts}) and the cloned Pi source at ${PISRC}. ` +
    `Confirm every file path, type/function/event name and constant is REAL and matches the facts (no invented APIs); ` +
    `confirm it is framed as "how Pi works, built from scratch" and NOT as a TeensyCode/Vercel comparison or module-mapping table. ` +
    `Check: no H1 at top, every [[fig:]] on its own line, 4-6 figures, real file paths in inline code, style matches the pilots. ` +
    `Fix any problem in place with Edit. Return one line: slug + "OK" or the fixes made.`,
    { label: `verify:${a.slug}`, phase: 'Verify' }
  )
)
log(`Done: ${results.filter(Boolean).length}/${ART.length} chapters written + verified.`)
return { total: ART.length, completed: results.filter(Boolean).length }
