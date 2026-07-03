# Open Knowledge Format (OKF) Wiki Template

This is a highly customizable, LLM Agent-friendly template for building a personal or enterprise knowledge base. It is designed around the **Open Knowledge Format (OKF)** specification, treating your wiki not just as a collection of notes, but as a fully structured, traversable **Context Engine** for AI agents.

## Why OKF?

Traditional wikis rely on prose and implicit context, which AI models struggle to navigate reliably. The OKF paradigm resolves this by treating **Metadata as Code**:

1. **Just Files:** No proprietary databases or SDKs. Everything is Markdown and YAML.
2. **Strict Schemas:** Every file requires a `type` field (e.g., `source`, `concept`, `entity`) to categorize knowledge strictly.
3. **Deterministic Relationships:** Relationships are explicitly declared in the YAML frontmatter via `related: []` arrays, allowing agents to instantly build and traverse the knowledge graph.

---

## Quick Start Setup (Highly Automated)

We provide an interactive setup wizard to get your vault and agent configured instantly.

### 1. Run the Setup Wizard
Open your terminal inside this repository and run:
```bash
python3 setup.py
```
This wizard will:
- Check for system dependencies.
- Build your custom `mcp-config.json` containing absolute vault paths.
- Setup an executable `run_daemon.sh` shell script to run your scheduled agent ticks.

### 2. Configure Your Agent's MCP Servers
The setup script will output `mcp-config.json`. Merge this configuration into your LLM agent client (e.g. Claude Desktop, Gemini/Antigravity desktop runner).

Supported MCP servers:
- **`obsidian`**: Connects the agent directly to read/write from the markdown files.
- **`markitdown`**: Auto-converts PDF, HTML, and office docs to markdown.
- **`youtube-transcript`**: Automatically pulls transcripts for youtube video notes.
- **`github-official`**: *(Auth Optional)* References and searches public repositories to enrich entity/concept definitions. No GitHub developer account is required unless you want to bypass rate limits or push commits.
- **`context7`**: Fetches developer docs to build accurate concept profiles.

---

## Directory Structure

- `raw/`: Your IMMUTABLE source documents (articles, transcripts, notes). The agent reads from here but never edits these files.
- `wiki/sources/`: The agent's processed reading notes derived from raw files.
- `wiki/concepts/`: Living syntheses of abstract ideas across multiple sources.
- `wiki/entities/`: Centralized metadata about people, orgs, products, or projects.
- `templates/`: OKF-compliant Markdown templates used by the agent to structure new files.
