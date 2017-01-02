/**
 * Created by Administrator on 2016/12/15.
 */
class SkyBox {
    constructor(config, gl) {
        this.loadCnt = 0;
        this.loadImg = [];
        this.loadComplete = false;
        this.buffer = gl.createBuffer();
        this.data = new Float32Array([1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0, -1.0]);
        for (let index = 0; index < 6; index++) {
            const image = new Image();
            image.onload = () => {
                if (++this.loadCnt < 6) {
                    return;
                }
                const texture = gl.createTexture();
                gl.activeTexture(gl.TEXTURE3);
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
                for (let i = 0; i < 6; i++) {
                    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
                    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.loadImg[i]);
                }
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                this.loadComplete = true;
            };
            image.src = config[index];
            this.loadImg[index] = image;
        }

    }

    render(transform, renderShadow, gl) {
        if (!this.loadComplete) {
            return;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.data, gl.STATIC_DRAW);

        gl.vertexAttribPointer(skyProgram.a_Position, 2, gl.FLOAT, false, 2 * Float32Array.BYTES_PER_ELEMENT, 0);
        gl.enableVertexAttribArray(skyProgram.a_Position);
        gl.uniform1i(skyProgram.u_Cubemap, 3);
        gl.uniform3fv(skyProgram.u_CameraUp, CameraPara.up.elements);

        const direction = VectorMinus(at, eye).normalize();

        gl.uniform3fv(skyProgram.u_CameraDirection, direction.elements);
        gl.uniform1f(skyProgram.u_CameraNear, 1.5);

        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.enable(gl.DEPTH_TEST);
        //gl.enable(gl.CULL_FACE);
    }
}