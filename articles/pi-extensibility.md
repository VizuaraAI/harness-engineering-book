Look back at everything Pi has done in these chapters. It ran an [agent loop](pi-from-chat-to-agent.html), gave the model a [toolbox](pi-the-toolbox.html), guarded that toolbox with a [safety gate](pi-tool-safety.html), assembled a [system prompt](pi-the-system-prompt.html), [managed context](how-pi-manages-context.html), [compacted history](how-pi-does-cache-control.html), spun up [subagents](how-pi-does-subagents.html). Every one of those is a feature you might have expected the core to *own* — to hard-code, to bake in, to make un-removable. And here is the thing that makes Pi Pi: almost none of it is baked in. The safety gate is not a special case in the loop. The subagent dispatcher is not a privileged module. They are all the same shape — the shape you are about to build with. Pi's own README states the thesis in three words: **everything is an extension.**

This is the last layer, and it is the one that dissolves all the others. Once you see it, you stop asking "what can Pi do?" and start asking "what do I want it to do?" — because the answer is the same code path either way.

## The missing piece: a small core can't be everything to everyone

Here is the tension the previous chapters left unresolved. A coding agent is used by a security team that needs every `bash` call logged; by a researcher who wants their vector store consulted before every model call; by a company whose LLM lives behind an SSO proxy; by someone who just wants a `/standup` slash command. No core can ship all of that. If the maintainers try, the core bloats into a swamp of half-relevant flags, and it *still* misses your specific need.

The only escape is to make the core small and give it a **surface** — a set of places where outside code can plug in and change behavior. Pi's answer is a single extension model, powerful enough that the maintainers build Pi's own features with it. If the framework can implement its safety layer as an extension, so can you.

[[fig: A hand-drawn diagram titled "Small core, big surface". Center: a small yellow-hatch rounded box labeled in black "PI CORE (loop + tools + session)". Radiating outward, a ring of purple boxes each labeled: "registerTool", "registerCommand", "registerProvider", "registerShortcut", "registerFlag", "registerMessageRenderer", "pi.on(event)". A blue dashed arc labels the whole ring "the pi.* API surface". Outside the ring, three orange sticky-note extensions ("safety logger", "RAG memory", "corporate SSO") reach in with thin dashed arrows to the plug points they use. A red handwritten note points at the core: "the core never grows — the ring does". A dashed takeaway box: "you adapt Pi to you by plugging into the surface, not editing the core." White background, hand-lettered Excalidraw style. || Pi keeps a small core and exposes a wide plug-in surface. Extensions attach at that surface, so the core never has to grow to fit you.]]

## What an extension actually is

Strip away the ceremony and a Pi extension is one function. You write a TypeScript module whose default export receives the API object, conventionally named `pi`:

```ts
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  // register things, subscribe to events — that's it
}
```

That is the entire contract, defined in `packages/coding-agent/src/core/extensions/types.ts`. The function may be sync or async. When it runs, it is handed `pi`, and it uses `pi` to do two kinds of thing: **register** new capabilities, and **subscribe** to events in the agent's life. Nothing more. The smallness is the point.

