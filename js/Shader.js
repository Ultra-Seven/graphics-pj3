/**
* Created by Administrator on 2016/12/13.
*/
const TEXTURE_VSHADER_SOURCE =
    "attribute vec4 a_Position;\n" +
    "attribute vec2 a_TexCoord;\n" +
    "uniform mat4 u_MvpMatrix;\n" +
    "uniform mat4 u_ModelMatrix;\n" +
    "uniform vec4 u_Eye;\n" +
    "varying vec2 v_TexCoord;\n" +
    "uniform mat4 u_MvpMatrixFromLight;\n" +
    "varying vec4 v_PositionFromLight;\n" +
    "varying float v_Dist;\n" +
    "void main() {\n" +
    "gl_Position = u_MvpMatrix * a_Position;\n" +
    "v_TexCoord = a_TexCoord;\n" +
    "v_Dist = distance(u_ModelMatrix * a_Position, u_Eye);\n" +
    "v_PositionFromLight = u_MvpMatrixFromLight * a_Position;\n" +
    "}\n";
const TEXTURE_FSHADER_SOURCE =
    "#ifdef GL_ES\n" +
    "precision mediump float;\n" +
    "#endif\n" +
    "uniform sampler2D u_Sampler;\n" +
    "uniform sampler2D u_ShadowMap;\n" +
    "uniform vec3 u_PointLightColor;\n" +		// color of point light
    "uniform vec3 u_AmbientLight;\n" +			// color of ambient light
    "varying vec2 v_TexCoord;\n" +
    "varying float v_Dist;\n" +
    "uniform vec3 u_FogColor;\n" +
    "uniform vec2 u_FogDistance;\n" +
    "uniform vec2 u_Floor;\n" +
    "varying vec4 v_PositionFromLight;\n" +
    "void main() {\n" +
    "vec3 shadowCoord = (v_PositionFromLight.xyz/v_PositionFromLight.w) / 2.0 + 0.5;\n" +
    "vec4 rgbaDepth = texture2D(u_ShadowMap, shadowCoord.xy);\n" +
    "float depth = rgbaDepth.r;\n" +
    "float visibility = (shadowCoord.z > depth + 0.005) ? 0.7 : 1.0;\n" +// Recalculate the z value from the rgba
    "vec4 color = texture2D(u_Sampler, v_TexCoord);\n" +
    // Calculate the color due to ambient reflection
    "vec3 ambient = u_AmbientLight * color.rgb;\n" +
    // Calculate the color due to diffuse reflection
    "vec3 diffuse = visibility * u_PointLightColor * color.rgb;\n" +
    "vec3 light = vec3(color.rgb + ambient + diffuse);\n" +
    "if (u_Floor.x < 1.0) {\n" +
    "float fog = (u_FogDistance.y - v_Dist) / (u_FogDistance.y - u_FogDistance.x);\n" +
    "gl_FragColor = vec4(mix(u_FogColor, light, clamp(fog, 0.0, 1.0)), color.a);\n" +
    "}\n" +
    "else {\n" +
    "gl_FragColor = vec4(light * visibility, color.a);\n" +
    "}\n" +
    "}\n";
const SOLID_VSHADER_SOURCE =
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
    "uniform mat4 u_MvpMatrixFromLight;\n" +
    "varying vec4 v_PositionFromLight;\n" +
    "varying vec4 v_Color;\n" +
    "varying float v_Dist;\n" +
    "varying vec3 v_normalInternal;\n" +
    "varying vec3 v_vertexPosition;\n" +
    "varying vec3 ambientColor;\n" +
    "varying vec3 diffuseColor;\n" +
    "void main() {\n" +
    "gl_Position = u_MvpMatrix * a_Position;\n" +
    // Recalculate the normal based on the model matrix and make its length 1.
    "vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));\n" +
    // phong shading
    "v_normalInternal = normal;\n" +
    "vec4 modelVertex = u_ModelMatrix * a_Position;\n" +
    "v_vertexPosition = vec3(modelVertex) / modelVertex.w;\n" +
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
    "diffuseColor = diffuse + diffuse2;\n" +
    // Calculate the color due to ambient reflection
    "vec3 ambient = u_AmbientLight * a_Color.rgb;\n" +
    "ambientColor = ambient;\n" +
    // Mix ambient, diffuse, diffuse2.
    "v_Color = vec4(ambient + diffuse + diffuse2, a_Color.a);\n" +
    // Use the negative z value of each vertex in view coordinate system
    "v_Dist = gl_Position.w;\n" +
    "v_PositionFromLight = u_MvpMatrixFromLight * a_Position;\n" +
    "}\n";
