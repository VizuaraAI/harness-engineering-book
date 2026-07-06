By the end of this chapter you can walk into any of the five live days, open the matching chapter of this handbook, and turn it into a two-hour session where you *teach a layer of the harness while you build it live with the cohort* — calm, unhurried, and never bluffing. This chapter is about the handbook itself: how it's built, why it's built that way, and the exact ritual for prepping a day from it.

Let me say the most important thing first, plainly. This is not a book you read *to* the room. It is a book you read *before* the room, until the idea is yours — and then you close it, stand up, and rebuild the idea live with your students watching. The handbook is the rehearsal. The live day is the performance. Keep those two separate in your head and everything gets easier.

## What we are actually building over five days

So you never lose the plot, hold the whole arc in one sentence. We are building a **coding-agent harness** — the software that wraps a large language model and turns it from a chatbot into something that can actually *do work* on a real computer: read your files, run commands, edit code, remember what it's doing, and recover when it fails. Tools like Claude Code, pi, and Cursor are exactly this. The model is the brain; the harness is the body.

[[note: metaphor || The model is a brilliant new employee who has read every book ever written but has no hands, no desk, no memory of yesterday, and no way to see the office. The harness is everything we give that employee so they can actually do the job: hands (tools), a notebook (context), a filing cabinet (durability), and a manager who can delegate (orchestration). Over five days we build the body around the brain, one part at a time.]]

[[fig: A warm hand-drawn illustration titled "The brain and the body". In the center, a friendly glowing lightbulb-headed figure labeled in orange "the LLM (the brain)" sitting on a stool with no arms and empty pockets, a small thought-bubble reading "I know everything... but I can't touch anything". Around it, four labeled things being handed to it by little helper hands: a pair of work gloves labeled green "TOOLS (day 1-2)", an open notebook labeled green "CONTEXT (day 3)", a filing cabinet with a save-disk icon labeled green "DURABILITY (day 4)", and a tiny org-chart labeled green "ORCHESTRATION (day 5)". A dashed takeaway box at the bottom reads "the model is the brain; the harness is the body we build around it". Excalidraw style, white background, charming, handwritten labels. || The whole workshop in one picture: five days of building a body around a borrowed brain.]]

Each day adds one part of the body. Day by day the loop gets a little more alive. By Friday the cohort has built something that feels like pi. That progression — brain alone, then hands, then memory, then safety, then a team — is the spine of the course, and every chapter in this handbook is one vertebra.

## The seven ingredients — the recipe behind every chapter

Every concept in this handbook is served with the same seven things, always in the same order. This is deliberate. When the structure is predictable, you stop worrying about *what comes next* and put all your energy into *delivering the thing in front of you*. Here is the recipe, and it is also the recipe you'll use at the whiteboard.

