#!/bin/bash

# Setup script for configuring code-audit-mcp in Claude Desktop and Claude Code
# This script provides a quick way to configure MCP servers after Claude resets

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored messages
print_info() {
    echo -e "${BLUE}$1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Detect operating system
detect_os() {
    case "$(uname -s)" in
        Darwin*)    OS="macOS";;
        Linux*)     OS="Linux";;
        MINGW*|MSYS*|CYGWIN*)     OS="Windows";;
        *)          OS="Unknown";;
    esac
}

# Get Claude Desktop config path
get_claude_desktop_config() {
    case "$OS" in
        macOS)
            echo "$HOME/Library/Application Support/Claude/claude_desktop_config.json"
            ;;
        Windows)
            echo "$APPDATA/Claude/claude_desktop_config.json"
            ;;
        Linux)
            echo "$HOME/.config/Claude/claude_desktop_config.json"
            ;;
        *)
            echo ""
            ;;
    esac
}

# Get Claude Code global config path
get_claude_code_config() {
    echo "$HOME/.config/claude/mcp-settings.json"
}

# Get project config path
get_project_config() {
    echo ".claude/mcp-settings.json"
}

# Check if code-audit is installed
check_code_audit() {
    local executable=""
    
    # Check if running from development
    if [ -f "$(dirname "$0")/../bin/code-audit.js" ]; then
        executable="$(cd "$(dirname "$0")/.." && pwd)/bin/code-audit.js"
    elif command -v code-audit &> /dev/null; then
        executable="$(which code-audit)"
    else
        print_error "code-audit not found. Please install it first:"
        echo "  npm install -g @moikas/code-audit-mcp"
        exit 1
    fi
    
    echo "$executable"
}

# Create MCP server configuration
create_mcp_config() {
    local executable="$1"
    cat <<EOF
{
  "command": "$executable",
  "args": ["start", "--stdio"],
  "env": {}
}
EOF
}

# Backup existing configuration
backup_config() {
    local config_file="$1"
    if [ -f "$config_file" ]; then
        local backup_file="${config_file}.backup-$(date +%Y%m%d-%H%M%S)"
        cp "$config_file" "$backup_file"
        print_info "Backed up existing config to: $backup_file"
    fi
}

# Configure Claude Desktop
configure_claude_desktop() {
    local config_path=$(get_claude_desktop_config)
    
    if [ -z "$config_path" ]; then
        print_warning "Claude Desktop config path not found for $OS"
        return 1
    fi
    
    if [ ! -f "$config_path" ]; then
        print_warning "Claude Desktop config not found at: $config_path"
        echo "  Claude Desktop may not be installed or hasn't been run yet."
        return 1
    fi
    
    backup_config "$config_path"
    
    # Read existing config or create new one
    local config
    if [ -f "$config_path" ]; then
        config=$(cat "$config_path")
    else
        config="{}"
    fi
    
    # Add or update code-audit server
    local mcp_config=$(create_mcp_config "$1")
    config=$(echo "$config" | jq --argjson server "$mcp_config" '.mcpServers["code-audit"] = $server')
    
    # Write updated config
    echo "$config" | jq '.' > "$config_path"
    print_success "Configured Claude Desktop"
}

# Configure Claude Code (global)
configure_claude_code_global() {
    local config_path=$(get_claude_code_config)
    local config_dir=$(dirname "$config_path")
    
    # Create directory if it doesn't exist
    if [ ! -d "$config_dir" ]; then
        mkdir -p "$config_dir"
    fi
    
    if [ -f "$config_path" ]; then
        backup_config "$config_path"
    fi
    
    # Read existing config or create new one
    local config
    if [ -f "$config_path" ]; then
        config=$(cat "$config_path")
    else
        config='{"mcpServers":{}}'
    fi
    
    # Add or update code-audit server
    local mcp_config=$(create_mcp_config "$1")
    config=$(echo "$config" | jq --argjson server "$mcp_config" '.mcpServers["code-audit"] = $server')
    
    # Write updated config
    echo "$config" | jq '.' > "$config_path"
    print_success "Configured Claude Code (global)"
}

