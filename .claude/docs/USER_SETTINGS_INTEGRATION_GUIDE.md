# User Settings Frontend Integration Guide

## Overview

The OCF Core API provides a complete user preferences system. This guide shows how to integrate it into your frontend application, with specific examples for the OCF Frontend (Vue 3) and general examples for React.

## API Endpoints

### Base URL
```
http://localhost:8080/api/v1
```

### Authentication
All endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

> **Note for OCF Frontend**: The `/api/v1` prefix and authentication headers are automatically added by axios interceptors. You only need to use relative paths like `/users/me/settings`.

---

## 📋 Available Endpoints

### 1. Get Current User Settings
**GET** `/users/me/settings`

Retrieves the current user's settings. If settings don't exist, they will be automatically created with defaults.

**Response 200:**
```json
{
  "id": 1,
  "user_id": "1d660660-7637-4a5d-9d1e-8d05bbf7363f",
  "default_landing_page": "/dashboard",
  "preferred_language": "en",
  "timezone": "UTC",
  "theme": "light",
  "compact_mode": false,
  "email_notifications": true,
  "desktop_notifications": false,
  "password_last_changed": "2025-10-09T10:30:00Z",
  "two_factor_enabled": false,
  "created_at": "2025-10-09T09:00:00Z",
  "updated_at": "2025-10-09T09:00:00Z"
}
```

---

### 2. Update User Settings
**PATCH** `/users/me/settings`

Updates specific user preferences. All fields are optional - only send what you want to update.

**Request Body:**
```json
{
  "default_landing_page": "/courses",
  "preferred_language": "fr",
  "theme": "dark"
}
```

**Response 200:** (Returns updated settings)
```json
{
  "id": 1,
  "user_id": "1d660660-7637-4a5d-9d1e-8d05bbf7363f",
  "default_landing_page": "/courses",
  "preferred_language": "fr",
  "timezone": "UTC",
  "theme": "dark",
  "compact_mode": false,
  "email_notifications": true,
  "desktop_notifications": false,
  "password_last_changed": null,
  "two_factor_enabled": false,
  "created_at": "2025-10-09T09:00:00Z",
  "updated_at": "2025-10-09T10:45:00Z"
}
```

---

### 3. Change Password
**POST** `/users/me/change-password`

Securely changes the user's password. Requires current password verification.

**Request Body:**
```json
{
  "current_password": "oldPassword123",
  "new_password": "newSecurePassword456",
  "confirm_password": "newSecurePassword456"
}
```

**Response 200:**
```json
{
  "message": "Password changed successfully"
}
```

**Response 401:** (Invalid current password)
```json
{
  "error": "current password is incorrect"
}
```

**Response 400:** (Validation error)
```json
{
  "error": "new password and confirmation do not match"
}
```

---

## 🎨 Frontend Implementation - OCF Frontend (Vue 3)

### Overview
The OCF Frontend uses:
- **Pinia** for state management
- **Global Axios instance** with pre-configured interceptors (auth + API prefix)
- **Toast notifications** for user feedback
- **i18n** for internationalization

### Store Implementation

Our implementation is located in `src/stores/userSettings.ts`:

