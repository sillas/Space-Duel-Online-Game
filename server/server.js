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

const inputDict = {
    'dirx': 0, // +-x dir
    'diry': 1, // +-y dir
    'mm':   2, // mouse move
    'mb0':  3, // Mouse left button
    'mb1':  4, // Mouse mid button
    'mb2':  5, // Mouse right button
    'space':6, // Space key
    'num':  7, // 1 to 5 numbers key
    'mod':  8  // Shift 
}

// [ weaponType, initialPosition, direction, initialEnergy, initialAbsoluteVelocity, rechargeTime (seconds), inpactOn (target), numbersOf ]
const arsenalOfWeapons = {
    'basic_t1': [ 'main', [0, 0], [1, 1], 100, 30, 2, null, 100 ]
}


addNewRoom() // Add default room


const wordProccess = sector => {
    const currentT = (new Date()).getTime()
    const deltaT = (currentT - roons[ sector ].time) / 1000

    if( deltaT < 5 ) { // rudimentary filter

        const toEmit = {}

        for (let [, { name, data, input, paramns, weapons }] of Object.entries( roons[ sector ].players )) {

            // ------------------------------------------- Ships movements

            // TODO: Implement power dissipation to limit speed
            let power = Math.sign( input[1] )

            // fire weapons
            if( (input[3] || input[5]) && paramns.rechargeTime == 0 ) { // Pressing the left or right mouse button

                let mX = input[2][0]
                let mY = input[2][1]
                const newBullet = arsenalOfWeapons['basic_t1'].slice(0)
                
                const modV = Math.abs( Math.sqrt( (mX * mX) + (mY * mY) ) )

                mX =  mX / modV,
                mY = mY / modV,

                newBullet[1] = [ data[0], data[1] ]
                newBullet[2] = [mX, mY]
                
                weapons.push( newBullet )

            }
            //-------------

            if( input[8] && (input[0] || input[1]) ) {
                const compDir = directionalDict[[input[0], input[1]]]
                const factor = Math.PI * compDir[0]
                forceDirection = data[2] + factor
                power = compDir[1] / 5

            } else {
                // ------------------------------------------ Rotation of the ship
                const rSign = Math.sign( input[0] ) // 1 = clockwise, -1 = anticlockwise, 0 = stop
                const rIncrement = 0.000005

                if( input[0] && paramns.Vrotate[1] === rSign ) {
                    paramns.Vrotate[0] += paramns.Vrotate[0] < 0.002 ? rIncrement : 0 // smooth increment
                }
                else {
                    paramns.Vrotate[0] -= paramns.Vrotate[0] > 0 ? rIncrement : 0 // smooth decrement
                    if( paramns.Vrotate[0] < rIncrement) paramns.Vrotate[1] = rSign
                }

                data[2] += paramns.Vrotate[0] * paramns.Vrotate[1] // sign * rotate velocity
                forceDirection = data[2]
            } // ----------------------------------------------------------------
            
            const V = paramns.velocity
            const dt2_2m = deltaT * deltaT / (2 * paramns.mass)
            const dt_m = deltaT / paramns.mass

            const F = paramns.force * power
            const Fx = F * Math.cos( forceDirection )
            const Fy = F * Math.sin( forceDirection )

            data[0] += V[0] * deltaT + Fx * dt2_2m
            data[1] += V[1] * deltaT + Fy * dt2_2m

            V[0] += Fx * dt_m
            V[1] += Fy * dt_m
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
            input: [0, 0, [1, 1], false, false, false, false, '0', false],
            paramns: {
                force: 100, // in KN
                mass: 1, // in tons
                velocity: [0, 0],
                Vrotate: [0, 0], // Rotation factor, signal
                rechargeTime: 0
            },
            weapons:[] // [ type, position, energy, initialVelocity, rechargeTime ]
        }

        socket.join( _currentRoom )

        io.to( _currentRoom ).emit('msg', `${data.name} entrou na arena`)

        if( !roons[ _currentRoom ].proccess ) roons[ _currentRoom ].proccess = setInterval( wordProccess, 0, _currentRoom )
    })
    

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