import * as THREE from './js/three.module.js';


//variables
var press_down = false;
var points = [];
var material, geometry;
var scene, camera;
var lastPoint = null;

// project the 2D mouse track into 3D space 
function get3dPointXAxis(event){
    var vec = new THREE.Vector3(
                ( event.clientX / window.innerWidth ) * 2 - 1,
                - ( event.clientY / window.innerHeight ) * 2 + 1,
                0.5 );
    var pos = new THREE.Vector3();
    vec.unproject( camera ); //Projects this vector from the camera's normalized device coordinate (NDC) space into world space.

    vec.sub( camera.position ).normalize();    
    var distance = - camera.position.x / vec.x;    
    pos.copy( camera.position ).add( vec.multiplyScalar( distance ) );
    return pos;
    // return vector;
 

}

// Record Drawing 
function startDraw(e) {
    press_down = true;
    lastPoint = get3dPointXAxis(e);
    points.push(lastPoint);
    
}

function endDraw() {
    press_down = false;
    lastPoint = null;
} 

function draw(e) {

    if (!press_down) return;
    if (lastPoint) {
        var newPoint = get3dPointXAxis(e);
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
//create a blue drawing line
export function generateDrawing(s, c) {
    scene = s;
    camera = c;
    material = new THREE.LineBasicMaterial( { color: 0x0000ff } );  
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


function tangent(k1, k2) {
    return (k2-k1) / (1+ k1* k2);

}

// transform position to velocity & corner detection
function pos2vec2acc(points) {
    let len = points.length;
    var ans = [];
    let vec = [], acc = [], breakingPointsIdx = [];
    for (let idx = 1; idx < len - 1; idx ++) {
        vec.push(gradient(points[idx + 1], points[idx - 1]));
    }
    // let positive = false;
    // if (vec[0] > 0)  positive = true;
    let count = 0;
    for (let idx = 8; idx < vec.length - 5; idx ++) {
        // corner detection
        let preIdx;
        if (breakingPointsIdx.length > 0) {
            preIdx = breakingPointsIdx[breakingPointsIdx.length -1];       
        }
        else {
            preIdx = 3
            // if ( vec[0] >= -0.01 && vec[idx] <= -0.1 && (idx - count >= 5) ) {
            //     console.log(idx, vec[idx]);
            //     breakingPointsIdx.push(idx);   
            //     count = idx;
            //     // positive = false;          
            // }
            // else if (vec[0] <= 0.01 && vec[idx] > 0.1 && (idx - count >= 5)) {
            //     console.log(idx, vec[idx]);
            //     breakingPointsIdx.push(idx); 
            //     count = idx; 
            //     // positive = true;   
            // }            
        }
        if (vec[preIdx] * vec[idx] == -1 && (idx - count >= 10)) {
            // perpendicuar
            count = idx;
            breakingPointsIdx.push(idx); 
        }
        else {
            let tanTheta = tangent(vec[preIdx], vec[idx]);       
            if ((tanTheta < -0.5 || tanTheta > 0.5) && (idx - count >= 10)) {
                count = idx;
                breakingPointsIdx.push(idx);
            }       
        }      
    }
    ans.push(vec);
    ans.push(breakingPointsIdx);
    return ans;
     

}


function decideSlope(idx1, idx2) {
    let slope = 0;
    let meanY = 0, meanZ = 0;
    idx2 --;
     for (let i = idx1; i < idx2; i++) {
        meanY += points[i].y;
        meanZ += points[i].z;

    }
    meanY /= (idx2 - idx1);
    meanZ /= (idx2 - idx1);
    let numerator = 0, denominator = 0; 
    for (let i = idx1; i < idx2; i++) {
        numerator += ((points[i].z - meanZ) * (points[i].y - meanY));
        denominator += ((points[i].z - meanZ) * (points[i].z - meanZ))
    }
    slope = numerator / denominator;
    let b = meanY - slope * meanZ;

    var geometry_ref = new THREE.Geometry();
    let z1 = points[idx1].z, z2 = points[idx2-1].z;
    geometry_ref.vertices.push(new THREE.Vector3(0, slope * z1 + b, z1));
    geometry_ref.vertices.push(new THREE.Vector3(0, slope * z2 + b, z2));
    material = new THREE.LineBasicMaterial( { color: 0xff0000 } ); 
    var line_ref = new THREE.Line( geometry_ref, material);
    scene.add(line_ref);
    return slope;
}



export function controlMovement(s, c) {
    scene = s;
    camera = c;
    var movementPoints = [[], [], [], []]; // death, jump, sit, dance
    var pointPoperty = pos2vec2acc(points);
    var gradients = [];
    for (let i = 0; i < pointPoperty[1].length; i ++ ) {
        let breakingPointIdx = pointPoperty[1][i];
        let j = 0;
        if (i != 0) {
            j = pointPoperty[1][i-1];
        }
        gradients.push(decideSlope(j, breakingPointIdx));    


    }
    if (pointPoperty[1].length >= 1) gradients.push(decideSlope(pointPoperty[1][pointPoperty[1].length-1], points.length-2));
    else {
        gradients.push(decideSlope(0, points.length-1));
        pointPoperty[1].push(points.length / 2);
    } 
    // iterate through gradients
    for (let j = 0; j < gradients.length; j++) {
        if (j == gradients.length - 1) {
            if (Math.abs(gradients[j]) < 0.11) {
                // dance
                if (j == 0) movementPoints[3].push(points[0]);
                else movementPoints[3].push(points[pointPoperty[1][j-1]]);
            }        
        }
        else {
            if (gradients[j] >= 1 && gradients[j + 1] <= -1) {
                // death
                movementPoints[0].push(points[pointPoperty[1][j]]);
            }
            else if (gradients[j] < 1 && gradients[j] >= 0.11 && 
                    gradients[j + 1] <= -0.11 && gradients[j + 1] > -1) {
                // jump
                movementPoints[1].push(points[pointPoperty[1][j]]);
            }
            else if (Math.abs(gradients[j]) < 0.11 && Math.abs(gradients[j + 1]) > 3.5) {
                // sit
                movementPoints[2].push(points[pointPoperty[1][j]]);
            }
            else if (Math.abs(gradients[j]) < 0.11) {
                // dance
                movementPoints[3].push(points[pointPoperty[1][j]]);
            }            
        }

    }
    
    return movementPoints;


}

// former method -- support not continous lines
// export function controlMovement() {
//     var movementPoints = [[], [], [], []];
//     var pointPoperty = pos2vec2acc(points);
//     console.info("vec & turning point", pointPoperty);
//     for (let i = 3; i < points.length - 3; i += 3) {
//         // console.log("grad", i, gradient(points[i], points[i-3]), gradient(points[i+3], points[i]));
//         // console.info(points[i]);
//         if ((gradient(points[i], points[i-3])) > 1.5 && (gradient(points[i+3], points[i])) < -1.5) {
//             // death points
//             console.log("death grad", gradient(points[i], points[i-3]), gradient(points[i+3], points[i]));
//             movementPoints[0].push(points[i]);
            
//         }
//         else if ((gradient(points[i], points[i-3])) <= 1.5 && (gradient(points[i], points[i-3])) > 0.3 && (gradient(points[i+3], points[i])) >= -1.5 && (gradient(points[i+3], points[i])) < -0.3) {
//             // jump points
//             console.log("jump grad", i, gradient(points[i], points[i-3]), gradient(points[i+3], points[i]));
//             movementPoints[1].push(points[i]);
//         }
//         else if (Math.abs(gradient(points[i], points[i-3])) <= 0.03 && vertical(points, i)) {
//             // sit points - right angle
//             console.log("sit grad", i, gradient(points[i], points[i-3]), gradient(points[i+3], points[i]));
//             movementPoints[2].push(points[i]);
            
//         }
//         else if (Math.abs(gradient(points[i], points[i-3])) <= 0.3 && Math.abs(gradient(points[i+3], points[i])) <= 0.3) {
//             // dance points - horizontal
//             movementPoints[3].push(points[i]);
//         }
//     }
//     return movementPoints;


// }

// helper function for former methods
// function vertical(points, i) {
//     let sum = 0;
//     for (let idx = i; idx < i + 3; idx++) {
//         sum += points[idx].z;
//     }
//     let avg = sum / 3;
    
//     let flag = true;
//     for (let idx = i; idx < i + 3; idx++) {
//         if (points[idx].z > avg + 0.03 || points[idx].z < avg - 0.03) flag = false;
//         if (!flag) break;
//     }
//     if (Math.abs(gradient(points[i+3], points[i])) < 2) flag = false;
//     console.info("vertical?", i, flag, "avg:", avg);
//     return flag;
// }


