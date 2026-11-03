/* ==========================================================================
   OKF Wiki Template — Interactive Field Guide Logic (app.js)
   - Desktop hover + Keyboard focus + Mobile tap dictionary popover
   - Interactive Note Comparison Switcher
   - Interactive SVG Knowledge Graph Inspector
   - Interactive Repository File Tree Explorer
   - Searchable A–Z Glossary & Theme Controller
   ========================================================================== */

// Conditional Popover API polyfill for older browsers (modern-web-guidance)
if (typeof HTMLElement !== "undefined" && !("popover" in HTMLElement.prototype)) {
  import("https://unpkg.com/@oddbird/popover-polyfill@latest/dist/popover.min.js").catch(() => {});
}

const DICTIONARY_TERMS = {
  "okf": {
    title: "Open Knowledge Format (OKF)",
    category: "Core Standard",
    meaning: "A simple rulebook for organizing plain text notes so both humans and AI assistants can read, trace, and connect them reliably.",
    analogy: "Think of it like standardized nutrition labels on food boxes: because every box puts ingredients and calories in the exact same spot, anyone can read it in seconds.",
    inRepo: "Every page in wiki/ follows OKF by starting with a structured YAML label block and linking back to raw/."
  },
  "knowledge-graph": {
    title: "Knowledge Graph",
    category: "Concept",
    meaning: "A network of information where separate pages (called nodes) are explicitly connected to one another by named links (called edges).",
    analogy: "Like a detective's corkboard where photos of people, places, and documents are connected with labeled pieces of string.",
    inRepo: "Built automatically out of your Markdown files in wiki/sources/, wiki/concepts/, and wiki/entities/."
  },
  "yaml-frontmatter": {
    title: "YAML Frontmatter",
    category: "File Format",
    meaning: "A neat block of key-value labels placed at the very top of a note between two triple-dash lines (---) that stores facts like title, type, and related pages.",
    analogy: "Like the stamped index card glued inside the front cover of a library book listing the author, subject, and shelf number.",
    inRepo: "Parsed by wiki_health_check.py and read by AI agents to traverse connections without guessing."
  },
  "metadata-as-code": {
    title: "Metadata as Code",
    category: "Design Principle",
    meaning: "Writing note labels and relationships in a strict, predictable format (YAML arrays) so computer scripts can check and navigate them like software code.",
    analogy: "Instead of writing 'Call Bob next Tuesday' on a napkin, putting it into a structured calendar invite that your phone can set an alarm for.",
    inRepo: "Declared via the mandatory type: field and related: [] list at the top of every wiki page."
  },
  "markdown": {
    title: "Markdown (.md)",
    category: "File Format",
    meaning: "Plain text files that use simple punctuation (like # for headings and * for bullet points) so they can be opened in any text editor forever.",
    analogy: "Writing on clean notebook paper instead of locking your writing inside a proprietary word-processor vault.",
    inRepo: "All raw articles, templates, health reports, and wiki notes are stored as standard .md files."
  },
  "provenance": {
    title: "Provenance",
    category: "Trust & Verification",
    meaning: "A verifiable trail showing the exact original file where a piece of information or claim came from.",
    analogy: "Keeping the original paper receipt stapled to an expense report so anyone can verify the numbers.",
    inRepo: "Every file in wiki/sources/ must cite its raw/ file in two places: the YAML sources: list and the **Source:** line under the title."
  },
  "immutable": {
    title: "Immutable",
    category: "Rule",
    meaning: "Unchangeable. Once an original document is placed in the raw/ folder, the AI is strictly forbidden from editing or overwriting it.",
    analogy: "Like museum glass over an original historical letter: researchers can study and take notes on it, but they can never write on the letter itself.",
    inRepo: "Files inside raw/ are treated as immutable source-of-truth originals."
  },
  "llm": {
    title: "LLM (Large Language Model)",
    category: "AI Technology",
    meaning: "An AI system (such as Claude, Gemini, or GPT) trained to read, summarize, and write text based on instructions.",
    analogy: "A fast-reading research assistant who can summarize books in seconds, but needs a clear filing system so they don't mix up details.",
    inRepo: "Acts as the OKF Enrichment Agent that reads raw/ files and writes structured notes into wiki/."
  },
  "vector-database": {
    title: "Vector Database",
    category: "Database Type",
    meaning: "A specialized database that chops documents into small paragraphs and stores them as long lists of numbers (coordinates) to search by rough topic similarity.",
    analogy: "Like organizing a grocery store by 'vibe'—putting salsa near tortilla chips because they feel related—rather than keeping an exact inventory list.",
    inRepo: "OKF deliberately avoids needing a Vector Database by using explicit YAML links and plain files."
  },
  "embeddings": {
    title: "Embeddings",
    category: "AI Math",
    meaning: "Long lists of hundreds of decimal numbers generated by an AI model to represent the approximate meaning of a sentence or paragraph.",
    analogy: "Giving every paragraph a GPS coordinate on a giant invisible map of topics so similar sentences sit near each other.",
    inRepo: "Not required in OKF; relationships are written in plain words inside related: [] arrays that humans can inspect."
  },
  "rag": {
    title: "RAG (Retrieval-Augmented Generation)",
    category: "AI Pattern",
    meaning: "A technique where a computer searches your documents for matching snippets and pastes them into an AI's prompt before the AI answers your question.",
    analogy: "Handing a student three photocopied pages from a textbook right before they answer an open-book test question.",
    inRepo: "OKF acts as a structured alternative (a 'Context Engine') where the AI follows exact topic links instead of guessing random text chunks."
  },
  "graph-database": {
    title: "Graph Database (Neo4j / RDF)",
    category: "Database Type",
    meaning: "Heavy-duty database software designed to store millions of connected data points on a dedicated server using specialized query languages.",
    analogy: "An air-traffic control radar system: great for an international airport, but overkill for organizing your personal study library.",
    inRepo: "OKF gives you the connected graph structure of a Graph Database using ordinary folders and Markdown files."
  },
  "cypher-sparql": {
    title: "Cypher / SPARQL",
    category: "Query Language",
    meaning: "Specialized programming languages used to search inside enterprise graph databases like Neo4j or RDF triplestores.",
    analogy: "Like needing to speak legal Latin just to ask the librarian where the history books are kept.",
    inRepo: "Instead of Cypher, OKF uses simple Python scripts (wiki_health_check.py) and standard [[wikilinks]]."
  },
  "token": {
    title: "Token",
    category: "AI Measurement",
    meaning: "The basic unit of text that AI models read and charge money for—roughly equal to three-quarters of an English word (or about 4 characters).",
    analogy: "Like paying for a telegram by the word: the more unnecessary text the AI has to re-read, the more it costs.",
    inRepo: "wiki_auto_ingest_manifest.py pre-calculates token counts so the AI never wastes tokens scanning already-finished files."
  },
  "context-window": {
    title: "Context Window",
    category: "AI Limit",
    meaning: "The maximum amount of text (measured in tokens) an AI can hold in its short-term working memory during a single conversation.",
    analogy: "The size of an accountant's desk: if you dump 500 binders on the desk at once, papers fall on the floor and details get missed.",
    inRepo: "wiki_auto_ingest_manifest.py packs files into safe batches (~75,000 tokens) that fit comfortably inside a 200,000-token context window."
  },
  "chunking": {
    title: "Chunking",
    category: "Processing Technique",
    meaning: "Splitting a very long document into smaller, numbered sections so the AI can read and summarize it piece by piece without losing detail.",
    analogy: "Reading a 600-page book one chapter per evening and updating your reading notes after each chapter.",
    inRepo: "Automatically planned by wiki_auto_ingest_manifest.py whenever a raw file exceeds ~35,000 tokens."
  },
  "wikilink": {
    title: "Wikilink ([[page-name]])",
    category: "Markdown Syntax",
    meaning: "A clickable link written inside double square brackets like [[open-knowledge-format]] that connects one note directly to another.",
    analogy: "A 'See also page 42' cross-reference printed right inside a book paragraph.",
    inRepo: "Used inside note bodies alongside the YAML related: [] array to connect sources, concepts, and entities."
  },
  "mcp": {
    title: "MCP (Model Context Protocol)",
    category: "AI Integration",
    meaning: "An open standard that acts like a universal USB port for AI assistants, allowing them to plug into tools like Obsidian, GitHub, PDF readers, and YouTube.",
    analogy: "A universal travel power adapter that lets your laptop plug into outlets in any country without custom wiring.",
    inRepo: "Configured in mcp-config.json so the agent can convert PDFs (markitdown), fetch YouTube transcripts, and read developer docs (context7)."
  },
  "daemon": {
    title: "Daemon / Cron Job",
    category: "Automation",
    meaning: "A quiet background task scheduled on your computer to run automatically at set times (for example, every hour or every night at midnight).",
    analogy: "Like a programmable coffee maker or automatic sprinkler system that runs on a timer without you pressing start.",
    inRepo: "run_daemon.sh pairs with agent_prompt_template.md to process new raw/ files in the background."
  },
  "deterministic": {
    title: "Deterministic",
    category: "Computing Concept",
    meaning: "A process that follows exact, predictable rules and always produces the exact same output for the same input—with zero AI guesswork or randomness.",
    analogy: "A pocket calculator: typing 12 × 12 will always give 144, every single time, for free.",
    inRepo: "Both wiki_auto_ingest_manifest.py and wiki_health_check.py are 100% deterministic Python scripts."
  },
  "orphan-note": {
    title: "Orphan Note",
    category: "Vault Health Metric",
    meaning: "A wiki page that has zero incoming links from any other page in the knowledge base, making it isolated and easy to forget.",
    analogy: "An island with no bridges or ferry routes leading to it—even if it exists on the map, nobody travelling through the network will reach it.",
    inRepo: "Automatically flagged by wiki_health_check.py under 'Integrate Orphan Notes'."
  },
  "thin-stale-note": {
    title: "Thin & Stale Notes",
    category: "Vault Health Metric",
    meaning: "A 'Thin Note' has fewer than 100 words or is missing its related:[] links; a 'Stale Note' hasn't been reviewed or updated in over 90 days.",
    analogy: "A half-empty index card or a calendar contact you haven't verified in years.",
    inRepo: "Tracked in wiki/queries/vault-health-summary.md so the AI knows which pages need enriching."
  },
  "contradiction-callout": {
    title: "Contradiction Callout (> [!contradiction])",
    category: "OKF Rule",
    meaning: "A special warning box placed inside a wiki page when two reliable sources make opposite claims, preserving both sides instead of erasing one.",
    analogy: "A judge recording both eyewitness testimonies in the court transcript when they disagree, rather than throwing one away.",
    inRepo: "Detected by wiki_health_check.py via '> [!contradiction]' or 'contested: true' in the frontmatter."
  },
  "sha256": {
    title: "SHA-256 Hash",
    category: "Verification",
    meaning: "A unique 64-character digital fingerprint calculated from a file's contents; if even a single comma changes in the file, the fingerprint changes completely.",
    analogy: "A wax seal on an envelope that immediately shows whether the contents inside have been altered.",
    inRepo: "Computed by wiki_auto_ingest_manifest.py to uniquely fingerprint every raw source file."
  },
  "git": {
    title: "Git",
    category: "Version Control",
    meaning: "A time-machine system for files that records snapshots (commits) of every change, who made it, and when, allowing you to undo mistakes anytime.",
    analogy: "An unlimited 'Undo' history for your entire folder of notes.",
    inRepo: "After every ingestion batch, the agent commits its changes with a [ingest] message."
  }
};

