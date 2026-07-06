Here is a fact about the bare loop we built that quietly limits everything: the moment `run_agent` returns, the agent forgets. The `messages` array — which *was* the agent's whole mind while the loop ran — goes out of scope, gets garbage-collected, and is gone. Start it again tomorrow on the same codebase and it walks in a stranger. It rediscovers that you use `pnpm` not `npm`, that the tests live under `tests/` not `test/`, that the `db` module is deprecated and everyone uses `store` now — every single session, from zero, by trial and error, spending tokens and your patience relearning things it already learned yesterday.

Real agents don't do that, and the reason is a small idea with a big payoff: **memory that outlives the loop**. Claude Code opens a fresh session already knowing your conventions. pi does too. That knowledge didn't come from the model's weights and it didn't survive in the message array — it came from a file the harness reads on the way in. This chapter is about that file, and about the three tiers of memory it completes.

## Three tiers, three lifetimes

The word "memory" is doing too much work when we use it for one thing. In a real harness there are three distinct kinds, and they differ not in what they store but in *how long they live*. Get the three straight and the whole design falls out naturally.

[[fig: A hand-drawn diagram titled "Three tiers of agent memory", drawn as three horizontal bands stacked with a clock/lifetime axis running left-to-right along each. TOP band, yellow-hatch, labeled black "TIER 1 — IN-CONTEXT (the messages array)", with a blue note "lives inside ONE model call" and a red note "dies when the loop returns · capped by the context window". MIDDLE band, blue-hatch, "TIER 2 — SESSION STATE (transcript on disk)", with a blue note "lives across turns + a crash · one job" and a green note "resume / replay this run". BOTTOM band, green-hatch, "TIER 3 — PERSISTENT FILES (CLAUDE.md, memory)", with a blue note "lives ACROSS every session, forever" and an orange emphasis "loaded fresh at the start of each run". Down the right side a red bracket labels the three "volatile → durable". A dashed takeaway box: "same word, three lifetimes: one call, one job, every job." White background, hand-lettered Excalidraw. || The three tiers of memory differ by lifetime: in-context lives one call, session state lives one job, persistent files live across every job forever.]]

**Tier 1 — in-context memory** is the `messages` array itself. It is the fastest, richest memory the agent has — the model sees all of it, every token, on every call — and also the most fragile. It lives exactly as long as the loop, and it is bounded by the hardest wall in the system: the context window. When it fills, something has to give, which is the entire subject of [compaction and summarization](compaction-and-summarization.html). Tier 1 is *working memory*: vivid, expensive, and gone when you close the laptop.

**Tier 2 — session state** is the running conversation written down somewhere durable — a transcript file, a row in SQLite, an append-only log — so that *this one job* can survive a crash, an interruption, or a `Ctrl-C`. It lets you resume a session, replay it step by step, or inspect what the agent did. It lives longer than a single call but it is still scoped to one task; when the task is done, the session closes. Tier 2 is the bridge to [durable execution and checkpointing](durable-execution-and-checkpointing.html), and we treat the machinery there. It is *episodic memory*: the story of one run.

**Tier 3 — persistent files** is memory that belongs to the *project*, not to any run. It is a plain file on disk — most famously `CLAUDE.md` — that the harness reads at the **start of every session** and injects into the very first context. It is small, hand-curated, and durable across every job the agent will ever do here. Tier 3 is *semantic memory*: the stable facts about your world. It is what makes an agent walk in already knowing things, and it is the star of this chapter.

The three form a hierarchy of trust and cost. In-context is instant but volatile; session state is durable but narrow; persistent files are the slowest-changing and the most valuable, because a good fact written there pays off on every future run.[[sn: This maps almost exactly onto the human distinction between working memory, episodic memory, and semantic memory. The analogy isn't decoration — it's a design compass. When you're unsure where a piece of information belongs, ask which human memory it resembles, and you'll usually put it in the right tier.]]

## The CLAUDE.md pattern

Here is the whole pattern in one sentence: **keep a durable file of project facts, and load it into the model's context at the top of every session.** That's it. Everything else is refinement.

Concretely, `CLAUDE.md` is a Markdown file in your repo root that reads like a note you'd leave a new teammate on their first day — the things that aren't obvious from the code but that you'd be annoyed to explain twice.

```markdown
# Project: acme-api

## Commands
- Install: `pnpm install`  (NOT npm — the lockfile is pnpm)
- Test:    `pnpm test`     (vitest; a single file: `pnpm test path/to/x.test.ts`)
- Lint:    `pnpm lint --fix` before every commit

## Conventions
- All DB access goes through `src/store/`. The old `src/db/` is deprecated — do not import it.
- Errors: throw `AppError`, never a bare `Error`. See `src/errors.ts`.
- We use British spelling in user-facing strings ("colour", "behaviour").

## Gotchas
- The dev server needs `.env.local` (copy from `.env.example`).
- `pnpm build` is slow (~90s); prefer `pnpm typecheck` while iterating.
```

