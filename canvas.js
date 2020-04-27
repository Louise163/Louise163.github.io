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
function pos2vec2acc(points) {
    let len = points.length;
    var ans = [];
    let vec = [], acc = [];
    for (let idx = 1; idx < len - 1; idx ++) {
        vec.push(gradient(points[idx + 1], points[idx - 1]));
    }
    for (let idx = 0; idx < vec.length - 1; idx ++) {
        acc.push(gradient(vec[idx + 1], vec[idx]));
    }
    ans.push(vec);
    ans.push(acc);
    return ans;
     

}
function vertical(points, i) {
    let sum = 0;
    for (let idx = i; idx < i + 3; idx++) {
        sum += points[idx].z;
    }
    let avg = sum / 3;
    
    let flag = true;
    for (let idx = i; idx < i + 3; idx++) {
        if (points[idx].z > avg + 0.03 || points[idx].z < avg - 0.03) flag = false;
        if (!flag) break;
    }
    console.info("vertical?", i, flag, "avg:", avg);
    return flag;
}
export function controlMovement() {
    var movementPoints = [[], [], [], []];
    pointPoperty = pos2vec2acc(points);
    for (let i = 3; i < points.length - 3; i += 3) {
        console.log("grad", gradient(points[i], points[i-3]), gradient(points[i+3], points[i]));
        // console.info(points[i]);
        if ((gradient(points[i], points[i-3])) > 1 && (gradient(points[i+3], points[i])) < -1) {
            // death points
            console.log("death grad", gradient(points[i], points[i-3]), gradient(points[i+5], points[i]));
            movementPoints[0].push(points[i]);
            
        }
        else if ((gradient(points[i], points[i-3])) <= 1 && (gradient(points[i], points[i-3])) > 0.3 && (gradient(points[i+3], points[i])) >= -1 && (gradient(points[i+3], points[i])) < -0.3) {
            // jump points
            console.log("jump grad", i, gradient(points[i], points[i-3]), gradient(points[i+3], points[i]));
            movementPoints[1].push(points[i]);
        }
        else if ((gradient(points[i], points[i-3])) <= 0.03 && (gradient(points[i], points[i-3])) >= -0.03 && vertical(points, i)) {
            // sit points - right angle
            console.log("sit grad", i, gradient(points[i], points[i-3]), gradient(points[i+3], points[i]));
            movementPoints[2].push(points[i]);
            
        }
        else if ((gradient(points[i], points[i-3])) <= 0.3 && (gradient(points[i], points[i-3])) >= 0 && (gradient(points[i+3], points[i])) >= -0.3 && (gradient(points[i+3], points[i])) < 0) {
            // wave points - arc
            movementPoints[3].push(points[i]);
        }
    }
    return movementPoints;


}
//EventListeners
// canvas.addEventListener("mousedown", startPosition);
// canvas.addEventListener("mouseup", endPosition);
// canvas.addEventListener("mousemove", draw);




// window.addEventListener("resize", render);


