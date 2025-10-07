import { reactive, ref } from 'vue'
import axios from 'axios'
import { useI18n } from 'vue-i18n'
import { isDemoMode, logDemoAction, simulateDelay } from '../services/demoConfig'

export const useBaseStore = () => {
    // Add pagination translations (shared by all entities)
    useI18n().mergeLocaleMessage('en', {
        pagination: {
            showing: 'Showing',
            of: 'of',
            results: 'results',
            page: 'Page',
            previous: 'Previous',
            next: 'Next',
            itemsPerPage: 'Items per page:',
            filteredResults: 'Filtered results:',
            totalItems: 'total items found',
            noResults: 'No results match the current filters',
            empty: 'No items to display',
            navigatingTo: 'Navigating to page',
            clickToJump: 'Click to jump to page',
            invalidPage: 'Please enter a valid page number',
            pageNotExist: 'doesn\'t exist. Maximum page is',
            go: 'Go'
        }
    });

    useI18n().mergeLocaleMessage('fr', {
        pagination: {
            showing: 'Affichage',
            of: 'de',
            results: 'résultats',
            page: 'Page',
            previous: 'Précédent',
            next: 'Suivant',
            itemsPerPage: 'Éléments par page :',
            filteredResults: 'Résultats filtrés :',
            totalItems: 'éléments trouvés au total',
            noResults: 'Aucun résultat ne correspond aux filtres actuels',
            empty: 'Aucun élément à afficher',
            navigatingTo: 'Navigation vers la page',
            clickToJump: 'Cliquez pour aller à la page',
            invalidPage: 'Veuillez saisir un numéro de page valide',
            pageNotExist: 'n\'existe pas. La page maximum est',
            go: 'Aller'
        }
    });

    let entities = reactive([])
    let selectDatas = reactive([])

    // Loading and error states
    const isLoading = ref(false)
    const error = ref('')
    const lastLoaded = ref(null as Date | null)

    // Prevent deletion of last object (configurable per store)
    const preventLastObjectDeletion = ref(false)

    function getEntities() {
        return entities
    }

    function getSelectDatas(inputEntities: any) {
        let res = []
        if (inputEntities.length > 0) {
            inputEntities.forEach( (value) => {
                let name = ""
                // Try multiple possible display name fields in order of preference
                if (value.title) {
                    name = value.title
                } else if (value.name) {
                    name = value.name
                } else if (value.Username) {
                    name = value.Username
                } else if (value.label) {
                    name = value.label
                } else {
                    // Fallback to ID if no display name is found
                    name = value.id
                }
                res.push({ text: name, value: value.id})
            })
        }

        return res
    }

    const subEntitiesStores = new Map<string, any>([])
    const parentEntitiesStores = new Map<string, any>([])

    // Système de hooks pour les actions spécifiques aux entités
    const hooks = {
        afterCreate: null as ((entity: any, originalData: any) => Promise<void>) | null,
        beforeCreate: null as ((data: any) => Promise<any>) | null,
        beforeUpdate: null as ((data: any) => Promise<any>) | null,
        afterUpdate: null as ((entity: any, originalData: any) => Promise<void>) | null,
        afterDelete: null as ((entityId: string) => Promise<void>) | null,
    }

    // Méthodes pour définir les hooks
    const setAfterCreateHook = (hook: (entity: any, originalData: any) => Promise<void>) => {
        hooks.afterCreate = hook
    }

    const setBeforeCreateHook = (hook: (data: any) => Promise<any>) => {
        hooks.beforeCreate = hook
    }

    const setBeforeUpdateHook = (hook: (data: any) => Promise<any>) => {
        hooks.beforeUpdate = hook
    }

    const setAfterUpdateHook = (hook: (entity: any, originalData: any) => Promise<void>) => {
        hooks.afterUpdate = hook
    }

    const setAfterDeleteHook = (hook: (entityId: string) => Promise<void>) => {
        hooks.afterDelete = hook
    }

    // Méthodes pour exécuter les hooks
    const executeAfterCreateHook = async (entity: any, originalData: any) => {
        if (hooks.afterCreate) {
            await hooks.afterCreate(entity, originalData)
        }
    }

    const executeBeforeCreateHook = async (data: any) => {
        if (hooks.beforeCreate) {
            return await hooks.beforeCreate(data)
        }
        return data
    }

    const executeBeforeUpdateHook = async (data: any) => {
        if (hooks.beforeUpdate) {
            return await hooks.beforeUpdate(data)
        }
        return data
    }

    const executeAfterUpdateHook = async (entity: any, originalData: any) => {
        if (hooks.afterUpdate) {
            await hooks.afterUpdate(entity, originalData)
        }
    }

    const executeAfterDeleteHook = async (entityId: string) => {
        if (hooks.afterDelete) {
            await hooks.afterDelete(entityId)
        }
    }

    // API Loading Methods
    const loadEntities = async (endpoint: string, demoDataProvider?: () => any[]) => {
        isLoading.value = true
        error.value = ''

        try {
            let data: any[]

            if (isDemoMode() && demoDataProvider) {
                logDemoAction(`Loading demo data for ${endpoint}`)
                await simulateDelay(1500) // Simulate API delay
                data = demoDataProvider()
            } else {
                logDemoAction(`Loading real data from ${endpoint}`)
                const response = await axios.get(endpoint)
                // Handle both direct array responses and paginated responses
                data = response.data?.data || response.data || []
            }

            // Ensure data is an array before spreading
            if (!Array.isArray(data)) {
                console.warn('Expected array but got:', typeof data, data)
                data = []
            }

            // Clear current entities and add new ones
            entities.splice(0, entities.length, ...data)
            lastLoaded.value = new Date()

            return data
        } catch (err: any) {
            error.value = err.response?.data?.error_message || err.message || 'Error loading data'
            logDemoAction(`Error loading data: ${error.value}`)
            throw err
        } finally {
            isLoading.value = false
        }
    }

    // Cursor-based pagination methods
    const loadEntitiesWithCursor = async (endpoint: string, cursor?: string, limit: number = 20, filters: Record<string, string> = {}, demoDataProvider?: () => any[]) => {
        isLoading.value = true
        error.value = ''

        try {
            let response: any

            if (isDemoMode() && demoDataProvider) {
                logDemoAction(`Loading demo data with cursor for ${endpoint}`)
                await simulateDelay(1500)

                const allData = demoDataProvider()

                // Parse cursor to get startIndex (for demo mode only)
                let startIndex = 0;
                if (cursor) {
                    try {
                        const decodedCursor = atob(cursor);
                        // Handle both old format (just numbers) and new format (demo_123_timestamp)
                        if (decodedCursor.startsWith('demo_')) {
                            const parts = decodedCursor.split('_');
                            startIndex = parseInt(parts[1]) || 0;
                        } else {
                            // Legacy numeric cursor
                            startIndex = parseInt(decodedCursor) || 0;
                        }
                    } catch {
                        console.warn('Invalid demo cursor, starting from 0');
                        startIndex = 0;
                    }
                }

                const endIndex = Math.min(startIndex + limit, allData.length)
                const data = allData.slice(startIndex, endIndex)

                // Generate realistic-looking cursor for demo (but still functional)
                const nextCursor = endIndex < allData.length
                    ? btoa(`demo_${endIndex}_${Date.now()}`) // More realistic demo cursor
                    : null;

                response = {
                    data: {
                        data,
                        nextCursor,
                        hasMore: endIndex < allData.length,
                        total: allData.length
                    }
                }
            } else {
                const params = new URLSearchParams()
                params.append('cursor', cursor || '') // ✅ Always include cursor param, even if empty
                params.append('limit', limit.toString())

                // Add filter parameters
                Object.entries(filters).forEach(([key, value]) => {
                    if (value && value !== '') {
                        params.append(key, value)
                    }
                })

                logDemoAction(`Loading real data with cursor from ${endpoint}`)
                response = await axios.get(`${endpoint}?${params}`)
            }

            const result = response.data?.data || response.data || []
            const nextCursor = response.data?.nextCursor || null
            const hasMore = response.data?.hasMore || false
            const total = response.data?.total ?? (hasMore ? Math.max(result.length * 10, 100) : result.length)

            // For cursor pagination with page navigation, replace data (don't append)
            entities.splice(0, entities.length, ...result)

            lastLoaded.value = new Date()

            return {
                data: result,
                nextCursor,
                hasMore,
                total
            }
        } catch (err: any) {
            error.value = err.response?.data?.error_message || err.message || 'Error loading data'
            logDemoAction(`Error loading data with cursor: ${error.value}`)
            throw err
        } finally {
            isLoading.value = false
        }
    }

    const refreshEntities = async (endpoint: string, demoDataProvider?: () => any[]) => {
        return await loadEntities(endpoint, demoDataProvider)
    }

    const clearEntities = () => {
        entities.splice(0, entities.length)
        error.value = ''
        lastLoaded.value = null
    }

    // Generic CRUD operations
    const createEntity = async (endpoint: string, entityData: any) => {
        isLoading.value = true
        error.value = ''

        try {
            const processedData = await executeBeforeCreateHook(entityData)

            let response: any

            if (isDemoMode()) {
                logDemoAction(`Creating demo entity at ${endpoint}`, processedData)
                await simulateDelay(1000)
                // Mock response for demo mode
                response = {
                    data: {
                        id: `demo_${Date.now()}`,
                        ...processedData,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }
                }
            } else {
                response = await axios.post(endpoint, processedData)
            }

            // Add to local entities
            entities.push(response.data)

            await executeAfterCreateHook(response.data, entityData)

            return response.data
        } catch (err: any) {
            error.value = err.response?.data?.error_message || err.message || 'Error creating entity'
            throw err
        } finally {
            isLoading.value = false
        }
    }

    const updateEntity = async (endpoint: string, entityId: string, entityData: any) => {
        isLoading.value = true
        error.value = ''

        try {
            // Process data through before update hook
            const processedData = await executeBeforeUpdateHook(entityData)

            let response: any

            if (isDemoMode()) {
                logDemoAction(`Updating demo entity ${entityId} at ${endpoint}`, processedData)
                await simulateDelay(800)
                // Mock response for demo mode
                response = {
                    data: {
                        id: entityId,
                        ...processedData,
                        updated_at: new Date().toISOString()
                    }
                }
            } else {
                response = await axios.put(`${endpoint}/${entityId}`, processedData)
            }

            // Update in local entities
            const index = entities.findIndex((e: any) => e.id === entityId)
            if (index !== -1) {
                entities[index] = response.data
            }

            await executeAfterUpdateHook(response.data, entityData)

            return response.data
        } catch (err: any) {
            error.value = err.response?.data?.error_message || err.message || 'Error updating entity'
            throw err
        } finally {
            isLoading.value = false
        }
    }

    const deleteEntity = async (endpoint: string, entityId: string) => {
        isLoading.value = true
        error.value = ''

        try {
            if (isDemoMode()) {
                logDemoAction(`Deleting demo entity ${entityId} at ${endpoint}`)
                await simulateDelay(600)
            } else {
                await axios.delete(`${endpoint}/${entityId}`)
            }

            // Remove from local entities
            const index = entities.findIndex((e: any) => e.id === entityId)
            if (index !== -1) {
                entities.splice(index, 1)
            }

            await executeAfterDeleteHook(entityId)

            return true
        } catch (err: any) {
            error.value = err.response?.data?.error_message || err.message || 'Error deleting entity'
            throw err
        } finally {
            isLoading.value = false
        }
    }

    return {
        // Original exports
        entities,
        getEntities,
        selectDatas,
        getSelectDatas,
        subEntitiesStores,
        parentEntitiesStores,

        // Configuration options
        preventLastObjectDeletion,

        // Hook methods
        setAfterCreateHook,
        setBeforeCreateHook,
        setBeforeUpdateHook,
        setAfterUpdateHook,
        setAfterDeleteHook,
        executeAfterCreateHook,
        executeBeforeCreateHook,
        executeBeforeUpdateHook,
        executeAfterUpdateHook,
        executeAfterDeleteHook,

        // New API loading methods
        isLoading,
        error,
        lastLoaded,
        loadEntities,
        loadEntitiesWithCursor,
        refreshEntities,
        clearEntities,
        createEntity,
        updateEntity,
        deleteEntity
    }
}