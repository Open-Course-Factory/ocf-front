# CSS Architecture & Standards

## Shared Stylesheets

OCF Front uses a centralized CSS architecture with shared stylesheets to reduce duplication, ensure consistent styling, and support dark mode:

```plaintext
src/assets/styles/
├── main.css              # Entry point (imports all stylesheets)
├── variables.css         # Design tokens (colors, spacing, fonts)
├── components.css        # Generic utilities (buttons, alerts, tables)
├── forms-common.css      # Shared form styles
├── modals-common.css     # Shared modal styles
├── cards-common.css      # Shared card/list item styles
└── help-article.css      # Help documentation styles
```

## Key CSS Variables

**Colors:**
- Text: `--color-text-primary`, `--color-text-secondary`, `--color-text-muted`, `--color-text-disabled`
- Backgrounds: `--color-bg-primary`, `--color-bg-secondary`, `--color-bg-tertiary`, `--color-bg-dark`
- Borders: `--color-border-light`, `--color-border-medium`, `--color-border-dark`
- Primary: `--color-primary`, `--color-primary-hover`
- Status: `--color-success`, `--color-danger`, `--color-warning`, `--color-info`
- Grays: `--color-gray-50` through `--color-gray-900`

**Spacing:**
- `--spacing-xs`, `--spacing-sm`, `--spacing-md`, `--spacing-lg`, `--spacing-xl`, `--spacing-2xl`

**Typography:**
- Sizes: `--font-size-xs`, `--font-size-sm`, `--font-size-base`, `--font-size-md`, `--font-size-lg`, `--font-size-xl`, `--font-size-2xl`, `--font-size-3xl`, `--font-size-4xl`
- Weights: `--font-weight-normal`, `--font-weight-medium`, `--font-weight-semibold`, `--font-weight-bold`

**Borders:**
- Width: `--border-width-thin`, `--border-width-medium`, `--border-width-thick`
- Radius: `--border-radius-sm`, `--border-radius-md`, `--border-radius-lg`, `--border-radius-xl`, `--border-radius-full`

**Shadows:**
- `--shadow-xs`, `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`
- Focus: `--shadow-focus-primary`, `--shadow-focus-danger`

**Transitions:**
- `--transition-fast`, `--transition-base`, `--transition-slow`

## ⚠ CRITICAL: Never Hardcode Colors

All colors **MUST use CSS variables** for dark mode compatibility:

```vue
<!-- ❌ BAD - Hardcoded colors (breaks dark mode) -->
<style scoped>
.my-button {
  background-color: #007bff;
  color: #ffffff;
  border: 1px solid #ddd;
}
</style>

<!-- ✅ GOOD - CSS variables (works in dark mode) -->
<style scoped>
.my-button {
  background-color: var(--color-primary);
  color: var(--color-white);
  border: var(--border-width-thin) solid var(--color-border-medium);
}
</style>
```

## Shared Classes

All shared styles are automatically available via `main.css`:

**Forms:** `.form-group`, `.form-control`, `.form-select`, `.checkbox-label`, `.invalid-feedback`
**Modals:** `.modal-overlay`, `.modal-container`, `.modal-header`, `.modal-body`, `.modal-footer`
**Cards:** `.card`, `.entity-card`, `.list-item-card`, `.subscription-card`, `.metric-card`, `.empty-state`

## Guidelines

- ✅ **Always use CSS variables** for colors, spacing, typography
- ✅ **Use scoped styles** when possible to avoid conflicts
- ✅ **Leverage shared stylesheets** - don't duplicate
- ✅ **Test in both light and dark modes** before committing
- ❌ **Never hardcode hex colors** - use variables
- ❌ **Never hardcode spacing values** - use --spacing-* variables
- ❌ **Never create duplicate base components**

## Dark Mode Testing

```javascript
// In browser console or via UI settings
document.documentElement.setAttribute('data-theme', 'dark')

// Switch back to light mode
document.documentElement.setAttribute('data-theme', 'light')
```

## Compact Mode

Components automatically support compact mode via CSS variables:

```html
<!-- Compact mode activated via data attribute -->
<html data-compact="true">
```

All `--spacing-*` and `--font-size-*` variables are reduced by ~30% in compact mode.
