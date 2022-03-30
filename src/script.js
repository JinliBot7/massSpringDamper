import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'
import * as CANNON from 'cannon-es'

import Stats from 'stats.js'

import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
    

/**
 * Debug
 */
const gui = new dat.GUI()
const debugObject = {}
const pathArray = []
const springArray = []
const savedArray = []

const colorArray = [new THREE.Color(0x000000),new THREE.Color(0xFF0000), new THREE.Color(0x0000FF), new THREE.Color(0x008000), new THREE.Color(0xFF00FF)]

var moveFlag = false
var accumulateError = 0
var stableFlag = false
var initMoveFlag = true //for count start time
var updateLineFlag = true
var savePathFlag = false
var updateSpringFlag = false




/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// FPS indicator
const stats = new Stats()
stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom)

// Scene
const scene = new THREE.Scene()
scene.background = new THREE.Color( 0xeeeeee)

// Fonts





/**
 * Main Contents
 */

// Wall
const wall_geometry = new THREE.BoxGeometry( 10, 3, 0.5 )
const wall_material = new THREE.MeshBasicMaterial( { color: 0x79858d     } )
const wall_mesh = new THREE.Mesh( wall_geometry, wall_material )
wall_mesh.position.y = 1.5
wall_mesh.position.z = 0.25
scene.add( wall_mesh )


// Mass block parameters
const block = {}
block.position = 0
block.velocity = 0
block.acceleration = 0
block.mass = 1

// Dynamic system parameters
const DS = {}

DS.spring = 1
DS.damp = 1
DS.inputForce = 0
DS.externalForce = 0


function getAcceleration (mass,spring,damp,inputForce,displacement,velocity,externalForce) 
{   
    return (externalForce+inputForce-spring*displacement-damp*velocity)/mass
}

function getVelocity (mass,spring,damp,inputForce,displacement,velocity,timeInterval,externalForce)
{
    const acceleration = getAcceleration(mass,spring,damp,inputForce,displacement,velocity,externalForce)
    return (velocity + acceleration*timeInterval)    
}

function updateMotion (mass,spring,damp,inputForce,displacement,velocity,timeInterval,mesh,externalForce)
{
    block.velocity = getVelocity (mass,spring,damp,inputForce,displacement,velocity,timeInterval,externalForce)
    block.acceleration = getAcceleration (mass,spring,damp,inputForce,displacement,velocity,externalForce)
    block.position = block.position +  block['velocity'] * timeInterval
    mesh.position.z = -10-block.position
    debugObject.position =  Math.round(block.position*100)/100
    debugObject.velocity = Math.round(block.velocity*100)/100
    debugObject.acceleration = Math.round(block.acceleration*100)/100

}

// Mass block add to scene
const block_geometry = new THREE.BoxGeometry( 1, 1, 1 )
block.color = new THREE.Color(0xaed6f1)
const block_material = new THREE.MeshStandardMaterial( { color: block['color'] } )
block_material.metalness = 0      
block_material.roughness = 1
block_material.emissiveIntensity = 0
const block_mesh = new THREE.Mesh( block_geometry, block_material )
block_mesh.position.y = 0.5
block_mesh.position.z = -10-block.position
scene.add( block_mesh )

// Variables to add to GUI
debugObject.mass = block.mass
debugObject.position = 0
debugObject.velocity = 0
debugObject.acceleration = 0


debugObject.moveFunction = () =>
{
    moveFlag = true
    updateSpringFlag = true
}
debugObject.stopFunction = () =>
{
    moveFlag = false
    updateLineFlag = false
    moveFlag = false
    stableFlag = false
    initMoveFlag = true
    savePathFlag = false
}

const changeInitialPosition = (value) =>
{
    block_mesh.position.z = -10-value
    block.position = value
    updateSpringFlag = true
}

const changeMoveFlag = () =>
{
    moveFlag = true
}

// Reference block
const block_transparent_material = new THREE.MeshStandardMaterial( { color: 0xFF0000 } )
block_transparent_material.transparent = true
block_transparent_material.opacity = 0.3
const reference_block_geometry = new THREE.BoxGeometry( 0.999, 0.999, 0.999 )
const block_transparent_mesh = new THREE.Mesh( reference_block_geometry, block_transparent_material )
block_transparent_mesh.position.y = 0.5
block_transparent_mesh.position.z = -10
scene.add(block_transparent_mesh)

debugObject.targetPosition = 0

const line_material = new THREE.LineBasicMaterial({color: 0x0000ff,linewidth: 1})
const points = []
const line_geometry = new THREE.BufferGeometry().setFromPoints( points )
const line = new THREE.Line( line_geometry, line_material )
scene.add( line )


