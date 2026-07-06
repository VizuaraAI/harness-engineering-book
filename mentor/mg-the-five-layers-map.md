By the end of this chapter you can walk to the whiteboard on the first morning, draw a five-box tower from memory, and teach a room full of people the *entire shape* of what they are about to build — so that for the rest of the week, every single thing you say has a home on that drawing. This is the one picture you will point back to twenty times. Get it in your bones and the whole workshop hangs together.

We are not going to write any code in this chapter. We are going to learn *the map*. Because here is the quiet truth about teaching a hard thing over five days: students don't get lost in the details. They get lost because they lose the *shape* — they forget where the thing on the screen fits in the thing as a whole. Your job with this map is to make sure that never happens. Every morning you point at a box and say "today, we build this one."

## Start from the one thing the model can't do

Before you draw a single box, you have to make students *feel* the hole the whole tower is filling. So you start not with the tower — you start with the model, alone, and its one embarrassing limitation.

A large language model does exactly one thing. You hand it a list of messages, it hands you back one more message. Text in, one text out. That's the whole primitive. It has no memory of the last call. It cannot open a file. It cannot run a command. It doesn't even know that time is passing.

[[note: metaphor || The model is a **brilliant consultant locked in a room with no doors, no windows, and no memory**. You slide a note under the door — your question. They slide back a note — a genius answer. But they can't walk out to check anything. They can't remember you were ever there. And the moment they slide the note back, they forget the whole conversation. Astonishingly smart. Completely trapped. The harness is everything we build to give that consultant hands, a memory, and a way to actually get up and do the work.]]

