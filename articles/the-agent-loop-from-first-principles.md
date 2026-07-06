A model cannot do anything. I want to say that plainly before we write a single line, because the whole loop we are about to derive falls out of taking it seriously. You hand a model a list of messages; it hands you back one message. That is the entire transaction. It cannot open a file, run a command, wait, remember, or check its own work. It emits text and then it is done — the function has returned, and the machine is idle again. So how does *this* become an agent that reads your repo, edits three files, runs the tests, sees them fail, and fixes the bug? Not by making the model smarter. By wrapping it in a loop. This chapter derives that loop from nothing, and the surprising claim I want you to leave with is that **the while-loop is the agency** — not the model.

## What one call actually gives you

Let's be precise about the primitive we're building on. A chat-style model is a pure function of the form `reply = f(messages)`: you pass the conversation so far, you get exactly one more message back.[[sn: This "one call in, one message out" shape is shared across every provider — Anthropic, OpenAI, Google. The harness we build stays deliberately agnostic to which one you plug in; see [the model client](the-model-client.html).]] It is **transactional**: no state survives between calls except what *you* choose to pass in next time. And it is **inert**: the reply is just data — a string, or a structured request — sitting in your program's memory. Nothing happens because the model said something. Something happens because *your code* read what it said and acted.

[[fig: A hand-drawn diagram titled "One call is a dead end". Center: a wobbly rounded box labeled in black "MODEL f(messages)". A blue arrow enters from the left labeled "list of messages in". A blue arrow leaves to the right labeled "ONE message out". To the right of the output arrow, an orange handwritten note with an arrow pointing back at empty space: "…then it stops. the function returned." Below the box, three greyed icons — a folder, a terminal, a clock — each with a red X, labeled in red "the model touched none of these". A dashed takeaway box at the bottom: "a reply is just text sitting in memory — inert until YOUR code acts on it." White background, hand-lettered Excalidraw style. || One model call is a dead end: text in, one text out, then it stops. The reply is inert data until the harness decides to act on it.]]

Give the model the request *"fix the failing test"* and it cannot fix anything. The best it can do is *tell you what it would do*: "let me look at the test file." That sentence is the crack we pry the whole loop open through. The model can't look — but it can *ask*. And if the model can ask, then our code can answer.

## Teaching the model to ask: tool calls

We give the model a menu of actions it is allowed to request — a set of **tools**, each with a name and a schema for its arguments.[[sn: The schema is not a formality — it is how you teach the model what the tool does and how to call it. We treat it as its own subject in [tool schemas as contracts](tool-schemas-as-contracts.html).]] Now, instead of only emitting prose, the model can emit a **tool call**: a structured message that says, in effect, *"please run `read_file` with `path="test_auth.py"`."* Crucially the model still does not *run* anything. It emits a request and returns, same as always. The difference is that this reply is no longer only for a human to read — it is a machine-readable instruction our program can dispatch.

So every reply now comes in one of two flavors, and the model itself tells us which. Providers surface this as a **stop reason**: the reply carries a field — `stop_reason` — that is `tool_use` when the model wants an action performed, and something like `end_turn` when it has simply finished talking. That one field is the pivot the entire loop turns on.

[[fig: A two-panel hand-drawn comparison titled "The model now speaks two languages". LEFT panel labeled in black "(A) prose reply": a model box → a speech bubble "here is your answer.", with a purple tag underneath "stop_reason = end_turn" and a green note "→ nothing to run, we're done". RIGHT panel labeled "(B) tool call": the same model box → a structured card drawn with brackets, labeled "{ name: read_file, path: test_auth.py }", with a purple tag underneath "stop_reason = tool_use" and an orange note "→ the harness must run this, then reply". A red arrow between the panels labeled "same model, same call — the STOP REASON tells us which". A dashed takeaway box: "one field, stop_reason, decides whether the loop continues." White background, hand-lettered. || Every reply is either prose (end_turn) or a structured tool request (tool_use). The stop reason is the single bit the loop branches on.]]