// Draw target line
const targetLinePoints = []
targetLinePoints.push( new THREE.Vector3( -6,5,0 ))
targetLinePoints.push( new THREE.Vector3( -6,5,-100 ))
const target_line_material = new THREE.LineBasicMaterial({color: 0xFF0000,linewidth: 1})
var target_line_geometry = new THREE.BufferGeometry().setFromPoints( targetLinePoints )
var target_line_mesh = new THREE.Line( target_line_geometry, target_line_material )
scene.add( target_line_mesh )


function changeTargetPosition(value)
{
    block_transparent_mesh.position.z = -value-10
    scene.remove(target_line_mesh)
    targetLinePoints.splice(0,2)
    var lineHeight = 5+value/2
    targetLinePoints.push( new THREE.Vector3( -6,lineHeight,0 ))
    targetLinePoints.push( new THREE.Vector3( -6,lineHeight,-100 ))
    target_line_geometry = new THREE.BufferGeometry().setFromPoints( targetLinePoints )
    target_line_mesh = new THREE.Line( target_line_geometry, target_line_material )
    scene.add( target_line_mesh )
}



// Draw Line



const axis_line_material = new THREE.LineBasicMaterial({color: 0x000000})
const x_axis_points = []
x_axis_points.push( new THREE.Vector3( -6, 5, 0 ) )
x_axis_points.push( new THREE.Vector3( -6, 5, -102 ) )
const x_axis_points_geometry = new THREE.BufferGeometry().setFromPoints( x_axis_points )
const x_axis_line = new THREE.Line( x_axis_points_geometry, axis_line_material )
scene.add( x_axis_line )
//Add ticks
const tick_poinst = []
for (var i = 2;i<102;i+=2)
{
    tick_poinst.push( new THREE.Vector3(-6,5,-i))
    tick_poinst.push( new THREE.Vector3(-6,5.2,-i))
    const tickGeometry = new THREE.BufferGeometry().setFromPoints( tick_poinst )
    const tickLine = new THREE.Line( tickGeometry, axis_line_material)
    scene.add(tickLine)
    tick_poinst.splice(0,2)
}


const y_axis_points = []
y_axis_points.push( new THREE.Vector3( -6, 11, 0 ) )
y_axis_points.push( new THREE.Vector3( -6, -1, 0 ) )
const y_axis_points_geometry = new THREE.BufferGeometry().setFromPoints( y_axis_points )
const y_axis_line = new THREE.Line( y_axis_points_geometry, axis_line_material )
scene.add( y_axis_line )
for (var i = 0;i<11 ;i+=1   )
{
    tick_poinst.push( new THREE.Vector3(-6,i,0))
    tick_poinst.push( new THREE.Vector3(-6,i,-0.2))
    const tickGeometry = new THREE.BufferGeometry().setFromPoints( tick_poinst )
    const tickLine = new THREE.Line( tickGeometry, axis_line_material)
    scene.add(tickLine)
    tick_poinst.splice(0,2)
}


function updateLine(points,old_line_geometry, old_line,position,time,height,colorPosition)
{   
    pathArray.splice(0)
    scene.remove(old_line_geometry)
    scene.remove(old_line)
    points.push( new THREE.Vector3( -6, (position+height)/2, -time ) )
    const line_geometry = new THREE.BufferGeometry().setFromPoints( points )
    const line_material = new THREE.LineBasicMaterial({color: colorArray[colorPosition]})
    const line = new THREE.Line( line_geometry, line_material )
    scene.add( line )
    
    pathArray.push(line)

    
}

// Draw Spring
const spring_material = new THREE.LineBasicMaterial({color: 0x000000,linewidth: 1})
var spinrg_points = getSpringPointsArray(block.position,DS['spring']*20,10,0.4)

var spring_geometry = new THREE.BufferGeometry().setFromPoints( spinrg_points )
var spring_mesh = new THREE.Line( spring_geometry, spring_material )
scene.add(spring_mesh)

function getSpringPointsArray (blockPosition,roundNumber,resolution,radius)
{   
    
    const spring_points = []
    spring_points.push( new THREE.Vector3( 0, 0.5, 0 ))
    spring_points.push( new THREE.Vector3( 0, 0.5, -0.5 ) )

    const end_point = blockPosition-9
    
    for (var i = 0;i<roundNumber*resolution;i++)
    {   
        
        const polarAngle = (i%resolution/resolution)*2*Math.PI
        const x = radius*Math.cos(polarAngle)
        const y = radius*Math.sin(polarAngle)
        const z = -0.5+(end_point+0.5)*(i/(roundNumber*resolution))

        spring_points.push( new THREE.Vector3(x, y + 0.5, z ))
        
    }
    spring_points.push( new THREE.Vector3( 0, 0.5, end_point) )
    spring_points.push( new THREE.Vector3( 0, 0.5, end_point-0.5 ) )
    //  

    return spring_points
}



