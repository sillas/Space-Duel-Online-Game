const Koa = require('koa')
const Http = require('http')
const Socket = require('socket.io')

const app = new Koa()
const server = Http.createServer(app.callback())
const io = Socket(server)

const SERVER_HOST = "localhost"
const SERVER_PORT = 8080

io.on('connection', socket => {
    console.log('[IO] Connection => Server has a new connection');

    socket.on('data.input', data => {
        console.log('[Socket] data.input => ', data);
    })

    socket.on('disconnect', () => console.log('[Socket] Disconnected'))
})

server.listen(SERVER_PORT, SERVER_HOST, () => {
    console.log(`[HTTP] Listen => Server is running att http://${SERVER_HOST}:${SERVER_PORT}`);
    console.log(`[HTTP] Listen => Press CTRL+C to stop it`);
})

// See Socket.Io Broadcast and roons