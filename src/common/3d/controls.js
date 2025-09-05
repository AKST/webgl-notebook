/**
 *
 * @typedef {{
 *   bounds: [number, number],
 * }} Screen
 *
 * @typedef {[number, number, number]} A3
 * @typedef {{ translate: A3, rotation: A3 }} Player
 * @typedef {{ translate: A3, scale: A3, rotation: A3 }} Entity
 *
 * @typedef {(
 *  | { kind: 'resize' }
 * )} ExternalEvent
 *
 * @typedef {{
 *   player: Player;
 *   screen: Screen;
 *   entity: Entity;
 *   events: ExternalEvent[],
 * }} State
 *
 * @typedef {{
 *   player: {
 *     translate: number,
 *     rotation: number,
 *   },
 *   entity: {
 *     translate: number,
 *     rotation: number,
 *     scale: number,
 *   },
 * }} Deltas
 *
 * @typedef {(
 *  | { kind: 'set-active-keys', keys: string[] }
 *  | { kind: 'init-stats' }
 *  | { kind: 'update-entity-translate' }
 *  | { kind: 'update-entity-rotation' }
 *  | { kind: 'update-entity-scale' }
 *  | { kind: 'delta', index: 0 | 1 | 2, dir: 1 | -1, t: number, array: A3, delta: number }
 * )} InternalEffect
 *
 * @typedef {(
 *   | 'a' | 'd' | 'w' | 's' | 'q' | 'e'
 *   | '1' | '!' | '2' | '@' | '3' | '#'
 *   | 'j' | 'l' | 'i' | 'k' | 'u' | 'o'
 *   | '7' | '&' | '8' | '*' | '9' | '('
 *   | 'n' | 'm' | ','
 *   | 'N' | 'M' | '<'
 * )} PlayerInput
 *
 * @typedef {Record<PlayerInput, number | undefined>} KeyboardState
 */

class Unreachable extends Error {
  /** @param {never} value */
  constructor(value) {
    super(JSON.stringify(value, null, 2));
  }
}

/**
 * @param {string} id
 * @param {string} name
 * @param {string} init
 * @returns {{ label: HTMLElement, out: HTMLElement }}
 */
export function createOutPair(id, name, init) {
  const label = document.createElement('strong');
  label.innerText = name;
  label.id = id;

  const out = document.createElement('span');
  out.setAttribute('aria-labelledby', id);
  out.innerText = init;
  out.style.fontFamily = 'monospace';
  return { label, out };
}


/**
 * @param {string} id
 * @param {string} labelText
 * @param {number} min
 * @param {number} max
 * @param {number} value
 * @param {(v: number) => void} onChange
 * @param {string} [step]
 * @returns {{ label: HTMLLabelElement, input: HTMLInputElement }}
 */
export const createInput = (id, labelText, min, max, value, onChange, step='any') => {
  const label = document.createElement('label');
  label.htmlFor = id
  label.innerText = labelText;
  const input = document.createElement('input');
  input.id = id;
  input.type = 'range';
  input.max = '' + max;
  input.min = '' + min;
  input.value = '' +value;
  input.step = step;

  let mousedown = false;
  input.addEventListener('change', () => onChange(parseFloat(input.value)));
  input.addEventListener('mousedown', () => mousedown = true);
  input.addEventListener('mouseup', () => mousedown = false);
  input.addEventListener('mousemove', () => mousedown && onChange(parseFloat(input.value)));

  return { label, input };
}

/**
 * @param {KeyboardState} keyboard
 * @returns {string[]}
 */
function activeKeys(keyboard) {
  return Object.keys(keyboard).filter(k => keyboard[/** @type {keyof keyboard} */ (k)] != null);
}

/**
 * @param {string} key
 * @returns {[PlayerInput | undefined, PlayerInput | undefined]}
 */
