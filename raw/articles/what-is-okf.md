# The Open Knowledge Format Specification

The Open Knowledge Format (OKF) defines a standard directory layout and frontmatter syntax for structuring raw source files and synthesized knowledge.

It enforces strong provenance linking, so that every processed note can be traced back to its raw origin. In addition, relationships are declared explicitly via `related` arrays in the YAML frontmatter.

This structure allows LLM agents to autonomously index and maintain a highly functional context engine without manual intervention.
