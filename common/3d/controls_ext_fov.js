import { createInput } from './controls.js';

/**
 * @param {number} initial
 * @returns {{
 *   value: number,
 * }}
 */
export function installControlExtFov(initial) {
  const ctrlEl = document.getElementById('form-controls');
  if (ctrlEl == null) return { value: 0 };

  const statOut = document.createElement('span');
  let fov = initial;

  /** @param {number} value */
  const setFov = value => {
    fov = value;
    statOut.innerText = value.toFixed(2);
  };

  const fovEls = createInput(
    'ctrl-perspective-fov',
    'Field of View',
    0, 5, fov,
    setFov,
  );

  ctrlEl.appendChild(fovEls.label);
  ctrlEl.appendChild(fovEls.input);

  const statsEl = document.getElementById('stats-tranform-state');
  if (statsEl) {
    const label = document.createElement('label');
    label.innerText = 'Fov';

    statsEl.appendChild(label);
    statsEl.appendChild(statOut);
  }

  setFov(fov);

  return {
    get value() { return fov },
  };
}
