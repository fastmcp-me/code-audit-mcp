# GitHub Actions Workflow Usage Guide

**Document Type:** User Guide  
**Target Audience:** Developers and Release Managers  
**Package:** `@moikas/code-audit-mcp`  
**Created:** 2025-07-10  

## 📋 Overview

This guide explains how to use the GitHub Actions workflow to automatically publish releases of the `@moikas/code-audit-mcp` package to npm. The workflow is triggered by version tags starting with `v4` and handles testing, building, and publishing automatically.

## 🚀 Quick Start

### Triggering a Release

1. **Ensure your changes are committed and pushed to the main branch**
2. **Create and push a version tag:**
   ```bash
   git tag v4.0.0
   git push origin v4.0.0
   ```
3. **Monitor the workflow in GitHub Actions tab**
4. **Verify the package is published to npm**

## 🏷️ Version Tag Requirements

### Tag Format

The workflow is triggered by tags matching the pattern: `v4.*`

**Valid Tag Examples:**
- `v4.0.0` - Major release
- `v4.1.0` - Minor release  
- `v4.0.1` - Patch release
- `v4.1.2-beta.1` - Pre-release
- `v4.2.0-alpha.3` - Alpha release

**Invalid Tags (Will NOT trigger workflow):**
- `v3.0.0` - Version 3.x (not supported)
- `v5.0.0` - Version 5.x (not yet supported)
- `4.0.0` - Missing 'v' prefix
- `version-4.0.0` - Wrong format

### Creating Version Tags

#### Method 1: Command Line (Recommended)

```bash
# 1. Ensure you're on the main branch with latest changes
git checkout main
git pull origin main

# 2. Update package.json version (optional - can be done manually)
npm version 4.0.0 --no-git-tag-version

# 3. Commit version update
git add package.json
git commit -m "chore: bump version to 4.0.0"
git push origin main

# 4. Create and push the tag
git tag v4.0.0
git push origin v4.0.0
```

#### Method 2: GitHub Web Interface

1. Navigate to your repository on GitHub
2. Click "Releases" in the right sidebar
3. Click "Create a new release"
4. In "Choose a tag" dropdown, enter your tag (e.g., `v4.0.0`)
5. Select "Create new tag: v4.0.0 on publish"
6. Add release title and description
7. Click "Publish release"

## 📊 Workflow Process Overview

### What Happens When You Push a v4+ Tag

1. **Trigger Detection (< 1 minute)**
   - GitHub detects the new tag
   - Workflow starts automatically
   - Initial setup and checkout

2. **Multi-Platform Testing (5-10 minutes)**
   - Tests run on 9 different environments:
     - Node.js versions: 18.x, 20.x, 22.x
     - Operating systems: Ubuntu, Windows, macOS
   - All tests must pass to continue

3. **Package Creation (2-3 minutes)**
   - TypeScript compilation
   - Package building and validation
   - Artifact generation

4. **NPM Publishing (1-2 minutes)**
   - Authentication with npm registry
   - Publishing to `@moikas/code-audit-mcp`
   - Version validation

5. **Release Creation (1 minute)**
   - GitHub release with artifacts
   - Release notes generation
   - Asset uploading

**Total Duration:** Approximately 10-15 minutes

### Workflow Status Monitoring

#### GitHub Actions Tab

1. Go to your repository on GitHub
2. Click the "Actions" tab
3. Find your workflow run (named after your tag)
4. Click on the run to see detailed progress

#### Status Indicators

- 🟡 **Yellow dot:** Workflow in progress
- ✅ **Green checkmark:** Workflow completed successfully
- ❌ **Red X:** Workflow failed
- ⏸️ **Gray dot:** Workflow waiting or cancelled

## 🎯 Expected Workflow Behavior

### Successful Release Process

1. **All Tests Pass:**
   - Unit tests execute successfully on all platforms
   - Integration tests complete without errors
   - Cross-platform compatibility verified

2. **Package Published:**
   - New version appears on npm: https://www.npmjs.com/package/@moikas/code-audit-mcp
   - Package can be installed globally: `npm install -g @moikas/code-audit-mcp`
   - CLI command works: `code-audit --version`

