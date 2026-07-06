Here is a failure mode you will hit the very first time you use your harness for real work. You ask it to do something big — refactor a module, chase a bug across ten files, wire up a feature — and it goes beautifully for a while. Twenty tool calls in, forty, sixty. Then, quietly, it gets *dumber*. It re-reads a file it read half an hour ago. It forgets the constraint you gave it in the first message. It re-introduces a bug it already fixed. Nothing crashed, no error was raised — the agent just lost the plot.

What happened is not mysterious once you know where to look. Every lap of [the loop](the-agent-loop-from-first-principles.html) appends to the message array: the model's reply, the tool call, the tool result, over and over. That array is the agent's entire memory, and it grows without bound. Meanwhile [the context window is a fixed budget](the-context-window-as-a-resource.html) — a few hundred thousand tokens, and not one more. A long session is a slow-motion collision between an ever-growing history and a wall that does not move. This chapter is about surviving that collision. The technique has a name: **compaction**.

## The naive answer, and why it's wrong

The obvious fix is to just drop old messages. Conversation too long? Delete the oldest turns until it fits. This is called a **sliding window**, and it is exactly what a naive chatbot does.

It is a disaster for a coding agent, and it's worth being precise about why. The oldest messages are not the least important — they are often the *most* important. Turn one is where the user told you what they actually want. Turn three is where you discovered the database is Postgres, not MySQL. Turn eight is where the user said "and whatever you do, don't touch the auth module." Slide the window forward and those facts fall off the back of the truck, silently, while the agent keeps confidently driving. The information the agent most needs to stay coherent is precisely the information a window throws away first.

