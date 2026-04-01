/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 */

import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'

export interface MenuCategoryItem {
  route: string
  label: string
  icon: string
  title?: string
}

export interface MenuCategory {
  key: string
  label: string
  icon: string
  items: MenuCategoryItem[]
  routePrefixes?: string[]
}

export function useMenuCategories(
  categories: () => MenuCategory[],
  options?: {
    isCollapsed?: () => boolean
    menuSelector?: string
  }
) {
  const route = useRoute()
  const expandedCategories = ref<Record<string, boolean>>({})
  const menuPositions = ref<Record<string, { top: number; left: number }>>({})

  function openActiveCategory() {
    const isCollapsed = options?.isCollapsed?.() ?? false
    if (isCollapsed) return

    // Close all first
    Object.keys(expandedCategories.value).forEach(key => {
      expandedCategories.value[key] = false
    })

    // Find and expand the category containing the active route
    for (const category of categories()) {
      const hasActiveItem = category.items.some(item =>
        route.path === item.route || route.path.startsWith(item.route + '/')
      ) || category.routePrefixes?.some(prefix =>
        route.path === prefix || route.path.startsWith(prefix + '/')
      )
      if (hasActiveItem) {
        expandedCategories.value[category.key] = true
        break
      }
    }
  }

  function toggleCategory(key: string, event?: Event) {
    const isCollapsed = options?.isCollapsed?.() ?? false

    if (isCollapsed) {
      // In collapsed mode, close others first
      Object.keys(expandedCategories.value).forEach(k => {
        if (k !== key) expandedCategories.value[k] = false
      })
      // Calculate popup position
      if (event) {
        const target = event.currentTarget as HTMLElement
        const rect = target.getBoundingClientRect()
        menuPositions.value[key] = { top: rect.top, left: rect.right + 5 }
      }
    }

    expandedCategories.value[key] = !expandedCategories.value[key]
  }

  const isCategoryActive = computed(() => {
    const result: Record<string, boolean> = {}
    categories().forEach(category => {
      result[category.key] = category.items.some(item =>
        route.path === item.route || route.path.startsWith(item.route + '/')
      ) || category.routePrefixes?.some(prefix =>
        route.path === prefix || route.path.startsWith(prefix + '/')
      ) || false
    })
    return result
  })

  function handleMenuItemClick() {
    const isCollapsed = options?.isCollapsed?.() ?? false
    if (isCollapsed) {
      Object.keys(expandedCategories.value).forEach(key => {
        expandedCategories.value[key] = false
      })
    }
  }

  function handleOutsideClick(event: Event) {
    const isCollapsed = options?.isCollapsed?.() ?? false
    if (!isCollapsed) return

    const target = event.target as HTMLElement
    const selector = options?.menuSelector || '.nav-menu-shell'
    if (!target.closest(selector)) {
      Object.keys(expandedCategories.value).forEach(key => {
        expandedCategories.value[key] = false
      })
    }
  }

  onMounted(() => {
    openActiveCategory()
    document.addEventListener('click', handleOutsideClick)
  })

  onUnmounted(() => {
    document.removeEventListener('click', handleOutsideClick)
  })

  watch(() => options?.isCollapsed?.(), (isCollapsed) => {
    if (isCollapsed) {
      // Close all submenus when the nav collapses
      Object.keys(expandedCategories.value).forEach(key => {
        expandedCategories.value[key] = false
      })
    } else {
      openActiveCategory()
    }
  })

  watch(() => route.path, () => {
    const isCollapsed = options?.isCollapsed?.() ?? false
    if (!isCollapsed) openActiveCategory()
  })

  return {
    expandedCategories,
    menuPositions,
    toggleCategory,
    isCategoryActive,
    handleMenuItemClick,
    openActiveCategory
  }
}
