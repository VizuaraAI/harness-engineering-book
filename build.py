#!/usr/bin/env python3
"""Kernel Engineering static site generator.

Two surfaces:
  - SHELL (sidebar + top bar): Modal-glossary dark terminal green, always present.
  - CANVAS: dark green for landing/section indexes; warm-white "bearblog Tufte" for articles.

Reads manifest.json + articles/<slug>.md, writes a complete static site into docs/.
Custom markdown extensions:
  [[fig: <excalidraw prompt> || <caption>]]   -> hand-drawn figure (file: figures/<slug>-<n>.png)
  [[sn: <note text>]]                          -> Tufte margin sidenote (numbered, red superscript)
Run:  python3 build.py
"""
import json, os, re, html, shutil, pathlib

ROOT = pathlib.Path(__file__).parent
DOCS = ROOT / "docs"
ART = ROOT / "articles"
MAN = json.loads((ROOT / "manifest.json").read_text())
SITE = MAN["site"]
MENTOR = json.loads((ROOT / "mentor_manifest.json").read_text())
MENTOR_DIR = ROOT / "mentor"
MFLAT = []
for _p in MENTOR["parts"]:
    for _c in _p["chapters"]:
        MFLAT.append({**_c, "part_id": _p["id"], "part_num": _p["num"], "part_title": _p["title"]})

# ----- flatten article order for prev/next + lookups -----
FLAT = []
for sec in MAN["sections"]:
    for a in sec["articles"]:
        FLAT.append({**a, "section_id": sec["id"], "section_num": sec["num"], "section_title": sec["title"]})
SLUG2IDX = {a["slug"]: i for i, a in enumerate(FLAT)}

# ============================================================ markdown
def esc(s): return html.escape(s, quote=False)

def inline(text, ctx):
    """Inline formatting. Sidenotes are stashed so inline_basic()'s escaping
    doesn't mangle their generated HTML, then restored afterwards."""
    stash = []
    def sn(m):
        ctx["sn"] += 1
        n = ctx["sn"]
        note = inline_basic(m.group(1).strip())
        stash.append(
            f'<label for="sn-{ctx["slug"]}-{n}" class="sn-ref">{n}</label>'
            f'<input type="checkbox" id="sn-{ctx["slug"]}-{n}" class="sn-toggle">'
            f'<span class="sidenote"><sup>{n}</sup> {note}</span>')
        return f"\x01{len(stash)-1}\x01"
    text = re.sub(r"\[\[sn:\s*(.+?)\]\]", sn, text, flags=re.S)
    text = inline_basic(text)
    text = re.sub(r"\x01(\d+)\x01", lambda m: stash[int(m.group(1))], text)
    return text

def inline_basic(text):
    # inline code (protect), then links, bold, italic
    codes = []
    def stash(m):
        codes.append(m.group(1)); return f"\x00{len(codes)-1}\x00"
    text = re.sub(r"`([^`]+)`", stash, text)
    text = esc(text)
    text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)",
                  lambda m: f'<a href="{esc(m.group(2))}" target="_blank" rel="noopener">{m.group(1)}</a>', text)
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])", r"<em>\1</em>", text)
    text = re.sub(r"\x00(\d+)\x00", lambda m: f"<code>{esc(codes[int(m.group(1))])}</code>", text)
    return text

