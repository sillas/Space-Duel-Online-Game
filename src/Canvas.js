import React, { useRef, useEffect } from 'react'
import io from 'socket.io-client'
import './styles/main.css'

const user = 'sillas-' + Date.now()
const socket = io('http://localhost:8080')

//--------------------------------------

// ---------------- Helpers
function rotate(x, y, offset, angle) { // angle in radians
    var cos = Math.cos(angle)
    var sin = Math.sin(angle)

    // Translate to (0, 0)
    x -= offset[0]
    y -= offset[1]

    // Rotation Matrix
    // |cosTh -sinTh|   |x|    |rX|
    // |sinTh  cosTh| * |y| =  |rY|
    return [(cos*x -sin*y) + offset[0], (sin*x +cos*y) + offset[1]]
}
// ----------------- End helpers

const Canvas = () => {

    const windowSize = useRef([window.innerWidth - 3, window.innerHeight - 3])
    const midWindow = useRef( [ window.innerWidth >> 1, window.innerHeight >> 1] )
    const wheel_mouse_max_min = useRef( [0, 10] )
    const canvas_ref = useRef( null )
    const context_ref = useRef( null )
    const animate_ref = useRef( null )
    const input_direction = useRef( [0, 0] ) // [x, y] directions
    const prevPosition = useRef( [0, 0] ) // [x, y]
    const input_space = useRef( false ) // space bar
    const input_numeric = useRef( '1' ) // input numbers: 1 to 5
    const input_modifier = useRef(false) // Shift key
    // const input_mouse_position = useRef( [0, 0] ) // [x, y]
    const input_mouse_button = useRef( [false, false, false] ) // [left button, middle button, right button]
    const input_mouse_wheel = useRef( 0 )
    const camPosition = useRef([0, 0]) // Camera
    const ships = useRef( [] )
    const weapons = useRef( [] )
    
    useEffect(() => {
        const canvas = canvas_ref.current
        canvas.width = windowSize.current[0]
        canvas.height = windowSize.current[1]
        canvas.oncontextmenu = ev => ev.preventDefault() // prevent right-click context menu

        context_ref.current = canvas.getContext( '2d' )
        animate_ref.current = requestAnimationFrame( animate )

        socket.on('connect', () => console.log('[IO] Connect => A new connection start'))
        socket.emit('join', { name: user })
        socket.on('server', data => ships.current = Object.entries( data ) )
        socket.on('serverw', data => weapons.current = data )
        socket.on('msg', msg => console.log( msg ) )

        return () => {
            socket.off('server', data => ships.current = Object.entries( data ) )
            socket.off('serverw', data => weapons.current = data )
            socket.off('msg', () => {} )
            cancelAnimationFrame( animate_ref.current )
        }
    }, [])


    const animate = () => { // (time) to get the milliseconds since app start.
        context_ref.current.clearRect(0, 0, window.innerWidth, window.innerHeight)

        for ( let [ name, data ] of ships.current ) { // get the camera position

            if( name === user ) {
                
                camPosition.current = [data[0] , data[1]]
                prevPosition.current = [data[0], data[1]]

                document.getElementById('planet').setAttribute('style', `left: ${ (data[0] / 250) + 500 }px; top: ${ (data[1] / 250) + 200 }px`)
                document.getElementById('backdust').setAttribute('style', `background-position: ${ data[0] >> 4 }px ${ data[1] >> 4 }px`)
                document.getElementById('middust').setAttribute('style', `background-position: ${ (data[0] - 500) >> 3 }px ${ (data[1] - 500) >> 3 }px`)
                document.getElementById('frontdust').setAttribute('style', `background-position: ${ data[0] - 300 }px ${ data[1] - 900 }px`)

                break
            }
        }

        for( let index in weapons.current ) {

            let [ type, position, energy, impact ] = weapons.current[ index ]

            // -------------------------
            drawWeapon( position, energy )
            // -------------------------

            /*

            if( impact ) {
                //console.log( impact[0], impact[1] )
            }
            */

            if( energy <= 0 || impact ) {
                weapons.current.splice(index, 1)
            }
        }

        for ( let [ name, data ] of ships.current ) {
            drawSpaceShips( name, data )
        }

        animate_ref.current = requestAnimationFrame(animate)
    }


    // Draw Screen Elements ----------------------------

    const cam = ( initp ) => {
        return [
            ( camPosition.current[0] - initp[0] ) + midWindow.current[0],
            ( camPosition.current[1] - initp[1] ) + midWindow.current[1]
        ]
    }

    const drawWeapon = ( position, energy ) => {
        const p = cam(position)
        energy = 2 + energy >> 4
        context_ref.current.beginPath()

        context_ref.current.moveTo( p[0] - energy, p[1] )
        context_ref.current.lineTo( p[0] + energy, p[1] )
        context_ref.current.moveTo( p[0], p[1] - energy )
        context_ref.current.lineTo( p[0], p[1] + energy )

        context_ref.current.strokeStyle = "#fff"
        context_ref.current.lineWidth = 2

        context_ref.current.stroke()
        context_ref.current.fill()
    }

    const drawShip = (x, y, orientation, ship) => {

        let rot = rotate( ship[0][0] + x, ship[0][1] + y, [x, y], orientation)
        rot = cam( rot )

        context_ref.current.beginPath()
        context_ref.current.moveTo( rot[0], rot[1] )

        for(let index = 1; index < ship.length; index++) {

            rot = rotate( ship[index][0] + x, ship[index][1] + y, [x, y], orientation)
            rot = cam( rot )
            context_ref.current.lineTo( rot[0], rot[1] )

        }
    }


    const drawSpaceShips = ( name, data ) => {
        // data = [xpos, ypos, orientation, lockingTo, energy, team]

        const xpos = data[0]
        const ypos = data[1]
        const orientation = data[2]
        const team = data[5]      
        const ship_from_db = [[-20, 22], [54, 0], [-20, -22]] // get when connect
        
        drawShip( xpos, ypos, orientation, ship_from_db )
        
        context_ref.current.lineWidth = 2
        context_ref.current.fillStyle = team ? '#8bd9d4':'#0000d4'
        context_ref.current.stroke()
        context_ref.current.fill()
    }
    // Socket events ----------------------------------


    const socketSend = ( event, data ) => {
        socket.emit('player_inputs', {
            event: event,
            input: data
        })
        return data
    }


    // Mouse inputs -----------------------------------
    const mouseMove = ({nativeEvent}) => {
        const {offsetX, offsetY} = nativeEvent
        const [cx, cy] = midWindow.current
        socketSend('mm', [ cx - offsetX, cy - offsetY ])
    }


    const mouseDown = ({nativeEvent}) => {
        const { button, offsetX, offsetY } = nativeEvent
        const [cx, cy] = midWindow.current
        input_mouse_button.current[ button ] = socketSend('mb' + button, true)
        socketSend('mm', [ cx - offsetX, cy - offsetY ])
    }


    const mouseUp = ({nativeEvent}) => {
        const { button } = nativeEvent
        input_mouse_button.current[ button ] = socketSend('mb' + button, false)        
    }


    const mouseWheel = ({nativeEvent}) => {
        const { wheelDeltaY } = nativeEvent
        if( wheelDeltaY > 0 ) {

            if( input_mouse_wheel.current === wheel_mouse_max_min.current[1] ) return
            
            input_mouse_wheel.current += 1
            return
        }

        if( input_mouse_wheel.current === wheel_mouse_max_min.current[0]) return

        input_mouse_wheel.current -= 1
    }


    // Keyboard inputs --------------------------------
    const keyDown = ({nativeEvent}) => {
        const {key} = nativeEvent
        
        switch (key) {
            case 'ArrowUp':
            case 'w': // y axis is upside down
                input_direction.current[1] = input_direction.current[1] === 1 ? 1: socketSend('diry', 1)
                break
            case 'ArrowDown':
            case 's':
                input_direction.current[1] = input_direction.current[1] === -1 ? -1: socketSend('diry', -1)
                break
            case 'ArrowLeft':
            case 'a':
                input_direction.current[0] = input_direction.current[0] === -1 ? -1: socketSend('dirx', -1)
                break
            case 'ArrowRight':
            case 'd':
                input_direction.current[0] = input_direction.current[0] === 1 ? 1: socketSend('dirx', 1)
                break
            case ' ':
                input_space.current = input_space.current ? true: socketSend('space', true)
                break
            case 'Shift':
            case '0':
                input_modifier.current = input_modifier.current ? true: socketSend('mod', true)
                break
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
                input_numeric.current = socketSend('num', key)
                break
            default:
                console.log( 'press:', key ) // debug other buttons
        }
    }


    const keyUp = ({nativeEvent}) => { // reset directions here
        const {key} = nativeEvent
        
        switch (key) {
            case 'ArrowUp':
            case 'w':
            case 'ArrowDown':
            case 's':
                input_direction.current[1] = socketSend('diry', 0)
                break
            case 'ArrowLeft':
            case 'a':
            case 'ArrowRight':
            case 'd':
                input_direction.current[0] = socketSend('dirx', 0)
                break
            case ' ':
                input_space.current = socketSend('space', false)
                break
            case 'Shift':
            case '0':
                input_modifier.current = socketSend('mod', false)
                break
            default:
                break
        }
    }
    // ------------------------------------------------
    
    return (
        <div>
            <div className="backstars common"></div>
            <div className="blinkStars common"></div>
            <div className="planetBase crescent_planet" id="planet"></div>

            <div className="backDustClass common" id="backdust"></div>
            <div className="midDustClass common" id="middust"></div>
            <div className="frontDustClass common" id="frontdust"></div>
            <canvas
                onMouseMove={mouseMove}
                onMouseDown={mouseDown}
                onMouseUp={mouseUp}
                onWheel={mouseWheel}
                onKeyDown={keyDown}
                onKeyUp={keyUp}
                tabIndex='0'
                ref={canvas_ref}
            />
        </div>
    )
}

export default Canvas