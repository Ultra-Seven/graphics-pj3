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
    updateInfo() {
        this.config.at = this.at;
        this.config.eye = this.eye;
        this.config.up = this.up;
    }
}