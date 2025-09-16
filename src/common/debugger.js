
class Debugger {
  /** @type {any[][]} */
  #queue = [];

  /** @type {HTMLUListElement} */
  #outnode

  /** @param {HTMLUListElement} outnode */
  constructor(outnode) {
    this.#outnode = outnode
  }

  /** @param {...any} values */
  log(...values) {
    this.#queue.push(values);
  }

  flush() {
    this.#outnode.innerHTML = '';
    while (this.#queue.length) {
      const rowItems = this.#queue.shift();
      if (rowItems == null) continue;

      const row = document.createElement('li');
      row.style.display = 'flex'
      row.style.flexDirection = 'row'
      row.style.gap = '8px';
      row.style.justifyContent = 'flex-start';
      row.style.alignItems = 'flex-start';
      for (const col of rowItems) {
        const span = document.createElement('span');
        span.innerHTML = JSON.stringify(col, null, 2);
        row.appendChild(span);
      }
      this.#outnode.appendChild(row);
    }
  }
}


/**
 * @returns {Debugger}
 */
export function installDebugger() {
  const ul = document.createElement('ul');
  ul.id = 'debugger';
  document.body.appendChild(ul);
  return new Debugger(ul);
}