def md_to_html(md, slug):
    ctx = {"slug": slug, "sn": 0, "fig": 0}
    lines = md.replace("\r\n", "\n").split("\n")
    out, i, n = [], 0, len(lines)
    while i < n:
        line = lines[i]
        # fenced code
        if line.strip().startswith("```"):
            lang = line.strip()[3:].strip()
            i += 1; buf = []
            while i < n and not lines[i].strip().startswith("```"):
                buf.append(lines[i]); i += 1
            i += 1
            out.append(f'<pre class="code" data-lang="{esc(lang)}"><code>{esc(chr(10).join(buf))}</code></pre>')
            continue
        # callout note  [[note: TYPE || content]]
        if line.strip().startswith("[[note:"):
            buf = [line]
            while "]]" not in buf[-1] and i + 1 < n:
                i += 1; buf.append(lines[i])
            i += 1
            raw = " ".join(buf).strip()
            mm = re.match(r"\[\[note:\s*(\w+)\s*\|\|\s*(.+?)\]\]\s*$", raw, flags=re.S)
            if mm:
                typ = mm.group(1).lower(); content = inline(mm.group(2).strip(), ctx)
            else:
                typ = "teach"; content = inline(raw[7:].strip().rstrip("]").strip(), ctx)
            cmeta = {"metaphor": ("🧠", "Metaphor"), "example": ("🔢", "By hand"),
                     "production": ("🏭", "In production today"), "teach": ("🎓", "Teaching note"),
                     "say": ("🎤", "Say this at the board"), "demo": ("▶️", "Live demo"),
                     "confusion": ("⚠️", "Where students trip"), "aha": ("✨", "The click")}
            icon, label = cmeta.get(typ, ("🎓", "Note"))
            out.append(f'<div class="cal cal-{typ}"><div class="cal-h"><span class="cal-i">{icon}</span> {label}</div>'
                       f'<div class="cal-b">{content}</div></div>')
            continue
        # figure (own line/block, may span lines until closing ]])
        if line.strip().startswith("[[fig:"):
            buf = [line];
            while "]]" not in buf[-1] and i + 1 < n:
                i += 1; buf.append(lines[i])
            i += 1
            raw = " ".join(buf).strip()
            m = re.match(r"\[\[fig:\s*(.+?)\]\]\s*$", raw, flags=re.S)
            body = m.group(1) if m else raw[6:]
            if "||" in body:
                prompt, cap = body.split("||", 1)
            else:
                prompt, cap = body, ""
            ctx["fig"] += 1
            fname = f"{slug}-{ctx['fig']}.png"
            caph = inline_basic(cap.strip())
            out.append(
                f'<figure class="fig"><div class="fig-frame">'
                f'<img src="../figures/{fname}" alt="{esc(cap.strip()[:120])}" loading="lazy" '
                f'onerror="this.parentNode.classList.add(&#39;fig-missing&#39;);this.remove();" '
                f'data-fig="{fname}">'
                f'<span class="fig-ph">figure rendering &middot; {esc(cap.strip()[:70])}</span>'
                f'</div>' + (f'<figcaption>{caph}</figcaption>' if cap.strip() else '') + '</figure>')
            continue
        # heading
        m = re.match(r"^(#{1,4})\s+(.*)$", line)
        if m:
            lvl = len(m.group(1)); txt = inline(m.group(2).strip(), ctx)
            hid = re.sub(r"[^a-z0-9]+", "-", m.group(2).strip().lower()).strip("-")
            out.append(f'<h{lvl} id="{hid}">{txt}</h{lvl}>')
            i += 1; continue
        # blockquote
        if line.strip().startswith(">"):
            buf = []
            while i < n and lines[i].strip().startswith(">"):
                buf.append(lines[i].strip()[1:].strip()); i += 1
            out.append(f'<blockquote>{inline(" ".join(buf), ctx)}</blockquote>')
            continue
        # table
        if "|" in line and i + 1 < n and re.match(r"^\s*\|?[\s:\-|]+\|[\s:\-|]*$", lines[i+1]):
            header = [c.strip() for c in line.strip().strip("|").split("|")]
            i += 2; rows = []
            while i < n and "|" in lines[i] and lines[i].strip():
                rows.append([c.strip() for c in lines[i].strip().strip("|").split("|")]); i += 1
            th = "".join(f"<th>{inline(c, ctx)}</th>" for c in header)
            trs = "".join("<tr>" + "".join(f"<td>{inline(c, ctx)}</td>" for c in r) + "</tr>" for r in rows)
            out.append(f'<div class="tbl-wrap"><table><thead><tr>{th}</tr></thead><tbody>{trs}</tbody></table></div>')
            continue
        # unordered list
        if re.match(r"^\s*[-*]\s+", line):
            buf = []
            while i < n and re.match(r"^\s*[-*]\s+", lines[i]):
                buf.append(inline(re.sub(r"^\s*[-*]\s+", "", lines[i]), ctx)); i += 1
            out.append("<ul>" + "".join(f"<li>{x}</li>" for x in buf) + "</ul>")
            continue
        # ordered list
        if re.match(r"^\s*\d+\.\s+", line):
            buf = []
            while i < n and re.match(r"^\s*\d+\.\s+", lines[i]):
                buf.append(inline(re.sub(r"^\s*\d+\.\s+", "", lines[i]), ctx)); i += 1
            out.append("<ol>" + "".join(f"<li>{x}</li>" for x in buf) + "</ol>")
            continue
        # blank
        if not line.strip():
            i += 1; continue
        # paragraph (gather until blank)
        buf = [line]; i += 1
        while i < n and lines[i].strip() and not re.match(r"^(#{1,4}\s|>|\s*[-*]\s|\s*\d+\.\s|```|\[\[fig:)", lines[i]):
            buf.append(lines[i]); i += 1
        out.append(f"<p>{inline(' '.join(buf), ctx)}</p>")
    return "\n".join(out)

# ============================================================ shell
def sidebar(active_slug, rel):
    rows = [f'<a class="sb-home" href="{rel}index.html">‹ kernel engineering</a>']
    for sec in MAN["sections"]:
        open_sec = any(a["slug"] == active_slug for a in sec["articles"])
        rows.append(f'<details class="sb-sec"{" open" if open_sec else ""}>')
        rows.append(f'<summary><span class="sb-num">{sec["num"]}</span> {esc(sec["title"])}</summary>')
        for a in sec["articles"]:
            act = " active" if a["slug"] == active_slug else ""
            chip = f'<span class="chip">{esc(a["chip"])}</span>' if a["chip"] else ""
            rows.append(f'<a class="sb-item{act}" href="{rel}a/{a["slug"]}.html">{esc(a["title"])}{chip}</a>')
        rows.append("</details>")
    return '<nav class="sidebar" id="sidebar">' + "".join(rows) + "</nav>"

