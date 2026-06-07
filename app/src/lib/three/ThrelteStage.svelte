<script lang="ts">
  import { Canvas } from '@threlte/core';
  import Scene from './Scene.svelte';

  // <Canvas> is the single Threlte entry point. It creates the WebGLRenderer, the
  // default scene, the animation loop and the resize handling for you — then
  // renders whatever Svelte components you put inside. Everything 3D lives in here.
</script>

<div class="stage">
  <Canvas>
    <Scene />
  </Canvas>
</div>

<style>
  .stage {
    width: 100%;
    height: 360px;
    border-radius: 16px;
    overflow: hidden;
    background: radial-gradient(60% 60% at 50% 40%, #15182400, #05060a);
  }
</style>
