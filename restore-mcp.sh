#!/bin/bash

# Quick script to restore MCP configuration after Claude reset
# Uses the claude-mcp-manager tool

MANAGER_PATH="/Users/warrengates/Documents/code/claude-mcp-manager"

if [ ! -d "$MANAGER_PATH" ]; then
    echo "❌ Claude MCP Manager not found at $MANAGER_PATH"
    echo "Please ensure claude-mcp-manager is installed"
    exit 1
fi

echo "🔧 Restoring MCP configuration..."

# Use the manager to load the saved configuration
cd "$MANAGER_PATH"
node bin/claude-mcp.js load current-setup

echo ""
echo "✅ Configuration restored!"
echo "🔄 Please restart Claude Code to apply changes"