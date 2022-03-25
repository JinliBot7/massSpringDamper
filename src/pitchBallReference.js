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




// Reset
debugObject.reset = () =>
{
    for(const object of objectsToUpdate)
    {
        // Remove body
        object.body.removeEventListener('collide', playHitSound)
        world.removeBody(object.body)
        
        // Remove mesh
        scene.remove(object.mesh)
    }
    indicator_mesh.position.y = 10
    indicator_mesh.rotation.x = 0.5*Math.PI
    objectsToUpdate.splice(0, objectsToUpdate.length)
    tracking_mesh.position.y = 10
    tracking_mesh.position.z = 0
    flag_first_launch = false
    debugObject.velocity = 10
    debugObject.gravity = -9.81
    debugObject.pitchAngle = 0
    world.gravity.set(0, - 9.81, 0)
    debugObject.hitTime = 0
    debugObject.hitDistance = 0
    for(const object of pathToUpdate)
    {
        // Remove mesh
        scene.remove(object)

    }

    for(const object of savePathArray)
    {
        // Remove mesh
        scene.remove(object)

    }
    pathToUpdate.splice(0, pathToUpdate.length)
}


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
 * Sounds
 */
const hitSound = new Audio('./sounds/hit.mp3')

const playHitSound = (collision) =>
{
    const impactStrength = collision.contact.getImpactVelocityAlongNormal()

    if(impactStrength > 1.5)
    {
        hitSound.volume = Math.random()
        hitSound.currentTime = 0
        hitSound.play()
    }
}

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
 * Physics
 */
const world = new CANNON.World()
world.broadphase = new CANNON.SAPBroadphase(world)
world.allowSleep = true
world.gravity.set(0, - 9.81, 0)

const path_array = []

// Default material
const defaultMaterial = new CANNON.Material('default')
const defaultContactMaterial = new CANNON.ContactMaterial(
    defaultMaterial,
    defaultMaterial,
    {
        friction: 1,
        restitution: 0.5
    }
)
world.defaultContactMaterial = defaultContactMaterial

// Floor
const floorShape = new CANNON.Plane()
const floorBody = new CANNON.Body()
floorBody.mass = 0
floorBody.addShape(floorShape)
floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(- 1, 0, 0), Math.PI * 0.5) 
world.addBody(floorBody)

/**
 * Utils
 */
const objectsToUpdate = []
const pathToUpdate = []

// Create sphere
const sphereGeometry = new THREE.SphereGeometry(0.5, 20, 20)
const sphereMaterial = new THREE.MeshStandardMaterial({
    metalness: 0.3,
    roughness: 0.4,
    envMap: environmentMapTexture,
    envMapIntensity: 0.5
})
let flag_launch = false
let flag_first_launch = false
let flag_first_hit = true

const color = new THREE.Color( 0xffffff );

const createSphere = (radius, position,velocity) =>
{
    // Three.js mesh
    const color7 = new THREE.Color( Math.random(), Math.random(), Math.random() );

    color.setHex (Math.random() * 0xffffff )
    const this_material = new THREE.MeshStandardMaterial({
        metalness: 0.3,
        roughness: 0.4,
        color: color7
        //envMap: environmentMapTexture,
        //envMapIntensity: 0.5
    })
    const mesh = new THREE.Mesh(sphereGeometry, this_material)
    mesh.userData = {color:color7}
    mesh.castShadow = true
    //mesh.scale.set(radius, radius, radius)
    mesh.position.copy(position)
    scene.add(mesh)

    // Cannon.js body
    const shape = new CANNON.Sphere(radius)

    const body = new CANNON.Body({
        mass: 1*Math.pow(radius,3),
        position: new CANNON.Vec3(0, 3, 0),
        shape: shape,
        material: defaultMaterial
    })
    body.position.copy(position)
    //body.applyLocalForce(new CANNON.Vec3(0, 0, force), new CANNON.Vec3(0, 0, 0))
    const pitch_angle = indicator_mesh.rotation.x-0.5*Math.PI
    
    const horizontal_velocity = velocity*Math.cos(pitch_angle)
    const vertical_velocity = velocity*Math.sin(-pitch_angle)
    console.log(pitch_angle)

    body.velocity=new CANNON.Vec3(0, vertical_velocity, horizontal_velocity)
    body.addEventListener('collide', playHitSound)
    world.addBody(body)

    // Save in objects
    objectsToUpdate.push({ mesh, body })
    flag_launch = true
    flag_first_launch = true
    flag_first_hit = true
    path_array.splice(0, path_array.length)

}