function getKeyAsInput(key) {
  /** @type {PlayerInput | undefined} */
  let press = undefined;

  /** @type {PlayerInput | undefined} */
  let unpress = undefined;

  switch (key) {
    case 'A':
    case 'a':
      press = 'a';
      break;

    case 'W':
    case 'w':
      press = 'w';
      break;

    case 'S':
    case 's':
      press = 's';
      break;

    case 'D':
    case 'd':
      press = 'd';
      break;

    case 'Q':
    case 'q':
      press = 'q';
      break;

    case 'e':
    case 'E':
      press = 'e';
      break;

    case 'J':
    case 'j':
      press = 'j';
      break;

    case 'I':
    case 'i':
      press = 'i';
      break;

    case 'K':
    case 'k':
      press = 'k';
      break;

    case 'L':
    case 'l':
      press = 'l';
      break;

    case 'U':
    case 'u':
      press = 'u';
      break;

    case 'O':
    case 'o':
      press = 'o';
      break;

    case '1':
      [press, unpress] = ['1', '!'];
      break;

    case '!':
      [press, unpress] = ['!', '1'];
      break;

    case '2':
      [press, unpress] = ['2', '@'];
      break;

    case '@':
      [press, unpress] = ['@', '2'];
      break;

    case '3':
      [press, unpress] = ['3', '#'];
      break;

    case '#':
      [press, unpress] = ['#', '3'];
      break;

    case '7':
      [press, unpress] = ['7', '&'];
      break;

    case '&':
      [press, unpress] = ['&', '7'];
      break;

    case '8':
      [press, unpress] = ['8', '*'];
      break;

    case '*':
      [press, unpress] = ['*', '8'];
      break;

    case '9':
      [press, unpress] = ['9', '('];
      break;

    case '(':
      [press, unpress] = ['(', '9'];
      break;

    case 'n':
      [press, unpress] = ['n', 'N'];
      break;

    case 'N':
      [press, unpress] = ['N', 'n'];
      break;

    case 'm':
      [press, unpress] = ['m', 'M'];
      break;

    case 'M':
      [press, unpress] = ['M', 'm'];
      break;

    case ',':
      [press, unpress] = [',', '<'];
      break;

    case '<':
      [press, unpress] = ['<', ','];
      break;

    default:
      break;
  }

  return [press, unpress];
}

/**
 * @param {KeyboardState} keyboard
 * @returns {[PlayerInput[], PlayerInput[]]}
 */
function getShiftAsInput(keyboard) {
  /** @type {PlayerInput[]} */
  const pressed = [];

  /** @type {PlayerInput[]} */
  const unpressed = [];

  for (const [k, v] of Object.entries(keyboard)) {
    if (v == null) continue;
    const [a, b] = getKeyAsInput(k);

    if (a == null || b == null) continue;
    pressed.push(b);
    unpressed.push(a);
  }

  return [pressed, unpressed];
}

/**
 * @param {KeyboardState} keys
 * @param {State} state
 * @param {Deltas} d
 * @param {number} start
 * @returns {Generator<InternalEffect>}
 */
function * stateEffects(
  keys,
  { entity: es },
  { entity: ed },
  start,
) {
  /**
   * @param {A3} array
   * @param {number} delta
   * @param {0 | 1 | 2} index
   * @param {1 | -1} dir
   * @param {keyof keys} key
   * @returns {InternalEffect}
   */
  const diff = (array, delta, index, dir, key) => {
    const t = /** @type {number} */ (keys[key]);
    keys[key] = start;
    return { kind: 'delta', array, delta, index, dir, t };
  }

  if (keys['l']) yield diff(es.translate, ed.translate, 0, 1, 'l');
  if (keys['j']) yield diff(es.translate, ed.translate, 0, -1, 'j');
  if (keys['u']) yield diff(es.translate, ed.translate, 1, -1, 'u');
  if (keys['o']) yield diff(es.translate, ed.translate, 1, 1, 'o');
  if (keys['i']) yield diff(es.translate, ed.translate, 2, 1, 'i');
  if (keys['k']) yield diff(es.translate, ed.translate, 2, -1, 'k');

  if (keys['7']) yield diff(es.rotation, ed.rotation, 0, 1, '7');
  if (keys['&']) yield diff(es.rotation, ed.rotation, 0, -1, '&');
  if (keys['8']) yield diff(es.rotation, ed.rotation, 1, 1, '8');
  if (keys['*']) yield diff(es.rotation, ed.rotation, 1, -1, '*');
  if (keys['9']) yield diff(es.rotation, ed.rotation, 2, 1, '9');
  if (keys['(']) yield diff(es.rotation, ed.rotation, 2, -1, '(');

  if (keys['n']) yield diff(es.scale, ed.scale, 0, 1, 'n');
  if (keys['N']) yield diff(es.scale, ed.scale, 0, -1, 'N');
  if (keys['m']) yield diff(es.scale, ed.scale, 1, 1, 'm');
  if (keys['M']) yield diff(es.scale, ed.scale, 1, -1, 'M');
  if (keys[',']) yield diff(es.scale, ed.scale, 2, 1, ',');
  if (keys['<']) yield diff(es.scale, ed.scale, 2, -1, '<');

  if (keys['j'] || keys['k'] || keys['l'] || keys['i'] || keys['u'] || keys['o']) {
    yield { kind: 'update-entity-translate' };
  }

  if (keys['7'] || keys['&'] || keys['8'] || keys['*'] || keys['9'] || keys['(']) {
    yield { kind: 'update-entity-rotation' };
  }

  if (keys['n'] || keys['N'] || keys['m'] || keys['M'] || keys[','] || keys['<']) {
    yield { kind: 'update-entity-scale' };
  }
}

