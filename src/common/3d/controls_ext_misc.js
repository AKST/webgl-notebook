import { createOutPair as outputPair, createInput } from './controls.js';

/**
 * @param {string} id
 * @param {number} initial
 * @param {string} name
 * @param {[number, number]} minmax
 * @param {string} [step]
 * @returns {{
 *   value: number,
 * }}
 */
export function installMiscNumKnob(id, initial, name, minmax, step) {
  const ctrlEl = document.getElementById('form-controls');
  if (ctrlEl == null) return { value: 0 };

  const statOut = outputPair(`stat-${id}-out`, name, initial.toFixed(2));
  let fudge = initial;

  /** @param {number} value */
  const setValue = value => {
    fudge = value;
    statOut.out.innerText = value.toFixed(2);
  };

  const ctrlId = `ctrl-${id}`;
  const fudgeEls = createInput(ctrlId, name, ...minmax, fudge, setValue, step);

  ctrlEl.appendChild(fudgeEls.label);
  ctrlEl.appendChild(fudgeEls.input);

  const statsEl = document.getElementById('stats-tranform-state');
  statsEl?.appendChild(statOut.label);
  statsEl?.appendChild(statOut.out);
  setValue(fudge);

  return {
    get value() { return fudge },
  };
}