const GRAPH_NODES_DATA = {
  "node-raw": {
    badgeClass: "badge-raw",
    badgeText: "Layer 1 · Immutable Original (raw/)",
    title: "raw/articles/what-is-okf.md",
    summary: "The untouched original article dropped into the raw/ folder. The AI agent reads this file to extract knowledge, but is strictly forbidden from modifying or deleting a single word.",
    meta: [
      ["Folder Rule", "Read-only (Immutable)"],
      ["Tracked By", "wiki_auto_ingest_manifest.py"],
      ["SHA-256 Check", "Verified on every tick"],
      ["Points To", "wiki/sources/what-is-okf.md"]
    ],
    edges: ["edge-raw-source"]
  },
  "node-source": {
    badgeClass: "badge-source",
    badgeText: "Layer 2 · Source Reading Note (type: source)",
    title: "wiki/sources/what-is-okf.md",
    summary: "A rich, structured reading note derived from one raw file. It records key claims, notable quotes, and two-way provenance so you rarely need to reopen the raw file.",
    meta: [
      ["YAML type", "source"],
      ["Provenance #1", "sources: [\"raw/articles/what-is-okf.md\"]"],
      ["Provenance #2", "**Source:** raw/articles/what-is-okf.md"],
      ["Explicit Links", "related: [\"open-knowledge-format\", \"open-knowledge-foundation\"]"]
    ],
    edges: ["edge-raw-source", "edge-source-concept", "edge-source-entity"]
  },
  "node-concept": {
    badgeClass: "badge-concept",
    badgeText: "Layer 3 · Living Concept Page (type: concept)",
    title: "wiki/concepts/open-knowledge-format.md",
    summary: "Synthesizes an abstract idea or architectural pattern across multiple sources over time. As you add more articles about OKF, this single page grows richer.",
    meta: [
      ["YAML type", "concept"],
      ["Domain", "software"],
      ["Cited Sources", "sources: [\"raw/articles/what-is-okf.md\"]"],
      ["Explicit Links", "related: [\"what-is-okf\", \"open-knowledge-foundation\"]"]
    ],
    edges: ["edge-source-concept", "edge-concept-entity", "edge-health-audit"]
  },
  "node-entity": {
    badgeClass: "badge-entity",
    badgeText: "Layer 3 · Living Entity Page (type: entity)",
    title: "wiki/entities/open-knowledge-foundation.md",
    summary: "Centralizes facts about a tangible noun—a person, organization, product, or project—combining claims from every source that mentions it.",
    meta: [
      ["YAML type", "entity"],
      ["Category", "organization"],
      ["Cited Sources", "sources: [\"raw/articles/what-is-okf.md\"]"],
      ["Explicit Links", "related: [\"what-is-okf\", \"open-knowledge-format\"]"]
    ],
    edges: ["edge-source-entity", "edge-concept-entity", "edge-health-audit"]
  },
  "node-query": {
    badgeClass: "badge-query",
    badgeText: "Layer 4 · Automated Health Audit (wiki/queries/)",
    title: "wiki/queries/vault-health-summary.md",
    summary: "Generated automatically by wiki_health_check.py. Scans every source, concept, and entity note to flag broken links, orphan pages, thin notes (< 100 words), stale dates (> 90 days), and contradictions.",
    meta: [
      ["Generator", "python3 wiki_health_check.py"],
      ["AI Token Cost", "$0 (Pure Python standard library)"],
      ["Companion File", "wiki/queries/vault-health-report.md"],
      ["Audits", "Orphans, Broken Links, Thin/Stale Notes, Contradictions"]
    ],
    edges: ["edge-health-audit"]
  }
};

