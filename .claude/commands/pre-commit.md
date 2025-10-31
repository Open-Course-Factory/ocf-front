---
description: Comprehensive pre-commit validation (run before every commit)
tags: [commit, validation, quality, ci]
---

# Pre-Commit Review Agent

Comprehensive validation before committing code. Acts as your automated quality gate.

**IMPORTANT:** Pre-commit checks should ONLY analyze files that are about to be committed (modified/staged files), not the entire project.

**ATOMIC COMMITS:** Each commit should focus on ONE subject/concern. If changes span multiple domains, split into separate commits.

## Pre-Commit Checklist

### Phase 0: Commit Scope Analysis (Critical)

#### 0.1 Identify Modified Files
```bash
# Get list of modified files
git diff HEAD --name-only

# Or for staged files only
git diff --cached --name-only
```

#### 0.2 Detect Multiple Subjects
**Check if changes span multiple domains/concerns:**

```bash
# Analyze file paths to detect different subjects
MODIFIED_FILES=$(git diff HEAD --name-only)

# Check for changes in different domains:
# - Components (UI changes)
# - Stores (state management)
# - Services (business logic)
# - Types (data models)
# - Utils (utilities)
# - Composables (Vue composables)
# - Styles (CSS)
```

**Subject detection logic:**
- Changes in `src/components/` = UI/Component subject
- Changes in `src/stores/` = State management subject
- Changes in `src/services/` = Business logic subject
- Changes in `src/types/` = Type definitions subject
- Changes in `src/composables/` = Composable subject
- Changes in `src/views/Pages/` = Page/feature subject
- Changes in `package.json` = Dependency subject

**Examples of single-subject commits (GOOD):**
- ✅ Only files in `src/components/Pages/GroupDetail.vue` + `src/composables/useGroupMembers.ts` = Group detail feature
- ✅ Only files in `src/stores/users.ts` + `src/types/entities.ts` = User store enhancement
- ✅ Only files in `src/services/domain/terminal/` = Terminal service refactoring

**Examples of multi-subject commits (BAD - should split):**
- ❌ Files in `src/components/Login.vue` + `src/stores/subscriptions.ts` + `src/services/domain/payments/` = 3 unrelated subjects
- ❌ Files in `src/components/Terminal/` + `src/components/Settings/` = 2 different features
- ❌ Refactoring in `src/utils/` + new feature in `src/views/Pages/Dashboard.vue` = maintenance + feature (split)

**Fail if:** Changes span more than one unrelated subject/domain

**Output if multiple subjects detected:**
```
❌ MULTIPLE SUBJECTS DETECTED

You're trying to commit changes across different domains:
  - Group management (3 files)
  - User authentication (2 files)
  - Terminal settings (1 file)

📋 RECOMMENDATION: Split into atomic commits:

Commit 1 (Group management):
  - src/components/Pages/GroupDetail.vue
  - src/composables/useGroupMembers.ts
  - src/stores/classGroups.ts

Commit 2 (User authentication):
  - src/components/Auth/Login.vue
  - src/stores/auth.ts

Commit 3 (Terminal settings):
  - src/components/Terminal/TerminalSettings.vue

Use: git add <files> && git commit -m "message"
```

### Phase 1: Code Quality (Fast Checks - Modified Files Only)

#### 1.1 TypeScript Compilation
```bash
npx vue-tsc --noEmit
```

**Check for:**
- Type errors
- Missing type definitions
- Type mismatches
- Import errors

**Fail if:** TypeScript compilation fails

#### 1.2 Build Verification
```bash
npm run build
```

**Check for:**
- Build errors
- Missing dependencies
- Asset optimization issues

**Fail if:** Build fails

### Phase 2: Pattern Compliance (Critical Checks)

#### 2.1 CSS Variables (Critical Pattern)
**Check for hardcoded colors in MODIFIED FILES ONLY:**