/**
 * GUI
 */
const block_folder = gui.addFolder( 'Block' )
const system_folder = gui.addFolder( 'Dynamic System')


block_folder.add(debugObject,'position').min(-9).max(9).step(0.01).onChange(changeInitialPosition).listen()
block_folder.add(debugObject,'targetPosition').min(-9).max(9).step(0.01).onChange(changeTargetPosition).listen().name('target position')

block_folder.add(debugObject,'velocity').listen().min(-10).max(10).step(0.01).disable().listen()
block_folder.add(debugObject,'acceleration').listen().min(-10).max(10).step(0.01).disable().listen()
block_folder.add(block,'mass').min(0.01).max(10).step(0.01)


const updatSpringFuncton = () =>
{
    updateSpringFlag = true
}
// Dynamics system folder
system_folder.add(DS,'spring').min(0).max(10).step(0.01).onChange(updatSpringFuncton)

system_folder.add(DS,'damp').min(0).max(10).step(0.01)
debugObject.elapsedTime = 0
system_folder.add(debugObject,'elapsedTime').listen().disable().name('elapsed time')


const force_folder = system_folder.addFolder( 'Force')
force_folder.add(DS,'externalForce').min(0).max(10).step(0.01).name('external force')
//debugObject.forceEquation = 'Pe + I\u222Be + D\u0117 + \u03bc\u00eb'
debugObject.forceEquation = 'Kp e + Ki \u222Be + Kd \u0117'
force_folder.add(debugObject,'forceEquation').name('input force')
debugObject.p = 0
debugObject.i = 0
debugObject.d = 0
debugObject.mu = 0
force_folder.add(debugObject,'p').min(0).max(10).step(0.01).name('Kp')
force_folder.add(debugObject,'i').min(0).max(2).step(0.01).name('Ki')
force_folder.add(debugObject,'d').min(0).max(10).step(0.01).name('Kd')
//force_folder.add(debugObject,'mu').min(0).max(0.9).step(0.01).name('\u03bc')
debugObject.inputForceValue = 0
force_folder.add(debugObject,'inputForceValue').disable().name('input force').listen()

function getInputForce(p,i,d,mu,e,errorIntegral,errorDot,errorDotDot)
{   
    
    debugObject.inputForceValue = Math.round((p*e + i*errorIntegral + d*errorDot + mu*errorDotDot)*100)/100
    return (p*e + i*errorIntegral + d*errorDot + mu*errorDotDot)
}



// Buttons
gui.add(debugObject,'moveFunction').name('start')
gui.add(debugObject,'stopFunction').name('stop')
debugObject.savePath = () =>
{   
    
    const this_line = pathArray[0].clone()
    scene.add( this_line )
    savedArray.push(this_line)
    thisColorCount += 1
    savePathFlag = true
}
gui.add(debugObject,'savePath').name('save path')

debugObject.resetAll = () =>
{
    
    
    block.position = 0
    block.velocity = 0
    block.acceleration = 0
    debugObject.position = 0
    debugObject.velocity = 0
    debugObject.acceleration = 0
    debugObject.elapsedTime = 0 

    points.splice(0,points.length)
    scene.remove(pathArray[0])
    for (const lines in savedArray)
    {       

        scene.remove(savedArray[lines])
    }
    savedArray.splice(0,savedArray.length)
    block_mesh.position.z = -10
    thisColorCount = 0
    moveFlag = false
    initMoveFlag = true
    
}

gui.add(debugObject,'resetAll').name('reset')
//#region
/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader()
const cubeTextureLoader = new THREE.CubeTextureLoader()

const environmentMapTexture = cubeTextureLoader.load([
    './textures/environmentMaps/0/px.png',
    './textures/environmentMaps/0/nx.png',
    './textures/environmentMaps/0/py.png',
    './textures/environmentMaps/0/ny.png',
    './textures/environmentMaps/0/pz.png',
    './textures/environmentMaps/0/nz.png'
])


const fontLoader = new FontLoader()

