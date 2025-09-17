/**
 * @param {string} text
 * @param {{ fontSize: number, font: string, fillStyle: string }} options
 * @returns {{
 *   text: string,
 *   canvas: HTMLCanvasElement,
 *   ctx: CanvasRenderingContext2D,
 *   size: [number, number],
 * }}
 */
export function makeCanvasText(text, { font, fontSize, fillStyle }) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext("2d");
  if (ctx == null) throw new Error();

  ctx.canvas.height = fontSize;
  ctx.canvas.width = 1000;
  ctx.font = `${fontSize}px ${font} `;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = fillStyle;

  const metrics = ctx.measureText(text);
  canvas.width = metrics.width;
  canvas.height = fontSize;
  ctx.font = `${fontSize}px ${font} `;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = fillStyle;

  ctx.clearRect(0, 0, metrics.width, fontSize);
  ctx.fillText(text, metrics.width / 2, fontSize / 2);

  return { text, canvas, ctx, size: [metrics.width, fontSize] };
}

/**
 * @param {WebGL2RenderingContext} gl
 * @param {ReturnType<typeof makeCanvasText>} cfg
 * @returns {WebGLTexture}
 */
export function makeTextureFromCanvasText(gl, cfg) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cfg.canvas);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return texture;
}

/**
 * @param {WebGL2RenderingContext} gl
 * @param {string} text
 * @param {{ fontSize: number, font: string, fillStyle: string }} options
 * @returns {{ texture : WebGLTexture} & ReturnType<typeof makeCanvasText>}
 */
export function makeTextTexture(gl, text, options) {
  const canvasText = makeCanvasText(text, options);
  const texture = makeTextureFromCanvasText(gl, canvasText);
  return { ...canvasText, texture } ;
}

