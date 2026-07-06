By the end of this chapter you can stand at a whiteboard and teach durable execution as plainly as a video-game save point — so clearly that a student who has only ever watched a program crash and lose everything suddenly sees how a coding agent can die mid-task, come back to life, and pick up *exactly* where it left off without redoing a single expensive thing. This is the durability layer. It's the piece that turns a fragile script into something you'd trust to run for an hour. So you must own it cold — and the good news is the whole idea fits inside one metaphor every gamer already lives by.

The one sentence to keep repeating all day: **the agent's progress lives on disk, not in the running program.** Say it early. Say it when the demo crashes. When that lands, the fear of "what if it dies halfway" simply evaporates.

## Start with the pain: why a long agent run is terrifying

Before we say "durable execution," we feel the problem. Your agent loop from Layer 1 is a `while` loop that calls the model, runs a tool, calls the model again. A real task might take forty laps over twenty minutes. Now picture lap thirty-eight: the model has already read fifteen files, run the tests four times, made three edits. And then — your laptop sleeps. Or the API times out. Or you hit Ctrl-C by accident. The process dies.

Everything was in memory. Memory is gone. You start over from lap one, paying for all fifteen file reads, all four test runs, all those model calls again — in time *and* in dollars.

[[note: say || "Here's the nightmare. Your agent has been grinding for twenty minutes. It's on step thirty-eight of forty. Your Wi-Fi blinks. The process dies. How much work did you just lose?" — pause, let them say "all of it" — "All of it. Twenty minutes and a few dollars of model calls, gone, because the only place that progress lived was the memory of a program that just died. That's the problem we're killing today."]]

[[note: metaphor || The **long dungeon with no save point.** You've fought your way three hours into a game — cleared every room, collected every key, you're standing at the final boss. Then the power flickers and the console shuts off. You boot back up... at the very beginning. Empty-handed. Every gamer has felt that specific heartbreak, and every gamer knows the fix: *save points.* A place partway through where the game writes your progress to the memory card, so a crash only costs you the last few steps — not the whole three hours.]]

