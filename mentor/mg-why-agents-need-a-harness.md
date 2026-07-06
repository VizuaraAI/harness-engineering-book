By the end of this chapter you can stand at a whiteboard and answer, without hand-waving, the question the whole workshop rests on: *if the model is so smart, why does it need all this machinery around it?* You don't need to have built an agent before. You need one metaphor students never forget, one honest little demo that fails in front of their eyes, and the discipline to keep it simple. Let's build it.

## The one-sentence answer

A large language model is a **brain in a jar**. It is astonishingly clever — it can reason, write code, plan, explain — but it is sealed off from the world. It has no eyes to read your files, no hands to run your tests, no memory of yesterday, and no sense that time is passing. The **harness** is the *body* you build around that brain: the eyes, the hands, the memory, the nervous system. Claude Code, Cursor, and pi are not models. They are bodies wrapped around a rented brain.

[[note: metaphor || **The brain in a jar.** Picture a brilliant scientist's brain floating in a jar of fluid on a lab bench. Ask it a question through a speaker and it answers beautifully. But it cannot open the drawer, cannot pick up the pen, cannot remember what you asked it an hour ago — because the moment you walk away and come back, it's a fresh brain in a fresh jar. To get real work done you'd have to build it a *body*: cameras for eyes, robot arms for hands, a notebook for memory, and a helper who reads its answers, does what it asks, and reports back. That body — cameras, arms, notebook, helper — is the harness. The brain is the model. The body is what you're here to build.]]

[[fig: A warm hand-drawn illustration titled "The brain in a jar needs a body". Center-left: a glass jar on a lab bench with a friendly cartoon brain floating inside, a small speech bubble from the jar saying "I could fix that bug... if only I could reach it!". Around the jar, hand-drawn robot-body parts labeled and connected by dashed lines: a pair of googly camera-eyes labeled in blue "EYES = read files", two robot arms labeled in blue "HANDS = edit + run commands", an open notebook labeled in green "MEMORY = remember the task", and a little assistant figure labeled in purple "THE LOOP = reads answers, does them, reports back". A red handwritten banner across the top: "the brain is brilliant but sealed off — the BODY is the harness". A dashed takeaway box at the bottom: "model = brain in a jar · harness = the body you build around it". Excalidraw style, white background, charming and friendly, handwritten labels. || The core metaphor of the whole workshop: the model is a brilliant brain in a jar, and the harness is the body — eyes, hands, memory, and a helper — that lets it actually do work.]]

