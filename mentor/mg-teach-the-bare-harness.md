By the end of this chapter you can stand at the front of the room and *build a real coding agent live*, from an empty file, in under two hours — a model client, a message array, and a loop — and have the whole cohort watching a program plan, act on a real machine, and decide again on its own. This is the morning where the workshop stops being slides and becomes an agent. You must own the build so completely that you can type it while talking, recover from a typo without panic, and know exactly which line makes the room gasp.

This chapter is a *lecture plan*, not a concept explainer. The concepts (the loop, the client, the message array) were taught the day before. Today you *perform the build*. So most of what follows is choreography: what to type, when to pause, what to let them try, and the one demo that lands the whole idea.

## The one promise you make at 7:00 AM

Open by making a promise, out loud, and writing it on the board: *"In the next two hours, from an empty file, we will build a program that reads your code, runs commands on your machine, and finishes a job you give it — with no human in the loop. About forty lines. No framework."* Then say the honest part: *"Everything after today is making this forty-line thing safe, durable, and scalable. But the beating heart is what we build this morning."*

[[note: say || "By nine o'clock this file will be an agent. Not a chatbot — an agent. The difference is one word: it *acts*. It doesn't just answer you, it reaches out and touches the machine, sees what happened, and decides what to do next. Watch me build the smallest possible version of that, and then you'll build your own before we break."]]