Pi finds your extension in one of four ways, all handled by `packages/coding-agent/src/core/extensions/loader.ts`. It scans `~/.pi/agent/extensions/*.ts` for **global** extensions that apply everywhere. It scans `.pi/extensions/*.ts` for **project-local** ones — but only *after the trust gate*, because a project-local extension is arbitrary code from a repo you may have just cloned.[[sn: The order matters and it is deliberate. Project extensions load behind the same `project_trust` gate discussed in [the execution environment](pi-the-execution-environment.html): an untrusted folder's `.pi/extensions/` never runs until you say yes. A cloned repo cannot hijack your agent on first open.]] You can point at one directly with the `-e <path>` flag. And you can list them in `settings.json` under `extensions` or `packages`, where a package can be a local path, an `npm:` name, or a `git:` URL. Loading itself uses **jiti**, so a `.ts` extension runs with no build step — you drop in a file and it just works.

[[sn: `jiti` is a just-in-time TypeScript loader. It means your extension needs no compilation, no `tsc`, no bundler — Pi imports the `.ts` file at runtime and calls its default export. The friction from "idea" to "running extension" is a single saved file.]]

## The register* verbs: adding new capabilities

The first half of `pi` is a set of `register*` methods, each one adding a kind of capability the core knows how to host but doesn't ship on its own.

**`registerTool`** adds an LLM-callable tool — the same kind the model uses for reading and editing. You give it a name, a label, a `description` for the model, a TypeBox `parameters` schema, and an `execute` function.[[sn: There is a lovely detail here: a custom tool can supply a `promptSnippet` and `promptGuidelines`. When present, Pi injects that one-liner into the "Available tools" section of the system prompt, so the model learns your tool exists the same way it learns about `bash`. Your tool becomes a first-class citizen, not a bolt-on.]] This is exactly how Pi's own file and shell tools are shaped, which is why a tool you write is indistinguishable to the model from one that ships in the box.

**`registerCommand`** adds a slash command — `/deploy`, `/review`, whatever you like — with argument completions. **`registerShortcut`** binds a `KeyId` to a handler. **`registerFlag`** adds a CLI flag you later read with `pi.getFlag(name)`. **`registerMessageRenderer`** teaches the TUI how to draw a custom message type, so your extension can put rich output on screen.

And **`registerProvider`** — this is the big one — registers an entire LLM provider: base URL, API key, the list of models, even an OAuth login flow. The type doc in `types.ts` shows the shape directly:

```ts
pi.registerProvider("corporate-ai", {
  baseUrl: "https://ai.corp.com",
  api: "openai-responses",
  models: [...],
  oauth: {
    name: "Corporate AI (SSO)",
    async login(callbacks) { ... },
    async refreshToken(credentials) { ... },
    getApiKey(credentials) { return credentials.access; },
  },
});
```

Sit with that. A user can teach Pi to talk to a model it has never heard of — behind their company's single sign-on — in one file, with no change to Pi itself. The core never learns about "corporate-ai"; it just hosts whatever the surface hands it.

Alongside registration, `pi` exposes session actions — `sendMessage`, `sendUserMessage`, `appendEntry`, `setSessionName` — and tool management via `getActiveTools` / `setActiveTools`, so an extension can drive the conversation and reshape the live toolset, not just add to it.

## The other half: pi.on, the ~31 lifecycle events

Registration adds new things. **Events** let you change *existing* things — and this is where the real power lives. As the agent runs, it fires a stream of lifecycle events, and `pi.on(EVENT, handler)` lets you listen. There are about thirty-one in `types.ts`, and the list reads like a map of the agent's inner life.

[[fig: A hand-drawn timeline titled "The lifecycle events, in order", drawn as a left-to-right arrow with labeled tick marks. Marks from left to right, each a small box: (1) blue "session_start", (2) blue "before_agent_start", (3) orange "context — rewrite messages before the LLM call", (4) blue "before_provider_request", (5) blue "turn_start", (6) purple "message_start / update / end", (7) red "tool_call — BLOCKABLE", (8) blue "tool_execution_start / end", (9) green "tool_result — modifiable", (10) blue "turn_end", (11) orange "session_before_compact — custom handoff", (12) blue "session_shutdown". Above the arrow a red bracket over marks 7 and 11 labeled "cancellable / blockable — safety + policy plug in HERE". A dashed takeaway box: "you don't patch the loop — you subscribe to it." White background, hand-lettered, numbered circles. || Pi's agent loop emits ~31 lifecycle events. Extensions subscribe with pi.on; the blockable ones — tool_call, the session_before_* family — are where safety and policy attach.]]

A handler receives the event object and a context, and for many events the value it *returns* changes what happens next. Four events carry most of the weight:

**`context`** fires right before the LLM call, and it hands you the full message array:

```ts
pi.on("context", (event) => {
  // event.messages: AgentMessage[]  — the exact turn about to be sent
  return { messages: rewritten };   // return to replace them
});
```

This one line is a whole category of feature. Want retrieval-augmented generation? Consult your vector store here and splice the results in. Want a memory system? Inject remembered facts before the model ever sees the turn. The model's entire perception of the conversation passes through this hook, and you may rewrite it.

**`tool_call`** fires before a tool runs, and its result type has a `block` field:

```ts
pi.on("tool_call", (event) => {
  if (isDangerous(event.input)) {
    return { block: true, reason: "blocked by policy" };
  }
  // to *modify* args instead: mutate event.input in place
});
```

Stop and recognize this. **The entire [tool-safety chapter](pi-tool-safety.html) plugged in exactly here.** The permission gate is not a hard-wired branch inside the loop — it is a `tool_call` handler that returns `{ block: true }`. Which means *your* safety policy, your SIEM logger, your "never touch production" rule, attaches at the same seam, with equal standing.

**`session_before_compact`** lets you intercept compaction — supply your own summary, or implement a custom handoff to a fresh session instead of the default squeeze. **`tool_result`** lets you rewrite a tool's output before the model sees it (truncate, redact, annotate). And there are more for every phase: `turn_start` / `turn_end`, `before_provider_request` / `after_provider_response`, `message_start` / `update` / `end`, `agent_start` / `agent_end`, `session_start`, `session_shutdown`.

One more surface ties extensions to each other: `pi.events`, a shared `EventBus` with its own `on` / `emit`. Two extensions that know nothing of each other's code can still coordinate through it. The plug-in surface is not just Pi-to-extension; it is extension-to-extension.

## Skills: extensibility for the model, not the code

Extensions extend the *harness*. But there is a second, quieter form aimed at the *model* — **skills**, in `packages/coding-agent/src/core/skills.ts`. A skill needs no code at all. It is a Markdown file: a `SKILL.md` at the root of a directory, or a standalone `.md`, carrying frontmatter with three fields — `name`, `description` (up to 1024 characters), and an optional `disable-model-invocation` flag. Skills live in `~/.pi/agent/skills/` and `.pi/skills/`, mirroring the extension paths.

The elegant part is *how* a skill reaches the model. Pi does not dump the skill's body into the prompt. It emits only a compact index — the `formatSkillsForPrompt` function builds an `<available_skills>` block with just each skill's name, description, and file location:

```
<available_skills>
  <skill>
    <name>pdf-forms</name>
    <description>Fill and flatten PDF forms with pdftk...</description>
    <location>/home/you/.pi/agent/skills/pdf-forms/SKILL.md</location>
  </skill>
</available_skills>
```

The block is preceded by one instruction: *"Use the read tool to load a skill's file when the task matches its description."* That is the whole mechanism. The model sees a menu of one-line descriptions; when a task actually matches, it uses the ordinary `read` tool to pull the full body on demand. This is **progressive disclosure**: pay a few tokens per skill to advertise it, pay the full cost only when it is used.

[[fig: A two-panel hand-drawn diagram titled "Progressive disclosure of a skill". LEFT panel labeled "(A) always in the prompt — cheap": a small green box holding three one-line rows "name · description · location", labeled in blue "the <available_skills> index — a few tokens each". RIGHT panel labeled "(B) loaded on demand — only when matched": a large purple box drawn as a long scroll labeled "full SKILL.md body (steps, code, examples)", reached by an orange arrow from the model labeled "read(location)". Between the panels a red note: "the body is NOT in the prompt until the model asks for it". A dashed takeaway box: "advertise cheaply, load fully only on a match — context stays lean." White background, hand-lettered, numbered circles (1) on the index, (2) on the read. || Skills use progressive disclosure: only name, description, and location sit in the prompt. The model reads the full body with the ordinary read tool when a task matches — so an unused skill costs almost nothing.]]

Notice this reuses machinery you already have. The model loads a skill with the same `read` tool it uses for source files — no new primitive, no special skill-runner. A skill is just a document the model knows how to find and open when it is relevant.

## The thesis, closed

Step back and look at the whole surface at once.

[[fig: A hand-drawn "surface map" titled "The ExtensionAPI, at a glance". A large rounded box divided into three labeled regions. Region 1 (purple, top-left) "REGISTER — add capabilities": a list "registerTool · registerCommand · registerShortcut · registerFlag · registerProvider · registerMessageRenderer". Region 2 (blue, top-right) "ON — subscribe to the loop": a list "context · tool_call (block) · tool_result · session_before_compact · turn_start/end · before_provider_request · agent_start/end · session_start/shutdown". Region 3 (green, bottom) "ACT + COORDINATE": "sendMessage · appendEntry · setActiveTools · pi.events bus". Around the box, four orange sticky notes labeled "safety layer", "RAG memory", "custom provider", "subagents" each with a dashed arrow into the region it uses. A red banner across the top: "one function: export default (pi) => {…}". A dashed takeaway box: "register + on + act — the entire way Pi becomes anything." White background, hand-lettered Excalidraw. || The ExtensionAPI in one view: register* verbs add capabilities, pi.on subscribes to ~31 lifecycle events, and session actions plus the pi.events bus let extensions act and coordinate. Pi's own big features are built from exactly this.]]

That is the answer to the tension we opened with. The core stays small because it doesn't try to be everything; it exposes `register*` to add capabilities, `pi.on` to reshape the loop, and session actions to drive the conversation — and then Pi builds its *own* features out of that same surface. The safety gate is a `tool_call` handler. A memory system is a `context` handler. A corporate model is a `registerProvider`. A domain workflow is a skill the model reads on demand.

You do not fork Pi to make it yours. You write one function, drop one Markdown file, and the agent bends to your world. That is the whole thesis of the layer, and of the harness: **you adapt Pi to you, not the other way around.** The tour is complete — return to [how it all fits](pi-how-it-all-fits.html) to see the layers assembled, now that you know the seam every one of them was built on.
