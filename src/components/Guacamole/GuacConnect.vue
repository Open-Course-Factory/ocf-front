<template>
  <div>
    <GuacContainer v-if="connect" :query="query" :force-http="forceHttp" />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import GuacContainer from './GuacContainer.vue'

export default {
  name: 'GuacConnect',
  components: {
    GuacContainer
  },
  setup() {
    const connect = ref(false)
    const scheme = ref('ssh')
    const hostname = ref('192.168.72.164')
    const port = ref('22')
    const user = ref('ocf')
    const pass = ref('') //0cfP4SS::s3cret&  <- NE PAS ACTIVER LA CO AUTOMATIQUE IMPORTANT
    const ignoreCert = ref(true)
    const security = ref('')
    const forceHttp = ref(true)

    const queryObj = computed(() => ({
      scheme: scheme.value,
      hostname: hostname.value,
      port: port.value,
      'ignore-cert': ignoreCert.value,
      security: security.value,
      username: user.value,
      password: pass.value
    }))

    const query = computed(() => {
      return Object.entries(queryObj.value)
        .filter(([, value]) => value)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&')
    })

    const doConnect = () => {
      if (window.localStorage) {
        window.localStorage.setItem('query', JSON.stringify(queryObj.value))
      }
      connect.value = true
    }

    onMounted(() => {
      if (window.localStorage && window.localStorage.getItem('query')) {
        let storedQuery
        try {
          storedQuery = JSON.parse(window.localStorage.getItem('query'))
        } catch (e) {
          window.localStorage.setItem('query', '{}')
          return
        }
        scheme.value = storedQuery.scheme
        hostname.value = storedQuery.hostname
        port.value = storedQuery.port
        ignoreCert.value = storedQuery['ignore-cert']
        security.value = storedQuery.security
        user.value = storedQuery.username
        pass.value = storedQuery.password
      }
      doConnect()
    })

    return {
      connect,
      query,
      forceHttp
    }
  }
}
</script>

<style>

div {
  width: 100%;
  height: 100%;
}

</style>
  