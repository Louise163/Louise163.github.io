import * as THREE from './js/three.module.js';
// const canvas = document.querySelector("canvas");
// const ctx = canvas.getContext("2d");
// var ctx = canvas.getContext( 'webgl2', { alpha: false } );
//Resizing
// canvas.height = window.innerHeight;
// canvas.width = window.innerWidth;
// canvas.height = 500;
// canvas.width = 1000;
// canvas.height = document.documentElement.clientHeight;
// canvas.width = document.documentElement.clientWidth;  
// var ratio = canvas.height / canvas.width;
// function render() {
//     canvas.height = document.documentElement.clientHeight;
//     canvas.width = document.documentElement.clientWidth; 

// }


//variables
var press_down = false;
var points = [];
var material, geometry;
var scene, camera;
var lastPoint = null;

function get3dPointZAxis(event){
    var vec = new THREE.Vector3(
                ( event.clientX / window.innerWidth ) * 2 - 1,
                - ( event.clientY / window.innerHeight ) * 2 + 1,
                0.5 );
    var pos = new THREE.Vector3();
    vec.unproject( camera );

    vec.sub( camera.position ).normalize();
    
    var distance = - camera.position.x / vec.x;
    
    pos.copy( camera.position ).add( vec.multiplyScalar( distance ) );
    console.info("pos:");
    console.info(pos);
    return pos;
    // return vector;
 

}

export function startDraw(e) {
    press_down = true;
    console.info("start...")
    lastPoint = get3dPointZAxis(e);
    console.info(lastPoint);
    points.push(lastPoint);
    
}

export function endDraw() {
    console.info("endDraw");
    press_down = false;
    lastPoint = null;
    console.info(points);
    // ctx.beginPath();
} 


export function draw(e) {

    if (!press_down) return;
    console.info("start?...")
    if (lastPoint) {
        console.info("drawing...")
        var newPoint = get3dPointZAxis(e);
        var geometry = new THREE.Geometry();
        geometry.vertices.push(lastPoint);
        geometry.vertices.push(newPoint);
        var line = new THREE.Line( geometry, material);
        scene.add(line);
        lastPoint = newPoint;
        points.push(lastPoint);
    }
    else return;

    
}
//create a blue LineBasicMaterial
export function generateDrawing(s, c) {
    scene = s;
    camera = c;
    material = new THREE.LineBasicMaterial( { color: 0x0000ff } );  
    // console.info("hi");
    // console.info(geometry);
    document.addEventListener( 'mousemove', draw);
    document.addEventListener( 'mousedown', startDraw);
    document.addEventListener( 'mouseup', endDraw);
                  

}

export function stopDrawing() {
    document.removeEventListener('mousemove', draw);
    document.removeEventListener('mousedown', startDraw);
    document.removeEventListener('mouseup', endDraw);
}


function gradient(point1, point2) {
    return ((point1.y - point2.y)/(point1.z - point2.z));
}

// function plusOrMinus(number) {
//     if (number > 0) return 1;
//     else if (number == 0) return 0;
//     else return -1;
// }

export function controlParameter() {
    var peakPoints = [];
    for (let i = 5; i < points.length - 5; i += 5) {
        // console.info(points[i]);
        if ((gradient(points[i], points[i-5])) > 0.5 &&(gradient(points[i+5], points[i])) < -0.5) {
            peakPoints.push(points[i]);
            // console.info(peakPoints);
        }

    }
    return peakPoints;


}
//EventListeners
// canvas.addEventListener("mousedown", startPosition);
// canvas.addEventListener("mouseup", endPosition);
// canvas.addEventListener("mousemove", draw);




// window.addEventListener("resize", render);


