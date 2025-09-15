/**
 * @param {string} url
 * @returns {Promise<{
 *   gltf: any,
 *   binary: ArrayBuffer,
 * }>}
 */
export async function loadGLB(url) {
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
  return { gltf: jsonData, binary: binaryData };
}
