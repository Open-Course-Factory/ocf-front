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
  