<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */
-->

<template>
  <div class="design-system-audit">
    <div class="audit-header">
      <h1><i class="fas fa-palette"></i> {{ t('designSystem.title') }}</h1>
      <div class="theme-toggle">
        <button
          :class="{ active: currentTheme === 'light' }"
          @click="setTheme('light')"
        >
          <i class="fas fa-sun"></i> {{ t('designSystem.light') }}
        </button>
        <button
          :class="{ active: currentTheme === 'dark' }"
          @click="setTheme('dark')"
        >
          <i class="fas fa-moon"></i> {{ t('designSystem.dark') }}
        </button>
      </div>
    </div>

    <div class="audit-content">
      <!-- LEFT COLUMN -->
      <div class="audit-column">

        <!-- 1. SIDEBAR -->
        <div class="audit-section">
          <div class="section-title"><i class="fas fa-bars"></i> {{ t('designSystem.sidebarTitle') }}</div>
          <div class="section-body">
            <div class="sidebar-demo">
              <!-- Main Nav -->
              <div class="sidebar-panel main-nav-sidebar">
                <div class="nav-category">
                  <div class="category-header">
                    <i class="fas fa-graduation-cap"></i>
                    <span>Course Design</span>
                    <i class="fas fa-chevron-down" style="margin-left:auto;font-size:0.7rem;"></i>
                  </div>
                  <ul class="category-items">
                    <li><a href="#"><i class="fas fa-book"></i> Courses</a></li>
                    <li><a href="#" class="active"><i class="fas fa-book-open"></i> Chapters</a></li>
                    <li><a href="#"><i class="fas fa-stream"></i> Sections</a></li>
                    <li><a href="#"><i class="fas fa-file-alt"></i> Pages</a></li>
                  </ul>
                </div>
                <div class="nav-category">
                  <div class="category-header">
                    <i class="fas fa-users"></i>
                    <span>Groups</span>
                  </div>
                </div>
                <div class="nav-category">
                  <div class="category-header admin-cat">
                    <i class="fas fa-shield-alt"></i>
                    <span>Administration</span>
                  </div>
                </div>
              </div>

              <!-- Settings Nav -->
              <div class="sidebar-panel settings-nav-sidebar">
                <div class="settings-header">
                  <a href="#"><i class="fas fa-arrow-left"></i> Settings</a>
                </div>
                <a href="#" class="menu-item"><i class="fas fa-compass"></i> Navigation</a>
                <a href="#" class="menu-item active"><i class="fas fa-globe"></i> Localization</a>
                <a href="#" class="menu-item"><i class="fas fa-palette"></i> UI Preferences</a>
                <a href="#" class="menu-item"><i class="fas fa-bell"></i> Notifications</a>
                <a href="#" class="menu-item"><i class="fas fa-shield-alt"></i> Security</a>
                <a href="#" class="menu-item"><i class="fas fa-terminal"></i> SSH Keys</a>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. TREE COMPONENTS -->
        <div class="audit-section">
          <div class="section-title"><i class="fas fa-sitemap"></i> {{ t('designSystem.treeTitle') }}</div>
          <div class="section-body">
            <div class="tree-demo">
              <div class="tree-node">
                <div class="tree-node-header" style="background: var(--color-surface-hover);">
                  <span class="expand-icon">&#9654;</span>
                  <span class="node-icon"><i class="fas fa-building"></i></span>
                  <span class="node-label">{{ t('designSystem.treeHover') }}</span>
                  <div class="tree-node-actions" style="opacity:1;">
                    <button class="tree-action-btn"><i class="fas fa-edit"></i></button>
                    <button class="tree-action-btn"><i class="fas fa-trash"></i></button>
                  </div>
                </div>
              </div>
              <div class="tree-node">
                <div class="tree-node-header" style="background: var(--color-surface-active);">
                  <span class="expand-icon">&#9660;</span>
                  <span class="node-icon"><i class="fas fa-users"></i></span>
                  <span class="node-label">{{ t('designSystem.treeActive') }}</span>
                </div>
              </div>
              <div class="tree-children">
                <div class="tree-node">
                  <div class="tree-node-header">
                    <span class="expand-icon" style="visibility:hidden;">&#9654;</span>
                    <span class="node-icon"><i class="fas fa-user"></i></span>
                    <span class="node-label">{{ t('designSystem.treeDefault') }}</span>
                  </div>
                </div>
              </div>
              <div style="margin-top:12px;">
                <div class="tree-node dragging-over">
                  <div class="tree-node-header" style="background: var(--color-primary-bg); border: 2px dashed var(--color-primary);">
                    <span class="expand-icon">&#9654;</span>
                    <span class="node-icon"><i class="fas fa-folder"></i></span>
                    <span class="node-label">{{ t('designSystem.treeDragOver') }}</span>
                  </div>
                </div>
              </div>
              <div style="margin-top:8px;">
                <div class="tree-node drop-target" style="background: var(--color-success-bg); border-left: 3px solid var(--color-success);">
                  <div class="tree-node-header">
                    <span class="expand-icon">&#9654;</span>
                    <span class="node-icon"><i class="fas fa-check"></i></span>
                    <span class="node-label">{{ t('designSystem.treeDrop') }}</span>
                  </div>
                </div>
              </div>
              <div style="margin-top:12px;">
                <span style="font-size:0.8rem;color:var(--color-text-muted);">{{ t('designSystem.actionButtonHover') }}:</span>
                <button class="tree-action-btn" style="background: var(--color-surface-variant); color: var(--color-text-primary);"><i class="fas fa-edit"></i> Edit</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 5. USER SETTINGS MENU -->
        <div class="audit-section">
          <div class="section-title"><i class="fas fa-cog"></i> {{ t('designSystem.userSettingsTitle') }}</div>
          <div class="section-body">
            <div class="user-settings-demo">
              <div class="us-header">
                <h2><i class="fas fa-cog"></i> Settings</h2>
                <button class="us-close"><i class="fas fa-times"></i></button>
              </div>
              <div class="us-section">
                <div class="us-cat-header"><i class="fas fa-compass"></i> Navigation</div>
              </div>
              <div class="us-section">
                <div class="us-cat-header"><i class="fas fa-globe"></i> Localization</div>
              </div>
              <div class="us-section">
                <div class="us-cat-header"><i class="fas fa-palette"></i> UI Preferences</div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- RIGHT COLUMN -->
      <div class="audit-column">

        <!-- 3. COURSE EDITOR NODES -->
        <div class="audit-section">
          <div class="section-title"><i class="fas fa-project-diagram"></i> {{ t('designSystem.courseNodesTitle') }}</div>
          <div class="section-body">
            <div style="display:flex;gap:16px;">
              <div style="flex:1;">
                <div class="course-nodes-grid">
                  <div class="course-node node-course">
                    <div class="node-head"><span class="icon"><i class="fas fa-book"></i></span><span class="title">Intro to CS</span></div>
                    <div class="node-actions-bar">
                      <button class="action-btn"><i class="fas fa-edit"></i></button>
                      <button class="action-btn delete"><i class="fas fa-trash"></i></button>
                    </div>
                  </div>
                  <div class="course-node node-chapter">
                    <div class="node-head"><span class="icon"><i class="fas fa-book-open"></i></span><span class="title">Chapter 1</span></div>
                    <div class="node-actions-bar">
                      <button class="action-btn"><i class="fas fa-edit"></i></button>
                      <button class="action-btn delete"><i class="fas fa-trash"></i></button>
                    </div>
                  </div>
                  <div class="course-node node-section">
                    <div class="node-head"><span class="icon"><i class="fas fa-stream"></i></span><span class="title">Section A</span></div>
                    <div class="node-actions-bar">
                      <button class="action-btn"><i class="fas fa-edit"></i></button>
                      <button class="action-btn delete"><i class="fas fa-trash"></i></button>
                    </div>
                  </div>
                  <div class="course-node node-page">
                    <div class="node-head"><span class="icon"><i class="fas fa-file-alt"></i></span><span class="title">Page 1</span></div>
                    <div class="node-actions-bar">
                      <button class="action-btn"><i class="fas fa-edit"></i></button>
                      <button class="action-btn delete"><i class="fas fa-trash"></i></button>
                    </div>
                  </div>
                </div>

                <!-- Course Tree Node -->
                <div class="course-tree-demo" style="margin-top:16px;">
                  <div style="font-size:0.8rem;color:var(--color-text-muted);margin-bottom:8px;">{{ t('designSystem.courseTreePanel') }}:</div>
                  <div class="ct-node ct-course"><i class="fas fa-book"></i> Introduction to CS</div>
                  <div class="ct-node ct-chapter"><i class="fas fa-book-open"></i> Chapter 1: Basics</div>
                  <div class="ct-node ct-section"><i class="fas fa-stream"></i> Section A: Variables</div>
                  <div class="ct-node ct-page"><i class="fas fa-file-alt"></i> Page 1: Introduction</div>
                  <div class="ct-node ct-page"><i class="fas fa-file-alt"></i> Page 2: Data Types</div>
                  <div class="ct-node ct-section"><i class="fas fa-stream"></i> Section B: Functions</div>
                </div>
              </div>

              <!-- Node Library -->
              <div style="width:180px;flex-shrink:0;">
                <div class="node-library">
                  <div class="node-library-header">{{ t('designSystem.nodeLibrary') }}</div>
                  <div class="node-library-items">
                    <div class="node-library-item">
                      <div class="node-library-preview lib-course">
                        <i class="fas fa-book"></i><span class="lib-label">Course</span>
                      </div>
                    </div>
                    <div class="node-library-item">
                      <div class="node-library-preview lib-chapter">
                        <i class="fas fa-book-open"></i><span class="lib-label">Chapter</span>
                      </div>
                    </div>
                    <div class="node-library-item">
                      <div class="node-library-preview lib-section">
                        <i class="fas fa-stream"></i><span class="lib-label">Section</span>
                      </div>
                    </div>
                    <div class="node-library-item">
                      <div class="node-library-preview lib-page">
                        <i class="fas fa-file-alt"></i><span class="lib-label">Page</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. TERMINAL COMPONENTS -->
        <div class="audit-section">
          <div class="section-title"><i class="fas fa-terminal"></i> {{ t('designSystem.terminalTitle') }}</div>
          <div class="section-body" style="display:flex;flex-direction:column;gap:12px;">
            <div class="terminal-wrapper-demo">
              <div class="prompt"><span class="user">user@terminal</span>:<span class="path">~/project</span><span class="dollar">$</span> npm run build</div>
              <div style="color:#6a9955;">&#10003; Compiled successfully in 2.3s</div>
              <div style="color:#569cd6;">  dist/index.js  2,256 kB</div>
              <div class="prompt"><span class="user">user@terminal</span>:<span class="path">~/project</span><span class="dollar">$</span> <span class="cursor-blink">&nbsp;</span></div>
            </div>

            <div class="terminal-error-demo">
              <div style="font-size:2rem;"><i class="fas fa-exclamation-triangle"></i></div>
              <h2>{{ t('designSystem.terminalError') }}</h2>
              <p>{{ t('designSystem.terminalErrorDesc') }} <code>ECONNREFUSED</code></p>
            </div>

            <div class="code-example-demo">
              <div style="font-size:0.8rem;color:var(--color-text-muted);margin-bottom:6px;">{{ t('designSystem.codeExample') }}:</div>
              <pre>ssh -i ~/.ssh/id_rsa user@terminal.example.com
