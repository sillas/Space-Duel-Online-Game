import React, { useRef, useEffect } from 'react'

const Canvas = () => {

    const canvas_ref = useRef(null)
    const context_ref = useRef(null)
    const winW = window.innerWidth - 3
    const winH = window.innerHeight - 3

    useEffect(() => {
        const canvas = canvas_ref.current
        canvas.width = winW
        canvas.height = winH

        context_ref.current = canvas.getContext('2d')
    }, [])

    const keyDown = ({nativeEvent}) => {
        const {key} = nativeEvent
        console.log( 'K Down', key );
    }

    const keyUp = ({nativeEvent}) => {
        const {key} = nativeEvent
        console.log( 'K Up', key );
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