const REPO_FILES_DATA = {
  "AGENTS.md": {
    actor: "AI Operating Manual",
    actorClass: "actor-ai",
    summary: "The master rulebook that every AI session reads first. Defines non-negotiable provenance rules, OKF frontmatter requirements, cross-linking standards, contradiction callouts, and the step-by-step ingest & lint workflows.",
    snippet: `# LLM Wiki — Schema & Operations
Every session starts by reading this file, then system-context.md, then recent log.md entries.

## Non-Negotiable Provenance Rules
Every processed source page must be linked to its raw file in two places:
1. YAML frontmatter: sources: ["raw/articles/example.md"]
2. Body, immediately below the title: **Source:** raw/articles/example.md
Never modify files under raw/.`
  },
  "system-context.md": {
    actor: "Schema Dictionary",
    actorClass: "actor-ai",
    summary: "Defines the valid note types (source, entity, concept) and the exact YAML fields each type requires so external AI agents and scripts share one consistent dictionary.",
    snippet: `### Type: source
- Required fields: type, title, author, url, sources, tags, related.

### Type: entity
- Required fields: type, title, category, sources, tags, related.

### Type: concept
- Required fields: type, title, domain, sources, tags, related.`
  },
  "setup.py": {
    actor: "Human / Setup Wizard",
    actorClass: "actor-human",
    summary: "Interactive Python setup wizard you run once after cloning. It verifies Python/Git/Node, lets you customize raw/ subfolders, writes mcp-config.json with your vault path, and creates the executable run_daemon.sh script.",
    snippet: `$ python3 setup.py
Checking dependencies...
  - Git: Found
  - Node/npx: Found
Creating directory structure...
  raw/articles, raw/youtube, raw/notes, raw/papers, raw/github, raw/tutorials
  wiki/sources, wiki/concepts, wiki/entities, wiki/queries
Created local MCP configuration at: mcp-config.json
Created executable daemon script at: run_daemon.sh`
  },
  "wiki_auto_ingest_manifest.py": {
    actor: "Deterministic Python Script ($0 AI Cost)",
    actorClass: "actor-python",
    summary: "Pre-computes a token-bounded batch and chunk plan before the AI wakes up. Scans raw/ and wiki/sources/ to find unlinked or incomplete files, calculates SHA-256 hashes and token sizes, and packs batches that never overflow the model's context window.",
    snippet: `TOKEN_CONTEXT = 200_000
SAFE_INPUT_TOKENS = 110_000
TARGET_BATCH_TOKENS = 75_000
MAX_FILES_PER_BATCH = 12
CHUNK_TOKENS = 35_000

# Status classification per raw file:
# 'ok' | 'new_or_disconnected' | 'duplicate_processed_pages' | 'missing_body_backlink'`
  },
  "wiki_health_check.py": {
    actor: "Deterministic Python Linter ($0 AI Cost)",
    actorClass: "actor-python",
    summary: "Audits the compiled wiki graph using zero external dependencies. Checks YAML frontmatter, counts words, checks update dates, traces incoming/outgoing [[wikilinks]] and related:[] arrays, and writes two markdown reports into wiki/queries/.",
    snippet: `THIN_WORD_COUNT = 100
STALE_DAYS_LIMIT = 90

# Generates:
# 1. wiki/queries/vault-health-summary.md (Metric table & percentages)
# 2. wiki/queries/vault-health-report.md (Actionable checklist by note)`
  },
  "agent_prompt_template.md": {
    actor: "Headless Daemon Prompt",
    actorClass: "actor-ai",
    summary: "Self-contained prompt designed for scheduled background runs (cron jobs). Instructs the AI to read the schema, run wiki_auto_ingest_manifest.py, process only batches[0], run wiki_health_check.py, append to log.md, and git commit.",
    snippet: `## §4 DISCOVERY & BATCHING
1. Run python3 wiki_auto_ingest_manifest.py and parse its JSON output.
2. Process exactly one batch from batches[0] this tick. Do not re-scan raw/ yourself.
3. If actionable_count is 0, append a clean tick note to log.md and stop.`
  },
  "mcp-config.json.template": {
    actor: "MCP Tool Bridges",
    actorClass: "actor-python",
    summary: "Template configuring five Model Context Protocol (MCP) servers that give your AI agent superpowers: reading/writing Obsidian files, converting PDFs/Office docs (markitdown), pulling YouTube transcripts, searching GitHub repos, and fetching live library docs (Context7).",
    snippet: `{
  "mcpServers": {
    "obsidian": { "command": "npx", "args": ["-y", "obsidian-mcp", "/path/to/vault"] },
    "youtube-transcript": { "command": "npx", "args": ["-y", "@sinco-lab/mcp-youtube-transcript"] },
    "markitdown": { "command": "uvx", "args": ["markitdown-mcp"] },
    "github-official": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-github"] },
    "context7": { "command": "npx", "args": ["-y", "@upstash/context7-mcp"] }
  }
}`
  },
  "templates/source-page.md": {
    actor: "OKF Note Template",
    actorClass: "actor-ai",
    summary: "Standardized Markdown blueprint for wiki/sources/, wiki/concepts/, and wiki/entities/. Ensures every new note generated by the AI has valid YAML frontmatter, provenance links, summary, key claims, quotes, and connections.",
    snippet: `---
title: "{{title}}"
type: source
author: "{{author}}"
created: {{date}}
updated: {{date}}
sources: ["{{filename}}"]
tags: [{{tags}}]
related: []
---
# {{title}}
**Source:** raw/{{filename}}`
  },
  "log.md": {
    actor: "Chronological Audit Trail",
    actorClass: "actor-ai",
    summary: "Append-only operation log where the background agent records every setup, ingestion batch, and health check pass with a date stamp and list of modified pages.",
    snippet: `# Operation Log
Append-only chronological operation log for the OKF Enrichment Agent.

## [2026-07-03] ingest | The Open Knowledge Format Specification
- Created wiki/sources/what-is-okf.md
- Updated wiki/concepts/open-knowledge-format.md
- Updated wiki/entities/open-knowledge-foundation.md`
  }
};

