<script lang="ts">
  import * as THREE from 'three';
  import * as CANNON from 'cannon-es';
  import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
  import type { Attachment } from 'svelte/attachments';

  // A real-time rigid-body playground. cannon-es runs the physics (gravity,
  // collisions, friction); Three.js draws it. Each frame we step the world, then
  // copy every body's position + rotation onto its mesh. Click to drop a ball on
  // the stack; drag to orbit. This is the foundation of every web physics toy.
  let api: { reset: () => void } | null = $state(null);

  const playground: Attachment<HTMLCanvasElement> = (canvas) => {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(6, 6, 9);
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.target.set(0, 1.5, 0);
    controls.enablePan = false;

    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const dir = new THREE.DirectionalLight(0xffffff, 1.6);
    dir.position.set(6, 12, 8);
    dir.castShadow = true;
    dir.shadow.mapSize.set(1024, 1024);
    scene.add(dir);
    const rim = new THREE.PointLight(0x19e3d6, 60);
    rim.position.set(-6, 3, -4);
    scene.add(rim);

    // ── Physics world ──────────────────────────────────────────────────────
    const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });
    world.allowSleep = true;

    // Ground (static).
    const ground = new CANNON.Body({ type: CANNON.Body.STATIC, shape: new CANNON.Plane() });
    ground.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(ground);
    const groundMesh = new THREE.Mesh(
      new THREE.CircleGeometry(9, 48),
      new THREE.MeshStandardMaterial({ color: 0x0a0c14, metalness: 0.1, roughness: 0.9 })
    );
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    const pairs: { mesh: THREE.Mesh; body: CANNON.Body }[] = [];
    const palette = [0x7c5cff, 0x19e3d6, 0xff5f9e, 0xffce4a];
    const boxGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);

    function addBox(x: number, y: number, z: number, color: number): void {
      const body = new CANNON.Body({ mass: 1, shape: new CANNON.Box(new CANNON.Vec3(0.45, 0.45, 0.45)), position: new CANNON.Vec3(x, y, z) });
      world.addBody(body);
      const mesh = new THREE.Mesh(boxGeo, new THREE.MeshStandardMaterial({ color, metalness: 0.3, roughness: 0.35 }));
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      pairs.push({ mesh, body });
    }

    function clearAll(): void {
      for (const p of pairs) {
        world.removeBody(p.body);
        scene.remove(p.mesh);
        (p.mesh.material as THREE.Material).dispose();
      }
      pairs.length = 0;
    }

    function buildStack(): void {
      clearAll();
      let c = 0;
      for (let y = 0; y < 4; y++) {
        for (let x = -1; x <= 1; x++) {
          for (let z = -1; z <= 1; z++) {
            addBox(x * 1.0 + (Math.random() - 0.5) * 0.04, 0.5 + y * 0.95, z * 1.0, palette[c++ % palette.length]);
          }
        }
      }
    }
    buildStack();
    api = { reset: buildStack };

    // Click → drop a heavy ball where the ray meets the ground plane.
    const ballGeo = new THREE.SphereGeometry(0.6, 24, 16);
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const hit = new THREE.Vector3();
    const onClick = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      if (!ray.ray.intersectPlane(groundPlane, hit)) return;
      const body = new CANNON.Body({ mass: 5, shape: new CANNON.Sphere(0.6), position: new CANNON.Vec3(hit.x, 9, hit.z) });
      body.velocity.set(0, -6, 0);
      world.addBody(body);
      const mesh = new THREE.Mesh(ballGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.6, roughness: 0.2 }));
      mesh.castShadow = true;
      scene.add(mesh);
      pairs.push({ mesh, body });
    };
    canvas.addEventListener('click', onClick);

    const resize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    let raf = 0;
    let last = performance.now();
    const tick = () => {
      const now = performance.now();
      world.step(1 / 60, Math.min((now - last) / 1000, 0.05), 4);
      last = now;
      for (const p of pairs) {
        p.mesh.position.copy(p.body.position as unknown as THREE.Vector3);
        p.mesh.quaternion.copy(p.body.quaternion as unknown as THREE.Quaternion);
      }
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('click', onClick);
      clearAll();
      controls.dispose();
      boxGeo.dispose();
      ballGeo.dispose();
      groundMesh.geometry.dispose();
      (groundMesh.material as THREE.Material).dispose();
      renderer.dispose();
      api = null;
    };
  };
</script>

<div class="wrap">
  <canvas class="viewport" {@attach playground}></canvas>
  <button class="reset" onclick={() => api?.reset()}>↺ Reset stack</button>
  <span class="hint">click to drop a ball · drag to orbit</span>
</div>

<style>
  .wrap { position: relative; width: 100%; height: 100%; min-height: 320px; }
  .viewport { width: 100%; height: 100%; display: block; border-radius: 12px; background: radial-gradient(80% 80% at 50% 30%, #11122a, #05060a); cursor: grab; }
  .viewport:active { cursor: grabbing; }
  .reset {
    position: absolute; top: 1rem; right: 1rem;
    padding: 0.5rem 1.1rem; border-radius: 999px; border: 1px solid #2a3142;
    background: color-mix(in oklab, #05060a 60%, transparent); color: #d6dbe6; cursor: pointer; backdrop-filter: blur(6px);
  }
  .reset:hover { border-color: #7c5cff; color: #fff; }
  .hint { position: absolute; bottom: 0.8rem; left: 1rem; font-size: 0.75rem; color: #5b6478; pointer-events: none; }
</style>
