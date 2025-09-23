/**
 * @import * as t from './type.ts';
 *
 * @typedef {{ label: HTMLLabelElement, input: HTMLInputElement }} InputElementPairs
 * @typedef {{ label: HTMLElement, out: HTMLSpanElement }} OutputElementPairs
 *
 * @typedef {{
 *   bounds: [number, number],
 * }} Screen
 *
 * @typedef {[number, number, number]} A3
 * @typedef {[number, number, number, number]} A4
 * @typedef {{ translate: A3, rotation: A4 }} Player
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
 * @typedef {{
 *   player: {
 *     translate: OutputElementPairs,
 *     rotation: OutputElementPairs,
 *   },
 *   entity: {
 *     translate: OutputElementPairs,
 *     rotation: OutputElementPairs,
 *     scale: OutputElementPairs,
 *   },
 *   activeKeys: OutputElementPairs,
 * }} DomLeafs
 *
 * @typedef {(
 *  | { kind: 'set-active-keys', keys: string[] }
 *  | { kind: 'locked-mouse-move', x: number, y: number }
 *  | { kind: 'player-translate', t: number, delta: A3  }
 *  | { kind: 'init-stats' }
 *  | { kind: 'update-player-translate' }
 *  | { kind: 'update-player-rotation' }
 *  | { kind: 'update-entity-translate' }
 *  | { kind: 'update-entity-rotation' }
 *  | { kind: 'update-entity-scale' }
 *  | { kind: 'delta', index: 0 | 1 | 2, dir: 1 | -1, t: number, array: A3 | A4, delta: number }
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
import { applyDeltaNoclip, applyRotation } from './movement-planar.js';

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
 * @returns {OutputElementPairs}
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
  { entity: es, player: ps },
  { entity: ed, player: pd },
  start,
) {
  /**
   * @param {A3|A4} array
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

  /**
   * @param {A3} delta
   * @param {keyof keys} key
   * @returns {InternalEffect}
   */
  const playerMove = (delta, key) => {
    const t = /** @type {number} */ (keys[key]);
    keys[key] = start;
    return { kind: 'player-translate', delta, t };
  }

  // player translate
  if (keys['d']) yield playerMove([1, 0, 0], 'd');
  if (keys['a']) yield playerMove([-1, 0, 0], 'a');
  if (keys['e']) yield playerMove([0, 1, 0], 'e');
  if (keys['q']) yield playerMove([0, -1, 0], 'q');
  if (keys['w']) yield playerMove([0, 0, -1], 'w');
  if (keys['s']) yield playerMove([0, 0, 1], 's');

  // player rotation
  if (keys['1']) yield diff(ps.rotation, pd.rotation, 0, 1, '1');
  if (keys['!']) yield diff(ps.rotation, pd.rotation, 0, -1, '!');
  if (keys['2']) yield diff(ps.rotation, pd.rotation, 1, 1, '2');
  if (keys['@']) yield diff(ps.rotation, pd.rotation, 1, -1, '@');
  if (keys['3']) yield diff(ps.rotation, pd.rotation, 2, 1, '3');
  if (keys['#']) yield diff(ps.rotation, pd.rotation, 2, -1, '#');

  // entity translate
  if (keys['l']) yield diff(es.translate, ed.translate, 0, 1, 'l');
  if (keys['j']) yield diff(es.translate, ed.translate, 0, -1, 'j');
  if (keys['u']) yield diff(es.translate, ed.translate, 1, -1, 'u');
  if (keys['o']) yield diff(es.translate, ed.translate, 1, 1, 'o');
  if (keys['i']) yield diff(es.translate, ed.translate, 2, 1, 'i');
  if (keys['k']) yield diff(es.translate, ed.translate, 2, -1, 'k');

  // rotation translate
  if (keys['7']) yield diff(es.rotation, ed.rotation, 0, 1, '7');
  if (keys['&']) yield diff(es.rotation, ed.rotation, 0, -1, '&');
  if (keys['8']) yield diff(es.rotation, ed.rotation, 1, 1, '8');
  if (keys['*']) yield diff(es.rotation, ed.rotation, 1, -1, '*');
  if (keys['9']) yield diff(es.rotation, ed.rotation, 2, 1, '9');
  if (keys['(']) yield diff(es.rotation, ed.rotation, 2, -1, '(');

  // scale translate
  if (keys['n']) yield diff(es.scale, ed.scale, 0, 1, 'n');
  if (keys['N']) yield diff(es.scale, ed.scale, 0, -1, 'N');
  if (keys['m']) yield diff(es.scale, ed.scale, 1, 1, 'm');
  if (keys['M']) yield diff(es.scale, ed.scale, 1, -1, 'M');
  if (keys[',']) yield diff(es.scale, ed.scale, 2, 1, ',');
  if (keys['<']) yield diff(es.scale, ed.scale, 2, -1, '<');

  if (keys['a'] || keys['w'] || keys['s'] || keys['d'] || keys['q'] || keys['e']) {
    yield { kind: 'update-player-translate' };
  }

  if (keys['1'] || keys['2'] || keys['3'] || keys['!'] || keys['@'] || keys['#']) {
    yield { kind: 'update-player-rotation' };
  }

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
 * @param {t.ConfigSource} config
 * @param {{
 *   screenLock?: boolean,
 *   window: Pick<Window, 'innerWidth' | 'innerHeight' | 'addEventListener'>,
 *   player?: Partial<Player>,
 *   playerDelta?: { translate?: number, rotation?: number },
 *   entity?: Partial<Entity>,
 *   entityDelta?: { scale?: number, translate?: number, rotation?: number },
 * }} cfg
 * @returns {State}
 */