const COMPARISON_MODES = {
  "unstructured": {
    filename: "notes/ai-summary-draft-final2.md (Normal Unstructured Wiki)",
    codeHtml: `# Notes on Open Knowledge Format

I read an article recently that said the Open Knowledge Format (OKF) is a way to organize markdown files for AI agents.

It says relationships should be declared explicitly and raw files shouldn't be changed. The Open Knowledge Foundation maintains it.

Also someone mentioned it might replace vector databases for small vaults, or maybe work with them.`,
    outcomes: [
      {
        title: "No verifiable receipt (Broken Provenance)",
        desc: "Six months later, neither you nor the AI knows which article or URL these claims came from—or if the AI hallucinated half of it."
      },
      {
        title: "Invisible to automated scripts",
        desc: "Because there is no structured header, a script cannot tell if this page is about a person, an article, or a general concept."
      },
      {
        title: "High token cost on every run",
        desc: "To find out if an article was already summarized, the AI has to re-read every note in your folder, burning tokens and money."
      }
    ]
  },
  "okf": {
    filename: "wiki/sources/what-is-okf.md (OKF Structured Source Note)",
    codeHtml: `<span class="yaml-highlight">---
title: "The Open Knowledge Format Specification"
type: source
author: "Open Knowledge Foundation"
sources: ["raw/articles/what-is-okf.md"]
tags: [standards, methodology, open-science]
related: ["open-knowledge-format", "open-knowledge-foundation"]
---</span># The Open Knowledge Format Specification

<span class="provenance-highlight">**Source:** \`raw/articles/what-is-okf.md\`</span>

## Summary
A definition of the OKF directory layouts, provenance structures, and metadata conventions for structuring notes.

## Connections
- Implements the [[open-knowledge-format]] concept.
- Maintained by the [[open-knowledge-foundation]].`,
    outcomes: [
      {
        title: "Double-locked provenance back to raw/",
        desc: "Both the YAML header (sources:) and the first line under the title (**Source:**) point to the exact untouched file in raw/articles/what-is-okf.md."
      },
      {
        title: "Instant machine-readable graph (related: [])",
        desc: "Any script or AI agent can read the related: array in milliseconds to see how this source connects to concepts and organizations."
      },
      {
        title: "Zero-token duplicate checking",
        desc: "wiki_auto_ingest_manifest.py checks the exact raw path link for $0 before the AI even wakes up."
      }
    ]
  }
};

