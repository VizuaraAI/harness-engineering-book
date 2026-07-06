By the end of this chapter you can walk into the room on Day 1, 2, or 3 with a clock in your head and a chalk plan on the board — you'll know exactly what to draw at 7:05, what to build live at 7:40, and which question to ask at 8:30 to check that the room is still with you.

The three morning sessions build the bottom three layers of the harness, one per day: **the loop** (Day 1), **tools and guardrails** (Day 2), and **the context engine** (Day 3). This chapter is not about *what* those layers are — you learned that in the layer chapters. It's about *how to spend the two hours* so the room learns it too.

[[note: metaphor || A lecture plan is a **flight plan**, not a script. A pilot doesn't read a novel to the passengers — they hit a few waypoints on a schedule: wheels up by 7:10, cruising by 7:40, descend by 8:40. You improvise the words in between, but you must hit the waypoints on time or you land in the dark. Every plan below is five or six waypoints with a clock next to each.]]

Every morning runs 7:00–9:00 AM IST. Every morning has the **same skeleton** — tell the students that on Day 1 so the rhythm becomes comforting:

- **0:00–0:10** — warm-up + "yesterday in one breath" recall.
- **0:10–0:35** — the idea, at the board, with the metaphor first.
- **0:35–1:20** — the live build (this is the heart; guard it fiercely).
- **1:20–1:40** — break it on purpose, then fix it.
- **1:40–1:55** — checkpoint questions + "what this still can't do."
- **1:55–2:00** — set up tomorrow, one sentence.

[[fig: A warm hand-drawn illustration of a two-hour morning drawn as a clock-face timeline / flight plan. A horizontal ribbon from "7:00" to "9:00" with six labeled stops drawn as little airport gates: (1) a coffee-cup icon "warm-up 7:00–7:10", (2) a chalkboard icon "the idea 7:10–7:35", (3) a big glowing hangar labeled "LIVE BUILD 7:35–8:20" drawn largest and outlined in orange as the centerpiece, (4) a small broken-then-taped-wrench icon "break & fix 8:20–8:40", (5) a raised-hand icon "checkpoint Qs 8:40–8:55", (6) a runway-into-sunrise icon "set up tomorrow 8:55–9:00". A red handwritten note under the big hangar: "protect this block — everything else can shrink, this cannot." Dashed takeaway box: "same six waypoints every morning — the room learns the rhythm and relaxes." White background, hand-lettered Excalidraw, charming. || The shape of every morning: six waypoints on a two-hour ribbon, with the live build as the protected centerpiece.]]

[[note: teach || The single most important discipline across all three mornings: **protect the live build.** Everything else is negotiable and can be squeezed if you run long. The build cannot. If you're behind at 7:35, cut the warm-up and the theory, not the build — because the build is where the loop, the tool, and the context engine stop being words and become code the students watch appear. Set a real timer on your phone for the build's start. When it buzzes, close the slides.]]

Now let's plan each morning.

## Day 1 — the loop: agency is born

The goal of Day 1 is emotional as much as technical: by 9:00 the room should have *felt* an agent decide, act, and iterate on its own, with no human between the laps. Everything today serves that one moment.

**7:00–7:10 — warm-up.** No recall yet (it's Day 1). One provocation on the board: write `messages → [model] → one message`. Say: "This is all a model is. No memory, no hands, no clock. Today we give it a body."

[[note: say || "The model is a brilliant brain in a jar. It can think, but it can't *do*. It answers once and forgets you exist. This week we build the body around that brain — and the first thing every body needs is a heartbeat. Today we build the heartbeat: the loop."]]

**7:10–7:35 — the idea, metaphor first.** Draw the loop as a metaphor before a single line of code.

[[note: metaphor || The loop is a **cook working from a recipe they can't see all at once.** The cook (the model) reads the current situation, does one step — chop the onions — looks at the result, and only *then* decides the next step. They keep going, one step at a time, checking the pan after each, until the dish is done. Nobody hands them the finished dish; they decide when it's finished. That "decide, act, look, decide again" cycle *is* the loop. The kitchen doesn't stop until the cook says "it's ready."]]

[[fig: A warm hand-drawn illustration titled "The loop is a cook checking the pan". A single friendly cook figure in the center standing at a stove, drawn mid-motion. Around them a circular arrow with four labeled stations like a clock: (1) "read the situation" (a recipe card), (2) "do ONE step" (chopping), (3) "look at the pan" (peering into a pot), (4) "still not done? → go again" curving back to station 1. A red handwritten note: "the COOK decides when it's ready — nobody hands them the finished dish." A small green tag by the cook: "the cook = the model". Dashed takeaway box: "act, look, decide again — until the cook says done." White background, hand-lettered, charming. || The loop taught as a cook who does one step, checks the pan, and decides the next — and who alone decides when the dish is finished.]]

Now translate the metaphor into the five-step cycle *in words on the board*, still no code: (1) ask the model, (2) did it ask for a tool?, (3) if yes, run the tool, (4) feed the result back, (5) repeat. Draw it as a five-box cycle. Circle box 2 in red — "this is where the agent decides whether it's done." Reveal the three drawings left to right — brain-in-a-jar, cook-and-pan, the five-box cycle — and *don't erase them*; you'll point back at all three during the build. Keep the right two-thirds of the board clear for code.

**7:35–8:20 — THE LIVE BUILD.** Build the bare harness from `your-first-bare-harness`, live, narrating each piece against the board. This is the centerpiece of the whole day.

[[note: demo || Build in this exact order so each piece is trivially small: (1) `call_model` — "the brain in the jar, the whole AI part is six lines." (2) `TOOLS` + `run_tool` — two tiny tools, `read_file` and `run_bash`, "these are the hands." (3) The `while True` loop — "the heartbeat that ties them together." Type it, don't paste it — the students must see the loop *grow* line by line. When you write the stop-condition line, slow down and point at the red circle on the board.]]

The payoff — reserve energy for it. Run the agent on a real request: *"Read pyproject.toml, tell me the Python version, then list the test files."* Then be quiet and let the room watch it take three laps by itself — read the file, run `ls`, answer — with nobody touching the keyboard.

[[note: aha || The moment the room goes quiet is when the agent takes its **second lap without you.** It read the file, and then — on its own — decided it needed to run a command too, and did. Say nothing while it happens. Then: "Notice what I did *not* do. I didn't tell it to run `ls`. It looked at what it had, decided it wasn't done, and acted again. That decision — made by the agent, not by me — is the entire difference between an agent and a script." That sentence is the peak of Day 1.]]

**8:20–8:40 — break it, then fix it.** Remove the `if reply.stop_reason != "tool_use": return` line and re-run on a vague request. Let it loop two or three times re-reading the same file, then Ctrl-C it. "Who decides when we stop? We just deleted that. The loop only ends when the model stops asking for tools — remove that check, or let the model never stop, and it runs forever. Real harnesses add a max-turns guard on top." Put the line back. This makes the stop condition *felt*, not just stated.

**8:40–8:55 — checkpoint questions.** Ask, don't tell. Good questions for Day 1:

- "Where does the agent's *memory* live in our code?" (The `messages` array — it grows every lap.)
- "Who decides the agent is finished — us or the model?" (The model, via the stop reason. This is the load-bearing answer; if they get it, they got the day.)
- "Our `run_bash` will happily run `rm -rf`. What did we forget?" (A guardrail — which sets up Day 2 perfectly.)

[[note: confusion || The number-one Day 1 confusion: students think the *model* runs the tools. Fix it with a gesture at the board. Point at the model box: "The model only says the *words* 'please run ls' — it's just text. It has no hands." Then point at `run_tool`: "*Our code* reads those words and actually runs the command. The model proposes; our harness disposes." Draw a clear line between "model's words" and "our code that acts on them." Students who miss this are lost for the rest of the week, so spend the time.]]

**8:55–9:00 — set up tomorrow.** One sentence: "We just handed an autonomous loop a `run_bash` with no seatbelt. Tomorrow we give it hands it can't hurt anyone with — tools and guardrails."

## Day 2 — tools and guardrails: hands, safely

Goal of Day 2: the room should leave believing that a tool is a **contract** the model reads, and that the harness — not the model — decides whether a proposed action actually runs. By 9:00 they've watched a dangerous command get *stopped at the gate.*

**7:00–7:10 — recall.** Now you have yesterday to lean on. "In one breath: what's the loop?" Take three answers from the room. Then the hook: "Yesterday our agent could run *any* shell command. Today we make that safe — and it turns out 'safe' is half the work of a real harness."

**7:10–7:35 — the idea, metaphor first.** Two metaphors today, one for each half of the layer.

[[note: metaphor || A tool schema is a **job application form.** When you give the model a tool, you're not handing it a hammer — you're handing it a *form* that says: here's what this tool is called, here's what it does, and here are exactly the fields you must fill in to use it (the JSON schema). The model reads the form to learn how to ask correctly. A vague form gets you a vague, wrong request; a crisp form — "field `path`, must be a string, required" — gets you a crisp, correct one. The schema is how you *teach* the model to use the tool.]]

[[note: metaphor || A guardrail is the **bank teller's window.** You (the model) can *ask* for anything — "withdraw a million dollars," "run `rm -rf /`." But you don't reach into the vault yourself. You slide a request through the window, and the teller (the harness) checks it: are you allowed? is the account real? does this need a manager's signature? Only then does money move. The model proposes across the counter; the harness validates, gates, and executes. That counter is the whole safety story.]]

[[fig: A warm hand-drawn illustration titled "The model asks; the harness decides — the bank teller window". On the left, an eager model figure at a counter sliding a paper slip that reads "run_bash: rm -rf /" through a barred teller window. On the right, a calm teller figure (labeled "the harness") holding the slip up to a checklist stamped with steps: "1 valid form? 2 args inside the workspace? 3 needs approval? 4 ok → do it". Behind the teller, a vault labeled "your machine / files". A big red stamp hovering over the dangerous slip: "DENIED — outside workspace". A green note: "the model never touches the vault directly." Dashed takeaway box: "propose across the counter; the harness checks before anything moves." White background, hand-lettered, charming. || Guardrails drawn as a bank teller window: the model can ask for anything, but the harness inspects, gates, and only then executes.]]

Then draw the technical translation right beside it — split the board in two. Left half: the two metaphors (job-application form on top, bank-teller window below). Right half: the gate pipeline as five numbered boxes top to bottom, in the semantic colors — purple validate → blue path-check → orange approval gate → green execute → blue bounded-result. You'll build code that mirrors those five boxes exactly, so students can point from a line of code to a box on the board.

**7:35–8:20 — THE LIVE BUILD.** Take yesterday's bare harness and add the gate. This is a satisfying build because it's an *upgrade* of code they already understand.

[[note: demo || Build in three moves. (1) Add a proper schema to a tool and show the model calling it correctly — "the form works." (2) Wrap `run_tool` with a `check(name, args)` that path-checks: does the file path stay inside the workspace? Reject with a clear message if not. (3) Add a permission gate: auto-approve reads, but for `write_file` and `run_bash`, print the proposed command and require a `y/n`. Keep each step under ten lines. Run the agent after each so the room sees the behavior change with the code.]]

[[note: aha || The peak of Day 2: ask the agent to do something that requires touching a file *outside* the workspace, or run a destructive command — and watch your path-check or approval gate *stop it cold*, printing "blocked: outside workspace" or pausing for your `y/n`. "The model genuinely tried to do that. And our fifteen lines of harness said no. *That* is the difference between a demo you screenshot and an agent you'd let run on your actual repo." The room feels the seatbelt click.]]

**8:20–8:40 — break it, then fix it.** In a disposable temp directory, flip the permission gate to auto-approve-everything and let the agent run a `rm` on a dummy file. "See how fast that happened? No pause, no question. Now imagine that dummy file was your git history." Restore the gate. This makes the *cost of no guardrail* visceral without ever risking a real file — always demo destructive behavior in a scratch dir you don't care about.

**8:40–8:55 — checkpoint questions.**

- "A tool has two halves. What are they?" (The schema the model reads, and the function we run.)
- "The model asked to run `rm -rf ~`. Walk me through what happens in our harness." (Proposal → validate → path-check fails / approval gate pauses → denied. If they can narrate the pipeline, they own the layer.)
- "Why do we auto-approve `read_file` but not `write_file`?" (Reads don't change the world; writes and shell commands do. Blast radius.)

[[note: confusion || The common Day 2 confusion: "if the model is smart, why do we need to check its work at all?" Answer honestly and with the teller metaphor. "It's not about the model being dumb — it's about the model being *autonomous and occasionally wrong*, running unattended, on your real machine. A smart teller still checks every slip, not because customers are crooks, but because one bad slip can empty the vault. Guardrails aren't an insult to the model; they're the seatbelt that lets you drive fast." ]]

**8:55–9:00 — set up tomorrow.** "Now our agent has safe hands and can loop as long as it likes. But every lap, the *entire* conversation gets re-sent to the model — and the context window is finite. Tomorrow: what happens when the conversation gets too big, and who decides what to keep."

## Day 3 — the context engine: staying coherent

Goal of Day 3: the room should leave understanding that the **context window is a fixed budget**, that it fills up and gets expensive, and that a *context engine* deliberately chooses what to spend it on. This is the most abstract of the three mornings, so lean harder on the metaphor and the live demo of the window actually filling.

**7:00–7:10 — recall.** "Two breaths: the loop, and the gate." Then the hook — and make it a number. "Every single lap of yesterday's loop, we re-send the *whole* conversation to the model. Read a 40,000-line log? That's now in every future call. Today we find out why that's a problem and what to do about it."

**7:10–7:35 — the idea, metaphor first.**

[[note: metaphor || The context window is a **whiteboard of fixed size**, and the model can only ever see what's currently written on it. Every turn, you must fit everything the model needs — the instructions, the tools, every file it read, every command's output — onto that one board. It doesn't grow. Once it's full, something has to be erased to write anything new. The **context engine** is the person standing at the board deciding, every turn, what's worth keeping and what to wipe: keep the instructions (top-left, never erased), keep the last few exchanges (fresh, detailed), but that giant log from ten turns ago? Summarize it into one line and wipe the rest. Managing that board well is the difference between an agent that stays sharp and one that drowns in its own notes.]]

[[fig: A warm hand-drawn illustration titled "The context window is a whiteboard someone must curate". A fixed-size whiteboard drawn with a firm border and a red label "FIXED SIZE — can't grow". On the board, labeled regions like sticky-note bands: a pinned top strip "INSTRUCTIONS + TOOLS (never erased)", a middle strip "old turns → summarized to one line", a large bright bottom strip "recent turns (kept in full detail)". A friendly curator figure stands at the board with an eraser in one hand and a marker in the other, mid-decision, a thought bubble: "keep this... wipe that... summarize that giant log". A discard bin beside them overflowing with red-crossed items labeled "40k-line log, the same file read 3×". Dashed takeaway box: "the board is fixed; someone must choose what's worth the space." White background, hand-lettered, charming. || The context engine drawn as a curator at a fixed whiteboard, keeping instructions and recent turns while summarizing or wiping the rest.]]

Then the number that makes it real:

[[note: example || Put the budget on the board as arithmetic. Window ≈ 200,000 tokens. System prompt + tool schemas ≈ 2,000, re-sent *every* lap. A single big file read = 15,000. Ten of those = 150,000 — three-quarters of the budget gone on stale file contents, and you haven't even done the real work. "The window isn't just a limit you hit at the end. It fills up *quietly*, and a window stuffed with junk makes the model dumber long before it overflows." That's the whole motivation for the layer, in one column of numbers.]]

[[fig: A technical Excalidraw diagram titled "The token budget fills up quietly", semantic-color grammar on a white background. A tall yellow-hatched container box labeled in green "CONTEXT WINDOW — 200,000 tokens (FIXED)". Inside, stacked horizontal bands sized roughly to scale: a thin purple band at top "system + tool schemas · 2k · re-sent EVERY lap"; then three growing blue bands each labeled "big file read · 15k"; a red bracket spans them labeled "10 reads = 150k → 75% gone before real work". A small orange band at the very bottom labeled "space left for the actual task". To the left, a numbered blue flow: circle 1 "each lap re-sends the WHOLE array", circle 2 "stale reads pile up", circle 3 "window fills → model gets dumber, then errors". A dashed takeaway box: "the window fills quietly — the engine must reclaim it." Hand-lettered labels, dashed arrows, numbered circles. || The context budget as a to-scale stack: a tiny cached prefix, then big file reads devouring three-quarters of the window before the real task even begins.]]

**7:35–8:20 — THE LIVE BUILD.** Build a minimal context engine on top of Day 2's harness. Keep it concrete — three small, visible mechanisms.

[[note: demo || Build three things, running the agent between each so the room sees the token count drop. (1) A **token counter / printout** — after each lap, print the size of `messages` so the window filling is *visible on screen*. This is the demo's spine; students must watch the number climb. (2) **Clip + dedup** — cap any single tool result at N characters and skip re-adding a file already in context. Watch the number stop exploding. (3) **Compaction** — when `messages` crosses a threshold, replace the oldest turns with a one-line summary and keep the recent ones verbatim. Watch the number *drop* mid-run while the agent keeps working.]]

[[note: aha || The peak of Day 3 is watching the **token counter go down while the agent keeps going.** Run a long task, let the number climb toward the threshold, and at the moment compaction fires, the count drops — and the agent finishes the task anyway. "It just forgot the boring middle of its own conversation, kept a one-line summary, and finished the job without missing a beat. That's how Claude Code runs a two-hundred-turn session inside a window that could never hold two hundred turns." The abstract idea becomes a number on screen that visibly shrinks.]]

**8:20–8:40 — break it, then fix it.** Disable clipping and compaction, then feed the agent a task that reads several big files. Let `messages` blow past the window until the API rejects the call (or the printout shows you're way over budget). "That's the wall every long-running agent hits. The context engine is the only reason a real agent doesn't hit it on every serious task." Re-enable, re-run, cross the same task successfully. The contrast is the lesson.

**8:40–8:55 — checkpoint questions.**

- "Why is the same conversation re-sent every single lap? Isn't that wasteful?" (Yes — the model is stateless; the window is its *only* memory each call. This closes the loop back to Day 1's `messages` array.)
- "The system prompt never changes — why keep it pinned at the very front?" (So the provider's prompt cache can reuse it and you don't pay to re-send it every lap.)
- "What's the difference between clipping and compaction?" (Clipping shortens one big thing at the door; compaction summarizes many old turns. Different tools, same goal: spend the budget well.)

[[note: confusion || The classic Day 3 confusion: students conflate the *context window* with the model's long-term memory, and think summarizing means the agent is "losing intelligence." Reframe: "The model has no long-term memory at all — it forgets everything between calls. The window is a *scratchpad we rebuild every turn*, not a brain we're damaging. Compaction isn't lobotomizing the model; it's choosing what to write back onto the scratchpad. The intelligence is in the model and never changes — the skill is in what we choose to show it." Point back at Day 1's brain-in-a-jar: the jar was always stateless; the window is how we feed it.]]

[[note: production || Tie all three mornings to the real world in your closing minute. "Everything we built this week — the loop, the gate, the context engine — is not a teaching toy. It is the actual skeleton inside Claude Code, Cursor, and pi. pi (pi.dev) proves you can fit all of this in a *small* codebase. A cheap agent and an expensive one can run the identical model; the difference in cost and coherence is almost entirely the context engine we just built. This is where the money is won."]]

**8:55–9:00 — set up tomorrow.** "Our agent is now smart, safe, and coherent — but it's *mortal*. One Ctrl-C, one crash, and everything is gone. Tomorrow: durability — how to make an agent that survives death."

## A note on running behind

You will run behind. Every mentor does. Here is the triage order, memorize it: **cut theory before you cut the build; cut the break-it demo before you cut the checkpoint questions; never cut the aha moment.** The aha — the agent's second lap, the blocked command, the shrinking token count — is the one thing a student remembers a week later. Protect it above all else.

[[note: say || If you're at 8:20 and you haven't started the break-it demo, say this out loud and move on: "We're going to skip breaking it today and trust me that it breaks — instead let's make sure you can each explain what we built." Then go straight to checkpoint questions. Honesty about the clock builds trust; rushing the build to cram everything in destroys it.]]

## You can now teach

- The **shared six-waypoint skeleton** of every 7–9 AM morning, and why the live build is the one block you never let shrink.
- **Day 1 (the loop)** block by block: brain-in-a-jar → cook-and-pan metaphor → build the bare harness live → break the stop condition → the "second lap without you" aha.
- **Day 2 (tools + guardrails)** block by block: the job-application-form and bank-teller metaphors → build the gate pipeline as an upgrade → block a dangerous command live → the seatbelt-clicks aha.
- **Day 3 (the context engine)** block by block: the fixed-whiteboard metaphor → the 200k-token budget arithmetic → build counter + clip/dedup + compaction → the shrinking-token-count aha.
- The **checkpoint questions** for each day that reveal whether the load-bearing idea landed (who decides done; walk the gate; why re-send every lap).
- The **triage order** for running behind — cut theory, then the break-it demo, but never the aha — and the exact line to say when you're out of time.
