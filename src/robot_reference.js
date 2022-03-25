import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import * as dat from 'lil-gui'
import { gsap } from 'gsap'

//#region Loaders

var moveFlag = false
var updateTatotalErrorFlag = true
var globalTargetConfiguration
var globalCurrentConfiguration
var globalTotalError 
var loadCompleteFlag = false



//gui.open(false)
//gui.open( gui._closed )
// Canvas
const canvas = document.querySelector('canvas.webgl')
// Scene
const scene = new THREE.Scene()
scene.background = new THREE.Color( 0xeeeeee)
const debugObject = {}
//scene.background = new THREE.Color( '#000000')

const loadingBarElement = document.querySelector('.loading-bar')


//#endregion

// Functions

function loader(gltfLoader,name){
    gltfLoader.load(
        name,
        (gltf) =>
        {   
            gltf.scene.visible=false
            scene.add(gltf.scene)
            
            console.log(name+' loaded')    
        }
    )
}

function pivot_object(x,y,z,color,name){
    //let a_pivot_object=new THREE.Mesh(new THREE.BoxGeometry(1,1,1), new THREE.MeshBasicMaterial({color: color}))
    let a_pivot_object=new THREE.Object3D()
    a_pivot_object.name=name
    scene.add(a_pivot_object)
    a_pivot_object.position.set(x,y,z)
    a_pivot_object.rotation.set(0,0,0)
    return a_pivot_object
}

function add_z_cylinder(radius,length,color){
    const geometry = new THREE.CylinderGeometry( radius, radius, length, 32 );
    const material = new THREE.MeshBasicMaterial( {color: color} );
    const cylinder = new THREE.Mesh( geometry, material );
    cylinder.position.set(0,length/2,0)
    return cylinder
}

function add_x_cylinder(radius,length,color){
    const geometry = new THREE.CylinderGeometry( radius, radius, length, 32 );
    const material = new THREE.MeshBasicMaterial( {color: color} );
    const cylinder = new THREE.Mesh( geometry, material );
    cylinder.rotation.x=(Math.PI/2)
    cylinder.position.set(0,0,length/2)
    return cylinder
}

function add_y_cylinder(radius,length,color){
    const geometry = new THREE.CylinderGeometry( radius, radius, length, 32 );
    const material = new THREE.MeshBasicMaterial( {color: color} );
    const cylinder = new THREE.Mesh( geometry, material );
    cylinder.rotation.z=(-Math.PI/2)
    cylinder.position.set(length/2,0,0)
    return cylinder
}

function add_axis (pivot,radius,length){
    // X axis
    const x_color='#FF0000'
    const x_cylinder=add_x_cylinder(radius,length,x_color)
    x_cylinder.name='axis'
    scene.add(x_cylinder)
    pivot.add(x_cylinder)

    // Y axis
    const y_color='#00FF00'
    const y_cylinder=add_y_cylinder(radius,length,y_color)
    y_cylinder.name='axis'
    scene.add(y_cylinder)
    pivot.add(y_cylinder)

    // Z axis
    const z_color='#0000FF'
    const z_cylinder=add_z_cylinder(radius,length,z_color)
    z_cylinder.name='axis'
    scene.add(z_cylinder)
    pivot.add(z_cylinder)
}
    





function get_name(this_object){
    const name_array=[]
    for (let i=0;i<this_object.children.length;i++){
        
        name_array.push(this_object.children[i].name)
    }
    
}

const log_scene_components = () =>
{
    scene.traverse((child) =>
    {   
        console.log(child)
    })
}



