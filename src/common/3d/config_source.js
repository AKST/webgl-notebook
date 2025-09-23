/**
 * @import * as t from './type.ts';
 * @import { Debugger } from '../debugger.js';
 */

/**
 * @implements {t.ConfigSource}
 */
class LocalConfigSource {
  /** @type {HTMLElement} */
  #formControls;

  /** @param {HTMLElement} formControls */
  constructor(formControls) {
    this.#formControls = formControls;
  }

  /**
   * @type {t.ConfigSource['monitorConfig']}
   */
  monitorConfig(id, labelText, min, max, value, onChange) {
    const label = document.createElement('label');
    label.htmlFor = id
    label.innerText = labelText;

    const input = document.createElement('input');
    input.id = id;
    input.type = 'range';
    input.max = '' + max;
    input.min = '' + min;
    input.step = 'any';
    input.value = '' +value;

    let mousedown = false;
    input.addEventListener('change', () => onChange(parseFloat(input.value)));
    input.addEventListener('mousedown', () => mousedown = true);
    input.addEventListener('mouseup', () => mousedown = false);
    input.addEventListener('mousemove', () => mousedown && onChange(parseFloat(input.value)));

    this.#formControls.appendChild(label);
    this.#formControls.appendChild(input);
  }
}

/**
 * @implements {t.ConfigSource}
 */
class MessageConfigSource {
  /** @type {Debugger | undefined} */
  #debugger;

  /** @type {Map<string, (v: number) => void>} */
  #pointers = new Map();

  /** @param {Debugger | undefined} dbg */
  constructor(dbg) {
    this.#debugger = dbg;
  }

  /** @param {any} message */
  onMessage(message) {
    try {
      const { key, value } = message;
      const pointer = this.#pointers.get(key);
      pointer?.(value);
    } catch (e) {
      console.error(e);
    }
  }

  /**
   * @type {t.ConfigSource['monitorConfig']}
   */
  monitorConfig(id, _labelText, _min, _max, _value, onChange) {
    console.log(id);
    this.#pointers.set(id, onChange);
  }
}

/**
 * @param {Debugger | undefined} dbg
 * @param {(
 *   | { kind: 'local' }
 *   | { kind: 'message' }
 * )} mode
 * @returns {t.ConfigSource}
 */
export function initialConfigSource(dbg, mode) {
  switch (mode.kind) {
    case 'local': {
      const ctrlEl = document.getElementById('form-controls');
      if (ctrlEl == null) throw new Error();
      return new LocalConfigSource(ctrlEl);
    }

    case 'message': {
      const config = new MessageConfigSource(dbg);
      const controls = document.getElementById('controls');
      if (controls != null) {
        controls.style.display = 'none';
      }
      addEventListener('message', message => config.onMessage(message.data));
      return config;
    }

    default:
      throw new Error();
  }
}