fontLoader.load(
    './fonts/helvetiker_regular.typeface.json',
    (font) =>
    {   
        function addFont(textContent,x,y,z,xRotation,yRotation,zRotation,size,color)
        {
            const textGeometry = new TextGeometry(
                textContent,
                {
                    font: font,
                    size: size,
                    height: 0.0,    
                    curveSegments: 12,
                    bevelEnabled: false,
                    bevelThickness: 0.01,
                    bevelSize: 0.01,
                    bevelOffset: 0,
                    bevelSegments: 5
                }
            )
            const textMaterial = new THREE.MeshBasicMaterial({color:color})
            textMaterial.metalness = 1
            textMaterial.roughness = 0.2
            const text = new THREE.Mesh(textGeometry, textMaterial)
            text.name = 'textTitle'
            textGeometry.center()
            text.rotation.x = xRotation
            text.rotation.y = yRotation
            text.rotation.z = zRotation
                
            text.position.set(x,y,z)
            scene.add(text)
            console.log(font)
        }
    addFont('PolyU Virtual Lab',0,3.25,0.5,0,Math.PI,0,0.5,0x000000)
    addFont('Time',-6,4,-10,0,Math.PI/2,0,0.5,0x000000)
    addFont('Position',-6,11,-1.5,0,Math.PI/2,0,0.4,0x000000) 
    }
)


/**
 * Floor
 */
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 20),
    new THREE.MeshStandardMaterial({
        color: '#eeeeee',
        metalness: 0,
        roughness: 0.4,
        //envMap: environmentMapTexture,
        envMapIntensity: 0.5
    })
)
floor.position.z = -10  
floor.receiveShadow = true
floor.rotation.x = - Math.PI * 0.5
scene.add(floor)

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 40
directionalLight.shadow.camera.left = - 40
directionalLight.shadow.camera.top = 40
directionalLight.shadow.camera.right = 40
directionalLight.shadow.camera.bottom = - 40
directionalLight.position.set(0, 5, -5)
scene.add(directionalLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(11.55751788538895,6.795959736433765 , -9.266675462766802)

scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.target.set(-1.408398394653397,2.6876775058076157,-9.350533273702874)

controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))




/**
 * Animate
 */
const clock = new THREE.Clock()
var oldElapsedTime = clock.getElapsedTime()

// Initial Path


//updateMotion (mass,spring,damp,inputForce,displacement,velocity,timeInterval,mesh)


//#endregion
var thisColorCount = 0
const time_object = {}
time_object.startMoveTime = 0
const tick = () =>
{   

    stats.begin()
    
    //Test always look at camera
    scene.traverse((child) =>
    {   
        if(child instanceof THREE.Mesh)
        {   
            if (child.name == 'text')
            {
                child.lookAt(camera.position)
            }
        }
    })


    const elapsedTime = clock.getElapsedTime()
    
    
    // changePosition(elapsedTime*0.1*block['velocity'])
    controls.update()


    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)


    stats.end()

    var timeInterval = elapsedTime-oldElapsedTime
    oldElapsedTime = elapsedTime

    


    if (moveFlag)
    {   
        updateLineFlag = true
        if (initMoveFlag == true)
        {
            time_object.startMoveTime = elapsedTime
            
            //clean plots
            points.splice(0,points.length)
            scene.remove(pathArray[0])
            


            initMoveFlag = false
            accumulateError = 0
        }

        var this_error = debugObject.targetPosition-block.position
        accumulateError += this_error*timeInterval
        

        DS['inputForce'] = getInputForce(debugObject.p,debugObject.i,debugObject.d,debugObject.mu,
            this_error,accumulateError,-block.velocity,-block.acceleration)
            
        
        updateMotion (block['mass'],DS['spring'],DS['damp'],DS['inputForce'],
    block['position'],block['velocity'],timeInterval,block_mesh,DS['externalForce'])
    // Check stable

    if (Math.round(this_error*100)/100 ==0 && debugObject.velocity == 0 & debugObject.acceleration ==0)
    {
        stableFlag = true
    }
    if (!stableFlag)
    {   
        
        debugObject.elapsedTime = Math.round((elapsedTime-time_object.startMoveTime)*100)/100
        
        
            
    }
    if (stableFlag)
    {   
        updateLineFlag = false
        moveFlag = false
        stableFlag = false
        initMoveFlag = true
        
    }

    if (savePathFlag)
    {
        updateLineFlag = false
        moveFlag = false
        stableFlag = false
        initMoveFlag = true
        savePathFlag = false
    }
    if (updateLineFlag)
    {   
        var colorPosition = thisColorCount%5
        updateLine(points,line_geometry, pathArray[0],debugObject.position,debugObject.elapsedTime,10,colorPosition)
    }
    }

    // Update String
    if (updateSpringFlag)
    {
        scene.remove(spring_mesh)
        spinrg_points = getSpringPointsArray(-block.position,DS['spring']*20,10,0.4)
        spring_geometry = new THREE.BufferGeometry().setFromPoints( spinrg_points )
        spring_mesh = new THREE.Line( spring_geometry, spring_material )
        scene.add(spring_mesh)
        
    }
    
    
}

tick()