[[note: teach || Draw the jar first and *act it out*. Put your hands up like you're holding a jar, tilt your head like the brain is thinking, then mime it straining to reach a drawer it can't touch. Only once the picture lands — the brain that's smart but sealed off — do you say the word "harness." Never lead with "agent architecture." Lead with the jar. Everything else in five days hangs off this one image.]]

## What a bare model actually gives you

Let's be precise about how sealed-off the brain really is, because students will overestimate it. Strip away all the tooling and a language model offers exactly *one* primitive: you hand it a list of messages, and it hands you back one more message. That's the whole thing. Text in, text out. It is a **function**.

And a function like this has three properties students find genuinely surprising when you say them plainly:

- It has **no memory.** Each call is a stranger who has never met you. If you want it to remember, *you* have to paste the history back in every single time.
- It has **no hands.** It cannot open a file, run a command, or touch the internet. It can only produce text.
- It has **no sense of time.** It doesn't know a call takes two seconds or that it happened after the last one. There is no "meanwhile."

[[note: example || Make "no memory" concrete on the board. Call the brain twice. Turn 1: you type *"My name is Priya."* It replies *"Nice to meet you, Priya."* Turn 2 — a fresh call, nothing carried over — you type *"What's my name?"* It replies *"I don't have that information."* Same model, two seconds apart, and it has already forgotten. The lesson lands instantly: the model doesn't remember the conversation; **the conversation is something you have to carry.**]]

[[fig: A hand-drawn diagram titled "A bare model is just a function". Center: a wobbly rounded box labeled "THE MODEL" with a small brain doodle inside. A blue arrow labeled "messages in (a list of text)" enters from the left; a blue arrow labeled "one message out" leaves to the right. Above the box, a red handwritten note: "no memory · no hands · no sense of time". Below the box, three faint greyed-out icons — a folder, a terminal, and a clock — each with a red X struck through it, labeled in red "can't touch any of these". A dashed takeaway box at the bottom: "the model is a pure function: text in, one text out. Everything else is the harness." Excalidraw style, white background, hand-lettered. || A bare model is a stateless function — text in, one text out. It cannot remember, act, or persist. Those powers come from the harness.]]

This is wonderful and useless at once. Wonderful, because that one primitive holds astonishing capability. Useless, because *you* wanted something that reads your codebase, edits three files, runs the tests, notices they failed, and fixes the bug — remembering the whole time what you asked. None of that is in the function. All of it has to be built around it.

## Why "just call the API" fails — watch it break

Here is the demo that does more teaching than any slide. Every student's first instinct is: "I'll just write a little script — read the request, call the model, print the answer. How hard can it be?" Let them believe it for exactly one example, then break it.

The script works beautifully for *"explain this regex."* One question, one answer, done. Then you ask it to *"fix the failing test,"* and it falls apart in front of you — not because the model is dumb, but because the *script* has no body.

[[note: demo || Run this live. First prompt: `explain this regex: ^\d{3}-\d{4}$`. The one-shot script nails it — the room relaxes, "see, easy." Second prompt: `fix the failing test in this repo`. The model replies with something like *"Sure — let me open the test file to see what's failing."* And your script just... prints that sentence. It can't open the file. The model *asked* for an action and nobody was listening. Let the silence sit. That dead end is the entire motivation for the workshop.]]

Watch everything the model *wants* that the script can't give:

- It says *"let me look at the test file"* — but a model can't read files. **You** have to give it a tool and run it.
- It reads the file and proposes an edit — but a model can't write files either. **You** run that, and you'd better ask before overwriting the user's code.
- It wants to run the tests — that's a shell command, which could be `rm -rf` in disguise. **You** need a permission gate and a sandbox.
- The conversation gets long — **you** have to decide what stays in the model's limited context.
- Halfway through, the process crashes — and **you** need to have been saving progress, or all that work is gone.

Every one of those "**you** needs" is a piece of the harness. The bare model gave a single **transaction**: one question, one answer, no continuity. An agent is a *loop* of many transactions, held together by machinery that remembers, acts, protects, and recovers.

[[note: aha || Here's the sentence that reframes the whole course: **"The intelligence was never the missing piece. The body was."** Students arrive thinking a better agent means a smarter model. It doesn't. The same model that fails inside a two-line script succeeds inside Claude Code — *identical brain, different body.* When that clicks, they stop asking "which model is best?" and start asking "what does the harness need to do?" — which is exactly the question the next five days answer.]]

[[fig: A two-panel before/after hand-drawn comparison titled "Why 'just call the API' fails". LEFT panel labeled "(A) just a script": a single user speech bubble "fix the test" → one model box → a lonely reply bubble "let me open the file..." that dead-ends against a brick wall drawn in red, with a red note "the model ASKS for an action — nobody's listening". RIGHT panel labeled "(B) a harness": the same model box, now inside a big orange circular arrow (a loop), with small labeled boxes hanging off it — a blue "hands (read/edit/run)", a green "memory", a purple "permission gate", a red "save points". The user bubble enters once at the top; a finished, tested fix leaves at the bottom after several laps. A dashed takeaway box: "same brain. the difference is the body around it." Excalidraw style, white background, hand-lettered. || The leap from a one-shot script to an agent: same model, but wrapped in a loop plus the systems — hands, memory, permissions, recovery — that keep the loop alive.]]

## The body has five parts — the map to keep on the wall

So what is this body made of? Across the five days of the workshop you build the harness in five layers, each giving the brain a power it lacked in the jar. Give students the whole map on day one so every later day has a home.

[[fig: A hand-drawn vertical stack titled "The five layers of a harness", drawn as five rounded boxes stacked, with the model at the very bottom. From bottom to top: (0) a small grey box "THE MODEL (borrowed brain)". (1) a blue box "THE LOOP — call, run tool, repeat until done". (2) a green box "TOOLS + GUARDRAILS — read/write/edit/run, permissions, sandbox". (3) a yellow-hatch box "CONTEXT ENGINE — budget, compaction, memory". (4) an orange box "DURABILITY — save points, replay, self-heal". (5) a purple box "ORCHESTRATION — sub-agents, supervision, human-in-the-loop". A red bracket down the right side spanning layers 1–5 labeled "THE HARNESS (you build all of this)". A dashed takeaway box: "one borrowed brain, five layers of body = a coding agent." Numbered circles on each layer. Excalidraw style, white background, hand-lettered. || The five layers of the body, bottom to top: the loop, tools + guardrails, the context engine, durability, and orchestration — all wrapped around a borrowed brain. This is the whole workshop on one wall.]]

Walk it once, top to bottom, in body-metaphor language so it sticks:

- **The loop** is the *heartbeat* — the helper who reads the brain's answer, does what it asked, and reports back, over and over until the job's done. (Day 1.)
- **Tools + guardrails** are the *hands* — and the mittens that stop the hands from grabbing something hot. (Day 2.)
- **The context engine** is *working memory* — deciding what the brain gets to see this turn, because its short-term memory is tiny and precious. (Day 3.)
- **Durability** is the *save point* — so a crash means "resume," not "start over." (Day 4.)
- **Orchestration** is *delegation* — one brain can hire other brains for sub-jobs when a task is too big for one head. (Day 5.)

[[fig: A warm hand-drawn "assembly line" illustration titled "One borrowed brain, five stations of a body". A friendly factory conveyor belt runs left to right; a user's request ("fix the test") drops in on the far left and a finished, tested fix ships out on the far right. Five labeled stations line the belt, each drawn as a little workbench with a cartoon helper: (1) a heart-shaped station "THE LOOP — keep it going" (blue), (2) a pair of robot arms "HANDS + mittens" (green), (3) a station with a small notebook and a magnifying glass "WORKING MEMORY — what to show" (yellow), (4) a big red SAVE-POINT floppy-disk stamp "DURABILITY — resume, don't restart" (orange), (5) a manager figure handing slips to two smaller helper figures "DELEGATION — sub-agents" (purple). Above the whole belt, one brain-in-a-jar on a cart is wheeled between stations, labeled in red "same rented brain, moved down the line". A dashed takeaway box: "the five layers are one body's assembly line — request in, working software out." Excalidraw style, white background, charming, hand-lettered. || The five layers drawn as a friendly assembly line: the same borrowed brain rolls past five stations — loop, hands, memory, save points, delegation — turning a request into a finished, tested change.]]

[[note: say || "For the next five days we are Dr. Frankenstein, but the friendly kind. We already have the brain — we rent it from Anthropic or OpenAI, and it's the same brain everyone else rents. Our whole job is to build it a body: a heartbeat, hands, memory, save points, and helpers. On Friday, that body has a name — it's your own Claude Code — and you'll have built every organ yourself."]]

## This is exactly what runs in production today

Frame the stakes so students know this isn't a toy exercise. **Claude Code is not a model** — it's a harness Anthropic wraps around Claude. **Cursor is not a model** — it's a harness around whichever model you pick. **pi** (the small open coding agent) is not a model either; it's a strikingly *small* harness, which is the best possible proof that you don't need a giant company to build one — you need to understand the five layers.

[[note: production || Concrete and current: the model inside Claude Code is the same Claude you can call from a bare API script. So why does Claude Code feel like a colleague and your script feel like autocomplete? *The harness.* The loop that lets it keep working, the tools that let it touch your repo, the context engine that keeps it coherent over an hour-long task, the permission gate that stops it running a destructive command. The model is a commodity everyone rents from the same three labs. The harness is the part that's *yours* — it decides whether your agent is safe, whether it recovers from a crash, whether it stays sane over 200 turns, and whether it costs a dollar or a penny to run. That is where the engineering — and the money — actually lives.]]

[[sn: This is why pi is such an instructive object to keep pointing at. It proves a real, capable harness can be *small* and readable end-to-end. You are not building a mystery; you are building something you can hold in your head — which is the entire promise of this workshop.]]

## The confusion to head off early

[[note: confusion || A student will push back: "But models keep getting smarter — won't the harness just disappear? Won't GPT-6 read files on its own?" The fix is the jar. A smarter brain is *still a brain in a jar.* Making it more brilliant does not give it hands, a memory that persists across calls, or a save point when the process dies. Those are not intelligence problems — they are *plumbing* problems, and plumbing doesn't solve itself no matter how clever the water is. In fact a smarter model makes the harness *more* valuable: you can trust a more capable worker to run longer, which means it needs *better* hands, memory, and guardrails. The brain and the body get better together. The body never goes away.]]

One more line to keep in your pocket, because someone always confuses these three words: **prompt engineering** is *what you say* to the brain (one good instruction). **Context engineering** is *what the brain sees each turn* (which memories and files you spend its tiny attention on). **Harness engineering** is *what the brain lives inside* — the whole body. Prompt is a sentence. Context is a turn. The harness is the machine. This workshop is about the machine.

That's the chapter. One jar, one broken script, and a five-part body. If a student leaves able to explain *why a brilliant model still can't do anything on its own* and *why the harness — not the model — is the engineering*, you have given them the mental spine for everything the next five days will build.

## You can now teach

- The **brain-in-a-jar** metaphor: the model is brilliant but sealed off, and the harness is the *body* — eyes, hands, memory, and a helper — you build around it.
- What a **bare model actually is** — a stateless function, text in and one text out, with no memory, no hands, and no sense of time — demonstrated with the "what's my name?" forgetting demo.
- **Why "just call the API" fails**, shown live: the one-shot script that nails "explain this regex" and then dead-ends the instant the model asks to *act*.
- The **five layers** of the harness as body parts — heartbeat, hands, working memory, save points, delegation — and which workshop day builds each.
- The **production link**: Claude Code, Cursor, and pi are harnesses, not models; identical brain, different body — and the harness is the part that's yours.
- The **fix for the big confusion**: a smarter model is still a brain in a jar, so the harness doesn't disappear as models improve — it grows *more* valuable.
