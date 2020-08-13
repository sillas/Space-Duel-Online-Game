import React, { useRef, useEffect } from 'react'

const Canvas = () => {

    const canvas_ref = useRef(null)
    const context_ref = useRef(null)
    const animate_ref = useRef(null)
    const winW = window.innerWidth - 3
    const winH = window.innerHeight - 3
    const input_direction = useRef([0, 0]) // [x, y] directions

    useEffect(() => {
        const canvas = canvas_ref.current
        canvas.width = winW
        canvas.height = winH

        context_ref.current = canvas.getContext('2d')
        animate_ref.current = requestAnimationFrame(animate)
        return () => cancelAnimationFrame( animate_ref.current )
    }, [])

    const animate = (time) => {
        context_ref.current.clearRect(0, 0, window.innerWidth, window.innerHeight);
        // animate Here
        console.log( input_direction.current );

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
            default:
                console.log( key );
        }
    }

    const keyUp = ({nativeEvent}) => { // reset directions
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
            default:
                console.log( key );
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