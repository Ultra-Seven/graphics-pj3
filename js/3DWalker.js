/**
 * Created by Administrator on 2016/12/13.
 */
var solidProgram;
var texProgram;
//model matrix
var modelMatrix;
// View matrix
var viewMatrix;
// Projection matrix
var projMatrix;
// Model view projection matrix
var mvpMatrix;
// Normal matrix
var normalMatrix;
// View projection matrix
var viewProjMatrix;
//animation frame
var animationFrame;
// eye, at, up, eye direction, right direction
var eye = new Vector3(CameraPara.eye);
var at = new Vector3(CameraPara.at);
var up = new Vector3(CameraPara.up).normalize();
var eyeDirection = VectorMinus(at, eye).normalize();
var rightDirection = VectorCross(eyeDirection, up).normalize();
// record time
var currentTime = Date.now();
var deltaTime;
// record angle
var currentAngle = 0.0;
var status = {
    flashlight : false,

};
var boxTexture = {
    texture : null,
    isTextureImageReady : false,
    textureUnitID : 0
};
var floorTexture = {
    texture : null,
    isTextureImageReady : false,
    textureUnitID : 1
};
//camera
var camera = new Camera(CameraPara);
document.onkeydown = function(e) {
    var keyCode = e.which || e.keyCode;
    keyStatus[keyCodeMap[keyCode]] = 1;
};
document.onkeyup = function(e) {
    var keyCode = e.which || e.keyCode;
    keyStatus[keyCodeMap[keyCode]] = 0;
};
var keyCodeMap = {
    '87' : 'forward',
    '83' : 'back',
    '65' : 'left',
    '68' : 'right',
    '73' : 'up',
    '75' : 'down',
    '74' : 'leftRotate',
    '76' : 'rightRotate',
    '70' : 'pointLight',
    '187' : 'increaseFog',
    '189' : 'decreaseFog'
};
var keyStatus = {
    forward : 0,
    back : 0,
    left : 0,
    right : 0,
    up : 0,
    down : 0,
    leftRotate : 0,
    rightRotate : 0,
    pointLight : 0,
    increaseFog : 0,
    decreaseFog : 0
};
function main() {
    var canvas = document.getElementById("webgl");
    var gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
    //init shader
    texProgram = createProgram(gl, TEXTURE_VSHADER_SOURCE, TEXTURE_FSHADER_SOURCE);
    solidProgram = createProgram(gl, SOLID_VSHADER_SOURCE, SOLID_FSHADER_SOURCE);
    if (!solidProgram || !texProgram) {
        console.log('Failed to intialize shaders.');
        return;
    }
    // Get storage locations of attribute and uniform variables in program
    texProgram.a_Position = gl.getAttribLocation(texProgram, 'a_Position');
    texProgram.a_TexCoord = gl.getAttribLocation(texProgram, 'a_TexCoord');
    texProgram.u_MvpMatrix = gl.getUniformLocation(texProgram, 'u_MvpMatrix');
    texProgram.u_ModelMatrix = gl.getUniformLocation(texProgram, 'u_ModelMatrix');
    texProgram.u_Eye = gl.getUniformLocation(texProgram, 'u_Eye');
    texProgram.u_Sampler = gl.getUniformLocation(texProgram, 'u_Sampler');
    texProgram.u_PointLightColor = gl.getUniformLocation(texProgram, 'u_PointLightColor');
    texProgram.u_AmbientLight = gl.getUniformLocation(texProgram, 'u_AmbientLight');
    texProgram.u_FogColor = gl.getUniformLocation(texProgram, 'u_FogColor');
    texProgram.u_FogDist = gl.getUniformLocation(texProgram, 'u_FogDistance');
    texProgram.u_Floor = gl.getUniformLocation(texProgram, 'u_Floor');

    solidProgram.a_Position = gl.getAttribLocation(solidProgram, 'a_Position');
    solidProgram.a_Color = gl.getAttribLocation(solidProgram, 'a_Color');
    solidProgram.a_Normal = gl.getAttribLocation(solidProgram, 'a_Normal');
    solidProgram.u_MvpMatrix = gl.getUniformLocation(solidProgram, 'u_MvpMatrix');
    solidProgram.u_NormalMatrix = gl.getUniformLocation(solidProgram, 'u_NormalMatrix');
    solidProgram.u_ModelMatrix = gl.getUniformLocation(solidProgram, 'u_ModelMatrix');
    solidProgram.u_AmbientLight = gl.getUniformLocation(solidProgram, 'u_AmbientLight');
    solidProgram.u_DirectionLight = gl.getUniformLocation(solidProgram, 'u_DirectionLight');
    solidProgram.u_PointLightColor = gl.getUniformLocation(solidProgram, 'u_PointLightColor');
    solidProgram.u_PointLightPosition = gl.getUniformLocation(solidProgram, 'u_PointLightPosition');
    solidProgram.u_FogColor = gl.getUniformLocation(solidProgram, 'u_FogColor');
    solidProgram.u_FogDist = gl.getUniformLocation(solidProgram, 'u_FogDistance');
    if (texProgram.a_Position < 0 || texProgram.a_TexCoord < 0
        || !texProgram.u_MvpMatrix || !texProgram.u_ModelMatrix
        || !texProgram.u_Eye || !texProgram.u_Sampler || !texProgram.u_PointLightColor
        || !texProgram.u_AmbientLight || solidProgram.a_Position < 0
        || solidProgram.a_Color < 0 || solidProgram.a_Normal < 0
        || !solidProgram.u_MvpMatrix || !solidProgram.u_NormalMatrix
        || !solidProgram.u_ModelMatrix || !solidProgram.u_AmbientLight
        || !solidProgram.u_DirectionLight || !solidProgram.u_PointLightColor
        || !solidProgram.u_PointLightPosition || !solidProgram.u_FogColor || !solidProgram.u_FogDist
        || !texProgram.u_Floor) {
        console.log('Failed to get the storage location of attribute or uniform variable');
        return;
    }
    if (!initTextures(gl, boxTexture, boxRes.texImagePath, texProgram)) {
        console.log('Failed to intialize the box texture.');
        return;
    }
    if (!initTextures(gl, floorTexture, floorRes.texImagePath, texProgram)) {
        console.log('Failed to intialize the floor texture.');
        return;
    }
    initVertexBuffersForTexureObject(gl, boxRes);
    initVertexBuffersForTexureObject(gl, floorRes);
    boxRes.texureObject = boxTexture;
    floorRes.texureObject = floorTexture;
    // Initialize vertex buffers for every solid article.
    for (var i = 0; i < ObjectList.length; i++) {
        ObjectList[i].model = initVertexBuffers(gl, solidProgram);
        if (!ObjectList[i].model) {
            console.log('Failed to set the vertex information in object[' + i + ']');
            return;
        }
        readOBJFile(ObjectList[i].objFilePath, gl, ObjectList[i], 1.0, true);
    }

    // Model matrix
    modelMatrix = new Matrix4();
    // View matrix
    viewMatrix = new Matrix4();
    // Projection matrix
    projMatrix = new Matrix4();
    // Model view projection matrix
    mvpMatrix = new Matrix4();
    // Normal matrix
    normalMatrix = new Matrix4();
    // View projection matrix
    viewProjMatrix = new Matrix4();

    var tick = function() {
        draw(gl, canvas);
        animationFrame = requestAnimationFrame(tick, canvas);
    };
    tick();
}
function initTextures(gl, textureObject, imagePath, program) {
    var texture = gl.createTexture();
    if (!texture) {
        console.log('Failed to create the texture object');
        return false;
    }
    textureObject.texture = texture;
    var image = new Image();
    if (!image) {
        console.log('Failed to create the image object');
        return false;
    }
    // Register the event handler to be called when image loading is completed
    image.onload = function() {
        loadTexture(gl, textureObject, program.u_Sampler, image);
    };
    image.src = imagePath;
    return true;
}
// This function is to load texture for a textureObject.
function loadTexture(gl, textureObject, u_Sampler, image) {
    // Flip the image's y axis
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    // Enable texture unit
    gl.activeTexture(gl.TEXTURE0 + textureObject.textureUnitID);
    // Bind the texture object to the target
    gl.bindTexture(gl.TEXTURE_2D, textureObject.texture);
    // Set the texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // Set the texture image
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    // Set the isTextureImageReady to true
    textureObject.isTextureImageReady = true;
}

