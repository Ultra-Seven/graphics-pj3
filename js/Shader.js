/**
 * Created by Administrator on 2016/12/13.
 */
var TEXTURE_VSHADER_SOURCE =
    "attribute vec4 a_Position;\n" +
	"attribute vec2 a_TexCoord;\n" +
	"uniform mat4 u_MvpMatrix;\n" +
	"uniform mat4 u_ModelMatrix;\n" +
	"uniform vec4 u_Eye;\n" +
	"varying vec2 v_TexCoord;\n" +
	"varying float v_Dist;\n" +
	"void main() {\n" +
	"gl_Position = u_MvpMatrix * a_Position;\n" +
	"v_TexCoord = a_TexCoord;\n" +
	"v_Dist = distance(u_ModelMatrix * a_Position, u_Eye);\n" +
	"}\n";
var TEXTURE_FSHADER_SOURCE =
    "precision mediump float;\n" +
    "uniform sampler2D u_Sampler;\n" +
    "uniform vec3 u_PointLightColor;\n" +		// color of point light
    "uniform vec3 u_AmbientLight;\n" +			// color of ambient light
    "varying vec2 v_TexCoord;\n" +
    "varying float v_Dist;\n" +
    "uniform vec3 u_FogColor;\n" +
    "uniform vec2 u_FogDistance;\n" +
    "uniform vec2 u_Floor;\n" +
    "void main() {\n" +
    "vec4 color = texture2D(u_Sampler, v_TexCoord);\n" +
    // Calculate the color due to ambient reflection
    "vec3 ambient = u_AmbientLight * color.rgb;\n" +
    // Calculate the color due to diffuse reflection
    "vec3 diffuse = u_PointLightColor * color.rgb;\n" +
    "vec3 light = vec3(color.rgb + ambient + diffuse);\n" +
    "if (u_Floor.x < 3.0) {\n" +
    "float fog = (u_FogDistance.y - v_Dist) / (u_FogDistance.y - u_FogDistance.x);\n" +
    "gl_FragColor = vec4(mix(u_FogColor, light, clamp(fog, 0.0, 1.0)), color.a);\n" +
    "}\n" +
    "else {\n" +
    "gl_FragColor = vec4(light, color.a);\n" +
    "}\n" +
    "}\n";
var SOLID_VSHADER_SOURCE =
    "attribute vec4 a_Position;\n" +
    "attribute vec4 a_Color;\n" +
    "attribute vec4 a_Normal;\n" +
    "uniform mat4 u_MvpMatrix;\n" +				// model view projection matrix
    "uniform mat4 u_NormalMatrix;\n" +
    "uniform mat4 u_ModelMatrix;\n" +
    "uniform vec3 u_AmbientLight;\n" +
    "uniform vec3 u_DirectionLight;\n" +
    "uniform vec3 u_PointLightColor;\n" +
    "uniform vec4 u_PointLightPosition;\n" +
    "varying vec4 v_Color;\n" +
    "varying float v_Dist;\n" +
    "void main() {\n" +
    "gl_Position = u_MvpMatrix * a_Position;\n" +
    // Recalculate the normal based on the model matrix and make its length 1.
    "vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));\n" +
    // The dot product of the light direction and the normal
    "float nDotL = max(dot(normal, u_DirectionLight), 0.0);\n" +
    // Calculate the color due to diffuse reflection of directional light
    "vec3 diffuse = a_Color.rgb * nDotL;\n" +
    // world coordinate of vertex
    "vec4 vertexPosition = u_ModelMatrix * a_Position;\n" +
    // Calculate the point light direction and make it 1.0 in length
    "vec3 pointLightDirection = normalize(vec3(u_PointLightPosition - vertexPosition));\n" +
    // The dot product of the point light direction and the normal
    "float nDotL2 = max(dot(normal, pointLightDirection), 0.0);\n" +
    // Calculate the color due to diffuse reflection of point light
    "vec3 diffuse2 = u_PointLightColor * a_Color.rgb * nDotL2;\n" +
    // Calculate the color due to ambient reflection
    "vec3 ambient = u_AmbientLight * a_Color.rgb;\n" +
    // Mix ambient, diffuse, diffuse2.
    "v_Color = vec4(ambient + diffuse + diffuse2, a_Color.a);\n" +
    // Use the negative z value of each vertex in view coordinate system
    "v_Dist = gl_Position.w;\n" +
    "}\n";
var SOLID_FSHADER_SOURCE =
    "precision mediump float;\n" +
    "uniform vec3 u_FogColor;\n" +
    "uniform vec2 u_FogDistance;\n" +
    "varying vec4 v_Color;\n" +
    "varying float v_Dist;\n" +
    "void main() {\n" +
    // define fog parameter
    "float fog = (u_FogDistance.y - v_Dist) / (u_FogDistance.y - u_FogDistance.x);\n" +
    // Stronger fog as it gets further: u_FogColor * (1 - fogFactor) + v_Color * fogFactor
    "vec3 color = mix(u_FogColor, vec3(v_Color), clamp(fog, 0.0, 1.0));\n" +
    "gl_FragColor = vec4(color, v_Color.a);\n" +
    "}\n";

var SKYBOX_VSHADER_SOURCE = `
attribute vec2 a_Position;
uniform vec3 u_CameraUp;
uniform vec3 u_CameraDirection;
uniform float u_CameraNear;

varying vec3 v_Position;

void main() {
    gl_Position = vec4(a_Position, 0.0, 1.0);
    vec3 u_CameraRight = normalize(cross(u_CameraDirection, u_CameraUp));
    v_Position = a_Position[0] * u_CameraRight + a_Position[1] * u_CameraUp + u_CameraNear * u_CameraDirection;
}
`;
var SOLID_FSHADER_SOURCE = `
    varying vec3 v_Position;
    uniform samplerCube u_Cubemap;

    void main() {
      vec3 dir = normalize(v_Position);
      gl_FragColor = textureCube(u_Cubemap, vec3(-1.0, 1.0, -1.0) * dir);
    }
`;