Now watch what the harness does with it. Loading it is not clever — it is one file read, prepended to the conversation before the user's first message ever appears.

```python
import pathlib

def load_project_memory(root="."):
    """Read the durable project facts, if any. Returns '' when absent."""
    f = pathlib.Path(root) / "CLAUDE.md"
    return f.read_text() if f.exists() else ""

def start_session(user_request, root="."):
    memory = load_project_memory(root)
    messages = []
    if memory:
        messages.append({
            "role": "user",
            "content": f"<project_memory source=\"CLAUDE.md\">\n{memory}\n</project_memory>",
        })
    messages.append({"role": "user", "content": user_request})
    return run_agent(messages)   # the same loop from the last chapter
```

That is the entire mechanism. A dozen lines. But feel what it buys you: the agent's *first* call already contains your conventions, so it never has to discover them. It won't reach for `npm`, won't import the deprecated `db` module, won't spell "color" the American way. You paid a few hundred tokens once, at the top of the session, and bought correct behaviour for the whole run.[[sn: The tag wrapper matters more than it looks. Fencing the file in `<project_memory>` tells the model *this is durable reference material, not a user instruction for right now* — the same reason we later fence tool results and compaction summaries. Unlabelled text bleeds into whatever the model is currently doing; labelled text stays in its lane.]]