def shell(title, main_html, active_slug=None, rel="", canvas="dark", extra_head="",
          with_sidebar=False, active_nav="", sb_kind="book"):
    def nl(href, label, key):
        return f'<a class="tn{" active" if key==active_nav else ""}" href="{rel}{href}">{label}</a>'
    topnav = (nl("book.html", "The Book", "book") + nl("workshop.html", "Workshop", "workshop")
              + nl("projects.html", "Projects", "projects") + nl("interactive.html", "Interactive", "interactive")
              + nl("mentor/index.html", "Mentor Guide", "mentor"))
    if with_sidebar:
        sb = mentor_sidebar(active_slug, rel) if sb_kind == "mentor" else sidebar(active_slug, rel)
    else:
        sb = ""
    layout_cls = "layout" if with_sidebar else "layout nosb"
    return f"""<!doctype html><html lang="en" data-theme="terminal"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(SITE['tagline'])}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,400;0,500;0,700;1,400&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{rel}assets/app.css">{extra_head}
</head><body class="canvas-{canvas}{' has-sb' if with_sidebar else ''}">
<div class="topbar">
  <a class="brand" href="{rel}index.html"><img class="brand-mark" src="{rel}assets/logo.png" alt="" onerror="this.style.display='none'"><span class="brand-txt">Vizuara <b>Kernel&nbsp;Engineering</b></span></a>
  <nav class="topnav">{topnav}</nav>
  {'<button class="menu-btn" onclick="document.body.classList.toggle(&#39;sb-open&#39;)">☰</button>' if with_sidebar else ''}
  <div class="top-links">
    <button class="tbtn icon" id="search-open" title="Search (⌘K)">⌘K</button>
    <button class="tbtn" id="theme-btn">Terminal</button>
    <a class="tbtn enroll" href="{rel}workshop.html">Enroll →</a>
  </div>
</div>
<div class="{layout_cls}">
{sb}
<main class="content">{main_html}</main>
</div>
<div class="search-modal" id="search-modal"><div class="search-box">
  <input id="search-input" placeholder="Search articles, terms, kernels…" autocomplete="off">
  <div id="search-results"></div>
  <div class="search-hint">↑↓ to navigate · ↵ to open · esc to close</div>
</div></div>
<script>window.SEARCH_BASE="{rel}";</script>
<script src="{rel}assets/app.js"></script>
</body></html>"""

# ============================================================ pages
def build_article(a, idx):
    slug = a["slug"]
    md_path = ART / f"{slug}.md"
    if md_path.exists():
        body = md_to_html(md_path.read_text(), slug)
        stub = ""
    else:
        body = (f'<p class="lead">{esc(a["blurb"])}</p>'
                f'<div class="stub">This worklog is being written. It will follow the '
                f'hypothesis → measure → figure rhythm of the rest of the site.</div>')
        stub = " stub"
    prev_a = FLAT[idx-1] if idx > 0 else None
    next_a = FLAT[idx+1] if idx < len(FLAT)-1 else None
    nav = '<div class="prevnext">'
    nav += (f'<a class="pn prev" href="{prev_a["slug"]}.html"><span>‹ previous</span>{esc(prev_a["title"])}</a>'
            if prev_a else '<span></span>')
    nav += (f'<a class="pn next" href="{next_a["slug"]}.html"><span>next ›</span>{esc(next_a["title"])}</a>'
            if next_a else '<span></span>')
    nav += "</div>"
    chip = f'<span class="chip lg">{esc(a["chip"])}</span>' if a["chip"] else ""
    art = f"""<article class="worklog{stub}">
<div class="art-kicker"><span class="art-sec">{a['section_num']} · {esc(a['section_title'])}</span></div>
<h1 class="art-title">{esc(a['title'])} {chip}</h1>
<div class="art-body">{body}</div>
{nav}
</article>"""
    html_out = shell(f"{a['title']} · {SITE['title']}", art, active_slug=slug, rel="../",
                     canvas="paper", with_sidebar=True, active_nav="book")
    (DOCS / "a" / f"{slug}.html").write_text(html_out)

def build_section(sec, rel="../"):
    cards = []
    for a in sec["articles"]:
        chip = f'<span class="chip">{esc(a["chip"])}</span>' if a["chip"] else ""
        cards.append(
            f'<a class="idx-item" href="{rel}a/{a["slug"]}.html">'
            f'<div class="idx-arrow">→</div><div class="idx-txt">'
            f'<div class="idx-title">{esc(a["title"])}{chip}</div>'
            f'<div class="idx-blurb">{esc(a["blurb"])}</div></div></a>')
    main = f"""<div class="section-page">
<div class="crumb">/ {sec['id']}</div>
<h1 class="sec-h1"><span class="sec-num">{sec['num']}</span> {esc(sec['title'])}</h1>
<p class="sec-blurb">{esc(sec['blurb'])}</p>
<div class="idx-list">{''.join(cards)}</div>
</div>"""
    html_out = shell(f"{sec['title']} · {SITE['title']}", main, rel=rel, canvas="dark",
                     with_sidebar=True, active_nav="book")
    (DOCS / "s" / f"{sec['id']}.html").write_text(html_out)

