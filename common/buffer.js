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

/**
 * @param {WebGLRenderingContext} gl
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {number} width
 * @param {number} height
 * @param {number} depth
 * @param {number} thickness
 */
export function setLetterF3d(gl, x, y, z, width, height, depth, thickness) {
  const x0 = x;
  const x30 = x + thickness;
  const x67 = (x + width * 2 / 3) | 0;
  const x100 = x + width;

  const y0 = y;
  const y30 = y + thickness;
  const y60 = (y + thickness * 2) | 0;
  const y90 = (y + thickness * 3) | 0;
  const y150 = y + height;

  const z0 = z;
  const z30 = z + depth;

  const buffer = new Float32Array([
    // left column front
    x0, y0, z0,
    x0, y150, z0,
    x30, y0, z0,
    x0, y150, z0,
    x30, y150, z0,
    x30, y0, z0,

    // top rung front
    x30, y0, z0,
    x30, y30, z0,
    x100, y0, z0,
    x30, y30, z0,
    x100, y30, z0,
    x100, y0, z0,

    // middle rung front
    x30, y60, z0,
    x30, y90, z0,
    x67, y60, z0,
    x30, y90, z0,
    x67, y90, z0,
    x67, y60, z0,

    // left column back
    x0, y0, z30,
    x30, y0, z30,
    x0, y150, z30,
    x0, y150, z30,
    x30, y0, z30,
    x30, y150, z30,

    // top rung back
    x30, y0, z30,
    x100, y0, z30,
    x30, y30, z30,
    x30, y30, z30,
    x100, y0, z30,
    x100, y30, z30,

    // middle rung back
    x30, y60, z30,
    x67, y60, z30,
    x30, y90, z30,
    x30, y90, z30,
    x67, y60, z30,
    x67, y90, z30,

    // top
    x0, y0, z0,
    x100, y0, z0,
    x100, y0, z30,
    x0, y0, z0,
    x100, y0, z30,
    x0, y0, z30,

    // top rung right
    x100, y0, z0,
    x100, y30, z0,
    x100, y30, z30,
    x100, y0, z0,
    x100, y30, z30,
    x100, y0, z30,

    // under top rung
    x30, y30, z0,
    x30, y30, z30,
    x100, y30, z30,
    x30, y30, z0,
    x100, y30, z30,
    x100, y30, z0,

    // between top rung and middle
    x30, y30, z0,
    x30, y60, z30,
    x30, y30, z30,
    x30, y30, z0,
    x30, y60, z0,
    x30, y60, z30,

    // top middle rung
    x30, y60, z0,
    x67, y60, z30,
    x30, y60, z30,
    x30, y60, z0,
    x67, y60, z0,
    x67, y60, z30,

    // right of middle rung
    x67, y60, z0,
    x67, y90, z30,
    x67, y60, z30,
    x67, y60, z0,
    x67, y90, z0,
    x67, y90, z30,

    // bottom of middle rung
    x30, y90, z0,
    x30, y90, z30,
    x67, y90, z30,
    x30, y90, z0,
    x67, y90, z30,
    x67, y90, z0,

    // right of bottom
    x30, y90, z0,
    x30, y150, z30,
    x30, y90, z30,
    x30, y90, z0,
    x30, y150, z0,
    x30, y150, z30,

    // bottom
    x0, y150, z0,
    x0, y150, z30,
    x30, y150, z30,
    x0, y150, z0,
    x30, y150, z30,
    x30, y150, z0,

    // left side
    x0, y0, z0,
    x0, y0, z30,
    x0, y150, z30,
    x0, y0, z0,
    x0, y150, z30,
    x0, y150, z0,
  ]);

  gl.bufferData(
      gl.ARRAY_BUFFER,
      buffer,
      gl.STATIC_DRAW);
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {number} front
 * @param {number} side
 * @param {number} above
 * @param {number} under
 */
export function setLetterMatColors(gl, front, side, above, under) {
  const fr = (front & 0xff0000) >> 16;
  const fg = (front & 0x00ff00) >> 8;
  const fb = (front & 0x0000ff);
  /** @type {number[]} */
  const frontColor = [
    [fr, fg, fb],
    [fr, fg, fb],
    [fr, fg, fb],
    [fr, fg, fb],
    [fr, fg, fb],
    [fr, fg, fb],
  ].flat();

  const sr = (side & 0xff0000) >> 16;
  const sg = (side & 0x00ff00) >> 8;
  const sb = (side & 0x0000ff);
  /** @type {number[]} */
  const sideColor = [
    [sr, sg, sb],
    [sr, sg, sb],
    [sr, sg, sb],
    [sr, sg, sb],
    [sr, sg, sb],
    [sr, sg, sb],
  ].flat();

  const ar = (above & 0xff0000) >> 16;
  const ag = (above & 0x00ff00) >> 8;
  const ab = (above & 0x0000ff);
  /** @type {number[]} */
  const aboveColor = [
    [ar, ag, ab],
    [ar, ag, ab],
    [ar, ag, ab],
    [ar, ag, ab],
    [ar, ag, ab],
    [ar, ag, ab],
  ].flat();

  const ur = under & 0xff0000 >> 16;
  const ug = under & 0x00ff00 >> 8;
  const ub = under & 0x0000ff;
  /** @type {number[]} */
  const underColor = [
    [ur, ug, ub],
    [ur, ug, ub],
    [ur, ug, ub],
    [ur, ug, ub],
    [ur, ug, ub],
    [ur, ug, ub],
  ].flat();


  const buffer = new Uint8Array([
    // left column front
    ...frontColor,
    // top rung front
    ...frontColor,
    // middle rung front
    ...frontColor,
    // left column back
    ...frontColor,
    // top rung back
    ...frontColor,
    // middle rung back
    ...frontColor,
    // top
    ...aboveColor,
    // top rung right
    ...sideColor,
    // under top rung
    ...underColor,
    // between top rung and middle
    ...sideColor,
    // top middle rung
    ...aboveColor,
    // right of middle rung
    ...sideColor,
    // bottom of middle rung
    ...underColor,
    // right of bottom
    ...sideColor,
    ...underColor,
    ...sideColor,
  ]);

  gl.bufferData(
      gl.ARRAY_BUFFER,
      buffer,
      gl.STATIC_DRAW);
}