```bash
# Check only the changes being committed (not entire project)
git diff HEAD | grep "^\+" | grep -E "#[0-9a-fA-F]{3,6}" | grep -v "var(--" | grep -v "^\+\+\+"

# Check for hardcoded rgb/rgba in changes
git diff HEAD | grep "^\+" | grep -E "rgb\(|rgba\(" | grep -v "var(--" | grep -v "^\+\+\+"
```

**Fail if:** Hardcoded colors found in changes (violates CLAUDE.md CSS Standards)

#### 2.2 Internationalization (Critical Pattern)
**Check for hardcoded French/English text in MODIFIED FILES ONLY:**

```bash
# Check for hardcoded strings in added lines
git diff HEAD | grep "^\+" | grep -E "(error|message|label|title|description).*=.*['\"][A-ZÉ]" | grep -v "t('" | grep -v "^\+\+\+"

# Check for hardcoded French text in templates
git diff HEAD | grep "^\+" | grep -E "[ÉéèêëàâäôöùûüçîïÀÂÆÇÉÈÊËÎÏÔŒÙÛÜŸ]" | grep -v "{{ t(" | grep -v "^\+\+\+"
```

**Fail if:** Hardcoded user-facing text found in changes (violates CLAUDE.md i18n requirements)

#### 2.3 Import Paths (Critical Pattern)
**Check for @ alias usage in MODIFIED FILES ONLY:**

```bash
# Check for @ alias in added imports
git diff HEAD | grep "^\+" | grep -E "from ['\"]@/" | grep -v "^\+\+\+"
```

**Fail if:** @ alias found in changes (violates CLAUDE.md import guidelines)

#### 2.4 API Path Patterns
**Check for /api/v1/ prefix in MODIFIED FILES ONLY:**

```bash
# Check for /api/v1/ in new axios calls
git diff HEAD | grep "^\+" | grep "/api/v1/" | grep -v "^\+\+\+"
```

**Fail if:** /api/v1/ prefix found in changes (violates CLAUDE.md API integration)

#### 2.5 Component Architecture Violations
**Check for architectural violations in MODIFIED COMPONENTS:**

```bash
# Get modified component files
MODIFIED_COMPONENTS=$(git diff HEAD --name-only | grep "src/components/.*\.vue")

# Check each modified component for direct axios imports
for file in $MODIFIED_COMPONENTS; do
    if grep -q "import.*axios.*from" "$file" 2>/dev/null; then
        echo "⚠️  $file: Direct axios import (should use services)"
    fi
done
```

**Warn if:** Architecture violations found in modified files

### Phase 3: Security (Fast)

#### 3.1 Quick Security Scan (Changes Only)
```bash
# Check for exposed API keys/secrets in changes
git diff HEAD | grep "^\+" | grep -E "VITE_.*KEY|VITE_.*SECRET|VITE_.*TOKEN" | grep -v "VITE_API_URL" | grep -v "^\+\+\+"

# Check for console.log in added lines
git diff HEAD | grep "^\+" | grep -E "console\.(log|debug|warn)" | grep -v "^\+\+\+" | head -10

# Check for eval() usage in changes (security risk)
git diff HEAD | grep "^\+" | grep "eval(" | grep -v "^\+\+\+"

# Check for innerHTML/v-html in changes (XSS risk)
git diff HEAD | grep "^\+" | grep -E "innerHTML|v-html" | grep -v "^\+\+\+"

# Check for exposed error details in changes
git diff HEAD | grep "^\+" | grep -E "error\.(message|stack)|err\.toString\(\)" | grep -v "^\+\+\+"
```

**Fail if:** Critical security issues found in changes

**Warn if:** console.log or v-html found in changes (review needed)

### Phase 4: Translation Completeness (Medium)

#### 4.1 Translation Coverage
**If new translations added, check both languages:**

```bash
# Check if translation files were modified
if git diff --name-only HEAD | grep -q "useTranslations\|useStoreTranslations"; then
    echo "⚠️  Translation changes detected - verify FR + EN coverage"

    # Find missing translations (advanced check)
    # This would require a custom script to parse translation objects
fi
```

**Warn if:** Translation changes detected without both FR/EN

