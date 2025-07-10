# GitHub Workflow Setup for NPM Publishing

**Issue Created:** 2025-07-10
**Status:** 🔧 IN PROGRESS
**Priority:** HIGH

## 📋 Issue Description

Create GitHub Actions workflow to automate the publishing process for `@moikas/code-audit-mcp` package to npm registry.

## 🎯 Requirements

### Core Workflow Features
- ✅ **Trigger on v4+ tags** - Workflow activates on version tags starting with v4
- ✅ **Build and test** - Run complete test suite before publishing
- ✅ **Artifact creation** - Generate and store build artifacts
- ✅ **NPM publishing** - Automated publish to `@moikas/code-audit-mcp`
- ✅ **Security** - Use GitHub secrets for NPM token
- ✅ **Multi-platform** - Test on multiple Node.js versions and OS

### Workflow Configuration
- **Trigger:** Git tags matching `v4.*`
- **Package Name:** `@moikas/code-audit-mcp`
- **Registry:** npm (npmjs.org)
- **Access:** Public package
- **Node Versions:** 18.x, 20.x, 22.x
- **OS Matrix:** ubuntu-latest, windows-latest, macos-latest

## 🔧 Implementation Tasks

### 1. GitHub Actions Workflow File
- [ ] Create `.github/workflows/publish.yml`
- [ ] Configure trigger on v4+ tags
- [ ] Set up Node.js matrix testing
- [ ] Add npm publishing step

### 2. Security Configuration
- [ ] Document required GitHub secrets
- [ ] Set up NPM_TOKEN secret
- [ ] Configure package access permissions

### 3. Testing Integration
- [ ] Run local test suite in CI
- [ ] Validate package creation
- [ ] Ensure cross-platform compatibility

### 4. Artifact Management
- [ ] Store build artifacts
- [ ] Generate release notes
- [ ] Create GitHub release

## 📝 Required GitHub Secrets

The following secrets need to be configured in the GitHub repository:

### NPM_TOKEN
- **Description:** NPM authentication token for publishing
- **Scope:** Publish access to `@moikas` organization
- **Setup:** 
  1. Create token at https://www.npmjs.com/settings/tokens
  2. Select "Automation" token type
  3. Grant publish access to `@moikas` organization
  4. Add to GitHub repository secrets as `NPM_TOKEN`

## 🚀 Expected Workflow Process

1. **Tag Creation:** Developer creates tag like `v4.0.0`
2. **Workflow Trigger:** GitHub Actions detects tag and starts workflow
3. **Multi-platform Testing:** 
   - Test on Node 18, 20, 22
   - Test on Ubuntu, Windows, macOS
   - Run full test suite
4. **Package Creation:** Generate npm package
5. **Publishing:** Publish to `@moikas/code-audit-mcp`
6. **Release:** Create GitHub release with artifacts

## 📊 Success Criteria

- [ ] Workflow triggers correctly on v4+ tags
- [ ] All tests pass on all platforms
- [ ] Package publishes successfully to npm
- [ ] GitHub release is created automatically
- [ ] Users can install via `npm install -g @moikas/code-audit-mcp`

## 🔗 Related Files

- `.github/workflows/publish.yml` (to be created)
- `package.json` (already configured)
- `test-local.js` (existing test suite)
- Repository secrets configuration

## 📅 Timeline

- **Immediate:** Create workflow file
- **Next:** Test workflow with test tag
- **Final:** Production release with v4.0.0

This issue tracks the creation of automated CI/CD pipeline for seamless package publishing and distribution.