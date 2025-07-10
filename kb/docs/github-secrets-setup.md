# GitHub Secrets Configuration Guide

**Document Type:** Setup Documentation  
**Target Audience:** Repository Administrators  
**Package:** `@moikas/code-audit-mcp`  
**Created:** 2025-07-10

## 📋 Overview

This guide covers the configuration of GitHub repository secrets required for the automated CI/CD workflow that publishes the `@moikas/code-audit-mcp` package to npm.

## 🔐 Required Secrets

### NPM_TOKEN

**Purpose:** Authenticates the GitHub Actions workflow to publish packages to the npm registry under the `@moikas` organization.

**Security Level:** Critical - Provides write access to npm packages

#### Creating the NPM Token

1. **Login to npm:**
   - Navigate to https://www.npmjs.com
   - Sign in with your account that has publish access to `@moikas` organization

2. **Access Token Settings:**
   - Click on your profile avatar (top right)
   - Select "Access Tokens" from the dropdown menu
   - Or directly visit: https://www.npmjs.com/settings/tokens

3. **Generate New Token:**
   - Click "Generate New Token"
   - Select "Automation" token type
   - Configure token permissions:
     - **Read and Publish:** Required for publishing packages
     - **Organizations:** Select `@moikas` organization
   - Click "Generate Token"

4. **Copy Token:**
   - **IMPORTANT:** Copy the token immediately - it will not be shown again
   - The token format will be: `npm_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

#### Setting Up the GitHub Secret

1. **Navigate to Repository Settings:**
   - Go to your repository: `https://github.com/warrengates/code-audit-mcp`
   - Click on "Settings" tab
   - Select "Secrets and variables" → "Actions" from the left sidebar

2. **Add Repository Secret:**
   - Click "New repository secret"
   - **Name:** `NPM_TOKEN` (exactly as shown)
   - **Secret:** Paste the npm token you copied
   - Click "Add secret"

3. **Verify Secret:**
   - The secret should appear in the list as `NPM_TOKEN`
   - Last updated timestamp should show recent date
   - **Never share or expose this secret in logs**

## 🔧 Token Permissions Verification

### Required npm Permissions

Your npm account must have the following permissions:

1. **Organization Membership:**
   - Member of `@moikas` organization
   - Publish permission on organization packages

2. **Package Permissions:**
   - Create new packages under `@moikas` scope
   - Publish versions to existing packages
   - Manage package metadata and settings

### Verifying Organization Access

1. **Check Organization Membership:**

   ```bash
   npm org ls @moikas
   ```

2. **Verify Package Permissions:**

   ```bash
   npm access ls-packages @moikas
   ```

3. **Test Publishing Permissions (Optional):**
   ```bash
   npm publish --dry-run
   ```

## 🛡️ Security Best Practices

### Token Security

1. **Token Scope:**
   - Use minimum required permissions
   - Limit to specific organizations only
   - Set appropriate expiration dates

2. **Access Control:**
   - Only repository administrators should configure secrets
   - Use branch protection rules to prevent unauthorized workflow changes
   - Regularly audit and rotate tokens

3. **Monitoring:**
   - Monitor npm package publish activity
   - Set up notifications for package publications
   - Review GitHub Actions workflow logs for anomalies

### Secret Management

1. **Never Expose Secrets:**

   ```yaml
   # ❌ WRONG - Never do this
   - name: Debug
     run: echo "Token is ${{ secrets.NPM_TOKEN }}"

   # ✅ CORRECT - Use secrets securely
   - name: Publish
     run: npm publish
     env:
       NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
   ```

2. **Environment Variables:**
   - Use secrets only as environment variables
   - Never pass secrets as command line arguments
   - Avoid logging or echoing secret values

## 🔍 Troubleshooting Secret Issues

### Common Problems

1. **"401 Unauthorized" Error:**
   - **Cause:** Invalid or expired token
   - **Solution:** Regenerate npm token and update GitHub secret

2. **"403 Forbidden" Error:**
   - **Cause:** Insufficient permissions for organization
   - **Solution:** Verify organization membership and package permissions

3. **"Secret not found" Error:**
   - **Cause:** Secret name mismatch
   - **Solution:** Ensure secret is named exactly `NPM_TOKEN`

### Verification Steps

1. **Check Secret Existence:**
   - Navigate to repository Settings → Secrets and variables → Actions
   - Confirm `NPM_TOKEN` appears in the list

2. **Validate Token Format:**
   - npm tokens start with `npm_`
   - Should be approximately 72 characters long
   - Contains alphanumeric characters

3. **Test Token Locally (Optional):**

   ```bash
   # Set token temporarily
   export NPM_TOKEN="your_token_here"
   echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > ~/.npmrc

   # Test authentication
   npm whoami

   # Clean up
   rm ~/.npmrc
   unset NPM_TOKEN
   ```

## 📞 Support and Resources

### Documentation Links

- [npm Access Tokens Documentation](https://docs.npmjs.com/about-access-tokens)
- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [npm Organizations Guide](https://docs.npmjs.com/organizations)

### Getting Help

1. **npm Token Issues:**
   - Contact npm support: support@npmjs.com
   - Check npm status: https://status.npmjs.org

2. **GitHub Actions Issues:**
   - Review workflow logs in Actions tab
   - Check GitHub community discussions
   - Consult GitHub support documentation

3. **Organization Access:**
   - Contact `@moikas` organization administrators
   - Verify organization membership status
   - Request appropriate publishing permissions

---

**Next Steps:** After configuring the NPM_TOKEN secret, proceed to the [Workflow Usage Guide](workflow-usage-guide.md) to learn how to trigger releases.