### Phase 5: Store & Service Patterns (Medium)

#### 5.1 Store Pattern Compliance
**Check modified stores follow baseStore pattern:**

```bash
# Check if modified stores extend useBaseStore
MODIFIED_STORES=$(git diff HEAD --name-only | grep "src/stores/.*\.ts")

for file in $MODIFIED_STORES; do
    if [ -f "$file" ]; then
        if ! grep -q "useBaseStore" "$file"; then
            echo "⚠️  Store $file doesn't extend useBaseStore"
        fi
    fi
done
```

**Warn if:** Modified stores don't follow baseStore pattern

#### 5.2 Service Import Patterns
**Check service imports in MODIFIED FILES follow domain-driven structure:**

```bash
# Check for old service import patterns in changes
git diff HEAD | grep "^\+" | grep -E "from.*services/[a-zA-Z]*Service" | grep -v "services/domain/" | grep -v "services/core/" | grep -v "services/auth/" | grep -v "services/features/" | grep -v "^\+\+\+"
```

**Warn if:** New service imports not in domain folders (see SERVICES.md)

### Phase 6: Code Quality (Fast)

#### 6.1 TypeScript Best Practices
**Check for common TypeScript issues:**

```bash
# Check for 'any' type usage (should be avoided)
git diff HEAD | grep -E ":\s*any[,;\)]" | head -10

# Check for non-null assertions (should be minimized)
git diff HEAD | grep "!" | grep -v "!important" | head -10

# Check for TODO comments without tracking
git diff HEAD | grep "TODO" | grep -v "TODO:" | head -5
```

**Warn if:** Code quality issues found

#### 6.2 Vue Component Best Practices
**Check Vue 3 Composition API patterns in MODIFIED COMPONENTS:**

```bash
# Get modified Vue component files
MODIFIED_VUE=$(git diff HEAD --name-only | grep "\.vue$")

# Check each for Composition API usage
for file in $MODIFIED_VUE; do
    if [ -f "$file" ] && grep -q "src/components/" <<< "$file"; then
        if grep -q "export default {" "$file" && ! grep -q "defineComponent" "$file"; then
            echo "⚠️  $file: Using Options API (prefer Composition API)"
        fi
    fi
done
```

**Warn if:** Modified components not using Composition API with setup

### Phase 7: File Organization (Fast)

#### 7.1 File Naming & Location
**Check file organization:**

```bash
# Check for misplaced files
# Components should be in src/components/
# Stores should be in src/stores/
# Services should be in src/services/domain/

# Check for oversized components (> 500 lines)
for file in $(git diff --name-only HEAD | grep "\.vue$"); do
    if [ -f "$file" ]; then
        lines=$(wc -l < "$file")
        if [ "$lines" -gt 500 ]; then
            echo "⚠️  Large component: $file ($lines lines) - consider splitting"
        fi
    fi
done
```

**Warn if:** Files are misplaced or too large

### Phase 8: Git Quality

#### 8.1 Commit Message
**Validate format:**
```
<type>: <subject>

<body>

<footer>
```

**Types:** feat, fix, refactor, test, docs, chore, style

**Examples:**
- `feat: add dark mode toggle to settings`
- `fix: resolve i18n key mismatch in user profile`
- `refactor: migrate to baseStore pattern`

**IMPORTANT:** Do NOT include Claude Code attribution footer (no "Generated with Claude Code" or "Co-Authored-By: Claude")

**Fail if:** Commit message doesn't follow convention

#### 8.2 File Size
**Check for:**
- Large files (> 1MB)
- Binary files in src/
- Generated files (dist/, node_modules/)

```bash
# Check for large files being committed
git diff --stat HEAD | awk '{if ($3 > 1000) print $1, $2, $3}'
```

**Warn if:** Large files being committed

### Phase 9: Dependencies (Fast)

#### 9.1 Package Lock
**Check package-lock.json consistency:**

