import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'
import * as CANNON from 'cannon-es'

import Stats from 'stats.js'


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
const block_transparent_material = new THREE.MeshStandardMaterial( { color: block['color'] } )
block_transparent_material.transparent = true
block_transparent_material.opacity = 0.3
const block_transparent_mesh = new THREE.Mesh( block_geometry, block_transparent_material )
block_transparent_mesh.position.y = 0.5
block_transparent_mesh.position.z = -10
scene.add(block_transparent_mesh)


// Draw Line

const line_material = new THREE.LineBasicMaterial({color: 0x0000ff,linewidth: 1})
const points = []
// points.push( new THREE.Vector3( - 10, 0, 0 ) );
// points.push( new THREE.Vector3( 0, 10, 0 ) );
// points.push( new THREE.Vector3( 10, 0, 0 ) );
const line_geometry = new THREE.BufferGeometry().setFromPoints( points )
const line = new THREE.Line( line_geometry, line_material )
scene.add( line )

const axis_line_material = new THREE.LineBasicMaterial({color: 0x000000})
const x_axis_points = []
x_axis_points.push( new THREE.Vector3( -6, 5, 0 ) )
x_axis_points.push( new THREE.Vector3( -6, 5, -20 ) )
const x_axis_points_geometry = new THREE.BufferGeometry().setFromPoints( x_axis_points )
const x_axis_line = new THREE.Line( x_axis_points_geometry, axis_line_material )
scene.add( x_axis_line )

const y_axis_points = []
y_axis_points.push( new THREE.Vector3( -6, 10, 0 ) )
y_axis_points.push( new THREE.Vector3( -6, 0, 0 ) )
const y_axis_points_geometry = new THREE.BufferGeometry().setFromPoints( y_axis_points )
const y_axis_line = new THREE.Line( y_axis_points_geometry, axis_line_material )
scene.add( y_axis_line )

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
        //console.log(z)
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
debugObject.forceEquation = 'Pe + I\u222Be + D\u0117'
force_folder.add(debugObject,'forceEquation').name('input force')
debugObject.p = 0
debugObject.i = 0
debugObject.d = 0
debugObject.mu = 0
force_folder.add(debugObject,'p').min(0).max(10).step(0.01).name('P')
force_folder.add(debugObject,'i').min(0).max(1).step(0.01).name('I')
force_folder.add(debugObject,'d').min(0).max(10).step(0.01).name('D')
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
    console.log(savedArray)
    for (const lines in savedArray)
    {       
        //console.log(lines)
        scene.remove(savedArray[lines])
    }
    savedArray.splice(0,savedArray.length)
    block_mesh.position.z = -10
    colorPosition = 0
    
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
camera.position.set(12.439935480736665,8.240888205026199, -10.796147209941118)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.target.set(-0.917419931420315,1.2614524057029373,-10.796137828106042)
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

    var this_error = -block.position
    accumulateError += this_error*timeInterval
    //console.log(elapsedTime)
    
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


        DS['inputForce'] = getInputForce(debugObject.p,debugObject.i,debugObject.d,debugObject.mu,
            -block.position,accumulateError,-block.velocity,-block.acceleration)
            
        
        updateMotion (block['mass'],DS['spring'],DS['damp'],DS['inputForce'],
    block['position'],block['velocity'],timeInterval,block_mesh,DS['externalForce'])
    // Check stable
    if (debugObject.position ==0 && debugObject.velocity == 0 & debugObject.acceleration ==0)
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