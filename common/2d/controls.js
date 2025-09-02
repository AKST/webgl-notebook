/**
 * @param {{
 *   translate: {
 *     set: (v: [number, number]) => void,
 *     range: [[number, number], [number, number]],
 *     value: [number, number],
 *     delta: [number, number],
 *     update: (v: [number, number]) => void,
 *   },
 *   scale: {
 *     set: (v: [number, number]) => void,
 *     value: [number, number],
 *     delta: [number, number],
 *     update: (v: [number, number]) => void,
 *   },
 *   rotation: {
 *     set: (v: number) => void,
 *     update: (v: number) => void,
 *     delta: number,
 *   },
 * }} options
 */
export function install2DControls({
  translate,
  scale,
  rotation,
}) {
  const form = document.getElementById('form-controls');
  if (!form) throw new Error('form not defined');

  const controls = initaliseForm(form, {
    scale: scale.value,
    translate: translate.value,
    translateRange: translate.range,
  });

  /**
   * @param {HTMLInputElement} e
   * @param {(v: number) => void} cb
   */
  function onUpdate(e, cb) {
    let mousedown = false;
    e.addEventListener('change', () => cb(parseFloat(e.value)));
    e.addEventListener('mousedown', () => mousedown = true);
    e.addEventListener('mouseup', () => mousedown = false);
    e.addEventListener('mousemove', () => mousedown && cb(parseFloat(e.value)));
  }

  const updateT = () => translate.set([
    parseFloat(controls.translateX.value),
    parseFloat(controls.translateY.value)
  ])

  const updateS = () => scale.set([
    parseFloat(controls.scaleX.value),
    parseFloat(controls.scaleY.value)
  ])

  onUpdate(controls.translateX, updateT)
  onUpdate(controls.translateY, updateT)
  onUpdate(controls.rotation, rotation.set)
  onUpdate(controls.scaleX, updateS)
  onUpdate(controls.scaleY, updateS)

  /** @type {Record<'a' | 'q' | 'w' | 'e' | 's' | 'd' | 'z' | 'Z' | 'x' | 'X', number | undefined>} */
  const keys = {
    q: undefined,
    w: undefined,
    e: undefined,
    a: undefined,
    s: undefined,
    d: undefined,
    z: undefined,
    x: undefined,
    Z: undefined,
    X: undefined,
  };


  /** @param {keyof keys} k */
  function set(k) {
    if (!keys[k]) keys[k] = performance.now();
  }

  /** @param {keyof keys} k */
  function unset(k) {
    keys[k] = undefined;
  }

  /** @param {KeyboardEvent} event */
  document.addEventListener('keydown', event => {
    const lowerKey = event.key.toLowerCase();
    switch (lowerKey) {
      case 'q':
      case 'w':
      case 'e':
      case 'a':
      case 's':
      case 'd':
      case 'z':
      case 'x':
        set(lowerKey);
        break;

      default:
        break;
    }

    switch (event.key) {
      case 'z':
        set('z');
        unset('Z');
        break;

      case 'Z':
        set('Z');
        unset('z');
        break;

      case 'x':
        set('x');
        unset('X');
        break;

      case 'X':
        set('X');
        unset('x');
        break;

      case 'Shift':
        if (keys.x) {
          set('X');
          unset('x');
        }
        if (keys.z) {
          set('Z');
          unset('z');
        }
        break;

      default:
        break;
    }
  });

  /** @param {KeyboardEvent} event */
  document.addEventListener('keyup', event => {
    const lowerKey = event.key.toLowerCase();

    switch (lowerKey) {
      case 'q':
      case 'w':
      case 'e':
      case 'a':
      case 's':
      case 'd':
        keys[lowerKey] = undefined;
        break;

      default:
        break;
    }

    switch (event.key) {
      case 'z':
      case 'Z':
        keys.z = undefined;
        keys.Z = undefined;
        break;

      case 'x':
      case 'X':
        keys.x = undefined;
        keys.X = undefined;
        break;

      case 'Shift':
        if (keys.X) {
          set('x');
          unset('X');
        }
        if (keys.Z) {
          set('z');
          unset('Z');
        }
        break;

      default:
        break;
    }
  });

  requestAnimationFrame(function f(t) {
    if (keys.q ? !keys.e : keys.e) {
      let sign = 0, start = 0;

      if (keys.q) [start, sign, keys.q] = [keys.q, -1, t];
      if (keys.e) [start, sign, keys.e] = [keys.e, 1, t];

      rotation.update(((t - start) / 1000) * sign * rotation.delta);
    }

    if (keys.a ? !keys.d : keys.d) {
      let sign = 0, start = 0

      if (keys.a) [start, sign, keys.a] = [keys.a, -1, t];
      if (keys.d) [start, sign, keys.d] = [keys.d, 1, t];

      translate.update([
        ((t - start) / 1000) * sign * translate.delta[0],
        0,
      ]);
    }

    if (keys.w ? !keys.s : keys.s) {
      let sign = 0, start = 0

      if (keys.s) [start, sign, keys.s] = [keys.s, -1, t];
      if (keys.w) [start, sign, keys.w] = [keys.w, 1, t];

      translate.update([
        0,
        ((t - start) / 1000) * sign * translate.delta[1],
      ]);
    }

    if (keys.z ? !keys.Z : keys.Z) {
      let sign = 0, start = 0

      if (keys.Z) [start, sign, keys.Z] = [keys.Z, -1, t];
      if (keys.z) [start, sign, keys.z] = [keys.z, 1, t];

      scale.update([
        ((t - start) / 1000) * sign,
        0,
      ]);
    }

    if (keys.x ? !keys.X : keys.X) {
      let sign = 0, start = 0

      if (keys.X) [start, sign, keys.X] = [keys.X, -1, t];
      if (keys.x) [start, sign, keys.x] = [keys.x, 1, t];

      scale.update([
        0,
        ((t - start) / 1000) * sign,
      ]);
    }

    requestAnimationFrame(f);
  });
}

