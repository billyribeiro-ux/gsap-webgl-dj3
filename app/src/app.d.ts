/// <reference types="@webgpu/types" />
// Three.js r184 WebGPU/TSL entry points (typed loosely — they ship WGSL/GLSL node APIs).
declare module 'three/webgpu';
declare module 'three/tsl';
// See https://svelte.dev/docs/kit/types#app.d.ts for information about these types
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {};
