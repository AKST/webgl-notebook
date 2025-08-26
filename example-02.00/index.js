/**
 * @import { VectorOf as Vec } from '../math/type.ts';
 */
import { vector as v, matrix as m } from '../math/value.js';
import { setTriangle } from '../common/buffer.js';
import { createShader, createProgram } from '../common/init.js';

const vertexShaderSrc = `
  attribute vec2 a_position;
  uniform mat3 u_matrix;
  varying vec4 v_color;

  void main() {
    gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
    v_color = gl_Position * 0.5 + 0.5;
  }
`;

const fragmentShaderSrc = `
  precision mediump float;
  varying vec4 v_color;

  void main() {
    gl_FragColor = v_color;
  }
`;

class MatrixUtil {
  /** @param {number} w @param {number} h */
  static proj(w, h) {
    return m(3, 3)(
      [2 / w, 0, 0],
      [0, -2 / h, 0],
      [-1, 1, 1],
    );
  }

  /** @param {number} x @param {number} y */
  static translate(x, y) {
    return m(3, 3)(
      [1, 0, 0],
      [0, 1, 0],
      [x, y, 1],
    );
  }

  /** @param {number} x @param {number} y */
  static scale(x, y) {
    return m(3, 3)(
      [x, 0, 0],
      [0, y, 0],
      [0, 0, 1],
    );
  }

  /** @param {number} radians */
  static rotate(radians) {
    const c = Math.cos(radians);
    const s = Math.sin(radians);
    return m(3, 3)(
      [c, -s, 0],
      [s, c, 0],
      [0, 0, 1],
    );
  }

  /**
   * @param {{
   *   bounds: [number, number],
   *   translate: [number, number],
   *   rotation: number,
   *   scale: [number, number] }} options
   * @returns {Float32Array}
   */
  static transform({
    bounds,
    translate,
    rotation,
    scale,
  }) {
    let matrix = MatrixUtil.proj(...bounds);
    matrix = m.mul(matrix, MatrixUtil.translate(...translate));
    matrix = m.mul(matrix, MatrixUtil.rotate(rotation));
    matrix = m.mul(matrix, MatrixUtil.scale(...scale))
    return new Float32Array(matrix.mat.flat());
  }
}

/**
 * @param {{
 *   setXTranslate: (v: number) => void,
 *   setYTranslate: (v: number) => void,
 *   setXScale: (v: number) => void,
 *   setYScale: (v: number) => void,
 *   setRotation: (v: number) => void,
 * }} options
 */
function installController({
  setXTranslate,
  setYTranslate,
  setRotation,
  setXScale,
  setYScale,
}) {
  /** @param {string} id @param {(v: number) => void} cb */
  function onUpdate(id, cb) {
    const e = /** @type {HTMLInputElement | null} */ (document.getElementById(id));
    if (e == null) throw new Error(id + ' not found');

    let mousedown = false;

    e.addEventListener('change', () => cb(parseFloat(e.value)));
    e.addEventListener('mousedown', () => mousedown = true);
    e.addEventListener('mouseup', () => mousedown = false);
    e.addEventListener('mousemove', () => mousedown && cb(parseFloat(e.value)));

  }
  onUpdate('ctrl-translate-x', setXTranslate)
  onUpdate('ctrl-translate-y', setYTranslate)
  onUpdate('ctrl-rotation', setRotation)
  onUpdate('ctrl-scale-x', setXScale)
  onUpdate('ctrl-scale-y', setYScale)
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

  const matUnifLocation = gl.getUniformLocation(program, "u_matrix")
  if (matUnifLocation == null) throw new Error("u_matrix");

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

  const a = v(2)(0, -100);
  const b = v(2)(150, 125);
  const c = v(2)(-175,  100);
  setTriangle(gl, a, b, c);

  let rotation = 0;

  /** @type {[number, number]} */
  const translate = [1, -1];

  /** @type {[number, number]} */
  const scale = [1, 1];

  installController({
    setXTranslate: x => { translate[0] = x },
    setYTranslate: y => { translate[1] = -y },
    setRotation: r => { rotation = r },
    setXScale: x => { scale[0] = x },
    setYScale: y => { scale[1] = y },
  });

  requestAnimationFrame(function f () {
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.uniformMatrix3fv(matUnifLocation, false, MatrixUtil.transform({
      bounds: [gl.canvas.width, gl.canvas.height],
      translate,
      rotation,
      scale,
    }));

    requestAnimationFrame(f);
  })
}
