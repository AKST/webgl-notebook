/**
 * @import { VectorOf as Vec, MatrixOf as Mat } from '../../math/type.ts';
 *
 * @typedef {Vec<'r', 3>} V3
 */
import { matrix as m, vector as v } from '../../math/value.js';
import * as math from '../../math/value.js';
import { Matrix3d as M } from '../../common/matrix.js';
import { installDebugger } from '../../common/debugger.js';
import { initControls } from '../../common/3d/controls.js';
import { installControlExtFov } from '../../common/3d/controls_ext_fov.js';
import { installMiscNumKnob } from '../../common/3d/controls_ext_misc.js';
import {
  setLetterF3d as setLetterF,
  setLetterNormals,
} from '../../common/buffer.js';
import { createShader, createProgram } from '../../common/init.js';

const version = "#version 300 es\n"

const vertexShaderSrc = version + `
  in vec4 a_position;
  in vec3 a_normal;

  uniform vec3 u_lightWorldPosition;
  uniform vec3 u_viewWorldPosition;
  uniform mat4 u_world;
  uniform mat4 u_viewProjection;

  out vec3 v_normal;
  out vec3 v_surfaceToLight;
  out vec3 v_surfaceToView;

  void main() {
    vec4 surfaceWorldPosition = u_world * a_position;

    gl_Position = u_viewProjection * surfaceWorldPosition;

    v_normal = mat3(transpose(inverse(u_world))) * a_normal;
    v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition.xyz;
    v_surfaceToView = u_viewWorldPosition - surfaceWorldPosition.xyz;
  }
`;

const fragmentShaderSrc = version + `
  precision mediump float;

  in vec3 v_normal;
  in vec3 v_surfaceToLight;
  in vec3 v_surfaceToView;

  uniform vec3 u_reverseLightDirection;
  uniform vec4 u_color;
  uniform float u_shine;

  out vec4 outColor;

  void main() {
    vec3 normal = normalize(v_normal);
    vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
    vec3 surfaceToViewDirection = normalize(v_surfaceToView);
    vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);

    float lightDirectional = dot(normal, u_reverseLightDirection);
    float lightPoint = dot(normal, surfaceToLightDirection);
    float specular = 0.0;
    if (lightPoint > 0.0) {
      specular = pow(dot(normal, halfVector), u_shine);
    }

    outColor = u_color;
    outColor.rgb *= lightDirectional + lightPoint;
    outColor.rgb += specular;
  }
`;

/**
 * @param {WebGL2RenderingContext} gl
 * @param {WebGLProgram} program
 * @param {string} name
 * @returns {WebGLUniformLocation}
 */
function getUniformLoc(gl, program, name) {
  const location = gl.getUniformLocation(program, name)
  if (location == null) throw new Error(name);
  return location;
}

const COLOR_A = v(4)(1, 0, 0.5, 1);
const COLOR_B = v(4)(1, 0.375, 0.625, 1);
const LIGHT_DIRECTION = v(3)(0.5, 0.7, 1);
const LIGHT_POINT = v(3)(20, 30, 50);

export function main () {
  const dbg = installDebugger();
  const container = document.getElementById('container');
  if (container == null) throw new Error('container');

  const canvas = document.createElement('canvas');
  container.appendChild(canvas);

  const { width, height } = canvas.getBoundingClientRect();
  canvas.width = width;
  canvas.height = height;

  const gl = canvas.getContext("webgl2");
  if (gl == null) throw new Error('getContext');

  const vShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSrc);
  const fShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSrc);
  const program = createProgram(gl, vShader, fShader);
  gl.useProgram(program);

  const uWorld = getUniformLoc(gl, program, "u_world");
  const uShine = getUniformLoc(gl, program, "u_shine");
  const uViewProjection = getUniformLoc(gl, program, "u_viewProjection")
  const uViewWorldPosition = getUniformLoc(gl, program, "u_viewWorldPosition");
  const uLightWorldPosition = getUniformLoc(gl, program, "u_lightWorldPosition");
  const uReverseLightDirection = getUniformLoc(gl, program, "u_reverseLightDirection");
  const uColor = getUniformLoc(gl, program, "u_color");

  const state = initControls({
    screenLock: true,
    window,
    playerDelta: {
      rotation: 0.01,
      translate: 1,
    },
    entityDelta: {
      rotation: 1,
      translate: 100,
    },
    player: {
      translate: [0, 0, 150],
      rotation: [0, 0, -1, 0],
    },
    entity: {
      translate: [0, 0, 0],
      rotation: [-3.21, 2.46, 0.00],
      scale: [1, 1, 1],
    },
  });

  const fov = installControlExtFov({
    fov: { value: 1.51, min: 0, max: 5 },
    far: { value: 10000, min: 1, max: 10000 },
    near: { value: 1, min: 0.1, max: 1000 },
  });

  const shine = installMiscNumKnob('shine', 30, 'Shine', [0, 500]);

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const posTran = m.mul(
    M.translate(-50, -75, -15),
    M.rotateX(Math.PI),
  );

  const posBuffer = gl.createBuffer();
  const posAttrLocation = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(posAttrLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
  setLetterF(gl, 0, 0, 0, 100, 150, 10, 30, posTran);
  gl.vertexAttribPointer(posAttrLocation, 3, gl.FLOAT, false, 0, 0);

  const nrmBuffer = gl.createBuffer();
  const nrmAttrLocation = gl.getAttribLocation(program, "a_normal");
  gl.enableVertexAttribArray(nrmAttrLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, nrmBuffer);
  setLetterNormals(gl);
  gl.vertexAttribPointer(nrmAttrLocation, 3, gl.FLOAT, true, 0, 0);

  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  requestAnimationFrame(function f (t) {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    gl.useProgram(program);
    gl.bindVertexArray(vao);

    dbg.log('time', t);

    const cameraRM = M.fromQuaternion(...state.player.rotation);
    const cameraTM = M.translate(...state.player.translate);
    const cameraM = m.mul(cameraRM, cameraTM);

    const [width, height] = state.screen.bounds;
    const projectionM = M.perspective(fov.fov, width / height, fov.near, fov.far);
    const viewM = math.inv(cameraM);
    const viewProjection = m.mul(viewM, projectionM);

    let worldRotation = m.identity(4);
    worldRotation = m.mul(M.rotateX(state.entity.rotation[0]), worldRotation);
    worldRotation = m.mul(M.rotateY(state.entity.rotation[1]), worldRotation);
    worldRotation = m.mul(M.rotateZ(state.entity.rotation[2]), worldRotation);

    let world = M.translate(...state.entity.translate);
    world = m.mul(worldRotation, world);
    world = m.mul(M.scale(...state.entity.scale), world);

    gl.uniformMatrix4fv(uWorld, false, world.mat.flat());
    gl.uniformMatrix4fv(uViewProjection, false, viewProjection.mat.flat());
    gl.uniform4fv(uColor, COLOR_A.vec);
    gl.uniform3fv(uReverseLightDirection, v.unit(LIGHT_DIRECTION).vec);
    gl.uniform3fv(uLightWorldPosition, LIGHT_POINT.vec)
    gl.uniform3fv(uViewWorldPosition, state.player.translate);
    gl.uniform1f(uShine, shine.value);

    gl.drawArrays(gl.TRIANGLES, 0, 16 * 6);
    dbg.flush();

    requestAnimationFrame(f);
  })
}
