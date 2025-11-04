# Versioning & Release Process

This document describes the automated versioning and release process for OCF Front.

## Overview

The project uses a **single source of truth** for versioning: the `VERSION` file at the repository root. All version references throughout the codebase read directly from this file - no synchronization scripts needed.

## Architecture

### Single Source of Truth

```
VERSION (root)
  ↓
  ├─→ vite.config.ts (reads at build time)
  │     ↓
  │     └─→ __APP_VERSION__ (injected into app)
  │           ↓
  │           └─→ Application UI (displays in settings)
  │
  └─→ check:version job (compares with latest git tag)
        ↓
        └─→ Auto-creates git tag (v1.2.3)
              ↓
              ├─→ Triggers build:app (creates dist/)
              ├─→ Triggers build:docker (creates images)
              └─→ Triggers release:create (creates GitLab release)
```

### How It Works

1. **VERSION File**: Contains a single line with the version number (e.g., `0.0.1`)

2. **Build Time Injection**: `vite.config.ts` reads the VERSION file and injects it as `__APP_VERSION__` constant
   ```typescript
   // Automatically available in all Vue components
   const version = __APP_VERSION__
   ```

3. **Auto-Tagging**: The `check:version` job compares VERSION file with latest git tag:
   - If different → creates and pushes new tag
   - If same → does nothing

4. **Tag-Triggered Builds**: Only when a version tag (v*) is pushed:
   - Build jobs compile the application
   - Docker jobs create tagged images
   - Release jobs create GitLab releases with auto-generated notes

## Release Workflow

### 1. Update Version

Simply edit the VERSION file:

```bash
echo "1.2.3" > VERSION
git add VERSION
git commit -m "chore: bump version to 1.2.3"
git push origin main
```

### 2. Automatic Pipeline (First Run)

**Stage 1: Check**
- `check:version` job runs on main branch
- Compares VERSION file (`1.2.3`) with latest git tag (`v1.2.2`)
- Creates and pushes tag `v1.2.3`
- **Triggers a second pipeline for the new tag**

### 3. Automatic Pipeline (Second Run - Tag Pipeline)

**Stage 2: Build** (only runs on tag pipelines)
- `build:app`: Compiles application with embedded version
  - Runs `npm ci && npm run build`
  - Creates artifacts in `dist/`
  - Version is embedded as `__APP_VERSION__`

- `build:docker`: Creates Docker images
  - Tags: `$CI_REGISTRY_IMAGE:1.2.3` and `:latest`
  - Pushes to GitLab Container Registry

**Stage 3: Release** (only runs on tag pipelines)
- `release:create`: Creates GitLab release
  - Tag name: `v1.2.3`
  - Generates release notes from git commits
  - Categorizes changes by type (features, fixes, etc.)

### 4. Version Display

The application displays the version in User Settings (src/components/Pages/UserSettings.vue:52):
- **French**: "Version de l'application: 1.2.3"
- **English**: "Application Version: 1.2.3"

## Version Number Format

We use semantic versioning (SemVer):

```
MAJOR.MINOR.PATCH
```

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

Examples:
- `0.0.1` - Initial version
- `0.1.0` - First feature release
- `1.0.0` - Production ready
- `1.0.1` - Bug fix
- `1.1.0` - New feature

## CI/CD Configuration

### Pipeline Stages

The `.gitlab-ci.yml` defines three stages:

1. **check**: Version validation and auto-tagging
   - `check:version`: Runs on main branch commits
   - Compares VERSION file with latest git tag
   - Creates and pushes tag if version changed

2. **build**: Artifact and image creation
   - `build:app`: Compiles Vue application → `dist/` artifacts
   - `build:docker`: Creates Docker images (version + latest tags)
   - **Only runs on version tag pipelines** (v*)

3. **release**: GitLab release creation
   - `release:create`: Auto-generates release notes from commits
   - `release:manual`: Manual release creation with custom tag
   - **Only runs on version tag pipelines** (v*)

### Pipeline Rules

**check:version** runs when:
- Commit is on main branch: `if: $CI_COMMIT_BRANCH == "main"`

**build/release jobs** run when:
- Pipeline triggered by version tag: `if: $CI_COMMIT_TAG =~ /^v/`

This ensures:
- No builds on feature branches
- No builds on non-version commits to main
- Builds only happen after version tags are created