## Deriving the loop, one honest step at a time

Now watch the loop assemble itself from necessity. We are not designing it; we are being *forced* into it by what the model can and cannot do.

The user asks for something. **Step one:** we call the model. It replies with a tool call — it wants to read the test file. **Step two:** we notice the reply is a `tool_use`, not an answer, so we can't return yet; there is work to do. **Step three:** *we* run the tool — our code opens the file — because the model can't. Now we hold a result the model has never seen. **Step four:** we hand that result back by appending it to the conversation and calling the model *again*. And here is the whole game: on this second call the model sees its own request *and* the file contents, and it decides the next move — maybe propose an edit, maybe ask to run the tests. **Step five:** we're back at step one. We repeat.

When does this stop? Only when the model replies with prose instead of a tool call — a `stop_reason` that isn't `tool_use`. That is the model announcing, in the only vocabulary it has, *"I have nothing more I need done; here is the answer."* We didn't decide the task was complete. The model did. Written out, that is a `while` loop with a single exit condition, and it is the beating heart of every coding agent.

```python
def run_agent(user_request):
    messages = [{"role": "user", "content": user_request}]
    while True:
        reply = call_model(messages, TOOLS)          # 1. ask the model
        messages.append(assistant_msg(reply))        #    remember what it said

        if reply.stop_reason != "tool_use":          # 2. prose, not a request?
            return text_of(reply)                     #    → the model is done

        results = []
        for block in reply.content:                  # 3. run every tool it asked for
            if block.type == "tool_use":
                out = run_tool(block.name, block.input)
                results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": str(out),
                })
        messages.append({"role": "user", "content": results})  # 4. feed results back
        # 5. loop — the model now sees the results and chooses again
```

That is genuinely the whole thing. Ten meaningful lines. Everything else in this book — tools, permissions, context management, durability, orchestration — is scaffolding bolted onto *this*.[[sn: We build the runnable version, with real `read_file` and `run_bash` tools, in [your first bare harness](your-first-bare-harness.html). Here the point is the shape, not the code.]]

[[fig: A hand-drawn flowchart titled "The loop, derived", drawn as a cycle of five numbered boxes with dashed arrows. (1) blue box "call_model(messages)". Arrow down to a purple diamond (2) "stop_reason == tool_use ?". A red "NO" branch peels off the cycle to a green box "return the answer ✓". A "YES" branch continues to (3) orange box "OUR code runs each tool". Arrow to (4) blue box "append tool_result to messages". Arrow (5) curving back up to box (1), labeled in blue "model now sees the result & decides again". Down the left margin, a yellow-hatch stack labeled "messages — grows every lap — THIS is the memory". A dashed takeaway box bottom-right: "the loop is not designed — it is forced by what the model can't do." White background, hand-lettered, numbered circles. || The loop derived from necessity: call, check the stop reason, run the tool, append the result, repeat — exiting only when the model stops asking.]]

## Two quiet subtleties that carry the whole idea

**The message array *is* the memory.** Notice we append the model's reply *and* every tool result to `messages`, and pass the whole growing list on the next call. The model is still stateless — it remembers nothing between calls. Continuity is an illusion the harness maintains by re-sending the entire transcript each turn. That is a beautiful and slightly terrifying fact: the agent's entire "mind" is a Python list you own and can edit.[[sn: And because you own it, you can *shape* it — trim it, summarize it, inject memory into it. That editing power is the whole discipline of context engineering, starting with [compaction](compaction-and-summarization.html). The context window is finite, so this list cannot grow forever.]] It is also why a crash mid-loop loses everything unless you've been checkpointing that list.