# Start a new session
tmux new-session -s dev</pre>
            </div>

            <div>
              <div style="font-size:0.8rem;color:var(--color-text-muted);margin-bottom:6px;">{{ t('designSystem.badges') }}:</div>
              <div class="badge-row">
                <span class="badge read"><i class="fas fa-eye"></i> Read</span>
                <span class="badge write"><i class="fas fa-edit"></i> Write</span>
                <span class="badge owner"><i class="fas fa-user"></i> Owner</span>
                <span class="badge warning"><i class="fas fa-exclamation-triangle"></i> Expiring</span>
                <span class="badge danger"><i class="fas fa-times-circle"></i> Expired</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 6. SURFACE STATES -->
        <div class="audit-section">
          <div class="section-title"><i class="fas fa-layer-group"></i> {{ t('designSystem.surfaceTitle') }}</div>
          <div class="section-body">
            <div class="surface-states">
              <div v-for="item in surfaceItems" :key="item.variable" class="surface-state-item">
                <div class="swatch" :style="item.swatchStyle"></div>
                <div class="info">
                  <div>{{ item.label }}</div>
                  <div class="var-name">{{ item.variable }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTranslations } from '../../composables/useTranslations'

const { t } = useTranslations({
  en: {
    designSystem: {
      title: 'OCF CSS Variable Visual Audit',
      light: 'Light',
      dark: 'Dark',
      sidebarTitle: '1. Sidebar — MainNavMenu + SettingsNavMenu',
      treeTitle: '2. Tree Components — Hover / Active / Drag States',
      treeHover: 'Organization Alpha (hover state)',
      treeActive: 'Team Bravo (active/pressed state)',
      treeDefault: 'Member — Default state',
      treeDragOver: 'Drag-over target state',
      treeDrop: 'Drop target state',
      actionButtonHover: 'Action button hover',
      userSettingsTitle: '5. UserSettingsMenu Overlay',
      courseNodesTitle: '3. Course Editor Nodes + Node Library',
      courseTreePanel: 'Course Tree Panel',
      nodeLibrary: 'Node Library',
      terminalTitle: '4. Terminal Components',
      terminalError: 'Terminal Connection Error',
      terminalErrorDesc: 'Unable to connect to terminal session. Error code:',
      codeExample: 'Help page code example',
      badges: 'Terminal Badges',
      surfaceTitle: '6. New Surface Variables',
      surfaceBase: 'Surface (base)',
      surfaceHover: 'Surface Hover',
      surfaceActive: 'Surface Active',
      surfaceVariant: 'Surface Variant',
      primaryBg: 'Primary Background',
      sidebarBg: 'Sidebar Background',
      sidebarText: 'Sidebar Text (on sidebar bg)',
      sidebarTextMuted: 'Sidebar Text Muted (on sidebar bg)'
    }
  },
  fr: {
    designSystem: {
      title: 'Audit visuel des variables CSS OCF',
      light: 'Clair',
      dark: 'Sombre',
      sidebarTitle: '1. Barre latérale — MainNavMenu + SettingsNavMenu',
      treeTitle: '2. Composants Arbre — États Survol / Actif / Glisser',
      treeHover: 'Organisation Alpha (état survol)',
      treeActive: 'Équipe Bravo (état actif/pressé)',
      treeDefault: 'Membre — État par défaut',
      treeDragOver: 'État cible de glissement',
      treeDrop: 'État cible de dépôt',
      actionButtonHover: 'Survol bouton action',
      userSettingsTitle: '5. Menu Paramètres Utilisateur',
      courseNodesTitle: '3. Noeuds Éditeur de Cours + Bibliothèque',
      courseTreePanel: 'Panneau arbre de cours',
      nodeLibrary: 'Bibliothèque de noeuds',
      terminalTitle: '4. Composants Terminal',
      terminalError: 'Erreur de connexion terminal',
      terminalErrorDesc: 'Impossible de se connecter à la session terminal. Code d\'erreur :',
      codeExample: 'Exemple de code page d\'aide',
      badges: 'Badges Terminal',
      surfaceTitle: '6. Nouvelles variables de surface',
      surfaceBase: 'Surface (base)',
      surfaceHover: 'Surface Survol',
      surfaceActive: 'Surface Actif',
      surfaceVariant: 'Surface Variante',
      primaryBg: 'Arrière-plan Primaire',
      sidebarBg: 'Arrière-plan Barre latérale',
      sidebarText: 'Texte barre latérale (sur fond barre latérale)',
      sidebarTextMuted: 'Texte atténué barre latérale (sur fond barre latérale)'
    }
  }
})