AREAS = [
    ("book.html", "01", "The Book", "The full knowledge base — an illustrated worklog that builds a coding-agent harness from scratch, in the spirit of pi: the loop, tools, context engine, durability and orchestration.",
     f"{len(FLAT)} chapters"),
    ("workshop.html", "02", "The Workshop", "Vizuara's five-day live Harness Engineering cohort. Each day builds one layer of your own pi-style harness, with the full book included.",
     "5 days · 5 layers"),
    ("projects.html", "03", "Projects", "Build it with your hands — the bare loop, real file & shell tools, a context engine that compacts and remembers, checkpointed recovery, and your own harness capstone.",
     "guided builds"),
    ("interactive.html", "04", "Interactive", "Practice, not just read: per-section quizzes on the loop, tools, context, durability and orchestration.",
     "quizzes"),
]

def build_index():
    area_cards = "".join(
        f'<a class="area" href="{href}"><div class="area-num">{num}</div>'
        f'<div class="area-title">{esc(title)}</div>'
        f'<div class="area-blurb">{esc(blurb)}</div>'
        f'<div class="area-meta">{esc(meta)} <span class="area-go">→</span></div></a>'
        for href, num, title, blurb, meta in AREAS)
    main = f"""<div class="home">
<section class="hero2">
  <div class="hero2-logo"><img src="assets/logo.png" alt="Vizuara Harness Engineering" onerror="this.style.display='none'"></div>
  <div class="eyebrow">Vizuara AI Labs</div>
  <h1>Vizuara <span class="hl">Harness Engineering</span></h1>
  <p class="sub">{esc(SITE['tagline'])} A worklog that builds a real coding agent from an empty file — the loop, the tools, the context engine, the recovery, the orchestration — every layer built and explained by hand.</p>
  <div class="hero-cta">
    <a class="btn solid" href="book.html">Read the book →</a>
    <a class="btn" href="workshop.html">The workshop</a>
  </div>
</section>
<section class="areas">{area_cards}</section>
<section class="home-foot">
  <div class="skill-pitch">
    <h2>Models are commodities. The harness is the product.</h2>
    <p>Everyone calls the same APIs. What separates Claude Code, pi and Hermes from a thousand dead demos is everything wrapped <em>around</em> the model: the loop that keeps it working, the tools that let it act, the context machinery that keeps it sane, and the recovery systems that keep it alive. This book builds all five layers from scratch.</p>
    <div style="display:flex;gap:12px;flex-wrap:wrap">
      <a class="btn" href="a/prompt-vs-context-vs-harness.html">Prompt vs. context vs. harness →</a>
    </div>
  </div>
</section>
</div>"""
    (DOCS / "index.html").write_text(shell(f"Vizuara Harness Engineering · {esc(SITE['tagline'])}", main, rel="", canvas="dark", active_nav=""))

def build_workshop():
    days = [
        ("Day 1", "The Anatomy of a Harness", "Why 'just call the API' fails; prompt vs. context vs. harness engineering; the agent loop from first principles. Build: a bare harness — model client, message array, and a hand-rolled loop."),
        ("Day 2", "Tools & the Execution Environment", "Tool schemas as contracts; read / write / edit / bash / search; permission gates and approval modes; sandboxing and the blast radius. Build: real file and shell tools wired into your loop, safely."),
        ("Day 3", "Context Engineering Inside the Harness", "Context budgets; compaction and summarization; memory and the CLAUDE.md pattern; system prompts as infrastructure. Build: compaction plus a persistent memory layer that survives a long session."),
        ("Day 4", "Durability, Recovery & Orchestration", "Checkpointing every turn and tool call; replay on restart; self-healing loops; sub-agents and handoffs; supervision and human-in-the-loop. Build: checkpointed execution and a sub-agent dispatcher with an approval gate."),
        ("Day 5", "Production Harnesses & Capstone", "pi, Hermes and Claude Code internals; how to evaluate a harness. Capstone: assemble the loop, tools, context engine, recovery and orchestration into your own pi-style harness and demo it live."),
    ]
    day_html = "".join(
        f'<div class="lec"><div class="lec-tag">{t}</div><div><div class="lec-title">{esc(ti)}</div>'
        f'<div class="lec-desc">{esc(d)}</div></div></div>' for t, ti, d in days)
    main = f"""<div class="section-page workshop">
<div class="crumb">/ the-workshop</div>
<h1 class="sec-h1">The Harness Engineering Workshop</h1>
<p class="sec-blurb">Five live mornings. Each day builds one layer of your own coding harness, in the spirit of <a href="https://pi.dev" target="_blank" rel="noopener">pi</a> — from a bare loop to a durable, orchestrated agent you demo on Friday. Enrolled students get the complete {len(FLAT)}-chapter <a href="book.html">book</a>, the <a href="interactive.html">quizzes</a>, and the <a href="projects.html">guided build projects</a>.</p>
<h2 class="ws-h2">5 live days <span class="ws-sub">one layer per day · 7:00–9:00 AM IST</span></h2>
<div class="lec-grid">{day_html}</div>
<div class="ws-cta">
  <div class="ws-price">You leave with your own working coding agent</div>
  <a class="btn solid" href="https://harnessengineering.vizuara.ai" target="_blank" rel="noopener">Enrollment &amp; dates →</a>
  <p class="ws-note">Questions? <a href="mailto:team@vizuara.com">team@vizuara.com</a></p>
</div>
</div>"""
    (DOCS / "workshop.html").write_text(shell("The Harness Engineering Workshop · Vizuara", main, rel="", canvas="dark", active_nav="workshop"))

