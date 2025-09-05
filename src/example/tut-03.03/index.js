/**
 * @import { VectorOf as Vec } from '../../math/type.ts';
 */
import { vector as v, matrix as m } from '../../math/value.js';
import { Matrix2d as MatrixUtil } from '../../common/matrix.js';
import { install2DControls } from '../../common/2d/controls.js';
import { setLetterF } from '../../common/buffer.js';
import { createShader, createProgram } from '../../common/init.js';

const vertexShaderSrc = `
  attribute vec2 a_position;
  uniform mat3 u_matrix;
  uniform vec2 u_resolution;

  void main() {
    vec2 position = (u_matrix * vec3(a_position, 1)).xy;
    vec2 clipSpace = ((position / u_resolution) * 2.0) - 1.0;
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
  }
`;

const fragmentShaderSrc = `
  precision mediump float;

  void main() {
    gl_FragColor = vec4(1, 0, 0.5, 1); // return reddish-purple
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

  const uResLoc = gl.getUniformLocation(program, "u_resolution")
  if (uResLoc == null) throw new Error("u_resolution");


  const posBuffer = gl.createBuffer();
  const posAttrLocation = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(posAttrLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
  setLetterF(gl, 0, 0, 100, 150, 30);

  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  const state = {
    rotation: 0,

    /** @type {[number, number]} */
    translate: [gl.canvas.width / 2, gl.canvas.height / 2],

    /** @type {[number, number]} */
    scale: [1, 1],
  };

  install2DControls({
    translate: {
      value: state.translate,
      range: [[0, gl.canvas.width], [0, gl.canvas.height]],
      delta: [100, -100],
      set: update => { state.translate = update; },
      update: update => {
        state.translate[0] += update[0];
        state.translate[1] += update[1];
      },
    },
    scale: {
      value: state.scale,
      delta: [1, 1],
      set: update => { state.scale = update; },
      update: update => {
        state.scale[0] += update[0];
        state.scale[1] += update[1];
      },
    },
    rotation: {
      delta: 2,
      update: update => {
       state.rotation += update;
      },
      set: r => { state.rotation = r },
    },
  });

  requestAnimationFrame(function f () {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.vertexAttribPointer(posAttrLocation, 2, gl.FLOAT, false, 0, 0);

    gl.uniform2fv(uResLoc, [gl.canvas.width, gl.canvas.height]);

    const sM = MatrixUtil.scale(...state.scale);
    const tM = MatrixUtil.translate(...state.translate);
    const rM = MatrixUtil.rotate(state.rotation);

    let matrix = MatrixUtil.identity();
    matrix = m.mul(matrix, sM);
    matrix = m.mul(matrix, rM);
    matrix = m.mul(matrix, tM);

    gl.uniformMatrix3fv(matUnifLocation, false, matrix.mat.flat());
    gl.drawArrays(gl.TRIANGLES, 0, 18);

    requestAnimationFrame(f);
  })
}
