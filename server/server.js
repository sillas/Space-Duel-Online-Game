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
let memPlayers = {}
let roons = {}


const addNewRoom = () => {
    currentRoom = uuidv4()
    roons[ currentRoom ] = {
        occupy:[false, false, false, false, false, false],
        proccess:null,
        players:{}
    }
}

const initialPosition = [
    // [xpos, ypos, orientation, lockingTo, energy, team]
    [100, 120, 0, 0, 1000, true], // team 1: position 0
    [500, 120, 180, 180, 1000, false], // team 2: position 0
    [100, 220, 0, 0, 1000, true], // team 1: position 1
    [500, 220, 180, 180, 1000, false], // team 2: position 1
    [100, 320, 0, 0, 1000, true], // team 1: position 2
    [500, 320, 180, 180, 1000, false]  // team 2: position 2
]

addNewRoom()

const worldCalc = context => {
    // Do calcs
    return []
}


const wordProccess = sector => {
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

        let _currentRoom = currentRoom
        let occupy = function () 
        {
            for (let index = 0; index < maxPlayersPerRoom; index++) {
                if( !roons[ _currentRoom ].occupy[ index ] ) {
                    roons[ _currentRoom ].occupy[ index ] = true // True == occupied position
                    return index
                }
            }
            return undefined
        }()

        if( occupy === undefined ) { // Create a new room
            addNewRoom()
            _currentRoom = currentRoom
            roons[ _currentRoom ].occupy[ 0 ] = true
            occupy = 0
        }

        memPlayers[socket.id] = {"room":_currentRoom, "occupy":occupy} // for easy remove on disconnect

        roons[ _currentRoom ].players[ socket.id ] = { // add player to this room
            name: data.name,
            data: initialPosition[ occupy ]
        }

        socket.join( _currentRoom )

        io.to( _currentRoom ).emit('msg', `${data.name} entrou na arena`)

        if( !roons[ _currentRoom ].proccess ) roons[ _currentRoom ].proccess = setInterval( wordProccess, 0, _currentRoom )

    })


    // ------------------------------------------------------- preparar o disconnect

    socket.on('data', data => {
        /*
        if(data.event === 'mm' && playersData[ socket.id ]) {
            io.to( playersData[ socket.id ].sector ).emit('server', {u: data.user, e:'p', d: data.data}) // broadcast
        }
        */
    })
    
    socket.on('disconnecting', () => {

        const room = memPlayers[socket.id].room // get the room
        const playerName = roons[ room ].players[ socket.id ].name
        
        // Remove the player from the room
        roons[ room ].occupy[ memPlayers[ socket.id ].occupy ] = false
        delete roons[ room ].players[ socket.id ]
        delete memPlayers[ socket.id ]

        // Inform the players of the room
        io.to( room ).emit('msg', `${playerName} deixou a batalha.`)

        // check if the room is empty
        if( roons[ room ].occupy.every( i => { return !i }) ) {
            clearInterval( roons[ room ].proccess )
            if( room == currentRoom ) addNewRoom() // if is the last room, create a new room
            delete roons[ room ]
        }
    });
})

server.listen(SERVER_PORT, SERVER_HOST, () => {
    console.log(`[HTTP] Listen => Server is running att http://${SERVER_HOST}:${SERVER_PORT}`);
})