const guacClient = 'http://100.95.139.26:4567'

module.exports = {
    devServer: {
        proxy: {
            '/tunnel': {
                target: guacClient,
                changeOrigin: true,
                ws: false
            },
            '/websocket-tunnel': {
                target: guacClient,
                changeOrigin: true,
                ws: true
            }
        }
    }
}