# Configure Claude Code (project)
configure_claude_code_project() {
    local config_path=$(get_project_config)
    local config_dir=$(dirname "$config_path")
    
    # Create directory if it doesn't exist
    if [ ! -d "$config_dir" ]; then
        mkdir -p "$config_dir"
    fi
    
    if [ -f "$config_path" ]; then
        backup_config "$config_path"
    fi
    
    # Create new config
    local mcp_config=$(create_mcp_config "$1")
    local config=$(jq -n --argjson server "$mcp_config" '{mcpServers: {"code-audit": $server}}')
    
    # Write config
    echo "$config" | jq '.' > "$config_path"
    print_success "Configured Claude Code (project)"
}

# Main script
main() {
    echo "🔧 Code Audit MCP Setup Script"
    echo "=============================="
    echo
    
    # Detect OS
    detect_os
    print_info "Detected OS: $OS"
    echo
    
    # Check dependencies
    if ! command -v jq &> /dev/null; then
        print_error "jq is required but not installed."
        echo "  Install it with:"
        case "$OS" in
            macOS)
                echo "    brew install jq"
                ;;
            Linux)
                echo "    sudo apt-get install jq  # Debian/Ubuntu"
                echo "    sudo yum install jq      # RHEL/CentOS"
                ;;
            *)
                echo "    Please install jq for your system"
                ;;
        esac
        exit 1
    fi
    
    # Check code-audit installation
    print_info "Checking code-audit installation..."
    EXECUTABLE=$(check_code_audit)
    print_success "Found code-audit at: $EXECUTABLE"
    echo
    
    # Parse command line arguments
    CONFIGURE_ALL=false
    CONFIGURE_DESKTOP=false
    CONFIGURE_CODE_GLOBAL=false
    CONFIGURE_PROJECT=false
    
    if [ $# -eq 0 ]; then
        CONFIGURE_ALL=true
    else
        for arg in "$@"; do
            case $arg in
                --all)
                    CONFIGURE_ALL=true
                    ;;
                --desktop)
                    CONFIGURE_DESKTOP=true
                    ;;
                --code-global)
                    CONFIGURE_CODE_GLOBAL=true
                    ;;
                --project)
                    CONFIGURE_PROJECT=true
                    ;;
                --help|-h)
                    echo "Usage: $0 [options]"
                    echo
                    echo "Options:"
                    echo "  --all          Configure all environments (default)"
                    echo "  --desktop      Configure Claude Desktop only"
                    echo "  --code-global  Configure Claude Code (global) only"
                    echo "  --project      Configure Claude Code (project) only"
                    echo "  --help         Show this help message"
                    exit 0
                    ;;
                *)
                    print_error "Unknown option: $arg"
                    echo "Use --help for usage information"
                    exit 1
                    ;;
            esac
        done
    fi
    
    # Configure selected environments
    print_info "Configuring MCP servers..."
    echo
    
    if [ "$CONFIGURE_ALL" = true ] || [ "$CONFIGURE_DESKTOP" = true ]; then
        configure_claude_desktop "$EXECUTABLE" || true
    fi
    
    if [ "$CONFIGURE_ALL" = true ] || [ "$CONFIGURE_CODE_GLOBAL" = true ]; then
        configure_claude_code_global "$EXECUTABLE" || true
    fi
    
    if [ "$CONFIGURE_ALL" = true ] || [ "$CONFIGURE_PROJECT" = true ]; then
        if [ -d ".git" ] || [ -f "package.json" ]; then
            configure_claude_code_project "$EXECUTABLE" || true
        else
            print_warning "Not in a project directory, skipping project configuration"
        fi
    fi
    
    echo
    print_success "Setup complete!"
    echo
    echo "Next steps:"
    echo "1. Restart Claude Desktop/Code to load the new configuration"
    echo "2. Run 'code-audit health' to verify the setup"
    echo "3. Use code-audit tools in Claude!"
}

# Run main function
main "$@"