def build_book():
    chapters = []
    for sec in MAN["sections"]:
        arts = "".join(
            f'<a href="a/{a["slug"]}.html" class="ch-art">{esc(a["title"])}'
            + (f'<span class="chip">{esc(a["chip"])}</span>' if a["chip"] else "") + '</a>'
            for a in sec["articles"])
        chapters.append(
            f'<div class="chapter"><div class="ch-side"><div class="ch-num">{sec["num"]}</div>'
            f'<a class="ch-title" href="s/{sec["id"]}.html">{esc(sec["title"])}</a>'
            f'<div class="ch-count">{len(sec["articles"])} chapters ›</div></div>'
            f'<div class="ch-body"><p class="ch-blurb">{esc(sec["blurb"])}</p>'
            f'<div class="ch-arts">{arts}</div></div></div>')
    main = f"""<div class="section-page book-page">
<div class="crumb">/ the-book</div>
<h1 class="sec-h1">The Harness Engineering Book</h1>
<p class="sec-blurb">The complete knowledge base behind Vizuara's Harness Engineering — {len(FLAT)} illustrated chapters that build a coding-agent harness from scratch, in the spirit of pi. Each is written from first principles and cross-linked to the chapters it needs. Start anywhere.</p>
<a class="btn" href="a/how-to-use-this-site.html" style="margin-bottom:8px;display:inline-block">How to read this book →</a>
<div class="chapters">{''.join(chapters)}</div>
</div>"""
    (DOCS / "book.html").write_text(shell("The Harness Engineering Book · Vizuara", main, rel="", canvas="dark", active_nav="book"))

PROJECTS = [
    ("The bare loop", "day 1", "Build the smallest thing that is genuinely an agent: a model client, a message array, and a hand-rolled loop that calls the model, runs the tool it asks for, and repeats until the work is done.",
     [("The agent loop", "a/the-agent-loop-from-first-principles.html"), ("Your first bare harness", "a/your-first-bare-harness.html")]),
    ("Give it hands", "day 2", "Wire real read / write / edit / bash tools into the loop with strict schemas, then add a permission gate and a sandbox so your harness edits actual code on your machine, safely.",
     [("Tools as contracts", "a/tool-schemas-as-contracts.html"), ("Permission gates", "a/permission-gates-and-approval-modes.html")]),
    ("The context engine", "day 3", "Add compaction plus a persistent memory layer so your harness survives a 200-turn session without losing the plot and starts each run already knowing the project.",
     [("Compaction & summarization", "a/compaction-and-summarization.html"), ("Build the context engine", "a/building-the-context-engine.html")]),
    ("Make it durable", "day 4", "Checkpoint every model turn and tool call so a crashed session replays instead of re-running, then add self-healing retries. Kill the process mid-run and watch it resume.",
     [("Durable execution", "a/durable-execution-and-checkpointing.html"), ("Replay & resume", "a/replay-and-resumable-sessions.html")]),
    ("Dispatch sub-agents", "day 4", "When one context can't hold the job, spawn a focused sub-agent, let it work, and return only its conclusion — behind a supervisor and a human-in-the-loop approval gate.",
     [("Sub-agents & handoffs", "a/sub-agents-and-handoffs.html"), ("Human-in-the-loop", "a/human-in-the-loop.html")]),
    ("Your own harness (capstone)", "capstone", "Assemble the loop, tools, context engine, durability and orchestration into your own pi-style coding agent, evaluate it, and demo it live. Yours forever.",
     [("Evaluating a harness", "a/evaluating-a-harness.html"), ("The capstone", "a/the-capstone.html")]),
]

