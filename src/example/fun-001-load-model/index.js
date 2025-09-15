/**
 * @import { VectorOf as Vec } from '../../math/type.ts';
 *
 * @typedef {Vec<'r', 3>} V3
 */
import { matrix as m } from '../../math/value.js';
import * as math from '../../math/value.js';
import { Matrix3d as M } from '../../common/matrix.js';
import { initControls } from '../../common/3d/controls.js';
import { installControlExtFov } from '../../common/3d/controls_ext_fov.js';
import {
  setLetterF3d as setLetterF,
  setLetterMatColors
} from '../../common/buffer.js';
import { createShader, createProgram } from '../../common/init.js';
import { loadGLB } from '../../common/resources/load_glb.js';

const version = "#version 300 es\n"

const vertexShaderSrc = version + `
  in vec4 a_position;
  in vec4 a_color;
  out vec4 v_color;

  uniform mat4 u_matrix;

  void main() {
    gl_Position = u_matrix * a_position;
    v_color = a_color;
  }
`;

const fragmentShaderSrc = version + `
  precision mediump float;

  in vec4 v_color;
  out vec4 outColor;

  void main() {
    outColor = v_color;
  }
`;

export async function main () {
  const container = document.getElementById('container');
  if (container == null) throw new Error('container');

  const model = await loadGLB("../../../models/sign_nswft_petersham/export_20250908.glb")
  console.log(model);

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

  const matUnifLocation = gl.getUniformLocation(program, "u_matrix")
  if (matUnifLocation == null) throw new Error("u_matrix");

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
      translate: [94.30, 0.00, 54.23],
      rotation: [0.93, -0.08, 0.36, -0.05],
    },
    entity: {
      translate: [-34.80, 0.00, 176.50],
      rotation: [-3.21, 0, 0],
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

  const clrBuffer = gl.createBuffer();
  const clrAttrLocation = gl.getAttribLocation(program, "a_color");
  gl.enableVertexAttribArray(clrAttrLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, clrBuffer);
  setLetterMatColors(gl, 0xff0088, 0xaa3366, 0xff66aa, 0x660000);
  gl.vertexAttribPointer(clrAttrLocation, 3, gl.UNSIGNED_BYTE, true, 0, 0);

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

    let matrix = viewProjM;
    matrix = m.mul(M.translate(...state.entity.translate), matrix);
    matrix = m.mul(M.rotateX(state.entity.rotation[0]), matrix);
    matrix = m.mul(M.rotateY(state.entity.rotation[1]), matrix);
    matrix = m.mul(M.rotateZ(state.entity.rotation[2]), matrix);
    matrix = m.mul(M.scale(...state.entity.scale), matrix);
    gl.uniformMatrix4fv(matUnifLocation, false, matrix.mat.flat());
    gl.drawArrays(gl.TRIANGLES, 0, 16 * 6);

    requestAnimationFrame(f);
  })
}
