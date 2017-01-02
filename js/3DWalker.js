/**
 * Created by Administrator on 2016/12/13.
 */
const OFFSCREEN_WIDTH = 2048, OFFSCREEN_HEIGHT = 2048;
const LIGHT_X = 0.0, LIGHT_Y = 35.0, LIGHT_Z = 5; // Light position(x, y, z)
let solidProgram;
let texProgram;
let skyProgram;
let shadowProgram;
//model matrix
let modelMatrix;
// View matrix
let viewMatrix;
// Projection matrix
let projMatrix;
// Model view projection matrix
let mvpMatrix;
// Normal matrix
let normalMatrix;
// View projection matrix
let viewProjMatrix;
//matrix from light for shadow painting
let viewProjMatrixFromLight;
//animation frame
let animationFrame;
// eye, at, up, eye direction, right direction
let eye = new Vector3(CameraPara.eye);
let at = new Vector3(CameraPara.at);
let up = new Vector3(CameraPara.up).normalize();
let eyeDirection = VectorMinus(at, eye).normalize();
let rightDirection = VectorCross(eyeDirection, up).normalize();
// record time
let currentTime = Date.now();
let deltaTime;
// record angle
let currentAngle = 0.0;
let sky;

let fbo;
let g_mvpMatrix = new Matrix4();
const status = {
    flashlight: false,

};
const boxTexture = {
    texture: null,
    isTextureImageReady: false,
    textureUnitID: 0
};
const floorTexture = {
    texture: null,
    isTextureImageReady: false,
    textureUnitID: 1
};
//camera
const camera = new Camera(CameraPara);
const keyCodeMap = {
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
const keyStatus = {
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
document.onkeydown = function(e) {
    const keyCode = e.which || e.keyCode;
    keyStatus[keyCodeMap[keyCode]] = 1;
};
document.onkeyup = function(e) {
    const keyCode = e.which || e.keyCode;
    keyStatus[keyCodeMap[keyCode]] = 0;
};


function main() {
    const canvas = document.getElementById("webgl");
    let gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
    //init shader
    texProgram = createProgram(gl, TEXTURE_VSHADER_SOURCE, TEXTURE_FSHADER_SOURCE);
    solidProgram = createProgram(gl, SOLID_VSHADER_SOURCE, SOLID_FSHADER_SOURCE);
    skyProgram = createProgram(gl, SKYBOX_VSHADER_SOURCE, SKYBOX_FSHADER_SOURCE);
    shadowProgram = createProgram(gl, SHADOW_VSHADER_SOURCE, SHADOW_FSHADER_SOURCE);
    if (!solidProgram || !texProgram || !skyProgram || !shadowProgram) {
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
    texProgram.u_PointLightPosition = gl.getUniformLocation(texProgram, 'u_PointLightPosition');
    texProgram.u_MvpMatrixFromLight = gl.getUniformLocation(texProgram, 'u_MvpMatrixFromLight');
    texProgram.u_ShadowMap = gl.getUniformLocation(texProgram, 'u_ShadowMap');
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
    solidProgram.u_MvpMatrixFromLight = gl.getUniformLocation(solidProgram, 'u_MvpMatrixFromLight');
    solidProgram.u_ShadowMap = gl.getUniformLocation(solidProgram, 'u_ShadowMap');
    solidProgram.u_FogColor = gl.getUniformLocation(solidProgram, 'u_FogColor');
    solidProgram.u_FogDist = gl.getUniformLocation(solidProgram, 'u_FogDistance');
    //solidProgram.u_LightMat = gl.getUniformLocation(solidProgram, 'u_LightMat');
    solidProgram.u_lightPosition = gl.getUniformLocation(solidProgram, 'lightPos');

    skyProgram.a_Position = gl.getAttribLocation(skyProgram, 'a_Position');
    skyProgram.u_CameraUp = gl.getUniformLocation(skyProgram, 'u_CameraUp');
    skyProgram.u_CameraDirection = gl.getUniformLocation(skyProgram, 'u_CameraDirection');
    skyProgram.u_CameraNear = gl.getUniformLocation(skyProgram, 'u_CameraNear');
    skyProgram.u_Cubemap = gl.getUniformLocation(skyProgram, 'u_Cubemap');

    //shadow program variables
    shadowProgram.a_Position = gl.getAttribLocation(shadowProgram, 'a_Position');
    shadowProgram.u_MvpMatrix = gl.getUniformLocation(shadowProgram, 'u_MvpMatrix');
    if (shadowProgram.a_Position < 0 || !shadowProgram.u_MvpMatrix) {
        console.log('Failed to get the storage location of attribute or uniform variable from shadowProgram');
        return;
    }


    if (texProgram.a_Position < 0 || texProgram.a_TexCoord < 0
        || !texProgram.u_MvpMatrix || !texProgram.u_ModelMatrix
        || !texProgram.u_Eye || !texProgram.u_Sampler || !texProgram.u_PointLightColor
        || !texProgram.u_AmbientLight || solidProgram.a_Position < 0
        || solidProgram.a_Color < 0 || solidProgram.a_Normal < 0
        || !solidProgram.u_MvpMatrix || !solidProgram.u_NormalMatrix
        || !solidProgram.u_ModelMatrix || !solidProgram.u_AmbientLight
        || !solidProgram.u_DirectionLight || !solidProgram.u_PointLightColor
        || !solidProgram.u_PointLightPosition || !solidProgram.u_FogColor || !solidProgram.u_FogDist
        || !texProgram.u_Floor || !texProgram.u_ShadowMap || !solidProgram.u_ShadowMap || !solidProgram.u_lightPosition) {
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
    sky = new SkyBox(skyBox, gl);
    boxRes.texureObject = boxTexture;
    floorRes.texureObject = floorTexture;
    // Initialize vertex buffers for every solid article.
    for (let i = 0; i < ObjectList.length; i++) {
        ObjectList[i].model = initVertexBuffers(gl, solidProgram);
        if (!ObjectList[i].model) {
            console.log('Failed to set the vertex information in object[' + i + ']');
            return;
        }
        readOBJFile(ObjectList[i].objFilePath, gl, ObjectList[i], 1.0, true);
    }
    fbo = initFramebufferObject(gl);
    if (!fbo) {
        console.log('Failed to initialize frame buffer object');
        return;
    }
    gl.activeTexture(gl.TEXTURE9); // Set a texture object to the texture unit
    gl.bindTexture(gl.TEXTURE_2D, fbo.texture);
    // Set the clear color and enable the depth test
    //gl.clearColor(0, 0, 0, 1);
    gl.enable(gl.DEPTH_TEST);
    viewProjMatrixFromLight = new Matrix4(); // Prepare a view projection matrix for generating a shadow map
    viewProjMatrixFromLight.setPerspective(200.0, OFFSCREEN_WIDTH/OFFSCREEN_HEIGHT, 1.0, 150.0);
    viewProjMatrixFromLight.lookAt(LIGHT_X, LIGHT_Y, LIGHT_Z, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);

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

    let tick = function () {
        draw(gl, canvas);
        animationFrame = requestAnimationFrame(tick, canvas);
    };
    tick();
}
function initTextures(gl, textureObject, imagePath, program) {
    let texture = gl.createTexture();
    if (!texture) {
        console.log('Failed to create the texture object');
        return false;
    }
    textureObject.texture = texture;
    let image = new Image();
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
    let o = {};
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
function initFramebufferObject(gl) {
    let framebuffer, texture, depthBuffer;

    // Define the error handling function
    let error = function () {
        if (framebuffer) gl.deleteFramebuffer(framebuffer);
        if (texture) gl.deleteTexture(texture);
        if (depthBuffer) gl.deleteRenderbuffer(depthBuffer);
        return null;
    };

    // Create a framebuffer object (FBO)
    framebuffer = gl.createFramebuffer();
    if (!framebuffer) {
        console.log('Failed to create frame buffer object');
        return error();
    }

    // Create a texture object and set its size and parameters
    texture = gl.createTexture(); // Create a texture object
    if (!texture) {
        console.log('Failed to create texture object');
        return error();
    }
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    // Create a renderbuffer object and Set its size and parameters
    depthBuffer = gl.createRenderbuffer(); // Create a renderbuffer object
    if (!depthBuffer) {
        console.log('Failed to create renderbuffer object');
        return error();
    }
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT);

    // Attach the texture and the renderbuffer object to the FBO
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

    // Check if FBO is configured correctly
    let e = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (gl.FRAMEBUFFER_COMPLETE !== e) {
        console.log('Frame buffer object is incomplete: ' + e.toString());
        return error();
    }

    framebuffer.texture = texture; // keep the required object

    // Unbind the buffer object
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);

    return framebuffer;
}
// Create a buffer object, assign it to attribute variables, and enable the assignment
function createEmptyArrayBuffer(gl, a_attribute, num, type) {
    let buffer = gl.createBuffer();
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
    const request = new XMLHttpRequest();
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
    const objDoc = new OBJDoc(fileName);  // Create a OBJDoc object
    o.color.push(1.0); // Set color.
    objDoc.defaultColor = o.color;
    let result = objDoc.parse(fileString, scale, reverse); // Parse the file
    if (!result) {
        o.objDoc = null;
        o.drawingInfo = null;
        console.log("OBJ file parsing error.");
        return;
    }
    o.objDoc = objDoc;
}

function draw(gl, canvas) {
    gl.clearColor(0, 0, 0, 1);
    drawSkyBox(gl, canvas);
    setViewProjMatrix(canvas);
    drawShadow(gl, canvas);
    drawSolid(gl, canvas);
    drawTexture(gl, canvas, texProgram);
}
function drawShadow(gl, canvas) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);               // Change the drawing destination to FBO
    gl.viewport(0, 0, OFFSCREEN_HEIGHT, OFFSCREEN_HEIGHT); // Set view port for FBO
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);   // Clear FBO
    gl.useProgram(shadowProgram); // Set shaders for generating a shadow map

    for(let i = 0; i < ObjectList.length; i++) {
        drawObject(ObjectList[i], gl, shadowProgram, i);
        mvpMatrixFromLight[i].set(g_mvpMatrix);
    }
    drawTexture(gl, canvas, shadowProgram);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);               // Change the drawing destination to color buffer
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.DEPTH_BUFFER_BIT);    // Clear color and depth buffer
}
function calculateCameraParameters(move, rotate) {
    let deltaVector;
    const angle = rotate * Math.PI / 180.0;
    if (keyStatus.forward || keyStatus.back) {
        deltaVector = keyStatus.forward ? eyeDirection
            : VectorReverse(eyeDirection);
        deltaVector = VectorMultNum(deltaVector, move);
        at = VectorAdd(at, deltaVector);
        eye = VectorAdd(eye, deltaVector);
    }
    if (keyStatus.left || keyStatus.right) {
        deltaVector = keyStatus.right ? rightDirection
            : VectorReverse(rightDirection);
        deltaVector = VectorMultNum(deltaVector, move);
        at = VectorAdd(at, deltaVector);
        eye = VectorAdd(eye, deltaVector);
    }
    if (keyStatus.leftRotate || keyStatus.rightRotate) {
        deltaVector = keyStatus.rightRotate ? rightDirection
            : VectorReverse(rightDirection);
        deltaVector = VectorMultNum(deltaVector, Math.tan(angle));
        eyeDirection = VectorAdd(eyeDirection, deltaVector);
        eyeDirection.normalize();
        at = VectorAdd(eye, eyeDirection);
        rightDirection = VectorCross(eyeDirection, up).normalize();
    }
    if (keyStatus.up || keyStatus.down) {
        deltaVector = keyStatus.up ? up : VectorReverse(up);
        deltaVector = VectorMultNum(deltaVector, Math.tan(angle));
        eyeDirection = VectorAdd(eyeDirection, deltaVector);
        eyeDirection.normalize();
        at = VectorAdd(eye, eyeDirection);
        up = VectorCross(rightDirection, eyeDirection);
        up.normalize();
    }
}
function getElapsedTime() {
    let newTime = Date.now();
    const elapsedTime = newTime - currentTime;
    currentTime = newTime;
    return elapsedTime;
}
const fogColor = [0.1, 0.1, 0.11];
const fogDist = [70, 80];
function setViewProjMatrix(canvas) {
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
}
function drawTexture(gl, canvas, program) {
    if (program == texProgram) {
        gl.useProgram(texProgram);
        // set ambient light.
        gl.uniform1i(texProgram.u_ShadowMap, 9);
        gl.uniform3fv(texProgram.u_AmbientLight, sceneAmbientLight);
        if (keyStatus.pointLight) {
            gl.uniform3fv(texProgram.u_PointLightColor, scenePointLightColor);
        } else {
            gl.uniform3f(texProgram.u_PointLightColor, 0.0, 0.0, 0.0);
        }
        // set eye position.
        gl.uniform4f(texProgram.u_Eye, eye.elements[0], eye.elements[1], eye.elements[2], 1.0);
        // fog color
        gl.uniform3fv(texProgram.u_FogColor, fogColor);
        gl.uniform2fv(texProgram.u_FogDist, fogDist);
        gl.clearColor(fogColor[0], fogColor[1], fogColor[2], 1.0); // Color of Fog
        gl.enable(gl.DEPTH_TEST);
        //gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // clear color and depth buffer
        deltaTime = getElapsedTime();
        fogDensity();

        //draw texture article
        drawTextureArticle(boxRes, gl);
        drawTextureArticle(floorRes, gl);
    }
    else {
        if (floorRes.texureObject.isTextureImageReady) {
            initAttributeVariable(gl, shadowProgram.a_Position, floorRes.vertexBuffer);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, floorRes.indexBuffer);
            modelMatrix.setTranslate(floorRes.translate[0], floorRes.translate[1], floorRes.translate[2]);
            modelMatrix.scale(floorRes.scale[0], floorRes.scale[1], floorRes.scale[2]);
            g_mvpMatrix.set(viewProjMatrixFromLight).multiply(modelMatrix);
            //console.log(g_mvpMatrix.elements);
            gl.uniformMatrix4fv(shadowProgram.u_MvpMatrix, false, g_mvpMatrix.elements);
            gl.drawElements(gl.TRIANGLES, floorRes.numIndices, floorRes.indexBuffer.type, 0);
            mvpMatrixFromLight_floor.set(g_mvpMatrix);
        }
        //console.log("set");
        //console.log(mvpMatrixFromLight_floor.elements);
        if (boxRes.texureObject.isTextureImageReady) {
            initAttributeVariable(gl, shadowProgram.a_Position, boxRes.vertexBuffer);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boxRes.indexBuffer);
            modelMatrix.setTranslate(boxRes.translate[0], boxRes.translate[1], boxRes.translate[2]);
            modelMatrix.scale(boxRes.scale[0], boxRes.scale[1], boxRes.scale[2]);
            g_mvpMatrix.set(viewProjMatrixFromLight).multiply(modelMatrix);
            gl.uniformMatrix4fv(shadowProgram.u_MvpMatrix, false, g_mvpMatrix.elements);
            gl.drawElements(gl.TRIANGLES, boxRes.numIndices, boxRes.indexBuffer.type, 0);
            mvpMatrixFromLight_box.set(g_mvpMatrix);
        }
    }
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
        gl.uniformMatrix4fv(texProgram.u_MvpMatrixFromLight, false, mvpMatrixFromLight_floor.elements);
        //console.log(mvpMatrixFromLight_floor.elements);
    }
    else {
        gl.uniform2fv(texProgram.u_Floor, [0.0, 0.0]);
        //console.log(mvpMatrixFromLight_box.elements);
        gl.uniformMatrix4fv(texProgram.u_MvpMatrixFromLight, false, mvpMatrixFromLight_box.elements);
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
let mvpMatrixFromLight = [new Matrix4(), new Matrix4(), new Matrix4(), new Matrix4(), new Matrix4(), new Matrix4()];
let mvpMatrixFromLight_floor = new Matrix4();
let mvpMatrixFromLight_box = new Matrix4();
function drawSolid(gl, canvas) {
    // Switch shader program.
    gl.useProgram(solidProgram);
    gl.uniform1i(solidProgram.u_ShadowMap, 9);
    // If flash light is true, set scenePointLightColor to u_PointLightColor.Otherwise, use black color.
    if (status.pointLight) {
        gl.uniform3fv(solidProgram.u_PointLightColor, scenePointLightColor);
    } else {
        gl.uniform3f(solidProgram.u_PointLightColor, 0.0, 0.0, 0.0);
    }
    // set ambient light color.
    gl.uniform3fv(solidProgram.u_AmbientLight, sceneAmbientLight);
    // set the direction of light
    const directionLight = new Vector3(sceneDirectionLight);
    directionLight.normalize();
    gl.uniform3fv(solidProgram.u_DirectionLight, directionLight.elements);
    // Set point the position of light
    gl.uniform4f(solidProgram.u_PointLightPosition, eye.elements[0], eye.elements[1], eye.elements[2], 1.0);
    gl.uniform3fv(solidProgram.u_FogColor, fogColor); // fog colors
    // Starting point and end point
    gl.uniform2fv(solidProgram.u_FogDist, fogDist);
    gl.uniform3fv(solidProgram.u_lightPosition, eye.elements);
    for(let i = 0; i < ObjectList.length; i++) {
        gl.uniformMatrix4fv(solidProgram.u_MvpMatrixFromLight, false, mvpMatrixFromLight[i].elements);
        drawObject(ObjectList[i], gl, solidProgram, i);
    }
}
function drawObject(solidArticle, gl, program, i) {
    if (solidArticle.objDoc != null && solidArticle.objDoc.isMTLComplete()) {
        solidArticle.drawingInfo = onReadComplete(gl, solidArticle.model, solidArticle.objDoc);
        solidArticle.objname = solidArticle.objDoc.objects[0].name;
        solidArticle.objDoc = null;
    }
    if (solidArticle.drawingInfo) {
        modelMatrix.setIdentity();
        for (let j = 0; j < solidArticle.transform.length; j++) {
            const transform = solidArticle.transform[j];
            // Calculate model matrix for every solid article.
            if (transform.type === "translate") {
                if (solidArticle.objname === "bird") {
                    // Calculate new currentAngle to make an animation.
                    currentAngle = (currentAngle + (90.0 * deltaTime) / 1000.0) % 360.0;
                    const angle = currentAngle * Math.PI / 180.0;
                    modelMatrix.translate(10.0 * Math.sin(angle), 5.0 + 2 * Math.sin(angle * 2), 10.0 * Math.cos(angle));
                    modelMatrix.rotate(currentAngle + 180, 0.0, 1.0 , 0.0);
                    const z_angle = 45 * Math.cos(angle * 2);
                    modelMatrix.rotate(z_angle* -1 , 0.0, 0.0 , 1.0);
                    modelMatrix.rotate(currentAngle*3, 1.0, 0.0 , 0.0);
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
        if (program == solidProgram) {
            // set model matrix
            gl.uniformMatrix4fv(program.u_ModelMatrix, false, modelMatrix.elements);
            mvpMatrix.set(viewProjMatrix).multiply(modelMatrix);
            // set model view projection matrix
            gl.uniformMatrix4fv(program.u_MvpMatrix, false, mvpMatrix.elements);
            // Compute normal matrix.
            normalMatrix.setInverseOf(modelMatrix);
            normalMatrix.transpose();
            // Set normal matrix.
            gl.uniformMatrix4fv(program.u_NormalMatrix, false, normalMatrix.elements);
            // Initialize texture variables.
            initAttributeVariable(gl, program.a_Position, solidArticle.model.vertexBuffer);
            initAttributeVariable(gl, program.a_Normal, solidArticle.model.normalBuffer);
            initAttributeVariable(gl, program.a_Color, solidArticle.model.colorBuffer);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, solidArticle.model.indexBuffer);
            gl.drawElements(gl.TRIANGLES, solidArticle.drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);
        }else {
            g_mvpMatrix.set(viewProjMatrixFromLight).multiply(modelMatrix);
            gl.uniformMatrix4fv(shadowProgram.u_MvpMatrix, false, g_mvpMatrix.elements);
            initAttributeVariable(gl, shadowProgram.a_Position, solidArticle.model.vertexBuffer);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, solidArticle.model.indexBuffer);
            gl.drawElements(gl.TRIANGLES, solidArticle.drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);
        }
    }
}
function drawSkyBox(gl, canvas) {
    gl.useProgram(skyProgram);
    sky.render(modelMatrix, false, gl);
}
// OBJ File has been read compreatly
function onReadComplete(gl, model, objDoc) {
    // Acquire the vertex coordinates and colors from OBJ file
    const drawingInfo = objDoc.getDrawingInfo();

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
    const verticesCoords = new Float32Array(res.vertex);
    // Texture coordinates
    const texCoords = new Float32Array(res.texCoord);
    // Indices of the vertices
    const indices = new Uint8Array(res.index);
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
    let buffer = gl.createBuffer(); // Create a buffer object
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
    let buffer = gl.createBuffer();
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