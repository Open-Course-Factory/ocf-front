# OCF Design System

**Version:** 1.0.0
**Last Updated:** 2025-10-09

Complete guide to the Open Course Factory (OCF) design system - a comprehensive set of reusable styles, components, and patterns for consistent, theme-ready UI.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [File Structure](#file-structure)
3. [Design Tokens](#design-tokens)
4. [Components](#components)
5. [Utility Classes](#utility-classes)
6. [Migration Guide](#migration-guide)
7. [Migrated Components](#migrated-components)
8. [Theming & Dark Mode](#theming--dark-mode)
9. [Best Practices](#best-practices)

---

## 🎯 Overview

The OCF Design System provides:

- **100+ design tokens** for colors, spacing, typography, etc.
- **50+ reusable component classes** (.btn, .card, .form-control, etc.)
- **30+ utility classes** for rapid development
- **Dark mode ready** with pre-defined color variants
- **50-70% CSS reduction** per migrated component
- **Theme creation** reduced from weeks to ~1 hour

### Benefits

✅ **Consistency** - Unified look across the entire application
✅ **Maintainability** - Change once, applies everywhere
✅ **Theming** - Easy dark mode or custom themes
✅ **Performance** - Reduced CSS duplication
✅ **Developer Experience** - Faster development with reusable classes
✅ **Accessibility** - Built-in focus states and semantic HTML

---

## 📁 File Structure

```
src/assets/styles/
├── variables.css      # Design tokens (colors, spacing, typography, etc.)
├── components.css     # Reusable component styles
└── main.css          # Global styles and imports
```

**Import in `src/main.ts`:**

```typescript
import './assets/styles/main.css'
```

---

## 🎨 Design Tokens

### Colors

#### Primary Colors

```css
--color-primary: #007bff           /* Main brand color */
--color-primary-hover: #0056b3     /* Hover state */
--color-primary-light: rgba(0, 123, 255, 0.1)
--color-primary-shadow: rgba(0, 123, 255, 0.2)
```

#### Status Colors

```css
--color-success: #28a745    /* Green for success */
--color-danger: #dc3545     /* Red for errors/delete */
--color-warning: #ffc107    /* Yellow for warnings */
--color-info: #17a2b8       /* Blue for info */
```

#### Neutral Colors

```css
--color-white: #ffffff
--color-black: #000000
--color-gray-50 through --color-gray-900  /* Full gray scale */

/* Text Colors */
--color-text-primary: #333333
--color-text-secondary: #555555
--color-text-muted: #6c757d

/* Background Colors */
--color-bg-primary: #ffffff
--color-bg-secondary: #f8f9fa
--color-bg-tertiary: #e9ecef

/* Border Colors */
--color-border-light: #e0e0e0
--color-border-medium: #ddd
--color-border-dark: #adb5bd
```

#### Dark Mode Colors

```css
[data-theme="dark"] {
  --color-bg-primary: #1a1a1a
  --color-bg-secondary: #2d2d2d
  --color-bg-tertiary: #3a3a3a
  --color-text-primary: #e0e0e0
  --color-text-secondary: #b0b0b0
  --color-text-muted: #888888
  --color-border-light: #404040
  --color-border-medium: #555555
  /* ... */
}
```

### Spacing

```css
--spacing-xs: 4px      /* Extra small */
--spacing-sm: 8px      /* Small */
--spacing-md: 16px     /* Medium (base) */
--spacing-lg: 24px     /* Large */
--spacing-xl: 32px     /* Extra large */
--spacing-2xl: 48px    /* 2x Extra large */
```

**Usage:**

```css
.my-component {
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  gap: var(--spacing-sm);
}
```

### Typography

#### Font Sizes

```css
--font-size-xs: 0.75rem    /* 12px */
--font-size-sm: 0.85rem    /* 13.6px */
--font-size-base: 0.95rem  /* 15.2px */
--font-size-md: 1rem       /* 16px */
--font-size-lg: 1.125rem   /* 18px */
--font-size-xl: 1.25rem    /* 20px */
--font-size-2xl: 1.5rem    /* 24px */
--font-size-3xl: 1.875rem  /* 30px */
--font-size-4xl: 2.25rem   /* 36px */
```

#### Font Weights

```css
--font-weight-normal: 400
--font-weight-medium: 500
--font-weight-semibold: 600
--font-weight-bold: 700
```

#### Line Heights

```css
--line-height-tight: 1.25
--line-height-normal: 1.5
--line-height-relaxed: 1.75
```

#### Font Families

```css
--font-family-primary: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
--font-family-monospace: "Courier New", Courier, monospace
```

### Borders & Shadows

#### Border Radius

```css
--border-radius-sm: 4px
--border-radius-md: 6px
--border-radius-lg: 8px
--border-radius-xl: 12px
--border-radius-full: 9999px  /* For circles */
```

#### Border Width

```css
--border-width-thin: 1px
--border-width-medium: 2px
--border-width-thick: 4px
```

#### Shadows

```css
--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05)
--shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.1)
--shadow-md: 0 4px 8px rgba(0, 0, 0, 0.1)
--shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.15)
--shadow-xl: 0 12px 24px rgba(0, 0, 0, 0.2)

/* Focus Shadows */
--shadow-focus-primary: 0 0 0 3px rgba(0, 123, 255, 0.25)
--shadow-focus-danger: 0 0 0 3px rgba(220, 53, 69, 0.25)
```

### Transitions

```css
--transition-fast: 0.15s ease
--transition-base: 0.2s ease
--transition-slow: 0.3s ease
```

### Z-Index

```css
--z-index-dropdown: 100
--z-index-sticky: 200
--z-index-modal: 1000
--z-index-tooltip: 1100
```

---

## 🧩 Components

### Buttons

```html
<!-- Primary button -->
<button class="btn btn-primary">Save Changes</button>

<!-- Secondary button -->
<button class="btn btn-secondary">Cancel</button>

<!-- Danger button -->
<button class="btn btn-danger">Delete</button>

<!-- Success button -->
<button class="btn btn-success">Confirm</button>

<!-- Sizes -->
<button class="btn btn-primary btn-sm">Small</button>
<button class="btn btn-primary">Medium (default)</button>
<button class="btn btn-primary btn-lg">Large</button>

<!-- Outline variant -->
<button class="btn btn-outline-primary">Outline</button>

<!-- Disabled state -->
<button class="btn btn-primary" disabled>Disabled</button>
```

### Forms

```html
<!-- Text Input -->
<div class="form-group">
  <label>Email Address</label>
  <input type="email" class="form-control" placeholder="Enter email">
  <small class="form-text">We'll never share your email.</small>
</div>

<!-- Select -->
<div class="form-group">
  <label>Choose Option</label>
  <select class="form-control form-select">
    <option>Option 1</option>
    <option>Option 2</option>
  </select>
</div>

<!-- Checkbox -->
<div class="form-group">
  <label class="checkbox-label">
    <input type="checkbox">
    <span>I agree to the terms</span>
  </label>
</div>

<!-- Invalid state -->
<input type="text" class="form-control is-invalid">
<div class="invalid-feedback">Please enter a valid value.</div>
```

### Cards

```html
<div class="card">
  <div class="card-header">
    <h2>Card Title</h2>
  </div>
  <div class="card-body">
    Card content goes here
  </div>
  <div class="card-footer">
    <button class="btn btn-primary">Action</button>
  </div>
</div>
```

### Notifications & Modals

**IMPORTANT:** OCF uses Element Plus notification system via the `useNotification` composable. **DO NOT use HTML alert/error panels** for user feedback - always use the notification composable functions.

#### Notification Composable (`useNotification`)

Located in `/src/composables/useNotification.ts`, this composable provides consistent modal-based feedback to users, replacing browser alerts and custom error panels.

**Import & Setup:**

```vue
<script setup>
import { useNotification } from '@/composables/useNotification'

const { showError, showSuccess, showWarning, showInfo, showConfirm, showAlert, showMessage, showPrompt } = useNotification()
</script>
```

#### Available Notification Functions

##### 1. **Success Notification**

```javascript
showSuccess('Operation completed successfully!', 'Success')
// Title is optional, defaults to 'Success'
```

##### 2. **Error Notification**

```javascript
showError('An error occurred. Please try again.', 'Error')
// Title is optional, defaults to 'Error'
// Duration: 4000ms (4 seconds)
```

##### 3. **Warning Notification**

```javascript
showWarning('This action cannot be undone.', 'Warning')
// Title is optional, defaults to 'Warning'
// Duration: 3500ms (3.5 seconds)
```

##### 4. **Info Notification**

```javascript
showInfo('Did you know...', 'Info')
// Title is optional, defaults to 'Info'
// Duration: 3000ms (3 seconds)
```

##### 5. **Simple Toast Message** (less intrusive)

```javascript
showMessage('Changes saved', 'success')
// Type: 'success' | 'warning' | 'info' | 'error'
// Duration: 2500ms (2.5 seconds)
```

##### 6. **Alert Modal** (replaces window.alert)

```javascript
await showAlert('Your session will expire soon', 'Session Warning', 'warning')
// Type: 'info' | 'warning' | 'error' | 'success'
```

##### 7. **Confirm Dialog** (replaces window.confirm)

```javascript
const confirmed = await showConfirm(
  'Are you sure you want to delete this item?',
  'Confirm Delete',
  {
    confirmButtonText: 'Yes, Delete',
    cancelButtonText: 'Cancel',
    type: 'warning'
  }
)

if (confirmed) {
  // User clicked confirm
  deleteItem()
}
```

##### 8. **Prompt Dialog** (replaces window.prompt)

```javascript
const name = await showPrompt(
  'Please enter your name',
  'User Information',
  {
    inputPlaceholder: 'Enter name',
    inputPattern: /^[a-zA-Z\s]+$/,
    inputErrorMessage: 'Invalid name format'
  }
)

if (name !== null) {
  // User entered a value
  saveName(name)
}
```

#### Usage Examples

**Error Handling in Forms:**

```vue
<script setup>
import { useNotification } from '@/composables/useNotification'

const { showError, showSuccess } = useNotification()

async function saveForm() {
  if (!formData.email) {
    showError('Email is required', 'Validation Error')
    return
  }

  try {
    await api.save(formData)
    showSuccess('Form saved successfully!', 'Success')
  } catch (error) {
    showError(error.message || 'Failed to save form', 'Error')
  }
}
</script>
```

**Confirming Destructive Actions:**

```vue
<script setup>
import { useNotification } from '@/composables/useNotification'

const { showConfirm, showSuccess } = useNotification()

async function deleteItem(itemId) {
  const confirmed = await showConfirm(
    'This action cannot be undone. Are you sure?',
    'Delete Item',
    {
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      type: 'warning'
    }
  )

  if (confirmed) {
    await api.delete(itemId)
    showSuccess('Item deleted successfully', 'Deleted')
  }
}
</script>
```

**Session Limits & Warnings:**

```vue
<script setup>
import { useNotification } from '@/composables/useNotification'

const { showWarning, showConfirm } = useNotification()

async function startTerminal() {
  if (currentTerminalCount >= maxTerminals) {
    showWarning(
      'You have reached your limit. Please stop an existing terminal or upgrade your plan.',
      'Limit Reached'
    )

    // Optional: Show upgrade suggestion
    const wantsUpgrade = await showConfirm(
      'Would you like to see available plans?',
      'Upgrade Plan'
    )

    if (wantsUpgrade) {
      router.push('/subscription-plans')
    }
    return
  }

  // Start terminal...
}
</script>
```

#### ❌ DON'T: Custom Error Panels

```vue
<!-- ❌ WRONG: Don't use custom error panels -->
<div v-if="showErrorPanel" class="error-panel">
  <p>{{ errorMessage }}</p>
  <button @click="closeError">Close</button>
</div>

<script>
const showErrorPanel = ref(false)
const errorMessage = ref('')

function handleError(error) {
  errorMessage.value = error.message
  showErrorPanel.value = true  // ❌ Bad practice
}
</script>
```

#### ✅ DO: Use Notification Composable

```vue
<!-- ✅ CORRECT: Use notification composable -->
<script setup>
import { useNotification } from '@/composables/useNotification'

const { showError } = useNotification()

function handleError(error) {
  showError(error.message, 'Error')  // ✅ Good practice
}
</script>
```

#### Notification Best Practices

1. **Use appropriate notification type** for the context:
   - `showError` - For errors that require user attention
   - `showWarning` - For warnings and destructive action confirmations
   - `showSuccess` - For successful operations
   - `showInfo` - For informational messages
   - `showMessage` - For quick, non-critical updates

2. **Provide clear, actionable titles**:
   - ✅ "Validation Error", "Limit Reached", "Session Expired"
   - ❌ "Error", "Oops", "Something went wrong"

3. **Write user-friendly messages**:
   - ✅ "You have reached your terminal limit. Please stop an existing terminal or upgrade your plan."
   - ❌ "403 Forbidden: MAX_CONCURRENT_TERMINALS_EXCEEDED"

4. **Use confirm dialogs for destructive actions**:
   - Always use `showConfirm` before delete/cancel/destructive operations
   - Provide clear button labels ("Yes, Delete" instead of "OK")

5. **Don't spam notifications**:
   - Avoid showing multiple notifications for the same error
   - Use `showMessage` for less critical updates (saves, auto-updates)

### Static Alerts (Deprecated)

**Note:** The following static alert styles are **deprecated** and should only be used for legacy compatibility. New features should use the `useNotification` composable instead.

```html
<!-- Only use these for backward compatibility -->
<div class="alert alert-success">Static success alert (deprecated)</div>
<div class="alert alert-error">Static error alert (deprecated)</div>
<div class="alert alert-warning">Static warning alert (deprecated)</div>
<div class="alert alert-info">Static info alert (deprecated)</div>
```

### Badges

```html
<span class="badge badge-primary">Primary</span>
<span class="badge badge-success">Success</span>
<span class="badge badge-danger">Danger</span>
<span class="badge badge-warning">Warning</span>
<span class="badge badge-secondary">Secondary</span>
```

### Modals

```html
<div class="modal-overlay">
  <div class="modal-content">
    <div class="modal-header">
      <h3>Modal Title</h3>
      <button class="btn-close">×</button>
    </div>
    <div class="modal-body">
      Modal content
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary">Cancel</button>
      <button class="btn btn-primary">Confirm</button>
    </div>
  </div>
</div>
```

### Loading & Empty States

```html
<!-- Loading state -->
<div class="loading">
  <div class="spinner"></div>
  Loading...
</div>

<!-- Empty state -->
<div class="empty-state">
  <i class="fas fa-inbox"></i>
  <p>No items found</p>
</div>
```

---

## 🛠️ Utility Classes

### Layout

```html
<!-- Flexbox -->
<div class="d-flex align-items-center justify-content-between gap-md">
  <!-- Content -->
</div>
```

### Spacing

```html
<!-- Margin (mt, mb, ml, mr) -->
<div class="mt-2 mb-3"><!-- margin-top: var(--spacing-sm), margin-bottom: var(--spacing-md) --></div>

<!-- Padding (pt, pb, pl, pr) -->
<div class="p-4"><!-- padding: var(--spacing-xl) --></div>
```

### Text

```html
<!-- Alignment -->
<p class="text-center">Centered text</p>
<p class="text-left">Left aligned</p>
<p class="text-right">Right aligned</p>

<!-- Style -->
<p class="text-muted">Muted text</p>
<p class="font-weight-bold">Bold text</p>
```

### Colors

```html
<span class="text-primary">Primary text</span>
<span class="text-success">Success text</span>
<span class="text-danger">Danger text</span>
<span class="text-warning">Warning text</span>
<span class="text-muted">Muted text</span>
```

---

## 🔄 Migration Guide

### Step-by-Step Process

#### 1. Replace Colors

**Before:**

```css
.my-component {
  color: #007bff;
  background-color: #fff;
  border-color: #ddd;
}
```

**After:**

```css
.my-component {
  color: var(--color-primary);
  background-color: var(--color-bg-primary);
  border-color: var(--color-border-medium);
}
```

#### 2. Replace Spacing

**Before:**

```css
.my-component {
  padding: 16px;
  margin-bottom: 24px;
  gap: 10px;
}
```

**After:**

```css
.my-component {
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  gap: var(--spacing-md);
}
```

#### 3. Replace Typography

**Before:**

```css
.my-component {
  font-size: 0.95rem;
  font-weight: 500;
  line-height: 1.5;
}
```

**After:**

```css
.my-component {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-normal);
}
```

#### 4. Replace Borders & Shadows

**Before:**

```css
.my-component {
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
```

**After:**

```css
.my-component {
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
}
```

#### 5. Replace Transitions

**Before:**

```css
.my-component {
  transition: all 0.2s ease;
}
```

**After:**

```css
.my-component {
  transition: all var(--transition-base);
}
```

#### 6. Use Component Classes

**Before:**

```html
<button style="background:#007bff; color:#fff; padding:10px 20px;">
  Save
</button>
```

**After:**

```html
<button class="btn btn-primary">
  Save
</button>
```

### Color Migration Reference

| Old Value | New Variable | Usage |
|-----------|--------------|-------|
| `#007bff` | `--color-primary` | Primary brand color |
| `#0056b3` | `--color-primary-hover` | Hover states |
| `#28a745` | `--color-success` | Success messages |
| `#dc3545` | `--color-danger` | Errors/Delete |
| `#ffc107` | `--color-warning` | Warnings |
| `#fff` | `--color-white` or `--color-bg-primary` | Backgrounds |
| `#f8f9fa` | `--color-bg-secondary` | Secondary backgrounds |
| `#333` | `--color-text-primary` | Primary text |
| `#555` | `--color-text-secondary` | Secondary text |
| `#6c757d` | `--color-text-muted` | Muted text |
| `#ddd` | `--color-border-medium` | Borders |
| `#e0e0e0` | `--color-border-light` | Light borders |

### Spacing Migration Reference

| Old Value | New Variable |
|-----------|--------------|
| `4px` | `--spacing-xs` |
| `8px` | `--spacing-sm` |
| `10px` | Use `--spacing-sm` or custom |
| `16px` | `--spacing-md` |
| `20px` | Use `--spacing-lg` or custom |
| `24px` | `--spacing-lg` |
| `30px` | Use `--spacing-xl` or custom |
| `32px` | `--spacing-xl` |
| `48px` | `--spacing-2xl` |

---

## ✅ Migrated Components

### Core Components

- ✅ **SettingsCard** - Reusable card component

### Page Components

- ✅ **Entity.vue** - Generic CRUD interface with design tokens (pagination, filters, loading states)

### Menu/Navigation Components

- ✅ **MainNavMenu** - Left sidebar navigation with collapsible categories
- ✅ **TopMenu** - Top bar with user info and locale selector

### Settings Components

- ✅ **NavigationSettings** - Uses SettingsCard + design tokens
- ✅ **LocalizationSettings** - Uses SettingsCard + design tokens
- ✅ **UISettings** - Uses SettingsCard + design tokens
- ✅ **NotificationSettings** - Uses SettingsCard + design tokens
- ✅ **SecuritySettings** - Uses SettingsCard + design tokens
- ✅ **SSHKeysSettings** - Uses SettingsCard + design tokens

### UI Components

- ✅ **ToastContainer** - Uses design tokens
- ✅ **DemoModeBanner** - Uses design tokens
- ✅ **LoadingSkeleton** - Skeleton loading component with variants

### Generic Components

- ✅ **EntityListSkeleton** - Uses design tokens

### Modal Components

- ✅ **BaseModal** - Uses design tokens
- ✅ **EntityModal** - Uses design tokens

### Terminal Components

- ✅ **TerminalAccessModal** - Modal for managing terminal access and permissions

### Button Components

- ✅ **Disconnect** - Already using design system button classes

### Migration Statistics

- **Total Components Migrated:** 21+
- **Design Token Usage:** Colors, spacing, typography, borders, shadows, transitions, z-index
- **CSS Reduction:** 50-70% per component
- **Theme-Ready:** All components support future dark mode
- **High-Impact Components:** Entity.vue, MainNavMenu, TopMenu fully migrated

---

## 🌙 Theming & Dark Mode

### Implementing Dark Mode

The design system includes dark mode variables. To implement:

```javascript
// Toggle dark mode
document.documentElement.setAttribute('data-theme', 'dark')

// Remove dark mode
document.documentElement.removeAttribute('data-theme')
```

All CSS variables automatically switch to dark variants defined in `variables.css`.

### Creating a Custom Theme

1. Copy `variables.css`
2. Modify color values
3. Import your theme file instead

```css
/* custom-theme.css */
:root {
  --color-primary: #ff6b6b;
  --color-primary-hover: #ee5a52;
  --spacing-md: 20px;        /* Adjust spacing for compact/spacious */
  --border-radius-md: 8px;   /* More/less rounded corners */
  --shadow-sm: 0 3px 6px rgba(255, 107, 107, 0.15);
}
```

**Time to create new theme:**

- **Before:** Days/weeks (modify 89+ files)
- **After:** ~1 hour (modify 1 file)

### Theme Variables to Customize

**Essential:**

- Primary color
- Success/danger/warning colors
- Background colors
- Text colors
- Border colors

**Optional:**

- Spacing (for compact/spacious variants)
- Font sizes (for accessibility)
- Border radius (for sharp/rounded styles)
- Shadows (for flat/elevated designs)

---

## 📝 Best Practices

### 1. Always Use Design Tokens

❌ **Don't:**

```css
.my-component {
  color: #007bff;
  padding: 16px;
  border-radius: 6px;
}
```

✅ **Do:**

```css
.my-component {
  color: var(--color-primary);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
}
```

### 2. Use Semantic Class Names

❌ **Don't:**

```html
<button class="blue-button large">Click me</button>
```

✅ **Do:**

```html
<button class="btn btn-primary btn-lg">Click me</button>
```

### 3. Leverage Existing Components

Before creating custom styles, check if a component class exists.

❌ **Don't:**

```vue
<div style="padding: 30px; background: white; border-radius: 8px;">
  <h2 style="margin-bottom: 20px;">Title</h2>
  <p>Content</p>
</div>
```

✅ **Do:**

```vue
<div class="card">
  <div class="card-header">
    <h2>Title</h2>
  </div>
  <div class="card-body">
    <p>Content</p>
  </div>
</div>
```

### 4. Test in Both Light and Dark Modes

Always verify your components work in both themes before committing.

### 5. Document Custom Components

When creating new reusable components, document them following this guide's format.

### 6. Use Utility Classes for Simple Modifications

```html
<!-- Good: Using utility classes -->
<div class="card mt-4 mb-3">...</div>

<!-- Avoid: Inline styles -->
<div class="card" style="margin-top: 32px; margin-bottom: 24px;">...</div>
```

---

## 📖 Additional Resources

- `src/assets/styles/variables.css` - All design tokens
- `src/assets/styles/components.css` - All component classes
- `src/components/UI/SettingsCard.vue` - Example of migrated component
- `src/components/Settings/*Settings.vue` - Multiple migration examples

---

**Need help?** Check existing migrated components for patterns and examples!

---

**Version History:**

- v1.0.0 (2025-10-09) - Initial comprehensive design system
