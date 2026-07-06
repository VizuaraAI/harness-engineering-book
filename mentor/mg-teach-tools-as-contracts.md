By the end of this chapter you'll be able to stand at a whiteboard and teach *why a tool is a contract, not a function* — so clearly that a student who has never built an agent will understand, in their bones, that the model calls a tool by reading a little job description you wrote, and that writing that job description well is the whole game. We start from zero. No agents yet. Just a form, a job posting, and a very literal reader.

This is a quiet chapter with a loud payoff. Students arrive thinking the hard part of a tool is the *code* — the Python that reads the file or runs the command. You're going to gently flip that. The code is the easy half. The half that decides whether your agent feels magical or maddening is the few lines of prose and structure the model actually reads. Own this, and you own the difference between an agent that calls your tools like it wrote them and one that fumbles every call.

## Start with the one idea: the model never sees your code

Here is the whole chapter in one sentence, and you should say it out loud early: **the model never sees the function behind a tool. It sees only a name, a description, and a little form describing the arguments.** From those three things alone it has to decide whether to call the tool, when, and with exactly what to fill in.

[[note: metaphor || A tool is a **job posting**. When you post a job, applicants never see the actual work — they see the title ("Kitchen porter"), a short description ("Wash dishes during service; keep the pass clear"), and a form asking for specific details (name, availability, right-to-work). They apply based *only* on that posting. The model is your applicant. It reads the posting, and applies — that is, it calls the tool — based on nothing but what the posting says. Write a vague posting and you get vague, wrong applicants. Write a precise one and the right candidate applies, correctly, every time.]]

[[fig: A warm hand-drawn illustration titled "A tool is a job posting". On the left, a pinned paper job posting on a cork-board with three clearly separated sections drawn like form fields: a bold title line "TITLE: read_file" (red), a short paragraph "DESCRIPTION: Read a text file and return its contents" (blue), and a little form with labeled blanks "path: ______  (required)" (green). A friendly robot applicant on the right reads the posting through a magnifying glass, a thought bubble showing it filling in the form "path = /app/main.py". Behind a dashed curtain on the far right, hidden from the robot, sits a locked box labeled "the actual code (def read_file...)" with a note in orange "the applicant NEVER sees this". A dashed takeaway box at the bottom: "the model applies from the posting alone — the code stays behind the curtain." Excalidraw style, white background, charming, hand-lettered. || The core metaphor: a tool is a job posting. The model applies by reading the title, description, and form — never the hidden work behind the curtain.]]

[[note: teach || Draw the cork-board first, before any code. Pin up three cards: a title, a description, a form. Then draw a curtain to the side and hide a box labeled "code" behind it. Physically point at the curtain and say "the model cannot see this." Only *after* that picture lands do you show them a real tool definition — and when you do, they'll immediately see it's just the three cards on the board. The order matters: metaphor first, JSON second.]]

## A tool has two readers

Now sharpen it. A tool is written for **two readers at once**, and they read completely different halves of it. The **model** reads the name, the description, and the input schema — that is its entire universe. Your **runtime** reads none of that; it just receives a name and a bag of arguments and runs the matching function.

This is the fifty-year-old idea of **interface versus implementation** — the front of the vending machine (buttons and prices) versus the machinery inside — with one twist that changes how you write it. Your interface's reader is not a compiler checking types. It is a language model reasoning in plain English. So the interface is *taught*, not just *declared*. That twist is the whole reason this chapter exists.

[[note: example || Here's the smallest real tool, written out as the three cards on the board. Name: `read_file`. Description: "Read a text file and return its contents." Schema: one field, `path`, of type string, marked required. That is *everything the model knows*. It has no idea whether your code opens the file with Python, SSHes into a server, or reads it off a floppy disk. Three cards. That's the contract.]]

## The schema is the enforcement half