**The environment closes the loop.** Step four is doing something subtler than "passing data." Each tool result is a fact from the real world — the actual file contents, the actual test output, the actual error. The model's next decision is grounded in ground truth it could not have known one call earlier. This is what separates an agent from a model monologuing a plan: it *observes the consequence of its last action before choosing the next*. Read a file, discover the bug isn't where you guessed, change course. The loop is a perception–action cycle, not a script being read aloud.

## Inversion of control: who decides "done"

Now the claim I promised at the top. Compare two ways to make a model do multi-step work.

The **naive** way is a pipeline *you* author: call the model to get a plan, then your code runs step 1, then step 2, then step 3, then a final call to summarize. You wrote the control flow. You decided there would be three steps. The model fills in blanks inside a skeleton you built — that is a **workflow**, and it works fine when you can predict the shape of the task in advance.

The **agent** way inverts exactly that. You do not know how many laps the loop will take. Maybe the fix is one file and it finishes in two turns; maybe it uncovers a cascade and takes fifteen. You never wrote "step 1, step 2, step 3." You wrote a `while True` and handed the steering wheel to the model — *it* decides each turn whether to act again or to stop. Control flow moved from your code into the model's choices. That is **inversion of control**, and it is the precise technical reason an agent can handle open-ended tasks where you genuinely cannot predict the number of steps.

[[fig: A hand-drawn before/after comparison titled "Who holds the steering wheel?". LEFT panel labeled in black "(A) WORKFLOW — you author the steps": a fixed straight pipeline of boxes "plan → step 1 → step 2 → step 3 → done", with a blue human-hand doodle gripping the arrows and a green note "YOU decided there are 3 steps". Below in red: "breaks when the task is unpredictable". RIGHT panel labeled "(B) AGENT — the model decides": a single orange loop with a car-steering-wheel doodle inside it, laps unlabeled, a purple tag "while stop_reason == tool_use", and a blue note "the MODEL chooses: act again, or stop". A red arrow between panels labeled "INVERSION OF CONTROL — the exit condition moved into the model". A dashed takeaway box: "an agent decides for itself when it's finished. that is the whole difference." White background, hand-lettered. || The difference between a workflow and an agent is who owns the exit condition. In a workflow you author the steps; in an agent the model decides each turn whether to continue, and control is inverted.]]

This is why, throughout the book, I keep insisting the loop — not the model — is Layer 1 of the harness. The model is a borrowed component that answers one question at a time. The *loop* is the thing that turns a sequence of stateless answers into purposeful, self-directing behavior. Delete the model and swap in a different one; you still have an agent. Delete the loop and you have a chatbot.

## The dangers you can already smell

A `while True` handing control to a model should make you slightly nervous, and it should. Three problems are visible from here, and each becomes a later chapter.

The loop trusts the model's stop signal completely — but a model can get stuck, politely re-reading the same file forever, and `stop_reason` will never flip. Real harnesses never rely on the model's signal alone; they add a **max-turns guard** and an interrupt path, which we handle in [stop conditions](stop-conditions.html). Step three runs whatever the model asked for, including `run_bash` with a command that could be `rm -rf` in disguise — so a real harness inserts a **permission gate** and a **sandbox** before execution, the entire subject of [permission gates and approval modes](permission-gates-and-approval-modes.html). And that ever-growing `messages` list will eventually overflow the context window, which is why [compaction](compaction-and-summarization.html) exists. We are leaving all three out *on purpose right now* so the loop stands naked and you can see that agency itself is this small.

## What we've established

We derived the agent loop without inventing anything. A model can only emit one message, so to make it act we call it, check whether it asked for a tool, run the tool ourselves, feed the result back, and repeat until it stops asking. The message array carries the memory; the environment grounds each decision; and the exit condition lives inside the model, not our code — that inversion is what makes it an agent rather than a script. Everything from here is making this loop *survivable*: giving it hands it can't hurt anyone with, a memory that fits, and a body that recovers when it falls. Next we build the runnable version and watch it act on a real machine — [your first bare harness](your-first-bare-harness.html).
