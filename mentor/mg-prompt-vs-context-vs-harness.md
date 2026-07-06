By the end of this chapter you can stand at a whiteboard and teach the single most clarifying idea in this whole field: that **prompt engineering, context engineering, and harness engineering are three nested circles, not three rivals** — and you can show students exactly which circle their bug lives in. This is the chapter that stops a room from ever again saying "I tuned my prompt" when they mean "I rebuilt my agent." Own this boundary and everything in the rest of the workshop clicks into place behind it.

We start with zero jargon. Just three words, drawn as three rings, and a story about who does what.

## The one-sentence spine

There are three questions, and they nest inside each other like Russian dolls:

- **Prompt engineering** asks: *what do I say?* (one message, one answer)
- **Context engineering** asks: *what does the model see this turn?* (the whole window, rebuilt every call)
- **Harness engineering** asks: *what does the model live inside?* (the loop, the tools, the crashes, the whole machine)

The prompt sits inside the context. The context sits inside the harness. Each outer ring **builds and manages** the ring inside it. That is the entire chapter in one breath.

[[note: metaphor || Three concentric circles, and I want you to draw them as a target — a bullseye. The tiny dot in the middle is the **prompt**: one sentence you say. The ring around it is the **context**: everything the model can see in this one glance. The big outer ring is the **harness**: the whole room the model is standing in — the desk, the tools on the desk, the door, the fire alarm, the boss who decides when it's done. You don't tune the dot and call it building the room. You build the room, and the room decides what lands on the dot.]]

[[fig: A warm hand-drawn bullseye of three concentric circles titled "Three nested disciplines". The tiny center dot is labeled in black "PROMPT — what I SAY" with a small blue note "one message". The middle ring is labeled "CONTEXT — what the model SEES this turn" with a green note "the whole window, rebuilt every call". The big outer ring is labeled "HARNESS — what the model LIVES INSIDE" with an orange note "the room: loop, tools, crashes, orchestration". A red curved arrow sweeps from the outer ring inward to the center dot, annotated "the outer ring decides what fills the inner one". A small purple label on the middle ring reads "context = ONE part of the harness". A dashed takeaway box at the bottom: "prompt ⊂ context ⊂ harness — not rivals, rings. Outer builds inner." White background, hand-lettered Excalidraw style, charming and friendly. || The core picture: a bullseye where the prompt is the dot, the context is the ring around it, and the harness is the whole room — each outer layer builds the one inside.]]

[[note: teach || Draw the bullseye first, before a single word of definition. Draw the center dot, then the middle ring, then the big outer ring, saying the three questions out loud as you draw each one — "what do I *say*, what does it *see*, what does it *live inside*." Point at each ring with your finger. Students will already half-understand it from the picture alone. Only then do you go back and define each ring properly. The image is the anchor; the words hang off it.]]

## Ring 1: the prompt — what you say, for one answer

The innermost dot is the oldest and the narrowest. **Prompt engineering is writing a single instruction so that one model answer comes out well.** You are shaping the text of *one* call: the wording, the examples you show, the format you ask for, the role you assign.

"Think step by step." "Return only JSON." "You are a senior Python reviewer." Every one of those is prompt engineering. It is real, it matters, and inside a coding agent the **system prompt** is a genuine lever you will tune with care.

[[note: example || Do a live before/after on the board, tiny and concrete. Ask the same thing two ways. Prompt A: `"sort this list"`. Prompt B: `"You are a careful Python engineer. Sort this list ascending. Return ONLY the sorted list, no prose."` Same model, same list `[3, 1, 2]`. Prompt A might give you a paragraph explaining sorting; Prompt B gives you `[1, 2, 3]` and nothing else. That gap — from a chatty mess to a clean usable answer — is the entire value of prompt engineering, shown in ten seconds.]]

But look at prompt engineering's horizon: **it thinks about one turn only.** It has no idea about a conversation that runs two hundred turns, no theory of files the model hasn't read yet, no plan for what to *forget* when the window fills. It can't — it is scoped to a single answer by definition.

That is exactly why it stops being enough the moment you build a loop. Once the model's output feeds a tool, whose result feeds the next call, the interesting question is no longer "what do I say?" It becomes "what does the model *see* on turn 47, after 46 turns have piled up?" And that question lives in the next ring out.

[[note: confusion || The number-one confusion in the whole field, and you must name it out loud: students think prompt engineering *is* building an agent. Someone tunes a system prompt for a week and calls it "building an AI agent." The fix is a single sentence: **"A prompt is one thing you say once. An agent is a machine that says two hundred things and reads the answers." Prompt engineering builds the sentence. It does not build the machine.**]]