def build_projects():
    cards = ""
    for title, level, what, links in PROJECTS:
        lk = " ".join(f'<a href="{h}">{esc(l)} →</a>' for l, h in links)
        cards += (f'<div class="proj"><div class="proj-top"><span class="proj-level lvl-{level}">{level}</span></div>'
                  f'<h3>{esc(title)}</h3><p>{esc(what)}</p><div class="proj-links">{lk}</div></div>')
    main = f"""<div class="section-page">
<div class="crumb">/ projects</div>
<h1 class="sec-h1">Projects</h1>
<p class="sec-blurb">Reading is not enough — a harness is learned by building it. Each project is one layer you build with your hands, pointed at the exact chapters that carry it. Do them in order across the five days, and by the end you have your own working coding agent.</p>
<div class="proj-grid">{cards}</div>
<div class="ws-cta">
  <div class="ws-price">Build it live with us across five mornings</div>
  <a class="btn solid" href="workshop.html">See the Harness Engineering Workshop →</a>
</div>
</div>"""
    (DOCS / "projects.html").write_text(shell("Projects · Vizuara Harness Engineering", main, rel="", canvas="dark", active_nav="projects"))

QUIZ = [
    ("What best describes the difference between a model and a harness?",
     ["The harness is a bigger model", "The harness is the loop, tools, memory and recovery wrapped around the model", "They are the same thing"], 1,
     "A model does transactional inference; the harness is everything around it that turns that into a working agent."),
    ("At its core, the agent loop is…",
     ["A single API call", "Call the model → run the tool it asks for → feed the result back → repeat until done", "A database query"], 1,
     "The whole of agency is that while-loop: the model decides, the harness executes, and the result goes back in."),
    ("In a harness, what actually holds the agent's state between turns?",
     ["A SQL database", "The message array (the running conversation)", "The system prompt only"], 1,
     "The array of typed messages IS the agent's memory-so-far; each turn appends to it."),
    ("A tool, as the model sees it, is essentially…",
     ["A Python decorator", "A name + a JSON-schema for its arguments + a function", "A prompt template"], 1,
     "The schema is the contract between the model and your code — get its shape right and the model calls it correctly."),
    ("Why does a good harness ask before running `rm -rf` or a destructive command?",
     ["To slow the agent down", "A permission gate sits between a tool call and its execution for dangerous actions", "The model can't run commands"], 1,
     "Approval modes / allow-lists are the human-in-the-loop gate that keeps an autonomous agent safe."),
    ("What problem does sandboxing a harness solve?",
     ["It makes the model smarter", "It contains the blast radius of a mistaken or malicious tool call", "It speeds up token streaming"], 1,
     "An agent runs arbitrary commands; the sandbox limits what a bad call can touch."),
    ("Compaction in a harness means…",
     ["Compressing the model weights", "Summarizing old turns into a running summary so a long session fits the window", "Deleting the system prompt"], 1,
     "The context window is finite; compaction keeps a 200-turn session coherent without blowing the budget."),
    ("The CLAUDE.md pattern is about…",
     ["Styling the terminal", "Persistent memory the harness loads every session so the agent starts knowing the project", "A logging format"], 1,
     "It's durable project facts, reloaded each run, so the agent doesn't relearn the codebase every time."),
    ("Durable execution / checkpointing gives a harness…",
     ["Faster inference", "The ability to replay after a crash by returning cached step results instead of re-running", "A smaller model"], 1,
     "Every model turn and tool call is a persisted step; on restart, replay skips the work already done."),
    ("When should a harness spawn a sub-agent?",
     ["On every single tool call", "When one context can't hold the whole job, so a focused helper returns just its conclusion", "Never — it's unsafe"], 1,
     "Sub-agents partition work that won't fit one context; the parent gets the distilled result, not the whole transcript."),
    ("Why is the system prompt described as 'infrastructure, not prose'?",
     ["It should rhyme", "The harness assembles it every turn from tools, rules, state and mode — treat it like code", "It is never sent to the model"], 1,
     "It's the operating manual the harness builds programmatically, not a static personality blurb."),
    ("pi (pi.dev) is notable among harnesses mainly for…",
     ["Being the largest", "Its deliberately minimal surface — extensions + models.json, model-agnostic", "Requiring a GPU cluster"], 1,
     "pi is the proof a real harness can be small: a tiny core plus extensions, any model behind models.json."),
]

