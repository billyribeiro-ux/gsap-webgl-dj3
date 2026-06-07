<script lang="ts">
  import { T, useTask } from '@threlte/core';
  import * as THREE from 'three';

  // A purely *driven* scene: it owns no animation logic of its own — it just maps
  // an incoming `progress` (0 → 1) onto rotation and scale. Whoever renders it
  // decides where progress comes from: scroll, a slider, a GSAP tween, anything.
  let { progress = 0 }: { progress?: number } = $props();

  let mesh = $state<THREE.Mesh>();

  // useTask applies the latest progress every frame, so motion stays smooth even
  // if progress updates less often than the display refreshes.
  useTask(() => {
    if (!mesh) return;
    mesh.rotation.y = progress * Math.PI * 2;
    mesh.rotation.x = progress * Math.PI;
    mesh.scale.setScalar(1 + progress * 0.6);
  });
</script>

<T.PerspectiveCamera makeDefault position={[0, 0, 5]} fov={45} />
<T.AmbientLight intensity={0.18} />
<T.PointLight position={[4, 4, 5]} color="#7c5cff" intensity={80} />
<T.PointLight position={[-5, -3, 4]} color="#19e3d6" intensity={60} />

<T.Mesh bind:ref={mesh}>
  <T.IcosahedronGeometry args={[1.3, 0]} />
  <T.MeshStandardMaterial color="#11141f" metalness={0.6} roughness={0.25} flatShading />
</T.Mesh>