document.addEventListener("DOMContentLoaded", () => {
  initThemeToggle();
  initDictionaryPopovers();
  initComparisonSwitcher();
  initKnowledgeGraphInspector();
  initRepoExplorer();
  initGlossarySection();
});

/* ==========================================================================
   1. Theme Toggle (Light Archival Paper / Dark Ink)
   ========================================================================== */
function initThemeToggle() {
  const btn = document.getElementById("theme-toggle-btn");
  const label = document.getElementById("theme-toggle-label");
  if (!btn) return;

  const saved = localStorage.getItem("okf-guide-theme");
  if (saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
    document.documentElement.setAttribute("data-theme", "dark");
    if (label) label.textContent = "Light paper";
  }

  btn.addEventListener("click", () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    const next = isDark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("okf-guide-theme", next);
    if (label) label.textContent = next === "dark" ? "Light paper" : "Dark ink";
  });
}

/* ==========================================================================
   2. Universal Dictionary Popover (Desktop Hover + Focus + Mobile Tap)
   ========================================================================== */
function initDictionaryPopovers() {
  const popover = document.getElementById("dict-popover");
  const titleEl = document.getElementById("dict-title");
  const catEl = document.getElementById("dict-category");
  const meaningEl = document.getElementById("dict-meaning");
  const analogyEl = document.getElementById("dict-analogy");
  const repoEl = document.getElementById("dict-repo");
  const closeBtn = document.getElementById("dict-close-btn");

  if (!popover) return;

  let activeTrigger = null;
  let openTimer = null;
  let closeTimer = null;
  let pinnedByClick = false;

  const isCoarsePointer = () => window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 640;

  function populatePopover(termKey) {
    const entry = DICTIONARY_TERMS[termKey];
    if (!entry) return false;
    titleEl.textContent = entry.title;
    catEl.textContent = entry.category;
    meaningEl.textContent = entry.meaning;
    analogyEl.innerHTML = `<strong>Everyday analogy:</strong> ${entry.analogy}`;
    repoEl.innerHTML = `<strong>In this template:</strong> ${entry.inRepo}`;
    return true;
  }

  function positionPopover(trigger) {
    if (!trigger) return;
    if (window.innerWidth <= 640) {
      popover.classList.add("is-mobile-sheet");
      popover.style.top = "";
      popover.style.left = "";
      return;
    }
    popover.classList.remove("is-mobile-sheet");

    const rect = trigger.getBoundingClientRect();
    const popRect = popover.getBoundingClientRect();
    const popWidth = popRect.width || 360;
    const popHeight = popRect.height || 230;
    const margin = 10;

    // Prefer above trigger if enough space, otherwise flip below (flip-block)
    let top = rect.top - popHeight - margin;
    if (top < 12) {
      top = rect.bottom + margin;
    }
    if (top + popHeight > window.innerHeight - 12) {
      top = Math.max(12, window.innerHeight - popHeight - 12);
    }

    let left = rect.left + rect.width / 2 - popWidth / 2;
    left = Math.max(12, Math.min(left, window.innerWidth - popWidth - 12));

    popover.style.top = `${Math.round(top)}px`;
    popover.style.left = `${Math.round(left)}px`;
  }

  function showForTrigger(trigger, pin = false) {
    const termKey = trigger.getAttribute("data-term");
    if (!populatePopover(termKey)) return;

    clearTimeout(closeTimer);
    if (activeTrigger && activeTrigger !== trigger) {
      activeTrigger.setAttribute("aria-expanded", "false");
    }

    activeTrigger = trigger;
    pinnedByClick = pin;
    trigger.setAttribute("aria-expanded", "true");

    if (typeof popover.showPopover === "function") {
      try {
        popover.showPopover();
      } catch (_) {}
    }
    popover.classList.add("is-open");
    popover.setAttribute("aria-hidden", "false");
    positionPopover(trigger);
  }

  function hidePopover(returnFocus = false) {
    clearTimeout(openTimer);
    clearTimeout(closeTimer);
    pinnedByClick = false;

    if (activeTrigger) {
      activeTrigger.setAttribute("aria-expanded", "false");
      if (returnFocus) activeTrigger.focus();
    }
    activeTrigger = null;

    popover.classList.remove("is-open");
    popover.setAttribute("aria-hidden", "true");
    if (typeof popover.hidePopover === "function") {
      try {
        popover.hidePopover();
      } catch (_) {}
    }
  }

  function scheduleClose() {
    if (pinnedByClick) return;
    clearTimeout(openTimer);
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      hidePopover(false);
    }, 190);
  }

  function bindTriggers(root = document) {
    const triggers = root.querySelectorAll(".dict-term");
    triggers.forEach((btn) => {
      if (btn.dataset.bound === "true") return;
      btn.dataset.bound = "true";

      // Mouse hover (desktop)
      btn.addEventListener("pointerenter", (e) => {
        if (e.pointerType === "touch" || isCoarsePointer()) return;
        clearTimeout(closeTimer);
        clearTimeout(openTimer);
        openTimer = setTimeout(() => {
          showForTrigger(btn, false);
        }, 130);
      });

      btn.addEventListener("pointerleave", (e) => {
        if (e.pointerType === "touch" || isCoarsePointer()) return;
        scheduleClose();
      });

      // Click / Tap (works on mobile tap AND desktop click-to-pin)
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (activeTrigger === btn && popover.classList.contains("is-open") && pinnedByClick) {
          hidePopover(false);
        } else {
          showForTrigger(btn, true);
        }
      });

      // Keyboard focus
      btn.addEventListener("focus", () => {
        if (isCoarsePointer()) return;
        clearTimeout(closeTimer);
        showForTrigger(btn, false);
      });

      btn.addEventListener("blur", () => {
        if (!pinnedByClick) scheduleClose();
      });
    });
  }

  bindTriggers(document);

  // Keep open when pointer moves onto the dictionary card itself (WCAG 1.4.13 Hoverable)
  popover.addEventListener("pointerenter", (e) => {
    if (e.pointerType === "touch") return;
    clearTimeout(closeTimer);
  });

  popover.addEventListener("pointerleave", (e) => {
    if (e.pointerType === "touch") return;
    scheduleClose();
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      hidePopover(true);
    });
  }

  // Light dismiss on outside click/tap
  document.addEventListener("click", (e) => {
    if (!popover.classList.contains("is-open")) return;
    if (popover.contains(e.target)) return;
    if (activeTrigger && activeTrigger.contains(e.target)) return;
    hidePopover(false);
  });

  // Escape key dismissal (WCAG 1.4.13 Dismissible)
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && popover.classList.contains("is-open")) {
      hidePopover(true);
    }
  });

  window.addEventListener("scroll", () => {
    if (popover.classList.contains("is-open") && activeTrigger && !isCoarsePointer()) {
      positionPopover(activeTrigger);
    }
  }, { passive: true });

  window.addEventListener("resize", () => {
    if (popover.classList.contains("is-open") && activeTrigger) {
      positionPopover(activeTrigger);
    }
  });
}

