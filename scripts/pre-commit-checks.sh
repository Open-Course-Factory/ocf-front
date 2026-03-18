#!/bin/bash

# OCF Frontend Pre-Commit Checks
# See CLAUDE.md for pattern requirements

set -e

echo "🔍 Running OCF Frontend Pre-Commit Checks..."
echo ""

ERRORS=0
WARNINGS=0

# 1. TypeScript
echo "📘 TypeScript compilation..."
if npx vue-tsc --noEmit; then
    echo "   ✅ No type errors"
else
    echo "   ❌ TypeScript errors found"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 2. CSS Variables
echo "🎨 Checking for hardcoded colors..."
COLORS=$(grep -r "#[0-9a-fA-F]\{3,6\}" src/ --include="*.vue" 2>/dev/null | grep -v "var(--" | grep -v "\.css" || true)
if [ -n "$COLORS" ]; then
    echo "   ❌ Hardcoded colors found (use CSS variables):"
    echo "$COLORS" | head -10
    ERRORS=$((ERRORS + 1))
else
    echo "   ✅ No hardcoded colors"
fi
echo ""

# 3. i18n
echo "🌍 Checking for hardcoded text..."
HARDCODED=$(grep -r "error.*=.*['\"]" src/ --include="*.ts" --include="*.vue" 2>/dev/null | grep -v "t('" | grep -v "\.test\." | head -5 || true)
if [ -n "$HARDCODED" ]; then
    echo "   ⚠️  Potential hardcoded text found (use i18n):"
    echo "$HARDCODED"
    WARNINGS=$((WARNINGS + 1))
else
    echo "   ✅ No hardcoded text"
fi
echo ""

# 4. i18n special characters (vue-i18n v11: @ is reserved for linked messages)
echo "🌐 Checking for unescaped @ in translation strings..."
# Find files with translation definitions, then check for unescaped @ in string values
I18N_AT=$(grep -rn ":\s*['\"].*@[a-zA-Z]" src/ --include="*.vue" --include="*.ts" 2>/dev/null \
  | grep -v "{'@'}" \
  | grep -v "node_modules" \
  | grep -v "href=" \
  | grep -v "mailto:" \
  | grep -v "@click\|@change\|@input\|@submit\|@keyup\|@blur\|@close\|@confirm\|@mounted\|@resize\|@mouseover\|@mouseenter\|@mouseleave" \
  | grep -v "PATTERN\|RegExp\|regex\|/\^" \
  | grep -v "import " \
  | grep -v "\.test\." \
  | grep "useTranslations\|useStoreTranslations\|createI18n\|locales/" \
  || true)
if [ -n "$I18N_AT" ]; then
    echo "   ❌ Unescaped @ found in translations (use {'@'} to escape):"
    echo "$I18N_AT" | head -10
    ERRORS=$((ERRORS + 1))
else
    echo "   ✅ No unescaped @ in translations"
fi
echo ""

# 5. Import paths
echo "📦 Checking import paths..."
ALIAS=$(grep -r "from ['\"]@/" src/ --include="*.ts" --include="*.vue" 2>/dev/null || true)
if [ -n "$ALIAS" ]; then
    echo "   ❌ @ alias found (use relative paths):"
    echo "$ALIAS" | head -10
    ERRORS=$((ERRORS + 1))
else
    echo "   ✅ No @ alias usage"
fi
echo ""

# 6. API paths
echo "🌐 Checking API paths..."
API_PREFIX=$(grep -r "/api/v1/" src/ --include="*.ts" --include="*.vue" 2>/dev/null || true)
if [ -n "$API_PREFIX" ]; then
    echo "   ❌ /api/v1/ prefix found (removed by interceptor):"
    echo "$API_PREFIX" | head -10
    ERRORS=$((ERRORS + 1))
else
    echo "   ✅ No /api/v1/ prefix"
fi
echo ""

# 7. Console logs
echo "🔍 Checking for console statements..."
CONSOLE_LOGS=$(grep -r "console\.log\|console\.debug" src/ --include="*.vue" --include="*.ts" 2>/dev/null | grep -v "utils/logger" | wc -l || echo "0")
if [ "$CONSOLE_LOGS" -gt 0 ]; then
    echo "   ⚠️  Found $CONSOLE_LOGS console.log statements (consider removing)"
    WARNINGS=$((WARNINGS + 1))
else
    echo "   ✅ No console.log statements"
fi
echo ""

# 8. Security patterns
echo "🔒 Security checks..."
EVAL_USAGE=$(grep -r "eval(" src/ --include="*.ts" --include="*.vue" 2>/dev/null || true)
if [ -n "$EVAL_USAGE" ]; then
    echo "   ❌ eval() usage found (security risk):"
    echo "$EVAL_USAGE"
    ERRORS=$((ERRORS + 1))
else
    echo "   ✅ No eval() usage"
fi

VHTML=$(grep -r "v-html" src/ --include="*.vue" 2>/dev/null | wc -l || echo "0")
if [ "$VHTML" -gt 0 ]; then
    echo "   ⚠️  Found $VHTML v-html usage (verify sanitization)"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ]; then
    echo "✅ All critical checks passed!"
    if [ $WARNINGS -gt 0 ]; then
        echo "⚠️  $WARNINGS warning(s) found (review recommended)"
    fi
    exit 0
else
    echo "❌ $ERRORS error(s) found"
    if [ $WARNINGS -gt 0 ]; then
        echo "⚠️  $WARNINGS warning(s) found"
    fi
    echo ""
    echo "Fix errors before committing."
    exit 1
fi