### Required GitLab Variables

**Predefined** (automatically available):
- `$CI_REGISTRY_IMAGE` - Container registry URL
- `$CI_REGISTRY_USER` - Registry username
- `$CI_REGISTRY_PASSWORD` - Registry password
- `$CI_COMMIT_TAG` - Current tag (if pipeline triggered by tag)
- `$CI_COMMIT_SHA` - Current commit SHA
- `$CI_DEFAULT_BRANCH` - Main branch name (usually "main")
- `$CI_SERVER_HOST` - GitLab server hostname
- `$CI_PROJECT_PATH` - Project path (group/project)

**Optional** (must be configured):
- `$CI_PUSH_TOKEN` - Personal access token with `write_repository` scope
  - Required for `check:version` to push tags
  - Fallback: `$CI_JOB_TOKEN` (may lack push permissions)
  - Configure in: Settings → CI/CD → Variables

### Setting Up CI_PUSH_TOKEN

1. Create personal access token:
   - Go to: User Settings → Access Tokens
   - Scopes: `write_repository`, `api`
   - Expiration: Set appropriate expiry

2. Add as CI/CD variable:
   - Go to: Project → Settings → CI/CD → Variables
   - Key: `CI_PUSH_TOKEN`
   - Value: Your token
   - Flags: ✓ Mask variable, ✗ Protect variable (unless only for protected branches)

## Files Modified

1. **VERSION** (new) - Single source of truth for versioning
2. **vite.config.ts** - Reads VERSION and injects into build as `__APP_VERSION__`
3. **src/vite-env.d.ts** - TypeScript declaration for `__APP_VERSION__`
4. **.gitlab-ci.yml** - Complete CI/CD pipeline with auto-tagging
5. **scripts/generate-release-notes.sh** (new) - Auto-generates release notes from git commits
6. **src/components/Pages/UserSettings.vue** - Version display UI (French + English)
7. **VERSIONING.md** (new) - This documentation

## Using Version in Code

### In Vue Components

```vue
<template>
  <div>Version: {{ appVersion }}</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const appVersion = computed(() => __APP_VERSION__)
</script>
```

### In TypeScript/JavaScript

```typescript
// Direct access (defined globally by Vite)
console.log('App version:', __APP_VERSION__)
```

## Benefits

1. **No Scripts Needed**: No version synchronization scripts required
2. **Single Source of Truth**: Change version in VERSION file only
3. **Fully Automatic**: Push to main → auto-tag → auto-build → auto-release
4. **Type-Safe**: TypeScript knows about `__APP_VERSION__`
5. **Build-Time Injection**: No runtime overhead - version embedded at build
6. **Smart Triggering**: Builds only run on version tags, not every commit
7. **Auto-Generated Release Notes**: Categorizes commits by type (feat, fix, etc.)
8. **GitLab Native**: Uses GitLab's built-in release and registry systems
9. **Two-Pipeline Separation**: Check phase separate from build/release
10. **Follows Backend Pattern**: Consistent with ocf-core backend workflow

## Release Notes Generation

The `scripts/generate-release-notes.sh` script automatically:

1. Finds the previous version tag using version sorting (works in shallow clones)
2. Extracts all commits between tags (or from initial commit for first release)
3. Categorizes commits by conventional commit types:
   - ✨ **Features**: `feat:` commits
   - 🐛 **Bug Fixes**: `fix:` commits
   - ⚡ **Performance**: `perf:` commits
   - ♻️ **Refactoring**: `refactor:` commits
   - 💄 **Styling**: `style:` commits
   - 🧪 **Tests**: `test:` commits
   - 🔧 **CI/CD**: `ci:` commits
   - 📝 **Documentation**: `docs:` commits
   - 🏗️ **Chores**: `chore:` commits
   - 📦 **Other Changes**: Everything else

4. Adds "Full Changelog" link comparing tags
5. Adds installation instructions (Docker and source)

### Conventional Commits

To get well-organized release notes, use conventional commit messages:

```bash
git commit -m "feat: add user profile page"
git commit -m "feat(auth): implement OAuth2 login"
git commit -m "fix: resolve login redirect issue"
git commit -m "fix(terminal): handle reconnection properly"
git commit -m "perf: optimize bundle size"
git commit -m "refactor: simplify authentication flow"
git commit -m "style: update button colors for dark mode"
git commit -m "test: add unit tests for user store"
git commit -m "ci: add automated version tagging"
git commit -m "docs: update installation guide"
git commit -m "chore: bump version to 1.2.3"
```