// Create box
const boxGeometry = new THREE.BoxGeometry(1, 1, 1)
const boxMaterial = new THREE.MeshStandardMaterial({
    metalness: 0.3,
    roughness: 0.4,
    envMap: environmentMapTexture,
    envMapIntensity: 0.5
})
const createBox = (width, height, depth, position,force=0,mass=1,push=true) =>
{
    // Three.js mesh
    const mesh = new THREE.Mesh(boxGeometry, boxMaterial)
    mesh.scale.set(width, height, depth)
    mesh.castShadow = true
    mesh.position.copy(position)
    scene.add(mesh)

    // Cannon.js body
    const shape = new CANNON.Box(new CANNON.Vec3(width * 0.5, height * 0.5, depth * 0.5))

    const body = new CANNON.Body({
        mass: mass,
        position: new CANNON.Vec3(0, 3, 0),
        shape: shape,
        material: defaultMaterial
    })
    
    body.position.copy(position)
    body.applyLocalForce(new CANNON.Vec3(0, 0, force), new CANNON.Vec3(0, 0, 0))
    body.addEventListener('collide', playHitSound)
    world.addBody(body)

    // Save in objects
    if (push){
        objectsToUpdate.push({ mesh, body })
    }
    
}

//createBox(5, 20, 5, { x: 0, y: 10, z: -20 })
//createSphere(0.5, { x: 0, y: 7, z: -20 })

debugObject.velocity=10
gui.add(debugObject,'velocity').min(0).max(30).step(0.01).name('velocity').listen()
debugObject.pitchAngle = 0
const shooterRotate = (value) =>
{
    indicator_mesh.rotation.x = (0.5-value/180)*Math.PI
}
gui.add(debugObject,'pitchAngle').min(-90).max(90).step(0.01).name('pitch angle').listen().onChange(shooterRotate)
// Block Wall
createBox(10,10,1,{ x: 0, y: 5, z: 24 },0,0,false)



// Shoot Position Indicator

//const indicator_mesh = new THREE.Mesh(sphereGeometry, sphereMaterial)
const cylinderGeometry = new THREE.CylinderGeometry( 0.3, 0.5, 2, 32 );

const cylinderGeometrycolor = new THREE.Color( 0x000000 )
    const cylinderGeometr_material = new THREE.MeshStandardMaterial({
        metalness: 0.3,
        roughness: 0.4,
        color: cylinderGeometrycolor

    })



const indicator_mesh = new THREE.Mesh(cylinderGeometry, cylinderGeometr_material)
indicator_mesh.rotation.x = 0.5*Math.PI
indicator_mesh.castShadow = true
indicator_mesh.position.set(0,10,-20)
scene.add(indicator_mesh)
const tracking_mesh=indicator_mesh.clone()

tracking_mesh.position.z = 0




// Gravity

const updateGravity= (value) =>
{
    world.gravity.set(0, value, 0)
}
debugObject.gravity= -9.81

// Elapse Time
debugObject.elapsedTime = 0

// Hit Time 
debugObject.hitTime = 0

// Hit Distance
debugObject.hitDistance = 0

const savePathArray = []
// Save Path
debugObject.savePath = () => {
    //savePathArray.push(pathToUpdate[pathToUpdate.length-1])
    const save_geometry = new THREE.BufferGeometry()
    const save_line_material = new THREE.LineBasicMaterial( { color : 0xff0000 } );
    save_line_material.color = objectsToUpdate[objectsToUpdate.length-1].mesh.userData.color
    save_geometry.setFromPoints( path_array )
    const save_line = new THREE.Line( save_geometry, save_line_material )
    scene.add(save_line)
    savePathArray.push(save_line)
}


