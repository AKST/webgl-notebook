/**
 * @import { VectorOf } from '../math/type.ts';
 */

/**
 * @param {WebGLRenderingContext} gl
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 */
export function setRectangle(gl, x, y, w, h) {
  const x1 = x;
  const x2 = x + w;
  const y1 = y;
  const y2 = y + h;
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
     x1, y1,
     x2, y1,
     x1, y2,
     x1, y2,
     x2, y1,
     x2, y2]), gl.STATIC_DRAW);
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {VectorOf<'r', 2>} a
 * @param {VectorOf<'r', 2>} b
 * @param {VectorOf<'r', 2>} c
 */
export function setTriangle(gl, a, b, c) {
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
     ...a.vec,
     ...b.vec,
     ...c.vec]), gl.STATIC_DRAW);
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {VectorOf<'r', 4>} a
 * @param {VectorOf<'r', 4>} b
 * @param {VectorOf<'r', 4>} c
 */
export function setTriangle4V(gl, a, b, c) {
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
     ...a.vec,
     ...b.vec,
     ...c.vec]), gl.STATIC_DRAW);
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 * @param {number} thickness
 */
export function setLetterF(gl, x, y, width, height, thickness) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
          // left column
          x, y,
          x + thickness, y,
          x, y + height,
          x, y + height,
          x + thickness, y,
          x + thickness, y + height,

          // top rung
          x + thickness, y,
          x + width, y,
          x + thickness, y + thickness,
          x + thickness, y + thickness,
          x + width, y,
          x + width, y + thickness,

          // middle rung
          x + thickness, y + thickness * 2,
          x + width * 2 / 3, y + thickness * 2,
          x + thickness, y + thickness * 3,
          x + thickness, y + thickness * 3,
          x + width * 2 / 3, y + thickness * 2,
          x + width * 2 / 3, y + thickness * 3,
      ]),
      gl.STATIC_DRAW);
}
