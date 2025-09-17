/**
 * @param {WebGLRenderingContext} gl
 * @param {number} type
 * @param {string} source
 * @returns {WebGLShader}
 */
export function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (shader == null) throw new Error('createShader');

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) return shader;

  console.error(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
  throw new Error();
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {WebGLShader} vertexShader
 * @param {WebGLShader} fragmentShader
 */
export function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  const success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) return program;

  console.log(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
  throw new Error();
}


/**
 * @param {WebGL2RenderingContext} gl
 * @param {WebGLProgram} program
 * @param {string} name
 * @returns {WebGLUniformLocation}
 */
export function getUniformLoc(gl, program, name) {
  const location = gl.getUniformLocation(program, name)
  if (location == null) throw new Error(name);
  return location;
}

/**
 * @template {Record<string, string>} Uniforms
 * @template {Record<string, string>} Attrs
 * @param {WebGL2RenderingContext} gl
 * @param {{ vertex: string, fragment: string }} shaders
 * @param {{ attr: Attrs, unif: Uniforms }} cfg
 * @returns {{
 *   program: WebGLProgram,
 *   attr: Record<keyof Attrs, GLint>,
 *   unif: Record<keyof Uniforms, WebGLUniformLocation>,
 * }}
 */
export function makeProgram(gl, shaders, cfg) {
  const vShader = createShader(gl, gl.VERTEX_SHADER, shaders.vertex);
  const fShader = createShader(gl, gl.FRAGMENT_SHADER, shaders.fragment);
  const program = createProgram(gl, vShader, fShader);
  gl.useProgram(program);

  /** @type {any} - Look there is no satisfying type you could ever put here */
  const unif = {};
  for (const [k, v] of Object.entries(cfg.unif)) {
    unif[k] = getUniformLoc(gl, program, v);
  }

  /** @type {any} - Look there is no satisfying type you could ever put here */
  const attr = {};
  for (const [k, v] of Object.entries(cfg.attr)) {
    attr[k] = gl.getAttribLocation(program, v);
  }

  return { program, attr, unif };
}
