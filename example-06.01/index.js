/**
 * @import { VectorOf as Vec } from '../math/type.ts';
 *
 * @typedef {Vec<'r', 3>} V3
 */
import { vector as v, matrix as m } from '../math/value.js';
import * as math from '../math/value.js';
import { Matrix3d as M } from '../common/matrix.js';
import { initControls } from '../common/3d/controls.js';
import { installControlExtFov } from '../common/3d/controls_ext_fov.js';
import {
  setLetterF3d as setLetterF,
  setLetterMatColors
} from '../common/buffer.js';
import { createShader, createProgram } from '../common/init.js';

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

  const matUnifLocation = gl.getUniformLocation(program, "u_matrix")
  if (matUnifLocation == null) throw new Error("u_matrix");

  const state = initControls({
    window,
    entityDelta: {
      rotation: 1,
      translate: 100,
    },
    entity: {
      translate: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
  });

  const fov = installControlExtFov({
    fov: { value: 1.05, min: 0, max: 5 },
    far: { value: 2000, min: 1, max: 10000 },
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

  requestAnimationFrame(function f (t) {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    gl.useProgram(program);
    gl.bindVertexArray(vao);

    const count = 5, radius = 200, cameraAngle = t / 1000;
    let cameraM = M.rotateY(cameraAngle);
    cameraM = m.mul(M.translate(0, 0, radius * 1.5), cameraM);
    cameraM = M.lookat(
      v(3)(cameraM.mat[3][0] + radius, cameraM.mat[3][1], cameraM.mat[3][2]),
      v(3)(...state.entity.translate),
      v(3)(0, 1, 0),
    );

    const tM = M.translate(...state.entity.translate);
    const rxM = M.rotateX(state.entity.rotation[0]);
    const ryM = M.rotateY(state.entity.rotation[1]);
    const rzM = M.rotateZ(state.entity.rotation[2]);
    const sM = M.scale(...state.entity.scale);

    const [width, height] = state.screen.bounds;
    const projectionM = M.perspective(fov.fov, width / height, fov.near, fov.far);
    const viewM = math.inv(cameraM);
    const viewProjM = m.mul(viewM, projectionM);

    for (let ii = 0; ii < count; ++ii) {
      const angle = ii * Math.PI * 2 / count;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      let matrix = m.mul(M.translate(x, 0, z), viewProjM);
      matrix = m.mul(tM, matrix);
      matrix = m.mul(rxM, matrix);
      matrix = m.mul(ryM, matrix);
      matrix = m.mul(rzM, matrix);
      matrix = m.mul(sM, matrix);

      gl.uniformMatrix4fv(matUnifLocation, false, matrix.mat.flat());
      gl.drawArrays(gl.TRIANGLES, 0, 16 * 6);
    }

    requestAnimationFrame(f);
  })
}
