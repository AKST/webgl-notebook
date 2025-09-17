/**
 * @import { VectorOf as Vec } from '../../math/type.ts';
 *
 * @typedef {Vec<'r', 3>} V3
 */
import { matrix as m, vector as v } from '../../math/value.js';
import * as math from '../../math/value.js';
import { initControls } from '../../common/3d/controls.js';
import { installControlExtFov } from '../../common/3d/controls_ext_fov.js';
import { installMiscNumKnob } from '../../common/3d/controls_ext_misc.js';
import { generateXyMesh, xzMesh } from '../../common/buffer.js';
import { installDebugger } from '../../common/debugger.js';
import { makeProgram } from '../../common/init.js';
import { Matrix3d as M } from '../../common/matrix.js';
import { makeTextTexture as makeText } from '../../common/resources/make_text.js';

const version = "#version 300 es\n"

const SHADERS = {
  /** @type {{ vertex: string, fragment: string }} */
  mesh: {
    vertex: version + `
      in vec2 a_position;

      uniform float u_technology;
      uniform float u_alpha;
      uniform vec3 u_offset;
      uniform mat4 u_world;
      uniform mat4 u_viewProjection;

      out vec3 v_worldPos;
      flat out float v_faceY;

      float cobbDouglas(float labour, float capital) {
        return u_technology * pow(capital, 1.0 - u_alpha) * pow(labour, u_alpha);
      }

      void main() {
        float production = cobbDouglas(a_position.x, a_position.y);
        vec4 position = vec4(a_position.x, production, a_position.y, 1.0);
        vec4 worldPosition = u_world * (position + vec4(u_offset, 0.0));

        v_worldPos = worldPosition.xyz;
        v_faceY = production;
        gl_Position = u_viewProjection * worldPosition;
      }
    `,
    fragment: version + `
      precision mediump float;

      in vec3 v_worldPos;
      flat in float v_faceY;

      uniform float u_productionMax;

      out vec4 outColor;

      void main() {
        vec3 dx = dFdx(v_worldPos);
        vec3 dy = dFdy(v_worldPos);
        vec3 n  = normalize(cross(dx, dy));
        float tilt = acos(clamp(dot(n, vec3(0.0, 1.0, 0.0)), -1.0, 1.0)) / (0.5*3.14159265);
        float shade = mix(tilt, tilt, tilt);

        float t = clamp(v_faceY / u_productionMax, 0.0, 1.0);

        vec3 a = vec3(1.0, 0.5, 0.10);
        vec3 b = vec3(1.0, 0.25, 0.25);
        vec3 c = vec3(0.5, 0.1, 0.5);
        vec3 color = mix(a, b, t);
        outColor = vec4(color * shade, 1.0);
      }
    `,
  },
  /** @type {{ vertex: string, fragment: string }} */
  text: {
    vertex: version + `
      in vec2 a_position;
      uniform vec3 u_offset;
      uniform mat4 u_world;
      uniform mat4 u_viewProjection;
      out vec2 v_texcoord;

      void main() {
        vec4 position = vec4(a_position.x, 0, a_position.y, 1.0);
        vec4 worldPosition = u_world * (position + vec4(u_offset, 0.0));
        gl_Position = u_viewProjection * worldPosition;
        v_texcoord = position.xz + 0.5;
      }
    `,
    fragment: version + `
      precision mediump float;

      in vec2 v_texcoord;
      uniform sampler2D u_texture;
      out vec4 outColor;

      void main() {
        outColor = texture(u_texture, v_texcoord);
      }
    `,
  },
  /** @type {{ vertex: string, fragment: string }} */
  grid: {
    vertex: version + `
      in vec2 a_position;
      uniform mat4 u_world, u_viewProjection;
      out vec2 v_worldPos;

      void main() {
        vec4 w = u_world * vec4(a_position.x, 0, a_position.y, 1.0);
        gl_Position = u_viewProjection * w;
        v_worldPos = a_position.xy;
      }
    `,
    fragment: version + `
      precision mediump float;
      in vec2 v_worldPos;
      uniform vec4 u_color;
      uniform float u_width, u_stroke;
      out vec4 outColor;

      void main() {
        vec2 c = v_worldPos / max(u_width, 1e-6);
        vec2 d = abs(fract(c) - 0.5);
        vec2 w = fwidth(c) * u_stroke;

        float line = min(u_color.w, 1.0 - min(min(d.x / w.x, d.y / w.y), 1.0));

        if (line <= 0.0) discard;
        outColor = vec4(u_color.xyz, line);
      }
    `,

  },
};