/**
 * @param {{
 *   window: Pick<Window, 'innerWidth' | 'innerHeight' | 'addEventListener'>,
 *   player?: Partial<Player>,
 *   playerDelta?: { translate?: number, rotation?: number },
 *   entity?: Partial<Entity>,
 *   entityDelta?: { scale?: number, translate?: number, rotation?: number },
 * }} cfg
 * @returns {State}
 */
export function initControls({
  window,
  player: playerInit={},
  playerDelta = {},
  entity: entityInit={},
  entityDelta = {},
}) {
  /** @type {[number, number]} */
  const bounds = [window.innerWidth, window.innerHeight];

  /** @type {Deltas} */
  const deltas = {
    player: {
      translate: playerDelta.translate ?? 1,
      rotation: playerDelta.rotation ??  0.5,
    },
    entity: {
      translate: entityDelta.translate ?? 1,
      rotation: entityDelta.rotation ??  0.5,
      scale: entityDelta.scale ??  0.5,
    },
  };

  /** @type {[number, number, number]} */
  const pTranslate = playerInit.translate ?? [0, 0, 0];

  /** @type {[number, number, number]} */
  const pRotation = playerInit.rotation ?? [0, 0, 0];

  /** @type {[number, number, number]} */
  const eTranslate = entityInit.translate ?? [0, 0, 0];

  /** @type {[number, number, number]} */
  const eScale = entityInit.scale ?? [1, 1, 1];

  /** @type {[number, number, number]} */
  const eRotation = entityInit.rotation ?? [0, 0, 0];

  /** @type {ExternalEvent[]} */
  const exEvents = [];

  /** @type {InternalEffect[]} */
  const events = [];

  const domLeafs = {
    entity: {
      translate: createOutPair('stat-entity-translate', 'Entity Translate', ''),
      rotation: createOutPair('stat-entity-rotate', 'Entity Rotation', ''),
      scale: createOutPair('stat-entity-scale', 'Entity Scale', ''),
    },
    activeKeys: createOutPair('stat-activekeys', 'Active Keys', ''),
  };

  /** @type {State} */
  const state = {
    events: exEvents,
    screen: { bounds },
    player: { translate: pTranslate, rotation: pRotation },
    entity: {
      translate: eTranslate,
      scale: eScale,
      rotation: eRotation,
    },
  };

  /**
   * @param {InternalEffect} effect
   * @param {number} t
   */
  function internalEffect(effect, t) {
    switch (effect.kind) {
      case 'set-active-keys':
        domLeafs.activeKeys.out.innerText = effect.keys.join(', ');
        break;

      case 'init-stats':
        internalEffect({ kind: 'update-entity-translate' }, t);
        internalEffect({ kind: 'update-entity-rotation' }, t);
        internalEffect({ kind: 'update-entity-scale' }, t);
        break;

      case 'update-entity-translate':
        domLeafs.entity.translate.out.innerText = `[${eTranslate.map(e => e.toFixed(2)).join(', ')}]`;
        break;

      case 'update-entity-rotation':
        domLeafs.entity.rotation.out.innerText = `[${eRotation.map(e => e.toFixed(2)).join(', ')}]`;
        break;

      case 'update-entity-scale':
        domLeafs.entity.scale.out.innerText = `[${eScale.map(e => e.toFixed(2)).join(', ')}]`;
        break;

      case 'delta':
        effect.array[effect.index] += effect.dir * effect.delta * ((t - effect.t) / 1000);
        break;

      default:
        throw new Unreachable(effect);
    }
  }

  /** @type {KeyboardState} */
  const keys = {
    w: undefined,
    a: undefined,
    s: undefined,
    d: undefined,
    q: undefined,
    e: undefined,
    1: undefined,
    2: undefined,
    3: undefined,
    '!': undefined,
    '@': undefined,
    '#': undefined,

    j: undefined,
    i: undefined,
    k: undefined,
    l: undefined,
    u: undefined,
    o: undefined,
    7: undefined,
    8: undefined,
    9: undefined,
    '&': undefined,
    '*': undefined,
    '(': undefined,
    n: undefined,
    m: undefined,
    ',': undefined,
    N: undefined,
    M: undefined,
    '<': undefined,
  };

  requestAnimationFrame(function f(t) {
    try {
      while (true) {
        const next = events.pop();
        if (next == null) break;
        internalEffect(next, t);
      }

      for (const eff of stateEffects(keys, state, deltas, t)) {
        internalEffect(eff, t);
      }

      requestAnimationFrame(f);
    } catch (e) {
      console.error(e);
    }
  });

  window.addEventListener('resize', () => {
    bounds[0] = window.innerWidth;
    bounds[1] = window.innerHeight;
    exEvents.push({ kind: 'resize' });
  });

  /** @param {KeyboardEvent} event */
  window.addEventListener('keydown', event => {
    if (event.key === 'Shift') {
      const [press, unpress] = getShiftAsInput(keys);
      for (const k of press) keys[k] = performance.now();
      for (const k of unpress) keys[k] = undefined;
    } else {
      const [press, unpress] = getKeyAsInput(event.key);
      if (press) keys[press] = performance.now();
      if (unpress) keys[unpress] = undefined;
    }
    events.push({ kind: 'set-active-keys', keys: activeKeys(keys) });
  });

  /** @param {KeyboardEvent} event */
  window.addEventListener('keyup', event => {
    if (event.key === 'Shift') {
      const [press, unpress] = getShiftAsInput(keys);
      for (const k of press) keys[k] = performance.now();
      for (const k of unpress) keys[k] = undefined;
    } else {
      const [press] = getKeyAsInput(event.key);
      if (press) keys[press] = undefined;
    }
    events.push({ kind: 'set-active-keys', keys: activeKeys(keys) });
  });

  const statsEl = document.getElementById('stats-tranform-state');
  if (statsEl) {
    statsEl.appendChild(domLeafs.entity.translate.label);
    statsEl.appendChild(domLeafs.entity.translate.out);
    statsEl.appendChild(domLeafs.entity.rotation.label);
    statsEl.appendChild(domLeafs.entity.rotation.out);
    statsEl.appendChild(domLeafs.entity.scale.label);
    statsEl.appendChild(domLeafs.entity.scale.out);
    statsEl.appendChild(domLeafs.activeKeys.label);
    statsEl.appendChild(domLeafs.activeKeys.out);
  }

  internalEffect({ kind: 'init-stats' }, performance.now());

  const ctrlEl = document.getElementById('form-controls');
  if (ctrlEl) {
    const etd = createInput(
      'ctrl-entity-tr-d', 'E Translate Delta',
      -1000, 1000, deltas.entity.translate,
      v => deltas.entity.translate = v);

    const erd = createInput(
      'ctrl-entity-ro-d', 'E Rotate Delta',
      -10, 10, deltas.entity.rotation,
      v => deltas.entity.rotation = v);

    const esd = createInput(
      'ctrl-entity-sc-d', 'E Scale Delta',
      -10, 10, deltas.entity.scale,
      v => deltas.entity.scale = v);

    ctrlEl.appendChild(etd.label);
    ctrlEl.appendChild(etd.input);
    ctrlEl.appendChild(erd.label);
    ctrlEl.appendChild(erd.input);
    ctrlEl.appendChild(esd.label);
    ctrlEl.appendChild(esd.input);
  }


  return state;
}
