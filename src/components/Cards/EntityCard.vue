<!-- 
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2024 Solution Libre
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
-->

<script setup lang="ts">
import { Store } from 'pinia';


const props = defineProps<{
  entity: any;
  entityStore: Store;
}>();


function isObject(any) {
  return any instanceof Object
}

</script>

<template>
    <ul>
        <span v-for="entityProperty, index in entity"  >
            <h4  v-if="props.entityStore.fieldList.get(index.toString()) != undefined && props.entityStore.fieldList.get(index.toString()).display && index.toString() == 'name'"> {{ entityProperty }} </h4>
            

            <li v-else-if="props.entityStore.fieldList.get(index.toString()) != undefined && props.entityStore.fieldList.get(index.toString()).display">
                <span v-if="isObject(entityProperty)">
                    <h3>{{ index.toString() }}<br /></h3>
                    <EntityCard :entity=entityProperty :entity-store="props.entityStore.subEntitiesStores.get(index.toString())" />
                </span>
                <span v-else>{{ entityProperty }}</span>
            
            </li>
            
        </span>
    </ul>
          
</template>



<style scoped>
ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

button {
  margin-left: 10px;
}

input {
  margin-right: 10px;
}

.header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
    height: auto;
}

.content {
    width: 95%;
    margin: 30px 42px;
}
</style>
