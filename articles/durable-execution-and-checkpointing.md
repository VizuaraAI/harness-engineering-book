Here is a failure mode that will bite you exactly once, and then you will never forget it. Your agent is twelve turns deep into a real task. It has read forty files, run the test suite twice, made three edits, and it is halfway through calling the model for the thirteenth time — a call that already cost you a few cents in input tokens — when your laptop lid closes, the SSH session drops, or an unhandled exception three layers down takes the process with it. You restart. And the agent has *no idea any of that happened*. It starts over from the user's original request, reads the same forty files, re-runs the same tests, and cheerfully re-applies edits it already applied. You paid twice, you waited twice, and if any of those tool calls touched the outside world — pushed a commit, posted a comment, charged a card — you did it twice too.

The [bare loop](your-first-bare-harness.html) we built is a beautiful thing, but it lives entirely in RAM. Kill the process and the `messages` array — which *is* the agent's memory — evaporates. Layer 4 is where we fix that. The idea has a name borrowed from the databases-and-workflows world: **durable execution**. And the surprising part is how little code it takes.

## The core move: every turn and every tool call is a *step*

The whole trick is to stop thinking of your agent as one long-running function and start thinking of it as a **sequence of discrete steps**, where each step is something that (a) might be expensive, (b) might have a side effect, and (c) produces a result we can write down. A model call is a step. Each tool call is a step. That's it — those are the two kinds of thing an agent does.

Once a step *completes*, we persist its result to a log before doing anything else. Then — and this is the entire payoff — if the process dies and restarts, we **replay** the recorded steps: instead of *re-running* a step we've already done, we hand back its cached result and move on. Replay is fast, free, and side-effect-free, because it isn't really executing anything — it's reading history. The agent fast-forwards through everything it already did and picks up precisely where it stopped.

[[fig: A hand-drawn diagram titled "Crash without durability vs. crash with durability". Two stacked panels. TOP panel labeled in black "(A) NO LOG — replay = redo": a horizontal row of numbered boxes step1 read, step2 model-call, step3 run tests, then a jagged red lightning bolt labeled "CRASH" between step3 and step4, then a curved red arrow looping all the way back to step1 with a red handwritten note "starts over — pays again, re-runs side effects". BOTTOM panel labeled "(B) WITH LOG — replay = fast-forward": the same row of steps, but each step has a small yellow-fill card beneath it labeled "written to log ✓", the same red lightning-bolt CRASH after step3, then a green arrow that skims across step1→step2→step3 with a blue note "replayed from log, no re-run" and lands fresh on step4 with an orange note "resumes HERE". A dashed takeaway box at the bottom: "with a log, replay returns cached results instead of re-executing. crash-recovery for free." White background, hand-lettered Excalidraw. || Without a log, a crash means starting over — paying and re-side-effecting. With a per-step log, replay fast-forwards through completed steps using cached results and resumes at the exact point of failure.]]

This is the same idea that powers systems like **Temporal** and **DBOS**: application code that survives crashes not by being careful, but by recording every meaningful step so the runtime can replay its way back to the present.[[sn: In Temporal's language this is a "workflow" of "activities"; in DBOS it's durable functions backed by Postgres. We are building the miniature, agent-shaped version of the same pattern — you do not need a distributed workflow engine to get 90% of the benefit for a coding agent.]] We are just applying it to the one loop that matters to us.

## The smallest thing that shows it: an append-only event log

Let me make it concrete. The persistence layer is an **append-only log** — a list of events we only ever add to, never mutate. For a single agent run it can be as simple as a JSONL file (one JSON object per line) or a SQLite table. Each event records what step it was, its inputs, and its result.

```python
import json, hashlib, pathlib

class EventLog:
    def __init__(self, run_id):
        self.path = pathlib.Path(f"runs/{run_id}.jsonl")
        self.path.parent.mkdir(exist_ok=True)
        # replay: load everything already committed for this run
        self.events = []
        if self.path.exists():
            self.events = [json.loads(l) for l in self.path.read_text().splitlines()]
        self.cursor = 0  # how far into the log replay has advanced

    def append(self, event):
        with self.path.open("a") as f:
            f.write(json.dumps(event) + "\n")
            f.flush()              # get it onto disk before we act on it
        self.events.append(event)
```

[[fig: A hand-drawn diagram titled "The append-only event log (runs/<id>.jsonl)", drawn as a vertical stack of narrow rectangular cards, one per line, like a growing receipt. Each card is a JSON object hand-lettered in monospace-ish handwriting: card 1 purple text `{"step_id":"model:0", "result":{...}}`, card 2 `{"step_id":"tool:0:0:tu_a1", "result":"file bytes"}`, card 3 `{"step_id":"model:1", "result":{...}}`, card 4 half-drawn and greyed labeled red "← half-written last line (crash mid-flush) — detected & dropped on load". A green down-arrow on the left labeled "append only · never mutate · flush() after each write". On the right, a blue brace spanning cards 1–3 with a note "these are COMMITTED — safe to replay". A small orange callout points at the flush step: "durable BEFORE the side effect is allowed to matter". Top-left constants in handwriting: "one file per run_id · one JSON object per line". A dashed takeaway box at the bottom: "the only corruptible thing is the final line — everything above it is truth." White background, hand-lettered Excalidraw, wobbly rounded cards, thin ink strokes. || The event log is a JSONL file that only ever grows: one committed step per line, flushed to disk before its effect matters. The single failure mode is a half-written trailing line, which is detected and dropped on load.]]

