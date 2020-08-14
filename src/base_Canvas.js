import React, { useRef, useEffect, useState } from 'react'

const Canvas = () => {

    const animateRef = useRef(null)
    const canvasRef = useRef(null)
    const contextRef = useRef(null)
    const x = useRef(50)
    const y = useRef(50)
    const vx = useRef(0)
    const vy = useRef(0)

    const winW = window.innerWidth - 3
    const winH = window.innerHeight - 3

    // const [isDrawing, setIsDrawing] = useState(false) // this rerender

    useEffect(() => {
        const canvas = canvasRef.current;
        canvas.width = winW;
        canvas.height = winH;
        // canvas.style.width = `${window.innerWidth}px`;
        // canvas.style.height = `${window.innerHeight}px`;

        const context = canvas.getContext("2d");
        //context.scale(2,2)
        contextRef.current = context;

        animateRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animateRef.current); // executa quando o componente for desmontado
    }, [])

    const animate = (time) => {
        contextRef.current.clearRect(0, 0, window.innerWidth, window.innerHeight);
        // animate Here
        computePositions()

        drawScenery()

        drawShips()

        // drawOtherObjects()

        animateRef.current = requestAnimationFrame(animate);
    }

    const computePositions = () => {
        x.current += vx.current
        y.current += vy.current
    }

    // ---------------------------- Draws

    const drawScenery = () => {

        // planet
        contextRef.current.beginPath();
        contextRef.current.arc( -x.current + winW/2 , -y.current + 500, winW/30, 0, 6.283185307179586, false);
        contextRef.current.fillStyle = "#ff3f3d";
        contextRef.current.fill();
    }

    const drawShips = () => {

        // Ship
        contextRef.current.beginPath();
        contextRef.current.arc( winW/2 , winH/2, 50, 0, 6.283185307179586, false);
        contextRef.current.fillStyle = "green";
        contextRef.current.fill();
    }

    // ---------------------------- Controls

    const mouseDown = ({nativeEvent}) => {
        return
        // const {offsetX, offsetY} = nativeEvent
        // contextRef.current.beginPath()
    }

    const mouseMove = ({nativeEvent}) => {
        return
        /*
        const {offsetX, offsetY} = nativeEvent
        
        //contextRef.current.lineTo(offsetX, offsetY)
        //contextRef.current.stroke()
        */
    }

    const keyDown = ({nativeEvent}) => {
        const {key} = nativeEvent
        
        switch (key) {
            case 'ArrowUp':
            case 'w':
                //console.log('^');
                vy.current -= 0.1
                break
            case 'ArrowDown':
            case 's':
                //console.log('|');
                vy.current += 0.1
                break
            case 'ArrowLeft':
            case 'a':
                // console.log('<-');
                vx.current -= 0.1
                break
            case 'ArrowRight':
            case 'd':
                // console.log('->');
                vx.current += 0.1
                break
            default:
                console.log( key );
        }
    }

    const keyUp = ({nativeEvent}) => {

        return
        /*
        const {key} = nativeEvent

        switch (key) {
            case 'ArrowUp':
            case 'w':
                //console.log('-');
                break
            case 'ArrowDown':
            case 's':
                //console.log('-');
                break
            case 'ArrowLeft':
            case 'a':
                //console.log('-');
                break
            case 'ArrowRight':
            case 'd':
                //console.log('-');
                break
            default:
                //console.log( key );
        }
        */
    }

    return (
        <canvas
            onMouseDown={mouseDown}
            onMouseMove={mouseMove}
            onKeyDown={keyDown}
            onKeyUp={keyUp}
            tabIndex='0'
            ref={canvasRef}
        />
    )
}

export default Canvas