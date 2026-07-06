By the end of this chapter you can stand up on the third morning and teach the cohort to build a context engine live — compaction and persistent memory bolted onto the loop — so their harness survives a two-hour session instead of falling over at turn twenty. This is a *build* chapter: you type code on a screen while forty people type along. So it isn't enough to understand the idea; you need the exact order to reveal it, the one demo that makes the room gasp, and where everyone gets stuck at the same minute. Let's rehearse all of that.

The one thing you must already own: the Day 2 harness is a loop that *appends everything, forever*. Every drama today comes from that one fact. If you taught [the context window as a resource](the-context-window-as-a-resource.html), the class already believes the window is scarce. Today they *feel* it break, then they *fix* it. Feel it, then fix it — that is the whole shape of the morning.

## The two things you're building today

Say it plainly at the start so nobody is lost. Today the harness learns two new skills.

One: **compaction.** When the conversation gets too long, the harness squeezes the old part down into a short summary instead of shipping the whole transcript every turn. The session keeps going; the history stops growing.

Two: **memory.** Some facts should outlive the conversation entirely — "this project uses pytest," "the API base URL is X." The harness writes those to a file on disk and reads them back at the start of every run. Knowledge that lives *outside* the window.

[[note: metaphor || One kitchen, one problem. Compaction is **wiping the prep counter**: as you cook, the counter fills with dirty bowls and scraps until there's no room to work, so you scrape the mess into one labelled tub — "sauce: done" — and clear the surface. The tub keeps the *result*; the clutter is gone. Memory is the **recipe card pinned to the wall** — written before today's service, still there after, glanced at without ever cluttering the counter. Compaction clears the counter; memory lives on the wall.]]

[[fig: A warm hand-drawn kitchen illustration titled "Two fixes for a full counter". Left panel: a cramped prep counter overflowing with dirty bowls, scraps and stacked plates, a stressed cook, red note "the counter fills as you cook — no room left to work". Center panel labeled "COMPACTION": the same cook scraping the whole mess into one neat labelled tub reading "sauce: DONE" and wiping the counter clean, green note "keep the result, clear the clutter". Right panel labeled "MEMORY": a single recipe card pinned to the wall above the counter reading "this kitchen uses gas, salt is by the sink", a blue note "written before today, still here tomorrow — never on the counter". Dashed takeaway box spanning the bottom: "compaction wipes the counter · memory lives on the wall". Excalidraw style, white background, charming, hand-lettered. || The morning in one picture: compaction clears the working surface, memory is the note that outlives the session.]]

