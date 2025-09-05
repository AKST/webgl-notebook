/**
 * @param {[number, number, number, number]} rotation
 */
export function quatFromEulerXYZ([rx, ry, rz]) {
  const cx = Math.cos(rx*0.5), sx = Math.sin(rx*0.5);
  const cy = Math.cos(ry*0.5), sy = Math.sin(ry*0.5);
  const cz = Math.cos(rz*0.5), sz = Math.sin(rz*0.5);
  return {
    w:  cx*cy*cz + sx*sy*sz,
    x:  sx*cy*cz - cx*sy*sz,
    y:  cx*sy*cz + sx*cy*sz,
    z:  cx*cy*sz - sx*sy*cz,
  };
}

/**
 * @param {{ x: number, y: number, z: number }} v
 * @param {{ x: number, y: number, z: number, w: number }} q
 */
function rotateVecByQuat(v, q) {
  const ux=q.x, uy=q.y, uz=q.z, w=q.w;
  const uvx = uy*v.z - uz*v.y;
  const uvy = uz*v.x - ux*v.z;
  const uvz = ux*v.y - uy*v.x;
  const uuvx = uy*uvz - uz*uvy;
  const uuvy = uz*uvx - ux*uvz;
  const uuvz = ux*uvy - uy*uvx;
  return {
    x: v.x + 2*(w*uvx + uuvx),
    y: v.y + 2*(w*uvy + uuvy),
    z: v.z + 2*(w*uvz + uuvz),
  };
}

/**
 * @param {[number, number, number]} position
 * @param {[number, number, number, number]} rotation
 * @param {[number, number, number]} delta
 * @param {number} difference
 */
export function applyDeltaNoclip(position, rotation, delta, difference) {
	const len = Math.hypot(delta[0], delta[1], delta[2]) || 1;
	/** @type {[number, number, number]} */
  const local = [ delta[0]/len, delta[1]/len, delta[2]/len ];
  const world = rotateVecByQuat3(local, rotation);

  position[0] += world[0] * difference;
  position[1] += world[1] * difference;
  position[2] += world[2] * difference;
}

/**
 * @param {[number, number, number, number]} state
 * @param {[number, number]} rotation
 * @param {number} rate
 */
export function applyRotation(state, rotation, rate) {
  const rx = rotation[0] * rate, ry = rotation[1] * rate;

  let q = quatNormalize(quatMul(axisAngleQuat(0, 1, 0, rx), state));
  const right = rotateVecByQuat3([1, 0, 0], state);
  q = quatNormalize(quatMul(axisAngleQuat(right[0], right[1], right[2], ry), q));

  state[0] = q[0];
  state[1] = q[1];
  state[2] = q[2];
  state[3] = q[3];
}

/**
 * @param {number} ax
 * @param {number} ay
 * @param {number} az
 * @param {number} angle
 * @returns {[number, number, number, number]}
 */
function axisAngleQuat(ax, ay, az, angle) {
  const len = Math.hypot(ax, ay, az) || 1;
  const x = ax / len, y = ay / len, z = az / len;
  const h = angle * 0.5, s = Math.sin(h), c = Math.cos(h);
  return [c, x * s, y * s, z * s];        // [w,x,y,z]
}

/**
 * @param {[number, number, number, number]} a
 * @param {[number, number, number, number]} b
 * @returns {[number, number, number, number]}
 */
function quatMul(a, b) {                   // a ⊗ b
  const aw=a[0], ax=a[1], ay=a[2], az=a[3];
  const bw=b[0], bx=b[1], by=b[2], bz=b[3];
  return [
    aw*bw - ax*bx - ay*by - az*bz,
    aw*bx + ax*bw + ay*bz - az*by,
    aw*by - ax*bz + ay*bw + az*bx,
    aw*bz + ax*by - ay*bx + az*bw,
  ];
}

/**
 * @param {[number, number, number, number]} q
 * @returns {[number, number, number, number]}
 */
function quatNormalize(q) {
  const inv = 1 / Math.hypot(q[0], q[1], q[2], q[3]);
  return [q[0]*inv, q[1]*inv, q[2]*inv, q[3]*inv];
}


/**
 * @param {[number, number, number]} v
 * @param {[number, number, number, number]} q
 * @returns {[number, number, number]}
 */
function rotateVecByQuat3(v, q) {
  const w=q[0], x=q[1], y=q[2], z=q[3];
  // t = 2 * (u × v)
  const tx = 2 * (y*v[2] - z*v[1]);
  const ty = 2 * (z*v[0] - x*v[2]);
  const tz = 2 * (x*v[1] - y*v[0]);
  // v' = v + w*t + u × t
  return [
    v[0] + w*tx + (y*tz - z*ty),
    v[1] + w*ty + (z*tx - x*tz),
    v[2] + w*tz + (x*ty - y*tx),
  ];
}

