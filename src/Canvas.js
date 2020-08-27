import React, { useRef, useEffect } from 'react'
import io from 'socket.io-client'
import { v4 as uuidv4 } from 'uuid'

const user = 'sillas_' + uuidv4()
const socket = io('http://localhost:8080')

const Canvas = () => {

    const styles = {
        width: "100th",
        height: "100th",
        background: "url('https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?ixlib=rb-1.2.1&auto=format&fit=crop&w=1951&q=80')",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover"
    }

    const winW = useRef( window.innerWidth - 3 )
    const winH = useRef( window.innerHeight - 3 )
    const wheel_mouse_max_min = useRef( [0, 10] )
    const canvas_ref = useRef( null )
    const context_ref = useRef( null )
    const animate_ref = useRef( null )
    const input_direction = useRef( [0, 0] ) // [x, y] directions
    const input_space = useRef( false ) // space bar
    const input_numeric = useRef( '1' ) // input numbers: 1 to 5
    // const input_mouse_position = useRef( [0, 0] ) // [x, y]
    const input_mouse_button = useRef( [false, false, false] ) // [left button, middle button, right button]
    const input_mouse_wheel = useRef( 0 )
    const camPosition = useRef([0, 0]) // Camera
    const ships = useRef( [] )

    useEffect(() => {
        const canvas = canvas_ref.current
        canvas.width = winW.current
        canvas.height = winH.current
        canvas.oncontextmenu = ev => ev.preventDefault() // prevent right-click context menu

        context_ref.current = canvas.getContext( '2d' )
        animate_ref.current = requestAnimationFrame( animate )

        socket.on('connect', () => console.log('[IO] Connect => A new connection start'))
        socket.emit('join', { name: user }) // alpha1 == room
        socket.on('server', data => ships.current = Object.entries( data ) )
        socket.on('msg', msg => console.log( msg) )

        return () => {
            socket.off('server', data => ships.current = Object.entries( data ) )
            socket.off('msg', () => {} )
            cancelAnimationFrame( animate_ref.current )
        }
    }, [])

    const animate = () => { // (time) to get the milliseconds since app start.
        context_ref.current.clearRect(0, 0, window.innerWidth, window.innerHeight);
        //draw_scenario()

        for ( let [, { name, data }] of ships.current ) { // first get the camera position
            console.log( data );
            if( name === user ) {
                camPosition.current = [data[0], data[1]]
                break
            }
        }

        console.log('---------------------------');

        for ( let [, { name, data }] of ships.current ) {
            drawSpaceShips( name, data )
        }
        // animate Here
        /*
        console.log(
            input_direction.current, 
            input_mouse_position.current, 
            input_mouse_button.current, 
            input_space.current, 
            input_numeric.current,
            input_mouse_wheel.current );
        */

        animate_ref.current = requestAnimationFrame(animate);
    }

    // Draw Screen Elements ----------------------------
    const draw_scenario = () => {
        // see procedural generations of clouds and "blue noise" randon generation.
        // Make the ship and its movement first.
        // The ship is generated by a stored data in a external file
    }

    const drawSpaceShips = ( name, data ) => {
        // data = [xpos, ypos, orientation, lockingTo, energy, team]

        const xpos = data[0]
        const ypos = data[1]
        const orientation = data[2]
        const team = data[5]      
        const ship_from_db = [[-50, 52], [54, 0], [-50, -52]] // get when connect
        const drawShip = (x, y) => {
            context_ref.current.beginPath()
            context_ref.current.moveTo(ship_from_db[0][0] + x, ship_from_db[0][1] + y)
            for(let index = 1; index < ship_from_db.length; index++) {
                context_ref.current.lineTo(ship_from_db[index][0] + x, ship_from_db[index][1] + y)
            }
        }

        //context_ref.current.rotate( orientation * Math.PI / 180 )
        
        drawShip( xpos, ypos )
        
        context_ref.current.lineWidth = 2
        context_ref.current.fillStyle = '#8bd9d4'
        context_ref.current.stroke()
        context_ref.current.fill()
    }
    // Socket events ----------------------------------

    const socketSend = ( event, data ) => {
        socket.emit('data', {
            user: user,
            event: event,
            data: data
        })
        return data
    }

    // Mouse inputs -----------------------------------
    const mouseMove = ({nativeEvent}) => {
        const {offsetX, offsetY} = nativeEvent
        socketSend('mm', [ offsetX, offsetY ])
    }

    const mouseDown = ({nativeEvent}) => {
        const { button, offsetX, offsetY } = nativeEvent
        input_mouse_button.current[ button ] = socketSend('md_' + button, true)
        socketSend('mm', [ offsetX, offsetY ])
    }

    const mouseUp = ({nativeEvent}) => {
        const { button } = nativeEvent
        input_mouse_button.current[ button ] = socketSend('mu_' + button, false)        
    }

    const mouseWheel = ({nativeEvent}) => {
        const { wheelDeltaY } = nativeEvent
        if( wheelDeltaY > 0 ) {

            if( input_mouse_wheel.current === wheel_mouse_max_min.current[1] ) return
            
            input_mouse_wheel.current = socketSend('mw', input_mouse_wheel.current + 1)
            return
        }

        if( input_mouse_wheel.current === wheel_mouse_max_min.current[0]) return

        input_mouse_wheel.current = socketSend('mw', input_mouse_wheel.current - 1)
    }

    // Keyboard inputs --------------------------------
    const keyDown = ({nativeEvent}) => {
        const {key} = nativeEvent
        
        switch (key) {
            case 'ArrowUp':
            case 'w': // y axis is upside down
                input_direction.current[1] = input_direction.current[1] === -1 ? -1: socketSend('diry', -1)
                break
            case 'ArrowDown':
            case 's':
                input_direction.current[1] = input_direction.current[1] === 1 ? 1: socketSend('diry', 1)
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
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
                input_numeric.current = socketSend('num', key)
                break
            default:
                console.log( 'press:', key ); // debug other buttons
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
                socketSend('dirx', 0)
                input_direction.current[0] = socketSend('dirx', 0)
                break
            case ' ':
                input_space.current = socketSend('space', false)
                break
            case '1': // ignore these keys release
            case '2':
            case '3':
            case '4':
            case '5':
                break
            default:
                console.log( 'press:', key ); // debug other buttons
        }
    }
    // ------------------------------------------------

    return (
        <div style={ styles }>
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