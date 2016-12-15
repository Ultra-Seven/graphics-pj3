/**
 * Created by Administrator on 2016/12/15.
 */
class SkyBox {

    constructor(config) {
        this.loadCnt = 0;
        this.loadImg = [];
        this.loadComplete = false;
        this.buffer = gl.createBuffer();
        this.data = new Float32Array([1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0, -1.0]);

        for (var imageSrc of config) {
            var image = new Image();
            image.onload = function() {
                if (++this.loadCnt < 6) {
                    return;
                }
                var texture = gl.createTexture();
                gl.activeTexture(gl.TEXTURE3);
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
                for (let i = 0; i < 6; ++i) {
                    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.loadImg[i]);
                }
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

                this.loadComplete = true;
            };
            image.src = imageSrc;
            this.loadImg.push(image);
        }

    }

    render(transform, renderShadow) {
        if (!this.loadComplete || renderShadow) {
            return;
        }
        var p = program.loadProgram(0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.data, gl.STATIC_DRAW);
        p.loadVaArgs();

        gl.uniform1i(p.args.u_Cubemap, 3);
        gl.uniform3fv(p.args.u_CameraUp, CameraPara.up.elements);
        gl.uniform3fv(p.args.u_CameraDirection, new Vector3(CameraPara.at).minus(CameraPara.eye).elements);
        gl.uniform1f(p.args.u_CameraNear, 1.5);

        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
    }
}