[[fig: A before/after hand-drawn comparison titled "Cold start vs. warm start". LEFT panel labeled black "(A) no memory file — cold start": a small robot at a door labeled "session 1", then "session 2", then "session 3", and above each a red thought-bubble "which package manager? let me try npm… fails… try pnpm". A red note under the panel: "relearns the same facts EVERY session · wasted turns + tokens". RIGHT panel labeled "(B) CLAUDE.md — warm start": the same robot walking through a door, and a green folded-paper icon labeled "CLAUDE.md" being handed to it at the threshold; its thought-bubble now reads in green "pnpm, store/ not db/, throw AppError". A blue arrow from the paper into the robot's first speech bubble labeled "injected at turn 0". A dashed takeaway box: "curate the facts once → every session starts warm." White background, hand-lettered Excalidraw. || Without a memory file every session cold-starts and rediscovers the same facts; with CLAUDE.md the harness hands the agent the facts at turn 0 and every session starts warm.]]

## Reading memory vs. writing memory

So far the agent only *reads* memory. That is the ninety-percent case and, honestly, where most of the value is: a well-tended `CLAUDE.md` that a human wrote and the harness loads. But the interesting frontier is the other direction — the agent *writing* to its own persistent memory.

The two directions are genuinely different operations, and conflating them is where memory systems go wrong. **Reading** happens automatically, once, at session start, and is cheap and safe. **Writing** is deliberate, rare, and consequential — because whatever the agent writes to `CLAUDE.md` will be loaded into *every future session's* context, forever, until someone removes it. A bad fact read once is a bad turn; a bad fact *written* is a bad turn repeated on every run until you notice. That asymmetry is the whole reason to treat writes with care.

[[fig: A hand-drawn diagram titled "Two directions of memory", drawn with CLAUDE.md as a green folded-paper file in the center. On the LEFT, a blue arrow labeled "READ" flows from the file into a box "session context (turn 0)", annotated blue "automatic · every session · cheap · safe". On the RIGHT, a purple arrow labeled "WRITE" flows from a box "the agent learns a durable fact" back into the file, annotated red "deliberate · rare · consequential — lands in ALL future sessions". Below the write arrow, a small orange gate icon labeled "confirm / diff before saving". A red numbered circle (1) on read, (2) on write. A dashed takeaway box: "reads are ambient; writes are commitments — gate them." White background, hand-lettered Excalidraw. || Reading memory is automatic and cheap; writing memory is a deliberate commitment that affects every future session, so it belongs behind a gate.]]

When should the agent write? The honest answer from how real harnesses behave: **only when it learns a durable, project-level fact that a human would want remembered.** Claude Code exposes exactly this — start a line with `#` and the content gets routed into a memory file, and the `/memory` command opens those files for editing. The trigger is a *correction that generalizes*: you tell the agent "no, we deploy with `make ship`, not `make deploy`," and rather than just fixing this run, the well-designed agent offers to write that fact down so the next session starts already knowing it. The test is simple — would this fact be true *next week, on a different task*? If yes, it's Tier 3. If it's only true for the job in front of you, it belongs in Tier 1 or 2 and must never pollute the durable file.

Mechanically, giving the agent this power is just another tool — the same tool machinery from [tool schemas as contracts](tool-schemas-as-contracts.html), pointed at the memory file.

```python
MEMORY_FILE = "CLAUDE.md"

REMEMBER_TOOL = {
    "name": "remember",
    "description": (
        "Append a DURABLE, project-level fact to CLAUDE.md so future sessions "
        "start knowing it. Use ONLY for facts true across tasks (conventions, "
        "commands, gotchas) — never for details specific to the current task."
    ),
    "input_schema": {
        "type": "object",
        "properties": {"fact": {"type": "string"}},
        "required": ["fact"],
    },
}

def remember(fact, root="."):
    path = pathlib.Path(root) / MEMORY_FILE
    # In a real harness this goes through the same permission gate as any write.
    with path.open("a") as f:
        f.write(f"\n- {fact.strip()}\n")
    return "saved to CLAUDE.md"
```

Notice two deliberate choices. First, the description does more teaching than describing — it spends its words drawing the Tier-1-vs-Tier-3 line *for the model*, because the model is the one deciding when to call it. Second, the comment flags what the toy omits: a self-writing memory tool is a file write, and it must pass through the same [permission gate](permission-gates-and-approval-modes.html) as any other write to your repo. An agent that can silently edit the file that shapes all its future behaviour is a footgun; an agent that proposes the edit and shows you the diff is a colleague.

## Keeping memory from rotting

There is a failure mode that only appears once memory works, and it is worth naming so you design against it from the start: **memory rot**. Because Tier 3 is loaded into *every* session, it competes for the same scarce context budget as the actual task. A `CLAUDE.md` that grows without discipline — a fact appended every time the agent stumbles — slowly turns from an asset into a tax: it burns tokens on every run, and worse, a stale fact ("the API lives at v1/") that was true in March silently poisons every session in June.[[sn: This is why the more mature pattern is not one giant file but *scoped* memory: a repo-root `CLAUDE.md` for project-wide facts, per-directory files for local conventions, and a user-level `~/.claude/CLAUDE.md` for your personal preferences across all projects. The harness merges the relevant ones at load time. Smaller, scoped files rot more slowly and are far easier to keep true.]]

[[fig: A hand-drawn diagram titled "Memory rot vs. scoped memory". LEFT panel labeled black "(A) one file, unpruned": a single tall green folded-paper file labeled "CLAUDE.md" bulging with many stacked lines, a few crossed out in red and tagged red "stale · was true in March". An orange emphasis note points at the file: "loaded into EVERY session → burns the same tokens every run". A red downward arrow labeled "grows without discipline → a tax". RIGHT panel labeled black "(B) scoped + pruned": three smaller green folded-paper files stacked as a merge, labeled black "~/.claude/CLAUDE.md (you)", "repo-root CLAUDE.md (project)", "src/api/CLAUDE.md (local)", with a blue note "harness merges the relevant ones at load time" and a green note "short · general · evergreen". A purple scissors icon labeled "prune, don't just grow". A dashed takeaway box: "curation is a first-class part of context engineering — smaller scoped files rot slower." White background, hand-lettered Excalidraw. || Memory rot: one unpruned file taxes every session and hides stale facts; scoped, pruned files that the harness merges at load time stay small and true.]]

So the discipline that comes with memory is *curation*, and it is a first-class part of context engineering, not an afterthought. Good facts are short, general, and evergreen. The file is pruned, not just grown. And the strongest signal that memory is healthy is boring: the agent stops rediscovering things, stops re-asking, and simply starts each session already competent — which is exactly the feeling that separates a real coding agent from a clever autocomplete.

## What memory buys, and what's still missing

With three tiers in place your harness has crossed a real line. Tier 1 gives it a mind for the duration of a task; Tier 2 lets that task survive a crash; and Tier 3 — the `CLAUDE.md` pattern — lets *knowledge* survive across every task, so the agent compounds what it learns about your project instead of starting from zero each morning. That compounding is most of what makes a long-lived agent feel like it's getting to know your codebase.

What memory does *not* solve is the wall it lives next to. Tier 3 loads durable facts into the context window, but the context window is still finite, and a long session will fill it no matter how tidy your memory file is. Loading the right things at the start is only half of context engineering; deciding what to *drop* when the array overflows mid-run is the other half. That is the next problem we take head-on: [compaction and summarization](compaction-and-summarization.html) — how a harness keeps a two-hundred-turn conversation alive inside a window that only holds a few dozen.
