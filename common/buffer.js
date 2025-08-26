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