```bash
# If package.json changed, ensure package-lock.json also changed
if git diff --name-only HEAD | grep -q "package.json"; then
    if ! git diff --name-only HEAD | grep -q "package-lock.json"; then
        echo "⚠️  package.json changed but not package-lock.json - run npm install"
    fi
fi
```

**Warn if:** package.json changed without package-lock.json

## Execution

### Automatic Pre-Commit
```bash
# Run before every commit
/pre-commit
```

**Output:**
```
🔍 Pre-Commit Validation (OCF Frontend)

✅ Phase 1: Code Quality
   ✅ TypeScript: No type errors
   ✅ Build: Successful

⚠️  Phase 2: Pattern Compliance
   ❌ Hardcoded colors found (3 violations):
      - src/components/Dashboard.vue:45: background: #007bff
      - src/components/Header.vue:22: color: #2c3e50
      - src/views/Profile.vue:89: border: 1px solid #ddd

   ⚠️  Hardcoded text found (2 violations):
      - src/components/Login.vue:34: "Connexion impossible"
      - src/stores/users.ts:67: "Erreur de chargement"

   ✅ Import paths: No @ alias usage
   ✅ API paths: No /api/v1/ prefix

✅ Phase 3: Security
   ⚠️  console.log found (5 instances - review for removal)
   ✅ No exposed secrets
   ✅ No eval() usage
   ⚠️  v-html usage in src/components/RichText.vue:12 (verify sanitization)

✅ Phase 4: Translations
   ℹ️  No translation changes detected

✅ Phase 5: Architecture
   ✅ Stores follow baseStore pattern
   ✅ Service imports follow domain structure

✅ Phase 6: Code Quality
   ⚠️  5 'any' types found (consider typing)
   ✅ Vue components use Composition API

✅ Phase 7: File Organization
   ✅ Files properly organized
   ✅ No oversized components

✅ Phase 8: Git Quality
   ✅ Commit message: Valid
   ✅ File sizes: OK

✅ Phase 9: Dependencies
   ✅ package-lock.json updated

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ CANNOT COMMIT - FIX VIOLATIONS

Critical violations:
  - 3 hardcoded colors (must use CSS variables)
  - 2 hardcoded text strings (must use i18n)

Warnings (can be addressed later):
  - 5 console.log statements
  - 5 'any' types
  - 1 v-html usage

Time: 28s
```

### Fix Violations Automatically
**If violations found:**

```
/pre-commit
→ Agent: "Found 5 critical violations. Fix them?"
→ You: "Yes, fix the hardcoded colors and text"
→ Agent: [Replaces #007bff with var(--color-primary)]
→ Agent: [Replaces "Connexion impossible" with t('auth.loginError')]
→ Agent: [Re-runs pre-commit]
→ Agent: "✅ All critical checks passed! (3 warnings remain)"
```

### Quick Mode (Modified Files Only - Skip Build)
```bash
# Fast pre-commit checks on modified files only
MODIFIED_FILES=$(git diff HEAD --name-only)

echo "Modified files: $MODIFIED_FILES"

# 1. Check hardcoded colors in changes
echo "Checking for hardcoded colors..."
git diff HEAD | grep "^\+" | grep -E "#[0-9a-fA-F]{3,6}" | grep -v "var(--" | grep -v "^\+\+\+"

# 2. Check @ alias in changes
echo "Checking for @ alias..."
git diff HEAD | grep "^\+" | grep -E "from ['\"]@/" | grep -v "^\+\+\+"

# 3. Check /api/v1/ in changes
echo "Checking for /api/v1/ prefix..."
git diff HEAD | grep "^\+" | grep "/api/v1/" | grep -v "^\+\+\+"

echo "✅ Quick checks passed!"
```

## Git Hook Integration

**Create git hook (optional):**