**Format**: `<type>(<scope>): <description>`
- **type**: One of the categories above
- **scope**: Optional, indicates what part of the codebase
- **description**: Short summary in imperative mood

## Troubleshooting

### check:version Job Fails to Push Tag

**Error**: "Failed to push tag"

**Causes**:
- `CI_PUSH_TOKEN` not configured
- Token lacks `write_repository` scope
- Protected tags preventing CI pushes

**Solution**:
1. Create personal access token with `write_repository` scope
2. Add as `CI_PUSH_TOKEN` in CI/CD variables
3. Or: Adjust protected tag settings to allow CI to push

### Tag Created But No Build Pipeline

**Symptom**: `check:version` succeeds but no build happens

**Cause**: Tag pipeline not triggered

**Solution**:
- Check GitLab → CI/CD → Pipelines for tag pipeline
- Verify tag format matches `v*` pattern (e.g., `v1.2.3`)
- Check pipeline rules in `.gitlab-ci.yml`

### Build Jobs Not Running

**Symptom**: Pipeline runs but build jobs skipped

**Cause**: Jobs only run on tag pipelines, not branch pipelines

**Verify**:
- Pipeline triggered by tag (not branch)
- Tag matches pattern: `if: $CI_COMMIT_TAG =~ /^v/`

### Version Not Updating in App

**Solution**:
- Clear browser cache (Ctrl+Shift+R)
- Rebuild: `npm run build`
- Verify `vite.config.ts` reads VERSION correctly
- Check `__APP_VERSION__` is defined in built files

### Docker Push Fails

**Error**: Authentication or permission errors

**Solution**:
- Verify `$CI_REGISTRY_USER` and `$CI_REGISTRY_PASSWORD` are set
- Check GitLab Container Registry is enabled for project
- Ensure runner has access to Docker daemon

### TypeScript Errors

**Error**: `Cannot find name '__APP_VERSION__'`

**Solution**:
- Ensure `src/vite-env.d.ts` contains: `declare const __APP_VERSION__: string`
- Restart TypeScript server in IDE
- Run: `npm run build` to verify it works

## Pipeline Visualization

Here's what happens when you push a version change:

```
┌─────────────────────────────────────────────────────────────┐
│ Developer Action                                             │
│                                                              │
│  echo "1.2.3" > VERSION                                     │
│  git commit -m "chore: bump version to 1.2.3"               │
│  git push origin main                                        │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Pipeline #1 (main branch)                                    │
│                                                              │
│  Stage: check                                               │
│   ✓ check:version                                           │
│     - Read VERSION: "1.2.3"                                 │
│     - Latest tag: "v1.2.2"                                  │
│     - Create tag: "v1.2.3"                                  │
│     - Push tag to GitLab                                    │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼  (GitLab triggers tag pipeline)
┌─────────────────────────────────────────────────────────────┐
│ Pipeline #2 (v1.2.3 tag)                                     │
│                                                              │
│  Stage: build                                               │
│   ✓ build:app                                               │
│     - npm ci && npm run build                               │
│     - Create dist/ artifacts                                │
│   ✓ build:docker                                            │
│     - Build image                                           │
│     - Tag: 1.2.3, latest                                    │
│     - Push to registry                                      │
│                                                              │
│  Stage: release                                             │
│   ✓ release:create                                          │
│     - Generate release notes                                │
│     - Create GitLab release                                 │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
              ✅ Release Complete!
         Docker Image: registry/ocf-front:1.2.3
         GitLab Release: v1.2.3 with notes
```

## Future Enhancements

Possible improvements:

1. ✅ ~~Add changelog generation~~ (implemented via generate-release-notes.sh)
2. Include build date/time in version info
3. Add git commit hash to version display
4. Create version comparison UI (what's new)
5. Add automated testing before build stage
6. Implement staging environment deployments
7. Add rollback mechanism for failed releases

## Related Documentation

- [CLAUDE.md](CLAUDE.md) - Project architecture and guidelines
- [package.json](package.json) - NPM package configuration
- [vite.config.ts](vite.config.ts) - Build configuration
