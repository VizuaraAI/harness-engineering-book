In [the bare harness](your-first-bare-harness.html) we spun a loop around a model and watched it act on its own. There was one line in that loop I asked you to hold onto: `messages.append(...)`. We appended twice a lap — once for the model's reply, once for the tool results — and I called it "the agent remembering." That phrase was doing a lot of quiet work, and this chapter unpacks it fully. Because once you truly see that **the message array *is* the agent's state**, half the mysteries of building a harness dissolve. There is no hidden memory anywhere. There is just this list, and what you choose to put in it.

Let me build that idea from the ground up: what a message is, what a turn is, and how tool calls and their results thread back to each other by id.

## A conversation is a typed array

Open the hood on Claude Code, Cursor, pi, or Hermes and at the very center you will find the same humble object: a **list of messages**, in order, that grows as the session runs. Not a database, not a graph, not a magic context blob — a plain array you could print. Each message has a **role** and some **content**, and the roles are a small fixed vocabulary.

- `system` — the standing instructions and identity. Who the agent is, what tools exist, how to behave. Set once, sits above everything.[[sn: In the Anthropic API the system prompt is a separate top-level `system` field rather than a message with `role: "system"` — but conceptually it plays the exact role described here. Other providers put it inside the array as the first element. Same idea, slightly different plumbing; your [model client](the-model-client.html) papers over the difference.]]
- `user` — input coming *into* the model. The human's request, yes — but also, and this surprises people, the **results of tool calls**. Anything the model didn't itself generate arrives as a user-role message.
- `assistant` — everything the model *produced*: its prose, its reasoning, and its requests to call tools.

That's the whole grammar. A session is nothing but these three roles interleaved, in the order they happened.

[[fig: A hand-drawn diagram titled "A conversation is a typed array". Draw a vertical stack of cards, top to bottom, each a wobbly rounded rectangle with a colored left edge: (1) a card labeled "system" in red on a green-hatch edge, text "you are a coding agent · tools: read_file, run_bash"; (2) a "user" card (blue edge) "fix the failing test"; (3) an "assistant" card (orange edge) "let me read the test file → [tool_use: read_file]"; (4) a "user" card (blue edge, but drawn as a robot icon not a human) "[tool_result] def test_add(): ..."; (5) an "assistant" card "the bug is on line 4 → [tool_use: run_bash]"; (6) a "user"/robot card "[tool_result] 1 passed"; (7) an "assistant" card "fixed and tests pass ✓". A red handwritten bracket down the right spanning all cards: "this whole list = the agent's entire memory". A blue note pointing at cards 4 and 6: "tool results wear the user role even though no human typed them". A dashed takeaway box: "three roles, one growing list. There is no memory outside it." White background, hand-lettered Excalidraw style. || A session is just system / user / assistant messages in order. Tool results arrive as user-role messages even though no human typed them — the model only ever "sees" this array.]]

Stare at that figure for a second, because the non-obvious detail is cards 4 and 6. A tool result — the output of `read_file`, the stdout of `run_bash` — comes back into the model wearing the **user** role. From the model's point of view, "the world" and "the human" are the same channel: both are things *it did not generate* that it now must respond to. That symmetry is worth internalizing. The model author's job is to produce assistant messages; everything else on the tape is context flowing in.

## The array is the state — there is nowhere else

Here is the claim I want to hammer, because everything downstream leans on it. **The model is stateless.** Every call to `call_model(messages, tools)` starts from absolute zero. It has no recollection of the previous call, no variable it stashed, no scratchpad it kept. The *only* reason a session feels continuous — the reason the agent "remembers" that you asked it to fix a test five turns ago — is that we send the entire history back on every single call.

So the agent's memory is not a feature of the model. It is a feature of *us re-sending the array*. Appending to `messages` is, quite literally, the act of remembering. Deleting from it is forgetting. Rewriting it is lying to yourself. When we get to [compaction](compaction-and-summarization.html), all we are doing is deciding which parts of this array to keep when it grows too big to resend — and when we get to [durability](durable-execution-and-checkpointing.html), all we are doing is saving this array to disk so a crashed process can pick the tape back up.

