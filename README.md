# Open Knowledge Format (OKF) Wiki Template

This is a highly customizable, LLM Agent-friendly template for building a personal or enterprise knowledge base. It is designed around the **Open Knowledge Format (OKF)** specification, treating your wiki not just as a collection of notes, but as a fully structured, traversable **Context Engine** for AI agents.

## Why OKF?

Traditional wikis rely on prose and implicit context, which AI models struggle to navigate reliably. The OKF paradigm resolves this by treating **Metadata as Code**:

1. **Just Files:** No proprietary databases or SDKs. Everything is Markdown and YAML.
2. **Strict Schemas:** Every file requires a `type` field (e.g., `source`, `concept`, `entity`) to categorize knowledge strictly.
3. **Deterministic Relationships:** Relationships are explicitly declared in the YAML frontmatter via `related: []` arrays, allowing agents to instantly build and traverse the knowledge graph.

*Note: The OKF/Context Engine paradigm is heavily inspired by Google's internal systems and research on structured knowledge representation.*

---

## Getting Started

### 1. Clone this repository
Clone this repository to act as the root of your wiki vault (e.g., in Obsidian).

### 2. Run the Setup Wizard
Open your terminal inside this repository and run:
```bash
python3 setup.py
```
This wizard will:
- Check for system dependencies (Python, Git, Node).
- Automatically create the full folder structure with `.gitkeep` files.
- Build your custom `mcp-config.json` containing absolute vault paths.
- Setup an executable `run_daemon.sh` shell script to run your scheduled agent ticks.

### 3. Configure Your Agent's MCP Servers
The setup script will output `mcp-config.json`. Merge this configuration into your LLM agent client (e.g. Claude Desktop, Gemini/Antigravity desktop runner).

Supported MCP servers:
- [**`obsidian`**](https://github.com/MarkusPfundstein/mcp-obsidian): Connects the agent directly to read/write from the markdown files.
  - *See [OBSIDIAN_MCP_SETUP.md](OBSIDIAN_MCP_SETUP.md) for a detailed video tutorial and setup guide.*
- [**`markitdown`**](https://github.com/microsoft/markitdown/tree/main/packages/markitdown-mcp): Auto-converts PDF, HTML, and office docs to markdown (via `uvx markitdown-mcp`).
- [**`youtube-transcript`**](https://github.com/sinco-lab/mcp-youtube-transcript): Automatically pulls transcripts for youtube video notes.
- [**`github-official`**](https://github.com/github/github-mcp-server): *(Auth Optional)* References and searches public repositories to enrich entity/concept definitions.
- [**`context7`**](https://github.com/upstash/context7): Fetches developer docs to build accurate concept profiles (via `@upstash/context7-mcp`).

### 4. Deploy the Daemon
Use `agent_prompt_template.md` to set up a scheduled background task (cron job) that automatically runs `run_daemon.sh` to ingest raw files into your wiki.

### 5. Read the Operating Manual (`AGENTS.md`)
Open and read [AGENTS.md](AGENTS.md). This is the operating manual for whatever AI agent you use to maintain this wiki. It provides instructions on provenance, linting, and OKF compliance.

---

## Directory Structure

- `raw/`: Your IMMUTABLE source documents (articles, transcripts, notes). The agent reads from here but never edits these files.
- `wiki/sources/`: The agent's processed reading notes derived from raw files.
- `wiki/concepts/`: Living syntheses of abstract ideas across multiple sources.
- `wiki/entities/`: Centralized metadata about people, orgs, products, or projects.
- `templates/`: OKF-compliant Markdown templates used by the agent to structure new files.
- `wiki_health_check.py`: Run this script directly (`python3 wiki_health_check.py`) to generate a full visual audit report of your vault's health (flagging orphans, thin notes, stale files, broken links, and contradictions).