3. **GitHub Release Created:**
   - Release appears in repository's "Releases" section
   - Contains downloadable assets (source code, package artifacts)
   - Includes auto-generated release notes

### Verification Steps

#### 1. Check npm Publication

```bash
# View latest version on npm
npm view @moikas/code-audit-mcp version

# Install the new version globally
npm install -g @moikas/code-audit-mcp@latest

# Verify installation
code-audit --version
```

#### 2. Verify GitHub Release

1. Navigate to repository "Releases" section
2. Confirm new release with your tag version
3. Download and test attached artifacts

#### 3. Test Installation

```bash
# Fresh installation test
npm uninstall -g @moikas/code-audit-mcp
npm install -g @moikas/code-audit-mcp
code-audit --help
```

## 🔄 Release Workflow Examples

### Example 1: Major Version Release

```bash
# Scenario: Releasing v4.0.0 with breaking changes

# 1. Prepare the release
git checkout main
git pull origin main

# 2. Update package.json manually to 4.0.0
# Edit package.json: "version": "4.0.0"

# 3. Commit the version bump
git add package.json
git commit -m "chore: bump version to 4.0.0

BREAKING CHANGES:
- Updated CLI interface
- Changed configuration format
- Removed deprecated commands"
git push origin main

# 4. Create the release tag
git tag v4.0.0
git push origin v4.0.0

# 5. Monitor workflow in GitHub Actions
# 6. Verify publication on npm
```

### Example 2: Patch Release

```bash
# Scenario: Quick bug fix release v4.0.1

# 1. Fix implemented and tested locally
# 2. Update version
npm version 4.0.1 --no-git-tag-version
git add package.json
git commit -m "fix: resolve CLI startup issue

- Fixed configuration loading error
- Improved error handling for missing files"
git push origin main

# 3. Tag and release
git tag v4.0.1
git push origin v4.0.1
```

### Example 3: Pre-release (Beta)

```bash
# Scenario: Beta version v4.1.0-beta.1

# 1. Prepare beta release
npm version 4.1.0-beta.1 --no-git-tag-version
git add package.json
git commit -m "chore: prepare beta release 4.1.0-beta.1"
git push origin main

# 2. Create beta tag
git tag v4.1.0-beta.1
git push origin v4.1.0-beta.1

# 3. Install beta version
npm install -g @moikas/code-audit-mcp@beta
```

## ⚙️ Workflow Configuration

### Node.js Version Matrix

The workflow tests on multiple Node.js versions to ensure compatibility:

- **Node.js 18.x** - LTS (Long Term Support)
- **Node.js 20.x** - Current LTS
- **Node.js 22.x** - Latest stable

### Operating System Matrix

Cross-platform testing ensures the CLI works everywhere:

- **Ubuntu Latest** - Linux environments
- **Windows Latest** - Windows environments  
- **macOS Latest** - macOS environments

### Quality Gates

Before publishing, the workflow verifies:

1. **TypeScript Compilation:** No build errors
2. **Test Suite:** All tests pass on all platforms
3. **Package Creation:** Package builds successfully
4. **CLI Functionality:** Basic CLI commands work
5. **Dependencies:** All dependencies resolve correctly

## 📅 Release Planning

### Version Strategy

Follow semantic versioning (semver) for the v4.x series:

- **Major (v4.0.0 → v5.0.0):** Breaking changes
- **Minor (v4.0.0 → v4.1.0):** New features, backward compatible
- **Patch (v4.0.0 → v4.0.1):** Bug fixes, backward compatible

### Release Frequency

- **Patch releases:** As needed for critical bugs
- **Minor releases:** Monthly or bi-monthly feature releases
- **Major releases:** Planned breaking changes only

### Pre-release Testing

Before official releases, consider:

1. **Alpha releases:** `v4.1.0-alpha.1` for early testing
2. **Beta releases:** `v4.1.0-beta.1` for wider testing
3. **Release candidates:** `v4.1.0-rc.1` for final validation

---

**Next Steps:** If you encounter issues during the release process, consult the [Troubleshooting Guide](troubleshooting-guide.md).