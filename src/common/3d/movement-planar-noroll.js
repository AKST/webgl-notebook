/**
 * @param {number} ax
 * @param {number} ay
 * @param {number} az
 * @param {number} angle
 * @returns {[number, number, number, number]} [x,y,z,w]
 */
function axisAngleQuat(ax, ay, az, angle) {
  const len = Math.hypot(ax, ay, az) || 1;
  const x = ax / len, y = ay / len, z = az / len;
  const h = angle * 0.5, s = Math.sin(h), w = Math.cos(h);
  return [x * s, y * s, z * s, w];
}


/**
 * @param {[number,number,number,number]} a
 * @param {[number,number,number,number]} b
 * @returns {[number,number,number,number]}
 */
function quatMul(a, b) {
  const ax=a[0], ay=a[1], az=a[2], aw=a[3];
  const bx=b[0], by=b[1], bz=b[2], bw=b[3];
  return [
    aw*bx + ax*bw + ay*bz - az*by, // x
    aw*by - ax*bz + ay*bw + az*bx, // y
    aw*bz + ax*by - ay*bx + az*bw, // z
    aw*bw - (ax*bx + ay*by + az*bz), // w
  ];
}

/**
 * @param {[number,number,number,number]} q
 * @returns {[number,number,number,number]}
 */
function quatNormalize(q) {
  const n = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
  return [q[0]/n, q[1]/n, q[2]/n, q[3]/n];
}

/**
 * Fast vec3 rotate by quaternion q ([x,y,z,w]).
 * @param {[number,number,number]} v
 * @param {[number,number,number,number]} q
 * @returns {[number,number,number]}
 */
function rotateVecByQuat3(v, q) {
  const x=q[0], y=q[1], z=q[2], w=q[3];
  const tx = 2 * (y*v[2] - z*v[1]);
  const ty = 2 * (z*v[0] - x*v[2]);
  const tz = 2 * (x*v[1] - y*v[0]);
  return [
    v[0] + w*tx + (y*tz - z*ty),
    v[1] + w*ty + (z*tx - x*tz),
    v[2] + w*tz + (x*ty - y*tx),
  ];
}

/**
 * Rebuild a quaternion with **zero roll** given the current orientation.
 * Keeps yaw & pitch w.r.t world up = +Y. Robust even when looking straight up/down.
 * @param {[number,number,number,number]} q
 * @returns {[number,number,number,number]} // upright quaternion
 */
function uprightQuat(q) {
  const f = rotateVecByQuat3([0, 0, 1], q);  // forward
  const r = rotateVecByQuat3([1, 0, 0], q);  // right

  const h = Math.hypot(f[0], f[2]); // horizontal length of forward
  const yaw = h > 1e-6 ? Math.atan2(f[0], f[2]) : Math.atan2(-r[2], r[0]);
  const pitch = Math.atan2(f[1], h);

  const qYaw   = axisAngleQuat(0, 1, 0, yaw);
  const rightY = rotateVecByQuat3([1, 0, 0], qYaw);
  const qPitch = axisAngleQuat(rightY[0], rightY[1], rightY[2], pitch);
  return quatNormalize(quatMul(qYaw, qPitch));
}

/**
 * Planar move: forward/strafe flattened to XZ plane; delta[1] is vertical.
 * @param {[number, number, number]} position             // mutated
 * @param {[number, number, number, number]} rotation     // quat [x,y,z,w]
 * @param {[number, number, number]} delta                // local [right, up, forward]
 * @param {number} difference                             // step scalar (speed * dt)
 */
export function applyDeltaNoclip(position, rotation, delta, difference) {
  // Normalize input so diagonals aren't faster:
  const len = Math.hypot(delta[0], delta[1], delta[2]) || 1;
  const d0 = delta[0] / len;  // strafe
  const d1 = delta[1] / len;  // vertical
  const d2 = delta[2] / len;  // forward

  const up = [0, 1, 0];

  // Camera forward, then flatten onto XZ:
  const fwd = rotateVecByQuat3([0, 0, 1], rotation);
  const dotFU = fwd[1]; // fwd•up (since up=[0,1,0])
  let fwdFlat = [ fwd[0], 0, fwd[2] ];
  let fLen = Math.hypot(fwdFlat[0], fwdFlat[2]);
  if (fLen > 1e-8) fwdFlat = [ fwdFlat[0]/fLen, 0, fwdFlat[2]/fLen ];
  else fwdFlat = [0, 0, 1]; // looking vertical: default forward

  // Right on plane: right = normalize(up × fwdFlat)
  let right = [
    up[1]*fwdFlat[2] - up[2]*fwdFlat[1],
    up[2]*fwdFlat[0] - up[0]*fwdFlat[2],
    up[0]*fwdFlat[1] - up[1]*fwdFlat[0],
  ];
  const rLen = Math.hypot(right[0], right[1], right[2]) || 1;
  right = [ right[0]/rLen, right[1]/rLen, right[2]/rLen ];

  // Compose move vector (planar + vertical)
  const world = [
    right[0]*d0 + 0*d1 + fwdFlat[0]*d2,
    0*d0      + 1*d1 + 0*d2,
    right[2]*d0 + 0*d1 + fwdFlat[2]*d2,
  ];

  position[0] += world[0] * difference;
  position[1] += world[1] * difference;
  position[2] += world[2] * difference;
}

/**
 * Mutates quaternion `state` ([x,y,z,w]) by deltas, then **locks roll**.
 * @param {[number, number, number, number]} state    // quat [x,y,z,w] (mutated)
 * @param {[number, number]} rotation                 // [yawDelta, pitchDelta] in radians
 * @param {number} rate                               // multiplier (sensitivity * dt)
 */
export function applyRotation(state, rotation, rate) {
  const yawDelta   = (rotation[0] || 0) * rate;  // about world-Y
  const pitchDelta = (rotation[1] || 0) * rate;  // about camera-right

  let q = quatNormalize(quatMul(axisAngleQuat(0, 1, 0, yawDelta), state));
  const right = rotateVecByQuat3([1, 0, 0], q);
  q = quatNormalize(quatMul(axisAngleQuat(right[0], right[1], right[2], pitchDelta), q));
  q = uprightQuat(q);

  state[0] = q[0];
  state[1] = q[1];
  state[2] = q[2];
  state[3] = q[3];
}


