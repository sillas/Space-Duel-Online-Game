const Koa = require('koa')
const Http = require('http')
const Socket = require('socket.io')

const app = new Koa()
const server = Http.createServer(app.callback())
const io = Socket(server)

const SERVER_HOST = "localhost"
const SERVER_PORT = 8080

let dictUser = {}

io.on('connection', socket => {
    console.log('[IO] Connection => Server has a new connection');

    socket.on('join.sector', data => {
        dictUser[socket.id] = { user: data['user'], sector: data['sector'] }
        socket.join( data['sector'] )
        console.log( `Explorer "${data['user']}" enteres in "${data['sector']}" sector` )
    })

    socket.on('data.input', data => { // roons ?
        //console.log('[Socket] data.input => ', data);
        /*user = data['user']
        pos = data['data']*/
        let room = dictUser[ socket.id ]['sector']
        io.to( room ).emit('data.server', 'hi') // broadcast the proccessed data
    })
    
    socket.on('disconnecting', () => {
        // const rooms = Object.keys(socket.rooms);
        let user = dictUser[ socket.id ]['user'] 
        delete dictUser[ socket.id ]
        console.log( 'disconnecting:', dictUser );
    });

    socket.on('disconnect', () => console.log('[Socket] Disconnected'))
})

server.listen(SERVER_PORT, SERVER_HOST, () => {
    console.log(`[HTTP] Listen => Server is running att http://${SERVER_HOST}:${SERVER_PORT}`);
    console.log(`[HTTP] Listen => Press CTRL+C to stop it`);
})

// See Socket.Io Broadcast and roons