export function initControls(config, {
  screenLock: useScreenLock = false,
  window,
  player: playerInit={},
  playerDelta = {},
  entity: entityInit={},
  entityDelta = {},
}) {
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

  /** @type {ExternalEvent[]} */
  const exEvents = [];

  /** @type {DomLeafs} */
  const domLeafs = {
    player: {
      translate: createOutPair('stat-player-translate', 'Player Translate', ''),
      rotation: createOutPair('stat-player-rotate', 'Player Rotation', ''),
    },
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
    screen: { bounds: [window.innerWidth, window.innerHeight] },
    player: {
      translate: playerInit.translate ?? [0, 0, 0],
      rotation: playerInit.rotation ?? [0, 0, 0, 0],
    },
    entity: {
      translate: entityInit.translate ?? [0, 0, 0],
      scale: entityInit.scale ?? [1, 1, 1],
      rotation: entityInit.rotation ?? [0, 0, 0],
    },
  };

  wireKeyboardControls(
    useScreenLock,
    state,
    deltas,
    domLeafs,
    exEvents,
  );

  const statsEl = document.getElementById('stats-tranform-state');
  if (statsEl) {
    statsEl.appendChild(domLeafs.player.translate.label);
    statsEl.appendChild(domLeafs.player.translate.out);
    statsEl.appendChild(domLeafs.player.rotation.label);
    statsEl.appendChild(domLeafs.player.rotation.out);

    statsEl.appendChild(domLeafs.entity.translate.label);
    statsEl.appendChild(domLeafs.entity.translate.out);
    statsEl.appendChild(domLeafs.entity.rotation.label);
    statsEl.appendChild(domLeafs.entity.rotation.out);
    statsEl.appendChild(domLeafs.entity.scale.label);
    statsEl.appendChild(domLeafs.entity.scale.out);
    statsEl.appendChild(domLeafs.activeKeys.label);
    statsEl.appendChild(domLeafs.activeKeys.out);
  }

  config.monitorConfig(
      'ctrl-entity-tr-d', 'E Translate Delta',
      -1000, 1000, deltas.entity.translate,
      v => deltas.entity.translate = v);

  config.monitorConfig(
      'ctrl-entity-ro-d', 'E Rotate Delta',
      -10, 10, deltas.entity.rotation,
      v => deltas.entity.rotation = v);

  config.monitorConfig(
      'ctrl-entity-sc-d', 'E Scale Delta',
      -10, 10, deltas.entity.scale,
      v => deltas.entity.scale = v);

  return state;
}

