By the end of this chapter you can stand in front of the room and, live, turn a harness that only *talks about* code into one that *edits real code* — and do it so cleanly that when the agent silently fixes a bug in a file nobody touched, the room actually gasps. This is the morning where the abstraction becomes a machine with hands. You already taught the loop; now you bolt the tools into it. Own this and you own the emotional peak of the whole week.

The one idea to keep repeating: **the loop was the mind; the tools are the hands.** Last session the agent could think but not touch — a consultant in a booth. Today we open the booth door. And the moment we do, we have to talk about the one thing that keeps an agent with real hands from being terrifying: the **permission gate**.

## Where we are: a loop with an empty toolbox

Remind the room where they stand. They have the ten-line loop: call the model, check the stop reason, run whatever tool it asked for, feed the result back, repeat. But so far the "tools" were toys — maybe a `read_file` that peeks at one file. The agent can *look*. It still can't *change* anything.

Today we hand it four real hands: **read**, **write**, **edit**, and **bash**. With those four wired into the loop, the same ten-line skeleton from yesterday becomes something that can open your repo, find the bug, rewrite the line, run the tests, and tell you it's green — with nobody typing but the model.

[[fig: A hand-drawn "zoom-in" diagram titled "Four hands wired into the loop". Center: an orange circular arrow labeled "THE LOOP (unchanged from yesterday)". Hanging off it, a purple box labeled "TOOLS" with four rows, each a tiny icon plus a one-line blue note: "read — eyes, line-numbered, budgeted", "write — new files only", "edit — exact-match string replace, the DEFAULT for changes", "bash — universal escape hatch (tests, git, install)". A red bracket around bash labeled "⚠ unbounded blast radius → gated this session". A green note by edit: "sends only the delta → fewer tokens, fewer mistakes". A dashed takeaway box: "same loop, four real hands. this is the toolbox inside Claude Code and pi." White background, hand-lettered Excalidraw, numbered circles 1-4 down the tool list. || The four core tools bolted into yesterday's unchanged loop: read, write, edit, bash — the exact shortlist that ships in real coding agents.]]

[[note: say || "Yesterday we built a brain that could only advise. Today we give it hands. And here's the thing that should make you a little nervous: the very same loop, unchanged, the moment it can call `edit` and `bash`, can rewrite your files and run any command on your machine. Power and danger arrive on the exact same morning. So we're going to build the hands *and* the thing that decides which movements are allowed — in the same session."]]

## The kitchen: four hands, not forty

Before any code, plant the metaphor that governs the whole design. A coding agent is a cook in a kitchen. You could hand a cook forty gadgets — a garlic press, an avocado slicer, an egg separator. Or you could hand them four things that do everything: **eyes to read the recipe**, **a pen to write a new recipe**, **an eraser-and-pencil to fix one line of an old recipe**, and **a stove to actually cook** (run anything). A great cook with those four out-cooks a fumbling cook drowning in forty single-use gadgets.

[[note: metaphor || The **four-tool kitchen.** `read` is the cook's *eyes* — glance at the recipe card. `write` is a *fresh recipe card* — a brand-new dish, written from scratch. `edit` is a *pencil-and-eraser* — the recipe is 90% right, you just fix the one wrong line without recopying the whole card. `bash` is the *stove* — the universal appliance that boils, fries, bakes, does whatever you ask. Everything else people are tempted to add (a `run_tests` gadget, a `git_commit` gadget) is just the stove wearing a costume. Four hands that compose beat forty gadgets you have to choose between.]]

[[fig: A warm hand-drawn illustration titled "The four-hand kitchen". A charming cook figure in the center of a cozy kitchen with four labeled tools around them, each drawn as a friendly object with a hand-lettered note. Top-left: a pair of eyeglasses labeled in blue "read — glance at the recipe". Top-right: a fresh blank recipe card with a pen labeled in green "write — a brand-new dish from scratch". Bottom-left: a pencil with an eraser hovering over a recipe card where one line is being fixed, labeled in orange "edit — fix ONE line, don't recopy the card". Bottom-right: a big friendly stove with many dials labeled in blue "bash — the universal appliance (does everything else)". Off to the side, a greyed-out crossed-out drawer overflowing with tiny single-use gadgets (garlic press, egg slicer) labeled in red "40 gadgets = all just the stove in a costume". A dashed takeaway box at the bottom: "four hands that COMPOSE beat forty gadgets you must CHOOSE between". White background, charming, hand-lettered Excalidraw style. || The governing metaphor: a coding agent is a cook with four composable hands — eyes, a fresh card, a pencil, and a stove — not a drawer full of gadgets.]]

[[note: teach || Draw the kitchen first, tools last. Ask the room: "if you could only keep four kitchen tools forever, which four?" Let them argue — someone always says "a knife," someone says "a stove." Steer them to the insight that a few *general* tools beat many *specific* ones. Only then map the four onto read/write/edit/bash. When students discover the shortlist themselves, they defend it; when you hand it to them, they forget it.]]

## The one decision that defines the agent: edit vs. overwrite

Spend real time here — this is the technical heart of the morning. The question sounds boring: *when the model wants to change an existing file, how does it say so?* Two answers, night and day.

**Overwrite:** the model produces the *entire new contents* of the file, and you write it wholesale. **Edit:** the model says "find *this exact string*, replace it with *that one*," and your code does the surgical find-and-replace — the model only emits the few lines that actually change.

Make it concrete with a number: a 500-line file, the model wants to change 3 lines.

[[note: example || Overwrite means the model must re-type all **500 lines** to change **3**. Do the arithmetic out loud: that's 497 lines it was supposed to leave *identical* — and every single one is a fresh chance to drop an import, silently reformat a block, or vanish a comment. Edit means the model emits maybe **6 lines**: the old snippet and the new snippet. 6 tokens' worth of risk instead of 500. Same change. One is surgical; the other is asking the model to hand-copy a phone book and hoping it makes zero typos.]]

The edit tool is *self-verifying*, and that is the beautiful part. Because the model has to quote the old string *exactly*, if it misremembered the code, the match fails and it gets a clear error — "not found, go read the file and copy it verbatim" — instead of silently corrupting the file.

```python
def edit_file(path, old_string, new_string):
    text = pathlib.Path(path).read_text()
    count = text.count(old_string)
    if count == 0:
        return "ERROR: old_string not found — read the file and copy it exactly."
    if count > 1:
        return f"ERROR: old_string matches {count} places — add surrounding lines to make it unique."
    pathlib.Path(path).write_text(text.replace(old_string, new_string))
    return "ok — 1 replacement"
```

[[fig: A hand-drawn before/after titled "Overwrite vs. targeted edit". LEFT panel labeled in black "(A) OVERWRITE — change 3 lines in a 500-line file": a tall yellow-hatched box representing the whole file, a blue arrow from a model doodle labeled "model must re-emit ALL 500 lines". Three orange lines inside labeled "the 3 real changes", the rest marked in red "497 lines it must retype perfectly — every one a chance to hallucinate". Red cost tags stacked on the side: "slow · costs tokens · silent corruption". RIGHT panel labeled "(B) EDIT — exact string replace": a small purple card showing "old_string → new_string", a blue arrow to the same file box where ONLY the 3 orange lines are touched and everything else is greyed-out and calm. Green tags: "few tokens · fast · self-verifying (exact match or clear error)". A dashed takeaway box spanning both: "edit sends only the DELTA. less to generate = fewer tokens, less latency, far fewer mistakes." White background, hand-lettered, numbered circles (1)(2)(3). || Overwrite forces the model to regenerate every line it meant to leave alone; a targeted edit sends only the change and fails loudly if its anchor is wrong.]]

[[note: aha || The line that reframes the whole tool design: **"The shape of your edit tool is the single biggest lever on how reliable your agent *feels*."** An overwrite agent drifts and drops code on long files; an edit-first agent stays surgical. This is why Claude Code's primary editing tool is an exact-match string replace, with a separate `Write` reserved for brand-new files. Two tools, because they're honest about two different situations: `write` for "this file is new, the whole thing IS the change," `edit` for "this file exists, touch only what you mean to touch."]]

[[note: confusion || The confusion that surfaces the second you show the code: "why not just always overwrite? It's simpler." Answer with the phone-book image, then the self-verifying point. Overwrite *works* on a 10-line config and quietly rots on a 2,000-line file — the model reformats a function it never meant to touch and nobody notices until CI is red. Edit can't do that: it physically cannot change a line it didn't quote. Simpler to *write*, worse to *live with*.]]

## bash: the stove that can also burn the kitchen down

The fourth hand makes the other three sufficient — and should keep you up at night. `bash` runs an arbitrary shell command and hands back the output. It's how the agent runs the tests, calls git, installs a package, makes a directory — everything the file tools don't. That's why you *don't* build a `run_tests` or `git_commit` tool: they'd just be `bash` with a fixed prefix, and the model already knows how to type `pytest`.

But say the danger out loud. A misjudged `read` wastes a few tokens. A misjudged `bash` can be `rm -rf`, `curl something | sh`, or `git push --force`. The same tool that runs your tests can delete your work.

[[fig: A warm hand-drawn illustration titled "The stove that cooks — and can burn the kitchen". Center: a friendly but slightly worried cook standing at a big stove labeled in blue "bash — runs any command". Coming off the stove, two forked paths drawn as arrows. The LEFT path (green, calm) leads to a happy plate labeled "pytest ✓ · git status · ls · mkdir — the everyday, safe stuff". The RIGHT path (red, alarming) leads to flames and smoke, labeled in red "rm -rf / · curl | sh · git push --force — one command, kitchen gone". A big red hand-lettered warning over the flames: "unbounded blast radius". To the right, a closed fire-door drawn ready to swing shut, labeled in orange "the permission gate → next section". A dashed takeaway box: "the power of bash and the need to guard it are the SAME fact seen from two sides." White background, charming, hand-lettered Excalidraw style. || bash is the universal appliance that makes four tools enough — and the one whose blast radius forces the permission gate we build next.]]

[[note: production || Concrete and current: this is exactly the four-hand toolbox inside **Claude Code** and **pi** — read, write (new files), edit (exact-match replace, the default for changes), and bash for the rest, give or take a search tool. **Cursor's** agent mode is the same shortlist wrapped around your editor. Nobody who ships a real coding agent hands the model forty tools. The whole industry converged on this tiny set precisely because the model composes them better than it chooses among a crowd. When your students wire these four, they are building the literal hands that ship in the tools they use every day.]]

## The fire door: the permission gate

Now the part that makes the whole thing shippable rather than reckless. We've built a loop that will run *any* command the model dreams up. We don't want to unplug that power — we want a **gate** between "the model asked" and "the harness does it."

Go back to the loop. Yesterday, step 3 was: *WE run every tool the model asked for.* Today we slide one check in front of it. Before executing a tool, we ask: **is this allowed?** Safe, read-only tools — `read`, search — run without asking. Dangerous ones — `edit`, `write`, `bash` — pause and ask the human: *"the agent wants to run `rm -rf build/`. Allow it?"*

[[note: metaphor || The **fire door.** A fire door doesn't lock the kitchen — cooks pass through it all day. It just swings shut on the *dangerous* things: the moment there's a fire, it stops the spread. The permission gate is that door sitting between the model's request and its execution. `read` walks straight through (no smoke). `bash rm -rf` hits the closed door and has to be let through by a human hand. The agent stays fast and useful; the one class of action that can burn everything down has to knock first.]]

[[fig: A hand-drawn flowchart titled "The permission gate, wired into the loop" as a cycle with a gate spliced in. Start: a blue box (1) "model asks for a tool { edit, path, old, new }". Arrow to a purple diamond (2) "is this tool safe? (read/search)". A green "YES → auto-run" branch flows straight to (4). A red "NO (edit/write/bash)" branch flows to an orange gate box (3) "ASK THE HUMAN: allow this action? [y / n / always]" drawn as a swinging fire door. From the gate, a green "approved" arrow to (4) blue box "harness executes the tool", and a red "denied" arrow looping back with the note "tell the model 'denied' → it chooses again". (4) flows to (5) "append tool_result → messages" then curves back to (1). Down the left margin a yellow-hatched note "the loop is UNCHANGED — we only slid a check in front of step 3". A dashed takeaway box: "safe tools run free; dangerous tools knock first. that one check is the difference between a demo and a tool people trust." White background, hand-lettered, numbered circles, semantic colors. || The permission gate is a single check spliced in front of tool execution: read-only tools auto-run, mutating tools pause for a human yes/no, and a denial just becomes another fact the model reacts to.]]

[[note: teach || Teach the gate as *one line of code*, not a subsystem — that's what makes it click. Show the loop, then literally insert `if not allowed(tool): result = "denied by user"; continue`. Point at it: "that's it. That's the entire gate. Everything else — the pretty prompt, the 'always allow' memory, the sandbox — is polish on this one branch." Students expect governance to be complicated. It's a single `if` in front of `run_tool`. Under-selling its size is the whole lesson.]]

A denied action isn't an error, and this is a lovely thing to point out: when the human says "no," we just feed the model the string "denied by user" as the tool result. The model reads that like any other fact and adapts — maybe it tries a gentler command, maybe it explains why it wanted to. The gate is a conversation, not a crash.

[[sn: In the naked build you'll show the gate in its simplest form — a `y/n` prompt in the terminal. Real harnesses layer on top of this exact branch: an "always allow this command" memory so you're not spammed, an allow-list of safe commands that never prompt, and a sandbox so even an *approved* `bash` can't reach outside the project. All of it hangs off the one `if`.]]

## The morning lecture plan (7:00–9:00 AM IST)

Two hours, three blocks, one live BUILD each. This is a *building* morning — the terminal is the star. Rehearse every demo until it's boring to you, because it will not be boring to them.

**Block 1 — the four-hand kitchen and edit-vs-overwrite (7:00–7:45).** Open with the kitchen metaphor and let the room argue their four favorite tools (7:00–7:12). Map them to read/write/edit/bash. Then the technical heart: overwrite vs. edit, the 500-lines-to-change-3 number on the board (7:12–7:30). **Live build:** write the `edit_file` function live, then break it on purpose — ask it to edit a string that appears twice, watch it refuse with the "matches 2 places" error (7:30–7:43). *Checkpoint question:* "The model quoted a line that isn't in the file. What happens — corruption, or a clean error?" (Answer: clean error; exact-match makes it self-verifying.)

**Block 2 — wire all four into the loop, the gasp demo (7:45–8:30).** Drop `read`, `write`, `edit`, `bash` into yesterday's ten-line loop — the loop itself doesn't change (7:45–7:55). **Live build (the peak of the week):** point the agent at a small repo with a genuinely failing test. Give it one sentence: "make the tests pass." Then *stop typing* and let the room watch — it reads the test, reads the source, edits the real file, runs `pytest`, sees green (7:55–8:22). Say nothing while it works; let the silence build. *Checkpoint question:* "How many of those steps did I script?" (Answer: zero — same loop as yesterday, the model drove every one.)

**Block 3 — the fire door, danger and the gate (8:30–9:00).** Now the necessary sober turn. Show that the very same agent will happily run `rm -rf` if it decides to (8:30–8:40). **Live build:** splice the one-line permission gate in front of tool execution; re-run a task, and this time a `bash` action pops the `allow? [y/n]` prompt — approve one, deny one, and show the denial flowing back as a fact the model adapts to (8:40–8:55). Close by mapping this to Claude Code's approval prompts and previewing the sandbox (8:55–9:00). *Checkpoint question:* "The human said no. Did the agent crash?" (Answer: no — 'denied' is just another tool result it reasons about.)

[[note: demo || The demo the whole morning is built around: the agent fixing a real failing test *hands-off*. Pre-stage a repo where `test_math.py` expects `add(2,3)==5` but `add` returns `a-b`. Run it live, one sentence in, then take your hands off the keyboard. The read → read → edit → `pytest` → green sequence, with you saying nothing, is the gasp. Rehearse until the timing is muscle memory — and have a backup recording, because a live agent on stage is the one thing you cannot fully control.]]

## You can now teach

- **The four-hand kitchen**: why a coding agent needs only read, write, edit, and bash — eyes, a fresh card, a pencil, and a stove — and why forty gadgets are just the stove in costumes.
- **Edit vs. overwrite** as the single biggest lever on reliability: the 500-lines-to-change-3 number, why overwrite invites silent corruption, and why exact-match edit is self-verifying.
- **bash as the universal escape hatch** that makes four tools enough — and the honest danger (`rm -rf`, `curl | sh`) that comes with unbounded blast radius.
- **The permission gate** as a fire door: one `if` in front of tool execution, safe tools auto-run, mutating tools knock first, and a denial is just another fact the model adapts to.
- **The production link**: this exact four-tool set plus an approval gate is what ships in Claude Code, pi, and Cursor today.
- **The full 7:00–9:00 AM live-build lecture**: three blocks, the hands-off failing-test demo that makes the room gasp, the gate spliced in live, and the checkpoint questions that prove the loop never changed.