def build_interactive():
    qs = ""
    for i, (q, opts, correct, exp) in enumerate(QUIZ):
        obtns = "".join(f'<button class="q-opt" data-i="{j}">{esc(o)}</button>' for j, o in enumerate(opts))
        qs += (f'<div class="quiz-q" data-correct="{correct}"><div class="q-num">Q{i+1}</div>'
               f'<div class="q-text">{esc(q)}</div><div class="q-opts">{obtns}</div>'
               f'<div class="q-exp">{esc(exp)}</div></div>')
    main = f"""<div class="section-page interactive-page">
<div class="crumb">/ interactive</div>
<h1 class="sec-h1">Interactive</h1>
<p class="sec-blurb">Practice, not just reading. Test yourself against the core ideas, then build the harness layer by layer through the guided projects.</p>

<div class="int-panel">
  <div class="int-head"><h2 class="ws-h2">The build-along track</h2></div>
  <p class="int-p">Read three real harnesses, then build your own one layer at a time — the loop, the tools, the context engine, durability, orchestration. Study the case studies alongside your build.</p>
  <div class="int-links">
    <a class="btn" href="https://pi.dev" target="_blank" rel="noopener">pi ↗</a>
    <a class="btn" href="https://hermes-agent.nousresearch.com" target="_blank" rel="noopener">Hermes ↗</a>
    <a class="btn" href="projects.html">The guided builds →</a>
  </div>
</div>

<div class="int-panel">
  <div class="int-head"><h2 class="ws-h2">Quiz yourself</h2><span class="quiz-score" id="quiz-score">0 / {len(QUIZ)}</span></div>
  <p class="int-p">Twelve questions spanning the loop, tools, context, durability and orchestration. Pick an answer to see the explanation.</p>
  <div class="quiz" data-total="{len(QUIZ)}">{qs}</div>
</div>
</div>"""
    (DOCS / "interactive.html").write_text(shell("Interactive · Vizuara Harness Engineering", main, rel="", canvas="dark", active_nav="interactive"))

def mentor_sidebar(active_slug, rel):
    rows = [f'<a class="sb-home" href="{rel}mentor/index.html">‹ mentor handbook</a>']
    for part in MENTOR["parts"]:
        open_p = any(c["slug"] == active_slug for c in part["chapters"])
        rows.append(f'<details class="sb-sec"{" open" if open_p else ""}>')
        rows.append(f'<summary><span class="sb-num">{part["num"]}</span> {esc(part["title"])}</summary>')
        for c in part["chapters"]:
            act = " active" if c["slug"] == active_slug else ""
            rows.append(f'<a class="sb-item{act}" href="{rel}mentor/{c["slug"]}.html">{esc(c["title"])}</a>')
        rows.append("</details>")
    return '<nav class="sidebar" id="sidebar">' + "".join(rows) + "</nav>"

def build_mentor_chapter(ch, idx):
    slug = ch["slug"]
    p = MENTOR_DIR / f"{slug}.md"
    if p.exists():
        body = md_to_html(p.read_text(), slug); stub = ""
    else:
        body = (f'<p class="lead">{esc(ch["blurb"])}</p><div class="stub">This handbook chapter is being '
                f'written — it will teach this from scratch with metaphors, a live-demo plan, and figures.</div>')
        stub = " stub"
    prev_c = MFLAT[idx-1] if idx > 0 else None
    next_c = MFLAT[idx+1] if idx < len(MFLAT)-1 else None
    nav = '<div class="prevnext">'
    nav += (f'<a class="pn prev" href="{prev_c["slug"]}.html"><span>‹ previous</span>{esc(prev_c["title"])}</a>'
            if prev_c else '<span></span>')
    nav += (f'<a class="pn next" href="{next_c["slug"]}.html"><span>next ›</span>{esc(next_c["title"])}</a>'
            if next_c else '<span></span>')
    nav += "</div>"
    art = f"""<article class="worklog mentor{stub}">
<div class="art-kicker"><span class="art-sec">Mentor Handbook · {ch['part_num']} {esc(ch['part_title'])}</span></div>
<h1 class="art-title">{esc(ch['title'])}</h1>
<div class="art-body">{body}</div>
{nav}
</article>"""
    html_out = shell(f"{ch['title']} · Mentor Handbook", art, active_slug=slug, rel="../",
                     canvas="paper", with_sidebar=True, active_nav="mentor", sb_kind="mentor")
    (DOCS / "mentor" / f"{slug}.html").write_text(html_out)

def build_mentor_index():
    parts = []
    for part in MENTOR["parts"]:
        chs = "".join(
            f'<a href="{c["slug"]}.html" class="ch-art">{esc(c["title"])}</a>' for c in part["chapters"])
        parts.append(
            f'<div class="chapter"><div class="ch-side"><div class="ch-num">{part["num"]}</div>'
            f'<div class="ch-title">{esc(part["title"])}</div>'
            f'<div class="ch-count">{len(part["chapters"])} chapters</div></div>'
            f'<div class="ch-body"><p class="ch-blurb">{esc(part["blurb"])}</p>'
            f'<div class="ch-arts">{chs}</div></div></div>')
    total = len(MFLAT)
    main = f"""<div class="section-page book-page mentor-index">
<div class="crumb">/ mentor-handbook</div>
<div class="mentor-badge">For mentors · Dr. Raj Dandekar &amp; Shubham Panchal</div>
<h1 class="sec-h1">The Mentor's Handbook</h1>
<p class="sec-blurb">{esc(MENTOR['subtitle'])} Every chapter teaches the idea from the ground up — plain words, a metaphor, a by-hand example, the real math, where it runs in production today, and a minute-by-minute plan for teaching it. Read it in order; by the end you can deliver the entire workshop. {total} chapters.</p>
<a class="btn" href="mg-how-to-use-this-guide.html" style="margin-bottom:6px;display:inline-block">Start: how to use this handbook →</a>
<div class="chapters">{''.join(parts)}</div>
</div>"""
    (DOCS / "mentor" / "index.html").write_text(shell(f"The Mentor's Handbook · Vizuara {SITE['title']}",
        main, rel="../", canvas="dark", active_nav="mentor"))