```typescript
// stores/userSettings.ts
import { defineStore } from "pinia"
import { ref } from "vue"
import axios from "axios" // Global instance with auth interceptors
import { useI18n } from "vue-i18n"

export interface UserSettings {
    id?: string
    user_id?: string
    default_landing_page?: string
    preferred_language?: string
    timezone?: string
    theme?: string
    compact_mode?: boolean
    email_notifications?: boolean
    desktop_notifications?: boolean
    password_last_changed?: string
    two_factor_enabled?: boolean
    created_at?: string
    updated_at?: string
}

export interface ChangePasswordData {
    current_password: string
    new_password: string
}

export const useUserSettingsStore = defineStore('UserSettings', () => {
    const { t } = useI18n()

    const settings = ref<UserSettings>({})
    const isLoading = ref(false)
    const error = ref('')

    async function loadSettings() {
        isLoading.value = true
        error.value = ''
        try {
            // No need to add /api/v1 prefix or auth header - handled by interceptors
            const response = await axios.get('/users/me/settings')
            settings.value = response.data
            return response.data
        } catch (err: any) {
            error.value = err.response?.data?.message || t('userSettings.loadError')
            throw err
        } finally {
            isLoading.value = false
        }
    }

    async function updateSettings(data: Partial<UserSettings>) {
        isLoading.value = true
        error.value = ''
        try {
            const response = await axios.patch('/users/me/settings', data)
            settings.value = { ...settings.value, ...response.data }
            return response.data
        } catch (err: any) {
            error.value = err.response?.data?.message || t('userSettings.saveError')
            throw err
        } finally {
            isLoading.value = false
        }
    }

    async function changePassword(data: ChangePasswordData) {
        isLoading.value = true
        error.value = ''
        try {
            await axios.post('/users/me/change-password', data)
            // Reload settings to get updated password_last_changed
            await loadSettings()
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Error changing password'
            throw err
        } finally {
            isLoading.value = false
        }
    }

    return {
        settings,
        isLoading,
        error,
        loadSettings,
        updateSettings,
        changePassword
    }
})
```

### Component Usage with Toast Notifications

```vue
<!-- components/Settings/NavigationSettings.vue -->
<template>
  <div class="settings-section">
    <h3>{{ t('userSettings.navigation.title') }}</h3>
    <div class="form-group">
      <label>{{ t('userSettings.navigation.defaultLandingPage') }}</label>
      <select
        v-model="localSettings.default_landing_page"
        @change="saveSettings"
        class="form-control"
      >
        <option v-for="page in availablePages" :key="page.value" :value="page.value">
          {{ page.label }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserSettingsStore } from '../../stores/userSettings'
import { useToast } from '../../composables/useToast'

const { t } = useI18n()
const settingsStore = useUserSettingsStore()
const toast = useToast()

const localSettings = ref({
  default_landing_page: settingsStore.settings.default_landing_page || '/courses'
})

// Watch for external changes to settings
watch(() => settingsStore.settings, (newSettings) => {
  localSettings.value.default_landing_page = newSettings.default_landing_page || '/courses'
}, { deep: true })

async function saveSettings() {
  try {
    await settingsStore.updateSettings({
      default_landing_page: localSettings.value.default_landing_page
    })
    toast.success(t('userSettings.saveSuccess'))
  } catch (error) {
    console.error('Error saving navigation settings:', error)
    toast.error(t('userSettings.saveError'))
  }
}
</script>
```

### Toast Notification System

The OCF Frontend includes a toast notification composable:

```typescript
// composables/useToast.ts
import { ref } from 'vue'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration: number
}

const toasts = ref<Toast[]>([])
let nextId = 0

export function useToast() {
  function success(message: string, duration = 3000) {
    const id = nextId++
    toasts.value.push({ id, message, type: 'success', duration })
    setTimeout(() => remove(id), duration)
    return id
  }

  function error(message: string, duration = 4000) {
    const id = nextId++
    toasts.value.push({ id, message, type: 'error', duration })
    setTimeout(() => remove(id), duration)
    return id
  }

  function remove(id: number) {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) toasts.value.splice(index, 1)
  }

  return { toasts, success, error, info, warning, remove }
}
```

### Password Change Component

