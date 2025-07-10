#!/bin/bash

# GitHub Release Utilities
# Provides helper functions for release automation

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to validate version format
validate_version() {
    local version="$1"
    if [[ ! $version =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9]+)?$ ]]; then
        log_error "Invalid version format: $version"
        log_info "Expected format: x.y.z or x.y.z-suffix"
        return 1
    fi
    return 0
}

# Function to check if tag exists
check_tag_exists() {
    local tag="$1"
    if git rev-parse "$tag" >/dev/null 2>&1; then
        log_warning "Tag $tag already exists"
        return 0
    else
        log_info "Tag $tag does not exist"
        return 1
    fi
}

# Function to extract version from package.json
get_package_version() {
    local version
    version=$(node -p "require('./package.json').version")
    echo "$version"
}

# Function to check if version matches v4+ pattern
is_v4_version() {
    local version="$1"
    if [[ $version =~ ^4\. ]]; then
        return 0
    else
        return 1
    fi
}

# Function to generate changelog
generate_changelog() {
    local prev_tag="$1"
    local current_tag="$2"
    
    log_info "Generating changelog from $prev_tag to $current_tag"
    
    if [ -z "$prev_tag" ]; then
        git log --pretty=format:"- %s (%h)" --no-merges
    else
        git log "$prev_tag..$current_tag" --pretty=format:"- %s (%h)" --no-merges
    fi
}

# Function to find previous v4 tag
find_previous_v4_tag() {
    git tag --sort=-version:refname | grep "^v4\." | head -2 | tail -1 || echo ""
}

# Function to validate npm package
validate_npm_package() {
    local package_file="$1"
    
    if [ ! -f "$package_file" ]; then
        log_error "Package file not found: $package_file"
        return 1
    fi
    
    log_info "Validating npm package: $package_file"
    
    # Check if package is valid
    if tar -tzf "$package_file" >/dev/null 2>&1; then
        log_success "Package archive is valid"
    else
        log_error "Package archive is corrupted"
        return 1
    fi
    
    # Check package contents
    local has_package_json=false
    local has_bin_dir=false
    
    while IFS= read -r line; do
        if [[ $line == *"package.json" ]]; then
            has_package_json=true
        fi
        if [[ $line == *"bin/"* ]]; then
            has_bin_dir=true
        fi
    done < <(tar -tzf "$package_file")
    
    if [ "$has_package_json" = true ]; then
        log_success "Package contains package.json"
    else
        log_error "Package missing package.json"
        return 1
    fi
    
    if [ "$has_bin_dir" = true ]; then
        log_success "Package contains bin directory"
    else
        log_warning "Package missing bin directory"
    fi
    
    return 0
}

