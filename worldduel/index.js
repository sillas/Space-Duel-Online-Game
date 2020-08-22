const io = require('socket.io-client')
const socket = io('http://localhost:8080')

socket.on('connect', () => console.log('[World Duel] Connected'))
socket.emit('join', {user: 'ww', sector:'worldduel'})

let count = 0

const receiveData = data => {
    count = parseInt( data )
}

socket.on('data', receiveData )

const watchOp = () => {
    socket.emit('calcdata', ++count )
    console.log( count )
}

setInterval( watchOp, 0)