Two details carry the whole design. The log is **append-only**, so it is trivially crash-safe — a half-written last line is the *only* thing that can be corrupt, and we can detect and drop it on load. And we `flush()` *before* the step's side effect is allowed to matter, so the record of "we are about to do X" is durable before X escapes into the world. (More on that ordering in a moment — it's the subtle part.)

## Wrapping a step so it records or replays

Now the heart of Layer 4: a single wrapper that every model call and every tool call goes through. On the first run it *executes* the step and logs the result. On replay it *skips* execution and returns the logged result. The wrapper decides which, based on whether the log already contains this step.

```python
def run_step(log, step_id, fn):
    """Execute fn() once, durably. On replay, return the cached result."""
    # Are we replaying a step the log already has?
    if log.cursor < len(log.events):
        recorded = log.events[log.cursor]
        assert recorded["step_id"] == step_id, "log diverged from code!"
        log.cursor += 1
        return recorded["result"]        # fast-forward: no execution, no side effect

    # Live execution: run it for real, then commit the result.
    result = fn()
    log.append({"step_id": step_id, "result": result})
    log.cursor += 1
    return result
```

Read what this buys you. Every step now has a stable **`step_id`** and passes through `run_step`. First time through, `log.cursor` has caught up to the end of the log, so we take the live branch: run `fn`, append the result, return it. After a crash and restart, we rebuild the `EventLog` from disk, and now `log.cursor` starts at zero while `log.events` is full — so the first N calls to `run_step` take the *replay* branch, each returning its recorded result instantly, until the cursor catches up to where we crashed. From that point on, we're live again. The agent didn't need to know it died. The loop just ran, and `run_step` quietly did the right thing at every step.

[[fig: A hand-drawn zoom-in titled "Inside run_step: the fork", drawn as a single wobbly box labeled in purple "run_step(log, step_id, fn)". An arrow enters from the top labeled black "a step to do". Inside, a purple diamond "log already has this step_id?". A red "YES → REPLAY" branch points to a small yellow card "return recorded result" with a blue note "no fn() call · no cost · no side effect · cursor++". A green "NO → LIVE" branch points to three tiny stacked boxes numbered (1) "run fn()", (2) "append {step_id, result} to log", (3) "flush to disk", with an orange note beside them "commit BEFORE returning". Both branches merge to an arrow leaving the bottom labeled "the step's result". A dashed takeaway box: "one wrapper, two modes. same call site behaves as execute-then-log OR return-from-log." White background, hand-lettered, numbered circles. || run_step forks on whether the log already contains the step: replay returns the cached result with no execution, live runs it and commits before returning. Same call site, two behaviours.]]

## Plugging it into the loop

Here is the loop from [your first bare harness](your-first-bare-harness.html), now durable. Notice how little changed — the shape is identical, we just funnel the two expensive-or-side-effecting things through `run_step`, each with a deterministic id.

```python
def run_agent(user_request, run_id):
    log = EventLog(run_id)
    messages = [{"role": "user", "content": user_request}]
    turn = 0
    while True:
        # STEP: the model call, keyed by turn number
        reply = run_step(log, f"model:{turn}",
                         lambda: call_model(messages, TOOLS))
        messages.append({"role": "assistant", "content": reply["content"]})

        if reply["stop_reason"] != "tool_use":
            return text_of(reply)

        tool_results = []
        for i, block in enumerate(tool_uses(reply)):
            # STEP: each tool call, keyed by turn + position + the block's own id
            out = run_step(log, f"tool:{turn}:{i}:{block['id']}",
                           lambda b=block: run_tool(b["name"], b["input"]))
            tool_results.append(tool_result_block(block["id"], out))

        messages.append({"role": "user", "content": tool_results})
        turn += 1
```

The `messages` array is no longer the source of truth — the *log* is. In fact `messages` is now a **derived value**: on replay we don't restore it from a snapshot, we *rebuild* it by replaying the logged step results in order. That inversion is what makes recovery robust. There is exactly one durable artifact (the append-only log) and everything else — the conversation, the cursor, the in-memory state — is reconstructed from it.

