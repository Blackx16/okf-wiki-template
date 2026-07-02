# Open Knowledge Format (OKF) Wiki Template

This is a highly customizable, LLM Agent-friendly template for building a personal or enterprise knowledge base. It is designed around the **Open Knowledge Format (OKF)** specification, treating your wiki not just as a collection of notes, but as a fully structured, traversable **Context Engine** for AI agents.

## Why OKF?

Traditional wikis rely on prose and implicit context, which AI models struggle to navigate reliably. The OKF paradigm resolves this by treating **Metadata as Code**:

1. **Just Files:** No proprietary databases or SDKs. Everything is Markdown and YAML.
2. **Strict Schemas:** Every file requires a `type` field (e.g., `source`, `concept`, `entity`) to categorize knowledge strictly.
3. **Deterministic Relationships:** Instead of burying connections in paragraphs, relationships are explicitly declared in the YAML frontmatter via `related: []` arrays, allowing agents to instantly build and traverse the knowledge graph.

## Getting Started

1. **Clone this repository** to act as the root of your wiki vault (e.g., in Obsidian).
2. **Read `AGENT.md`**: This is the operating manual for whatever AI agent you use to maintain this wiki. It provides instructions on provenance, linting, and OKF compliance.
3. **Deploy the Daemon**: Use `agent_prompt_template.md` to set up a scheduled background task (cron job) that automatically ingests raw files into your wiki.
4. **Customize `system-context.md`**: Define your own global dictionary and taxonomy to teach the agent exactly how you want knowledge structured.

## Directory Structure

- `raw/`: Your IMMUTABLE source documents (articles, transcripts, notes). The agent reads from here but never edits these files.
- `wiki/sources/`: The agent's processed reading notes derived from raw files.
- `wiki/concepts/`: Living syntheses of abstract ideas across multiple sources.
- `wiki/entities/`: Centralized metadata about people, orgs, products, or projects.
- `templates/`: OKF-compliant Markdown templates used by the agent to structure new files.