// Shoot
const shoot = () =>
{
    //createBox(1,1,1, { x: 0, y: 7, z: -20 },1000,1)
    createSphere(0.5,{ x: 0, y: indicator_mesh.position.y, z: -20 },debugObject.velocity)
}
debugObject.shootAttribute=shoot




//#region
/**
 * Floor
 */
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 50),
    new THREE.MeshStandardMaterial({
        color: '#c8f7fa',
        metalness: 0,
        roughness: 0.4,
        //envMap: environmentMapTexture,
        envMapIntensity: 0.5
    })
)
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
directionalLight.position.set(10, 10, 10)
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
camera.position.set(22*1.2,16*1.2, -0)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.target.set(-0.7,1.07,0.19)
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
//#endregion
gui.add(indicator_mesh.position,'y').name('height').min(0.5).max(20).step(0.01).listen()
gui.add(debugObject,'gravity').name('gravity').onChange(updateGravity).min(-20).max(0).step(0.01).listen()
gui.add(tracking_mesh.position,'y').name('current Y').disable().listen()
gui.add(tracking_mesh.position,'z').name('current X').disable().listen()
gui.add(debugObject,'elapsedTime').name('elapsed time').disable().listen()
gui.add(debugObject,'hitTime').name('hit time').disable().listen()
gui.add(debugObject,'hitDistance').name('hit distance').disable().listen()
gui.add(debugObject,'shootAttribute').name('shoot')
gui.add(debugObject, 'reset')
gui.add(debugObject, 'savePath')
/**
 * Animate
 */
const clock = new THREE.Clock()
let oldElapsedTime = 0

// Initial Path


const line_material = new THREE.LineBasicMaterial( { color : 0xff0000 } );
const line_geometry = new THREE.BufferGeometry()



var launchTime = 0
const tick = () =>
{
    stats.begin()
    const elapsedTime = clock.getElapsedTime()
    if (flag_launch){
        launchTime = clock.getElapsedTime()
        flag_launch = false
     }
    if (flag_first_launch == false)
    {
        debugObject.elapsedTime = 0
    }
    else{
    debugObject.elapsedTime = Math.round((elapsedTime - launchTime)*100)/100}
    const deltaTime = elapsedTime - oldElapsedTime
    oldElapsedTime = elapsedTime

    // Update physics
    world.step(1 / 60, deltaTime, 3)
    
    for(const object of objectsToUpdate)
    {
        object.mesh.position.copy(object.body.position)        
        object.mesh.quaternion.copy(object.body.quaternion)
    }


    // Update controls
    controls.update()


    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)

    // Update trackign position
    if (objectsToUpdate.length)
    {
        tracking_mesh.position.y = Math.round(objectsToUpdate[objectsToUpdate.length-1].mesh.position.y*100)/100
        tracking_mesh.position.z = Math.round((objectsToUpdate[objectsToUpdate.length-1].mesh.position.z+20)*100)/100
        
        if ((tracking_mesh.position.y - 0.5)<=0.05 && flag_first_hit)
        {
            debugObject.hitTime = debugObject.elapsedTime
            debugObject.hitDistance = tracking_mesh.position.z
            flag_first_hit = false
        
        }

        path_array.push(new THREE.Vector3(0,objectsToUpdate[objectsToUpdate.length-1].mesh.position.y,objectsToUpdate[objectsToUpdate.length-1].mesh.position.z))
        
        line_geometry.setFromPoints( path_array )
        
        line_material.color = objectsToUpdate[objectsToUpdate.length-1].mesh.userData.color
        const line = new THREE.Line( line_geometry, line_material )
        for(const object of pathToUpdate)
        {
            scene.remove(object)
    
        }
        scene.add( line )
        pathToUpdate.push(line)
        
        // get hit time

    }

    //

    stats.end()
}

tick()