function initVertexBuffers(gl, program) {
    var o = new Object();
    o.vertexBuffer = createEmptyArrayBuffer(gl, program.a_Position, 3, gl.FLOAT);
    o.normalBuffer = createEmptyArrayBuffer(gl, program.a_Normal, 3, gl.FLOAT);
    o.colorBuffer = createEmptyArrayBuffer(gl, program.a_Color, 4, gl.FLOAT);
    o.indexBuffer = gl.createBuffer();
    if (!o.vertexBuffer || !o.normalBuffer || !o.indexBuffer) {
        return null;
    }
    // Unbind the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return o;
}
// Create a buffer object, assign it to attribute variables, and enable the assignment
function createEmptyArrayBuffer(gl, a_attribute, num, type) {
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log('Failed to create the buffer object');
        return null;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    // Assign the buffer object to the attribute variable
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
    // Enable the assignment
    gl.enableVertexAttribArray(a_attribute);
    // Keep the information necessary to assign to the attribute variable later
    buffer.num = num;
    buffer.type = gl.FLOAT;

    return buffer;
}
function readOBJFile(objFilePath, gl, objectList, number, b) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
        if (request.readyState === 4 && request.status !== 404) {
            onReadOBJFile(request.responseText, objFilePath, gl, objectList, number,
                b);
        }
    };
    // Create a request to acquire the file.
    request.open('GET', objFilePath, true);
    // Send the request
    request.send();
}
// OBJ File has been read
function onReadOBJFile(fileString, fileName, gl, o, scale, reverse) {
    var objDoc = new OBJDoc(fileName);  // Create a OBJDoc object
    o.color.push(1.0); // Set color.
    objDoc.defaultColor = o.color;
    var result = objDoc.parse(fileString, scale, reverse); // Parse the file
    if (!result) {
        o.objDoc = null;
        o.drawingInfo = null;
        console.log("OBJ file parsing error.");
        return;
    }
    o.objDoc = objDoc;
}
function draw(gl, canvas) {
    drawTexture(gl, canvas);
    drawSolid(gl, canvas);
}
function calculateCameraParameters(move, rotate) {
    var angle = rotate * Math.PI / 180.0;
    if (keyStatus.forward || keyStatus.back) {
        var deltaVector = keyStatus.forward ? eyeDirection
            : VectorReverse(eyeDirection);
        deltaVector = VectorMultNum(deltaVector, move);
        at = VectorAdd(at, deltaVector);
        eye = VectorAdd(eye, deltaVector);
    }
    if (keyStatus.left || keyStatus.right) {
        var deltaVector = keyStatus.right ? rightDirection
            : VectorReverse(rightDirection);
        deltaVector = VectorMultNum(deltaVector, move);
        at = VectorAdd(at, deltaVector);
        eye = VectorAdd(eye, deltaVector);
    }
    if (keyStatus.leftRotate || keyStatus.rightRotate) {
        var deltaVector = keyStatus.rightRotate ? rightDirection
            : VectorReverse(rightDirection);
        deltaVector = VectorMultNum(deltaVector, Math.tan(angle));
        eyeDirection = VectorAdd(eyeDirection, deltaVector);
        eyeDirection.normalize();
        at = VectorAdd(eye, eyeDirection);
        rightDirection = VectorCross(eyeDirection, up).normalize();
    }
    if (keyStatus.up || keyStatus.down) {
        var deltaVector = keyStatus.up ? up : VectorReverse(up);
        deltaVector = VectorMultNum(deltaVector, Math.tan(angle));
        eyeDirection = VectorAdd(eyeDirection, deltaVector);
        eyeDirection.normalize();
        at = VectorAdd(eye, eyeDirection);
        up = VectorCross(rightDirection, eyeDirection);
        up.normalize();
    }
}
function getElapsedTime() {
    var newTime = Date.now();
    var elapsedTime = newTime - currentTime;
    currentTime = newTime;
    return elapsedTime;
}
var fogColor = [0.8, 0.8, 0.8];
var fogDist = [70, 80];
function drawTexture(gl, canvas) {
    gl.useProgram(texProgram);
    // set ambient light.
    gl.uniform3fv(texProgram.u_AmbientLight, sceneAmbientLight);
    if (keyStatus.pointLight) {
        gl.uniform3fv(texProgram.u_PointLightColor, scenePointLightColor);
    } else {
        gl.uniform3f(texProgram.u_PointLightColor, 0.0, 0.0, 0.0);
    }

    // set eye position.
    gl.uniform4f(texProgram.u_Eye, eye.elements[0], eye.elements[1],
        eye.elements[2], 1.0);
    // fog color
    gl.uniform3fv(texProgram.u_FogColor, fogColor);
    gl.uniform2fv(texProgram.u_FogDist, fogDist);
    gl.clearColor(fogColor[0], fogColor[1], fogColor[2], 1.0); // Color of Fog
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // clear color and depth buffer
    deltaTime = getElapsedTime();
    fogDensity();
    // Calculate camera parameters.
    calculateCameraParameters((MOVE_VELOCITY * deltaTime) / 1000.0, (ROT_VELOCITY * deltaTime) / 1000.0);
    // Calculate the view matrix and the projection matrix
    viewMatrix.setLookAt(eye.elements[0], eye.elements[1], eye.elements[2],
        at.elements[0], at.elements[1], at.elements[2], up.elements[0],
        up.elements[1], up.elements[2]);
    projMatrix.setPerspective(CameraPara.fov, canvas.width / canvas.height,
        CameraPara.near, CameraPara.far);
    // Calculate viewProjMatrix to improve efficiency.
    viewProjMatrix.set(projMatrix).multiply(viewMatrix);

    //draw texture article
    drawTextureArticle(boxRes, gl);
    drawTextureArticle(floorRes, gl);

}
function fogDensity() {
    if (keyStatus.decreaseFog) {
        fogDist[1] ++;
    }
    else if (keyStatus.increaseFog) {
        if (fogDist[1] > fogDist[0]) {
            fogDist[1] --;
        }
    }
}
function initAttributeVariable(gl, a_attribute, buffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(a_attribute, buffer.num, buffer.type, false, 0, 0);
    gl.enableVertexAttribArray(a_attribute);
}
function drawTextureArticle(textureArticle, gl) {
    // If texture image is not loaded
    if (textureArticle == floorRes) {
        gl.uniform2fv(texProgram.u_Floor, [2.0, 2.0]);
    }
    else {
        gl.uniform2fv(texProgram.u_Floor, [0.0, 0.0]);
    }
    if (textureArticle.texureObject.isTextureImageReady) {
        // Calculate and set model matrix.
        modelMatrix.setTranslate(textureArticle.translate[0], textureArticle.translate[1], textureArticle.translate[2]);
        modelMatrix.scale(textureArticle.scale[0], textureArticle.scale[1], textureArticle.scale[2]);
        gl.uniformMatrix4fv(texProgram.u_ModelMatrix, false, modelMatrix.elements);
        // Calculate and set model view projection matrix
        mvpMatrix.set(viewProjMatrix).multiply(modelMatrix);
        gl.uniformMatrix4fv(texProgram.u_MvpMatrix, false, mvpMatrix.elements);
        // Initialize texture variables.
        initAttributeVariable(gl, texProgram.a_Position, textureArticle.vertexBuffer);
        initAttributeVariable(gl, texProgram.a_TexCoord, textureArticle.texCoordBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, textureArticle.indexBuffer);
        gl.bindTexture(gl.TEXTURE_2D, textureArticle.texureObject.texture);
        // Set the texture unit number to the sampler
        gl.uniform1i(texProgram.u_Sampler, textureArticle.texureObject.textureUnitID);
        gl.drawElements(gl.TRIANGLES, textureArticle.numIndices, textureArticle.indexBuffer.type, 0);
    }
}
function drawSolid(gl, canvas) {
    // Switch shader program.
    gl.useProgram(solidProgram);
    // If flash light is true, set scenePointLightColor to u_PointLightColor.Otherwise, use black color.
    if (status.pointLight) {
        gl.uniform3fv(solidProgram.u_PointLightColor, scenePointLightColor);
    } else {
        gl.uniform3f(solidProgram.u_PointLightColor, 0.0, 0.0, 0.0);
    }
    // set ambient light color.
    gl.uniform3fv(solidProgram.u_AmbientLight, sceneAmbientLight);
    // set the direction of light
    var directionLight = new Vector3(sceneDirectionLight);
    directionLight.normalize();
    gl.uniform3fv(solidProgram.u_DirectionLight, directionLight.elements);
    // Set point the position of light
    gl.uniform4f(solidProgram.u_PointLightPosition, eye.elements[0], eye.elements[1], eye.elements[2], 1.0);
    gl.uniform3fv(solidProgram.u_FogColor, fogColor); // fog colors
    // Starting point and end point
    gl.uniform2fv(solidProgram.u_FogDist, fogDist);
    for(var i = 0; i < ObjectList.length; i++) {
        drawObject(ObjectList[i], gl);
    }
}
function drawObject(solidArticle, gl) {
    if (solidArticle.objDoc != null && solidArticle.objDoc.isMTLComplete()) {
        solidArticle.drawingInfo = onReadComplete(gl, solidArticle.model, solidArticle.objDoc);
        solidArticle.objname = solidArticle.objDoc.objects[0].name;
        solidArticle.objDoc = null;
    }
    if (solidArticle.drawingInfo) {
        modelMatrix.setIdentity();
        for (var j = 0; j < solidArticle.transform.length; j++) {
            var transform = solidArticle.transform[j];
            // Calculate model matrix for every solid article.
            if (transform.type === "translate") {
                if (solidArticle.objname === "bird") {
                    // Calculate new currentAngle to make an animation.
                    currentAngle = (currentAngle + (90.0 * deltaTime) / 1000.0) % 360.0;
                    var angle = currentAngle * Math.PI / 180.0;
                    modelMatrix.translate(10.0 * Math.sin(angle), 5.0 + 2 * Math.sin(angle * 2), 12.0 * Math.cos(angle));
                    modelMatrix.rotate(currentAngle, 0.0, 1.0, 0.0);
                } else {
                    modelMatrix.translate(transform.content[0],
                        transform.content[1], transform.content[2]);
                }
            } else if (transform.type === "rotate") {
                modelMatrix.rotate(transform.content[0], transform.content[1], transform.content[2], transform.content[3]);
            } else if (transform.type === "scale") {
                modelMatrix.scale(transform.content[0], transform.content[1], transform.content[2]);
            }
        }
        // set model matrix
        gl.uniformMatrix4fv(solidProgram.u_ModelMatrix, false, modelMatrix.elements);
        mvpMatrix.set(viewProjMatrix).multiply(modelMatrix);
        // set model view projection matrix
        gl.uniformMatrix4fv(solidProgram.u_MvpMatrix, false, mvpMatrix.elements);
        // Compute normal matrix.
        normalMatrix.setInverseOf(modelMatrix);
        normalMatrix.transpose();
        // Set normal matrix.
        gl.uniformMatrix4fv(solidProgram.u_NormalMatrix, false, normalMatrix.elements);
        // Initialize texture variables.
        initAttributeVariable(gl, solidProgram.a_Position, solidArticle.model.vertexBuffer);
        initAttributeVariable(gl, solidProgram.a_Normal, solidArticle.model.normalBuffer);
        initAttributeVariable(gl, solidProgram.a_Color, solidArticle.model.colorBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, solidArticle.model.indexBuffer);
        gl.drawElements(gl.TRIANGLES, solidArticle.drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);
    }
}
// OBJ File has been read compreatly
function onReadComplete(gl, model, objDoc) {
    // Acquire the vertex coordinates and colors from OBJ file
    var drawingInfo = objDoc.getDrawingInfo();

    // Write date into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.normals, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.colors, gl.STATIC_DRAW);

    // Write the indices to the buffer object
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW);

    return drawingInfo;
}
// This function is to initialize vertex buffers for texture objects.
function initVertexBuffersForTexureObject(gl, res) {
    // Vertex coordinates
    var verticesCoords = new Float32Array(res.vertex);
    // Texture coordinates
    var texCoords = new Float32Array(res.texCoord);
    // Indices of the vertices
    var indices = new Uint8Array(res.index);
    res.vertexBuffer = initArrayBufferForLaterUse(gl, verticesCoords, 3, gl.FLOAT);
    res.texCoordBuffer = initArrayBufferForLaterUse(gl, texCoords, 2, gl.FLOAT);
    res.indexBuffer = initElementArrayBufferForLaterUse(gl, indices, gl.UNSIGNED_BYTE);
    // The number of vertices
    res.numIndices = indices.length;
    if (!res.vertexBuffer || !res.texCoordBuffer || !res.indexBuffer) {
        return null;
    }
    // Unbind the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}
// This function is to initialize array buffer for later use.
function initArrayBufferForLaterUse(gl, data, num, type) {
    var buffer = gl.createBuffer(); // Create a buffer object
    if (!buffer) {
        console.log('Failed to create the buffer object');
        return null;
    }
    // Write data into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    // Keep the information necessary to assign to the attribute variable later
    buffer.num = num;
    buffer.type = type;

    return buffer;
}
// This function is to initialize element array buffer for later use.
function initElementArrayBufferForLaterUse(gl, data, type) {
    // Create a buffer object
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log('Failed to create the buffer object');
        return null;
    }
    // Write data into the buffer object
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);

    buffer.type = type;

    return buffer;
}