```bash
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

echo "Running pre-commit validation..."

# Fast checks only
echo "1/3 TypeScript check..."
npx vue-tsc --noEmit || exit 1

echo "2/3 Hardcoded colors check..."
COLORS=$(grep -r "#[0-9a-fA-F]\{3,6\}" src/ --include="*.vue" 2>/dev/null | grep -v "var(--" | wc -l)
if [ "$COLORS" -gt 0 ]; then
    echo "❌ Found $COLORS hardcoded colors - use CSS variables"
    exit 1
fi

echo "3/3 Hardcoded text check..."
HARDCODED=$(grep -r "error.*=.*['\"][A-Z]" src/ --include="*.ts" 2>/dev/null | grep -v "t('" | wc -l)
if [ "$HARDCODED" -gt 0 ]; then
    echo "⚠️  Found $HARDCODED potential hardcoded strings - use i18n"
fi

echo "✅ Pre-commit passed (run /pre-commit for full validation)"
EOF

chmod +x .git/hooks/pre-commit
```

## Continuous Integration

**In CI/CD pipeline (.github/workflows/pr.yml):**

```yaml
name: Frontend Quality

on: [pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install Dependencies
        run: npm ci

      - name: TypeScript Check
        run: npx vue-tsc --noEmit

      - name: Build
        run: npm run build

      - name: Pattern Compliance
        run: |
          # Check for hardcoded colors
          ! grep -r "#[0-9a-fA-F]\{3,6\}" src/ --include="*.vue" | grep -v "var(--"

          # Check for @ alias
          ! grep -r "from ['\"]@/" src/ --include="*.vue" --include="*.ts"

          # Check for /api/v1/
          ! grep -r "/api/v1/" src/ --include="*.vue" --include="*.ts"
```

## Custom Checks Script

**Create scripts/pre-commit-checks.sh for reusable checks:**

```bash
#!/bin/bash

# OCF Frontend Pre-Commit Checks
# See CLAUDE.md for pattern requirements

set -e

echo "🔍 Running OCF Frontend Pre-Commit Checks..."

# 1. TypeScript
echo "📘 TypeScript compilation..."
npx vue-tsc --noEmit

# 2. CSS Variables
echo "🎨 Checking for hardcoded colors..."
COLORS=$(grep -r "#[0-9a-fA-F]\{3,6\}" src/ --include="*.vue" 2>/dev/null | grep -v "var(--" || true)
if [ -n "$COLORS" ]; then
    echo "❌ Hardcoded colors found:"
    echo "$COLORS"
    exit 1
fi

# 3. i18n
echo "🌍 Checking for hardcoded text..."
HARDCODED=$(grep -r "error.*=.*['\"]" src/ --include="*.ts" 2>/dev/null | grep -v "t('" | head -5 || true)
if [ -n "$HARDCODED" ]; then
    echo "⚠️  Potential hardcoded text found:"
    echo "$HARDCODED"
fi

# 4. Import paths
echo "📦 Checking import paths..."
ALIAS=$(grep -r "from ['\"]@/" src/ --include="*.ts" --include="*.vue" 2>/dev/null || true)
if [ -n "$ALIAS" ]; then
    echo "❌ @ alias found (use relative paths):"
    echo "$ALIAS"
    exit 1
fi

# 5. API paths
echo "🌐 Checking API paths..."
API_PREFIX=$(grep -r "/api/v1/" src/ --include="*.ts" --include="*.vue" 2>/dev/null || true)
if [ -n "$API_PREFIX" ]; then
    echo "❌ /api/v1/ prefix found (removed by interceptor):"
    echo "$API_PREFIX"
    exit 1
fi

echo "✅ All checks passed!"
```

**Make it executable:**
```bash
chmod +x scripts/pre-commit-checks.sh
```

**Add to package.json:**
```json
{
  "scripts": {
    "precommit": "bash scripts/pre-commit-checks.sh",
    "build": "vue-tsc && vite build"
  }
}
```

## Project-Specific Patterns

### OCF Frontend Critical Rules

Based on CLAUDE.md, these patterns are **MANDATORY**:

1. **CSS Variables Only** - No hardcoded colors
   - Use `var(--color-primary)` not `#007bff`
   - Use `var(--color-text-primary)` not `#2c3e50`

2. **i18n Always** - No hardcoded French/English
   - Use `t('domain.key')` for all user-facing text
   - Both FR and EN translations required

