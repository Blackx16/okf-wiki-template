# OKF System Context & Dictionary

This file serves as the definitive schema and context dictionary for the Open Knowledge Format (OKF) enrichment agent managing this wiki. It provides rules on how metadata and relationships should be structured for consumption by external AI agents.

## 1. OKF Schema Guidelines

All files within this wiki must adhere to the Open Knowledge Format (OKF) specification:
- **Format:** Directory of Markdown files.
- **Frontmatter:** Every page must contain YAML frontmatter.
- **Mandatory Field:** A `type` field must be present in the frontmatter of every file to dictate its schema.
- **Interoperability:** The schema is decoupled from the content. Relationships should be declared explicitly in YAML (via `related: []`) and implicitly in the text (via standard Markdown wikilinks: `[[Link]]`).

## 2. Valid Types & Schemas

### Type: `source`
Represents an external artifact (article, video, code repository) ingested into the wiki.
- **Required fields:** `type`, `title`, `author`, `url`, `sources` (list of raw paths), `tags`, `related`.
- **Purpose:** Acts as the immutable truth and starting point for knowledge extraction.

### Type: `entity`
Represents a tangible noun (person, organization, product, project).
- **Required fields:** `type`, `title`, `category`, `sources`, `tags`, `related`.
- **Categories:** (Define your own categories here, e.g., `person`, `organization`, `product`).
- **Purpose:** Centralizes metadata about a specific actor or tool across multiple sources.

### Type: `concept`
Represents an abstract idea, paradigm, or architectural pattern.
- **Required fields:** `type`, `title`, `domain`, `sources`, `tags`, `related`.
- **Purpose:** Defines the conceptual nodes that link various entities and sources together.

## 3. Relationship Standard (Metadata as Code)

To ensure this wiki operates as a highly functional Context Engine for AI agents:
1. **Frontmatter Linking:** Whenever a source, concept, or entity strongly relates to another, its filename or identifier should be added to the `related: []` array in the YAML frontmatter.
2. **Inline Linking:** Use `[[concept-name]]` format within the body to create navigable edges in the knowledge graph.
3. **Traceability:** Entities and concepts MUST cite their origins using the `sources` array in the frontmatter, enabling the agent to trace a concept back to its raw origin.

## 4. Future Expansion (External Catalogs)
*Reserved for future use. Configure external tool schemas (e.g., Notion MCP, Jira integrations) here.*
