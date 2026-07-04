#!/usr/bin/env python3
import os
import sys
import json
import argparse
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
        print("  - Git: Not Found (Please install Git for repository tracking)")

    # Check for Node/npm/npx (Required for MCP servers)
    try:
        subprocess.run(["npx", "--version"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        print("  - Node/npx: Found")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("  - Warning: Node/npx not found. Most MCP servers require Node.js to be installed.")

def create_directory_structure(vault_path):
    print("\nCreating directory structure...")
    
    default_raw_dirs = ["articles", "youtube", "notes", "papers", "github", "tutorials"]
    selected_raw_dirs = default_raw_dirs.copy()
    
    is_interactive = sys.stdin.isatty()
    
    if is_interactive:
        print("\n[Raw Directory Setup]")
        print("By default, the following subdirectories are created in 'raw/':")
        print(", ".join(default_raw_dirs))
        
        keep_defaults = input("Do you want to keep all of these default folders? (Y/n): ").strip().lower()
        if keep_defaults == 'n':
            selected_raw_dirs = []
            for d in default_raw_dirs:
                ans = input(f"Keep 'raw/{d}'? (Y/n): ").strip().lower()
                if ans != 'n':
                    selected_raw_dirs.append(d)
        
        custom_dirs_input = input("Enter any additional folders you want to create in 'raw/' (comma-separated, or press Enter to skip): ").strip()
        if custom_dirs_input:
            custom_dirs = [d.strip() for d in custom_dirs_input.split(",") if d.strip()]
            for d in custom_dirs:
                if d not in selected_raw_dirs:
                    selected_raw_dirs.append(d)
    
    dirs = [f"raw/{d}" for d in selected_raw_dirs] + [
        "wiki/sources", "wiki/concepts", "wiki/entities", "wiki/queries",
        "templates", "assets"
    ]
    
    for d in dirs:
        dir_path = os.path.join(vault_path, d)
        os.makedirs(dir_path, exist_ok=True)
        # Create .gitkeep to ensure empty folders are tracked by git
        gitkeep_path = os.path.join(dir_path, ".gitkeep")
        if not os.path.exists(gitkeep_path):
            with open(gitkeep_path, "w") as f:
                f.write("")
    print("✅ Directory structure initialized with .gitkeep files.")

def setup_mcp_config(vault_path, github_token=None, context7_key=None):
    print("\n--- MCP Server Configuration ---")
    
    # Check if we are running in an interactive terminal
    is_interactive = sys.stdin.isatty()
    
    if not github_token and is_interactive:
        print("\n[GitHub MCP Configuration]")
        print("If you have a GitHub account, you can provide a Personal Access Token (PAT) to avoid rate limits and allow the agent to write/push code.")
        print("If you do not have an account, or just want to reference public repos without auth, you can leave this blank.")
        github_token = input("Enter GitHub PAT (optional, press Enter to skip): ").strip()
        
    if not context7_key and is_interactive:
        print("\n[Context7 Docs MCP Configuration]")
        print("Context7 fetches live documentation for coding concepts/libraries.")
        context7_key = input("Enter Context7 API Key (optional, press Enter to skip): ").strip()
        
    # Construct MCP configuration
    mcp_config = {
        "mcpServers": {
            "obsidian": {
                "command": "npx",
                "args": ["-y", "obsidian-mcp", vault_path]
            },
            "youtube-transcript": {
                "command": "npx",
                "args": ["-y", "@sinco-lab/mcp-youtube-transcript"]
            },
            "markitdown": {
                "command": "uvx",
                "args": ["markitdown-mcp"]
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
            "args": ["-y", "@upstash/context7-mcp"],
            "env": {
                "CONTEXT7_API_KEY": context7_key
            }
        }
    
    # Write to local file
    config_path = os.path.join(vault_path, "mcp-config.json")
    with open(config_path, "w") as f:
        json.dump(mcp_config, f, indent=2)
    
    print(f"✅ Created local MCP configuration at: {config_path}")
    return mcp_config

def setup_daemon(vault_path):
    print("\n--- Scheduled Daemon Setup ---")
    daemon_script = f"""#!/bin/bash
# Self-contained runner script for the OKF Ingestion Agent
cd "{vault_path}"

echo "Running OKF Enrichment Daemon tick..."

# Check for available agent CLI runners and execute
if command -v agy &> /dev/null; then
  agy run --prompt agent_prompt_template.md --mcp mcp-config.json
elif command -v claude &> /dev/null; then
  claude --prompt agent_prompt_template.md --mcp mcp-config.json
else
  echo "Error: No agent runner CLI (e.g., agy or claude) found in PATH."
  echo "Please run the agent manually with the 'agent_prompt_template.md' prompt."
  exit 1
fi
"""
    
    daemon_path = os.path.join(vault_path, "run_daemon.sh")
    with open(daemon_path, "w") as f:
        f.write(daemon_script)
    
    # Make executable
    try:
        os.chmod(daemon_path, 0o755)
        print(f"✅ Created executable daemon script at: {daemon_path}")
    except Exception as e:
        print(f"Created daemon script but could not make executable: {e}")

def main():
    parser = argparse.ArgumentParser(description="OKF Wiki Template Setup Wizard")
    parser.add_argument("--vault-path", default=os.getcwd(), help="Absolute path to the wiki vault")
    parser.add_argument("--github-token", default=None, help="GitHub Personal Access Token (optional)")
    parser.add_argument("--context7-key", default=None, help="Context7 API Key (optional)")
    parser.add_argument("--dry-run", action="store_true", help="Perform a dry run without writing files")
    
    args = parser.parse_args()
    
    print("=========================================")
    print("    OKF Wiki Template Setup Wizard       ")
    print("=========================================")
    
    vault_path = os.path.abspath(args.vault_path)
    print(f"Target vault path: {vault_path}")
    
    if args.dry_run:
        print("Dry run requested. No changes will be written.")
        check_dependencies()
        return
        
    check_dependencies()
    create_directory_structure(vault_path)
    setup_mcp_config(vault_path, args.github_token, args.context7_key)
    setup_daemon(vault_path)
    
    print("\n=========================================")
    print("Setup Complete!")
    print("1. Review 'mcp-config.json' and import it into your agent runner.")
    print("2. Set up a cron job or scheduled task to run 'run_daemon.sh' regularly.")
    print("3. Check out README.md and AGENTS.md for next steps.")
    print("=========================================")

if __name__ == "__main__":
    main()
