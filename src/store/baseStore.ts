import { Ref } from 'vue';
import { useI18n } from 'vue-i18n';

export const useBaseStore = () => {
    const entities = []

    const { t } = useI18n()
      
    function setEntities(entities: any | Ref<any>) {
        this.entities = entities
    }
  
    function getNames(){
        let res = []
        
        this.entities.forEach( (value) => {
            res.push(value.name)
        })
        return res
    }
  
    function getIds(){
        let res = []
        
        this.entities.forEach( (value) => {
            res.push(value.id)
        })
        return res
    }

    const subEntitiesStores = new Map<string, any>([
    ])
  
    return { entities, subEntitiesStores, setEntities, getNames, getIds, t };
};
  