[[fig: A hand-drawn before/after comparison titled "Two ways to shrink a long conversation". LEFT panel labeled in black "(A) sliding window — naive": a long vertical stack of message cards numbered 1..40, with a red bracket around cards 1-25 labeled "DELETED to make room" and cards 26-40 kept. Red warning notes point at the deleted cards: "turn 1: what the user actually wanted", "turn 3: it's Postgres not MySQL", "turn 8: DON'T touch auth". A red frowny face and note "the agent forgets the mission". RIGHT panel labeled "(B) compaction — the harness way": the same cards 1-30, but a blue arrow feeds them into a small model box labeled "summarize", producing one yellow-hatch card labeled "RUNNING SUMMARY (key facts, decisions, constraints)". That summary card plus the recent cards 31-40 form the new, short history. A green note: "old detail → compressed, but the facts survive". A dashed takeaway box: "don't delete the past — distill it." White background, hand-lettered Excalidraw style. || Sliding a window drops the oldest turns — which are usually the most load-bearing. Compaction distills them into a running summary instead, so the facts survive even when the transcript doesn't.]]

So we do not delete the past. We **distill** it. We take a big slab of old turns and ask the model itself to write them down as a compact summary — the decisions made, the facts discovered, the constraints given, the state of the work — and we splice that summary back in where the raw turns used to be. The transcript gets short again; the knowledge does not leave. This is the whole idea, and everything below is detail.

## When to compact: the threshold

Compaction is not free — you spend a model call to produce the summary, and you lose fidelity — so you don't do it every turn. You do it when you're about to run out of room. The trigger is a **threshold** on how full the context is.

The measure that matters is not turn count but **token count**, because turns vary wildly in size (a one-line question versus a 3,000-line file dump). So the harness tracks the running token total of the message array and fires compaction when it crosses some fraction of the window — a common choice is around 70–80% full, leaving comfortable headroom for the summary call and the next few turns.[[sn: Claude Code exposes exactly this as an **auto-compact** behavior that kicks in as you approach the context limit, plus a manual `/compact` command you can run whenever you feel the session getting heavy. The threshold is a knob, not a law — tune it to your model's window and your typical turn size.]]

```python
def tokens_of(messages):
    # cheap-and-safe estimate; use the provider's real tokenizer in production
    return sum(len(str(m["content"])) for m in messages) // 4

CONTEXT_LIMIT = 200_000
COMPACT_AT    = 0.75          # fire when 75% full

def should_compact(messages):
    return tokens_of(messages) > CONTEXT_LIMIT * COMPACT_AT
```

Two honest caveats live in that snippet. First, the `// 4` character-per-token estimate is a rough stand-in; a real harness asks the provider's tokenizer, or reads the token usage the API already returns on every response, so it never guesses.[[sn: Every message you get back reports its own token usage. The cheapest, most accurate meter is to just accumulate those numbers as you go — the harness already has the ground truth without doing any counting itself.]] Second, the threshold is deliberately below 100% — you must leave room to *do* the compaction and to hold the next turn, or you'll be summarizing right as the wall hits you.

## What to preserve verbatim vs. what to summarize

Here is the judgment call at the heart of compaction, and it is genuinely a design decision, not a mechanical one. Not all history deserves the same treatment. We split the conversation into three zones.

**The pinned head — always kept verbatim.** The system prompt and the original user request never get summarized. They are the mission. If those blur, the agent is lost no matter how good the rest is. So they sit at the front of the array, untouched, forever.

**The recent tail — kept verbatim.** The last handful of turns are where the agent is *right now* — the file it just opened, the error it just saw, the half-finished edit. Summarize those and you lop off the agent's working memory mid-thought. So we always keep the most recent N turns raw, exactly as they happened.

**The middle — summarized.** Everything between the pinned head and the recent tail is the candidate for compression. This is the bulk of a long session: the exploration, the files read and understood, the dead ends, the decisions. We hand this middle slab to the model and ask for a structured summary.

[[fig: A hand-drawn zoom-in titled "Three zones of the message array". A tall vertical rounded container (yellow fill) labeled "messages[]", divided top-to-bottom into three regions with handwritten braces. TOP region (small, purple outline) labeled "PINNED HEAD — system prompt + original request" with a green note "kept verbatim, forever". MIDDLE region (large, blue hatch) labeled "THE MIDDLE — dozens of old turns" with an orange note "→ summarize this slab". BOTTOM region (small, purple outline) labeled "RECENT TAIL — last ~6 turns" with a green note "kept verbatim (working memory)". A blue curved arrow lifts the middle out to a small model box "compact()" that returns one card "running summary", which then slots back between head and tail. Numbered circles 1-2-3 on the three zones. A dashed takeaway box: "pin the mission, keep the present raw, compress the middle." White background, hand-lettered. || The array splits into three zones: a pinned head (the mission) and a recent tail (working memory) are kept verbatim; only the large middle slab is summarized away.]]

The summary itself should be *structured*, not a vague paragraph. A good compaction prompt asks the model to write down specific categories: the user's goal, key facts learned about the codebase, decisions and their rationale, files touched and how, what's done, and what's still pending. Structure is what keeps the summary from drifting into mush and what makes it useful when it's hydrated back in.

```python
COMPACT_PROMPT = """You are compacting a long agent session to save context.
Summarize the conversation below into a dense, factual briefing. Preserve:
  - the user's original goal and any hard constraints
  - key facts discovered (versions, file paths, schemas, gotchas)
  - decisions made and WHY
  - files created/edited and what changed
  - what is DONE and what is still PENDING
Be specific. Keep identifiers, paths, and numbers exact. Omit chit-chat.
Write it as notes-to-self the agent can act on cold."""

def compact(messages, keep_recent=6):
    head   = messages[:2]                 # system + original request (pinned)
    middle = messages[2:-keep_recent]     # the slab we compress
    tail   = messages[-keep_recent:]      # recent turns (verbatim)

    summary = call_model(
        messages=[{"role": "user",
                   "content": COMPACT_PROMPT + "\n\n" + render(middle)}],
        tools=[],
    )
    summary_msg = {
        "role": "user",
        "content": f"[SUMMARY OF EARLIER WORK]\n{text_of(summary)}",
    }
    return head + [summary_msg] + tail    # the new, short history
```

## Hydrating it back: the agent never notices the seam

The word **hydrate** is the important half of the technique and the half tutorials forget. Compressing the history is useless if you don't splice the summary back into the live conversation so the next model call actually *sees* it. That's what the final line does — it returns a new, short message array with the summary sitting in the middle, and the loop keeps running against that array as if nothing happened.

From the model's point of view the seam is invisible. Its next turn sees: the system prompt, the original request, one `[SUMMARY OF EARLIER WORK]` block that reads like careful notes, and the last few raw turns. It has everything it needs to continue — the mission, the accumulated knowledge, and the immediate present — in a fraction of the tokens. The two-hundredth turn feels, to the model, like the tenth.

Wiring it into the loop is a two-line change: check the threshold at the top of each lap, and compact if we've crossed it.

```python
def run_agent(user_request):
    messages = [SYSTEM_MSG, {"role": "user", "content": user_request}]
    while True:
        if should_compact(messages):
            messages = compact(messages)     # distill + hydrate, in place
        reply = call_model(messages, TOOLS)
        messages.append({"role": "assistant", "content": reply.content})
        if reply.stop_reason != "tool_use":
            return text_of(reply)
        messages.append(run_tools(reply))    # append tool results, then loop
```

[[fig: A hand-drawn timeline titled "A 200-turn session survives compaction". A long horizontal axis marked in turns: 0 ... 80 ... 160 ... 200. A blue rising line labeled "tokens in context" climbs steadily. Three orange vertical markers (numbered 1,2,3) sit where the line nears a red dashed horizontal ceiling labeled "CONTEXT LIMIT (200k)". At each marker the blue line drops sharply — a green note at the first drop reads "compact fires at 75% → history distilled, tokens fall". Below the axis, a thin yellow band labeled "running summary" grows in richness at each marker (it absorbs the compressed turns). A small callout: "recent tail always kept raw." A dashed takeaway box: "the ceiling never moves — so the harness keeps carving the history back down under it, forever." White background, hand-lettered Excalidraw, numbered circles at the drops. || Across a long session the token count climbs toward the ceiling; each time it nears the threshold, compaction fires and carves it back down — letting a 200-turn session run under a fixed window indefinitely.]]

## The real risk: summarizing away something crucial

I want to be honest about the sharp edge here, because it is easy to be seduced by how clean compaction looks and miss its one genuine danger. **A summary is lossy by definition, and you cannot know in advance which lost detail will turn out to matter.**

Picture it. Forty turns ago the agent noticed, in passing, that one function has a subtle off-by-one that the tests don't cover. It wasn't relevant then, so the summary — reasonably, sensibly — left it out. Sixty turns later the agent needs exactly that fact and it is gone, distilled into nothing. The agent doesn't know it's missing information; it just proceeds on an incomplete picture, and the bug ships. Compaction did not fail loudly. It failed silently, which is worse.

[[fig: A hand-drawn diagram titled "The one fact the summary dropped". LEFT: a tall blue-hatch card labeled "THE MIDDLE (40 old turns)" containing many small handwritten lines; ONE line is circled in orange with a red note "turn 12: off-by-one in paginate(), tests DON'T cover it". A blue arrow labeled "summarize" points from this card to a smaller yellow-hatch card on the right labeled "RUNNING SUMMARY" — its bullet list (green ticks) keeps "goal", "Postgres 15", "files edited", but the off-by-one line is shown crossed out in faint grey with a red note "dropped — 'not relevant' at the time". Below, a dashed timeline arrow jumps forward to a small model box "turn 100: needs it" with a red frowny face and note "fact is gone → ships the bug, silently". A separate blue callout lists three mitigations as handwritten bullets: "1 keep recent tail generous", "2 over-preserve exact IDs/paths/numbers", "3 keep a POINTER: 're-read db.py'". A dashed takeaway box (purple): "lossy is lossy — so promote load-bearing facts into durable memory." White background, hand-lettered Excalidraw style, numbered circles. || Compaction's one real danger: a detail that looks irrelevant at summary-time is dropped, then silently needed later. The blunting tactics — a generous tail, exact identifiers, pointers back to the source, and promoting facts into durable memory — turn an unrecoverable loss into a recoverable one.]]

There is no way to eliminate this — lossy compression is lossy — but there are real ways to blunt it, and good harnesses use all of them.[[sn: This is the deepest reason a harness pairs compaction with a durable [memory layer and a `CLAUDE.md`](memory-and-claude-md.html). Compaction manages the *ephemeral* session; memory is for facts too important to ever risk summarizing away, written to a file that outlives any single run. When in doubt, promote a fact from the summary into memory.]] Keep the recent-tail window generous, so nothing fresh is ever compressed prematurely. Prompt the summary to over-preserve exact identifiers, paths, and numbers rather than prose. Retain pointers rather than content — a summary can say "detailed error in the earlier read of `db.py`" so the agent knows to re-read the file if it needs the specifics, turning a lost fact into a recoverable one. And critically, push the truly load-bearing facts *out of the session entirely* into durable memory, where compaction can't touch them.

## What you built, and what it still misses

You now have the third layer of the context engine: a harness that watches its own token budget, and when it approaches the wall, distills the middle of its history into a structured summary while keeping the mission and the present verbatim — then hydrates that summary back so the loop runs on unbothered. With this, your agent survives sessions that would have blown the context window ten times over. A two-hundred-turn refactor stays coherent from the first turn to the last.

What compaction still can't do is *remember across sessions*. Close the process and the summary dies with it; tomorrow the agent starts blank, re-learning your project from scratch. Compaction is memory *within* a run; it is not memory *between* runs. That gap — giving the agent a persistent brain that's already loaded before turn one — is the next thing we build: [memory and `CLAUDE.md`](memory-and-claude-md.html).