The tool splits into two halves, and they do two different jobs. The **schema** — the little form describing the arguments — is the *strict* half. It is written in [JSON Schema](https://json-schema.org/), the same small language of `type`, `properties`, `required`, and `enum` you may have seen in API validators. And here is the part that surprises everyone: on modern providers, the schema is wired directly into how the model generates text. A field you mark `required` **will** be present. A field you type as an `integer` comes back as `3`, not the string `"3"`. This isn't a polite request the model tries to honor. It is a hard constraint on generation.

[[note: aha || Say this and watch it land: **"The schema is not a suggestion the model might follow. It is a fence it cannot climb over."** If you write `enum: ["pytest", "jest", "go"]`, the model literally *cannot* emit `"vitest"` — that value is ungenerable. Students expect tool-calling to be flaky, best-effort, prompt-and-pray. It isn't. The structural part is enforced at generation time. That's the moment they realize a good schema is real engineering leverage, not documentation.]]

Now show the difference between a loose form and a tight one, because that contrast is where the teaching lives.

```python
# LOOSE — technically valid, quietly terrible
{
  "name": "edit_file",
  "description": "Edit a file.",
  "input_schema": {
    "type": "object",
    "properties": {"args": {"type": "string"}}  # a blob of anything
  }
}
```

That version *runs*. It won't error when you register it. But it teaches the model nothing. `args` is one blank line labeled "stuff." The model has to *invent* a convention — is it JSON? a diff? a shell one-liner? — and hope your function guesses the same one. Nothing is required, so it may leave out the very thing you need.

```python
# TIGHT — the form does the teaching
{
  "name": "edit_file",
  "description": (
    "Replace an exact string in a file with a new string. "
    "old_string must match the file EXACTLY, including whitespace, "
    "and must be unique. Read the file first if unsure."
  ),
  "input_schema": {
    "type": "object",
    "properties": {
      "path":        {"type": "string",  "description": "Absolute path to the file."},
      "old_string":  {"type": "string",  "description": "Exact text to find. Must be unique."},
      "new_string":  {"type": "string",  "description": "Text to replace it with."},
      "replace_all": {"type": "boolean", "default": False,
                      "description": "Replace every occurrence instead of one."}
    },
    "required": ["path", "old_string", "new_string"]
  }
}
```

Every field earns its place. Named, typed, described arguments turn "change the port to 8080" into a fill-in-the-blanks the model can barely get wrong. The `required` list means you never get an edit with no target. The boolean with a default offers an *option* without forcing it.

[[fig: A two-panel before/after hand-drawn comparison titled "Loose form vs. tight form". LEFT panel labeled black "(A) LOOSE: one blank line": a paper form with a single wide blank labeled "args ________", a confused robot above it with three thought bubbles "JSON?  a diff?  a command?", and a red note "model must invent a format and hope you agree". A red squiggly output "edit_file(args='port=8080')" stamped with a red X. RIGHT panel labeled black "(B) TIGHT: named, typed, required": a neat form with four labeled lines in green "path ▸ /app/config.py", "old_string ▸ 'port = 3000'", "new_string ▸ 'port = 8080'", "replace_all ▸ ☐", a calm robot, and a green check on "edit_file(path=…, old=…, new=…)". A dashed takeaway box spanning both: "named + typed + required fields turn a guessing game into fill-in-the-blanks." White background, hand-lettered Excalidraw. || A loose form makes the model invent a format and hope it matches your code. A tight form turns the call into a fill-in-the-blanks it can barely get wrong.]]

Three levers on the form do most of the work, so name them so students reach for them deliberately. **`required`** decides what the model cannot forget — but only mark a field required if your function truly cannot proceed without it, or you'll push the model to fabricate a value just to satisfy the form. **`enum`** collapses an open field into a closed set of legal choices, and it's the single most underused lever in tool design. And **types with defaults** let you offer optional behavior without cluttering what's required.

[[note: confusion || Students over-mark `required`, thinking "more required = more reliable." It's the opposite. Draw a form with `reason: ______ (required)` on a tool that doesn't really need a reason. Then narrate: "The model must fill *every* required blank. If it has nothing real to put there, it will *make something up* — because a blank is illegal but an invention is allowed." Over-requiring manufactures hallucinations. The fix, said as a rule: **require only what your function would genuinely crash without.**]]

## The description is the coaching half

Now the softer half — and don't let "soft" fool anyone into thinking it's less important. The **description** is not documentation for humans who'll never read it. It is a piece of the prompt that ships to the model on *every single turn*, and the model weighs it every time it decides whether and how to call the tool. Writing a description *is* prompt engineering, aimed at one very literal reader.

A good description does three jobs the schema simply *can't*. First, it says **when to reach for this tool versus another** — "Read the file first if unsure" quietly wires two tools into a workflow. Second, it encodes **preconditions the types can't express** — that `old_string` must be *unique*, that a path must be *absolute*. A `type: string` can't say "and it has to be unique in the file." Only prose can. Third, it sets **defaults of judgment** — "default to pytest for Python" — so the model doesn't dither.

[[fig: A hand-drawn "anatomy" figure titled "What a description does that the form can't", zooming in on one description block in the center. The block reads: "Replace an exact string in a file. old_string must match EXACTLY and be unique. Read the file first if unsure." Colored dashed arrows point to phrases: a blue arrow to "Replace an exact string" labeled "WHAT it does"; a red arrow to "must match EXACTLY and be unique" labeled "PRECONDITION the type can't say"; an orange arrow to "Read the file first if unsure" labeled "WORKFLOW: wires to another tool"; a green arrow to the whole block labeled "ships EVERY turn → costs tokens → keep it tight". A small purple note in the corner: "this is prompt engineering for an audience of one." A dashed takeaway box: "the form says what's LEGAL; the description says what's WISE." White background, hand-lettered Excalidraw. || A description does three things the schema can't: state the mechanism, encode the preconditions the types can't express, and wire tools into workflows — all as prompt shipped every turn.]]

There is an honest cost here, and it's why descriptions must be *tight*, not merely thorough. Every tool's name, description, and schema get serialized into the context window on **every turn**, used or not. Ten verbose tools can burn thousands of tokens before the model reads a line of your code. So aim for the density of a good docstring: one crisp sentence of *what*, then the one or two preconditions that actually change behavior. If you're writing a paragraph, the tool is probably doing too much and wants splitting.

[[note: say || "The description is not a manual sitting on a shelf. It's a sticky note taped to the model's monitor that it re-reads on *every* turn. So write it like a sticky note: short, sharp, and only the things that change what it does. A novel on that sticky note just buries the one warning that mattered."]]

## The failure gallery — every bad call is a contract bug

Here's the mindset shift to leave students with, and it's worth catologuing the failures so they can name them. When the model calls a tool *wrong*, the beginner's instinct is to scold it — add a line to the system prompt, "please always include the path." That's a plea. The fix almost always lives in the *contract*, and a fix in the contract is a *guarantee*. Walk them through the five recurring bugs:

- **The blob argument.** A single `args: string` forces the model to invent a serialization. It picks one, you parse another, and the mismatch looks like the model's fault but is yours. *Fix: named, typed fields.*
- **The missing `required`.** You need `path` but never marked it required, so on a fast turn the model omits it and your function throws `KeyError`. The form promised nothing, so the model owed you nothing. *Fix: mark it required.*
- **The open field that should be an `enum`.** A free-string `framework` invites `"unittest"` when you support three runners. *Fix: an enum makes the bad value ungenerable.*
- **The lying description.** The prose says "lists files" but the function also deletes empty ones. The model calls it expecting a harmless read — and destroys state it was never warned about. *Fix: describe side effects honestly.*
- **The overlapping twins.** Two tools, `search_code` and `find_in_files`, with near-identical descriptions. The model flips a coin every turn. *Fix: merge them, or contrast them sharply.*

[[fig: A hand-drawn "failure gallery" titled "Five ways a contract goes wrong", drawn as five small stacked panels each with a red X and a broken tool-call doodle. Panel 1 red-labeled "BLOB ARG": a form with one line "args: '???'" and a note "model invents a format". Panel 2 "MISSING required": a form with an empty "path: ▢" and a note "KeyError at runtime". Panel 3 "OPEN vs ENUM": "framework: 'vitest'" circled red "not supported". Panel 4 "LYING DESC": a card "'lists files'" with a hidden orange skull "…also deletes!". Panel 5 "TWINS": two identical boxes "search_code / find_in_files" and a confused robot flipping a coin. Down the right side a green column of fixes: "→ named+typed", "→ mark required", "→ enum", "→ describe side effects", "→ merge or contrast". A dashed takeaway box: "every bad call is a contract bug you fix in the SCHEMA, not the model." White background, hand-lettered. || The five recurring contract bugs, each paired with the schema-level fix that prevents it. When a call arrives malformed, patch the contract, not the prompt.]]

[[note: production || This is exactly how the real harnesses are built. Claude Code's `Edit` tool has that precise "must match exactly and be unique" contract *because* a looser one produced ambiguous edits — the contract was tightened until the calls came back clean. pi ships a deliberately *small* set of sharp tools rather than a sprawl of narrow ones, precisely because every tool's schema costs tokens on every turn. Cursor's agent, Anthropic's own tool-use guidance — all of them land on the same lesson: the more your tool's inputs mirror how the model already thinks about the task, the fewer malformed calls you get. This is not academic. It is why these agents feel reliable.]]

## Validate anyway, and feed the error back

One honest caveat to close on. The form constrains generation, but it's not a force field. Arguments can be *structurally* valid and still *semantically* wrong — a perfectly-typed `path` string that points at a file which doesn't exist. So the runtime half still validates. And here's the part beginners skip: when validation fails, you return the error *as a tool result, back into the loop*, rather than crashing.

```python
def run_tool(name, args):
    if name == "read_file":
        p = pathlib.Path(args["path"])
        if not p.exists():
            return f"ERROR: no such file: {p}. Use list_files to see what exists."
        return p.read_text()
```

That returned string is not a dead end — it's *feedback*. The model reads "no such file, use list_files," and on the next lap it corrects itself, often listing the directory and retrying with the right path, no human in the middle. A well-written error message is quietly one more clause of the contract: it teaches the model how to recover.

[[note: demo || The one live demo for this chapter: register `read_file` with a tight schema, then ask the agent to read a file whose name you deliberately misspell in the prompt. Watch it call `read_file`, get your `ERROR: no such file... use list_files` string back, *call list_files on its own*, find the real name, and retry — all without you touching anything. The room goes quiet. That self-correction, driven entirely by a good error string, is the aha that ties tools to the durability layer coming later.]]

[[note: aha || The line that reframes the whole craft: **"You are not programming the model. You are writing an interface so clear that the correct call is the obvious one."** Tool design isn't about controlling the model — it's about describing the job so well that a literal reader can't help but do it right.]]

## You can now teach

- A **tool as a contract, not a function** — the model applies from the job posting (name + description + schema) and never sees the code behind the curtain.
- The **two readers**: the model reads the interface; your runtime reads the arguments and runs the hidden implementation.
- The **schema as the enforcement half** — required, enum, and typed-with-defaults are hard constraints on generation, demonstrated with a loose-vs-tight `edit_file`.
- The **description as the coaching half** — it states the mechanism, encodes preconditions the types can't, and wires tools into workflows, all as prompt shipped every turn.
- The **failure gallery** — blob args, missing required, open fields, lying descriptions, overlapping twins — and the reflex to fix the *contract*, not the prompt.
- Why you **validate anyway and feed the error back** into the loop, and how a good error string makes the agent self-correct — the seed of the durability layer.