const set_rotation_by_name = () =>
{
    scene.traverse((child) =>
    {   
        if(child instanceof THREE.Mesh)
        {   var vector_world = new THREE.Vector3()
            child.getWorldPosition(vector_world)
            
        }
    })
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const manager = new THREE.LoadingManager()
const gltfLoader = new GLTFLoader(manager)
const dracoLoader = new DRACOLoader(manager)
dracoLoader.setDecoderPath('./draco/')
gltfLoader.setDRACOLoader(dracoLoader)

//Pivot Points



//Load Models
loader(gltfLoader,'./glb/Base.glb')
loader(gltfLoader,'./glb/Joint1.glb')
loader(gltfLoader,'./glb/Link1.glb')
loader(gltfLoader,'./glb/Link2.glb')
loader(gltfLoader,'./glb/Link3.glb')
loader(gltfLoader,'./glb/Link4.glb')
loader(gltfLoader,'./glb/Clamp.glb')

// Material
const cubeTextureLoader = new THREE.CubeTextureLoader(manager)
const environmentMapTexture = cubeTextureLoader.load([
    './textures/environmentMaps/0/px.jpg',
    './textures/environmentMaps/0/nx.jpg',
    './textures/environmentMaps/0/py.jpg',
    './textures/environmentMaps/0/ny.jpg',
    './textures/environmentMaps/0/pz.jpg',
    './textures/environmentMaps/0/nz.jpg'
])
//environmentMapTexture.encoding=THREE.sRGBEncoding

const test_material = new THREE.MeshStandardMaterial()
test_material.metalness = 1
test_material.roughness = 0.2

test_material.envMap = environmentMapTexture




manager.onLoad = function ( ) {
    
    window.setTimeout(() =>
        {
            // Animate overlay
            gsap.to(overlayMaterial.uniforms.uAlpha, { duration: 1, value: 0, delay: 0.5 })
            
            // Update loadingBarElement
            // loadingBarElement.classList.add('ended')
            // loadingBarElement.style.transform = ''
        }, 700)
    loadingBarElement.classList.add('ended')
    loadingBarElement.style.transform = ''
    loadCompleteFlag = true
    const gui = new dat.GUI({ touchStyles: false })
    
    
    const pivot_color='#68b0f9'

    const pivot1=pivot_object(0,0,0,pivot_color,'pivot1')
    const pivot2=pivot_object(0,17.5,1.5,pivot_color,'pivot2')
    const pivot3=pivot_object(10.3,10.9,9,pivot_color,'pivot3')
    const pivot4=pivot_object(-0.2,0.1,-35,pivot_color,'pivot4')
    const pivot5=pivot_object(-8.3,19.02,28.135,pivot_color,'pivot5')
    const pivot6=pivot_object(0,0,10.2,pivot_color,'pivot6')
    const pivot7=pivot_object(0,0,4.5,pivot_color,'pivot7')
    const pivot8=pivot_object(0,0,13,pivot_color,'pivot8')
    
    //pivot8.matrixAutoUpdate=true

    

    // Load Objects
    var Base = scene.getObjectByName('BASE_NM')
    var Joint1_group = scene.getObjectByName('Joint1')
    var Link1 = scene.getObjectByName('Link1')
    var Joint2_Link2_Group = scene.getObjectByName('Joint2')
    var Link3 = scene.getObjectByName('Joint3')
    var Link4 = scene.getObjectByName('Link4')
    var Clamp1 = scene.getObjectByName('Clamp')
    var Clamp2 = Clamp1.clone()
    Clamp2.name='Clamp2'
    Clamp2.rotation.z=Math.PI
    
    const object_list=[Base,Joint1_group,Link1,Joint2_Link2_Group,Link3,Link4,Clamp1,Clamp2]


    pivot1.add(pivot2)
    pivot2.add(pivot3)
    pivot3.add(pivot4)
    pivot4.add(pivot5)
    pivot5.add(pivot6)
    pivot6.add(pivot7)
    pivot6.add(pivot8)
    const axis_width=0.3
    const axis_length=8
    add_axis(pivot1,axis_width,axis_length)
    add_axis(pivot2,axis_width,axis_length)
    add_axis(pivot3,axis_width,axis_length)
    add_axis(pivot4,axis_width,axis_length)
    add_axis(pivot5,axis_width,axis_length)
    add_axis(pivot6,axis_width,axis_length)
    add_axis(pivot8,axis_width,axis_length)
    
    //cylinder.rotation.x=(Math.PI/2)
    
    debugObject.pivot2DegreeAngle = 0
    const pivot2RadianToDegree = (value) => {
        pivot2.rotation.y = value/180*Math.PI
        update_EF_Position()}
    debugObject.pivot3DegreeAngle = 0
    const pivot3RadianToDegree = (value) => {pivot3.rotation.x = value/180*Math.PI;update_EF_Position()}
    debugObject.pivot4DegreeAngle = 0
    const pivot4RadianToDegree = (value) => {pivot4.rotation.x = value/180*Math.PI;update_EF_Position()}
    debugObject.pivot5DegreeAngle = 0
    const pivot5RadianToDegree = (value) => {pivot5.rotation.x = value/180*Math.PI;update_EF_Position()}
    debugObject.pivot6DegreeAngle = 0
    const pivot6RadianToDegree = (value) => {pivot6.rotation.z = value/180*Math.PI;update_EF_Position()}  
    
    const updateDebug2 = () => {debugObject.pivot2DegreeAngle = pivot2.rotation.y/Math.PI*180}
    const updateDebug3 = () => {debugObject.pivot3DegreeAngle = pivot3.rotation.x/Math.PI*180}
    const updateDebug4 = () => {debugObject.pivot4DegreeAngle = pivot4.rotation.x/Math.PI*180}
    const updateDebug5 = () => {debugObject.pivot5DegreeAngle = pivot5.rotation.x/Math.PI*180}
    const updateDebug6 = () => {debugObject.pivot6DegreeAngle = pivot6.rotation.z/Math.PI*180}


    const pivot_folder = gui.addFolder( 'Pivots' )
    pivot_folder.add(debugObject,'pivot2DegreeAngle').min(-180).max(180).step(0.01).name('Joint 1').onChange(pivot2RadianToDegree).listen()
    pivot_folder.add(debugObject,'pivot3DegreeAngle').min(0).max(180).step(0.01).name('Joint 2').listen().onChange(pivot3RadianToDegree)
    pivot_folder.add(debugObject,'pivot4DegreeAngle').min(-180).max(1/16*180).step(0.01).name('Joint 3').listen().onChange(pivot4RadianToDegree)
    pivot_folder.add(debugObject,'pivot5DegreeAngle').min(- 180).max(180).step(0.01).name('Joint 4').listen().onChange(pivot5RadianToDegree)
    pivot_folder.add(debugObject,'pivot6DegreeAngle').min(- 180).max(180).step(0.01).name('Joint 5').listen().onChange(pivot6RadianToDegree)
    const clampOpenObject = {clampOpenAttribute:0}
    function changeClamp(value)
    {
        Clamp1.position.x=value
        Clamp2.position.x=-value
    }
    pivot_folder.add(clampOpenObject,'clampOpenAttribute').min(0).max(3).step(0.01).onChange(changeClamp).name('Clamp')
    // pivot_folder.add(pivot1.position,'z').min(-30).max(30).step(0.01).name('Base x').onChange(update_EF_Position)
    // pivot_folder.add(pivot1.position,'x').min(-30).max(30).step(0.01).name('Base y').onChange(update_EF_Position)
    

    // EF position
    const EF_Object = {EF_String: 'x:26.84 y: 1.8 z: 47.52'}
    pivot_folder.add( EF_Object, 'EF_String').listen().disable().name('EF Position')
 

    function update_EF_Position(){
        const EF_position = new THREE.Vector3()
        pivot8.getWorldPosition(EF_position)
        const EF_postion_x = Math.round(EF_position.z * 100) / 100
        const EF_postion_y = Math.round(EF_position.x * 100) / 100
        const EF_postion_z = Math.round(EF_position.y * 100) / 100
        EF_Object.EF_String='x: '+`${EF_postion_x}`+' y: ' + `${EF_postion_y}`+' z: ' + `${EF_postion_z}`

    }
    
    



    // Change Transparency
 
    function changeTransparency(value){
        object_list.forEach(function (item, index) {
            item.material.transparent = true
            item.material.opacity=value
            transparencyObject.transparency = value
          })}
    const transparencyObject = {transparency:1}
    //pivot_folder.add(transparencyObject,'transparency').min(0).max(1).step(0.01).name('Transparency').onChange(changeTransparency).listen()

    // Show Axis
    const showAxis ={axisVisbleObject:false}
    function axisVisibleFunction (value){
        if (value==false){
            changeTransparency(1)
            const pivot_list=[pivot1,pivot2,pivot3,pivot4,pivot5,pivot6,pivot8]
            pivot_list.forEach(child => child.traverse((child) =>
            {   
                if (child.name=='axis'){
                    child.visible=value
                }
            }))
        }
        if (value==true){
            changeTransparency(0.5)
            const pivot_list=[pivot1,pivot2,pivot3,pivot4,pivot5,pivot6,pivot8]
            pivot_list.forEach(child => child.traverse((child) =>
            {   
                if (child.name=='axis'){
                    child.visible=value
                }
            }))
        }
        
    }
    axisVisibleFunction(false)
    pivot_folder.add(showAxis,'axisVisbleObject').onChange(axisVisibleFunction).name('Axis Visible')
    

    // Get EF position

    //Reset Position
    const reset_object= {reset: function(){
        pivot1.position.set(0,0,0)
        Clamp1.position.x=0
        Clamp2.position.x=0
        const pivot_list=[pivot1,pivot2,pivot3,pivot4,pivot5,pivot6,pivot8]
        pivot_list.forEach(child => child.rotation.set(0,0,0))
        update_EF_Position()
        updateDebug2()
        updateDebug3()
        updateDebug4()
        updateDebug5()
        updateDebug6()
        

    }}
    pivot_folder.add( reset_object, 'reset' ).name('Visible').onChange(reset_object).name('Home Position')
    //pivot_folder.open( false )
    // const pivot_list=[pivot1,pivot2,pivot3,pivot4,pivot5,pivot6]
    // pivot_list.forEach(function (item, index) {
    //     item.visible=false
    //     item.children.forEach(child =>(child.visible=true))

    //   })


	console.log( 'Loading complete!')
    //log_scene_components()    
    
    
    // BASE
    
    pivot1.add(Base)

    Base.material=test_material.clone()
    Base.material.color=new THREE.Color('#000000')
    const colorFormats0 = {string: '#000000'}
    
    function changeBaseColor(value){
        Base.material.color=new THREE.Color(value)
    }

    

    // Joint 1

    pivot2.add(Joint1_group)

    

    Joint1_group.material=test_material.clone()
    Joint1_group.material.color=new THREE.Color('#ffffff')
    const colorFormats1 = {string: '#ffffff'}
    function changeJoint1Color(value){
        Joint1_group.material.color=new THREE.Color(value)
    }

    
    // Link 1
    pivot3.add(Link1)
    

    Link1.material=test_material.clone()
    Link1.material.color=new THREE.Color('#ff2424')
    const colorFormats2 = {string: '#ff2424'}
    function changeLink1Color(value){
        Link1.material.color=new THREE.Color(value)
    }

    
    // Joint 2 Link 2 Group
    pivot4.add(Joint2_Link2_Group)
    


    Joint2_Link2_Group.material=test_material.clone()
    Joint2_Link2_Group.material.color=new THREE.Color('#0a8dff')
    const colorFormats3 = {string: '#0a8dff'}
    function changeJ2L2Color(value){
        Joint2_Link2_Group.material.color=new THREE.Color(value)
    }
    
    // Joint 3 Link 3 Group

    pivot5.add(Link3)

    Link3.material=test_material.clone()
    const colorFormats4 = {string: '#91ff24'}
    Link3.material.color=new THREE.Color('#91ff24')
    function changeJ3L3Color(value){
        Link3.material.color=new THREE.Color(value)
    }
    
    // Link 4
    pivot6.add(Link4)


    Link4.material=test_material.clone()
    const colorFormats5 = {string: '#f8308a'}
    Link4.material.color=new THREE.Color('#f8308a')
    function changeJ4L4Color(value){
        Link4.material.color=new THREE.Color(value)
    }

    // Clamp
    pivot7.add(Clamp1)
    pivot7.add(Clamp2)

    Clamp1.material=Clamp2.material=test_material.clone()
    const colorFormats6 = {string: '#000000'}
    Clamp1.material.color=Clamp2.material.color=new THREE.Color('#000000')
    function changeClampColor(value){
        Clamp1.material.color=new THREE.Color(value)
        Clamp2.material.color=new THREE.Color(value)
    }



    // Update metalness and roughness



    function changeAllMetalness(value){
        object_list.forEach(function (item, index) {
            item.material.metalness=value
          })}
   
    function changeAllroughness(value){
    object_list.forEach(function (item, index) {
        item.material.roughness=value
        })}

    function setVisible(value){
        object_list.forEach(function (item, index) {
            item.visible=value
            })}
    

    // const directionalLight = new THREE.DirectionalLight('#ffffff', 3)
    // directionalLight.castShadow = true
    // directionalLight.shadow.mapSize.set(1024, 1024)
    // directionalLight.shadow.normalBias = 0.05
    // directionalLight.position.set(0.8, 0.8, 0)
    // scene.add(directionalLight)
    // const light_folder = gui.addFolder( 'Light' )
    // light_folder.add(directionalLight, 'intensity').min(0).max(5).step(0.001).name('lightIntensity')
    // light_folder.add(directionalLight.position, 'x').min(- 5).max(5).step(0.001).name('lightX')
    // light_folder.add(directionalLight.position, 'y').min(- 5).max(5).step(0.001).name('lightY')
    // light_folder.add(directionalLight.position, 'z').min(- 5).max(5).step(0.001).name('lightZ')
    

    /*
    *******************************************************************
    Save Position
    *******************************************************************
    */

    // Save Button
    const position_folder = gui.addFolder( 'Target position' )
    
    const targetPositionArrary = []
    var savedPositionCount = 0
    

    var samePositionFlag = false
    debugObject.savePosition = () =>
    {   
        const currentPosition = {jointAngle : [pivot2.rotation.y, pivot3.rotation.x, pivot4.rotation.x,
        pivot5.rotation.x,pivot6.rotation.z], name : 'savedPosition'+`${savedPositionCount}`}

        
        // Check whether same position
        if (targetPositionArrary.length == 0)
        {   
            
            createPosition(savedPositionCount)
            targetPositionArrary.push(currentPosition)
            savedPositionCount += 1
        }

        else
        {   // Change samePositionFlag
            
            targetPositionArrary.forEach((value) => 
                {   
                    
                    const thisErrorvector = minusVector(value.jointAngle,currentPosition.jointAngle)
                    if (absoluteValue(thisErrorvector)<0.1/180*Math.PI)
                    {   
                        alert('Same configuration! Please move the robot before saving the configuration.')
                        samePositionFlag = true
                        
                    }    
                })
            if (samePositionFlag == false)
            {   
                createPosition(savedPositionCount)
                targetPositionArrary.push(currentPosition)
                savedPositionCount += 1
            }
            // Reset flag
            samePositionFlag = false
        }
        


        
        
        
    }
    position_folder.add(debugObject,'savePosition').name('save configuration')

    debugObject.cleanConfiguration = () =>
    {   const configurationGUIarrary = position_folder.children
        for (var i = 0; i<savedPositionCount;i++)
        {
            configurationGUIarrary.forEach(value => 
                { 
                    if (value._name == 'Configuration '+`${i}`)
                    {   console.log('destroy')
                        value.destroy()
                    }
                })
        }
        targetPositionArrary.splice(0,targetPositionArrary.length)
        savedPositionCount = 0
    }
    position_folder.add(debugObject,'cleanConfiguration').name('clean configuration')
    debugObject.robotSpeed = 5
    position_folder.add(debugObject,'robotSpeed').name('speed').min(1).max(10).step(0.01)

    debugObject.accelerationBandwidth = 1
    position_folder.add(debugObject,'accelerationBandwidth').name('bandwidth').min(0).max(1).step(0.01)

    // Create a series of function
    for (let i = 0; i<20; i++)
    {
        debugObject['moveFunction'+`${i}`] = () =>
        {   
            const currentPosition = {jointAngle : [pivot2.rotation.y, pivot3.rotation.x, pivot4.rotation.x,
                pivot5.rotation.x,pivot6.rotation.z], name : 'savedPosition'+`${savedPositionCount}`}
            const targetPostion = targetPositionArrary[i]
            const ErrorVector = minusVector(targetPostion.jointAngle,currentPosition.jointAngle)
            if (absoluteValue(ErrorVector)<0.1/180*Math.PI)
            {
                alert('The robot is already in this configuration!')
            }
            else 
            {   
                moveFlag = true
                globalTargetConfiguration = targetPostion.jointAngle
                
            }


        }
    }

    // Move function
    
 
    
    const createPosition = (value) => 
    {      
        // Create a function
        position_folder.add(debugObject,'moveFunction'+`${value}`).name('Configuration '+`${value}`)
        // Create a function

    }


    

    // Color Folder
    const color_folder = gui.addFolder( 'Appearence' )
    color_folder.addColor( colorFormats0, 'string' ).onChange(changeBaseColor).name('Base')
    color_folder.addColor( colorFormats1, 'string' ).onChange(changeJoint1Color).name('Joint 1')
    color_folder.addColor( colorFormats2, 'string' ).onChange(changeLink1Color).name('Link 1')
    color_folder.addColor( colorFormats3, 'string' ).onChange(changeJ2L2Color).name('Joint 2 Link 2')
    color_folder.addColor( colorFormats4, 'string' ).onChange(changeJ3L3Color).name('Joint 3 Link 3')
    color_folder.addColor( colorFormats5, 'string' ).onChange(changeJ4L4Color).name('Joint 4 Link 4')
    color_folder.addColor( colorFormats6, 'string' ).onChange(changeClampColor).name('Clamp')
    color_folder.add(test_material, 'metalness').min(0).max(1).step(0.0001).onChange(changeAllMetalness)
    
    color_folder.add(test_material, 'roughness').min(0).max(1).step(0.0001).onChange(changeAllroughness)
    color_folder.add(renderer, 'toneMappingExposure').min(0).max(10).step(0.001)
    color_folder.open( false )

    const clock = new THREE.Clock()
    
    const tick_afterload = () =>
    {   
        const elapsedTime = clock.getElapsedTime()

        // Update controls
        controls.update()
        
        if (moveFlag == true)
        {   
            if (updateTatotalErrorFlag == true)
            {
                globalCurrentConfiguration = [pivot2.rotation.y, pivot3.rotation.x, pivot4.rotation.x,
                    pivot5.rotation.x,pivot6.rotation.z]
                globalTotalError = minusVector(globalTargetConfiguration,globalCurrentConfiguration)
                updateTatotalErrorFlag = false
            }
            globalCurrentConfiguration = [pivot2.rotation.y, pivot3.rotation.x, pivot4.rotation.x,
                pivot5.rotation.x,pivot6.rotation.z]
            const currentErrorVector = minusVector(globalTargetConfiguration,globalCurrentConfiguration)
            const ratio = divideVector(currentErrorVector,globalTotalError)
            const cosinedRatio = getCosineRatio(ratio)
            const speed = 0.001*debugObject.robotSpeed

            
            if (absoluteValue(currentErrorVector)>0.1/180*Math.PI)
            { 
                pivot2.rotation.y += speed*globalTotalError[0]*cosinedRatio[0]
                pivot3.rotation.x += speed*globalTotalError[1]*cosinedRatio[1]
                pivot4.rotation.x += speed*globalTotalError[2]*cosinedRatio[2]
                pivot5.rotation.x += speed*globalTotalError[3]*cosinedRatio[3]
                pivot6.rotation.z += speed*globalTotalError[4]*cosinedRatio[4]
                update_EF_Position()
                updateDebug2()
                updateDebug3()
                updateDebug4()
                updateDebug5()
                updateDebug6()

                const configurationGUIarrary = position_folder.children
                for (var i = 0; i<savedPositionCount;i++)
                {
                    configurationGUIarrary.forEach(value => 
                        { 
                            if (value._name == 'Configuration '+`${i}`)
                            { 
                                value.disable()
                            }
                        })
                }

            }
            else {
                
                moveFlag = false
                updateTatotalErrorFlag = true
                const configurationGUIarrary = position_folder.children
                for (var i = 0; i<savedPositionCount;i++)
                {
                    configurationGUIarrary.forEach(value => 
                        { 
                            if (value._name == 'Configuration '+`${i}`)
                            {   
                                value.enable()
                            }
                        })
                }
                alert('The robot reached target position')
            }
            // console.log('current'+globalCurrentConfiguration)
            // console.log('target'+globalTargetConfiguration)
            
        }

        // Render
        renderer.render(scene, camera)

        // Call tick again on the next frame
        window.requestAnimationFrame(tick_afterload)
    }
    tick_afterload()






    function minusVector(a,b){
        return a.map((e,i) => e - b[i]);
    }

    function multiplyVector(a,b){
        return a.map((e,i) => e * b[i]);
    }

    function divideVector(a,b){
        const result = []
        a.forEach((value,index)=>{
            if (b[index] == 0)
            {
                result.push(0)
            }
            else 
            {
                result.push(value/b[index])
            }
        })
        return result
    }
    
    function absoluteValue(array){
        var result = 0
        array.forEach(element =>{result += Math.abs(element)})
        return result
    }

    function getCosineRatio (ratioArray)
    {   const result = []
        var thisRatio = 0
        ratioArray.forEach(value=>{
            thisRatio = Math.cos((-value+0.5)*Math.PI*0.5*1.95*(debugObject.accelerationBandwidth)) //(-{1,0}+0.5)*0.5*1.5 = {-0.25,0.25}*1.5 
            result.push(thisRatio)
        })
        return result
    }
        

    //
};




// Block Scene

const overlayGeometry = new THREE.PlaneGeometry(2, 2, 1, 1)
const overlayMaterial = new THREE.ShaderMaterial({
    // wireframe: true,
    transparent: true,
    uniforms:
    {
        uAlpha: { value: 1 }
    },
    vertexShader: `
        void main()
        {
            gl_Position = vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float uAlpha;

        void main()
        {
            gl_FragColor = vec4(0.0, 0.0, 0.0, uAlpha);
        }
    `
})
const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial)
scene.add(overlay)