[[fig: A before/after hand-drawn comparison titled "Where does memory live?". LEFT panel labeled in black "(A) the tempting mental model — WRONG": a model box with a thought-bubble brain labeled in red "remembers the conversation inside itself", a red X struck through it. RIGHT panel labeled "(B) how it actually works": a small model box labeled green "stateless · fresh every call", and beside it a big blue-hatch stack of cards labeled "the message array — lives in the HARNESS, not the model". A thick orange arrow loops from the array INTO the model each call, labeled "we resend the WHOLE list every turn"; a thin arrow out labeled "one new assistant message". A purple note at the bottom: "append() = remember · that's the whole trick". A dashed takeaway box: "the model forgets everything between calls. Continuity is the harness re-sending the array." White background, hand-lettered. || The model is stateless and forgets everything between calls. The illusion of memory is the harness re-sending the full message array on every turn. Memory lives in the harness, not the model.]]

This is liberating once it lands. There is no black box to reverse-engineer. If you want to know what the agent "knows" at turn 40, you print `messages` — that array, in full, is the complete truth of its mind at that instant. Debugging a harness is, more than anything, the practice of reading the tape.

## What is a "turn"?

The word **turn** gets thrown around loosely, so let me pin it down for our purposes. A turn is **one model call plus the tool round-trip it triggers**. Concretely, one turn is:

1. We send the current `messages` to the model.
2. The model produces one assistant message — possibly with text, possibly with one or more tool-call requests.
3. If it asked for tools, we run them and append their results.

That whole unit — call, act, append — is a turn. The [agent loop](the-agent-loop-from-first-principles.html) is just turns repeating until the model produces a turn with *no* tool request, which is its way of saying "I'm done." A simple question is one turn. "Fix the failing test" might be six.[[sn: Providers count and bill turns differently from how the harness thinks about them, and "turn" in a product UI ("you have 40 turns left") is usually a coarser billing unit than the loop-iteration sense we use here. When this book says "turn" we mean one lap of the loop: one `call_model` and its tool round-trip.]]

[[fig: A hand-drawn timeline titled "One turn = one call + its tool round-trip". Draw a horizontal band split into three consecutive stages left-to-right, each a rounded box with a numbered circle: (1) green "send messages → model" ; (2) orange "model emits ONE assistant message (text and/or tool_use)"; (3) blue "run tools → append tool_result(s)". A curved arrow loops from the end of stage 3 back to stage 1 labeled in orange "next turn". Below the band, a growing blue-hatch stack of cards gets one card taller under each stage, labeled in red "the array grows every turn — and we resend ALL of it". Off to the right, a separate box with a red border shows the exit: "assistant message with NO tool_use → loop ends ✓". A purple note under the resend arrow: "turn 40 re-pays for turns 1–39 → cost grows quadratically". A dashed takeaway box: "a turn is call → act → append. Turns repeat until a turn has no tool request." White background, hand-lettered Excalidraw, numbered circles. || A turn is one model call plus the tool round-trip it triggers: send, emit, run-and-append. Turns repeat until one produces no tool request. Because the whole array is resent each turn, cost grows quadratically with session length.]]

Notice something important about cost. Because we resend the whole array each turn, a long session gets *quadratically* expensive: turn 40 pays to re-read everything from turns 1 through 39. This is not a bug — it is the direct consequence of statelessness — but it is exactly why the [context engine](compaction-and-summarization.html) exists. Every token you leave on the tape, you pay for again next turn. The tape is your memory *and* your bill.

## Threading: how a tool call finds its result

Now the piece that trips up everyone building their first harness. When the model asks for a tool, it does not just say "run `read_file`." It emits a **structured content block** inside its assistant message — a `tool_use` block carrying three things: a `name`, an `input` object of arguments, and, crucially, an **`id`**.

That `id` is the thread. When we run the tool and hand the output back, we don't just append the raw text — we wrap it in a `tool_result` block that carries a matching **`tool_use_id`** pointing back at the exact call it answers. The model then reads the array and knows *which* result belongs to *which* request, even when it fired several at once.

```python
# Turn N: the model's assistant message contains a tool_use block
{
    "role": "assistant",
    "content": [
        {"type": "text", "text": "Let me check the test file."},
        {
            "type": "tool_use",
            "id": "toolu_01A9c",          # <-- the thread's handle
            "name": "read_file",
            "input": {"path": "test_math.py"},
        },
    ],
}

# Turn N (our reply): the tool_result must quote that same id back
{
    "role": "user",
    "content": [
        {
            "type": "tool_result",
            "tool_use_id": "toolu_01A9c",  # <-- must match, or the model is lost
            "content": "def test_add():\n    assert add(2, 2) == 5\n",
        },
    ],
}
```

Get this `id` matching wrong and you get subtle, maddening bugs: the model attributes the output of one tool to another, or the API rejects the request outright because a `tool_use` went unanswered. Two rules keep you safe, and real harnesses enforce both.

