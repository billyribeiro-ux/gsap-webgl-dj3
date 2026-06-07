<script lang="ts">
  import * as THREE from 'three';
  import type { Attachment } from 'svelte/attachments';

  // Audio-reactive visuals: the Web Audio API's AnalyserNode gives us the live
  // frequency spectrum each frame. We push those 128 values into a DataTexture
  // and a fragment shader reads them to draw a radial spectrum, while the bass
  // level drives a pulsing core. (We synthesize the sound too, so there's no
  // asset to load — and it only starts on a click, per browser autoplay rules.)
  const BINS = 128;
  let playing = $state(false);

  let ctx: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  const data = new Uint8Array(BINS); // scratch buffer the analyser writes into
  let arpTimer: ReturnType<typeof setInterval> | null = null;
  let stopNodes: (() => void) | null = null;

  function startAudio(): void {
    ctx = new AudioContext();
    const master = ctx.createGain();
    master.gain.value = 0.05; // keep it gentle
    master.connect(ctx.destination);

    analyser = ctx.createAnalyser();
    analyser.fftSize = BINS * 2;
    master.connect(analyser);

    // A warm detuned-saw drone through a slowly sweeping low-pass filter.
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 700;
    filter.Q.value = 6;
    filter.connect(master);

    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    o1.type = 'sawtooth';
    o2.type = 'sawtooth';
    o2.detune.value = 9;
    o1.connect(filter);
    o2.connect(filter);

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.15;
    lfoGain.gain.value = 500;
    lfo.connect(lfoGain).connect(filter.frequency);

    o1.start();
    o2.start();
    lfo.start();

    // A slow arpeggio so the spectrum dances.
    const notes = [110, 138.6, 164.8, 220, 164.8, 138.6];
    let n = 0;
    const step = () => {
      const f = notes[n % notes.length];
      o1.frequency.setTargetAtTime(f, ctx!.currentTime, 0.02);
      o2.frequency.setTargetAtTime(f * 1.5, ctx!.currentTime, 0.02);
      n++;
    };
    step();
    arpTimer = setInterval(step, 360);

    stopNodes = () => {
      o1.stop();
      o2.stop();
      lfo.stop();
    };
  }

  function stopAudio(): void {
    if (arpTimer) clearInterval(arpTimer);
    stopNodes?.();
    ctx?.close();
    ctx = null;
    analyser = null;
    arpTimer = null;
    stopNodes = null;
    data.fill(0);
  }

  function toggle(): void {
    if (playing) {
      stopAudio();
      playing = false;
    } else {
      startAudio();
      playing = true;
    }
  }

  const visual: Attachment<HTMLCanvasElement> = (canvas) => {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const texData = new Uint8Array(BINS);
    const tex = new THREE.DataTexture(texData, BINS, 1, THREE.RedFormat);
    tex.needsUpdate = true;
    const uniforms = { uData: { value: tex }, uBass: { value: 0 }, uAspect: { value: 1 } };
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D uData;
        uniform float uBass;
        uniform float uAspect;
        varying vec2 vUv;
        void main(){
          vec2 p = (vUv - 0.5);
          p.x *= uAspect;
          float ang = atan(p.y, p.x) / 6.2831853 + 0.5;
          float rad = length(p);
          float amp = texture2D(uData, vec2(ang, 0.5)).r;
          float inner = 0.16 + uBass * 0.05;
          float outer = inner + amp * 0.26;
          float bar = smoothstep(inner - 0.004, inner, rad) * (1.0 - smoothstep(outer, outer + 0.012, rad));
          vec3 c = mix(vec3(0.486,0.360,1.0), vec3(0.098,0.890,0.839), amp);
          vec3 col = bar * c * 1.4;
          col += smoothstep(inner, inner - 0.10, rad) * uBass * vec3(0.55,0.35,1.0); // pulsing core
          gl_FragColor = vec4(col, 1.0);
        }
      `
    });
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

    const resize = () => {
      renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
      uniforms.uAspect.value = canvas.clientWidth / canvas.clientHeight;
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    let raf = 0;
    const tick = () => {
      if (analyser) {
        analyser.getByteFrequencyData(data);
        texData.set(data);
        tex.needsUpdate = true;
        let bass = 0;
        for (let i = 0; i < 8; i++) bass += data[i];
        uniforms.uBass.value = bass / (8 * 255);
      } else {
        uniforms.uBass.value *= 0.9;
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      tex.dispose();
      material.dispose();
      renderer.dispose();
      stopAudio();
    };
  };
</script>

<div class="wrap">
  <canvas class="viewport" {@attach visual}></canvas>
  <button class="play" onclick={toggle}>{playing ? '◼ Stop' : '▶ Play sound'}</button>
</div>

<style>
  .wrap { position: relative; width: 100%; height: 100%; min-height: 320px; }
  .viewport { width: 100%; height: 100%; display: block; border-radius: 12px; background: #05060a; }
  .play {
    position: absolute;
    bottom: 1rem;
    left: 50%;
    transform: translateX(-50%);
    padding: 0.6rem 1.4rem;
    border-radius: 999px;
    border: none;
    font-weight: 700;
    color: #05060a;
    background: linear-gradient(135deg, #7c5cff, #19e3d6);
    cursor: pointer;
  }
</style>