[[note: teach || Write the two words on the board — COMPACTION and MEMORY — and leave them up all morning. Every time you finish a code block, walk over and tap the word you just built. The cohort needs a map of where they are in a two-hour build, and two words they can always see is that map. Don't erase them until the wrap-up.]]

## Block 1 (7:00–7:20) — Break it on purpose

Don't start by explaining. Start by *breaking their working harness in front of them.* This is the emotional hook of the day, and it takes twenty minutes because they should feel it in their own terminal, not just watch yours.

Open the Day 2 harness. Give it a task that forces many turns — "read these five files, then refactor the helper" — and turn on a token counter that prints the size of the `messages` array before every model call. That printout is the star of the block.

[[note: demo || THE LIVE DEMO. Add one line before each model call: `print(f"turn {n}: sending {count_tokens(messages):,} tokens")`. Let it rip. The class watches the number climb — 3,000 · 9,000 · 24,000 · 51,000 — turn after turn, for a task that isn't even big. Say nothing; let it climb. When someone says "wait, why does it keep going up?" — that's your cue. The number climbing on its own beats any slide.]]

[[note: say || "Nobody wrote a bug. This is yesterday's loop working exactly as designed. Its only rule was 'append everything, forever' — and it's obeying, right off a cliff. That's your harness on turn thirty of a real task. Today we teach it to not do that."]]

[[fig: A hand-drawn technical diagram titled "The bill you didn't see coming", semantic-color Excalidraw. Left: a vertical stack of turn rows, each a yellow container tile, growing taller top to bottom — turn 1 short, turn 20 enormous — labeled in blue "messages array, re-sent EVERY turn". A blue dashed arrow from each row points right into a single box labeled "MODEL CALL". Numbered circles 1..4 walk down the growing stack. To the right, an orange emphasis callout: "cost = context size x turn count (a PRODUCT, not a sum)". A red warning tag near the bottom row: "turn 30 → hits the ceiling → error / truncation". Dashed takeaway box: "append-forever doesn't cost you once — it costs you every single turn." White background, hand-lettered. || Why the naive loop is a time bomb: the whole history rides along on every call, so cost scales with size times turns.]]

Checkpoint question to close the block: *"If reading one big file costs 40,000 tokens, and we then take fifteen more turns, roughly how many times do we pay for that file?"* (Answer: fifteen more times — it sits in the array and re-ships every turn.) When they get that, they are hungry for the fix.

## Block 2 (7:20–8:00) — Build compaction

Now the fix. Forty minutes, typed in stages, running the harness after each.

Plain idea before code: the old turns don't need to be sent *word for word* — only as their *meaning*. "We read config.py; the timeout is set in `load_settings`" is ten tokens replacing a five-hundred-token file dump. So when history gets too long, hand the old part to the model and ask for a short summary. Keep the summary, throw away the transcript.

[[note: metaphor || Compaction is the **"previously on…" recap** before a TV episode. The show doesn't replay all of last season — it plays thirty seconds carrying every fact you need for tonight. The old episodes still happened; you just don't re-watch them. Your harness does the same to its own past: a thirty-second recap stands in for an hour of transcript, and the story continues without a hitch.]]

Build it in three visible steps. Type each, run the harness, let them see it work.

**Step 1 — a trigger.** Decide *when* to compact — before the limit, not at it. Pick a budget well under the ceiling.

```python
COMPACT_AT = 40_000   # tokens; well under the 200K ceiling

def should_compact(messages):
    return count_tokens(messages) > COMPACT_AT
```

**Step 2 — split old from new.** Never compact the most recent turns — freshness matters, the model needs the last few exchanges verbatim. Compact only the *old* middle.

```python
def split_history(messages):
    system   = messages[0]          # never touch the system prompt
    recent   = messages[-6:]        # last few turns stay verbatim
    old      = messages[1:-6]       # everything in between → compact this
    return system, old, recent
```

**Step 3 — summarize and rebuild.** Ask the model to compress the old part, then reassemble a *short* history.

```python
def compact(messages):
    system, old, recent = split_history(messages)
    summary = call_model(
        [{"role": "user",
          "content": "Summarize the work so far. Keep decisions, "
                     "file paths, and facts we'll need. Be terse.\n\n"
                     + render(old)}]
    )
    return [system,
            {"role": "user", "content": "[Summary of earlier work]\n" + summary},
            *recent]

# in the loop, right before calling the model:
if should_compact(messages):
    messages = compact(messages)
```

[[note: demo || Re-run the SAME task, same counter. The number climbs — 24,000 · 38,000 · and then *drops back to 9,000* and climbs again. The sawtooth. When they see it fall, that's the moment. Say: "That dip is the harness recapping itself — it just replaced an hour of transcript with a paragraph, and the task didn't notice."]]

[[note: aha || Run it both ways to completion and show total tokens billed. Naive: maybe 800,000 over the session. Compacted: maybe 120,000 for the identical result — one-sixth the cost, and it *finished* where the naive one hit the wall. "Compaction isn't a saving. It's the difference between an agent that runs for two hours and one that dies at twenty minutes."]]

[[fig: A hand-drawn "sawtooth" line chart titled "Context size over a long session", semantic-color Excalidraw. X-axis "turns", y-axis "tokens in window". Two lines: a red straight diagonal climbing forever off the top of the chart, labeled "naive: append forever → hits ceiling (crash)". A blue sawtooth line that climbs, then drops sharply, climbs, drops — staying under a dashed orange horizontal line labeled "BUDGET 40K". Each blue drop annotated with a small numbered circle and a purple tag "compact() fires here". A green side-note by the sawtooth: "old turns → one summary → history resets small". Dashed takeaway box: "compaction turns an ever-rising line into a survivable sawtooth." White background, hand-lettered. || The whole point of compaction in one chart: the naive line crashes into the ceiling; the compacted line saws safely below the budget forever.]]

[[note: confusion || The universal Block-2 bug, around 7:45: a student compacts EVERYTHING including the last turn, and the harness "goes senile" — it forgets what it was mid-task and loops. Fix in one line: never compact `recent`. Give them the rule — "summarize the past, but the present stays sharp." Draw a box around "the last few turns" labeled UNTOUCHABLE. Pre-empt it: write `messages[-6:]` in a different color when you type it.]]

[[note: production || Not a teaching toy — exactly what Claude Code does. Watch its context indicator on a long session: it hits a threshold, prints "compacting conversation," and carries on. pi assembles a bounded context each turn rather than accreting one; Cursor and Hermes do the same dance under other names. The sawtooth your students just drew is running in every serious coding agent right now. Tell them that while the counter is dipping — the timing makes it hit hard.]]

## Block 3 (8:00–8:40) — Build memory

Compaction keeps *this* session alive. But close the terminal and it's all gone — the agent starts tomorrow knowing nothing, and you re-explain from scratch. Memory fixes that. Forty minutes.

Plain idea: some facts are true across *every* session — the test command, the conventions, a decision from last week. Those don't belong in the conversation at all. They belong in a **file on disk** the harness reads at the start of every run and never has to be told again.

[[note: metaphor || Memory is the **note stuck to the fridge**. Compaction tidied today's cooking; the fridge note — "out of milk, the oven runs hot, Dad's allergic to nuts" — was written on a different day and is still there tomorrow morning. You don't re-learn it; you read it once at the start and cook accordingly. That file is your harness's fridge note. In the real world it has a name: `CLAUDE.md`.]]

Build it in two moves — reading, then writing.

**Read at startup.** Before the loop even begins, if a memory file exists, load it into the system context. Now the agent starts every run already knowing the project.

```python
def load_memory(path="CLAUDE.md"):
    if os.path.exists(path):
        return "Project memory:\n" + open(path).read()
    return ""

# at startup, fold it into the system prompt:
system_prompt = BASE_PROMPT + "\n\n" + load_memory()
```

**Write during the run.** Give the model a tool to *save* a durable fact. When it learns something worth keeping, it appends to the file — and next session, `load_memory` reads it back.

```python
def remember(fact: str):
    """Append a durable fact to project memory."""
    with open("CLAUDE.md", "a") as f:
        f.write(f"- {fact}\n")
    return "saved to memory"

# register `remember` as a tool the model can call, like any other.
```

[[note: demo || The two-run demo they'll remember. Run 1: ask "what testing framework does this project use?" It doesn't know — it greps around, reads files, figures it out over several turns, then calls `remember("uses pytest; run with pytest -q")`. End the run. Literally quit the program and restart. Run 2: ask the SAME question — it answers *instantly, on turn one*, because `load_memory` fed it the fact at startup. "Run one, it investigated. Run two — after we closed everything — it just knew." Memory, felt in the body.]]

[[note: aha || The sentence that clicks it: "Compaction is short-term memory — it lasts one session. This file is long-term memory — it lasts forever. Now your harness has both: the difference between a tool you re-explain every morning and a colleague who already knows your codebase." When you say "colleague," the room gets it.]]

[[fig: A warm hand-drawn illustration titled "The fridge note that survives the session", Excalidraw. Center: a fridge with a paper note magneted to it reading in handwriting "CLAUDE.md — uses pytest · API at api/v2 · don't touch legacy/". Left arrow labeled "START of every run → READ the note" in blue, curving from the fridge into a little robot figure labeled "harness" that lights up "oh, I already know this". Right arrow labeled "learned something durable → WRITE to the note" in green, curving from the robot back to the fridge as it pins a new line "- deploy script is in bin/ship". A red annotation: "the conversation ends — the note stays". Dashed takeaway box: "memory = a file the harness reads at startup and writes to when it learns." White background, charming, hand-lettered. || Memory as a fridge note: read at the start of every run, appended to when the agent learns something worth keeping.]]

[[note: confusion || The Block-3 trap: students dump EVERYTHING into memory — every file, every tool result — and reinvent the exact bloat compaction just fixed, except now it's permanent and reloads every session. Fix: "memory is for facts, not transcripts." Give them the test out loud: "Would I want this at the start of a totally different task next month? No? Then don't remember it."]]

[[note: production || `CLAUDE.md` is not a metaphor — it's a literal file Claude Code reads at the start of every session in your repo, which is why it already knows your build commands. pi keeps durable context the same way; Cursor has `.cursorrules`. Every serious harness grew some version of "a file on disk that seeds the agent's knowledge," because re-explaining your project every session is unbearable once you've felt the difference. Your students just built the mechanism the whole industry converged on.]]

## Block 4 (8:40–9:00) — Put it together and stress it

Twenty minutes to make the two pieces one thing and prove the harness is now *durable*. This is where the day pays off.

Draw the full loop with both pieces slotted in: at startup `load_memory` seeds the system prompt; every turn `should_compact` may fire; during the run `remember` may write to the fridge note. One diagram, both mechanisms, one loop.

[[fig: A hand-drawn technical diagram titled "The context engine, assembled", semantic-color Excalidraw with numbered circles tracing the flow. Top: a green "CLAUDE.md" file with a circle-1 blue arrow "load_memory() at startup" into a yellow "SYSTEM CONTEXT" tile. Center: the loop as a big blue rounded rectangle labeled "THE LOOP" containing circle-2 "call model", circle-3 "run tools", circle-4 "append result". A red decision diamond hanging off the loop: "over budget?" with a "yes" branch (circle-5) to an orange box "compact() → summarize old, keep recent" that feeds back into the loop. A purple tool box "remember(fact)" with circle-6 dashed arrow writing back UP to the green CLAUDE.md file. A dashed takeaway box: "memory seeds it in · compaction keeps it lean · remember writes it back — a loop that survives hours." White background, hand-lettered, orange emphasis on the compact and remember boxes. || The finished context engine: memory feeds the loop at startup, compaction keeps it under budget each turn, and remember writes durable facts back out.]]

[[note: demo || THE FINALE. Run one long, real task — "explore this repo and add a feature" — counter on. The room watches the sawtooth breathe (compaction firing), sees a `remember` call scroll past (memory writing), then watches the task *finish* — something the Day 2 harness literally couldn't do. For the kill: quit, restart, give a follow-up, and watch it start already knowing the repo. "Yesterday this died at turn twenty. Today it ran ten minutes, survived, and came back still knowing your code. That's a context engine."]]

[[note: say || Closing line: "You didn't make the model smarter today. You made the *harness* a good manager of the model's attention. Same model, same tools as yesterday — but now it can go the distance. That's the whole job of a harness: not to be clever, but to spend a scarce window wisely, turn after turn, for hours." Then tap both board words — COMPACTION, MEMORY — one last time.]]

[[sn: If you have a fast group, the natural stretch goal is a third lever they'll have read about: *write less in* — don't `cat` a whole file when a `grep` answers the question. It's the cheapest lever of all and it pairs beautifully with today's two. But don't rush it in; a clean compaction + memory build is a full, satisfying morning on its own.]]

Final checkpoint before you release them: *"Your harness has two kinds of memory now. Which one survives closing the program, and which one only lives inside a single session?"* (Memory / `CLAUDE.md` survives; compaction is within-session.) If they can answer that cleanly, they own the context engine.

## You can now teach

- **Break-it-first**: run the Day 2 harness with a token counter and let the class *watch* the window climb and crash — the emotional hook for the whole day.
- **Compaction** as a "previously on…" recap: trigger on a budget, split old from recent, summarize the old, and never touch the last few turns — with the sawtooth chart that proves it.
- **Memory** as a fridge note (`CLAUDE.md`): read at startup so the agent begins already knowing the project, and a `remember` tool to write durable facts back — shown with the quit-and-restart two-run demo.
- The **common bugs** and their one-line fixes: compacting the present turn (senility), and dumping transcripts into memory (permanent bloat).
- The **production line**: this exact sawtooth-and-fridge-note pattern is auto-compaction and `CLAUDE.md` in Claude Code, bounded context in pi, `.cursorrules` in Cursor — the pattern the whole field converged on.
- The **block-by-block pacing** of a 7:00–9:00 build: break it (20m), compaction (40m), memory (40m), assemble and stress-test (20m) — with the checkpoint questions that tell you the room is with you.
