const Koa = require('koa')
const Http = require('http')
const Socket = require('socket.io')
const { v4: uuidv4 } = require('uuid')

const app = new Koa()
const server = Http.createServer(app.callback())
const io = Socket(server)

const SERVER_HOST = "localhost"
const SERVER_PORT = 8080

const maxPlayersPerRoom = 6
let currentRoom = uuidv4()
let players = {}
let roons = {}


const addNewRoom = () => {
    currentRoom = uuidv4()
    roons[ currentRoom ] = {
        count:0,
        proccess:null,
        players:{}
    }
}

const initialPosition = [
    // [xpos, ypos, orientation, lockingTo, energy]
    [120, 120, 0, 0, 1000], // team 1: position 0
    [400, 400, 0, 0, 1000], // team 1: position 1
    [-500, 200, 0, 0, 1000], // team 1: position 2
    [500, 0, 180, 180, 1000], // team 2: position 0
    [500, 100, 180, 180, 1000], // team 2: position 1
    [500, 200, 180, 180, 1000]  // team 2: position 2
]

addNewRoom()

const worldCalc = context => {
    // Do calcs
    return []
}

const wordProccess = sector => {
    //const globalData = worldCalc( playersData[sector] )
    io.to( sector ).emit('server', roons[ sector ].players)
    
    /*
    for (var [, { name, data }] of Object.entries( roons[ sector ].players )) {
    a = { 
        H8xBdPEjilowVjWlAAAA: { 
            name: 'sillas_1fc2f871-9ec9-4274-946e-57de2a7b8adf',
            data: [ -500, 0, 0, 0, 1000 ] 
        } 
    }*/
}

io.on('connection', socket => {

    socket.on('join', data => {

        const _currentRoom = currentRoom

        players[socket.id] = _currentRoom // for easy remove on disconnect

        roons[ _currentRoom ].players[ socket.id ] = { // add player to this room
            name: data.name,
            data: initialPosition[ roons[ _currentRoom ].count ]
        }


        socket.join( _currentRoom )

        roons[ _currentRoom ].count++ // increment the number of players in this room

        io.to( _currentRoom ).emit('msg', `${data.name} entrou na arena`)

        if( !roons[ _currentRoom ].proccess ) roons[ _currentRoom ].proccess = setInterval( wordProccess, 0, _currentRoom )

        if( roons[ _currentRoom ].count > maxPlayersPerRoom - 1 ) {
            addNewRoom()
        }
    })


    // ------------------------------------------------------- preparar o disconnect

    socket.on('data', data => {

        //console.log( data );
        /*
        if(data.event === 'mm' && playersData[ socket.id ]) {
            io.to( playersData[ socket.id ].sector ).emit('server', {u: data.user, e:'p', d: data.data}) // broadcast
        }
        */
    })
    
    socket.on('disconnecting', () => {

        const room = players[socket.id] // get the room
        const playerName = roons[ room ].players[ socket.id ].name
        
        // Remove the player from the room
        roons[ room ].count-- 
        delete roons[ room ].players[ socket.id ]
        delete players[ socket.id ]

        // Inform the players of the room
        io.to( room ).emit('msg', `${playerName} deixou a batalha.`)

        // check if the room is empty
        if( roons[ room ].count <= 0 ) {
            clearInterval( roons[ room ].proccess )
            if( room == currentRoom ) addNewRoom()
            delete roons[ room ]
        }
    });
})

server.listen(SERVER_PORT, SERVER_HOST, () => {
    console.log(`[HTTP] Listen => Server is running att http://${SERVER_HOST}:${SERVER_PORT}`);
})