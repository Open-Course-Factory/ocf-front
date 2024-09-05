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


function isSubEntity(any) {
  let res = false;
  if (any instanceof Object) {
    // if the first key is 0 it means that it is only an array of strings and not an object
    if (any[0] == undefined) {
      res = true;
    } 
  }
  return res
}

function checkDisplayParameters(index) {
  let res = props.entityStore.fieldList.get(`${index.toString()}`) != undefined && props.entityStore.fieldList.get(`${index.toString()}`).display
  res = res || props.entityStore.fieldList.get(`${index.toString()}Id`) != undefined && props.entityStore.fieldList.get(`${index.toString()}Id`).display
  return res
}

</script>



<template>
  <ul>
    <span v-for="entityProperty, index in entity"  >
      <h4  v-if="props.entityStore.fieldList.get(index.toString()) != undefined && props.entityStore.fieldList.get(index.toString()).display && index.toString() == 'name'"> {{ entityProperty }} </h4>
      <li v-else-if="checkDisplayParameters(index)">
        <span v-if="isSubEntity(entityProperty)">
            <h3>{{ index.toString() }}<br /></h3>
            <EntityCard :entity=entityProperty :entity-store="props.entityStore.subEntitiesStores.get(`${index.toString()}Id`)" />
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