def build_partners():
    cards = [
        ("hiring", "A hiring pipeline", "Consider the strongest of each cohort for your kernel-engineering roles: a warm, pre-vetted pool of engineers with exactly the skills on your job descriptions. We are happy to share profiles, worklogs, and capstone results."),
        ("capstone", "Sponsor a capstone", "Give us a real kernel problem your team cares about. We run it as a sponsored capstone, you see the solutions and the talent up close, and your company is credited on the project and to the cohort."),
        ("compute", "GPU credits & partnership", "Sponsor H100 / B200 hours for students' capstone work and become a founding partner, with your logo on the workshop, this site, and every graduate's certificate."),
    ]
    card_html = "".join(
        f'<div class="proj"><div class="proj-top"><span class="proj-level lvl-capstone">{t}</span></div>'
        f'<h3>{esc(ti)}</h3><p>{esc(d)}</p></div>' for t, ti, d in cards)
    main = f"""<div class="section-page">
<div class="crumb">/ partner</div>
<div class="eyebrow">For companies &amp; partners</div>
<h1 class="sec-h1">Partner with Vizuara's Kernel Engineering Workshop</h1>
<p class="sec-blurb">Kernel engineers are one of the hardest hires in AI right now. By the end of a cohort, our graduates have genuinely built a GEMM from naive to <b style="color:var(--lime)">94% of cuBLAS</b>, FlashAttention from scratch, Hopper &amp; Blackwell kernels (TMA, WGMMA, NVFP4), DeepSeek-grade inference kernels, and worked with LLM-driven kernel generation. Here are three ways your company and Vizuara can work together.</p>
<div class="proj-grid">{card_html}</div>
<div class="partners-strip"><span class="ps-label">Founding partners</span><span class="ps-soon">— announced soon —</span></div>
<div class="ws-cta" style="margin-top:28px">
  <div class="ws-price">Become a founding partner</div>
  <a class="btn solid" href="mailto:team@vizuara.com?subject=Kernel%20Engineering%20Workshop%20partnership&amp;body=Hi%20Raj%2C">Partner with us →</a>
  <p class="ws-note">Raj Dandekar, Co-founder &amp; CEO, Vizuara AI Labs · <a href="mailto:team@vizuara.com">team@vizuara.com</a></p>
</div>
</div>"""
    (DOCS / "partners.html").write_text(shell("Partner with Vizuara Kernel Engineering", main, rel="", canvas="dark", active_nav="partner"))

def build_search_index():
    idx = []
    for a in FLAT:
        idx.append({"t": a["title"], "s": a["slug"], "sec": a["section_title"],
                    "chip": a["chip"], "b": a["blurb"], "u": f"a/{a['slug']}.html"})
    for c in MFLAT:
        idx.append({"t": c["title"], "s": c["slug"], "sec": "Mentor Handbook · " + c["part_title"],
                    "chip": "MENTOR", "b": c["blurb"], "u": f"mentor/{c['slug']}.html"})
    (DOCS / "search.json").write_text(json.dumps(idx, ensure_ascii=False))

# ============================================================ main
def main():
    (DOCS / "a").mkdir(parents=True, exist_ok=True)
    (DOCS / "s").mkdir(parents=True, exist_ok=True)
    (DOCS / "figures").mkdir(parents=True, exist_ok=True)
    (DOCS / "assets").mkdir(parents=True, exist_ok=True)
    for src in (ROOT / "assets").glob("*"):
        shutil.copy(src, DOCS / "assets" / src.name)
    (DOCS / "CNAME").write_text(SITE["domain"] + "\n")
    (DOCS / ".nojekyll").write_text("")
    for i, a in enumerate(FLAT):
        build_article(a, i)
    for sec in MAN["sections"]:
        build_section(sec)
    (DOCS / "mentor").mkdir(parents=True, exist_ok=True)
    for i, c in enumerate(MFLAT):
        build_mentor_chapter(c, i)
    build_mentor_index()
    build_index(); build_book(); build_projects(); build_interactive()
    build_workshop(); build_search_index()
    written = len(FLAT) + len(MAN["sections"]) + len(MFLAT) + 7
    have = sum(1 for a in FLAT if (ART / f"{a['slug']}.md").exists())
    mhave = sum(1 for c in MFLAT if (MENTOR_DIR / f"{c['slug']}.md").exists())
    print(f"built {written} pages · {len(FLAT)} articles ({have} written) · "
          f"{len(MFLAT)} mentor chapters ({mhave} written) · {len(MAN['sections'])} sections")

if __name__ == "__main__":
    main()