```vue
<!-- components/Settings/SecuritySettings.vue -->
<template>
  <div class="settings-section">
    <h3>{{ t('userSettings.security.title') }}</h3>

    <!-- Password Info -->
    <div class="info-group">
      <div class="info-item">
        <label>{{ t('userSettings.security.passwordLastChanged') }}</label>
        <p>{{ formatDate(settingsStore.settings.password_last_changed) }}</p>
      </div>
    </div>

    <!-- Change Password Form -->
    <div class="password-change-section">
      <h4>{{ t('userSettings.security.changePassword') }}</h4>
      <form @submit.prevent="handleChangePassword">
        <div class="form-group">
          <label>{{ t('userSettings.security.currentPassword') }}</label>
          <input
            type="password"
            v-model="passwordForm.current_password"
            class="form-control"
            required
          />
        </div>
        <div class="form-group">
          <label>{{ t('userSettings.security.newPassword') }}</label>
          <input
            type="password"
            v-model="passwordForm.new_password"
            class="form-control"
            required
          />
        </div>
        <div class="form-group">
          <label>{{ t('userSettings.security.confirmPassword') }}</label>
          <input
            type="password"
            v-model="passwordForm.confirm_password"
            class="form-control"
            required
          />
        </div>
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
        <div v-if="successMessage" class="success-message">
          {{ successMessage }}
        </div>
        <button type="submit" class="btn-primary" :disabled="settingsStore.isLoading">
          {{ settingsStore.isLoading ? 'Changing...' : t('userSettings.security.changePassword') }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserSettingsStore } from '../../stores/userSettings'

const { t } = useI18n()
const settingsStore = useUserSettingsStore()

const passwordForm = ref({
  current_password: '',
  new_password: '',
  confirm_password: ''
})

const errorMessage = ref('')
const successMessage = ref('')

function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'Never'
  return new Date(dateString).toLocaleDateString()
}

async function handleChangePassword() {
  errorMessage.value = ''
  successMessage.value = ''

  if (passwordForm.value.new_password !== passwordForm.value.confirm_password) {
    errorMessage.value = t('userSettings.security.passwordMismatch')
    return
  }

  if (passwordForm.value.new_password.length < 8) {
    errorMessage.value = t('userSettings.security.passwordWeak')
    return
  }

  try {
    await settingsStore.changePassword({
      current_password: passwordForm.value.current_password,
      new_password: passwordForm.value.new_password
    })
    successMessage.value = t('userSettings.security.passwordChanged')
    passwordForm.value = {
      current_password: '',
      new_password: '',
      confirm_password: ''
    }
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'Error changing password'
  }
}
</script>
```

---

## 🎨 Frontend Implementation - React / TypeScript

### Types Definition
```typescript
// types/userSettings.ts
export interface UserSettings {
  id: number;
  user_id: string;
  default_landing_page: string;
  preferred_language: string;
  timezone: string;
  theme: 'light' | 'dark' | 'auto';
  compact_mode: boolean;
  email_notifications: boolean;
  desktop_notifications: boolean;
  password_last_changed: string | null;
  two_factor_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateSettingsRequest {
  default_landing_page?: string;
  preferred_language?: string;
  timezone?: string;
  theme?: 'light' | 'dark' | 'auto';
  compact_mode?: boolean;
  email_notifications?: boolean;
  desktop_notifications?: boolean;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}
```

### API Service
```typescript
// services/userSettingsService.ts
import axios from 'axios';
import { UserSettings, UpdateSettingsRequest, ChangePasswordRequest } from '../types/userSettings';

const API_BASE_URL = 'http://localhost:8080/api/v1';

// Get JWT token from your auth store/context
const getAuthToken = () => localStorage.getItem('access_token');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to all requests
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const userSettingsService = {
  // Get current user settings
  async getSettings(): Promise<UserSettings> {
    const response = await api.get<UserSettings>('/users/me/settings');
    return response.data;
  },

  // Update specific settings
  async updateSettings(updates: UpdateSettingsRequest): Promise<UserSettings> {
    const response = await api.patch<UserSettings>('/users/me/settings', updates);
    return response.data;
  },

  // Change password
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await api.post('/users/me/change-password', data);
  },
};
```

