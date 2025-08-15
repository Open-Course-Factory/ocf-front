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

    const subEntitiesStores = new Map<string, any>([
    ])

    const parentEntitiesStores = new Map<string, any>([])

  
    return { entities, getEntities, selectDatas, getSelectDatas, subEntitiesStores, parentEntitiesStores};
};
  