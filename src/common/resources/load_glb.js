/**
 * @import { Gltf } from './type.ts';
 *
 * @typedef {{ gltf: Gltf, binary: ArrayBuffer }} GltfModel
 *
 * @typedef {(
 *   | { kind: 'element', indexCount: number }
 *   | { kind: 'arrayes', vertexCount: number }
 * )} DrawMode
 *
 * @typedef {{
 *    vao: WebGLVertexArrayObject,
 *    textureIndex: number,
 *    drawMode: DrawMode,
 * }} Mesh
 *
 * @typedef {{
 *   mesh: readonly Mesh[],
 *   translate: [number, number, number],
 *   scale: [number, number, number],
 * }} ModelNode
 */

/**
 * @param {string} url
 * @returns {Promise<GltfModel>}
 */
export async function loadGLTB(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();

  // Parse GLB header (12 bytes)
  const view = new DataView(arrayBuffer);
  const length = view.getUint32(8, true);

  let offset = 12;
  let jsonData = null;
  let binaryData = null;

  // Parse chunks
  while (offset < length) {
    const chunkLength = view.getUint32(offset, true);
    const chunkType = view.getUint32(offset + 4, true);

    if (chunkType === 0x4E4F534A) { // "JSON"
      const jsonBytes = new Uint8Array(arrayBuffer, offset + 8, chunkLength);
      jsonData = JSON.parse(new TextDecoder().decode(jsonBytes));
    } else if (chunkType === 0x004E4942) { // "BIN\0"
      binaryData = arrayBuffer.slice(offset + 8, offset + 8 + chunkLength);
    }

    offset += 8 + chunkLength;
  }

  if (binaryData == null) throw new Error('failed to load data');

  return {
    gltf: jsonData,
    binary: binaryData,
  };
}

/**
 * @param {WebGL2RenderingContext} gl
 * @param {GltfModel} model
 * @param {{
 *    vertice: GLint,
 *    texture: GLint,
 * }} attributes
 * @param {Record<string, string>} [textures]
 * @returns {Promise<{
 *   nodes: readonly ModelNode[],
 *   textures: readonly WebGLTexture[],
 * }>}
 */
export async function createGLTBMesh(
  gl,
  { gltf, binary },
  attributes,
  textures = {},
) {
  /** @type {WebGLTexture[]} */
  const texturesOut = [];
  const antiAlias = false;

  for (const image of gltf.images) {
    if (image.mimeType == null) throw new Error();
    if (image.bufferView == null) throw new Error();
    const bufferView = gltf.bufferViews[image.bufferView];
    if (bufferView == null) throw new Error();

    const imageData = new Uint8Array(binary, bufferView.byteOffset, bufferView.byteLength);
    const imageBitmap = await createImageBitmap(new Blob([imageData], { type: bufferView.mimeType }));
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageBitmap);
    if (antiAlias) {
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    }
    imageBitmap.close();
    texturesOut.push(texture);
  }

  /** @type {(readonly Mesh[])[]} */
  const meshes = gltf.meshes.map(mesh => (
    mesh.primitives.map(primitive => {
      // require textures to be used
      if (primitive.attributes.TEXCOORD_0 == null) throw new Error();

      const vao = gl.createVertexArray();
      gl.bindVertexArray(vao);

      const pAccessor = gltf.accessors[primitive.attributes.POSITION];
      const pBufferView = gltf.bufferViews[pAccessor.bufferView];
      const positions = new Float32Array(binary, pBufferView.byteOffset, pAccessor.count * 3);
      const pBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(attributes.vertice);
      gl.vertexAttribPointer(attributes.vertice, 3, gl.FLOAT, false, 0, 0);

      const uvAccessor = gltf.accessors[primitive.attributes.TEXCOORD_0];
      const uvBufferView = gltf.bufferViews[uvAccessor.bufferView];
      const uvs = new Float32Array(binary, uvBufferView.byteOffset, uvAccessor.count * 2);
      const uvBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(attributes.texture);
      gl.vertexAttribPointer(attributes.texture, 2, gl.FLOAT, false, 0, 0);

      const material = gltf.materials[primitive.material];
      const textureIndex = material.pbrMetallicRoughness.baseColorTexture.index;

      /** @type {DrawMode} */
      let drawMode;
      if (primitive.indices != null) {
        const indexAccessor = gltf.accessors[primitive.indices];
        const indexBufferView = gltf.bufferViews[indexAccessor.bufferView];
        const indexBuffer = gl.createBuffer();
        const indices = new Uint16Array(
          binary,
          indexBufferView.byteOffset,
          indexAccessor.count
        );
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        drawMode = { kind: 'element', indexCount: indexAccessor.count };
      } else {
        drawMode = { kind: 'arrayes', vertexCount: pAccessor.count };
      }

      return { vao, textureIndex, drawMode };
    })
  ));

  const scene = gltf.scenes[gltf.scene];

  /** @type {readonly ModelNode[]} */
  const nodes = scene.nodes.map(nodeIndex => {
    const node = gltf.nodes[nodeIndex];
    const mesh = meshes[node.mesh];
    console.log(node);

    /** @type {Node} */
    return {
      mesh,
      scale: node.scale,
      translate: node.translation,
    };
  });

  return { nodes, textures: texturesOut };
}
