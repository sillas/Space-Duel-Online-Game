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
        time: (new Date()).getTime(),
        players:{}
    }
}

const initialPosition = [
    // [xpos, ypos, orientation, lockingTo, energy, team]
    [100, 120, 0, 0, 1000, true],              // team 1: position 0
    [500, 120, Math.PI, Math.PI, 1000, false], // team 2: position 0
    [100, 220, 0, 0, 1000, true, 0],              // team 1: position 1
    [500, 220, Math.PI, Math.PI, 1000, false], // team 2: position 1
    [100, 320, 0, 0, 1000, true, 0],              // team 1: position 2
    [500, 320, Math.PI, Math.PI, 1000, false]  // team 2: position 2
]


addNewRoom()


const directionalDict = {
    '0,1':  [1, -1], // NS
    '0,-1': [1, 1],
    '1,1': [0.25, 1], // NE SW
    '-1,-1': [0.25, -1],
    '-1,1': [0.75, -1], // NW ES
    '1,-1': [0.75, 1], 
    '1,0':  [0.5, 1], // EW
    '-1,0': [0.5, -1]
}


const wordProccess = sector => {
    const currentT = (new Date()).getTime()
    const deltaT = (currentT - roons[ sector ].time) / 1000

    if( deltaT < 5 ){

        const toEmit = {}

        for (let [, { name, data, input, paramns }] of Object.entries( roons[ sector ].players )) {

            // ------------------------------------------- Ships movements

            // TODO: Iplement the power energy dissipation to limit the velocity
            let power = Math.sign( input[1] )

            if( input[8] && (input[0] || input[1]) ) {
                const compDir = directionalDict[[input[0], input[1]]]
                const factor = Math.PI * compDir[0]
                forceDirection = data[2] + factor
                power = compDir[1] / 5

            } else {

                data[2] += Math.sign( input[0] ) * 0.002
                forceDirection = data[2]

            }
            
            const V = paramns.velocity
            const dt22m = deltaT * deltaT / (2 * paramns.mass)
            const dtm = deltaT / paramns.mass

            const F = paramns.force * power
            const Fx = F * Math.cos( forceDirection )
            const Fy = F * Math.sin( forceDirection )

            data[0] += V[0] * deltaT + Fx * dt22m
            data[1] += V[1] * deltaT + Fy * dt22m

            V[0] += Fx * dtm
            V[1] += Fy * dtm
            // -------------------------------------------

            toEmit[name] = data.slice(0)
        }

        io.to( sector ).emit('server', toEmit )
    }

    if( roons[ sector ] ) {
        roons[ sector ].time = currentT
    }
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
            data: initialPosition[ occupy ].slice(0),
            //   input dir, mouse pos, mouse buttons,     space, nuns
            //      x, y, [x, y],  left,  mid,  right, 
            input: [0, 0, [0, 0], false, false, false, false, '0', false],
            paramns: {
                force: 100, // in KN
                mass: 1, // in tons
                velocity: [0, 0]
            }
        }

        socket.join( _currentRoom )

        io.to( _currentRoom ).emit('msg', `${data.name} entrou na arena`)

        if( !roons[ _currentRoom ].proccess ) roons[ _currentRoom ].proccess = setInterval( wordProccess, 0, _currentRoom )
    })
    

    const inputDict = {
        'dirx': 0,
        'diry': 1,
        'mm':   2,
        'mb0':  3,
        'mb1':  4,
        'mb2':  5,
        'space':6,
        'num':  7,
        'mod':  8
    }

    socket.on('player_inputs', data => {
        roons[ memPlayers[socket.id].room ].players[ socket.id ].input[ inputDict[ data.event ] ] = data.input
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