import React, { useRef, useEffect } from 'react'

const Canvas = () => {

    const canvas_ref = useRef(null)
    const context_ref = useRef(null)
    const animate_ref = useRef(null)
    const winW = window.innerWidth - 3
    const winH = window.innerHeight - 3
    const input_direction = useRef([0, 0]) // [x, y] directions
    const input_space = useRef(false) // space bar
    const input_numeric = useRef('1') // input numbers: 1 to 5

    useEffect(() => {
        const canvas = canvas_ref.current
        canvas.width = winW
        canvas.height = winH

        context_ref.current = canvas.getContext('2d')
        animate_ref.current = requestAnimationFrame(animate)
        return () => cancelAnimationFrame( animate_ref.current )
    }, [])

    const animate = () => { // (time) to get the milliseconds since app start.
        context_ref.current.clearRect(0, 0, window.innerWidth, window.innerHeight);
        // animate Here
        console.log( input_direction.current, input_space.current, input_numeric.current );

        animate_ref.current = requestAnimationFrame(animate);
    }

    const keyDown = ({nativeEvent}) => {
        const {key} = nativeEvent
        
        switch (key) {
            case 'ArrowUp':
            case 'w':
                input_direction.current[1] = -1 // y axis is upside down
                break
            case 'ArrowDown':
            case 's':
                input_direction.current[1] = 1
                break
            case 'ArrowLeft':
            case 'a':
                input_direction.current[0] = -1
                break
            case 'ArrowRight':
            case 'd':
                input_direction.current[0] = 1
                break
            case ' ':
                input_space.current = true
                break
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
                input_numeric.current = key
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
                input_direction.current[1] = 0
                break
            case 'ArrowDown':
            case 's':
                input_direction.current[1] = 0
                break
            case 'ArrowLeft':
            case 'a':
                input_direction.current[0] = 0
                break
            case 'ArrowRight':
            case 'd':
                input_direction.current[0] = 0
                break
            case ' ':
                input_space.current = false
                break
            case '1': // ignore these keys
            case '2':
            case '3':
            case '4':
            case '5':
                break
            default:
                console.log( 'press:', key ); // debug other buttons
        }
    }

    return (
        <canvas
            onKeyDown={keyDown}
            onKeyUp={keyUp}
            tabIndex='0'
            ref={canvas_ref}
        />
    )
}

export default Canvas