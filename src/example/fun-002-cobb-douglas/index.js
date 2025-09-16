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
  in vec2 a_position;

  uniform float u_technology;
  uniform float u_alpha;
  uniform vec3 u_offset;
  uniform mat4 u_world;
  uniform mat4 u_viewProjection;

  out vec3 v_worldPos;
  flat out float v_faceY;

  float cobbDouglas(float labour, float capital) {
    return u_technology * pow(capital, 1.0 - u_alpha) * pow(labour, u_alpha);
  }

  void main() {
    float production = cobbDouglas(a_position.x, a_position.y);
    vec4 position = vec4(a_position.x, production, a_position.y, 1.0);
    vec4 worldPosition = u_world * (position + vec4(u_offset, 0.0));

    v_worldPos = worldPosition.xyz;
    v_faceY = production;
    gl_Position = u_viewProjection * worldPosition;
  }
`;

const fragmentShaderSrc = version + `
  precision mediump float;

  in vec3 v_worldPos;
  flat in float v_faceY;

  uniform float u_productionMax;

  out vec4 outColor;

  void main() {
    vec3 dx = dFdx(v_worldPos);
    vec3 dy = dFdy(v_worldPos);
    vec3 n  = normalize(cross(dx, dy));
    float tilt = acos(clamp(dot(n, vec3(0.0, 1.0, 0.0)), -1.0, 1.0)) / (0.5*3.14159265);
    float shade = mix(tilt, tilt, tilt);

    float t = clamp(v_faceY / u_productionMax, 0.0, 1.0);

    vec3 a = vec3(1.0, 0.5, 0.10);
    vec3 b = vec3(1.0, 0.25, 0.25);
    vec3 color = mix(a, b, t);
    outColor = vec4(color * shade, 1.0);
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
const COLOR_B = v(3)(1, 0.375, 0.625);
const COLOR_C = v(3)(1, 0.625, 0.375);
const COLOR_D = v(3)(0, 0.5, 1);
const COLOR_E = v(3)(0.5, 1, 0);

const LIGHT_DIRECTION = v(3)(0.5, 0.7, 1);
const LIGHT_POINT = v(3)(20, 30, 50);

/**
 * @param {WebGLRenderingContext} gl
 * @param {GLint} attribute
 * @param {{ min: number, max: number, step: number }} xCfg
 * @param {{ min: number, max: number, step: number }} zCfg
 * @returns {number}
 */
function generateXyMesh(gl, attribute, xCfg, zCfg) {
  const posBuffer = gl.createBuffer();
  gl.enableVertexAttribArray(attribute);
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);

  /** @type {number[]} */
  const array = [];

  const x0 = -(xCfg.max/2)
  const z0 = -(zCfg.max/2)

  for (let x = xCfg.min; x < xCfg.max; x += xCfg.step) {
    for (let z = zCfg.min; z < zCfg.max; z += zCfg.step) {
      array.push(x, z,
                 x + xCfg.step, z,
                 x + xCfg.step, z + zCfg.step);
      array.push(x, z,
                 x, z + zCfg.step,
                 x + xCfg.step, z + zCfg.step);
    }
  }

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(array), gl.STATIC_DRAW);
  gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);
  return array.length;
}

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
  const uAlpha = getUniformLoc(gl, program, "u_alpha");
  const uOffset = getUniformLoc(gl, program, "u_offset");
  const uTechnology = getUniformLoc(gl, program, "u_technology");
  const uProductionMax = getUniformLoc(gl, program, "u_productionMax");
  const uViewProjection = getUniformLoc(gl, program, "u_viewProjection");

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
      translate: [112.21, -207.00, -477.49],
      rotation: [-0.96, -0.03, -0.12, 0.24],
    },
    entity: {
      translate: [0, 219.10, 0],
      rotation: [-3.21, 2.46, 0.00],
      scale: [1, 0.03, 1],
    },
  });

  const fov = installControlExtFov({
    fov: { value: 1.51, min: 0, max: 5 },
    far: { value: 10000, min: 1, max: 10000 },
    near: { value: 1, min: 0.1, max: 1000 },
  });

  const technology = installMiscNumKnob('techology', 30, 'Technology', [0, 500]);
  const alpha = installMiscNumKnob('alpha', 2/3, 'Alpha', [0, 1]);

  /**
   * @param {number} labour
   * @param {number} capital
   * @returns {number}
   */
  const cobbDouglas = (labour, capital) => {
    return technology.value *
           (capital ** (1.0 - alpha.value)) *
           (labour ** alpha.value);
  }

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const aPosition = gl.getAttribLocation(program, 'a_position');
  const xCfg = { min: 0, max: 500, step: 50 };
  const zCfg = { min: 0, max: 500, step: 50 };
  const size = generateXyMesh(gl, aPosition, xCfg, zCfg);

  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  requestAnimationFrame(function f (t) {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
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
    const yRot = t / 1000;

    let worldRotation = m.identity(4);
    worldRotation = m.mul(M.rotateX(state.entity.rotation[0]), worldRotation);
    worldRotation = m.mul(M.rotateY(state.entity.rotation[1] + yRot), worldRotation);
    worldRotation = m.mul(M.rotateZ(state.entity.rotation[2]), worldRotation);

    let world = M.translate(...state.entity.translate);
    world = m.mul(worldRotation, world);
    world = m.mul(M.scale(...state.entity.scale), world);

    gl.uniformMatrix4fv(uWorld, false, world.mat.flat());
    gl.uniformMatrix4fv(uViewProjection, false, viewProjection.mat.flat());
    gl.uniform1f(uAlpha, alpha.value);
    gl.uniform1f(uTechnology, technology.value);
    gl.uniform1f(uProductionMax, cobbDouglas(xCfg.max, zCfg.max));
    gl.uniform3fv(uOffset, [
      -(xCfg.max / 2),
      0,
      -(zCfg.max / 2),
    ]);

    gl.drawArrays(gl.TRIANGLES, 0, size / 2);
    dbg.flush();

    requestAnimationFrame(f);
  })
}
