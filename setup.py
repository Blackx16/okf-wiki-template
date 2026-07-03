#!/usr/bin/env python3
import os
import sys
import json
import subprocess

def check_dependencies():
    print("Checking dependencies...")
    # Check Python version
    if sys.version_info < (3, 6):
        print("Error: Python 3.6 or higher is required.")
        sys.exit(1)
    
    # Check for git
    try:
        subprocess.run(["git", "--version"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        print("  - Git: Found")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("  - Git: Not Found (Please install git to use all features)")

def setup_mcp_config(vault_path):
    print("\n--- MCP Server Configuration ---")
    print("This template uses MCP servers to connect your agent to Obsidian, GitHub, transcripts, and docs.")
    
    # Github configuration
    print("\n[GitHub MCP Configuration]")
    print("If you have a GitHub account, you can provide a Personal Access Token (PAT) to avoid rate limits and allow the agent to write/push code.")
    print("If you do not have an account, or just want to reference public repos without auth, you can leave this blank.")
    github_token = input("Enter GitHub PAT (optional, press Enter to skip): ").strip()
    
    # Context7 configuration
    print("\n[Context7 Docs MCP Configuration]")
    print("Context7 fetches live documentation for coding concepts/libraries.")
    context7_key = input("Enter Context7 API Key (optional, press Enter to skip): ").strip()
    
    # Construct MCP configuration
    mcp_config = {
        "mcpServers": {
            "obsidian": {
                "command": "npx",
                "args": ["-y", "obsidian-mcp", "--vault-path", vault_path]
            },
            "youtube-transcript": {
                "command": "npx",
                "args": ["-y", "youtube-transcript-mcp"]
            },
            "markitdown": {
                "command": "npx",
                "args": ["-y", "markitdown-mcp"]
            }
        }
    }
    
    # Add GitHub Server
    github_env = {}
    if github_token:
        github_env["GITHUB_PERSONAL_ACCESS_TOKEN"] = github_token
        
    mcp_config["mcpServers"]["github-official"] = {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-github"],
        "env": github_env
    }
    
    # Add Context7 if token is provided
    if context7_key:
        mcp_config["mcpServers"]["context7"] = {
            "command": "npx",
            "args": ["-y", "context7-mcp"],
            "env": {
                "CONTEXT7_API_KEY": context7_key
            }
        }
    
    # Write to local file
    config_path = os.path.join(os.getcwd(), "mcp-config.json")
    with open(config_path, "w") as f:
        json.dump(mcp_config, f, indent=2)
    
    print(f"\n✅ Created local MCP configuration at: {config_path}")
    print("You can copy the contents of this file into your agent client's configuration (e.g. Claude Desktop config).")
    
    return mcp_config

def setup_daemon():
    print("\n--- Scheduled Daemon Setup ---")
    daemon_script = "#!/bin/bash\n"
    daemon_script += "# Self-contained runner script for the OKF Ingestion Agent\n\n"
    daemon_script += f"cd {os.getcwd()}\n"
    daemon_script += "echo \"Running OKF Enrichment Daemon tick...\"\n"
    daemon_script += "# Replace this with your actual agent CLI runner command\n"
    daemon_script += "# Example: agy run --prompt agent_prompt_template.md --mcp mcp-config.json\n"
    
    daemon_path = os.path.join(os.getcwd(), "run_daemon.sh")
    with open(daemon_path, "w") as f:
        f.write(daemon_script)
    
    # Make executable
    try:
        os.chmod(daemon_path, 0o755)
        print(f"✅ Created executable daemon script at: {daemon_path}")
    except Exception as e:
        print(f"Created daemon script but could not make executable: {e}")

def main():
    print("=========================================")
    print("    OKF Wiki Template Setup Wizard       ")
    print("=========================================")
    
    # Get current working directory as vault path
    vault_path = os.getcwd()
    print(f"Configuring wiki vault path to: {vault_path}")
    
    check_dependencies()
    setup_mcp_config(vault_path)
    setup_daemon()
    
    print("\n=========================================")
    print("Setup Complete!")
    print("1. Review 'mcp-config.json' and import it into your agent runner.")
    print("2. Set up a cron job or scheduled task to run 'run_daemon.sh' regularly.")
    print("3. Check out README.md and AGENT.md for next steps.")
    print("=========================================")

if __name__ == "__main__":
    main()
