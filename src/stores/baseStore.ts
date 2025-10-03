import { reactive, ref } from 'vue'
import axios from 'axios'
import { isDemoMode, logDemoAction, simulateDelay } from '../services/demoConfig'

export const useBaseStore = () => {
    let entities = reactive([])
    let selectDatas = reactive([])

    // Loading and error states
    const isLoading = ref(false)
    const error = ref('')
    const lastLoaded = ref(null as Date | null)

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
                data = response.data || []
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
        refreshEntities,
        clearEntities,
        createEntity,
        updateEntity,
        deleteEntity
    }
}