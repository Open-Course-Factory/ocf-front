import { ref, computed, watch, type Ref, type ComputedRef } from 'vue'

interface UseClientPaginationOptions<T> {
  /** The full list of items to paginate */
  items: Ref<T[]> | ComputedRef<T[]>
  /** Fields to search across (dot notation not supported, top-level keys only) */
  searchFields: (keyof T | string)[]
  /** Items per page (default: 10) */
  pageSize?: number
}

export function useClientPagination<T extends Record<string, any>>({
  items,
  searchFields,
  pageSize = 10
}: UseClientPaginationOptions<T>) {
  const searchQuery = ref('')
  const currentPage = ref(1)

  // Filter items by search query
  const filteredItems = computed(() => {
    const query = searchQuery.value.trim().toLowerCase()
    if (!query) return items.value

    return items.value.filter(item =>
      searchFields.some(field => {
        const value = getNestedValue(item, field as string)
        return value && String(value).toLowerCase().includes(query)
      })
    )
  })

  const totalItems = computed(() => filteredItems.value.length)
  const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / pageSize)))

  // Clamp current page when filtered results change
  watch([filteredItems], () => {
    if (currentPage.value > totalPages.value) {
      currentPage.value = 1
    }
  })

  // Reset to page 1 when search changes
  watch(searchQuery, () => {
    currentPage.value = 1
  })

  const paginatedItems = computed(() => {
    const start = (currentPage.value - 1) * pageSize
    return filteredItems.value.slice(start, start + pageSize)
  })

  const showingFrom = computed(() => {
    if (totalItems.value === 0) return 0
    return (currentPage.value - 1) * pageSize + 1
  })

  const showingTo = computed(() => {
    return Math.min(currentPage.value * pageSize, totalItems.value)
  })

  const hasPrevious = computed(() => currentPage.value > 1)
  const hasNext = computed(() => currentPage.value < totalPages.value)

  const goToPage = (page: number) => {
    currentPage.value = Math.max(1, Math.min(page, totalPages.value))
  }

  const nextPage = () => {
    if (hasNext.value) currentPage.value++
  }

  const previousPage = () => {
    if (hasPrevious.value) currentPage.value--
  }

  return {
    searchQuery,
    currentPage,
    filteredItems,
    paginatedItems,
    totalItems,
    totalPages,
    showingFrom,
    showingTo,
    hasPrevious,
    hasNext,
    goToPage,
    nextPage,
    previousPage
  }
}

/** Access nested object values via dot notation (e.g. 'user.email') */
function getNestedValue(obj: Record<string, any>, path: string): any {
  return path.split('.').reduce((acc, key) => acc?.[key], obj)
}
