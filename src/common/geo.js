/**
 * @import { VectorOf } from '../math/type.ts';
 */
import { vector as v } from '../math/value.js';

/**
 * @param {number} a
 * @param {number} b
 * @returns {VectorOf<'r', 2>}
 */
export function v2(a, b) {
  return v(2)(a, b);
}

/**
 * @param {number} a
 * @param {number} b
 * @param {number} c
 * @returns {VectorOf<'r', 3>}
 */
export function v3(a, b, c) {
  return v(3)(a, b, c);
}

/**
 * @param {number} a
 * @param {number} b
 * @param {number} c
 * @param {number} d
 * @returns {VectorOf<'r', 4>}
 */
export function v4(a, b, c, d) {
  return v(4)(a, b, c, d);
}