/**
 * @param {boolean} useScreenLock
 * @param {State} state
 * @param {Deltas} deltas
 * @param {DomLeafs} domLeafs
 * @param {ExternalEvent[]} exEvents
 */
function wireKeyboardControls(useScreenLock, state, deltas, domLeafs, exEvents) {
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

  /** @type {InternalEffect[]} */
  const events = [];

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
        internalEffect({ kind: 'update-player-translate' }, t);
        internalEffect({ kind: 'update-player-rotation' }, t);
        internalEffect({ kind: 'update-entity-translate' }, t);
        internalEffect({ kind: 'update-entity-rotation' }, t);
        internalEffect({ kind: 'update-entity-scale' }, t);
        break;

      case 'update-player-translate':
        domLeafs.player.translate.out.innerText = `[${state.player.translate.map(e => e.toFixed(2)).join(', ')}]`;
        break;

      case 'update-player-rotation':
        domLeafs.player.rotation.out.innerText = `[${state.player.rotation.map(e => e.toFixed(2)).join(', ')}]`;
        break;

      case 'update-entity-translate':
        domLeafs.entity.translate.out.innerText = `[${state.entity.translate.map(e => e.toFixed(2)).join(', ')}]`;
        break;

      case 'update-entity-rotation':
        domLeafs.entity.rotation.out.innerText = `[${state.entity.rotation.map(e => e.toFixed(2)).join(', ')}]`;
        break;

      case 'update-entity-scale':
        domLeafs.entity.scale.out.innerText = `[${state.entity.scale.map(e => e.toFixed(2)).join(', ')}]`;
        break;

      case 'locked-mouse-move':
        applyRotation(
          state.player.rotation,
          [effect.x, effect.y],
          deltas.player.rotation,
        );
        internalEffect({ kind: 'update-player-rotation' }, t);
        break;

      case 'player-translate':
        applyDeltaNoclip(
          state.player.translate,
          state.player.rotation,
          effect.delta,
          deltas.player.translate * (t - effect.t),
        );
        break;

      case 'delta':
        effect.array[effect.index] += effect.dir * effect.delta * ((t - effect.t) / 1000);
        break;

      default:
        throw new Unreachable(effect);
    }
  }

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
    state.screen.bounds[0] = window.innerWidth;
    state.screen.bounds[1] = window.innerHeight;
    exEvents.push({ kind: 'resize' });
  });

  /** @param {KeyboardEvent} event */
  window.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      state.screen.bounds[0] = window.innerWidth;
      state.screen.bounds[1] = window.innerHeight;
      exEvents.push({ kind: 'resize' });
    } else if (event.key === 'Shift') {
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

  const [canvas] = document.getElementsByTagName('canvas');
  if (canvas == null) throw new Error('no canvas');

  /** @param {MouseEvent} event */
  function updateRotationOnMouseMove(event) {
    const { movementX: x, movementY: y } = event;
    events.push({ kind: 'locked-mouse-move', x, y });
  }

  let screenLockActive = false;

  document.addEventListener('pointerlockchange', () => {
    screenLockActive = document.pointerLockElement === canvas;
    if (screenLockActive) {
      document.addEventListener('mousemove', updateRotationOnMouseMove);
    } else {
      document.removeEventListener('mousemove', updateRotationOnMouseMove);
    }
  }, false);

  if (useScreenLock) {
    canvas.addEventListener('click', async () => {
       await canvas.requestPointerLock({ unadjustedMovement: true });
    });
  }

  internalEffect({ kind: 'init-stats' }, performance.now());
}
