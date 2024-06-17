<!-- 
Copyright (C) 2019-2024 Jake Coffman (jake@jakecoffman.com)
Copyright (C) 2024 Solution Libre (contact@solution-libre.fr)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. 
-->

<template>
    <div class="container">
      <GuacClient :query="query" :force-http="forceHttp" />
    </div>
</template>

<script>
import GuacClient from './GuacClient.vue'

export default {
  name: 'GuacContainer',
  components: {
    GuacClient
  },
  props: {
    query: {
      type: String,
      required: true
    },
    forceHttp: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style scoped>
.container {
  width: 1000px;
  height: 800px;
}
</style>
  