### React Component Example - Settings Page
```typescript
// components/SettingsPage.tsx
import React, { useState, useEffect } from 'react';
import { userSettingsService } from '../services/userSettingsService';
import type { UserSettings } from '../types/userSettings';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await userSettingsService.getSettings();
      setSettings(data);
    } catch (err) {
      setError('Failed to load settings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof UserSettings, value: any) => {
    try {
      const updated = await userSettingsService.updateSettings({ [key]: value });
      setSettings(updated);
    } catch (err) {
      alert('Failed to update setting');
      console.error(err);
    }
  };

  if (loading) return <div>Loading settings...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!settings) return null;

  return (
    <div className="settings-page">
      <h1>User Settings</h1>

      {/* Theme Selection */}
      <section>
        <h2>Appearance</h2>
        <label>
          Theme:
          <select
            value={settings.theme}
            onChange={(e) => updateSetting('theme', e.target.value)}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="auto">Auto</option>
          </select>
        </label>

        <label>
          <input
            type="checkbox"
            checked={settings.compact_mode}
            onChange={(e) => updateSetting('compact_mode', e.target.checked)}
          />
          Compact Mode
        </label>
      </section>

      {/* Language Selection */}
      <section>
        <h2>Localization</h2>
        <label>
          Language:
          <select
            value={settings.preferred_language}
            onChange={(e) => updateSetting('preferred_language', e.target.value)}
          >
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="es">Español</option>
            <option value="de">Deutsch</option>
          </select>
        </label>

        <label>
          Timezone:
          <select
            value={settings.timezone}
            onChange={(e) => updateSetting('timezone', e.target.value)}
          >
            <option value="UTC">UTC</option>
            <option value="Europe/Paris">Europe/Paris</option>
            <option value="America/New_York">America/New York</option>
            <option value="Asia/Tokyo">Asia/Tokyo</option>
          </select>
        </label>
      </section>

      {/* Navigation */}
      <section>
        <h2>Navigation</h2>
        <label>
          Default Landing Page:
          <select
            value={settings.default_landing_page}
            onChange={(e) => updateSetting('default_landing_page', e.target.value)}
          >
            <option value="/dashboard">Dashboard</option>
            <option value="/courses">Courses</option>
            <option value="/terminals">Terminals</option>
            <option value="/labs">Labs</option>
          </select>
        </label>
      </section>

      {/* Notifications */}
      <section>
        <h2>Notifications</h2>
        <label>
          <input
            type="checkbox"
            checked={settings.email_notifications}
            onChange={(e) => updateSetting('email_notifications', e.target.checked)}
          />
          Email Notifications
        </label>

        <label>
          <input
            type="checkbox"
            checked={settings.desktop_notifications}
            onChange={(e) => updateSetting('desktop_notifications', e.target.checked)}
          />
          Desktop Notifications
        </label>
      </section>
    </div>
  );
};
```

### Password Change Component
```typescript
// components/ChangePasswordForm.tsx
import React, { useState } from 'react';
import { userSettingsService } from '../services/userSettingsService';

export const ChangePasswordForm: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Client-side validation
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      await userSettingsService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to change password';
      setError(errorMessage);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="change-password-form">
      <h2>Change Password</h2>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">Password changed successfully!</div>}

      <label>
        Current Password:
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
      </label>

      <label>
        New Password:
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
        />
      </label>

      <label>
        Confirm New Password:
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
        />
      </label>

      <button type="submit">Change Password</button>
    </form>
  );
};
```

---

## 🔗 Additional Integrations

### Apply Theme Changes
When the user changes their theme preference, you should apply it to your app:

**Vue 3 / OCF Frontend:**
```typescript
import { watch } from 'vue'
import { useUserSettingsStore } from '@/stores/userSettings'

const settingsStore = useUserSettingsStore()

// Watch for theme changes and apply them
watch(() => settingsStore.settings.theme, (newTheme) => {
  if (newTheme === 'dark') {
    document.documentElement.classList.add('dark-theme')
  } else if (newTheme === 'light') {
    document.documentElement.classList.remove('dark-theme')
  } else { // auto
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.classList.toggle('dark-theme', prefersDark)
  }
})
```

**React:**
```typescript
useEffect(() => {
  if (!settings) return;

  if (settings.theme === 'dark') {
    document.documentElement.classList.add('dark-theme');
  } else if (settings.theme === 'light') {
    document.documentElement.classList.remove('dark-theme');
  } else { // auto
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark-theme', prefersDark);
  }
}, [settings?.theme]);
```