[[fig: A warm hand-drawn illustration titled "The dungeon with no save point". A side-scrolling game level drawn as a winding path with rooms: room 1 "start", room 2 "got the key", room 3 "beat the mini-boss", up to a big room near the end labeled in orange "FINAL BOSS — you are here". A red lightning bolt labeled "power cut!" strikes the hero figure standing at the boss. A big red dashed arrow loops all the way back to room 1, labeled in red "back to the very start — everything lost". A sad little hero figure at the start, empty-handed. A dashed takeaway box: "no save point -> a crash costs you the ENTIRE run". Excalidraw style, white background, charming, hand-lettered. || The pain we're solving, drawn as a game with no save point: one crash and three hours of progress vanish.]]

## The fix, in plain words: write down what happened, before you forget it

Here is the whole idea, and it's almost embarrassingly simple. **Every time the agent finishes one real step, we write down what happened — to a file on disk — before we move on.** Not the plan. The *result*. "I read config.py, here are its contents." "I ran the tests, here's the output." "The model said to edit line 40."

That file on disk is the save point. It has a name — the **event log**, or **journal**. It's an append-only list: every step, in order, with its result, written down the instant it completes.

Now the magic. If the process dies and restarts, the first thing it does is *read the journal*: "I already read config.py, here's what was in it. I already ran the tests, here's the output." It replays those recorded results instead of redoing the work — fast-forwarding through everything it already did, and picking up the live work only at the first step that has *no* recorded result yet.

[[note: metaphor || The **cooking show with a fridge full of pre-made dishes.** You've seen it: the chef chops the onions, then says "and here's one I prepared earlier" and pulls a finished dish from the oven. Replay is exactly that. On restart, the agent walks through its recipe again — but for every step it already finished, it doesn't cook, it just reaches into the fridge (the journal) and pulls out the result it made earlier. It only starts *actually cooking* at the first step it never got to. Fast-forward through the recorded past; go live at the present.]]

[[fig: A warm hand-drawn illustration titled "Here's one I prepared earlier". A TV cooking-show set: a friendly chef figure at a counter. To the left, three finished dishes on plates coming out of an open fridge, each labeled with a green tag: "step 1 result", "step 2 result", "step 3 result". The chef is reaching into the fridge and pulling them out with a speech bubble "already made these — grab from the fridge". To the right, a raw cutting board with un-chopped onions labeled in orange "step 4 — actually cook this now", with the chef's other hand holding a knife over it. A blue dashed divider between the fridge side (labeled "REPLAY: served from the journal") and the cutting-board side (labeled "LIVE: really running"). A dashed takeaway box: "finished steps come from the fridge; only the next new step is cooked fresh". Excalidraw style, white background, charming, hand-lettered. || Replay as a cooking show: finished steps are pulled ready-made from the fridge (the journal); only the first unfinished step is actually cooked live.]]

[[note: example || Tiny concrete trace. The agent does three steps, and after each one we append to the journal on disk:

```
step 1: read_file("config.py")   -> "PORT = 8080\n..."
step 2: run_bash("pytest")        -> "1 failed, 4 passed"
step 3: edit_file("auth.py", ...) -> "ok, 1 line changed"
```

Now it crashes before step 4. We restart. The agent begins step 1 again — but *checks the journal first*: "step 1 already has a result." It doesn't open the file; it hands back `"PORT = 8080..."` from the journal instantly. Same for steps 2 and 3. At step 4, the journal is empty — so *now* it really runs. Three steps replayed from disk in a millisecond; work resumes exactly where it stopped.]]

[[fig: A hand-drawn technical diagram titled "The journal is the save point". Down the left, a yellow-hatched vertical stack labeled "event log (journal) on disk", with three rows written in purple: "1  read_file -> 'PORT=8080...'", "2  run_bash -> '1 failed'", "3  edit_file -> 'ok'". To the right, the agent loop drawn as numbered blue circles 1-2-3-4. A green dashed arrow from each journal row into its matching loop step, labeled "replay: use the recorded result". Step 4 has NO journal row; a bold orange arrow points to it labeled "first unrecorded step -> go LIVE here". A red lightning bolt between step 3 and 4 labeled "crash happened here". A dashed takeaway box: "replay the recorded steps from disk; only actually run the first step with no result yet". Excalidraw style, white background, hand-lettered, semantic colors. || Replay in one picture: the journal fast-forwards through finished steps and hands control back to the live work at the first gap.]]

## Why replay returns cached results — and why that's the whole trick

Sit on this, because it's the exact place students get confused. On replay, when the agent "does" step 1 again, it does **not** re-open the file. It gets the *old recorded answer* handed back to it. The step is a no-op that returns a cached result.

This has to be true, and here's the reasoning to walk them through slowly. The agent's decisions were *based on* what step 1 returned. If replay re-ran step 1 and the file had changed in the meantime — a different result — the agent might make a different choice than it did the first time, and the whole recorded history downstream would no longer make sense. The journal is a record of *this specific run*. To resume that run faithfully, every already-completed step must return the *same thing it returned before*, exactly. So replay doesn't re-execute — it **re-reads the answer from the log.**

[[note: aha || The sentence that makes it click: **"On replay, a completed step doesn't run — it just hands back the answer it wrote down last time."** Students expect resume to mean "do everything again but faster." It's the opposite. Resume means *don't do it again at all* — read the recorded result and move on. The only step that actually executes is the first one that never finished. Say it as a rule: "replayed = returned from the log; live = actually run. Exactly one line in the code decides which, and it's just: *is there a recorded result for this step?*"]]

[[note: confusion || The number-one confusion: "if replay re-runs the file read, won't it just get the current file — what's the problem?" Fix it with a concrete break. Suppose someone edited `config.py` between the crash and the restart. If replay *re-ran* the read, step 1 now returns a different value than the model originally saw — but the model's later decisions were baked into the journal based on the *old* value. You'd have a history that contradicts itself. So replay returns the *original* recorded value, not today's file. Draw it as: "the past is read-only."]]

[[sn: This is why the thing we journal is the *step's result*, not the step's plan. We record effects and their outcomes, keyed so that on replay we can match "this exact step" to "its exact recorded result." The technical name for keeping that mapping stable is making each step **deterministically identifiable** — same position, same call, same key. If you can't reliably match a step to its record, you can't safely replay it.]]

## The one honest rule this buys you: journal at every side effect

Here is the discipline that makes durability actually work, and it's worth writing on the board in red. **Anything that touches the outside world — reading a file, running a command, calling the model — must go through the journal.** Do the effect once, write the result down immediately, and from then on always serve that result from the log on replay.

The pattern is always the same three beats: (1) check the journal — do I already have a result for this step? If yes, return it. (2) If no, actually perform the effect. (3) Write the result to the journal *before returning it.* Three lines wrapping every side effect. That's durable execution.

[[note: example || The wrapper, in about eight lines, is the whole engine:

```python
def durable_step(journal, step_id, do_it):
    if step_id in journal:          # 1. already done on a past run?
        return journal[step_id]     #    -> hand back the recorded result
    result = do_it()                # 2. first time: actually run it
    journal[step_id] = result       # 3. WRITE IT DOWN before returning
    save(journal)                   #    (persist to disk right now)
    return result
```

Every file read, every bash call, every model call goes through this. Nothing else changes about your agent loop. The loop from Layer 1 stays exactly the same — you've just made each of its side effects go through this little save-point valve.]]

[[fig: A hand-drawn illustration titled "Every side effect goes through the save-point valve". A pipe/plumbing metaphor: the agent loop on the left as a blue circle, sending an action ("read file") down a pipe toward the real world (a filing cabinet + terminal on the right). Set into the pipe is a big orange valve labeled "durable_step". Two hand-drawn paths out of the valve: an upper GREEN path curving to a yellow-hatched "journal on disk" box labeled "already recorded? -> pull result from here (replay)"; a lower BLUE path continuing to the real world labeled "not yet? -> do it for real, then write result to journal". A red note on the valve: "nothing reaches the real world without being logged". Dashed takeaway box: "one valve on every side effect = crash-proof". Excalidraw style, white background, charming, hand-lettered. || Durable execution as plumbing: a single save-point valve sits on every side effect, either replaying from the journal or running live and recording.]]

## The tension you must name: side effects don't un-happen

Be honest with the room about the sharp edge, because a smart student will find it. Replay is safe for *reading* — reading a file twice hurts nothing. But some steps *change* the world. If the agent already ran `rm file.txt` and *then* crashed before writing the result down, what happens on replay?

This is why the **order** in the wrapper matters, and it's a subtle, beautiful point. You do the effect, and you write the result down — and if you crash *between* those two, you have a problem: the effect happened but isn't recorded, so replay will do it *again*. Real durable systems fight this with two tools. First, journal the *intent* before acting too, so on replay you can at least detect "I was about to do this — did it finish?" Second, prefer effects that are **idempotent** — safe to do twice (writing a file with fixed contents is idempotent; appending a line is not). You don't need to solve this fully in the workshop, but you must *name* it, or a student will feel tricked later.

[[fig: A hand-drawn technical diagram titled "The gap between doing and recording". A horizontal timeline of one durable step with three numbered blue circles: (1) "journal INTENT: about to delete", (2) "DO the effect: rm file.txt", (3) "journal RESULT: deleted ok". A red lightning "CRASH" bolt is placed squarely in the gap between circle 2 and circle 3, with a red label "danger zone: effect happened, result not written". Below, two outcome branches: a green branch from a crash between 1 and 2 labeled "safe -> effect never ran, just redo it"; a red branch from a crash between 2 and 3 labeled "risky -> effect ran but replay will run it AGAIN". To the side, an orange note "fix: make effects idempotent (safe to repeat)". A dashed takeaway box: "reads are always safe to replay; one-shot writes need idempotency + intent logging". Excalidraw style, white background, hand-lettered, semantic colors. || The hard edge of durability: a crash in the gap between doing an effect and recording it means replay repeats it — which is why idempotency and intent-logging matter.]]

[[note: confusion || The sharp student asks: "what if it crashes *after* deleting the file but *before* writing to the journal?" Don't wave it away — honor it. "Great question, and it's the hard heart of this whole field. The short answer: we journal the *intention* first, then the *result*, so on replay we can see 'I meant to delete, did I finish?' And we lean on steps that are safe to repeat. Reads are always safe. Writes we make idempotent. Truly one-shot side effects — sending an email, charging a card — need extra care, and that's exactly why durable-execution engines are a serious engineering topic and not a weekend hack." Naming the limit builds trust; hiding it destroys it later.]]

## In production, right now

This is not a classroom nicety — it's load-bearing infrastructure in the tools your students use. **pi**, the harness this workshop rebuilds, is built around exactly this: every step of an agent run is journaled, so a session survives a crash, a redeploy, or a machine swap and resumes mid-task without redoing work. **Claude Code** persists session state so you can close your laptop, come back, and continue a conversation with its full history and tool results intact — the transcript on disk *is* the save file. Beyond agents, this is a whole industry: **Temporal** and **AWS Step Functions** are systems whose one job is durable execution by replay — they journal every step of a workflow so it survives any crash and resumes exactly where it stopped. When your students build the eight-line `durable_step` wrapper, they are building the miniature core of Temporal.

[[note: production || Say it plainly at the board: "The thing you're about to build in eight lines is, at its heart, the same thing Temporal does — a system companies pay real money for, whose entire value proposition is *your long-running job survives a crash and resumes without redoing work.* pi uses it so an agent can grind for an hour and shrug off a restart. Claude Code uses it so you can close your laptop mid-task. This is the least glamorous layer of the harness and quietly the one that makes it trustworthy in production." That reframes durability from "boring plumbing" to "the reason anyone would run this on real work."]]

## The morning lecture plan (7:00–9:00 AM IST)

Two hours, three blocks, one live BUILD each. The whole chapter builds to one demo — crash it, resume it — so protect the time for it.

**Block 1 — the pain and the save point (7:00–7:40).** Open cold with the no-save-point dungeon (7:00–7:12): tell the heartbreak story, draw the level, let them feel the loss. Then reveal the fix — the journal as save point — and the cooking-show "here's one I made earlier" metaphor (7:12–7:30). **Live build:** take the Layer-1 agent loop and run a task that takes ~5 laps; print each step's result as it happens, so they see the progress that *would* be lost (7:30–7:38). *Checkpoint question:* "Right now, if I kill this process at lap 4, where does the progress live — and is it recoverable?" (Answer: in memory only; not recoverable.)

**Block 2 — the journal and replay (7:40–8:25).** Draw the journal-on-disk figure and walk the three-step trace by hand (7:40–7:58). Then land the core idea — replay returns *cached* results, it does not re-run — and drill the confusion with the "someone edited config.py between runs" break (7:58–8:12). **Live build:** write the eight-line `durable_step` wrapper live and route the tools through it; show the journal file filling up on disk with each step (8:12–8:25). *Checkpoint question:* "On replay, when the agent 'reads' the file again, does it open the file?" (Answer: no — it returns the recorded result from the journal.)

**Block 3 — crash and resume, then the honest edge (8:25–9:00).** The centerpiece demo (8:25–8:45): run the durable agent, and *kill it mid-task* — Ctrl-C at lap 4. Then run the exact same command again. Watch it fast-forward silently through laps 1–3 from the journal and go live at lap 4. Count the model calls it *didn't* make. Then name the sharp edge (8:45–8:57): side effects don't un-happen, journal-order matters, idempotency, and the "crash between doing and recording" question. Close on the production link (8:57–9:00): this is Temporal, this is pi. *Checkpoint question:* "Who saved the agent's progress — the model, or our journal on disk?"

[[note: demo || The single demo that has to land, rehearse it until it's boring to you: run the durable agent on a real task, hit **Ctrl-C at lap 4**, then re-run the *identical* command. The room should *see* laps 1–3 flash by instantly (replayed from disk, zero model calls) and then watch it slow down and go live at lap 4. The tell is the timing: the first three steps return in milliseconds because nothing actually runs; the fourth pauses because it's calling the model for real. Print "REPLAYED (from journal)" vs "LIVE (running now)" next to each step so the fast-forward is unmistakable. That five-second contrast is the entire chapter.]]

[[note: teach || Sequence discipline: do NOT show the `durable_step` code until *after* the by-hand journal trace in Block 2. If you show code first, students memorize syntax and miss the idea. Trace three steps on the board, crash, replay from the log by hand — pointing at each written row — *then* reveal that the code is just those pointing-motions written down. When you finally show the eight lines, someone should say "oh, it's just checking the list first." That recognition is the goal; the code should feel like notation for something they already did with their finger.]]

## You can now teach

- **The pain** — a long agent run that dies loses everything, because progress lives only in the memory of the running process — using the no-save-point dungeon.
- **The save point**: the append-only **journal** on disk, written after every step, and the cooking-show "here's one I made earlier" picture of replay.
- **Why replay returns cached results** and does *not* re-run — the past is read-only, and re-running would let the recorded history contradict itself.
- **The eight-line `durable_step` wrapper** — check the journal, else do it and write the result down — and that it wraps every side effect while the Layer-1 loop stays untouched.
- **The honest edge**: side effects don't un-happen, so journal order and idempotency matter — named plainly, not hidden.
- **The production link**: this is how **pi** survives crashes mid-task, how **Claude Code** lets you close your laptop, and the miniature core of **Temporal** / **Step Functions**.
- **The full 7:00–9:00 AM lecture**: three blocks, one live build each, and the crash-at-lap-4-then-resume demo that makes durability unforgettable.
