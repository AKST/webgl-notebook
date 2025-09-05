/**
 * @import { VectorOf as Vec } from '../../math/type.ts';
 */
import { vector as v, matrix as m } from '../../math/value.js';
import * as math from '../../math/value.js';
import { Matrix3d as M } from '../../common/matrix.js';
import { initControls } from '../../common/3d/controls.js';
import { setLetterF3d as setLetterF } from '../../common/buffer.js';
import { createShader, createProgram } from '../../common/init.js';

const vertexShaderSrc = `
  attribute vec4 a_position;
  uniform mat4 u_matrix;

  void main() {
    gl_Position = u_matrix * a_position;
  }
`;

const fragmentShaderSrc = `
  precision mediump float;

  void main() {
    gl_FragColor = vec4(1, 0, 0.5, 1);
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

  const gl = canvas.getContext("webgl");
  if (gl == null) throw new Error('getContext');

  const vShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSrc);
  const fShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSrc);
  const program = createProgram(gl, vShader, fShader);
  gl.useProgram(program);

  const matUnifLocation = gl.getUniformLocation(program, "u_matrix")
  if (matUnifLocation == null) throw new Error("u_matrix");


  /** @param {number} d */
  const degToRad = d => d * Math.PI / 180;

  const state = initControls({
    window,
    entityDelta: {
      rotation: 1,
    },
    entity: {
      translate: [0, 0, 0],
      rotation: [degToRad(0), degToRad(0), degToRad(0)],
      scale: [0.5, 0.5, 0.5],
    },
  });

  const posBuffer = gl.createBuffer();
  const posAttrLocation = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(posAttrLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
  setLetterF(gl, 0, 0, 0, 100, 150, 10, 30);

  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  requestAnimationFrame(function f () {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.vertexAttribPointer(posAttrLocation, 3, gl.FLOAT, false, 0, 0);

    const tM = M.translate(...state.entity.translate);
    const rxM = M.rotateX(state.entity.rotation[0]);
    const ryM = M.rotateY(state.entity.rotation[1]);
    const rzM = M.rotateZ(state.entity.rotation[2]);
    const sM = M.scale(...state.entity.scale);

    let matrix = M.projection(...state.screen.bounds, 400);
    matrix = m.mul(matrix, tM);
    matrix = m.mul(matrix, rxM);
    matrix = m.mul(matrix, ryM);
    matrix = m.mul(matrix, rzM);
    matrix = m.mul(matrix, sM);

    gl.uniformMatrix4fv(matUnifLocation, false, matrix.mat.flat());
    gl.drawArrays(gl.TRIANGLES, 0, 16 * 6);

    requestAnimationFrame(f);
  })
}