/* ==========================================================================
   3. Section 1: Unstructured vs OKF Note Switcher
   ========================================================================== */
function initComparisonSwitcher() {
  const buttons = document.querySelectorAll("[data-compare-mode]");
  const filenameEl = document.getElementById("compare-filename");
  const codeEl = document.getElementById("compare-code");
  const outcomesEl = document.getElementById("compare-outcomes");

  if (!buttons.length || !filenameEl || !codeEl || !outcomesEl) return;

  function renderMode(modeKey) {
    const data = COMPARISON_MODES[modeKey];
    if (!data) return;

    buttons.forEach((b) => {
      b.setAttribute("aria-selected", b.getAttribute("data-compare-mode") === modeKey ? "true" : "false");
    });

    filenameEl.textContent = data.filename;
    codeEl.innerHTML = data.codeHtml;
    outcomesEl.innerHTML = data.outcomes
      .map(
        (item) => `
        <div class="outcome-row">
          <strong>${item.title}</strong>
          <p>${item.desc}</p>
        </div>`
      )
      .join("");
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      renderMode(btn.getAttribute("data-compare-mode"));
    });
  });

  renderMode("okf");
}

/* ==========================================================================
   4. Section 2: Interactive SVG Knowledge Graph Inspector
   ========================================================================== */
