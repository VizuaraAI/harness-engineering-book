export const meta = {
  name: 'harness-mentor',
  description: 'Write the 18 Harness Engineering Mentor Handbook chapters (teach-the-teacher, metaphor-rich)',
  phases: [{ title: 'Write' }],
}
const DIR = 'harness-book-site'
const KMENTOR = 'kernel-engineering-site/mentor'
const PRE = `You are writing ONE chapter of "The Mentor's Handbook" for Vizuara's HARNESS ENGINEERING workshop — a teach-the-teacher companion so a mentor can LEARN a topic from scratch and then STAND UP and TEACH it across the five live days, culminating in building a coding harness like pi live with the cohort. The workshop builds a coding-agent harness (loop + tools + context engine + durability + orchestration around an LLM) one layer per day.

READ THESE FIRST (they define the exact style — match voice and depth precisely):
- ${DIR}/MENTOR_STYLE.md  (the handbook style: the 7 ingredients, the [[note: TYPE || ...]] callouts, metaphor + technical figures)
- ${KMENTOR}/mg-matmul-from-scratch.md  (STYLE exemplar — different topic, IDENTICAL style to match)
- ${KMENTOR}/mg-cpu-vs-gpu.md            (STYLE exemplar — different topic, IDENTICAL style to match)
- the grounding book article(s) below for the correct technical framing (read them if written; if a file is missing/stub, rely on your own strong knowledge of how coding-agent harnesses work — Claude Code, pi, Hermes, Cursor).

Then WRITE the file at the path below, following MENTOR_STYLE.md:
- Warm, simple, second-person-to-the-mentor voice. Explain from ZERO. Short sentences. Over-explain rather than under-explain.
- Every concept gets the seven ingredients: plain words -> a METAPHOR -> a tiny concrete example -> the real mechanism -> "in production TODAY" link (Claude Code / pi / Cursor / Hermes) -> teaching notes (board plan, sequence, the live demo, the aha moment) -> the common student confusion + the fix.
- Use the callout blocks liberally, EXACT syntax on their own line: [[note: TYPE || content]] where TYPE is one of metaphor, example, production, teach, say, demo, confusion, aha. Aim 6-10 callouts.
- 5-8 [[fig:]] figures, EACH ON ITS OWN LINE. MIX two flavors: (1) warm METAPHOR illustrations that draw the analogy (a kitchen, a to-do list, a factory line, a save point, a delegation org-chart, a fire door) — charming, hand-drawn, friendly; and (2) technical Excalidraw diagrams with the semantic-color grammar (blue=mechanism/flow, green=specs, red=labels/warnings, purple=code, orange=emphasis, yellow=state/containers), dashed arrows, numbered circles, dashed takeaway box. Every [[fig:]] prompt detailed + self-contained.
- A few [[sn:]] sidenotes for nuance are welcome.
- Open with the ONE-sentence goal ("By the end of this chapter you can teach ..."). End with a "## You can now teach" section: a 4-6 bullet checklist.
- Length 1,500-2,600 words. Do NOT put an H1 title at the top (the site adds it); start with prose; use ## internally.

For the delivery-craft chapters (lecture plans), give concrete block-by-block timings for a 2-hour morning session (7:00-9:00 AM IST), the board sequence, the one live BUILD demo per block, and checkpoint questions.

Return ONLY: the slug, the word count, and how many [[fig:]] and [[note:]] callouts you included. Do not paste the chapter back.`

function chPrompt(c) {
  return `${PRE}

WRITE THIS FILE: ${DIR}/mentor/${c.slug}.md
CHAPTER TITLE (do not repeat as H1): "${c.title}"
WHAT THIS CHAPTER TEACHES THE MENTOR: ${c.blurb}
GROUNDING article(s) for correct framing: ${c.ground || "(use your own knowledge of coding-agent harnesses + the workshop's five-layer arc)"}`
}