const currentTheme = ref(
  document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
)

function setTheme(theme: 'light' | 'dark') {
  currentTheme.value = theme
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark')
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
}

const surfaceItems = computed(() => [
  {
    label: t('designSystem.surfaceBase'),
    variable: '--color-surface',
    swatchStyle: 'background: var(--color-surface);'
  },
  {
    label: t('designSystem.surfaceHover'),
    variable: '--color-surface-hover',
    swatchStyle: 'background: var(--color-surface-hover);'
  },
  {
    label: t('designSystem.surfaceActive'),
    variable: '--color-surface-active',
    swatchStyle: 'background: var(--color-surface-active);'
  },
  {
    label: t('designSystem.surfaceVariant'),
    variable: '--color-surface-variant',
    swatchStyle: 'background: var(--color-surface-variant);'
  },
  {
    label: t('designSystem.primaryBg'),
    variable: '--color-primary-bg',
    swatchStyle: 'background: var(--color-primary-bg);'
  },
  {
    label: t('designSystem.sidebarBg'),
    variable: '--color-sidebar-bg',
    swatchStyle: 'background: var(--color-sidebar-bg);'
  },
  {
    label: t('designSystem.sidebarText'),
    variable: '--color-sidebar-text',
    swatchStyle: 'background: var(--color-sidebar-bg); color: var(--color-sidebar-text); text-align:center; display:flex; align-items:center; justify-content:center; font-size:0.7rem; width:auto; height:auto; padding:6px 8px; min-width:140px;'
  },
  {
    label: t('designSystem.sidebarTextMuted'),
    variable: '--color-sidebar-text-muted',
    swatchStyle: 'background: var(--color-sidebar-bg); color: var(--color-sidebar-text-muted); text-align:center; display:flex; align-items:center; justify-content:center; font-size:0.7rem; width:auto; height:auto; padding:6px 8px; min-width:140px;'
  }
])
</script>

