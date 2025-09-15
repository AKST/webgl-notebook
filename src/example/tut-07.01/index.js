/**
 * @import { VectorOf as Vec } from '../../math/type.ts';
 *
 * @typedef {Vec<'r', 3>} V3
 */
import { matrix as m, vector as v } from '../../math/value.js';
import * as math from '../../math/value.js';
import { Matrix3d as M } from '../../common/matrix.js';
import { initControls } from '../../common/3d/controls.js';
import { installControlExtFov } from '../../common/3d/controls_ext_fov.js';
import {
  setLetterF3d as setLetterF,
  setLetterNormals,
} from '../../common/buffer.js';
import { createShader, createProgram } from '../../common/init.js';

const version = "#version 300 es\n"

const vertexShaderSrc = version + `
  in vec4 a_position;
  in vec3 a_normal;

  uniform mat4 u_worldViewProjection;
  uniform mat4 u_world;

  out vec3 v_normal;

  void main() {
    gl_Position = u_worldViewProjection * a_position;
    v_normal = mat3(u_world) * a_normal;
  }
`;

const fragmentShaderSrc = version + `
  precision mediump float;

  in vec3 v_normal;

  uniform vec3 u_reverseLightDirection;
  uniform vec4 u_color;

  out vec4 outColor;

  void main() {
    vec3 normal = normalize(v_normal);
    float light = dot(normal, u_reverseLightDirection);
    outColor = u_color;
    outColor.rgb *= light;
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
const LIGHT = v(3)(0.5, 0.7, 1);

export function main () {
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

  const matUnifLocation = getUniformLoc(gl, program, "u_worldViewProjection")
  const wldUnifLocation = getUniformLoc(gl, program, "u_world");
  const rldUnifLocation = getUniformLoc(gl, program, "u_reverseLightDirection");
  const clrUnifLocation = getUniformLoc(gl, program, "u_color");

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
      translate: [-5.09, -83.00, 168.27],
      rotation: [0.04, -0.31, 0.95, -0.09],
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
  gl.vertexAttribPointer(nrmAttrLocation, 3, gl.UNSIGNED_BYTE, true, 0, 0);

  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  requestAnimationFrame(function f () {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    gl.useProgram(program);
    gl.bindVertexArray(vao);

    const cameraRM = M.fromQuaternion(...state.player.rotation);
    const cameraTM = M.translate(...state.player.translate);
    const cameraM = m.mul(cameraRM, cameraTM);

    const [width, height] = state.screen.bounds;
    const projectionM = M.perspective(fov.fov, width / height, fov.near, fov.far);
    const viewM = math.inv(cameraM);
    const viewProjM = m.mul(viewM, projectionM);

    let world = M.translate(...state.entity.translate);
    world = m.mul(M.rotateX(state.entity.rotation[0]), world);
    world = m.mul(M.rotateY(state.entity.rotation[1]), world);
    world = m.mul(M.rotateZ(state.entity.rotation[2]), world);
    world = m.mul(M.scale(...state.entity.scale), world);

    // world view projection matrix
    const wvpm = m.mul(world, viewProjM)
    const winvt = m.transpose(math.inv(world));

    gl.uniformMatrix4fv(matUnifLocation, false, wvpm.mat.flat());
    gl.uniformMatrix4fv(wldUnifLocation, false, winvt.mat.flat());
    gl.uniform4fv(clrUnifLocation, COLOR_A.vec);
    gl.uniform3fv(rldUnifLocation, v.unit(LIGHT).vec);

    gl.drawArrays(gl.TRIANGLES, 0, 16 * 6);

    requestAnimationFrame(f);
  })
}
