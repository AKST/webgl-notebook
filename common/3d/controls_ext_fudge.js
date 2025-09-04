import { createInput } from './controls.js';

/**
 * @param {number} initial
 * @returns {{
 *   value: number,
 * }}
 */
export function installControlExtFudge(initial) {
  const ctrlEl = document.getElementById('form-controls');
  if (ctrlEl == null) return { value: 0 };

  const statOut = document.createElement('span');
  let fudge = initial;

  /** @param {number} value */
  const setFudge = value => {
    fudge = value;
    statOut.innerText = value.toFixed(2);
  };

  const fudgeEls = createInput(
    'ctrl-perspective-fudge',
    'Perspective Fudge',
    -10, 10, fudge,
    setFudge,
  );

  ctrlEl.appendChild(fudgeEls.label);
  ctrlEl.appendChild(fudgeEls.input);

  const statsEl = document.getElementById('stats-tranform-state');
  if (statsEl) {
    const label = document.createElement('label');
    label.innerText = 'Fudge';

    statsEl.appendChild(label);
    statsEl.appendChild(statOut);
  }

  setFudge(fudge);

  return {
    get value() { return fudge },
  };
}