## Ring 2: the context — what the model sees each turn

Now the middle ring, and here is the definition to burn in: **context engineering is curating the best possible set of tokens the model sees on inference — every single turn.** Not the prompt you wrote once. The *entire assembled input* on each call: the system prompt, yes, but also the running conversation history, the tool results, the files you retrieved, the memory notes, the summaries of what came before.

[[note: metaphor || The desk before an exam. The model is a brilliant student who walks into an exam room with a **desk that only fits one page**. That is the context window — small, and the only thing the student can see. Context engineering is *you*, standing outside, deciding what goes on that one page before the student looks: the key formula, the two relevant notes, a one-line summary of the textbook. If you dump the whole textbook on the desk, it doesn't fit, and worse — the student's eyes glaze over and they miss the one formula that mattered. The skill is not "put more on the desk." The skill is "put the *right* one page on the desk."]]

[[fig: A warm hand-drawn illustration titled "The model's desk only fits one page". Center: a small student figure with a big brain, sitting at a tiny desk, looking at a single sheet of paper. LEFT version labeled "(A) dumped": a giant messy stack of books and papers spilling off the desk onto the floor — labeled "whole repo", "all 200 turns", "10 docs just in case" — the student looking overwhelmed with spirals for eyes, a red note "can't find the one thing that matters". RIGHT version labeled "(B) curated": the same desk holding one tidy page with four neat lines — a green "system prompt", a blue "summary of turns 1-40", a blue "only the 2 files in play", a purple "1 memory note" — the student calm and focused, a green note "everything else is a shelf away, fetched when needed". A dashed takeaway box spanning both: "more paper ≠ more understanding. Curate the one page for signal." White background, hand-lettered, charming. || Context engineering as choosing the one page on a tiny desk: dump the whole library and the student drowns; curate one high-signal page and the student flies.]]

Why is this its own discipline, and a hard one? Because **the context window is finite and scarce** — the single most fought-over resource in the whole system. And its scarcity is not just a token count. It is a *quality* limit, for two reasons students need to hear plainly:

- **Attention is a budget that runs out.** The model relates every token to every other token. As the window fills, it spreads its attention thinner and thinner across more and more pairs. More tokens does *not* mean more understanding.
- **Context rot is real.** As the token count grows, the model's ability to recall any one specific fact *buried inside* that pile degrades. An instruction on turn 3 can be functionally invisible by turn 60.