**First: every `tool_use` must be answered.** If a turn's assistant message contains three `tool_use` blocks, the very next user message must contain three `tool_result` blocks with the three matching ids — no more, no fewer. A dangling tool call (one requested but never answered) is one of the most common ways to corrupt a message array.[[sn: This is why an interrupt or a crash mid-tool is dangerous: if you've already appended the assistant's `tool_use` but die before appending the `tool_result`, your saved array is now malformed and the next call will error. Handling this cleanly is a core job of [durable execution](durable-execution-and-checkpointing.html) — you either checkpoint before the tool_use lands or you synthesize a "tool was interrupted" result.]]

**Second: the model can request several tools in one turn.** Modern models emit multiple `tool_use` blocks in a single assistant message when the calls are independent — read three files at once, say. Our loop already handles this: recall the `for block in reply.content` in the bare harness, which walked *every* block and produced a result for each. Parallel tool calls are just several threads opened in one turn and closed in one reply.

[[fig: A hand-drawn zoom-in titled "How a tool call threads to its result". Center-left: an "assistant" card containing two small nested blocks — a purple block "tool_use · id=toolu_01A9c · read_file(test_math.py)" and a purple block "tool_use · id=toolu_02F3 · run_bash(ls tests/)". Center-right: a "user" card containing two nested blocks — "tool_result · tool_use_id=toolu_01A9c · <file contents>" and "tool_result · tool_use_id=toolu_02F3 · <listing>". Two curved blue dashed arrows connect each id to its matching tool_use_id, labeled in red "must match exactly". An orange note above: "one turn can open several threads at once (parallel tools)". A red warning tag pointing at a greyed-out third tool_use with no partner: "unanswered tool_use → malformed array → API error". A dashed takeaway box: "the id is the thread. Every tool_use needs exactly one tool_result quoting its id back." White background, hand-lettered, numbered circles (1)(2). || Tool calls and results are stitched together by id: each tool_use carries an id, each tool_result quotes it back as tool_use_id. Every call must be answered exactly once, and a single turn may open several threads in parallel.]]

## Watching a real session on the tape

Let me put it all together with a concrete trace, because seeing the array grow is worth more than any amount of prose. Suppose the user says *"is the add function correct?"* Here is the tape, turn by turn, written compactly:

```text
[system]     you are a coding agent. tools: read_file, run_bash
[user]       is the add function correct?

--- turn 1 ---
[assistant]  "let me read it."  + tool_use(id=t1, read_file "math.py")
[user]       tool_result(t1) → "def add(a,b): return a - b"

--- turn 2 ---
[assistant]  "there's a bug — it subtracts. let me run the tests."
             + tool_use(id=t2, run_bash "pytest -q")
[user]       tool_result(t2) → "1 failed: test_add"

--- turn 3 ---
[assistant]  "confirmed: add uses '-' instead of '+', and the test fails.
              it is not correct."   (no tool_use → the loop ends)
```

Three turns, and every line above is an entry in one array. On turn 3 the model sees *all* of turns 1 and 2 — the file contents, the test output, its own earlier reasoning — because we resent the whole tape. Its final answer is grounded not in memory but in the visible history. Remove any line from the array and you change what the model knows. That is the entire game.

## What this buys you, and what it still misses

Once you hold "the array is the state" firmly, a surprising number of harness features reveal themselves as simple operations *on this list*:

- **Memory** ([CLAUDE.md](memory-and-claude-md.html)) is just prepending durable facts to the array before the session starts.
- **Compaction** ([summarization](compaction-and-summarization.html)) is replacing a long stretch of old messages with a short summary message.
- **Durability** ([checkpointing](durable-execution-and-checkpointing.html)) is serializing the array to disk after each turn so a crash can reload it.
- **Sub-agents** ([handoffs](sub-agents-and-handoffs.html)) are spawning a *fresh* array for a child, then folding its result back as one message in the parent's array.

They are all, at bottom, edits to this one tape. Which is exactly why we spent a whole chapter on it before touching any of them.

What the array does *not* solve, on its own, is its own growth. Nothing here stops the tape from ballooning past the context window, at which point the model physically cannot see the early turns and resending everything stops being an option. That pressure — a growing state versus a fixed window — is the central tension of [Layer 3, the context engine](compaction-and-summarization.html), and it is where we head next. But now you carry the right mental model into it: there is no hidden memory to manage, only this array — and context engineering is the art of deciding, every single turn, what earns a place on the tape.