export function main () {
  const dbg = installDebugger();
  const container = document.getElementById('container');
  if (container == null) throw new Error('container');

  const canvas = document.createElement('canvas');
  container.appendChild(canvas);

  const { width, height } = canvas.getBoundingClientRect();
  canvas.width = width;
  canvas.height = height;

  const gl = canvas.getContext("webgl2");
  if (gl == null) throw new Error('getContext');

  const tLabour = makeText(gl, 'Labour', { fontSize: 64, font: 'Helvetica', fillStyle: 'white' });
  const tCapital = makeText(gl, 'Capital', { fontSize: 64, font: 'Helvetica', fillStyle: 'white' });

  const pMesh = makeProgram(gl, SHADERS.mesh, {
    attr: { position: 'a_position' },
    unif: {
      world: 'u_world',
      alpha: 'u_alpha',
      offset: 'u_offset',
      technology: 'u_technology',
      productionMax: 'u_productionMax',
      viewProjection: 'u_viewProjection',
    },
  });

  const pText = makeProgram(gl, SHADERS.text, {
    attr: { position: 'a_position' },
    unif: {
      world: 'u_world',
      offset: 'u_offset',
      texture: 'u_texture',
      viewProjection: 'u_viewProjection',
    },
  });

  const pGrid = makeProgram(gl, SHADERS.grid, {
    attr: { position: 'a_position' },
    unif: {
      color: 'u_color',
      world: 'u_world',
      width: 'u_width',
      stroke: 'u_stroke',
      viewProjection: 'u_viewProjection',
    },
  });

  const state = initControls({
    screenLock: false,
    window,
    playerDelta: {
      rotation: 0.01,
      translate: 1,
    },
    entityDelta: {
      rotation: 1,
      translate: 100,
    },
    player: {
      translate: [303.89, -728.00, -1227.38],
      rotation: [-0.96, -0.03, -0.12, 0.24],
    },
    entity: {
      translate: [0, 219.10, 0],
      rotation: [-3.21, 2.46, 0.00],
      scale: [1, 0.03, 1],
    },
  });

  const fov = installControlExtFov({
    fov: { value: 1.51, min: 0, max: 5 },
    far: { value: 10000, min: 1, max: 10000 },
    near: { value: 1, min: 0.1, max: 1000 },
  });

  const technology = installMiscNumKnob('techology', 30, 'Technology', [0, 100]);
  const alpha = installMiscNumKnob('alpha', 2/3, 'Alpha', [0, 1]);

  /**
   * @param {number} labour
   * @param {number} capital
   * @returns {number}
   */
  const cobbDouglas = (labour, capital) => {
    return technology.value *
           (capital ** (1.0 - alpha.value)) *
           (labour ** alpha.value);
  }

  const vaoMesh = gl.createVertexArray();
  gl.bindVertexArray(vaoMesh);

  const xCfg = { min: 0, max: 1100, step: 50 };
  const zCfg = { min: 0, max: 1100, step: 50 };
  const sizeMesh = generateXyMesh(gl, pMesh.attr.position, xCfg, zCfg, true);
  const meshOffset = [-(xCfg.max / 2), 0, -(zCfg.max / 2)]

  const vaoText = gl.createVertexArray();
  gl.bindVertexArray(vaoText);
  const sizeText = xzMesh(gl, pText.attr.position);

  const vaoGrid = gl.createVertexArray();
  gl.bindVertexArray(vaoGrid);
  const sizeGrid = xzMesh(gl, pGrid.attr.position);

  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  const error = gl.getError();
  if (error !== gl.NO_ERROR) {
    dbg.log('gl error', error);
    dbg.flush();
    throw new Error();
  }

  /** @type {Record<any, [number, number, number][]>} */
  const translate = {
    Labour: [[0, 0, -(zCfg.max/2) - 75], [0, 0, (zCfg.max/2) + 75]],
    Capital: [[-(xCfg.max/2) - 75, 0, 0], [(xCfg.max/2) + 75, 0, 0]],
  }

  /** @type {Record<any, [number, number, number][]>} */
  const rotation = {
    Labour: [[0, Math.PI, 0], [0, 0, 0]],
    Capital: [[0, -Math.PI/2, 0], [0, Math.PI/2, 0]],
  }

  requestAnimationFrame(function f (t) {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    dbg.log('time', t);

    const cameraRM = M.fromQuaternion(...state.player.rotation);
    const cameraTM = M.translate(...state.player.translate);
    const cameraM = m.mul(cameraRM, cameraTM);

    const [width, height] = state.screen.bounds;
    const projectionM = M.perspective(fov.fov, width / height, fov.near, fov.far);
    const viewM = math.inv(cameraM);
    const viewProjection = m.mul(viewM, projectionM);
    const yRot = t / 1000;

    let worldRotation = m.identity(4);
    worldRotation = m.mul(M.rotateX(state.entity.rotation[0]), worldRotation);
    worldRotation = m.mul(M.rotateY(state.entity.rotation[1] + yRot), worldRotation);
    worldRotation = m.mul(M.rotateZ(state.entity.rotation[2]), worldRotation);

    dbg.log('rotation', (state.entity.rotation[1] + yRot).toFixed(2));

    let world = M.translate(...state.entity.translate);
    world = m.mul(worldRotation, world);
    world = m.mul(M.scale(...state.entity.scale), world);

    const scale = 100000;
    const mGrid = m.mul(M.scale(scale, scale, scale), world);

    gl.useProgram(pGrid.program);
    gl.bindVertexArray(vaoGrid);
    gl.uniformMatrix4fv(pGrid.unif.world, false, mGrid.mat.flat());
    gl.uniformMatrix4fv(pGrid.unif.viewProjection, false, viewProjection.mat.flat());
    gl.uniform4fv(pGrid.unif.color, [1, 1, 1, 0.25]);
    gl.uniform1f(pGrid.unif.width, 1/1000);
    gl.uniform1f(pGrid.unif.stroke, 1);
    gl.drawArrays(gl.TRIANGLES, 0, sizeGrid);

    gl.useProgram(pMesh.program);
    gl.bindVertexArray(vaoMesh);
    gl.uniformMatrix4fv(pMesh.unif.world, false, world.mat.flat());
    gl.uniformMatrix4fv(pMesh.unif.viewProjection, false, viewProjection.mat.flat());
    gl.uniform1f(pMesh.unif.alpha, alpha.value);
    gl.uniform1f(pMesh.unif.technology, technology.value);
    gl.uniform1f(pMesh.unif.productionMax, cobbDouglas(xCfg.max, zCfg.max));
    gl.uniform3fv(pMesh.unif.offset, meshOffset);

    gl.drawArrays(gl.TRIANGLES, 0, sizeMesh);

    let tWorld = M.translate(...state.entity.translate);
    tWorld = m.mul(worldRotation, tWorld);

    gl.useProgram(pText.program);
    gl.bindVertexArray(vaoText);
    gl.uniformMatrix4fv(pText.unif.viewProjection, false, viewProjection.mat.flat());

    for (const text of [tLabour, tCapital]) {
      const scale = M.scale(text.size[0], 1, text.size[1]);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, text.texture);

      gl.uniform1i(pText.unif.texture, 0);
      const translates = translate[text.text];
      const rotations = rotation[text.text];
      for (let i = 0; i < translates.length; i++) {
        const mT = m.mul(M.translate(...translates[i]), tWorld);
        const mRy = m.mul(M.rotateY(rotations[i][1]), mT)
        const matrix = m.mul(scale, mRy);
        gl.uniformMatrix4fv(pText.unif.world, false, matrix.mat.flat());
        gl.uniform3fv(pText.unif.offset, [0, 0, 0]);
        gl.drawArrays(gl.TRIANGLES, 0, sizeText);
      }
    }

    const error = gl.getError();
    if (error !== gl.NO_ERROR) {
      dbg.log("Webgl error", error);
    }

    dbg.flush();

    if (error === gl.NO_ERROR) {
      requestAnimationFrame(f);
    }
  })
}