# Function to test release workflow locally
test_release_workflow() {
    local version="$1"
    local tag="v$version"
    
    log_info "Testing release workflow for version $version"
    
    # Validate version
    if ! validate_version "$version"; then
        return 1
    fi
    
    # Check if it's a v4+ version
    if ! is_v4_version "$version"; then
        log_error "Version $version is not v4+, release workflow will not trigger"
        return 1
    fi
    
    # Check if tag already exists
    if check_tag_exists "$tag"; then
        log_error "Tag $tag already exists, cannot create release"
        return 1
    fi
    
    # Test build process
    log_info "Testing build process..."
    if npm run build; then
        log_success "Build successful"
    else
        log_error "Build failed"
        return 1
    fi
    
    # Test package creation
    log_info "Testing package creation..."
    if npm pack; then
        local package_file
        package_file=$(ls ./*.tgz | head -1)
        log_success "Package created: $package_file"
        
        # Validate package
        if validate_npm_package "$package_file"; then
            log_success "Package validation passed"
        else
            log_error "Package validation failed"
            return 1
        fi
        
        # Clean up test package
        rm -f "$package_file"
    else
        log_error "Package creation failed"
        return 1
    fi
    
    # Test changelog generation
    log_info "Testing changelog generation..."
    local prev_tag
    prev_tag=$(find_previous_v4_tag)
    local changelog
    changelog=$(generate_changelog "$prev_tag" "$tag")
    
    if [ -n "$changelog" ]; then
        log_success "Changelog generated successfully"
        log_info "Preview of changelog:"
        echo "$changelog" | head -5
    else
        log_warning "No commits found for changelog"
    fi
    
    log_success "Release workflow test completed successfully"
    log_info "Ready to create tag: git tag $tag && git push origin $tag"
    
    return 0
}

# Function to create release tag safely
create_release_tag() {
    local version="$1"
    local tag="v$version"
    
    log_info "Creating release tag for version $version"
    
    # Validate inputs
    if ! validate_version "$version"; then
        return 1
    fi
    
    if ! is_v4_version "$version"; then
        log_error "Version $version is not v4+, will not trigger release workflow"
        return 1
    fi
    
    if check_tag_exists "$tag"; then
        log_error "Tag $tag already exists"
        return 1
    fi
    
    # Check if working directory is clean
    if ! git diff-index --quiet HEAD --; then
        log_error "Working directory is not clean. Please commit or stash changes."
        return 1
    fi
    
    # Get current package.json version
    local pkg_version
    pkg_version=$(get_package_version)
    
    if [ "$version" != "$pkg_version" ]; then
        log_error "Version mismatch: package.json has $pkg_version, but trying to tag $version"
        log_info "Please update package.json version first"
        return 1
    fi
    
    # Create and push tag
    log_info "Creating tag $tag..."
    git tag -a "$tag" -m "Release version $version"
    
    log_info "Pushing tag to origin..."
    git push origin "$tag"
    
    log_success "Tag $tag created and pushed successfully"
    log_info "GitHub Actions workflow will now trigger automatically"
    log_info "Monitor progress at: https://github.com/warrengates/code-audit-mcp/actions"
    
    return 0
}

# Function to check release status
check_release_status() {
    local tag="$1"
    
    log_info "Checking release status for tag $tag"
    
    # Check if tag exists
    if ! check_tag_exists "$tag"; then
        log_error "Tag $tag does not exist"
        return 1
    fi
    
    # Check if GitHub release exists (requires gh CLI)
    if command -v gh >/dev/null 2>&1; then
        if gh release view "$tag" >/dev/null 2>&1; then
            log_success "GitHub release exists for $tag"
            gh release view "$tag"
        else
            log_warning "No GitHub release found for $tag"
        fi
    else
        log_warning "GitHub CLI (gh) not installed, cannot check release status"
        log_info "Install with: brew install gh"
    fi
    
    # Check NPM package
    local version="${tag#v}"
    log_info "Checking NPM package for version $version"
    
    if npm view "@moikas/code-audit-mcp@$version" >/dev/null 2>&1; then
        log_success "NPM package published for version $version"
        npm view "@moikas/code-audit-mcp@$version" --json
    else
        log_warning "NPM package not found for version $version"
    fi
    
    return 0
}

# Main function for CLI usage
main() {
    case "${1:-}" in
        "validate")
            validate_version "${2:-}"
            ;;
        "test")
            test_release_workflow "${2:-}"
            ;;
        "create-tag")
            create_release_tag "${2:-}"
            ;;
        "check-status")
            check_release_status "${2:-}"
            ;;
        "changelog")
            local prev_tag="${2:-}"
            local current_tag="${3:-HEAD}"
            generate_changelog "$prev_tag" "$current_tag"
            ;;
        *)
            echo "Usage: $0 {validate|test|create-tag|check-status|changelog} [args...]"
            echo ""
            echo "Commands:"
            echo "  validate <version>           Validate version format"
            echo "  test <version>              Test release workflow locally"
            echo "  create-tag <version>        Create and push release tag"
            echo "  check-status <tag>          Check release status"
            echo "  changelog <prev_tag> [tag]  Generate changelog"
            echo ""
            echo "Examples:"
            echo "  $0 validate 4.1.0"
            echo "  $0 test 4.1.0"
            echo "  $0 create-tag 4.1.0"
            echo "  $0 check-status v4.1.0"
            echo "  $0 changelog v4.0.0 v4.1.0"
            exit 1
            ;;
    esac
}

# Run main function if script is executed directly
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    main "$@"
fi