import { reactive, ref } from 'vue'
import axios from 'axios'
import { useStoreTranslations } from '../composables/useTranslations'
import { isDemoMode, logDemoAction, simulateDelay } from '../services/demo'
import { createAsyncWrapper } from '../utils/asyncWrapper'

export const useBaseStore = () => {
    // Add common translations (shared by all entities)
    useStoreTranslations({
        en: {
            common: {
                yes: 'Yes',
                no: 'No',
                active: 'Active',
                inactive: 'Inactive',
                expired: 'Expired',
                full: 'Full',
                noItems: 'No items',
                notLoaded: 'Not loaded',
                loadItems: 'Load items',
                loading: 'Loading...',
                course: 'Course',
                chapter: 'Chapter',
                section: 'Section',
            },
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
            },
            emptyStates: {
                terminals: {
                    title: 'No terminals yet',
                    description: 'Create your first terminal to get started with remote access. Terminals provide secure SSH access to your virtual machines.',
                    action: 'Create Terminal'
                },
                groups: {
                    title: 'No groups yet',
                    description: 'Groups help you organize and share resources with team members. Create your first group to start collaborating.',
                    action: 'Create Group'
                },
                sshKeys: {
                    title: 'No SSH keys yet',
                    description: 'SSH keys provide secure authentication for your terminals. Add an SSH key to enhance security.',
                    action: 'Add SSH Key'
                },
                themes: {
                    title: 'No themes yet',
                    description: 'Customize your terminal appearance with themes. Create your first theme to personalize your experience.',
                    action: 'Create Theme'
                },
                invoices: {
                    title: 'No invoices yet',
                    description: 'Your invoices will appear here once you have billing activity. Invoices are generated automatically for your subscriptions.',
                    action: 'View Plans'
                },
                paymentMethods: {
                    title: 'No payment methods yet',
                    description: 'Add a payment method to subscribe to plans and manage your billing. Your payment information is securely stored with Stripe.',
                    action: 'Add Payment Method'
                },
                default: {
                    title: 'No items yet',
                    description: 'Get started by creating your first item.',
                    action: 'Create Item'
                }
            }
        },
        fr: {
            common: {
                yes: 'Oui',
                no: 'Non',
                active: 'Actif',
                inactive: 'Inactif',
                expired: 'Expiré',
                full: 'Complet',
                noItems: 'Aucun élément',
                notLoaded: 'Non chargé',
                loadItems: 'Charger les éléments',
                loading: 'Chargement...',
                course: 'Cours',
                chapter: 'Chapitre',
                section: 'Section',
            },
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
            },
            emptyStates: {
                terminals: {
                    title: 'Aucun terminal pour le moment',
                    description: 'Créez votre premier terminal pour commencer avec l\'accès à distance. Les terminaux fournissent un accès SSH sécurisé à vos machines virtuelles.',
                    action: 'Créer un terminal'
                },
                groups: {
                    title: 'Aucun groupe pour le moment',
                    description: 'Les groupes vous aident à organiser et partager des ressources avec les membres de l\'équipe. Créez votre premier groupe pour commencer à collaborer.',
                    action: 'Créer un groupe'
                },
                sshKeys: {
                    title: 'Aucune clé SSH pour le moment',
                    description: 'Les clés SSH fournissent une authentification sécurisée pour vos terminaux. Ajoutez une clé SSH pour renforcer la sécurité.',
                    action: 'Ajouter une clé SSH'
                },
                themes: {
                    title: 'Aucun thème pour le moment',
                    description: 'Personnalisez l\'apparence de votre terminal avec des thèmes. Créez votre premier thème pour personnaliser votre expérience.',
                    action: 'Créer un thème'
                },
                invoices: {
                    title: 'Aucune facture pour le moment',
                    description: 'Vos factures apparaîtront ici une fois que vous aurez une activité de facturation. Les factures sont générées automatiquement pour vos abonnements.',
                    action: 'Voir les plans'
                },
                paymentMethods: {
                    title: 'Aucun moyen de paiement pour le moment',
                    description: 'Ajoutez un moyen de paiement pour souscrire à des plans et gérer votre facturation. Vos informations de paiement sont stockées de manière sécurisée avec Stripe.',
                    action: 'Ajouter un moyen de paiement'
                },
                default: {
                    title: 'Aucun élément pour le moment',
                    description: 'Commencez par créer votre premier élément.',
                    action: 'Créer un élément'
                }
            }
        }
    });

    let entities = reactive([])
    let selectDatas = reactive([])

    // Loading and error states
    const isLoading = ref(false)
    const error = ref('')
    const lastLoaded = ref(null as Date | null)

    // Create async wrapper with store state
    const withAsync = createAsyncWrapper({ isLoading, error })

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

    // Configuration for API include parameters (reactive)
    const includeParams = reactive({
        children: [] as string[], // Child entities to include (e.g., ['chapters', 'sections'])
        parents: [] as string[],  // Parent entities to include (e.g., ['courses', 'chapters'])
    })

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
        return withAsync(async () => {
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
        }, 'errors.loadData', {
            onError: () => {
                logDemoAction(`Error loading data: ${error.value}`)
            }
        })
    }

    // Cursor-based pagination methods
    const loadEntitiesWithCursor = async (endpoint: string, cursor?: string, limit: number = 20, filters: Record<string, string> = {}, demoDataProvider?: () => any[]) => {
        return withAsync(async () => {
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

                // Add include parameter for nested data from store configuration
                const includeList = [...includeParams.children, ...includeParams.parents]
                if (includeList.length > 0) {
                    params.append('include', includeList.join(','))
                }

                // Add filter parameters
                Object.entries(filters).forEach(([key, value]) => {
                    if (value && value !== '') {
                        params.append(key, value)
                    }
                })

                const fullUrl = `${endpoint}?${params}`
                console.log(`[BaseStore LIST] Loading: ${fullUrl}`)
                logDemoAction(`Loading real data with cursor from ${endpoint}`)
                response = await axios.get(fullUrl)
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
        }, 'errors.loadData', {
            onError: () => {
                logDemoAction(`Error loading data with cursor: ${error.value}`)
            }
        })
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
        return withAsync(async () => {
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
        }, 'errors.createEntity')
    }

    const updateEntity = async (endpoint: string, entityId: string, entityData: any) => {
        return withAsync(async () => {
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
                response = await axios.patch(`${endpoint}/${entityId}`, processedData)
            }

            // Update in local entities
            const index = entities.findIndex((e: any) => e.id === entityId)
            if (index !== -1) {
                entities[index] = response.data
            }

            await executeAfterUpdateHook(response.data, entityData)

            return response.data
        }, 'errors.updateEntity')
    }

    const deleteEntity = async (endpoint: string, entityId: string) => {
        return withAsync(async () => {
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
        }, 'errors.deleteEntity')
    }

    const getOne = async (endpoint: string, entityId: string, demoDataProvider?: () => any[]) => {
        return withAsync(async () => {
            let data: any

            if (isDemoMode() && demoDataProvider) {
                logDemoAction(`Loading demo entity ${entityId} from ${endpoint}`)
                await simulateDelay(800)
                // Find entity in demo data
                const allData = demoDataProvider()
                data = allData.find((e: any) => e.id === entityId)
                if (!data) {
                    throw new Error(`Entity ${entityId} not found`)
                }
            } else {
                logDemoAction(`Loading real entity ${entityId} from ${endpoint}`)
                const response = await axios.get(`${endpoint}/${entityId}`)
                data = response.data
            }

            return data
        }, 'errors.loadEntity', {
            onError: () => {
                logDemoAction(`Error loading entity ${entityId}: ${error.value}`)
            }
        })
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
        includeParams,

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
        deleteEntity,
        getOne
    }
}