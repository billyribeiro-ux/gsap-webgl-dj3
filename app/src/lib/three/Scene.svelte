<script lang="ts">
  import { T, useTask } from '@threlte/core';
  import * as THREE from 'three';

  // In Threlte you don't *build* a scene imperatively — you *declare* it. Every
  // <T.Something> is a Three.js object expressed as a Svelte component. Props map
  // straight to Three.js properties, so <T.Mesh position={[0,1,0]}> sets
  // mesh.position. It's the entire Three.js API, reactive and component-shaped.
  let mesh = $state<THREE.Mesh>();

  // useTask runs its callback every frame (Threlte's render loop). `delta` is the
  // seconds since the last frame — multiply by it so motion is frame-rate
  // independent (smooth on a 60Hz laptop AND a 144Hz monitor).
  useTask((delta) => {
    if (mesh) {
      mesh.rotation.y += delta * 0.6;
      mesh.rotation.x += delta * 0.25;
    }
  });
</script>

<!-- A camera, looking down -Z from 5 units back. makeDefault tells Threlte to
     render through this one. -->
<T.PerspectiveCamera makeDefault position={[0, 0, 5]} fov={45} />

<!-- Lighting: a dim ambient fill plus two coloured points = cinematic facets. -->
<T.AmbientLight intensity={0.15} />
<T.PointLight position={[4, 4, 5]} color="#7c5cff" intensity={80} />
<T.PointLight position={[-5, -2, 3]} color="#19e3d6" intensity={60} />

<!-- The mesh: geometry + material declared as children, just like Three.js but
     readable. bind:ref hands us the underlying THREE.Mesh for the render loop. -->
<T.Mesh bind:ref={mesh}>
  <T.TorusKnotGeometry args={[1, 0.32, 160, 32]} />
  <T.MeshStandardMaterial color="#11141f" metalness={0.6} roughness={0.25} flatShading />
</T.Mesh>
