# OCF Frontend Scripts

Utility scripts for development, validation, and git hooks.

## Pre-Commit Validation

### Quick Start

```bash
# Run all pre-commit checks
npm run precommit

# Or run directly
bash scripts/pre-commit-checks.sh
```

### What It Checks

1. **TypeScript Compilation** - No type errors
2. **CSS Variables** - No hardcoded colors (use `var(--color-name)`)
3. **Internationalization** - No hardcoded French/English text (use `t('key')`)
4. **Import Paths** - No `@/` alias (use relative paths)
5. **API Paths** - No `/api/v1/` prefix (added by interceptor)
6. **Console Logs** - Warning for production code
7. **Security** - No `eval()`, checks `v-html` usage

### Exit Codes

- `0` - All checks passed
- `1` - Critical errors found (must fix before commit)

## Git Hooks

### Install Pre-Commit Hook

```bash
bash scripts/install-git-hooks.sh
```

This installs a git hook that runs **fast checks only** before each commit:
- TypeScript compilation
- Hardcoded colors
- Import path violations
- API path violations

### Bypass Hook (Emergency Only)

```bash
git commit --no-verify
```

**Warning:** Only use this for urgent hotfixes. Run full checks afterward.

## Using with Claude Code

### Pre-Commit Command

The `/pre-commit` slash command provides comprehensive validation with detailed output:

```bash
/pre-commit
```

**Features:**
- Runs all validation phases
- Shows violations with file/line numbers
- Offers to fix violations automatically
- Provides fix suggestions

**Example output:**
```
🔍 Pre-Commit Validation (OCF Frontend)

✅ Phase 1: Code Quality
   ✅ TypeScript: No type errors

⚠️  Phase 2: Pattern Compliance
   ❌ Hardcoded colors found (2 violations):
      - src/components/Dashboard.vue:45: background: #007bff
      - src/views/Profile.vue:89: color: #2c3e50

   ✅ Import paths: No @ alias usage
```

## Critical Patterns (CLAUDE.md)

These patterns are **MANDATORY** and will fail the pre-commit check:

### 1. CSS Variables Only
```vue
<!-- ✅ GOOD -->
<style scoped>
.btn { background: var(--color-primary); }
</style>

<!-- ❌ BAD - Will fail check -->
<style scoped>
.btn { background: #007bff; }
</style>
```

### 2. i18n Always
```typescript
// ✅ GOOD
error.value = t('users.loadError')

// ❌ BAD - Will fail check
error.value = 'Erreur de chargement'
```

### 3. Relative Imports
```typescript
// ✅ GOOD
import { formatDate } from '../utils/formatters'

// ❌ BAD - Will fail check
import { formatDate } from '@/utils/formatters'
```

### 4. Clean API Paths
```typescript
// ✅ GOOD
axios.get('/users')

// ❌ BAD - Will fail check
axios.get('/api/v1/users')
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Frontend Quality

on: [pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run precommit
```

### GitLab CI Example

```yaml
frontend-quality:
  stage: test
  script:
    - npm ci
    - npm run precommit
  only:
    - merge_requests
```

## Development Workflow

### Recommended Workflow

1. **Before starting work:**
   ```bash
   git pull origin main
   npm install
   ```

2. **During development:**
   - Write code following CLAUDE.md patterns
   - Use CSS variables for colors
   - Use `t()` for all user-facing text
   - Use relative imports

3. **Before committing:**
   ```bash
   npm run precommit
   ```

4. **Fix any violations:**
   - Replace hardcoded colors with CSS variables
   - Add i18n translations
   - Fix import paths

5. **Commit:**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

   (Pre-commit hook runs automatically)

### Quick Fixes

**Replace hardcoded color:**
```bash
# Find all hardcoded colors
grep -r "#[0-9a-fA-F]\{3,6\}" src/ --include="*.vue" | grep -v "var(--"

# Replace with CSS variable
# #007bff → var(--color-primary)
# #2c3e50 → var(--color-text-primary)
```

**Add i18n translation:**
```typescript
// 1. Add to component translations
const { t } = useTranslations({
  en: { myComponent: { error: 'Loading failed' } },
  fr: { myComponent: { error: 'Échec du chargement' } }
})

// 2. Use in code
error.value = t('myComponent.error')
```

**Fix import path:**
```typescript
// Change: import { foo } from '@/utils/foo'
// To:     import { foo } from '../utils/foo'
```

## Troubleshooting

### Hook not running

```bash
# Reinstall hook
bash scripts/install-git-hooks.sh

# Check hook exists
ls -la .git/hooks/pre-commit

# Make executable
chmod +x .git/hooks/pre-commit
```

### TypeScript errors

```bash
# Run TypeScript check alone
npx vue-tsc --noEmit

# Check specific file
npx vue-tsc --noEmit src/components/MyComponent.vue
```

### False positives

If you have a legitimate use case for a pattern that fails checks:

1. **Hardcoded colors in comments/documentation** - Ignore warnings in comments
2. **Third-party library constraints** - Add `// @ts-ignore` with explanation
3. **v-html for sanitized content** - Document sanitization in comments

### Performance

Full validation takes ~20-30 seconds. Git hook runs fast checks only (~5-10 seconds).

For rapid iteration during development, fix patterns as you code rather than at commit time.

## Additional Resources

- [CLAUDE.md](../CLAUDE.md) - Project coding standards
- [CSS.md](.claude/docs/CSS.md) - CSS variables reference
- [I18N.md](.claude/docs/I18N.md) - Internationalization patterns
- [CODE_QUALITY.md](.claude/docs/CODE_QUALITY.md) - Code quality standards
