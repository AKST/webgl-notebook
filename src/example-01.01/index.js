import { setRectangle } from '../common/buffer.js';
import { createShader, createProgram } from '../common/init.js';

const vertexShaderSrc = `
  attribute vec2 a_position;
  uniform vec2 u_resolution;

  void main() {
    vec2 zeroToOne = a_position / u_resolution;
    vec2 zeroToTwo = zeroToOne * 2.0;
    vec2 clipSpace = zeroToTwo - 1.0;
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
  }
`;

const fragmentShaderSrc = `
  precision mediump float;
  uniform vec4 u_color;

  void main() {
    gl_FragColor = u_color;
  }
`;

/**
 * @param {WebGLRenderingContext} gl
 * @param {HTMLCanvasElement} canvas
 * @param {WebGLUniformLocation} resUniformLoc
 */
export function createResizeHandler(gl, canvas, resUniformLoc) {
  return function () {
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;

    gl.uniform2f(resUniformLoc, gl.canvas.width, gl.canvas.height);
  }
}


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

  const clrUnifLocation =  gl.getUniformLocation(program, "u_color");
  if (clrUnifLocation == null) throw new Error("u_color");

  const resUnifLocation = gl.getUniformLocation(program, "u_resolution")
  if (resUnifLocation == null) throw new Error("u_resolution");

  const posAttrLocation = gl.getAttribLocation(program, "a_position");
  const posBuffer = gl.createBuffer();
  const poss = [0, 0, 0, 0.5, 0.7, 0];

  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(poss), gl.STATIC_DRAW);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(program);
  gl.enableVertexAttribArray(posAttrLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
  gl.vertexAttribPointer(posAttrLocation, 2, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  gl.uniform2f(resUnifLocation, gl.canvas.width, gl.canvas.height);
  globalThis.addEventListener('resize', createResizeHandler(gl, canvas, resUnifLocation));

  /** @param {number} range */
  function rInt(range) {
    return Math.floor(Math.random() * range);
  }

  /** @param {WebGLRenderingContext} gl */
  function rRect(gl) {
    const x = rInt(canvas.width);
    const w = rInt(canvas.width - x);
    const y = rInt(canvas.height);
    const h = rInt(canvas.height - y);
    setRectangle(gl, x, y, w, h);
  }

  /** @param {WebGLRenderingContext} gl */
  function drawBlack(gl) {
    rRect(gl);
    gl.uniform4f(clrUnifLocation, 0, 0, 0, 1);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  /** @param {WebGLRenderingContext} gl */
  function drawRed(gl) {
    rRect(gl);
    gl.uniform4f(clrUnifLocation, 1, 0, 0, 1);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  let last = -Infinity;

  requestAnimationFrame(function f (t) {
    if ((t - 50) > last) {
      last = t;

      const [fa, fb] = Math.random() > 0.5
        ? [drawRed, drawBlack]
        : [drawBlack, drawRed];

      fa(gl)
      fb(gl);
    }

    requestAnimationFrame(f);
  })
}