[[fig: A warm hand-drawn illustration titled "The empty file becomes an agent". On the left, a blank sheet of paper labeled "agent.py — 0 lines" with a little dotted outline. A big friendly orange arrow labeled "2 hours" sweeps to the right, where the same sheet is now full of handwritten code and has sprouted little cartoon hands: one hand holding a magnifying glass over a file (labeled "reads code"), one hand at a terminal (labeled "runs commands"), and a little thought-bubble with a checkmark (labeled "decides when it's done"). A dashed takeaway box at the bottom: "an agent is a program that ACTS, not just answers." Excalidraw style, white background, charming, handwritten labels. || The morning's promise, drawn: an empty file grows hands and becomes something that acts on the world.]]

## The shape of the two hours

Here is your timing spine for the 7:00–9:00 AM session. Keep it on a sticky note beside your keyboard. The rule of the morning is: **you type, they watch, then they type.** Never explain a piece for more than a few minutes before it becomes running code.

[[fig: A hand-drawn "lecture timeline" figure titled "7:00–9:00 build plan", drawn as a horizontal ribbon divided into six labeled segments with times under each. Segment 1 (yellow) "7:00 the promise + empty file, 10 min". Segment 2 (green) "7:10 the model client, 20 min". Segment 3 (purple) "7:30 two tiny tools, 20 min". Segment 4 (blue, drawn slightly bigger with a star) "7:50 THE LOOP, 30 min". Segment 5 (orange) "8:20 the demo that lands it, 20 min". Segment 6 (red) "8:40 they build + what's missing, 20 min". Each segment has a tiny icon (a blank page, a phone/antenna, a wrench, a circular arrow, a spotlight, a hammer). A dashed takeaway box: "you type → they watch → they type. Never lecture more than 5 min without running code." Excalidraw style, white background, hand-lettered. || The two-hour ribbon: six blocks, with the loop as the starred centerpiece.]]

- **7:00–7:10 — The promise + the empty file.** Set the stakes. Draw the three-piece diagram. Open one editor, one terminal, side by side, both projected big.
- **7:10–7:30 — The model client.** One function. Prove it talks.
- **7:30–7:50 — Two tiny tools.** A schema half and a function half.
- **7:50–8:20 — The loop.** The heart. Slowest, most careful block.
- **8:20–8:40 — The demo that lands it.** A multi-lap task, live, with `print`s showing every step.
- **8:40–9:00 — They build + the honest gaps.** Cohort types their own; you show what it's dangerously missing.

## Block 1 (7:00–7:10) — Draw the three pieces before you type a thing

Before a single line of code, draw the map. If they hold this triangle in their heads, every line you type lands in a slot they already have.

A bare harness is exactly three things. A **model client** — one function that sends the conversation and gets back the model's next message. A **message array** — the running list of everything said so far, which literally *is* the agent's memory. And a **loop** that ties them together with a set of **tools** the model is allowed to call.

[[note: metaphor || The agent is a **short-order cook taking orders on a notepad**. The message array is the notepad — every line ever said, in order, top to bottom. The model client is the cook's brain deciding the next move. The tools are the cook's hands: knife, stove, fridge. The loop is the cook's rhythm: read the notepad, do one thing, write down what happened, read the notepad again. The cook never forgets, because everything is on the notepad. And the cook stops only when the notepad says the dish is done.]]

[[fig: A hand-drawn diagram titled "The three pieces of a bare harness". Three labeled boxes arranged in a triangle. Top: a green box "MODEL CLIENT — send(messages) → next message". Bottom-left: a blue-hatched box drawn as a stack of index cards "MESSAGE ARRAY — [system, user, assistant, tool, …]" with a red handwritten note "this list IS the memory". Bottom-right: a purple box "TOOLS — name + schema + function". In the center, an orange circular arrow labeled "THE LOOP" touching all three, with a tiny handwritten sequence beside it "1 send  2 tool? 3 run  4 append  5 repeat". A dashed takeaway box: "client + message array + tools, spun in a loop = an agent." White background, hand-lettered Excalidraw. || Draw this first, before any code: the three pieces and the loop that spins them.]]

[[note: teach || Draw the triangle slowly and leave it up on a side board for the whole session. Every time you finish a code block, walk back to the triangle and physically tap the piece you just built: "that was the client — one down." The cohort should watch three boxes fill in over two hours. This spatial anchor is what keeps a live build from feeling like a wall of code.]]

## Block 2 (7:10–7:30) — The model client: prove it talks

Now the first code. Keep it brutally small. The whole "AI" of the agent is one function; everything else you write today is the harness *around* it.

```python
import anthropic
client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY from the environment

def call_model(messages, tools):
    return client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        system="You are a coding agent. Use tools to finish the job.",
        messages=messages,
        tools=tools,
    )
```

Type it live. Then — before anything else — *prove it talks*. This is the first dopamine hit of the morning and you must not skip it.

[[note: demo || Right after typing the client, run it with one throwaway line at the bottom: `print(call_model([{"role":"user","content":"say hi in three words"}], []))`. Run it in the terminal. When the reply object prints, point at the `.content` and say: "there — the model answered. That's the entire brain. Now we build the body around it." Then delete the throwaway line. The cohort has seen the API respond in ninety seconds; the mystery is gone.]]

[[note: aha || The line that reframes everything: "Notice `messages` and `tools` are *inputs we control*. The model only ever sees what our harness decides to hand it. That means the harness — not the model — is in charge of what the agent knows. Hold that thought; it's the seed of everything we build in the next four days." Say this while pointing at the two arguments.]]

## Block 3 (7:30–7:50) — Two tiny tools: a contract and a function

A tool has two halves, and you teach them as two halves, side by side. The half the *model* sees is a **contract**: a name, a description, and a JSON schema of the arguments — that's how the model knows the tool exists and how to call it. The half *we* run is an ordinary **function**.

[[note: metaphor || A tool is like a **vending machine button**. The label on the button (name + description + the slot it expects a coin in) is the contract — that's all the customer, the model, can see. Behind the panel is the machinery that actually drops the snack — that's our function. The model reads the label and presses; we make the snack come out. If the label lies about what the button does, the model presses the wrong one.]]

```python
import subprocess, pathlib

TOOLS = [
    {"name": "read_file",
     "description": "Read a text file and return its contents.",
     "input_schema": {"type": "object",
        "properties": {"path": {"type": "string"}}, "required": ["path"]}},
    {"name": "run_bash",
     "description": "Run a shell command, return stdout+stderr.",
     "input_schema": {"type": "object",
        "properties": {"cmd": {"type": "string"}}, "required": ["cmd"]}},
]

def run_tool(name, args):
    if name == "read_file":
        return pathlib.Path(args["path"]).read_text()
    if name == "run_bash":
        r = subprocess.run(args["cmd"], shell=True, capture_output=True, text=True)
        return (r.stdout + r.stderr)[:4000]
    return f"unknown tool: {name}"
```

[[fig: A hand-drawn "two halves of a tool" figure. A tall vending machine drawn down the middle with a dashed vertical line splitting it. Left side, labeled in green "the CONTRACT (what the model sees)": a big button labeled "run_bash", a small plate reading "description: run a shell command", and a coin slot labeled "input_schema: {cmd: string}". Right side, labeled in purple "the FUNCTION (what we run)": gears and a chute with a snack dropping, labeled "subprocess.run(cmd)". A red arrow from the button to the gears labeled "model presses → we execute". Below, a red warning tag: "no permission gate, no sandbox — on purpose (Layer 2 fixes it)". Dashed takeaway box: "a tool = a contract the model reads + a function we run." Excalidraw style, white background, hand-lettered. || A tool has two halves: the vending-machine label the model reads, and the machinery behind the panel that we run.]]

[[note: confusion || Someone will ask "where does the model learn what these tools *do*?" The answer, said clearly: "from the `description` and the schema — nothing else. The model never sees your Python function. It only reads the label. That's why a vague description is a broken tool." Plant this now; tomorrow's whole chapter is tool schemas as contracts.]]

Say plainly what you are *leaving out*: there is **no permission gate** before `run_bash` and **no sandbox**. You are omitting them on purpose so the loop is naked and obvious — and so that when the agent runs a command they didn't expect, they *feel* why Layer 2 exists.

## Block 4 (7:50–8:20) — The loop: the heart, taught line by line

This is the block that matters. Slow down. It is fifteen lines and it is the whole of agency. Type it one line at a time, narrating each.

```python
def run_agent(user_request):
    messages = [{"role": "user", "content": user_request}]
    while True:
        reply = call_model(messages, TOOLS)                    # 1. ask the model
        messages.append({"role": "assistant", "content": reply.content})

        if reply.stop_reason != "tool_use":                    # 2. no tool? done
            return text_of(reply)

        tool_results = []
        for block in reply.content:                            # 3. run each tool asked for
            if block.type == "tool_use":
                out = run_tool(block.name, block.input)
                tool_results.append({"type": "tool_result",
                    "tool_use_id": block.id, "content": str(out)})
        messages.append({"role": "user", "content": tool_results})  # 4. feed results back
        # 5. loop: the model now sees the results and decides the next move
```

Trace one lap out loud, walking your finger down the code. Put the request on the notepad, call the model. The model replies — maybe text, maybe a request to use a tool. **Append the reply to the array** (the agent remembering what it just decided). If it asked for no tool, it's done. If it did, run each tool, wrap the outputs as `tool_result` messages, **append them to the array**, and loop. Next lap, the model sees its own request *and* the results, and picks the next move.

[[fig: A hand-drawn flowchart titled "One lap of the loop", drawn as a cycle of five numbered circles with arrows. (1) blue "call_model(messages)". Arrow to a purple diamond (2) "stop_reason == tool_use?". A red "NO" branch leaves the cycle to a green box "return the answer ✓". A "YES" branch continues to (3) orange "run each tool it asked for". Arrow to (4) blue "append tool results to messages". Arrow (5) curving back to circle (1), labeled "the model now sees the results". Beside the cycle, a small blue-hatched stack of cards labeled "messages grows every lap → this is the memory". A dashed takeaway box: "the loop ends ONLY when the model stops asking for tools." White background, hand-lettered, numbered circles. || One lap: call, check for a tool request, run it, append, repeat. It ends only when the model stops asking for tools.]]

Now spend your last few minutes here on the single most important line: `if reply.stop_reason != "tool_use": return`.

[[note: aha || Stare at the stop condition with them. "The loop keeps going *as long as the model keeps asking for tools*, and stops the instant it gives a plain answer instead. Read that again: the *agent* decides when it's finished. Not us. We wrote a `while True` with no counter — and yet it stops, because the model chooses to stop." Then the punchline: "That inversion — the program handing the *when-are-we-done* decision to the model — is exactly what makes this an agent and not a script. That is Layer 1. That is the whole workshop's foundation."]]

[[sn: A real harness never ships a naked `while True`. It adds a max-turns guard and an interrupt path, because a confused model can loop forever politely re-reading the same file. We leave those out this morning so the mechanism is bare; they get their own treatment under stop conditions.]]

## Block 5 (8:20–8:40) — The demo that lands it

Everything so far has been construction. This block is the payoff, and it is the moment they'll remember. Before you run it, add `print`s so every lap is visible — this turns an invisible API loop into a play they can watch.

[[note: demo || Add one line inside the loop after the model replies: `print("LAP:", [b.type for b in reply.content])`. Then run the agent with a task that *needs three laps*: `run_agent("Read pyproject.toml, tell me the Python version, then list the test files.")`. The room watches it print `['tool_use']` (it reads the file), then `['tool_use']` again (it runs `ls`), then `['text']` (it answers) — three laps, no human between them. Say nothing while it runs. Let them watch the machine think.]]

[[fig: A warm hand-drawn "three laps" illustration titled "Watch it think". A short-order cook at a counter with a notepad, drawn three times left-to-right like a comic strip. Panel 1: cook reads notepad, reaches for a file folder labeled "read_file pyproject.toml", speech bubble "need the version". Panel 2: cook types at a little terminal labeled "run_bash: ls tests/", speech bubble "now the test files". Panel 3: cook sets down a finished plate labeled "Python 3.11, 4 test files", speech bubble "done ✓". Under each panel a small blue tag "LAP 1", "LAP 2", "LAP 3". A dashed takeaway box: "three laps, zero humans in between — that's an agent." Excalidraw style, white background, charming, hand-lettered. || The demo as a comic: three laps of the cook, each one a tool call, ending in a plain answer.]]

[[note: confusion || The most common confusion after the demo: "did the model run the command?" No. The *model* only ever *asks* — it emits a `tool_use` block. *Our harness* runs the command and hands back the result. Draw the line clearly: the model is a brain in a jar; it can only speak. Every real action in the world is our code responding to what it said. This distinction is load-bearing for the safety chapter tomorrow.]]

## Block 6 (8:40–9:00) — Let them build, then show the gaps

Now they type. Give them the exact task and get out of the way.

[[note: teach || Have the cohort start from an empty file and rebuild the client, one tool, and the loop from memory — screens off, or from the triangle diagram only, not by copying your code. Ten minutes, pairs allowed. Walk the room. The two errors you'll see most: forgetting to append the assistant reply before running tools (the model loses track of its own request), and forgetting to wrap tool outputs as `tool_result` with the matching `tool_use_id` (the API rejects it). Both are teachable-moment gold — let them hit the error, then fix it together on the projector.]]

Close by being honest about what this forty-line agent is *missing* — this is the trailhead for the rest of the week.

[[note: production || Say it straight: "This is not a toy. This is the identical skeleton inside Claude Code and pi — a client, a message array, a tool loop. The difference between what's on your screen and what ships to millions is not the heart. It's the *survival gear* around the heart." Then name the gaps, each mapping to a day ahead: it will run a dangerous command with no permission (Layer 2), it chokes when the conversation outgrows the context window (Layer 3), it loses all its work if the process dies (Layer 4), and it can't split a job too big for one context (Layer 5).]]

[[fig: A hand-drawn "the bare agent and its missing armor" figure. In the center, a small friendly robot labeled "your 40-line agent ✓ it ACTS" standing on a pedestal labeled "Layer 1: the loop (built today)". Around it, four greyed-out dashed outlines of armor pieces floating, each red-labeled with what it protects against and its layer: a shield "permission gate — Layer 2", a stretchy belt "context window — Layer 3", a save-disk backpack "durability — Layer 4", and a set of extra robot arms "orchestration — Layer 5". A dashed takeaway box: "today = the beating heart. The rest of the week = the armor that makes it survivable." Excalidraw style, white background, charming, hand-lettered. || The honest ending: a bare agent that genuinely acts, surrounded by the four pieces of armor the rest of the workshop bolts on.]]

## Checkpoint questions (drop these between blocks)

- After the client: *"How much of the intelligence did we write?"* (None — it's one API call. We write the harness.)
- After the tools: *"What does the model actually see about a tool?"* (Only the name, description, and schema — never our function.)
- After the loop: *"Who decides when the agent is finished?"* (The model, by not asking for a tool. Not us.)
- After the demo: *"Did the model run the `ls`?"* (No — it *asked*; our harness ran it.)

## You can now teach

- **The two-hour build plan** block by block — the promise, the client, the tools, the loop, the demo, and the hands-on close — with concrete timings for a 7:00–9:00 AM session.
- The **model client** as one function, and the ninety-second demo that proves the API talks before you build anything around it.
- A **tool as two halves** — the contract the model reads and the function you run — using the vending-machine picture, and why a vague description is a broken tool.
- **The loop line by line**, ending on the stop condition, so the cohort feels the inversion of control that turns a script into an agent.
- **The three-lap demo** with visible `print`s — the moment the room watches a program plan, act, and finish on its own.
- The **honest gaps** — permission, context, durability, orchestration — each mapped to the day of the workshop that fills it.