const SOLID_FSHADER_SOURCE =
    "#ifdef GL_ES\n" +
    "precision mediump float;\n" +
    "#endif\n" +
    "uniform sampler2D u_ShadowMap;\n" +
    "uniform vec3 u_FogColor;\n" +
    "uniform vec2 u_FogDistance;\n" +
    "varying vec4 v_Color;\n" +
    "varying float v_Dist;\n" +
    "varying vec3 v_normalInternal;\n" +
    "varying vec3 v_vertexPosition;\n" +
    "uniform vec3 lightPos;\n" +
    "varying vec3 ambientColor;\n" +
    "varying vec3 diffuseColor;\n" +
    "const vec3 specColor = vec3(1.0, 1.0, 1.0);\n" +
    "varying vec4 v_PositionFromLight;\n" +
    "void main() {\n" +
    "vec3 shadowCoord = (v_PositionFromLight.xyz/v_PositionFromLight.w)/2.0 + 0.5;\n" +
    "vec4 rgbaDepth = texture2D(u_ShadowMap, shadowCoord.xy);\n" +
    "float depth = rgbaDepth.r;\n" +
    "float visibility = (shadowCoord.z > depth + 0.005) ? 0.7 : 1.0;\n" +// Recalculate the z value from the rgba
    //phong shading
    "vec3 lightDir = normalize(lightPos - v_vertexPosition);\n" +
    "vec3 normal = v_normalInternal;\n" +
    "vec3 reflectDir = reflect(-lightDir, normal);\n" +
    "vec3 viewDir = normalize(-v_vertexPosition);\n" +
    "float lambertian = max(dot(lightDir,normal), 0.0);\n" +
    "float specular = 0.0;\n" +
    "if(lambertian > 0.0) {\n" +
    "float specAngle = max(dot(reflectDir, viewDir), 0.0);\n" +
    "specular = pow(specAngle, 4.0);\n" +
    "}\n" +
    "vec3 phongColor = vec3(ambientColor + lambertian * diffuseColor + specular * specColor);\n" +
    // define fog parameter
    "float fog = (u_FogDistance.y - v_Dist) / (u_FogDistance.y - u_FogDistance.x);\n" +
    // Stronger fog as it gets further: u_FogColor * (1 - fogFactor) + v_Color * fogFactor
    "vec3 color = mix(u_FogColor, vec3(v_Color), clamp(fog, 0.0, 1.0));\n" +
    "gl_FragColor = vec4(phongColor *  visibility, v_Color.a);\n" +
    "}\n";

const SKYBOX_VSHADER_SOURCE = `
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
const SKYBOX_FSHADER_SOURCE = `
    precision mediump float;
    varying vec3 v_Position;
    uniform samplerCube u_Cubemap;
    void main() {
      vec3 dir = normalize(v_Position);
      gl_FragColor = textureCube(u_Cubemap, vec3(-1.0, 1.0, -1.0) * dir);
    }
`;
const SHADOW_VSHADER_SOURCE =
    "attribute vec4 a_Position;\n" +
    "uniform mat4 u_MvpMatrix;\n" +
    "void main() {\n" +
    "  gl_Position = u_MvpMatrix * a_Position;\n" +
    "}\n";

// Fragment shader program for generating a shadow map
const SHADOW_FSHADER_SOURCE =
    '#ifdef GL_ES\n' +
    'precision mediump float;\n' +
    '#endif\n' +
    'void main() {\n' +
    '  gl_FragColor = vec4(gl_FragCoord.z, 0.0, 0.0, 0.0);\n' + // Write the z-value in R
    '}\n';