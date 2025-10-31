#!/bin/bash

# Install git pre-commit hook for OCF Frontend

echo "📦 Installing OCF Frontend pre-commit git hook..."

# Create pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

echo "🔍 Running OCF Frontend pre-commit validation..."
echo ""

# Fast checks only (TypeScript + Critical Patterns)
echo "1/5 TypeScript check..."
if ! npx vue-tsc --noEmit; then
    echo "❌ TypeScript errors - fix before committing"
    exit 1
fi

echo ""
echo "2/5 Hardcoded colors check..."
COLORS=$(grep -r "#[0-9a-fA-F]\{3,6\}" src/ --include="*.vue" 2>/dev/null | grep -v "var(--" | grep -v "\.css" | wc -l)
if [ "$COLORS" -gt 0 ]; then
    echo "❌ Found $COLORS hardcoded colors - use CSS variables"
    grep -r "#[0-9a-fA-F]\{3,6\}" src/ --include="*.vue" 2>/dev/null | grep -v "var(--" | grep -v "\.css" | head -5
    exit 1
fi

echo ""
echo "3/5 Hardcoded text check..."
HARDCODED=$(grep -r "error.*=.*['\"]" src/ --include="*.ts" --include="*.vue" 2>/dev/null | grep -v "t('" | wc -l)
if [ "$HARDCODED" -gt 3 ]; then
    echo "⚠️  Found $HARDCODED potential hardcoded strings - use i18n"
    grep -r "error.*=.*['\"]" src/ --include="*.ts" 2>/dev/null | grep -v "t('" | head -3
fi

echo ""
echo "4/5 Import path check..."
ALIAS=$(grep -r "from ['\"]@/" src/ --include="*.ts" --include="*.vue" 2>/dev/null | wc -l)
if [ "$ALIAS" -gt 0 ]; then
    echo "❌ Found $ALIAS @ alias imports - use relative paths"
    grep -r "from ['\"]@/" src/ --include="*.ts" --include="*.vue" 2>/dev/null | head -5
    exit 1
fi

echo ""
echo "5/5 API path check..."
API_PREFIX=$(grep -r "/api/v1/" src/ --include="*.ts" --include="*.vue" 2>/dev/null | wc -l)
if [ "$API_PREFIX" -gt 0 ]; then
    echo "❌ Found /api/v1/ prefix - axios interceptor adds this automatically"
    grep -r "/api/v1/" src/ --include="*.ts" --include="*.vue" 2>/dev/null | head -5
    exit 1
fi

echo ""
echo "✅ Pre-commit checks passed!"
echo "ℹ️  Run 'npm run precommit' for full validation"
echo ""
EOF

# Make executable
chmod +x .git/hooks/pre-commit

echo "✅ Git pre-commit hook installed!"
echo ""
echo "The hook will run automatically on every commit."
echo "To bypass the hook (emergency only): git commit --no-verify"
echo ""
echo "For full validation, run: npm run precommit"
