import { reactive } from 'vue';

export const useBaseStore = () => {
    let entities = reactive([])
    let selectDatas = reactive([])
      
    function getEntities() {
        return entities
    }

    function getSelectDatas(inputEntities: any) {
        let res = []
        if (inputEntities.length > 0) {
            inputEntities.forEach( (value) => {
                let name = ""
                if (value.name === undefined) {
                    name = value.Username
                } else {
                    name = value.name
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
  
    return { 
        entities, 
        getEntities, 
        selectDatas, 
        getSelectDatas, 
        subEntitiesStores, 
        parentEntitiesStores,
        setAfterCreateHook,
        setBeforeCreateHook,
        setAfterUpdateHook,
        setAfterDeleteHook,
        executeAfterCreateHook,
        executeBeforeCreateHook,
        executeAfterUpdateHook,
        executeAfterDeleteHook
    };
};