### Apply Language Changes

**Vue 3 / OCF Frontend:**
```typescript
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserSettingsStore } from '@/stores/userSettings'
import { useLocale } from '@/composables/useLocale'

const { locale } = useI18n()
const { setLocale } = useLocale()
const settingsStore = useUserSettingsStore()

watch(() => settingsStore.settings.preferred_language, (newLang) => {
  if (newLang) {
    locale.value = newLang
    setLocale(newLang)
  }
})
```

**React with react-i18next:**
```typescript
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const { i18n } = useTranslation();

useEffect(() => {
  if (settings?.preferred_language) {
    i18n.changeLanguage(settings.preferred_language);
  }
}, [settings?.preferred_language]);
```

### Redirect to Landing Page After Login

**Vue 3 / OCF Frontend:**
```typescript
// In your login success handler
import { useRouter } from 'vue-router'
import { useUserSettingsStore } from '@/stores/userSettings'

const router = useRouter()
const settingsStore = useUserSettingsStore()

async function afterLogin() {
  const settings = await settingsStore.loadSettings()
  router.push(settings.default_landing_page || '/dashboard')
}
```

**React:**
```typescript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

async function afterLogin() {
  const settings = await userSettingsService.getSettings();
  navigate(settings.default_landing_page || '/dashboard');
}
```

---

## 🎯 Quick Start Checklist

1. ✅ **Authentication**: Ensure you have a valid JWT token from login
2. ✅ **Fetch Settings**: Call `GET /users/me/settings` on app load or settings page mount
3. ✅ **Update on Change**: Call `PATCH /users/me/settings` with only the changed fields
4. ✅ **Show Feedback**: Display success/error messages to the user (toasts, alerts, etc.)
5. ✅ **Apply Locally**: Update your app's theme/language/etc based on the settings
6. ✅ **Persist**: Settings are automatically stored in the database

---

## 🔒 Security Notes

- All endpoints require authentication via Bearer token
- Password changes require the current password for verification
- New passwords must be at least 8 characters long
- Users can only access and modify their own settings
- Passwords are validated by Casdoor for additional security

---

## 🌐 Available Options

### Default Landing Pages (OCF Frontend)
- `/courses` - Course list
- `/subscription-dashboard` - Subscription dashboard
- `/terminal-sessions` - Terminal sessions
- `/terminal-creation` - Create new terminal
- `/subscription-plans` - Subscription plans

### Languages
- `en` - English
- `fr` - Français
- `es` - Español (if implemented)
- `de` - Deutsch (if implemented)
- `it` - Italiano (if implemented)

### Themes
- `light` - Light mode
- `dark` - Dark mode
- `auto` - System preference

### Timezones
Use standard IANA timezone identifiers:
- `UTC`
- `Europe/Paris`
- `Europe/London`
- `America/New_York`
- `America/Los_Angeles`
- `Asia/Tokyo`
- etc.

---

## 🐛 Error Handling

### Common Error Responses

**401 Unauthorized**
```json
{
  "error": "User not authenticated"
}
```

**404 Not Found** (shouldn't happen - auto-creates)
```json
{
  "error": "Settings not found"
}
```

**400 Bad Request**
```json
{
  "error": "new password and confirmation do not match"
}
```

**500 Internal Server Error**
```json
{
  "error": "Internal server error"
}
```

### Error Handling Best Practices

**OCF Frontend (Vue 3):**
```typescript
import { useToast } from '@/composables/useToast'

const toast = useToast()

try {
  await settingsStore.updateSettings({ theme: 'dark' })
  toast.success('Settings saved successfully')
} catch (error: any) {
  const errorMessage = error.response?.data?.error || 'Failed to save settings'
  toast.error(errorMessage)
  console.error('Settings error:', error)
}
```

**React:**
```typescript
try {
  await userSettingsService.updateSettings({ theme: 'dark' });
  showSuccessToast('Settings saved successfully');
} catch (error: any) {
  const errorMessage = error.response?.data?.error || 'Failed to save settings';
  showErrorToast(errorMessage);
  console.error('Settings error:', error);
}
```

---

## 📝 Testing with cURL

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"1.supervisor@test.com","password":"test"}' \
  | jq -r '.access_token')

