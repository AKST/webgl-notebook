/**
 * @returns {{
 *   setRotation(rotation: number): void;
 *   setTranslate(translate: [number, number]): void;
 *   setScale(scale: [number, number]): void;
 * }}
 */
export function install2DStats() {
  const el = document.getElementById('stats-tranform-state');
  if (el == null) throw new Error('stats no defined');

  const elT = document.createElement('span');
  const elR = document.createElement('span');
  const elS = document.createElement('span');

  const elLT = document.createElement('b');
  elLT.appendChild(document.createTextNode('Translate'));

  const elLR = document.createElement('b');
  elLR.appendChild(document.createTextNode('Rotate'));

  const elLS = document.createElement('b');
  elLS.appendChild(document.createTextNode('Scale'));

  el.appendChild(elLT);
  el.appendChild(elT);

  el.appendChild(elLS);
  el.appendChild(elS);

  el.appendChild(elLR);
  el.appendChild(elR);

  return {
    setRotation(rotation) {
      elR.innerText = `${rotation.toFixed(2)}`;
    },
    setTranslate([x, y]) {
      elT.innerText = `${x.toFixed(2)}, ${y.toFixed(2)}`;
    },
    setScale([x, y]) {
      elS.innerText = `${x.toFixed(2)}, ${y.toFixed(2)}`;
    },
  };
}
