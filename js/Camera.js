/**
 * Created by Administrator on 2016/12/13.
 */
class Camera {
    constructor(config) {
        this.config = config;
        this.fov = config.fov;
        this.near = config.near;
        this.far = config.far;
        this.aspect = config.aspect;
        this.eye = new Vector3(config.eye);
        this.at = new Vector3(config.at);
        this.up = new Vector3(config.up).normalize();
        this.updateInfo();
    }
    getTranslationMatrix() {
        return new Matrix4()
            .perspective(this.fov, this.aspect, this.near, this.far)
            .lookAt(this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
                this.at.elements[0], this.at.elements[1], this.at.elements[2],
                this.up.elements[0], this.up.elements[1], this.up.elements[2]);
    }
    moveTo(x, y) {
        if (x == 0 && y == 0) {
            return;
        }
        var vector = new Vector3(this.eye).minus(this.at).normalize();
        var w = vector.cross(this.up);
        vector.mul(x);
        w.mul(y);
        vector.plus(w);
        this.at.minus(vector);
        this.eye.minus(vector);
        this.updateInfo();
    }
    moveCamera(x, y) {
        if (x == 0 && y == 0) {
            return;
        }

        var vector = new Vector3(this.at).minus(this.eye);
        var w = vector.cross(this.up);

        this.at.minus(new Vector3(this.up).mul(-x)).plus(new Vector3(w).mul(y));
        vector = new Vector3(this.at).minus(this.eye);
        this.at = new Vector3(this.eye).plus(vector.normalize());
        this.up = w.cross(vector).normalize();
        this.updateInfo();
    }
    updateInfo() {
        this.config.at = this.at;
        this.config.eye = this.eye;
        this.config.up = this.up;
    }
}