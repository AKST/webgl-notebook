/**
 * @typedef {{ value: number, min: number, max: number }} InputCfg
 */
import { createInput } from './controls.js';

/**
 * @param {{
 *   fov: InputCfg,
 *   near: Partial<InputCfg>,
 *   far: Partial<InputCfg>,
 * }} config
 * @returns {{
 *   fov: number,
 *   near: number,
 *   far: number,
 * }}
 */
export function installControlExtFov(config) {
  const ctrlEl = document.getElementById('form-controls');
  if (ctrlEl == null) return { fov: 0, near: 0, far: 1 };

  const fovOut = document.createElement('span');
  const nearOut = document.createElement('span');
  const farOut = document.createElement('span');
  let fov = config.fov.value;
  let near = config.near.value ?? 1;
  let far = config.far.value ?? 2000;

  /** @param {number} value */
  const setFov = value => {
    fov = value;
    fovOut.innerText = value.toFixed(2);
  };

  /** @param {number} value */
  const setNear = value => {
    near = value;
    nearOut.innerText = value.toFixed(2);
  };

  /** @param {number} value */
  const setFar = value => {
    far = value;
    farOut.innerText = value.toFixed(2);
  };

  const fovEls = createInput(
    'ctrl-perspective-fov',
    'Field of View',
    0, 5, fov,
    setFov,
  );

  ctrlEl.appendChild(fovEls.label);
  ctrlEl.appendChild(fovEls.input);

  // defaults for near & far, because fov is
  // radians it doesn't make sense to use the
  // same scale.
  const DEFMIN = -2000, DEFMAX = +2000;

  const nearEls = createInput(
    'ctrl-perspective-fov',
    'FOV (near)',
    config.near.min ?? DEFMIN,
    config.near.max ?? DEFMAX,
    near,
    setNear,
  );

  ctrlEl.appendChild(nearEls.label);
  ctrlEl.appendChild(nearEls.input);

  const farEls = createInput(
    'ctrl-perspective-fov',
    'FOV (far)',
    config.far.min ?? DEFMIN,
    config.far.max ?? DEFMAX,
    far,
    setFar,
  );

  ctrlEl.appendChild(farEls.label);
  ctrlEl.appendChild(farEls.input);

  const statsEl = document.getElementById('stats-tranform-state');
  if (statsEl) {
    const fovLabel = document.createElement('label');
    fovLabel.innerText = 'FOV';

    statsEl.appendChild(fovLabel);
    statsEl.appendChild(fovOut);

    const nearLabel = document.createElement('label');
    nearLabel.innerText = 'FOV (near)';

    statsEl.appendChild(nearLabel);
    statsEl.appendChild(nearOut);
  }

  setFov(fov);

  return {
    get far() { return far },
    get fov() { return fov },
    get near() { return near },
  };
}
