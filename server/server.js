const Koa = require('koa')
const Http = require('http')
const Socket = require('socket.io')
const redis = require('redis')

const app = new Koa()
const server = Http.createServer(app.callback())
const io = Socket(server)

const SERVER_HOST = "localhost"
const SERVER_PORT = 8080

const rclient = redis.createClient({
    port      : 6379,
    host      : SERVER_HOST
});

let dictUser = {}

rclient.on('connect', () => console.log('Redis Connected'))
rclient.on('error', e => console.log('REDIS ERROR', e))

// -----------------------------------------------------------------------------------------
rclient.set('i_sillas', JSON.stringify({x:159, y:789, dir: 187, point: 447}))

rclient.get('i_sillas', function(err, reply) {
    console.log( JSON.parse(reply) );
});
// -----------------------------------------------------------------------------------------

io.on('connection', socket => {

    socket.on('join', data => {
        dictUser[ socket.id ] = { user: data.user, sector: data.sector }
        socket.join( data.sector )
        io.to( data.sector ).emit('msg', `${data.user} enteres in this sector`)
    })

    socket.on('data', data => {

        if(data.event === 'mm') {
            let room = dictUser[ socket.id ].sector
            io.to( room ).emit('server', {u: data.user, e:'p', d: data.data}) // broadcast
        }

    })
    
    socket.on('disconnecting', () => {
        let user = dictUser[ socket.id ].user
        io.to( dictUser[ socket.id ].sector ).emit('msg', `${user} deixou o setor.`)
        delete dictUser[ socket.id ]
    });
})

server.listen(SERVER_PORT, SERVER_HOST, () => {
    console.log(`[HTTP] Listen => Server is running att http://${SERVER_HOST}:${SERVER_PORT}`);
})