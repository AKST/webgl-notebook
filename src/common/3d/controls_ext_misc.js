import { createOutPair as outputPair } from './controls.js';

/**
 * @param {ConfigSource} config
 * @param {string} id
 * @param {number} initial
 * @param {string} name
 * @param {[number, number]} minmax
 * @param {string} [step]
 * @returns {{
 *   value: number,
 * }}
 */
export function installMiscNumKnob(config, id, initial, name, minmax, step) {
  const ctrlEl = document.getElementById('form-controls');
  if (ctrlEl == null) return { value: initial };

  const statOut = outputPair(`stat-${id}-out`, name, initial.toFixed(2));
  let fudge = initial;

  /** @param {number} value */
  const setValue = value => {
    fudge = value;
    statOut.out.innerText = value.toFixed(2);
  };

  const ctrlId = `ctrl-${id}`;
  config.monitorConfig(ctrlId, name, ...minmax, fudge, setValue, step);

  const statsEl = document.getElementById('stats-tranform-state');
  statsEl?.appendChild(statOut.label);
  statsEl?.appendChild(statOut.out);
  setValue(fudge);

  return {
    get value() { return fudge },
  };
}