/**
 * @param {HTMLElement} element
 * @param {{
 *  scale: [number, number],
 *  translate: [number, number],
 *  translateRange: [[number, number], [number, number]],
 * }} defaults
 * @returns {{
 *   translateX: HTMLInputElement;
 *   translateY: HTMLInputElement;
 *   rotation: HTMLInputElement;
 *   scaleX: HTMLInputElement;
 *   scaleY: HTMLInputElement;
 * }}
 */
export function initaliseForm(element, defaults) {
  const translateX = createRange('ctrl-translate-x', 'any',
                                 defaults.translateRange[0][0],
                                 defaults.translateRange[0][1],
                                 defaults.translate[0]);
  const translateY = createRange('ctrl-translate-y', 'any',
                                 defaults.translateRange[1][0],
                                 defaults.translateRange[1][1],
                                 defaults.translate[1]);

  const rotation = createRange('ctrl-rotation', 'any', 0, 10, 0);
  const scaleX = createRange('ctrl-scale-x', 'any', -3, 3, defaults.scale[0]);
  const scaleY = createRange('ctrl-scale-y', 'any', -3, 3, defaults.scale[1]);

  element.appendChild(createLabel('ctrl-translate-x', 'Translate X'));
  element.appendChild(translateX);
  element.appendChild(createLabel('ctrl-translate-y', 'Translate Y'));
  element.appendChild(translateY);
  element.appendChild(createLabel('ctrl-rotation', 'Rotate'));
  element.appendChild(rotation);
  element.appendChild(createLabel('ctrl-scale-x', 'Scale X'));
  element.appendChild(scaleX);
  element.appendChild(createLabel('ctrl-scale-y', 'Scale Y'));
  element.appendChild(scaleY);

  return {
    scaleX, scaleY,
    translateX, translateY,
    rotation,
  };
}

/**
 * @param {string} id
 * @param {string} name
 * @returns {HTMLLabelElement}
 */
function createLabel(id, name) {
  const label = document.createElement('label');
  label.appendChild(document.createTextNode(name));
  label.htmlFor = id;
  return label;
}

/**
 * @param {string} id
 * @param {string} step
 * @param {number} min
 * @param {number} max
 * @param {number} value
 * @returns {HTMLInputElement}
 */
function createRange(id, step, min, max, value) {
  const input = document.createElement('input');
  input.id = id;
  input.type = 'range';
  input.step = step;
  input.min = min + '';
  input.max = max + '';
  input.value = value + '';
  return input;
}