const A = s => `${DIR}/articles/${s}.md`
const CH = [
  {slug:'mg-how-to-use-this-guide', title:'How to use this handbook', blurb:'Meta: the seven ingredients, and how to prep a live day from a chapter — learn the layer, then teach it WHILE building it live with the cohort.', ground:`${DIR}/MENTOR_STYLE.md`},
  {slug:'mg-the-whole-arc', title:'The whole arc: five layers, one harness', blurb:'The single story that ties the week together: loop, tools, context, durability, orchestration, assembled into a working pi-style harness by Friday. Draw it as one stacked map.', ground:`${A('the-five-layers')}, ${A('what-you-will-build')}`},
  {slug:'mg-why-agents-need-a-harness', title:'Why an agent needs a harness', blurb:'The model is a brain in a jar; the harness is the body. Taught with a metaphor students never forget, then tied to Claude Code and pi. Why "just call the API" fails.', ground:`${A('what-is-a-harness')}, ${A('why-just-call-the-api-fails')}`},
  {slug:'mg-prompt-vs-context-vs-harness', title:'Prompt vs. context vs. harness, simply', blurb:'Three disciplines as three concentric circles: what you say, what the model sees, what it lives inside. The boundary students always blur, and the fix.', ground:`${A('prompt-vs-context-vs-harness')}`},
  {slug:'mg-the-five-layers-map', title:'The five layers, drawn', blurb:'Loop, tools, context, durability, orchestration as a stack you build up. The map you draw on the board on day one and return to all week.', ground:`${A('the-five-layers')}`},
  {slug:'mg-teach-the-agent-loop', title:'Teaching the agent loop', blurb:'The whole of agency as a while-loop, taught with a to-do-list metaphor. The board sequence, the live demo, and the aha (the agent decides when it is done).', ground:`${A('the-agent-loop-from-first-principles')}, ${A('stop-conditions')}`},
  {slug:'mg-teach-messages-and-turns', title:'Teaching messages, turns & state', blurb:'The message array as the agent whole memory-so-far. How to make "the array is the state" click, and where students get confused (tool_result threading).', ground:`${A('messages-turns-and-roles')}`},
  {slug:'mg-teach-the-bare-harness', title:'Teaching the first bare harness (live build)', blurb:'How to build the smallest real agent live: model client, message array, loop. Timings, what to type, what to let them try, the demo that lands it.', ground:`${A('your-first-bare-harness')}`},
  {slug:'mg-teach-tools-as-contracts', title:'Teaching tools as contracts', blurb:'A tool schema as a job description the model reads. The metaphor, a by-hand example, and why the schema shape matters for good calls.', ground:`${A('tool-schemas-as-contracts')}, ${A('the-core-file-and-shell-tools')}`},
  {slug:'mg-teach-permissions-and-sandboxing', title:'Teaching permissions & sandboxing', blurb:'Why the agent asks before rm, and the blast-radius idea taught as a kitchen with a fire door. The safety story every student must internalize.', ground:`${A('permission-gates-and-approval-modes')}, ${A('sandboxing-and-blast-radius')}`},
  {slug:'mg-teach-wiring-tools', title:'Teaching the tools build (live)', blurb:'Wiring read/write/edit/bash into the loop so the harness edits real code safely, live. The demo that makes students gasp; the permission gate in action.', ground:`${A('the-core-file-and-shell-tools')}, ${A('streaming-tool-calls-to-the-ui')}`},
  {slug:'mg-teach-compaction-and-memory', title:'Teaching compaction & memory', blurb:'The context window as a small desk you keep tidying, with a notebook (CLAUDE.md) for what must survive. The running-summary trick and the demo.', ground:`${A('compaction-and-summarization')}, ${A('memory-and-claude-md')}`},
  {slug:'mg-teach-the-context-engine', title:'Teaching the context engine (live build)', blurb:'Building compaction + persistent memory into the loop so the harness survives a long session. How to pace it and what to show the class.', ground:`${A('building-the-context-engine')}, ${A('the-context-window-as-a-resource')}`},
  {slug:'mg-teach-checkpointing-recovery', title:'Teaching checkpointing & recovery', blurb:'Durable execution as a video-game save point. Why replay returns cached results, and the crash-and-resume demo that makes it land.', ground:`${A('durable-execution-and-checkpointing')}, ${A('replay-and-resumable-sessions')}`},
  {slug:'mg-teach-subagents-orchestration', title:'Teaching sub-agents & orchestration', blurb:'When one context can not hold the job: spawn a focused helper, get its answer back. The delegation metaphor, plan-mode, and the human-in-the-loop gate.', ground:`${A('sub-agents-and-handoffs')}, ${A('supervision-and-plan-mode')}, ${A('human-in-the-loop')}`},
  {slug:'mg-lecture-plans-day-1-3', title:'Lecture plans: Days 1-3, block by block', blurb:'Two-hour morning plans (7-9 AM IST) for the loop, tools, and context days: timings, board sequences, the live-build checkpoints, and questions to ask.', ground:`${A('the-five-layers')}, ${A('your-first-bare-harness')}`},
  {slug:'mg-lecture-plans-day-4-5', title:'Lecture plans: Days 4-5, block by block', blurb:'Durability + orchestration, then the production-harness dissections (pi, Hermes, Claude Code) and the capstone kickoff. Timings, demos, checkpoints.', ground:`${A('durable-execution-and-checkpointing')}, ${A('pi-internals')}`},
  {slug:'mg-running-the-capstone', title:'Running the capstone: their own harness', blurb:'How to set up, mentor, and review each student assembling their own pi-style harness, and how to run the final live demos. A done-checklist per layer.', ground:`${A('the-capstone')}, ${A('evaluating-a-harness')}`},
]

phase('Write')
log(`Writing ${CH.length} harness mentor chapters in parallel…`)
const results = await parallel(CH.map(c => () => agent(chPrompt(c), { label: `mentor:${c.slug}`, phase: 'Write' })))
const ok = results.filter(Boolean)
log(`Wrote ${ok.length}/${CH.length} mentor chapters.`)
return { total: CH.length, completed: ok.length }
