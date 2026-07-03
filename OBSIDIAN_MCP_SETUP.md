# Obsidian MCP Server Setup Guide

This guide is based on the [Automate Note Generation in Obsidian with AI Claude and MCP Servers](https://www.youtube.com/watch?v=NnwwpASG1_4) video tutorial. It explains how to set up the Obsidian MCP server to allow AI agents to automate note creation, search your vault, list files, and edit markdown.

> [!WARNING]
> Since the MCP server can read and write to your vault, it is highly recommended to start with a testing vault (e.g. "AI Research Vault") before running this on your primary Obsidian Vault.

There are two primary ways to set this up: an **Advanced Setup** (manual Python/uv installation) and an **Easy Setup** (using the MCP Tools community plugin). 

---

## Option 1: Easy Setup (Using MCP Tools Plugin)

The easiest way to get started is by using the `MCP tools` plugin which handles the server installation for you.

### 1. Prerequisites
- Download and install an AI Desktop application that supports MCP (e.g. Claude Desktop).
- Create a new Obsidian vault or open a test vault.

### 2. Install Local REST API
1. In Obsidian, go to **Settings** -> **Community plugins**.
2. Click **Browse** and search for **Local REST API**.
3. Install and enable the **Local REST API** plugin.
4. Go to its options and **copy your API key**. Keep it handy.

### 3. Install MCP Tools Plugin
1. Go back to **Community plugins** -> **Browse**.
2. Search for **MCP tools** (by jacksteam).
3. Install and enable it.
4. Go to its options. You will notice it says the MCP server is not installed.
5. Click the **Install server** button. The plugin will download the required server executable automatically (e.g., `mcp-server.exe`).

### 4. Connect to your Agent
1. Open your AI agent client (e.g., Claude Desktop).
2. The agent should automatically detect the MCP tools server that was installed in your vault's plugins folder.
3. You can verify this by checking the available tools (e.g., `list files`, `append content`, `delete files`).

---

## Option 2: Advanced Setup (Manual Python/uv Installation)

If you prefer full control over the installation or are running in an environment where the plugin approach fails, follow these manual steps to install the `mcp-obsidian` server by Markus Pfundstein.

### 1. Install Dependencies
- **Python**: Download and install Python from `python.org`.
- **uv**: Install the `uv` package manager by Astral. Follow the instructions at `docs.astral.sh/uv/getting-started/installation/`.

### 2. Prepare the Obsidian Vault
1. Open Obsidian and create a test vault (e.g., `AI Research Vault`).
2. Open terminal/PowerShell and navigate to your vault folder.
3. Clone the MCP server repository into your vault (or another safe directory):
   ```bash
   git clone https://github.com/MarkusPfundstein/mcp-obsidian
   ```

### 3. Setup Obsidian REST API
1. Open your vault in Obsidian.
2. Go to **Settings** -> **Community plugins** -> **Browse**.
3. Search for **Local REST API**, install, and enable it.
4. Go to its options and **copy your API key**.

### 4. Configure the Agent Client
1. Open your agent's configuration file (for Claude Desktop, it's `claude_desktop_config.json`).
2. Add the MCP server configuration. Be sure to replace the paths and API key with your own:
   ```json
   {
     "mcpServers": {
       "obsidian": {
         "command": "uv",
         "args": [
           "--directory",
           "/absolute/path/to/your/vault/mcp-obsidian",
           "run",
           "mcp-obsidian"
         ],
         "env": {
           "OBSIDIAN_API_KEY": "your-rest-api-key-here",
           "OBSIDIAN_HOST": "https://127.0.0.1:27124"
         }
       }
     }
   }
   ```
   *Note: Using `npx -y obsidian-mcp` is also an alternative depending on your node/python toolchain as described in the OKF template.*

3. Restart your AI client. The Obsidian tools should now be available for use.

---

## Video Reference

For a step-by-step walkthrough of these steps and seeing what the AI can build (e.g., automated motivational folders, book summaries, etc.), watch the original video tutorial:

[![Automate Note Generation in Obsidian](https://img.youtube.com/vi/NnwwpASG1_4/0.jpg)](https://www.youtube.com/watch?v=NnwwpASG1_4)