3. **Relative Imports** - No @ alias
   - Use `../utils/formatters` not `@/utils/formatters`

4. **Clean API Paths** - No /api/v1/ prefix
   - Interceptor adds it automatically

5. **BaseModal Usage** - Don't wrap modals
   - Use `BaseModal.vue` directly, never create custom modal wrappers

6. **BaseStore Pattern** - All stores extend useBaseStore
   - Consistent CRUD operations
   - Built-in loading states

## Atomic Commit Workflow

### Step 1: Check What You're Committing
```bash
# See all modified files
git status

# See which files have changes
git diff HEAD --name-only
```

### Step 2: Analyze Subject/Domain
**Before committing, ask yourself:**
- Do all these files relate to the SAME feature/fix/refactor?
- Are they in the SAME domain (e.g., all group management, all auth, etc.)?
- Would a single commit message accurately describe ALL these changes?

**If NO to any question → Split into multiple commits**

### Step 3: Stage Files by Subject
```bash
# Example: Committing only group-related changes
git add src/components/Pages/GroupDetail.vue
git add src/composables/useGroupMembers.ts
git add src/stores/classGroups.ts
git add src/types/entities.ts  # Only if it has group-related types

# Verify what you're about to commit
git diff --cached --name-only
```

### Step 4: Run Pre-Commit
```bash
/pre-commit
```

### Step 5: Commit with Atomic Message
```bash
# Single-subject commit message
git commit -m "feat: add subgroup member display in GroupDetail"
```

### Step 6: Repeat for Other Subjects
```bash
# Stage next logical group of changes
git add src/components/Modals/EntityModal.vue
git add src/utils/fieldBuilder.ts
/pre-commit
git commit -m "refactor: improve field builder type safety"
```

## Examples

### ✅ GOOD: Atomic Commit
```bash
# All files relate to one feature
Modified files:
  - src/components/Pages/GroupDetail.vue
  - src/composables/useGroupMembers.ts
  - src/stores/classGroups.ts

Commit message: "feat: add member list to group detail page"
```

### ❌ BAD: Mixed-Subject Commit
```bash
# Files span multiple unrelated features
Modified files:
  - src/components/Pages/GroupDetail.vue  # Group feature
  - src/components/Auth/Login.vue         # Auth feature
  - src/stores/terminals.ts               # Terminal feature
  - package.json                          # Dependencies

❌ This should be 3-4 separate commits!
```

### ✅ GOOD: Split Into Atomic Commits
```bash
# Commit 1: Group feature
git add src/components/Pages/GroupDetail.vue src/composables/useGroupMembers.ts
git commit -m "feat: add member list to group detail page"

# Commit 2: Auth improvement
git add src/components/Auth/Login.vue
git commit -m "fix: improve login error handling"

# Commit 3: Terminal enhancement
git add src/stores/terminals.ts
git commit -m "refactor: add loading state to terminal store"

# Commit 4: Dependencies
git add package.json package-lock.json
git commit -m "chore: update vue to 3.4.0"
```

## Best Practices

1. **Check modified files FIRST** - Know what you're committing before running pre-commit
2. **One subject per commit** - Makes git history clean and enables easy reverts
3. **Run pre-commit for EACH commit** - Every commit should pass all checks
4. **Fix critical violations immediately** - Don't bypass checks
5. **Address warnings incrementally** - Improve code quality over time
6. **Keep translations synchronized** - FR + EN always
7. **Use CSS variables consistently** - Dark mode compatibility
8. **Follow service layer patterns** - Domain-driven organization

## Quick Reference

```bash
# 1. Check what's modified
git status

# 2. Detect subjects (manual review)
# Are changes related? Same domain? Same feature?

# 3. Stage ONE subject at a time
git add <files-for-one-subject>

# 4. Run pre-commit
/pre-commit

# 5. Commit
git commit -m "<type>: <description>"

# 6. Repeat for other subjects
```

This agent ensures every commit is **atomic, focused, and meets OCF Frontend quality standards**!