function initKnowledgeGraphInspector() {
  const nodes = document.querySelectorAll(".graph-node");
  const edges = document.querySelectorAll(".graph-edge");
  const badgeEl = document.getElementById("graph-inspector-badge");
  const titleEl = document.getElementById("graph-inspector-title");
  const summaryEl = document.getElementById("graph-inspector-summary");
  const metaBody = document.getElementById("graph-inspector-meta");

  if (!nodes.length || !titleEl) return;

  function selectNode(nodeId) {
    const data = GRAPH_NODES_DATA[nodeId];
    if (!data) return;

    nodes.forEach((n) => {
      n.setAttribute("aria-selected", n.id === nodeId ? "true" : "false");
    });

    edges.forEach((edge) => {
      if (data.edges.includes(edge.id)) {
        edge.classList.add("is-active");
      } else {
        edge.classList.remove("is-active");
      }
    });

    badgeEl.className = `node-badge ${data.badgeClass}`;
    badgeEl.textContent = data.badgeText;
    titleEl.textContent = data.title;
    summaryEl.textContent = data.summary;
    metaBody.innerHTML = data.meta
      .map(([k, v]) => `<tr><th scope="row">${k}</th><td>${v}</td></tr>`)
      .join("");
  }

  nodes.forEach((node) => {
    node.addEventListener("click", () => selectNode(node.id));
    node.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        selectNode(node.id);
      }
    });
  });

  selectNode("node-source");
}