[[note: aha || Here is the number that makes the room go quiet. A 200,000-token context window sounds enormous — "I'll never run out!" Then you say: **"A 200K window stuffed with 190K tokens of junk performs *worse* than a tight 20K window of exactly the right tokens."** Bigger windows don't remove the problem — they postpone it, and then hide it. The skill is *subtraction*, not accumulation. Watch faces change when they realize the whole instinct — "just give it more" — is backwards.]]

[[sn: This is the counterintuitive heart of it, so say it twice: the newcomer's reflex is to *add* — more files, more history, more "just in case" docs. The expert's reflex is to *cut* — find the smallest set of high-signal tokens that make the right answer likely. In this room, less is genuinely more, and it is measurable.]]

And here is the property that separates context from prompt forever: **context engineering is cyclical, not one-time.** Prompt engineering happens once, when you author the system prompt. Context engineering happens on *every loop iteration* — the window is rebuilt, or at least re-decided, before each and every call. It cannot be a thing you write and forget. It has to be **machinery that runs.** Which is precisely what pushes us into the outer ring.

## Ring 3: the harness — what the model lives inside

The **harness** is the whole runtime the model lives inside: the loop, the tools, the permission gates, the durability layer, the orchestration of sub-agents. Everything wrapped around the borrowed model that turns a stateless text-in-text-out function into something that reads your code, edits files, runs tests, recovers from a crash, and stays coherent across a long task.

And now the sentence this entire chapter exists to earn:

> **Context engineering is one subsystem of the harness — not a synonym for it.**

The harness is what *does* the context engineering. Walk the students through who does what: the loop decides *when* to call the model; the context engine decides *what the window holds* on that call; the tools produce the results that will or won't get appended; the durability layer persists the history that compaction later trims; the orchestrator decides whether this whole context even belongs to one agent or should be split across several. **Context is one gear. The harness is the machine.**

[[fig: A warm hand-drawn illustration titled "The harness is the whole room". A cozy hand-drawn workshop room seen from the side. In the center, a small brain-student figure (the model) sitting at the tiny one-page desk from before — labeled "context = the desk". Around the room, friendly labeled objects: a big circular arrow painted on the floor the student walks in loops on, labeled "the LOOP"; a pegboard of tools (a hammer, a wrench, a file folder, a terminal) labeled "TOOLS + guardrails"; a red fire-door with an alarm labeled "permission gate — stops rm -rf"; a filing cabinet with save-point flags labeled "DURABILITY — checkpoints"; a small doorway with two more tiny student figures walking through, labeled "ORCHESTRATION — sub-agents". A green arrow points at just the desk saying "context is only THIS". A dashed takeaway box: "the model works AT the desk, but lives INSIDE the whole room. The room is the harness." White background, hand-lettered, charming. || The harness drawn as a room: the model sits at the one-page desk (context), but the loop, the tools, the fire-door, the checkpoints, and the sub-agent doorway are the room it lives in.]]

[[fig: A hand-drawn "zoom-in" technical diagram titled "Where context engineering sits in the harness". A large yellow-hatch outer box labeled "THE HARNESS (the runtime)" contains an orange central circular loop-arrow labeled "THE LOOP", surrounded by four boxes: a blue box "TOOLS + guardrails", a purple box "DURABILITY — checkpoints", a green box "ORCHESTRATION — sub-agents", and a blue-hatch box "CONTEXT ENGINE" that is circled in red and pulled out to the side with a magnifying-glass zoom. Inside the zoom, five numbered handwritten steps: "① pick system prompt", "② compact old history", "③ select relevant files", "④ inject memory", "⑤ assemble window → call". A red arrow from the zoom back into the loop labeled "runs EVERY turn". A dashed takeaway box: "the context engine is ONE box inside the harness — the gear that decides the window each turn." White background, hand-lettered, numbered circles in the zoom, semantic colors. || Zooming into the harness: the context engine is a single subsystem among several — the one gear that assembles the window on every lap of the loop.]]

This nesting is not pedantry. It literally changes **what you reach for when something breaks** — and that is the practical payoff you sell to the room:

- The model gives a bad answer to a clean, single request? That's a **prompt** problem. Fix the wording.
- The model *had* the right info available but ignored it, or ran out of room, or hallucinated because the relevant file was never on the desk? That's a **context** problem. Fix what it sees.
- The agent ran `rm -rf`, or died and lost all its work, or spun forever, or should have handed off to a sub-agent? None of those are the prompt or the context. Those are **harness** problems, and no amount of prompt-tuning will ever touch them.

[[note: say || Here is the exact line that unlocks the whole boundary — say it slowly and let it land: "The layer you edit tells you which discipline you're in. If your fix is *add a sentence to the system prompt* — that's prompt engineering. If your fix is *summarize turns 1 to 40 before the next call* — that's context engineering. If your fix is *put run_bash behind an approval prompt* — that's harness engineering. Same bug report, three different rings. Always ask: which ring does this live in?"]]

## Reading all three off one real trace

This is the demo that makes it concrete. Put one turn of a real coding agent on the board — turn 47 of fixing a failing test — and point at each discipline *in the same object.*

[[note: demo || Write this trace on the board line by line, and as you write each block, tap it and name its ring out loud. This is the payoff moment of the whole lecture — the three abstract circles become three things you can point at in one scrolling log.]]

```text
── THE HARNESS decides: model asked for no final answer yet
   → run another lap.                        (loop + orchestration)

── THE CONTEXT ENGINE assembles the window for this call:
     system_prompt      # authored once   → PROMPT engineering
     compacted_summary  # turns 1–40 → 400 tokens
     recent_messages    # turns 41–46 kept verbatim
     open_files         # ONLY test_auth.py + auth.py, not the repo
     memory             # 3 lines from CLAUDE.md
   → this selection, every turn, IS context engineering.

── THE MODEL is called on exactly those tokens. It replies:
     "run_bash: pytest test_auth.py -k login"

── THE HARNESS runs the tool behind a permission gate,
   appends the result, checkpoints, loops.   (tools + durability)
```

Everything the agent *says to the model* is prompt engineering. Everything about *what the model sees this turn* is context engineering. Everything about *the loop, the gate, the checkpoint, the file selection running as code* is the harness. **Same trace, three altitudes.** This is exactly how Claude Code, Cursor, and pi actually run.

[[fig: A hand-drawn timeline titled "One turn, three disciplines stacked", showing one horizontal loop-lap broken left-to-right into stages, each tagged underneath with a colored bracket for its discipline. Stages as boxes: "author system prompt" (purple bracket, 'PROMPT · once'), then "compact history · select files · inject memory · assemble window" (blue bracket, 'CONTEXT · every turn'), then "call model", then "gate + run tool · checkpoint · loop back" (green bracket, 'HARNESS · the runtime'). A curved orange arrow loops from the last stage back to the second stage, annotated "context stages rerun every lap; the prompt stage does not". A red note across the top: "same turn, three altitudes — know which one your bug lives at." A dashed takeaway box: "prompt = one-time text · context = per-turn curation · harness = the running machine." White background, hand-lettered, three colored brackets clearly under their stages. || One lap read at three altitudes: the prompt is authored once, the context is re-curated every turn, and the harness is the machine that does both.]]

## In production, today

[[note: production || This boundary is not academic — it is how the tools your students already use are built. In **Claude Code, Cursor, and pi**, there is a carefully authored system prompt (prompt), a context engine that compacts history and retrieves only relevant files on *every* turn (context), all inside a loop that gates dangerous commands, checkpoints, and dispatches sub-agents (harness). When people say "prompt engineering is dead," they're wrong — it got *demoted* to one ingredient of context, which is itself one subsystem of the harness. The outer ring, where safety, recovery, cost, and coherence live, is the part that is genuinely *yours* to build. That is why we spend five days on it.]]

[[note: aha || The reframe to leave in the room: "'Context engineering is the new prompt engineering' is closer to right, but still sells it short — context is the *middle* ring, not the outer one. The real prize, the part nobody hands you, is the outer ring: the harness." pi is such a good teaching object because it makes that outer ring *small enough to read* — you can see the context engine as one file among several, not as the whole mysterious 'agent.']]

## The 2-hour lecture plan (7:00–9:00 AM IST)

A block-by-block plan for the morning. This is a *concepts* lecture with one small live trace, so pace it with the board, not slides.

**Block 1 — The bullseye (7:00–7:30).** Open cold: "Three words get used as if they're the same job. They're not, and the confusion costs people weeks." Draw the bullseye live, saying the three questions as you draw. Define ring 1, the prompt, and do the tiny live before/after (`"sort this list"` vs. the shaped prompt). *Checkpoint:* "What is the one thing prompt engineering can never see?" (Any turn but this one.)

**Block 2 — The desk that fits one page (7:30–8:10).** Ring 2. Draw the exam-desk, dumped vs. curated. Introduce the two quality limits — attention runs out, context rot is real. Land the 200K-vs-20K aha. Hammer that context is *cyclical*. *Checkpoint:* "Which is smarter — a 200K window 95% full of junk, or a 20K window that's exactly right? Why?"

**Block 3 — The room, and the live trace (8:10–8:50).** Ring 3, the harness. Say the load-bearing sentence: "context engineering is *one subsystem* of the harness." Draw the room and the zoom-in. Run the demo: write the turn-47 trace and tap each ring by name. Finish with the debugging test. *Checkpoint — the whole lecture in one question:* "The agent just ran `rm -rf /`. Which ring is the bug in?" (Harness. Not the prompt.)

**Block 4 — Consolidate + bridge (8:50–9:00).** Recite the spine: prompt ⊂ context ⊂ harness — one sentence, one turn, one machine. Bridge forward: "We've built the innermost mechanics, the bare loop. Next we give the agent *hands*: tools."

[[note: confusion || Two blurs you'll meet. "Isn't context just a big prompt?" — Fix: "A prompt is written *once*, by you. Context is *re-decided every turn*, by machinery, under a budget. One is a sentence you type; the other is a program that runs." And "so bigger windows solve everything?" — Fix with the desk: "A bigger desk still drowns you if you dump the library on it. Your job — the *right* page — got harder, not easier, because the junk now hides longer before it hurts you."]]

## You can now teach

- The **three nested rings** — prompt ⊂ context ⊂ harness — drawn as a bullseye, and the three questions (say / see / live inside) that define them.
- **Prompt engineering** as one message for one answer, with the tiny before/after, and why its one-turn horizon makes it not-enough for an agent.
- **Context engineering** as the exam-desk that fits one page: curation under scarcity, the attention-runs-out and context-rot limits, and the 200K-vs-20K aha.
- Why context is **cyclical** (reruns every turn) while the prompt is authored once.
- The load-bearing sentence — **context engineering is one subsystem of the harness** — and the zoom-in that shows it as one gear in the machine.
- The **debugging payoff**: reading a real turn-47 trace at three altitudes, and using "the layer you edit tells you the discipline" to route any bug to its ring.
