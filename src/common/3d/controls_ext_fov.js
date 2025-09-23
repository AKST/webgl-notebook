/**
 * @import { ConfigSource } from './type.ts';
 * @typedef {{ value: number, min: number, max: number }} InputCfg
 */
import { createOutPair as outputPair } from './controls.js';

/**
 * @param {ConfigSource} config
 * @param {{
 *   fov: InputCfg,
 *   near: Partial<InputCfg>,
 *   far: Partial<InputCfg>,
 * }} options
 * @returns {{
 *   fov: number,
 *   near: number,
 *   far: number,
 * }}
 */
export function installControlExtFov(config, options) {
  let fov = options.fov.value;
  let near = options.near.value ?? 1;
  let far = options.far.value ?? 2000;
  const fovOut = outputPair('stat-fov-out', 'FOV', fov.toFixed(2));
  const nearOut = outputPair('stat-fov-near-out', 'FOV (near)', near.toFixed(2));
  const farOut = outputPair('stat-fov-far-out', 'FOV (far)', near.toFixed(2));

  const ctrlEl = document.getElementById('form-controls');
  if (ctrlEl == null) return { fov, near, far };

  /** @param {number} value */
  const setFov = value => {
    fov = value;
    fovOut.out.innerText = value.toFixed(2);
  };

  /** @param {number} value */
  const setNear = value => {
    near = value;
    nearOut.out.innerText = value.toFixed(2);
  };

  /** @param {number} value */
  const setFar = value => {
    far = value;
    farOut.out.innerText = value.toFixed(2);
  };

  config.monitorConfig(
    'ctrl-perspective-fov',
    'Field of View',
    0, 5, fov,
    setFov,
  );

  // defaults for near & far, because fov is
  // radians it doesn't make sense to use the
  // same scale.
  const DEFMIN = -2000, DEFMAX = +2000;

  config.monitorConfig(
    'ctrl-perspective-fov',
    'FOV (near)',
    options.near.min ?? DEFMIN,
    options.near.max ?? DEFMAX,
    near,
    setNear,
  );

  config.monitorConfig(
    'ctrl-perspective-fov',
    'FOV (far)',
    options.far.min ?? DEFMIN,
    options.far.max ?? DEFMAX,
    far,
    setFar,
  );

  const statsEl = document.getElementById('stats-tranform-state');
  if (statsEl) {
    statsEl.appendChild(fovOut.label);
    statsEl.appendChild(fovOut.out);
    statsEl.appendChild(nearOut.label);
    statsEl.appendChild(nearOut.out);
    statsEl.appendChild(farOut.label);
    statsEl.appendChild(farOut.out);
  }

  setFov(fov);
  setFar(far);
  setNear(near);

  return {
    get far() { return far },
    get fov() { return fov },
    get near() { return near },
  };
}
