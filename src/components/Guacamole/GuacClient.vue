<template>
  <div class="viewport" ref="viewport">
    <!-- tabindex allows for div to be focused -->
    <div ref="displayRef" class="display" tabindex="0" />
  </div>
</template>

<script>
import { ref, onMounted, nextTick } from 'vue'
import Guacamole from 'guacamole-common-js'
import GuacMouse from '../../assets/guacamole/GuacMouse.js'
import states from '../../assets/guacamole/states.js'
// import clipboard from '@/lib/clipboard'

Guacamole.Mouse = GuacMouse.mouse

const wsUrl = 'ws://100.95.139.26/websocket-tunnel'
const httpUrl = 'http://100.95.139.26/tunnel'

export default {
  props: {
    query: {
      type: String,
      required: true
    },
    forceHttp: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  setup(props) {
    const connected = ref(false)
    const display = ref(null)
    const client = ref(null)
    const keyboard = ref(null)
    const mouse = ref(null)
    const connectionState = ref(states.IDLE)
    const errorMessage = ref('')
    const args = ref({})
    const viewport = ref(null)
    const displayRef = ref(null)


    // const send = (cmd) => {
    //   if (!client.value) {
    //     return
    //   }
    //   for (const c of cmd.data) {
    //     client.value.sendKeyEvent(1, c.charCodeAt(0))
    //   }
    // }

    // const copy = (cmd) => {
    //   if (!client.value) {
    //     return
    //   }
    //   clipboard.cache = {
    //     type: 'text/plain',
    //     data: cmd.data
    //   }
    //   clipboard.setRemoteClipboard(client.value)
    // }

    const handleMouseState = (mouseState) => {
      const scaledMouseState = Object.assign({}, mouseState, {
        x: mouseState.x / display.value.getScale(),
        y: mouseState.y / display.value.getScale(),
      })
      client.value.sendMouseState(scaledMouseState)
    }

    const resize = () => {
      const elm = viewport.value
      if (!elm || !elm.offsetWidth) {
        return
      }

      let pixelDensity = window.devicePixelRatio || 1
      const width = elm.clientWidth * pixelDensity
      const height = elm.clientHeight * pixelDensity
      if (display.value.getWidth() !== width || display.value.getHeight() !== height) {
        client.value.sendSize(width, height)
      }
      setTimeout(() => {
        const scale = Math.min(
          elm.clientWidth / Math.max(display.value.getWidth(), 1),
          elm.clientHeight / Math.max(display.value.getHeight(), 1)
        )
        display.value.scale(scale)
      }, 100)
    }

    const connect = async (query) => {
      let tunnel

      if (window.WebSocket && !props.forceHttp) {
        tunnel = new Guacamole.WebSocketTunnel(wsUrl)
      } else {
        tunnel = new Guacamole.HTTPTunnel(httpUrl, true)
      }

      if (client.value) {
        display.value.scale(0)
        uninstallKeyboard()
      }

      client.value = new Guacamole.Client(tunnel)
      // clipboard.install(client.value)

      tunnel.onerror = status => {
        // eslint-disable-next-line no-console
        console.error(`Tunnel failed ${JSON.stringify(status)}`)
        connectionState.value = states.TUNNEL_ERROR
      }

      tunnel.onstatechange = state => {
        switch (state) {
          case Guacamole.Tunnel.State.CONNECTING:
            connectionState.value = states.CONNECTING
            break
          case Guacamole.Tunnel.State.OPEN:
            connectionState.value = states.CONNECTED
            break
          case Guacamole.Tunnel.State.UNSTABLE:
            break
          case Guacamole.Tunnel.State.CLOSED:
            connectionState.value = states.DISCONNECTED
            break
        }
      }

      client.value.onstatechange = clientState => {
        switch (clientState) {
          case 0:
            connectionState.value = states.IDLE
            break
          case 1:
            break
          case 2:
            connectionState.value = states.WAITING
            break
          case 3:
            connectionState.value = states.CONNECTED
            window.addEventListener('resize', resize)
            viewport.value.addEventListener('mouseenter', resize)
            // clipboard.setRemoteClipboard(client.value)
            break
          case 4:
          case 5:
            break
        }
      }

      client.value.onerror = error => {
        client.value.disconnect()
        // eslint-disable-next-line no-console
        console.error(`Client error ${JSON.stringify(error)}`)
        errorMessage.value = error.message
        connectionState.value = states.CLIENT_ERROR
      }

      client.value.onsync = () => {}

      client.value.onargv = (stream, mimetype, name) => {
        if (mimetype !== 'text/plain') return

        const reader = new Guacamole.StringReader(stream)
        let value = ''
        reader.ontext = text => {
          value += text
        }
        reader.onend = () => {
          const stream = client.value.createArgumentValueStream('text/plain', name)
          stream.onack = status => {
            if (status.isError()) return
            args.value[name] = value
          }
        }
      }

      // client.value.onclipboard = clipboard.onClipboard
      display.value = client.value.getDisplay()
      await nextTick()
      const displayElm = displayRef.value
      displayElm.appendChild(display.value.getElement())
      displayElm.addEventListener('contextmenu', e => {
        e.stopPropagation()
        e.preventDefault()
        e.returnValue = false
      })
      client.value.connect(query)
      window.onunload = () => client.value.disconnect()

      mouse.value = new Guacamole.Mouse(displayElm)
      mouse.value.onmouseout = () => {
        if (!display.value) return
        display.value.showCursor(false)
      }

      displayElm.onclick = () => displayElm.focus()
      displayElm.onfocus = () => displayElm.className = 'focus'
      displayElm.onblur = () => displayElm.className = ''

      keyboard.value = new Guacamole.Keyboard(displayElm)
      installKeyboard()
      mouse.value.onmousedown = mouse.value.onmouseup = mouse.value.onmousemove = handleMouseState
      setTimeout(() => {
        resize()
        displayElm.focus()
      }, 1000)
    }

    const installKeyboard = () => {
      keyboard.value.onkeydown = keysym => client.value.sendKeyEvent(1, keysym)
      keyboard.value.onkeyup = keysym => client.value.sendKeyEvent(0, keysym)
    }

    const uninstallKeyboard = () => {
      keyboard.value.onkeydown = keyboard.value.onkeyup = () => {}
    }

    onMounted(() => {
      if (props.query && !connected.value) {
        connected.value = true
        connect(props.query)
      }
    })

    return {
      viewport,
      displayRef,
      connect,
      // send,
      // copy
    }
  }
}
</script>