<style scoped>
.design-system-audit {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.audit-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--color-bg-primary);
  border-bottom: 2px solid var(--color-border-light);
  padding: 12px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.audit-header h1 {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
  margin: 0;
}

.theme-toggle {
  display: flex;
  gap: 8px;
  align-items: center;
}

.theme-toggle button {
  padding: 8px 16px;
  border-radius: 6px;
  border: 2px solid var(--color-border-medium);
  background: var(--color-surface);
  color: var(--color-text-primary);
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all var(--transition-base);
}

.theme-toggle button.active {
  background: var(--color-primary);
  color: var(--color-white);
  border-color: var(--color-primary);
}

.theme-toggle button:hover:not(.active) {
  background: var(--color-surface-hover);
}

.audit-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  flex: 1;
}

.audit-column {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  border-right: 1px solid var(--color-border-light);
}

.audit-column:last-child { border-right: none; }

.audit-section {
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  overflow: hidden;
}

.section-title {
  padding: 10px 16px;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  border-bottom: 1px solid var(--color-border-light);
}

.section-body {
  padding: 16px;
}

/* ========================================
   1. SIDEBAR SIMULATION
   ======================================== */
.sidebar-demo {
  display: flex;
  gap: 16px;
}

.sidebar-panel {
  width: 230px;
  min-height: 400px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.main-nav-sidebar {
  background-color: var(--color-sidebar-bg);
  color: var(--color-sidebar-text);
  padding: var(--spacing-lg);
}

.main-nav-sidebar .nav-category {
  margin-bottom: var(--spacing-sm);
}

.main-nav-sidebar .category-header {
  display: flex;
  align-items: center;
  padding: var(--spacing-md);
  color: var(--color-white);
  background-color: var(--color-gray-700);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: background-color 0.3s;
  user-select: none;
  min-height: 44px;
  gap: 12px;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

.main-nav-sidebar .category-header:hover {
  background-color: var(--color-gray-600);
  transform: translateX(3px);
}

.main-nav-sidebar .category-header.admin-cat {
  background: linear-gradient(135deg, var(--color-danger) 0%, var(--color-danger-hover) 100%);
  border: var(--border-width-thin) solid var(--color-danger-hover);
}

.main-nav-sidebar .category-header.admin-cat:hover {
  background: linear-gradient(135deg, var(--color-danger-hover) 0%, var(--color-danger-dark) 100%);
}

.main-nav-sidebar .category-items {
  list-style: none;
  padding: 0;
  margin: 0;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 0 0 4px 4px;
}

.main-nav-sidebar .category-items li a {
  display: flex;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  color: var(--color-gray-400);
  text-decoration: none;
  font-size: var(--font-size-sm);
  gap: 12px;
  transition: background-color 0.3s, color 0.3s;
}

.main-nav-sidebar .category-items li a:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: var(--color-white);
}

.main-nav-sidebar .category-items li a.active {
  background-color: var(--color-primary) !important;
  color: var(--color-white) !important;
  font-weight: var(--font-weight-semibold);
  border-left: 4px solid var(--color-primary-hover);
}

.settings-nav-sidebar {
  background-color: var(--color-gray-800);
  color: var(--color-border-light);
  padding: 20px;
}

.settings-nav-sidebar .settings-header {
  margin-bottom: 24px;
}

.settings-nav-sidebar .settings-header a {
  font-size: 1.25rem;
  color: var(--color-border-light);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 12px;
}

.settings-nav-sidebar .settings-header a:hover {
  color: var(--color-white);
}

.settings-nav-sidebar .menu-item {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  color: var(--color-sidebar-text-muted);
  text-decoration: none;
  border-radius: 4px;
  font-size: 0.95rem;
  gap: 12px;
  transition: all 0.3s;
  margin-bottom: 4px;
}

.settings-nav-sidebar .menu-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: var(--color-white);
}