//#region
/**
 * Loader Manager
 */
 manager.onProgress = function ( url, itemsLoaded, itemsTotal ) {

    
    const progressRatio = itemsLoaded / itemsTotal
    loadingBarElement.style.transform = `scaleX(${progressRatio})`
	//console.log( 'Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
    const tick = () =>
    {   
        if (loadCompleteFlag == false)
        {
            controls.update()

            // Render
            renderer.render(scene, camera)
            
            window.requestAnimationFrame(tick)
        }
        // Update controls
        
        
    }

    tick()

};

manager.onError = function ( url ) {

	console.log( 'There was an error loading ' + url );

};

/**
 * Lights
 */
 const directionalLight = new THREE.DirectionalLight('#ffffff', 3)
 directionalLight.castShadow = true
 //directionalLight.shadow.camera.far = 15
 directionalLight.shadow.mapSize.set(1024, 1024)
 directionalLight.shadow.normalBias = 0.05
 //directionalLight.position.set(0.2, 0.7, 1.3)
 directionalLight.position.set(0.8, 0.8, 0)
 scene.add(directionalLight)
 



// Sizes
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

// Window resize
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
 * Floor
 */

 const textureLoader = new THREE.TextureLoader(manager)
 const texture_floor = textureLoader.load('./textures/gray-tiles-textures-background_74190-3744.jpg')
 const material_floor = new THREE.MeshBasicMaterial({ map: texture_floor })
 const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    material_floor
)
floor.receiveShadow = true
floor.rotation.x = - Math.PI * 0.5
scene.add(floor)

// Camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 300)
camera.position.x = 54
camera.position.y = 51
camera.position.z = -6.7

//camera.lookAt(test_object.position)

scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.target.set(-10,19,-9)


//Render
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.physicallyCorrectLights = true
renderer.outputEncoding = THREE.sRGBEncoding
renderer.toneMapping = THREE.ReinhardToneMapping
renderer.toneMappingExposure = 3
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// gui
//     .add(renderer, 'toneMapping', {
//         No: THREE.NoToneMapping,
//         Linear: THREE.LinearToneMapping,
//         Reinhard: THREE.ReinhardToneMapping,
//         Cineon: THREE.CineonToneMapping,
//         ACESFilmic: THREE.ACESFilmicToneMapping
//     })
//     .onFinishChange(() =>
//     {
//         renderer.toneMapping = Number(renderer.toneMapping)
//         updateAllMaterials()
//     })



// Animation

//#endregion