# 2. Get settings
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/v1/users/me/settings | jq

# 3. Update theme
curl -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"theme":"dark"}' \
  http://localhost:8080/api/v1/users/me/settings | jq

# 4. Update multiple settings
curl -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "theme":"dark",
    "preferred_language":"fr",
    "compact_mode":true
  }' \
  http://localhost:8080/api/v1/users/me/settings | jq

# 5. Change password
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "current_password":"test",
    "new_password":"newPassword123",
    "confirm_password":"newPassword123"
  }' \
  http://localhost:8080/api/v1/users/me/change-password

# 6. Verify password was changed
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/v1/users/me/settings | jq '.password_last_changed'
```

---

## 🔄 Automatic Settings Creation

Settings are now automatically created with defaults when:
1. A new user registers (via the user creation hook)
2. An existing user accesses `GET /users/me/settings` for the first time

**Default Values:**
- Default Landing Page: `/dashboard`
- Language: `en`
- Timezone: `UTC`
- Theme: `light`
- Compact Mode: `false`
- Email Notifications: `true`
- Desktop Notifications: `false`
- Two-Factor Enabled: `false`
- Password Last Changed: `null`

---

## 🚀 Production Recommendations

1. **Cache Settings**: Store settings in your state management (Pinia, Redux, Vuex, etc.)
2. **Debounce Updates**: Don't send a PATCH request on every keystroke - debounce or save on blur/change
3. **Optimistic Updates**: Update UI immediately, rollback on error
4. **Error Handling**: Show user-friendly error messages via toasts/alerts
5. **Loading States**: Show spinners/skeletons while loading
6. **Validation**: Validate on frontend before sending to API
7. **Security**: Never log passwords, use HTTPS in production
8. **Accessibility**: Ensure all form fields have proper labels and ARIA attributes

### OCF Frontend Specific:
- ✅ Toast notifications already implemented
- ✅ Auto-save on change with feedback
- ✅ i18n translations included
- ✅ Loading states handled by store
- ✅ Error handling with user-friendly messages

---

## 📚 Full API Documentation

Visit the Swagger UI for complete API documentation:
```
http://localhost:8080/swagger/
```

Look for the `user-settings` tag in the Swagger UI for all available endpoints.

---

## 🎨 OCF Frontend Structure

The user settings implementation in OCF Frontend is organized as follows:

```
src/
├── stores/
│   └── userSettings.ts              # Pinia store with API calls
├── components/
│   ├── Menus/
│   │   └── UserSettingsMenu.vue     # Slide-out settings menu
│   ├── Settings/
│   │   ├── NavigationSettings.vue   # Default landing page
│   │   ├── LocalizationSettings.vue # Language & timezone
│   │   ├── UISettings.vue           # Theme & compact mode
│   │   ├── NotificationSettings.vue # Email & desktop notifications
│   │   ├── SecuritySettings.vue     # Password change
│   │   └── SSHKeysSettings.vue      # SSH key management
│   └── UI/
│       └── ToastContainer.vue       # Toast notifications
├── composables/
│   └── useToast.ts                  # Toast notification composable
└── services/
    └── axiosInterceptor.ts          # Auto-adds auth & API prefix
```

### How to Access Settings in OCF Frontend

Click on the user icon in the top-right corner to open the settings menu. The menu includes:
- **Navigation** - Default landing page
- **Localization** - Language and timezone
- **User Interface** - Theme and compact mode
- **Notifications** - Email and desktop notifications
- **Security** - Password change and 2FA status
- **SSH Keys** - SSH key management

All changes are auto-saved with toast notifications for user feedback.