.settings-nav-sidebar .menu-item.active {
  background-color: var(--color-primary) !important;
  color: var(--color-white) !important;
  font-weight: 600;
  border-left: 4px solid var(--color-primary-hover);
}

/* ========================================
   2. TREE COMPONENTS
   ======================================== */
.tree-demo {
  --tree-indent: 1.25rem;
  --tree-hover-bg: var(--color-surface-hover);
}

.tree-node {
  margin-bottom: 2px;
}

.tree-node-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  cursor: pointer;
  user-select: none;
  transition: background 0.15s ease;
  border-radius: var(--border-radius-sm);
  font-size: 0.9rem;
}

.tree-node-header:hover {
  background: var(--color-surface-hover);
}

.tree-node-header:active {
  background: var(--color-surface-active);
}

.tree-node-header .expand-icon {
  width: 0.75rem;
  font-size: 0.625rem;
  color: var(--color-text-secondary);
  cursor: pointer;
  flex-shrink: 0;
}

.tree-node-header .node-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.tree-node-header .node-label {
  flex: 1;
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tree-node-actions {
  display: flex;
  gap: var(--spacing-xs);
  opacity: 0;
  transition: opacity 0.15s;
}

.tree-node-header:hover .tree-node-actions {
  opacity: 1;
}

.tree-action-btn {
  background: none;
  border: none;
  padding: var(--spacing-xs);
  cursor: pointer;
  font-size: 0.8rem;
  border-radius: var(--border-radius-sm);
  color: var(--color-text-secondary);
  transition: background 0.15s;
}

.tree-action-btn:hover {
  background: var(--color-surface-variant);
  color: var(--color-text-primary);
}

.tree-children {
  padding-left: var(--tree-indent);
}

/* ========================================
   3. COURSE EDITOR NODES
   ======================================== */
.course-nodes-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.course-node {
  border: 2px solid;
  border-radius: 8px;
  padding: 0.75rem;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s;
  position: relative;
}

.course-node:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.course-node.node-course {
  border-color: var(--course-node-course);
  background: var(--course-node-course-bg);
}

.course-node.node-chapter {
  border-color: var(--course-node-chapter);
  background: var(--course-node-chapter-bg);
}

.course-node.node-section {
  border-color: var(--course-node-section);
  background: var(--course-node-section-bg);
}

.course-node.node-page {
  border-color: var(--course-node-page);
  background: var(--course-node-page-bg);
}

.course-node .node-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.course-node .node-head .icon { font-size: 1rem; }
.course-node .node-head .title {
  font-weight: 600;
  font-size: 0.75rem;
  color: var(--color-text-primary);
}

.course-node .node-actions-bar {
  display: flex;
  gap: 4px;
  padding-top: 0.5rem;
  border-top: 1px solid var(--color-border-light);
}

.course-node .action-btn {
  flex: 1;
  background: var(--color-surface);
  border: 1px solid var(--color-border-light);
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.7rem;
  text-align: center;
  transition: all 0.15s;
  color: var(--color-text-secondary);
}

.course-node .action-btn:hover {
  background: var(--color-surface-hover);
}

.course-node .action-btn.delete:hover {
  background: var(--color-danger-bg);
  border-color: var(--color-danger);
}

/* Node Library Panel */
.node-library {
  background: var(--color-surface);
  border-radius: 8px;
  border: 1px solid var(--color-border-light);
  overflow: hidden;
}

.node-library-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border-light);
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--color-text-primary);
}