[[note: teach || The seven ingredients, in order: **(1) plain words** — say it like you're talking to a smart friend who has never built an agent. **(2) a metaphor** — a real-world picture you can redraw on the board. **(3) a tiny concrete example** — a two-line trace, a three-tool loop, something you can walk through by hand. **(4) the real mechanism** — the actual code or protocol, built up gently from the tiny example. **(5) in production today** — where this exact thing lives in Claude Code, pi, or Cursor. **(6) teaching notes** — the board plan, the reveal order, the one live demo. **(7) the common confusion** — where students get lost, and the one sentence that unlocks them.]]

[[fig: A hand-drawn "recipe card" illustration titled "The seven ingredients of every concept". A tall recipe card with seven numbered rounded rows, each with a little hand-drawn icon: 1 a speech bubble "plain words", 2 a lightbulb "a metaphor", 3 a tiny 2x2 grid "one concrete example", 4 a gear "the real mechanism", 5 a small factory "in production today", 6 a chalkboard "teaching notes", 7 a warning triangle "the common confusion + fix". The rows alternate soft blue and soft green fill. An orange arrow runs down the left margin labeled "always this order". A dashed takeaway box reads "predictable structure -> you focus on delivery, not on what comes next". Excalidraw style, white background, warm and friendly, handwritten. || The fixed recipe: seven ingredients, same order, every single concept.]]

Why this exact order? Because it mirrors how a human actually learns. You meet the *shape* of the idea in plain words. The metaphor gives you something to hold. The tiny number makes it real. Only then are you ready for the mechanism — and by that point it feels obvious rather than dropped from the sky. The production link tells you it *matters*. And the teaching notes plus the confusion fix are for you, the mentor, so you can hand the whole thing to the room without stumbling.

[[note: aha || Here is the reframe that makes prepping fast: **you learn a chapter by reading ingredients 1 through 5, and you teach the chapter by delivering ingredients 1 through 5 in the same order.** The chapter isn't just your study material — it is *the lesson plan itself*. Ingredients 6 and 7 are the director's notes scribbled in the margin. Once you see this, prepping a day stops feeling like homework and starts feeling like reading your own script.]]

## The callout blocks — how to read the margin

Scattered through every chapter are colored cards. Each one is one of the seven ingredients, pulled out so it catches your eye. Learn to read them at a glance, because on prep morning you'll skim by color.

[[note: say || When you present, the yellow "say" cards are gold — they are the *exact words* to speak at the board. You don't have to invent phrasing under pressure. Read them a few times the night before until they sound like you, then say them in your own voice on the day.]]

There are eight kinds. **metaphor** is the picture. **example** is the tiny by-hand number. **production** is where it runs in the real world today. **teach** is the board plan and pacing. **say** is the literal line to speak. **demo** is the live thing to run. **confusion** is the trap and its fix. **aha** is the moment that makes the room light up. When you skim a chapter to prep, read the **teach**, **demo**, and **say** cards first — those three *are* your delivery. Then read the **confusion** cards, because those are the questions coming at you.

[[fig: A hand-drawn "legend" figure titled "Reading the margin at a glance". Eight small colored cards in a 2x4 grid, each hand-drawn with its icon and a one-line description: a lightbulb "metaphor - the picture", a tiny grid "example - the by-hand number", a factory "production - where it runs now", a chalkboard "teach - board plan & pacing", a microphone "say - exact words to speak", a play-button "demo - the live thing to run", a warning triangle "confusion - the trap + fix", a sparkle "aha - the moment it clicks". Below, three of the cards (teach, demo, say) are circled together in orange with a note "read these FIRST when prepping". A dashed takeaway box: "skim by color: teach + demo + say = your delivery". Excalidraw style, white background, handwritten. || The eight callout types, and which three to read first on prep morning.]]

[[sn: The **example** and **demo** cards look similar but do different jobs. An **example** is something you walk through *on the board with a pen* — a traced loop, a fake tool call. A **demo** is something you actually *run on the projector* — real code, real output. Board first, then screen: the board builds the mental model, the screen proves it's real.]]

## Learn the layer, then teach it *while you build it*

This is the heart of the workshop's method, so slow down here. Most technical teaching is: explain everything, then build. We do the opposite. We build the layer *live* and teach each piece the moment before we write it. The cohort watches the harness come alive under your hands, one function at a time. This is why the workshop is unforgettable — and it's also why prep matters.

[[note: metaphor || Think of a cooking show, not a cookbook lecture. The host doesn't read the whole recipe and then vanish into the kitchen. They explain the onion *as they pick up the knife*, chop it *on camera*, and the dish assembles in front of you. By the end you feel like you could make it because you *saw it made*. Your live day is a cooking show for a coding harness: explain the tool loop, then write the tool loop, then run it, all in one flowing motion.]]

[[fig: A warm hand-drawn illustration titled "Cooking-show teaching". A cheerful chef at a TV kitchen counter, mid-explanation, holding up an onion in one hand and a knife in the other, a speech bubble reading "we explain it JUST before we build it". On the counter, a half-assembled dish labeled in green "the harness, coming alive live". A little TV camera on a tripod points at the counter. Off to the side, a closed cookbook on a shelf with a red cross through it labeled "NOT: read everything, then disappear to cook". A dashed takeaway box reads "teach each piece the moment before you write it — the harness assembles on camera". Excalidraw style, white background, charming, handwritten. || Live-build teaching as a cooking show: explain the step, then do the step, on camera, in one motion.]]

[[note: confusion || The mentor's own worst fear here: "what if the live code breaks in front of everyone?" Reframe it — a break is a *gift*, not a disaster. When your tool loop throws an error live and you calmly read the traceback and fix it, the cohort learns the single most valuable skill in this whole field: how to debug an agent. Never paste in pre-working code and pretend you typed it. The stumbles are the lesson. The fix is: keep a known-good version of each day's code in a branch you can `git checkout` if you get truly stuck, but *try* to fix it live first.]]

## Production is not optional — always name the real tool

Every chapter ties its idea to something running *right now* in Claude Code, pi, or Cursor. Do not skip these. A student who hears "the tool loop is how Claude Code edits your files" leans in; the abstraction becomes a thing they've *used*. You are not teaching a toy — you are teaching the exact mechanism inside the tools sitting on their laptops.

[[note: production || Concrete anchors you'll reach for all week: the **agent loop** (LLM proposes an action, harness runs it, feeds the result back) is what happens every time Claude Code runs a command for you. **Tool definitions** — the JSON schemas we write on day two — are exactly what Anthropic's tool-use API expects. **Context compaction** on day three is why Claude Code can work for an hour without forgetting the start. **Permission prompts and checkpoints** on day four are the "fire door" that stops an agent from `rm -rf`-ing your repo. **Subagents** on day five are how one agent spawns helpers to work in parallel. Every layer we build has a named twin shipping to millions of users today.]]

## The prep ritual — one page, the night before

Here's the exact routine for turning a chapter into a live day. Do it once and it becomes second nature.

[[note: teach || The night-before ritual, in order. **(1) Read the whole chapter twice** — once for understanding, once out loud. **(2) Do the tiny example yourself** on paper, so the numbers are in your hand, not just your eyes. **(3) Build the day's code yourself, from scratch, once** — no copy-paste. If you can't build it privately, you can't build it live. **(4) Break it on purpose** — trigger the common confusion, watch the error, so nothing surprises you. **(5) Copy the board figures onto a real whiteboard** and time yourself. **(6) Underline the say-cards** you'll use verbatim. Ninety focused minutes the night before buys you a fearless morning.]]

[[note: demo || Your dress rehearsal is: open a blank file, close this handbook, and build the entire day's harness layer from memory while narrating out loud to an empty room. If you can do that once alone, you can do it in front of thirty people. If you stumble, you've found exactly the spot to re-read tonight instead of discovering it live at 7 AM. This single rehearsal is worth more than any amount of re-reading.]]

[[fig: A hand-drawn "prep checklist" illustration styled as a to-do list on lined paper titled "The night before". Six checkboxes, each hand-ticked, in blue ink: "1. read the chapter twice (once out loud)", "2. do the tiny example on paper", "3. build the day's code from scratch, no paste", "4. break it on purpose - meet the error", "5. copy the figures onto a real whiteboard & time it", "6. underline the say-cards". A little alarm clock doodle in the corner set to a friendly hour with a note in orange "~90 min". A dashed takeaway box: "if you can build it alone from memory, you can build it live". Excalidraw style, white background, warm, handwritten. || The night-before ritual as a six-item checklist — the whole prep in one page.]]

## Shape of a live morning (7:00–9:00 AM IST)

Every live day is a two-hour morning built from three or four blocks, and every block follows the same tiny arc: **teach the piece (board) → build the piece (screen) → run it → one checkpoint question.** Here's the default skeleton you'll adapt per day.

- **7:00–7:15 — Recap and today's goal.** Redraw yesterday's harness on the board. Say the one sentence for today: "yesterday it could X; today we give it the power to Y."
- **7:15–7:55 — Block 1: teach + build the core piece.** Metaphor and tiny example on the board (10 min), then write the code live (20 min), then run it and watch it work (10 min). Checkpoint question to the room.
- **7:55–8:35 — Block 2: extend it and break it.** Add the next feature live, deliberately hit the common confusion, debug it together. This is where the real learning lands.
- **8:35–8:55 — Block 3: tie it to production.** Show the same idea inside Claude Code or pi. Let the cohort feel "we just built a real version of *that*."
- **8:55–9:00 — Close.** Restate today's one sentence, preview tomorrow's layer, one checkpoint question they'll answer tomorrow.

[[note: say || Two phrases to keep in your pocket all morning. When you finish a piece: **"Notice we didn't add anything magic — just a loop and a function. That's the whole trick."** When something breaks: **"Good, it broke. This is exactly what happens to real agents — let's read what it's telling us."** These two lines set the tone that the harness is *demystified* and that *errors are normal*, which is the emotional payload of the entire course.]]

[[note: aha || End every block with a checkpoint question the cohort answers *out loud together*, not one you answer for them. "So — where does the model's proposed action actually get executed?" A room that can answer that has *understood*, not just watched. If the room goes quiet, you found a gap; re-explain before moving on. The checkpoint is your instrument panel — it tells you whether to push forward or circle back.]]

## You can now teach

- **What the handbook is for**: a rehearsal you master privately, then close and rebuild live — not a script you read to the room.
- **The five-day arc**: building a body (tools, context, durability, orchestration) around a borrowed brain (the LLM), one layer per day.
- **The seven ingredients** and why they're always in that order — and that ingredients 1–5 *are* your lesson plan, 6–7 are your director's notes.
- **How to skim by callout color**: read the **teach**, **demo**, and **say** cards first, then the **confusion** cards, when prepping a day.
- **The live-build method**: teach each piece the moment before you write it, on camera, cooking-show style — and treat a live break as a gift.
- **The prep ritual and the morning skeleton**: the six-step night-before checklist, and the teach → build → run → checkpoint arc that fills a 7–9 AM block.
