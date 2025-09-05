// ----------------- Quaternion utils ([x,y,z,w], w last) -----------------
/**
 * @param {number} ax
 * @param {number} ay
 * @param {number} az
 * @param {number} angle
 * @returns {[number, number, number, number]} // [x,y,z,w]
 */
function axisAngleQuat(ax, ay, az, angle) {
  const len = Math.hypot(ax, ay, az) || 1;
  const x = ax / len, y = ay / len, z = az / len;
  const h = angle * 0.5, s = Math.sin(h), w = Math.cos(h);
  return [x * s, y * s, z * s, w];
}

/**
 * @param {[number, number, number, number]} a // [x,y,z,w]
 * @param {[number, number, number, number]} b // [x,y,z,w]
 * @returns {[number, number, number, number]} // a ⊗ b
 */
function quatMul(a, b) {
  const ax=a[0], ay=a[1], az=a[2], aw=a[3];
  const bx=b[0], by=b[1], bz=b[2], bw=b[3];
  return [
    aw*bx + ax*bw + ay*bz - az*by,
    aw*by - ax*bz + ay*bw + az*bx,
    aw*bz + ax*by - ay*bx + az*bw,
    aw*bw - (ax*bx + ay*by + az*bz),
  ];
}

/**
 * @param {[number, number, number, number]} q
 * @returns {[number, number, number, number]}
 */
function quatNormalize(q) {
  const n = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
  return [q[0]/n, q[1]/n, q[2]/n, q[3]/n];
}

/**
 * Rotate vec3 by quaternion q ([x,y,z,w]) using fast form.
 * @param {[number, number, number]} v
 * @param {[number, number, number, number]} q
 * @returns {[number, number, number]}
 */
function rotateVecByQuat3(v, q) {
  const x=q[0], y=q[1], z=q[2], w=q[3];
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

// ----------------- (Optional) Euler → quat helper -----------------
/**
 * @param {[number, number, number]} euler // [rx, ry, rz] radians
 * @returns {[number, number, number, number]} // [x,y,z,w]
 */
export function quatFromEulerXYZ([rx, ry, rz]) {
  const cx = Math.cos(rx*0.5), sx = Math.sin(rx*0.5);
  const cy = Math.cos(ry*0.5), sy = Math.sin(ry*0.5);
  const cz = Math.cos(rz*0.5), sz = Math.sin(rz*0.5);
  // intrinsic X→Y→Z
  return [
    sx*cy*cz - cx*sy*sz,                   // x
    cx*sy*cz + sx*cy*sz,                   // y
    cx*cy*sz - sx*sy*cz,                   // z
    cx*cy*cz + sx*sy*sz,                   // w
  ];
}

// ----------------- Rotation update (yaw then pitch) -----------------
/**
 * Mutates quaternion `state` ([x,y,z,w]) by small yaw/pitch deltas.
 * @param {[number, number, number, number]} state  // quat [x,y,z,w] (mutated)
 * @param {[number, number]} rotation               // [yawDelta, pitchDelta] in radians
 * @param {number} rate                             // multiplier (e.g., sensitivity * dt)
 */
export function applyRotation(state, rotation, rate) {
  const yaw   = (rotation[0] || 0) * rate;
  const pitch = (rotation[1] || 0) * rate;

  // 1) yaw about world up (0,1,0): q ← R_yaw ⊗ q
  let q = quatNormalize(quatMul(axisAngleQuat(0, 1, 0, yaw), state));

  // 2) pitch about camera's current right axis
  const right = rotateVecByQuat3([1, 0, 0], q);
  q = quatNormalize(quatMul(axisAngleQuat(right[0], right[1], right[2], pitch), q));

  state[0]=q[0]; state[1]=q[1]; state[2]=q[2]; state[3]=q[3];
}

// ----------------- Planar movement (FPS-style) -----------------
/**
 * Planar move: forward/strafe flattened onto the XZ plane (world-up = +Y),
 * while delta[1] moves strictly along world-up (up/down).
 *
 * @param {[number, number, number]} position            // mutated
 * @param {[number, number, number, number]} rotation    // quat [x,y,z,w]
 * @param {[number, number, number]} delta               // local [right, up, forward]
 * @param {number} difference                            // step scalar (speed * dt)
 */
export function applyDeltaNoclip(position, rotation, delta, difference) {
  // Normalize input so diagonals aren't faster:
  const len = Math.hypot(delta[0], delta[1], delta[2]) || 1;
  const d0 = delta[0] / len;  // strafe
  const d1 = delta[1] / len;  // vertical
  const d2 = delta[2] / len;  // forward

  // World-up axis
  const up = [0, 1, 0];

  // Camera forward in world, then flatten onto XZ plane:
  const fwd = rotateVecByQuat3([0, 0, 1], rotation);
  let fwdFlat = [
    fwd[0] - (fwd[0]*up[0] + fwd[1]*up[1] + fwd[2]*up[2]) * up[0],
    fwd[1] - (fwd[0]*up[0] + fwd[1]*up[1] + fwd[2]*up[2]) * up[1],
    fwd[2] - (fwd[0]*up[0] + fwd[1]*up[1] + fwd[2]*up[2]) * up[2],
  ];
  const fLen = Math.hypot(fwdFlat[0], fwdFlat[1], fwdFlat[2]);
  if (fLen > 1e-8) {
    fwdFlat = [fwdFlat[0]/fLen, fwdFlat[1]/fLen, fwdFlat[2]/fLen];
  } else {
    // Fallback if looking straight up/down: use world +Z
    fwdFlat = [0, 0, 1];
  }

  // Right vector on the plane: right = normalize(fwdFlat × up)
  let right = [
    fwdFlat[1]*up[2] - fwdFlat[2]*up[1],
    fwdFlat[2]*up[0] - fwdFlat[0]*up[2],
    fwdFlat[0]*up[1] - fwdFlat[1]*up[0],
  ];
  const rLen = Math.hypot(right[0], right[1], right[2]) || 1;
  right = [right[0]/rLen, right[1]/rLen, right[2]/rLen];

  // Compose planar move + vertical
  const world = [
    right[0]*d0 + up[0]*d1 + fwdFlat[0]*d2,
    right[1]*d0 + up[1]*d1 + fwdFlat[1]*d2,
    right[2]*d0 + up[2]*d1 + fwdFlat[2]*d2,
  ];

  position[0] += world[0] * difference;
  position[1] += world[1] * difference;
  position[2] += world[2] * difference;
}