.node-library-items {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.node-library-item {
  cursor: grab;
  border-radius: 8px;
  transition: all 0.2s;
}

.node-library-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.node-library-preview {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.8rem;
  border: 2px solid;
  border-radius: 8px;
}

.node-library-preview.lib-course {
  border-color: var(--course-node-course);
  background: var(--course-node-course-bg);
}

.node-library-preview.lib-chapter {
  border-color: var(--course-node-chapter);
  background: var(--course-node-chapter-bg);
}

.node-library-preview.lib-section {
  border-color: var(--course-node-section);
  background: var(--course-node-section-bg);
}

.node-library-preview.lib-page {
  border-color: var(--course-node-page);
  background: var(--course-node-page-bg);
}

.node-library-preview .lib-label {
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--color-text-primary);
}

/* ========================================
   4. TERMINAL COMPONENTS
   ======================================== */
.terminal-wrapper-demo {
  min-height: 200px;
  background-color: var(--terminal-bg);
  border: 2px solid var(--terminal-border);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  font-family: var(--font-family-monospace);
  padding: 16px;
  color: var(--terminal-fg);
  font-size: 0.85rem;
  line-height: 1.6;
}

.terminal-wrapper-demo .prompt .user { color: #6a9955; }
.terminal-wrapper-demo .prompt .path { color: #569cd6; }
.terminal-wrapper-demo .prompt .dollar { color: #d4d4d4; }

.cursor-blink {
  border-right: 2px solid var(--terminal-cursor);
  animation: blink 1s step-end infinite;
}

.terminal-error-demo {
  background-color: var(--color-bg-dark);
  border-radius: var(--border-radius-md);
  padding: 24px;
  text-align: center;
}

.terminal-error-demo h2 {
  color: var(--terminal-fg);
  margin: 12px 0;
  font-size: 1.1rem;
}

.terminal-error-demo p {
  color: var(--terminal-fg);
  font-size: 0.9rem;
  line-height: 1.5;
}

.terminal-error-demo code {
  background-color: var(--terminal-bg);
  padding: 4px 8px;
  border-radius: 4px;
  color: var(--color-info);
  font-family: var(--font-family-monospace);
  font-size: 0.85rem;
}

.code-example-demo pre {
  background: var(--terminal-bg);
  color: var(--terminal-fg);
  padding: 15px;
  border-radius: 6px;
  overflow-x: auto;
  font-family: var(--font-family-monospace);
  font-size: 0.85rem;
  line-height: 1.5;
}

/* Badges */
.badge-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.badge {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.badge.read {
  background-color: var(--color-info-bg);
  color: var(--color-info-text);
  border: 1px solid var(--color-info-border);
}

.badge.write {
  background-color: var(--color-success-bg);
  color: var(--color-success-text);
  border: 1px solid var(--color-success-border);
}

.badge.owner {
  background-color: var(--color-gray-200);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-light);
}

.badge.warning {
  background-color: var(--color-warning-bg);
  color: var(--color-warning-text);
  border: 1px solid var(--color-warning-border);
}

.badge.danger {
  background-color: var(--color-danger-bg);
  color: var(--color-danger-text);
  border: 1px solid var(--color-danger-border);
}

/* ========================================
   5. USER SETTINGS MENU
   ======================================== */
.user-settings-demo {
  background-color: var(--color-gray-800);
  color: var(--color-border-light);
  border-radius: 8px;
  overflow: hidden;
  width: 100%;
}

.user-settings-demo .us-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-gray-700);
  background-color: var(--color-sidebar-bg);
}

.user-settings-demo .us-header h2 {
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
}

.user-settings-demo .us-close {
  background: none;
  border: none;
  color: var(--color-border-light);
  font-size: 1.2rem;
  cursor: pointer;
}

.user-settings-demo .us-close:hover { color: var(--color-white); }

.user-settings-demo .us-section {
  margin: 8px 10px;
}

.user-settings-demo .us-cat-header {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  color: var(--color-border-light);
  background-color: var(--color-gray-700);
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  gap: 10px;
  transition: background-color 0.3s;
}

.user-settings-demo .us-cat-header:hover {
  background-color: var(--color-secondary-hover);
}

/* ========================================
   6. SURFACE STATES
   ======================================== */
.surface-states {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.surface-state-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 0.85rem;
  border: 1px solid var(--color-border-light);
}

.surface-state-item .swatch {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  border: 1px solid var(--color-border-medium);
  flex-shrink: 0;
}

.surface-state-item .info {
  flex: 1;
}

.surface-state-item .var-name {
  font-family: var(--font-family-monospace);
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

/* Course Tree Node */
.course-tree-demo .ct-node {
  padding: 6px 10px;
  border-radius: 4px;
  margin-bottom: 2px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.15s;
}

.course-tree-demo .ct-node:hover {
  background: var(--color-surface-hover);
}

.course-tree-demo .ct-node.ct-course {
  font-weight: 600;
  border-left: 3px solid var(--course-node-course);
  background: var(--course-node-course-bg);
}

.course-tree-demo .ct-node.ct-chapter {
  font-weight: 500;
  border-left: 3px solid var(--course-node-chapter);
  background: var(--course-node-chapter-bg);
  margin-left: 16px;
}

.course-tree-demo .ct-node.ct-section {
  border-left: 3px solid var(--course-node-section);
  background: var(--course-node-section-bg);
  margin-left: 32px;
}

.course-tree-demo .ct-node.ct-page {
  border-left: 3px solid var(--course-node-page);
  background: var(--course-node-page-bg);
  margin-left: 48px;
}

@keyframes blink {
  50% { border-color: transparent; }
}

@media (max-width: 1024px) {
  .audit-content {
    grid-template-columns: 1fr;
  }
  .sidebar-demo {
    flex-direction: column;
  }
  .sidebar-panel { width: 100%; min-height: 300px; }
}
</style>
