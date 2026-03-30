/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.

 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useFeatureFlags } from '../composables/useFeatureFlags'

export interface BilingualText {
  en: string
  fr: string
}

export interface HelpItem {
  route: string
  title: BilingualText
  description: BilingualText
  icon: string
}

export interface HelpSection {
  id: string
  title: BilingualText
  description: BilingualText
  icon: string
  featureFlag?: string
  items: HelpItem[]
}

export const useHelpRegistryStore = defineStore('helpRegistry', () => {
  const sections = ref<HelpSection[]>([])

  function registerSection(section: HelpSection) {
    sections.value.push(section)
  }

  const filteredSections = computed(() => {
    const { isEnabled } = useFeatureFlags()
    return sections.value.filter(section => {
      if (!section.featureFlag) return true
      return isEnabled(section.featureFlag)
    })
  })

  const navItems = computed(() => {
    const items: { route: string; label: BilingualText; title: BilingualText; icon: string; featureFlag?: string }[] = [
      {
        route: '/help',
        label: { en: 'Help & Documentation', fr: 'Aide & Documentation' },
        title: { en: 'Everything you need to get started', fr: 'Tout ce dont vous avez besoin pour demarrer' },
        icon: 'fas fa-book'
      }
    ]

    for (const section of sections.value) {
      if (section.items.length > 0) {
        items.push({
          route: `/help/${section.items[0].route}`,
          label: section.title,
          title: section.description,
          icon: section.icon,
          ...(section.featureFlag ? { featureFlag: section.featureFlag } : {})
        })
      }
    }

    return items
  })

  return {
    sections,
    registerSection,
    filteredSections,
    navItems
  }
})
