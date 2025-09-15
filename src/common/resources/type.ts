type GltAccessorCommon =
  | { bufferView: number, componentType: number, count: number }

type Range3 = [number, number, number];
export type V3 = [number, number, number];

export type GltAccessor =
  | { type: 'VEC3', min?: Range3, max?: Range3 } & GltAccessorCommon
  | { type: 'VEC2' } & GltAccessorCommon
  | { type: 'SCALAR' } & GltAccessorCommon

export type GltBufferView =
  { buffer: number, byteLength: number, byteOffset: number,  target: number };

export type GltImage =
  { bufferView: number, mimeType: string, name: string };

export type GltPrimativeAttr =
  { POSITION: number, NORMAL: number, TEXCOORD_0: number };

export type GltPrimative =
  { attributes: GltPrimativeAttr, indices?: number, material: number };

export type GltPbrMetallicRoughness =
  { baseColorTexture: { index: number }, metallicFactor: number, roughnessFactor: 0.5 };

export type GltMaterial =
  { name: string, doubleSided: boolean, pbrMetallicRoughness: GltPbrMetallicRoughness }

export type GltMesh =
  { name: string, primitives: readonly GltPrimative[] };

export type GltScene =
  { name: string, nodes: readonly number[] };

export type GltNode =
  { name: string, mesh: number, scale: V3, translation: V3 };

export type GltTexture =
  { source: number, sampler: number };

export type Gltf = {
  accessors: readonly GltAccessor[],
  bufferViews: readonly GltBufferView[],
  images: readonly GltImage[],
  materials: readonly GltMaterial[],
  meshes: readonly GltMesh[],
  nodes: readonly GltNode[],
  scene: number,
  scenes: readonly GltScene[];
  textures: readonly GltTexture[],
};

