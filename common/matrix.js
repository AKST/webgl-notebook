/**
 * @import { MatrixOf as Mat } from '../math/type.ts';
 */
import { matrix as m } from '../math/value.js';

export class Matrix2d {
  /** @param {number} w @param {number} h */
  static proj(w, h) {
    return m(3, 3)(
      [2 / w, 0, 0],
      [0, -2 / h, 0],
      [0, 0, 1],
    );
  }

  static identity() {
    return m(3, 3)(
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
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
   *   translate: [number, number],
   *   rotation: number,
   *   scale: [number, number] }} options
   * @returns {Float32Array}
   */
  static transform({
    translate,
    rotation,
    scale,
  }) {
    let matrix = MatrixUtil.scale(...scale);
    matrix = m.mul(matrix, MatrixUtil.rotate(rotation));
    matrix = m.mul(matrix, MatrixUtil.translate(...translate))
    return new Float32Array(matrix.mat.flat());
  }
}

export class Matrix3d {
  /**
   * @returns {Mat<'r', 4, 4>}
   */
  static identity() {
    return m(4, 4)(
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    );
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {Mat<'r', 4, 4>}
   */
  static translate(x, y, z) {
    return m(4, 4)(
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [x, y, z, 1],
    );
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {Mat<'r', 4, 4>}
   */
  static scale(x, y, z) {
    return m(4, 4)(
      [x, 0, 0, 0],
      [0, y, 0, 0],
      [0, 0, z, 0],
      [0, 0, 0, 1],
    );
  }

  /**
   * @param {number} radians
   * @returns {Mat<'r', 4, 4>}
   */
  static rotateX(radians) {
    const c = Math.cos(radians);
    const s = Math.sin(radians);

    return m(4, 4)(
      [1, 0, 0, 0],
      [0, c, s, 0],
      [0, -s, c, 0],
      [0, 0, 0, 1],
    );
  }

  /**
   * @param {number} radians
   * @returns {Mat<'r', 4, 4>}
   */
  static rotateY(radians) {
    const c = Math.cos(radians);
    const s = Math.sin(radians);

    return m(4, 4)(
      [c, 0, -s, 0],
      [0, 1, 0, 0],
      [s, 0, c, 0],
      [0, 0, 0, 1],
    );
  }

  /**
   * @param {number} radians
   * @returns {Mat<'r', 4, 4>}
   */
  static rotateZ(radians) {
    const c = Math.cos(radians);
    const s = Math.sin(radians);

    return m(4, 4)(
      [c, s, 0, 0],
      [-s, c, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    );
  }

  /**
   * @param {number} width
   * @param {number} height
   * @param {number} depth
   * @returns {Mat<'r', 4, 4>}
   */
  static transform(width, height, depth) {
    return m(4, 4)(
      [2 / width, 0, 0, 0],
      [0, -2 / height, 0, 0],
      [0, 0, 2 / depth, 0],
      [-1, 1, 0, 1],
    );
  }
}