/* ==========================================================================
   5. Section 5: Interactive Repository File Explorer
   ========================================================================== */
function initRepoExplorer() {
  const treeBtns = document.querySelectorAll("[data-repo-file]");
  const pathEl = document.getElementById("repo-detail-path");
  const actorEl = document.getElementById("repo-detail-actor");
  const summaryEl = document.getElementById("repo-detail-summary");
  const snippetEl = document.getElementById("repo-detail-snippet");

  if (!treeBtns.length || !pathEl) return;

  function selectFile(fileKey) {
    const info = REPO_FILES_DATA[fileKey];
    if (!info) return;

    treeBtns.forEach((btn) => {
      btn.setAttribute("aria-selected", btn.getAttribute("data-repo-file") === fileKey ? "true" : "false");
    });

    pathEl.textContent = fileKey;
    actorEl.className = `step-actor-tag ${info.actorClass}`;
    actorEl.textContent = info.actor;
    summaryEl.textContent = info.summary;
    snippetEl.textContent = info.snippet;
  }

  treeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      selectFile(btn.getAttribute("data-repo-file"));
    });
  });

  selectFile("AGENTS.md");
}

/* ==========================================================================
   6. Section 7: Searchable A–Z Glossary (Collapsible Accordion)
   ========================================================================== */
function initGlossarySection() {
  const container = document.getElementById("glossary-list");
  const searchInput = document.getElementById("glossary-search");
  const countEl = document.getElementById("glossary-count");
  const accordion = document.getElementById("glossary-accordion");
  const navDictLink = document.querySelector('a[href="#glossary"]');

  if (!container) return;

  // Handle nav link click to automatically open accordion & focus search
  if (navDictLink && accordion) {
    navDictLink.addEventListener("click", () => {
      accordion.open = true;
      setTimeout(() => {
        if (searchInput) searchInput.focus();
      }, 120);
    });
  }

  // Handle direct hash navigation to #glossary
  if (window.location.hash === "#glossary" && accordion) {
    accordion.open = true;
  }

  const entries = Object.entries(DICTIONARY_TERMS).sort((a, b) =>
    a[1].title.localeCompare(b[1].title)
  );

  function renderGlossary(query = "") {
    const q = query.trim().toLowerCase();
    const filtered = entries.filter(([_, item]) => {
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.meaning.toLowerCase().includes(q) ||
        item.analogy.toLowerCase().includes(q)
      );
    });

    if (countEl) {
      countEl.textContent = `Showing ${filtered.length} of ${entries.length} terms`;
    }

    if (!filtered.length) {
      container.innerHTML = `<div class="glossary-entry"><dt>No matching terms found</dt><dd>Try clearing the search box or searching for terms like "YAML", "Vector", "Token", or "Provenance".</dd></div>`;
      return;
    }

    container.innerHTML = filtered
      .map(
        ([_, item]) => `
        <div class="glossary-entry">
          <dt>
            <span>${item.title}</span>
            <span class="dict-popover-category">${item.category}</span>
          </dt>
          <dd>
            <div>${item.meaning}</div>
            <div class="glossary-analogy"><strong>Analogy:</strong> ${item.analogy}</div>
          </dd>
        </div>`
      )
      .join("");
  }

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      if (accordion && !accordion.open) {
        accordion.open = true;
      }
      renderGlossary(e.target.value);
    });
  }

  renderGlossary("");
}
