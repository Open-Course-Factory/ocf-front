<template>  
    <div class="term1">
        <div ref="terminalBox" style="height: 60vh;"></div>
    </div>
</template>

<script setup>
import '@xterm/xterm/css/xterm.css'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router';
import { useCurrentUserStore } from '../../store/currentUser';

let terminalBox = ref(null)
let term
let socket
const router = useRouter();
const route = useRoute();
const ipaddress  = ref(route.query.ipaddress);
const username = ref(route.query.username);
const password = ref(route.query.password);
const port = ref(route.query.port);

const currentUser = useCurrentUserStore()

onMounted(() => {
    term = new Terminal({
        rendererType: 'canvas', 
        cursorBlink: true,
        cursorStyle: "bar",
    })
    // term.write
    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(terminalBox.value)
    fitAddon.fit()

    term.write('Connection...\r\n');

    let protocol = "wss://"
    if (!import.meta.env.PROD) {
        protocol = "ws://"
    }

    socket = new WebSocket(protocol + location.hostname +  ":8080/api/v1/ssh?Authorization="+ currentUser.secretToken)
    
    socket.binaryType = "arraybuffer";

    socket.onopen = function () {
        fitAddon.fit()
        term.onData(function (data) {
            socket.send(data)
        });
        
        var jsonStr = `{"username":"${username.value}", "ipaddress":"${ipaddress.value}", "port":${port.value}, "password":"${password.value}"}`
        var datMsg = window.btoa(jsonStr)
        socket.send(datMsg)
    }
    socket.onclose = function () {
        term.writeln('Connection closed');
    }
    socket.onerror = function (err) {
        term.writeln('Error：', err);
    }
    // data reception
    socket.onmessage = function (recv) {
        try {
            term.write(recv.data)
        } catch (e) {
            console.log('unsupport data', recv.data)
        }
    }

    window.addEventListener("resize", () => {
        fitAddon.fit()
    }, false)

})


</script>

<style lang="scss" scoped>
.upload {
    min-height: 100px;
}
.term1 {
    margin-left: 60px;
}
.go_out {
    margin-left: -89%;
    margin-top: 20px;
    margin-bottom: 20px;
}
</style>
