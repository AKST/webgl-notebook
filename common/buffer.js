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
  /** @param {[number, number][]} a @param {number[]} b @returns {number[]} */
  const join2t1t = (a, b) => a.map((v, i) => [...v, b[i]]).flat();

  const x30 = x + thickness;
  const x67 = (x + width * 2 / 3) | 0;
  const x100 = x + width;

  const y30 = y + thickness;
  const y60 = (y + thickness * 2) | 0;
  const y90 = (y + thickness * 3) | 0;
  const y150 = y + height;

  /** @type {[number, number][]} */
  const leftColumn = [
    [x, y],
    [x30, y],
    [x, y150],
    [x, y150],
    [x30, y],
    [x30, y150],
  ];

  /** @type {[number, number][]} */
  const leftSide = [
    [x, y],
    [x, y],
    [x, y150],
    [x, y],
    [x, y150],
    [x, y150],
  ];

  /** @type {[number, number][]} */
  const rightBottom = [
    [x30, y90],
    [x30, y90],
    [x30, y150],
    [x30, y90],
    [x30, y150],
    [x30, y150],
  ];

  /** @type {[number, number][]} */
  const rightMiddleRung = [
    [x67,   y60],
    [x67,   y60],
    [x67,   y90],
    [x67,   y60],
    [x67,   y90],
    [x67,   y90],
  ];


  /** @type {[number, number][]} */
  const bottom = [
    [x, y150],
    [x, y150],
    [x30, y150],
    [x, y150],
    [x30, y150],
    [x30, y150],
  ];

  /** @type {[number, number][]} */
  const bottomMiddleRung = [
    [x30, y90],
    [x30, y90],
    [x67, y90],
    [x30, y90],
    [x67, y90],
    [x67, y90],
  ]

  /** @type {[number, number][]} */
  const topRung = [
    [x30, y],
    [x100, y],
    [x30, y30],
    [x30, y30],
    [x100, y],
    [x100, y30],
  ];

  /** @type {[number, number][]} */
  const topRungRight = [
    [x100, y],
    [x100, y30],
    [x100, y30],
    [x100, y],
    [x100, y30],
    [x100, y],
  ];

  /** @type {[number, number][]} */
  const topRungUnder = [
    [x30, y30],
    [x30, y30],
    [x100, y30],
    [x30, y30],
    [x100, y30],
    [x100, y30],
  ];

  /** @type {[number, number][]} */
  const topMiddleRung = [
    [x30, y60],
    [x30, y60],
    [x67, y60],
    [x30, y60],
    [x67, y60],
    [x67, y60],
  ]

  /** @type {[number, number][]} */
  const middleRung = [
    [x30, y60],
    [x67, y60],
    [x30, y90],
    [x30, y90],
    [x67, y60],
    [x67, y90],
  ];

  /** @type {[number, number][]} */
  const betweenTopMiddleRung = [
    [x30, y30],
    [x30, y30],
    [x30, y60],
    [x30, y30],
    [x30, y60],
    [x30, y60],
  ];

  /** @type {[number, number][]} */
  const top = [
    [x, y],
    [x100, y],
    [x100, y],
    [x, y],
    [x100, y],
    [x, y],
  ];

  const la = [z, z, z + depth, z, z + depth, z + depth];
  const lb = [z, z + depth, z + depth, z, z + depth, z];

  const buffer = new Float32Array([
    ...leftColumn.flatMap(t => [...t, z]),
    ...topRung.flatMap(t => [...t, z]),
    ...middleRung.flatMap(t => [...t, z]),
    ...leftColumn.flatMap(t => [...t, z + depth]),
    ...topRung.flatMap(t => [...t, z + depth]),
    ...middleRung.flatMap(t => [...t, z + depth]),
    ...join2t1t(top, la),
    ...join2t1t(topRungRight, la),
    ...join2t1t(topRungUnder, lb),
    ...join2t1t(betweenTopMiddleRung, lb),
    ...join2t1t(topMiddleRung, lb),
    ...join2t1t(rightMiddleRung, lb),
    ...join2t1t(bottomMiddleRung, lb),
    ...join2t1t(rightBottom, lb),
    ...join2t1t(bottom, lb),
    ...join2t1t(leftSide, lb),
  ]);

  console.log(buffer);
  console.log(buffer.length, 16 * 6);

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
    ...frontColor,
    ...frontColor,
    ...frontColor,
    ...frontColor,
    ...frontColor,
    ...frontColor,
    ...aboveColor,
    ...aboveColor,
    ...aboveColor,
    ...sideColor,
    ...aboveColor,
    ...sideColor,
    ...underColor,
    ...underColor,
    ...underColor,
    ...sideColor,
  ]);

  gl.bufferData(
      gl.ARRAY_BUFFER,
      buffer,
      gl.STATIC_DRAW);
}