[[fig: A hand-drawn diagram titled "One source of truth, everything else derived", drawn as a fan-out. On the left, a single tall yellow-fill cylinder/box labeled black "append-only LOG" with a red note "the ONLY durable artifact — survives crashes". Three curved blue dashed arrows fan out to the right, each landing on a lightly-drawn ghost box labeled in blue: (1) "messages[] — rebuilt by replaying step results in order", (2) "cursor — where replay has reached", (3) "in-memory state — reconstructed, never persisted directly". Each ghost box has a small orange tag "DERIVED — reconstructed on restart". Below, contrast two mini-panels: left panel red-outlined labeled "✗ pickling live objects — version-locked, opaque diff"; right panel green-outlined labeled "✓ replay an event stream — versions & diffs cleanly, replayable by newer code". A dashed takeaway box: "persist the events, derive the state. never the other way around." White background, hand-lettered Excalidraw, wobbly boxes, thin ink strokes, dashed connector arrows. || The append-only log is the single durable artifact; the messages array, the cursor, and all in-memory state are derived from it by replay. This is why real harnesses persist an event stream rather than pickling live objects — event streams version and diff cleanly.]][[sn: This is why real harnesses persist the full transcript as an event stream rather than pickling the live objects: an event log versions cleanly, diffs cleanly, and can be replayed by a newer version of your code. Raschka's "structured session memory" makes the same split — an append-only transcript plus a compacted working memory — and it's why Claude Code sessions are resumable at all.]]

## The subtle part: idempotency and the ordering of the commit

Everything above works cleanly for steps that are **pure** — a model call, a `read_file`. Replay hands back the recorded result and no harm is done, because re-running would have produced the same thing anyway. The danger lives in steps with **side effects**: `run_bash("git push")`, `write_file`, an HTTP POST that charges money. For those, the question that decides whether your durability is real or a lie is: *what happens if the crash lands right in the middle of that step?*

Consider the ordering. If we run the side effect **first** and log **after**, a crash in the gap means the effect happened but was never recorded — so replay will run it *again*. The push goes out twice. If we log **first** ("about to push") and run the effect **after**, a crash in the gap means we recorded an intent we may or may not have completed — so replay has to *check* before redoing it. Neither ordering is free. Durable execution doesn't eliminate this; it forces you to confront it, which is the honest improvement.

[[fig: A hand-drawn timeline titled "Where can the crash land?", showing a single side-effecting step 'git push' broken into a horizontal sequence with a red lightning bolt hovering over each gap. Left ordering labeled orange "(A) do-then-log": box "run push" → gap-with-lightning → box "write log". A red note under the gap: "crash here = pushed but NOT logged → replay pushes AGAIN (double effect)". Right ordering labeled orange "(B) log-then-do": box "write log 'pushing'" → gap-with-lightning → box "run push". A blue note under the gap: "crash here = logged intent, effect unknown → replay must CHECK, not blindly redo". Below both, a green banner box "the fix: make the step idempotent" with three handwritten bullets: "· use an idempotency key the server dedupes on", "· make the effect a no-op if already applied (git push is naturally idempotent!)", "· check-then-act: 'is this commit already pushed?'". A dashed takeaway box: "you can't make crashes disappear — you make REDOING a step safe." White background, hand-lettered Excalidraw. || A crash can land on either side of the log-vs-effect ordering. The real fix isn't perfect ordering — it's making each side-effecting step idempotent so replaying it is safe.]]

The real answer is not to obsess over ordering but to make each side-effecting step **idempotent** — safe to run more than once with the same net effect as running it once.[[sn: Some effects are naturally idempotent: `git push` of an already-pushed commit is a no-op, and `write_file` with identical content leaves the file identical. The dangerous ones are the *accumulating* effects — "append a comment", "increment a counter", "send an email" — and those are exactly the ones worth an idempotency key or a check-then-act guard.]] The classic techniques are the ones payments systems have used forever: attach an **idempotency key** to the request so the receiving side deduplicates it; write the operation so re-applying it is a no-op (`write_file` with the same bytes changes nothing); or **check-then-act** — before pushing, ask "is this commit already on the remote?" and skip if so. A durable harness makes *replay* correct; idempotent steps make replay *safe*. You need both.

## What this layer buys you, and what it still can't do

With maybe sixty lines — an append-only log and a `run_step` wrapper — your agent gained something the bare loop fundamentally lacked: it can **die and resume**. Kill it at turn thirteen, restart, and it replays twelve turns of history in milliseconds for free, then continues from the exact model call it was making. You stopped paying twice for the same tokens, stopped re-running the same test suites, and — with idempotent steps — stopped firing the same side effects twice. That is the difference between an agent you run under supervision on a good day and one you can trust to run long, unattended jobs.

What it still can't do is *recover from the error itself*. Durable execution gets you back to the point of failure — but if what failed was a flaky API returning a 529, or a tool that timed out, or a model that produced malformed JSON, replay will faithfully carry you right back to the same cliff edge. Surviving the crash is Layer 4a; surviving the *cause* is Layer 4b, where the harness learns to catch, back off, retry, and route around its own failures. That's the next chapter: [self-healing loops](self-healing-loops.html). And once an agent can both persist its progress and heal its own errors, it is finally durable enough to hand a piece of work to on its own — which is exactly what [sub-agents and handoffs](sub-agents-and-handoffs.html) will let it do.