[[fig: A warm hand-drawn illustration titled "The consultant in the sealed room". Center: a small windowless room, four thick walls, no doors, drawn wobbly. Inside sits a friendly figure at a desk with a lightbulb over their head and a little brain doodle, labeled in black "THE MODEL — brilliant". A note slides UNDER the wall from the left labeled in blue "your question (messages in)"; a note slides back out labeled in blue "one answer (message out)". Around the OUTSIDE of the room, greyed-out and unreachable, three icons with red X's: a folder labeled "files", a terminal labeled "commands", a clock labeled "time / memory". A red handwritten note points at the room: "can see nothing but the note you slid in". A dashed takeaway box at the bottom: "the model is a genius with no hands, no memory, no way out. The harness is the doors." White background, charming, hand-lettered Excalidraw style. || The starting point: a brilliant model sealed in a room — it can answer, but it cannot act, remember, or persist. Everything we build gives it a way out.]]

[[note: say || "Everyone thinks the magic is the model. It isn't. The model is a genius locked in a room who forgets you the moment they answer. What we are building this week is the *building around that room* — the hands, the memory, the safety locks, the fire escape. That building has a name. It's called a **harness**. And by Friday, you will have built one, floor by floor."]]

Say that, and let it land. Now they *want* the tower, because you've shown them the hole it fills.

## The tower: five floors, one borrowed brain

Now you draw. Draw a tower of five boxes, stacked. At the very bottom, small and greyed-out, put the model — because it's borrowed, it's a commodity, it's *not* the part you build. Then above it, five floors, each a power the model didn't have.

Draw it bottom to top and name each floor as you go. Don't explain them yet — just name them, so students see the whole silhouette before any one floor gets deep.

[[fig: A hand-drawn vertical tower titled "The five layers of a harness", drawn as stacked rounded boxes like floors of a building, with the model as the foundation. From bottom to top: FOUNDATION — a small grey box "THE MODEL (borrowed — text in, one text out)". FLOOR 1 — blue box, circled number 1, "THE LOOP — call, run a tool, repeat until done". FLOOR 2 — green box, circled 2, "TOOLS + GUARDRAILS — read/write/edit/bash + permission gate + sandbox". FLOOR 3 — yellow-hatch box, circled 3, "CONTEXT ENGINE — budget, compaction, memory file". FLOOR 4 — orange box, circled 4, "DURABILITY — checkpoint every step, replay, self-heal". FLOOR 5 — purple box, circled 5, "ORCHESTRATION — sub-agents, supervision, human-in-the-loop". A big red bracket runs down the right side spanning floors 1 through 5, labeled "THE HARNESS — you build all of this". Little day-tags on each floor: "Day 1 ... Day 5". A dashed takeaway box: "one borrowed brain at the base, five floors of body on top = a coding agent." White background, hand-lettered, charming. || The map you draw on day one: a borrowed model at the foundation, then five floors — loop, tools, context, durability, orchestration — one per day of the workshop.]]

[[note: teach || Draw the boxes empty first, bottom to top, saying only the *name* of each floor — "the loop, the tools, the context engine, durability, orchestration." Do NOT explain them yet. Let students see the full silhouette in ten seconds. THEN go back to floor 1 and start filling in. Reveal, don't dump. The empty tower is the promise; filling it in is the week. Use a different marker color per floor if you can — those colors become the code you point at all week.]]

Here is the rule that makes the tower honest, and you should say it out loud: **we never add a floor for its own sake. We add each floor at the exact moment the harness below it visibly breaks without it.** That's the whole pedagogy of the week. Build floor 1, watch it fail in a specific way, and the failure *is* the reason for floor 2. This map isn't a list of features — it's a chain of "and then it broke, so we needed...".

## Floor 1 — the loop (the heartbeat)

The bare model answers once and stops. But real work is many steps: look at the test, read the source, run it, see the error, fix it, run it again. So the first floor is a **loop**: call the model, check if it asked to use a tool, run that tool, hand the result back, and go around again — until the model says "I'm done."

[[note: metaphor || The loop is a **cook working from a recipe, one step at a time**. Read the next step ("dice the onion"). Do it. Look at the result. Read the next step. The model is the recipe-reader deciding the next move; the loop is what actually *does* each move and comes back for the next one. Without the loop, you have a recipe read aloud once and nobody in the kitchen.]]

[[note: example || The tiniest concrete version, three laps: (1) model says "read `test_login.py`" → loop reads it, hands text back. (2) model says "run the test" → loop runs it, hands the traceback back. (3) model says "I found it, here's the fix — I'm done" → loop stops. Three trips around the circle and a bug is understood. That circle is the entire heartbeat of every coding agent alive.]]

This is Day 1, and it's the smallest floor — a genuine acting agent in about forty lines. When students see the loop run for the first time, watch the room. It's the first "oh, *that's* all it is?" moment, and it's a good one.

## Floor 2 — tools and guardrails (hands, and the safety on the hands)

The loop can go around, but around to do *what*? The model can only produce text. To actually touch your computer, it needs **tools** — `read_file`, `write_file`, `edit_file`, `run_bash`. A tool is a real function you write; you describe it to the model, and when the model asks for it, the loop runs it.

But the moment you give the model hands, you have to give those hands a **safety**. The same `run_bash` that runs your tests can run `rm -rf` if the model is confused. So this floor is really *two* things stacked together: the hands (tools) and the safety on the hands (a permission gate that pauses and asks before anything dangerous, plus a sandbox so even an approved mistake can't burn the house down).

[[note: metaphor || Tools are giving the consultant a **set of power tools** — a drill, a saw, a key to the file room. Guardrails are the **safety guard on the saw and the "are you sure?" before they cut**. You would never hand someone a chainsaw with no guard and no pause button. A harness that gives tools without guardrails is exactly that chainsaw.]]

[[fig: A warm hand-drawn illustration titled "Hands, and the safety on the hands", split into two friendly panels. LEFT panel labeled "the hands (tools)": the consultant figure now reaching OUT of their room through new little doors, each door labeled — a hand grabbing a folder "read_file", a hand with a pen "edit_file", a hand at a terminal "run_bash". Green note: "now the model can actually touch things". RIGHT panel labeled "the safety": a big red STOP gate in front of the run_bash hand, with a speech bubble "run `rm -rf build/` — are you sure?" and a little human figure with a thumb hovering over yes/no. Behind it a dashed box labeled "sandbox — bounded blast radius". Red note: "power tools need a guard AND a pause". A dashed takeaway box: "tools give it hands; guardrails make sure the hands don't hurt you." White background, charming, hand-lettered. || Floor 2 is two things at once: tools that give the model real hands, and the permission gate plus sandbox that keep those hands safe.]]

[[note: confusion || Students conflate "tool" with "guardrail" and think they're one topic. Separate them cleanly on the board: draw the hand, THEN draw the STOP gate in front of it. Tools are about *capability* — what the agent CAN do. Guardrails are about *policy* — what it's ALLOWED to do without asking. Different question, different code, same floor. Say: "one gives power, the other decides when power needs permission."]]

This is Day 2. The demo that sells it: run the agent with no permission gate, let it propose a scary command, and let the room feel the flinch. Then add the gate. That flinch is the whole lesson.

## Floor 3 — the context engine (what the model sees each turn)

Now a subtle one, and the one students under-rate. Every time the loop calls the model, it has to hand over the *whole conversation so far* — every file read, every command output. But the model's memory (its **context window**) has a hard size limit. On a long task, that history grows and grows until it no longer fits. A naive loop just hits the wall and crashes.

So floor 3 is the **context engine**: the thing that decides, every single turn, what goes into that limited window. When it's getting full, it **summarizes** the old turns into a compact digest and keeps going. And alongside it, a **memory file** (a `CLAUDE.md`-style note) so the agent starts every session already knowing the shape of your project instead of rediscovering it.

[[note: metaphor || The context window is a **small desk**. Everything the model can see has to fit on that desk right now — you can't reference a paper that's in a filing cabinet across the room. As the task goes on, papers pile up until they spill off the edge. The context engine is the **assistant who, when the desk gets full, sweeps the old papers into a tidy one-page summary** and keeps the desk workable. The memory file is the **sticky note on the monitor** that's always there: "this project uses Python, tests live in /tests, don't touch the vendor folder."]]

[[note: aha || Here's the number that lands it: a coding session can easily read fifty files and run thirty commands. Dump all of that into the window raw and you blow past the limit before lunch — the agent literally cannot continue. Compaction takes those eighty bulky items and folds them into a paragraph the model can still act on. Say it plainly: "the context window is the scarcest, most expensive thing in the whole system, and managing it is the difference between an agent that works for five minutes and one that works for five hours."]]

[[fig: A hand-drawn illustration titled "The desk that keeps filling up". Center: a small desk piled high with papers, a few sliding off the edge with a red note "context window FULL → agent crashes". A friendly assistant figure on the right is sweeping a stack of old papers into a single tidy sheet labeled in orange "one-page summary (compaction)", leaving the desk clear. Top-left of the monitor on the desk, a yellow sticky note labeled "CLAUDE.md — always-there project memory". Blue dashed arrows show the flow: papers pile up (1) → desk overflows (2) → assistant compacts old ones (3) → desk workable again (4), numbered circles. A dashed takeaway box: "the window is a tiny desk — someone has to keep it from overflowing. That someone is the context engine." White background, warm, hand-lettered. || Floor 3, the context engine: the model's window is a small desk that overflows on long tasks; compaction sweeps old turns into a summary, and a memory file keeps key facts always in view.]]

This is Day 3. It's the least visual floor and the one that separates a demo toy from something that survives a real, long task.

## Floor 4 — durability (the save point)

Real agents get interrupted. You hit Ctrl-C. The network blips. The laptop sleeps. If the agent's only memory of a twenty-minute task is a variable in a running program, that interruption is a *total loss* — every step gone, start over from zero.

Floor 4 fixes that. We make the harness **write every step to disk as it happens** — the messages, the tool results, where it is in the loop. So when a fresh process starts up, it reloads that log and *replays* to exactly where it left off, instead of redoing everything.

[[note: metaphor || This is the **save point in a video game**. You've fought through four levels; the power goes out. If the game never saved, you start at level one and cry. If it wrote a save point after every level, you reload and drop right back at level four. Durability is teaching your agent to save after every step, so a crash costs you *nothing*.]]

[[note: production || This is the least glamorous floor and quietly the most important. Claude Code, pi, Hermes — every real harness writes its state to durable storage exactly so a killed session can resume. It's why you can close your laptop mid-task and pick up where you were. "The process is disposable; the log is the memory" is the sentence that makes it click. Tell students: nobody demos this floor, and everybody who ships an agent lives or dies by it.]]

[[fig: A hand-drawn timeline titled "Crash and resume", drawn left to right as numbered step-boxes on a track: (1) "read test" (2) "read source" (3) "run test — FAIL" (4) "edit source". Under each box, a small blue floppy-disk icon and a green note "→ saved to checkpoint.log". Between step 4 and step 5 a jagged red lightning bolt labeled "process killed (Ctrl-C / crash / sleep)". Then a curved orange arrow labeled "restart → reload the log → REPLAY to here" loops back to just after step 4, and the track continues: (5) "re-run test — PASS ✓". Off to the side, a blue-hatched stack of disks labeled "the log IS the memory — the process is disposable". A dashed takeaway box: "save after every step → a dead process replays instead of redoing. Zero lost work." White background, hand-lettered, numbered circles. || Floor 4, durability: every step is written to a checkpoint log, so a killed process reloads and replays to exactly where it stopped — no work is ever lost.]]

This is Day 4.

## Floor 5 — orchestration (the manager and the team)

The top floor. Some jobs are simply too big for one desk, no matter how well you sweep it. "Audit this entire service for security bugs" isn't one task — it's twenty small investigations. Cramming all twenty into one conversation muddles them and overflows the window.

So the top-level agent learns to act like a **manager**: it spawns focused **sub-agents**, each with its own fresh desk, hands each one a narrow job ("check *this* file for injection bugs"), and folds their findings back into the main thread. And for the moves that should never be fully automatic — deploying, deleting, spending money — there's a **human-in-the-loop** gate: the manager stops and checks with a person.

[[note: metaphor || This is a **manager delegating to a team**. One person can't read a whole codebase and keep it straight — but a manager can hand ten interns one file each, collect ten short reports, and synthesize. Each intern has a clean desk and a narrow question. The manager never touches the code directly; they *coordinate*. That's orchestration: turning one overwhelmed agent into a small, supervised org.]]

[[fig: A warm hand-drawn org-chart illustration titled "One agent becomes a small team". At the top, a friendly manager figure labeled "SUPERVISOR agent" at a clean desk. Dashed blue arrows fan DOWN to three smaller worker figures, each at their own little desk, labeled "sub-agent: check auth.py", "sub-agent: check db.py", "sub-agent: check api.py", each with a green note "fresh context, one narrow job". Dashed arrows fan back UP carrying little report scrolls labeled "findings" to the manager, who merges them into one sheet labeled orange "combined report". Off to the side, a red STOP gate with a human figure labeled "human-in-the-loop — approves the risky moves (deploy / delete)". A dashed takeaway box: "too big for one desk → split into supervised sub-agents, each with a clean context." White background, charming, hand-lettered. || Floor 5, orchestration: a supervisor agent splits a huge job across focused sub-agents — each with its own fresh context — and a human gate guards the moves that must never be automatic.]]

This is Day 5, the capstone floor. Stack all five on a borrowed model and you have exactly what Claude Code, pi, and Cursor are.

## How to use this map for the rest of the week

The map is not a one-time drawing. It's a **home base you return to every morning.** Redraw the tower (or keep it on a poster on the wall), and start each day by pointing: "here's where we are — floors 1 and 2 are built, they're solid, and today we build floor 3, because yesterday's harness broke in *this* way..."

[[note: teach || Ritual for every morning: (1) redraw or point at the tower, (2) shade in the floors already built as "done and trusted," (3) show the specific failure of yesterday's harness — run it and let it break — (4) declare "that failure is why we build today's floor." The break-then-build rhythm turns a feature list into a story with cause and effect. Students remember stories; they forget lists.]]

[[note: confusion || The single most common student confusion, and it's about the whole map: they think the *model* is the product and the harness is "just plumbing." Kill this on day one. Say: "the model is borrowed — you and Google and everyone rent the same one. The harness is *yours* — it's what decides whether your agent is safe, whether it survives a crash, whether it costs a dollar or a penny. The plumbing IS the product." Point at the grey foundation box, then at the five colored floors: "they pay for that. You build these."]]

[[sn: If a student pushes back with "but frameworks already give me an agent object," agree and reframe: yes, and the whole point of the week is that you'll understand every floor well enough to rebuild it on a plane with no internet. Owning the map is worth more than importing the object.]]

[[note: demo || The perfect day-one closing demo, if you have Claude Code or pi handy: run a real one-line request ("fix the failing test") and narrate it against the tower live. "See it read a file? Floor 1 and 2. See it pause to ask before editing? Floor 2's guardrail. See 'compacting conversation'? Floor 3. It just did on screen the exact five floors we're about to build." Nothing motivates a week of building like watching the finished thing and recognizing every part of it.]]

## You can now teach

- The **hole the harness fills**: the model as a brilliant consultant sealed in a room — text in, one text out, no hands, no memory, no way to act — so students *feel* why every floor is needed.
- The **five-layer tower** from memory, bottom to top: the borrowed model, then the loop, tools + guardrails, the context engine, durability, and orchestration — one floor per day.
- A **one-line metaphor for each floor** you can redraw instantly: the recipe cook, the power tools with a safety, the overflowing desk, the video-game save point, and the manager with a team.
- The **break-then-build pedagogy**: each floor is added at the exact moment the floor below it visibly fails, so the week is a story of cause and effect, not a checklist of features.
- The **"the harness is the product, not the model"** reframe — the most important confusion to kill on day one — and how to use the tower as a daily home base you point back to all week.
