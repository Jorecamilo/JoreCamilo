// Spark 2.3.1 / Three.js 0.180.0. No demo scene, GUI or camera controls.
// Disintegrate shader adapted from the official Spark example:
// https://github.com/sparkjsdev/spark/blob/main/examples/splat-shader-effects/index.html
// Shader functions hash, rot, disintegrate and the scale blend are original.
/*
The MIT License
Copyright © 2025 WORLD LABS TECHNOLOGIES, INC.
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
const field = document.getElementById('pieza-campo');
const trigger = document.getElementById('pieza-trigger');
const branch = document.querySelector('.piezas-rama');
const children = document.getElementById('piezas-listado');
const index = document.querySelector('.indice');
const hoverDevice = matchMedia('(hover: hover)');
const source = './PIEZAS/Cara%20arcilla%201%20Ailin.spz';
const lifetime = new AbortController();
const listen = (node, event, fn) => node.addEventListener(event, fn, { signal: lifetime.signal });
const debug = new URLSearchParams(location.search).has('pieza-debug');
let active = false, disposed = false, ready = false;
let renderer, spark, piece, root, camera, scene, progressUniform;
let resizeRenderer = () => {}, wake = () => {};
let progress = 0, transition = null;
let frameId = 0, lastTime = 0, floatTime = 0, warmUntil = 0;
let radius = 1, renderFrames = 0, lastDebug = 0;
const smooth = value => value * value * (3 - 2 * value);

// Opening the editorial branch never changes the sculpture's target state.
listen(trigger, 'click', () => {
  const expanded = trigger.getAttribute('aria-expanded') !== 'true';
  trigger.setAttribute('aria-expanded', String(expanded));
  trigger.querySelector('.piezas-triangulo').textContent = expanded ? '▾' : '▸';
  branch.classList.toggle('abierta', expanded);
  children.setAttribute('aria-hidden', String(!expanded));
  children.inert = !expanded;
});
function sample(now) {
  if (!transition) return progress;
  const t = Math.min(1, Math.max(0, (now - transition.start) / transition.duration));
  progress = transition.from + (transition.to - transition.from) * smooth(t);
  if (t === 1) transition = null;
  return progress;
}
function target(show) {
  const now = performance.now();
  const current = sample(now); // Never reset to an endpoint on interrupted hover.
  active = show;
  const goal = show ? 1 : 0;
  if (ready && current !== goal) {
    transition = { from: current, to: goal, start: now, duration: (show ? 500 : 400) * Math.abs(goal - current) };
  }
  if (debug) console.info('PIEZA_TARGET', JSON.stringify({ show, from: current, duration: transition?.duration ?? 0 }));
  wake();
}
listen(trigger, 'mouseenter', () => { if (hoverDevice.matches) target(true); });
listen(trigger, 'mouseleave', () => target(false));
listen(window, 'blur', () => target(false));
function sizeField() {
  field.style.left = `${Math.min(innerWidth, Math.max(0, index.getBoundingClientRect().right))}px`;
  resizeRenderer();
}
listen(window, 'resize', sizeField);
const observer = new ResizeObserver(sizeField);
observer.observe(index);
sizeField();

function diagnostics(now, force = false) {
  if (!debug || (!force && now - lastDebug < 100)) return;
  lastDebug = now;
  field.dataset.diagnostics = JSON.stringify({ progress, active, transitioning: !!transition,
    renderFrames, canvases: field.childElementCount, geometries: renderer.info.memory.geometries,
    textures: renderer.info.memory.textures, programs: renderer.info.programs.length,
    floatingRotation: root.rotation.toArray().slice(0, 3), running: !!frameId });
}
function frame(now) {
  frameId = 0;
  if (disposed || document.hidden) { lastTime = 0; return; }
  const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0;
  lastTime = now;
  if (!ready && now >= warmUntil) {
    ready = true;
    field.dataset.ready = 'true';
    if (active) target(true);
  }
  sample(now);
  if (progressUniform.value !== progress) { progressUniform.value = progress; piece.updateVersion(); }
  // Bounded Object3D motion only: never rotate the canvas or run disintegration
  // periodically. At progress=1 the original shader restores every splat exactly.
  floatTime += dt;
  const weight = smooth(progress);
  root.position.set(radius * .018 * Math.sin(floatTime * .57) * weight,
    radius * .035 * Math.sin(floatTime * .83) * weight,
    radius * .014 * Math.sin(floatTime * .43) * weight);
  root.rotation.set(.025 * Math.sin(floatTime * .49) * weight,
    (.314159 + .174533 * Math.sin(floatTime * .37)) * weight,
    .018 * Math.sin(floatTime * .61) * weight);
  renderer.render(scene, camera);
  renderFrames++;
  if (!ready || active || transition) wake();
  else lastTime = 0;
  diagnostics(now, !frameId);
}
async function preparePiece() {
  if (!hoverDevice.matches || disposed) return;
  const started = performance.now();
  try {
    const [THREE, { SparkRenderer, SplatMesh, dyno }, response] = await Promise.all([
      import('three'), import('@sparkjsdev/spark'), fetch(source, { cache: 'no-store', signal: lifetime.signal })
    ]);
    if (disposed) return;
    if (!response.ok) throw new Error(`SPZ HTTP ${response.status}`);
    const bytes = await response.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    if (disposed) return;
    renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
    renderer.setClearColor(0x000000, 1);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    field.appendChild(renderer.domElement);
    scene = new THREE.Scene(); scene.background = new THREE.Color(0x000000);
    camera = new THREE.PerspectiveCamera(42, 1, .001, 100);
    spark = new SparkRenderer({ renderer }); scene.add(spark);
    piece = new SplatMesh({ fileBytes: bytes, fileName: 'Cara arcilla 1 Ailin.spz', lod: false });
    await piece.initialized;
    if (disposed) { piece.dispose(); return; }
    const box = piece.getBoundingBox(true);
    radius = box.getSize(new THREE.Vector3()).length() / 2;
    if (box.isEmpty() || !Number.isFinite(radius) || radius <= 0) throw new Error('SPZ sin dimensiones válidas');
    const center = box.getCenter(new THREE.Vector3());
    piece.position.copy(center).negate();
    root = new THREE.Group(); root.add(piece); scene.add(root);
    progressUniform = dyno.dynoFloat(0);
    // The example's cat is meter-scale. Normalize this small scan to the same
    // effect space, then restore its original units and centered position.
    const unit = radius / 2;
    piece.objectModifier = dyno.dynoBlock({ gsplat: dyno.Gsplat }, { gsplat: dyno.Gsplat }, ({ gsplat }) => {
      const effect = new dyno.Dyno({
        inTypes: { gsplat: dyno.Gsplat, progress: 'float' }, outTypes: { gsplat: dyno.Gsplat },
        globals: () => [dyno.unindent(`
          vec3 hash(vec3 p) { return fract(sin(p*123.456)*123.456); }
          mat2 rot(float a) { float s = sin(a), c = cos(a); return mat2(c, -s, s, c); }
          vec4 disintegrate(vec3 pos, float t, float intensity) {
            vec3 p = pos + (hash(pos) * 2. - 1.) * intensity;
            float tt = smoothstep(-1., 0.5, -sin(t + -pos.y * .5));
            p.xz *= rot(tt * 2. + p.y * 2. * tt);
            return vec4(mix(p, pos, tt), tt);
          }
        `)],
        statements: ({ inputs, outputs }) => dyno.unindentLines(`
          ${outputs.gsplat} = ${inputs.gsplat};
          vec3 origin = vec3(${center.x.toFixed(10)}, ${center.y.toFixed(10)}, ${center.z.toFixed(10)});
          float unit = ${unit.toFixed(10)};
          vec3 pos = (${inputs.gsplat}.center - origin) / unit;
          // Map hover to one reversible section of the ORIGINAL sine shader.
          // Cancel its per-row clock offset so both endpoints are exact for all splats.
          float t = asin(clamp(1. - 1.5 * ${inputs.progress}, -1., 1.)) + pos.y * .5;
          vec4 e = disintegrate(pos, t, .8);
          ${outputs.gsplat}.center = e.xyz * unit + origin;
          ${outputs.gsplat}.scales = mix(vec3(.01) * unit, ${inputs.gsplat}.scales, e.w);
          // Original demo leaves dispersed particles visible. Hide only the final
          // dispersed tail here, per splat in the shader; never a CSS opacity fade.
          ${outputs.gsplat}.rgba.a *= smoothstep(0., .15, ${inputs.progress});
        `)
      });
      return { gsplat: effect.apply({ gsplat, progress: progressUniform }).gsplat };
    });
    piece.updateGenerator(); // Compile once; hover updates the uniform, not the graph.
    wake = () => { if (!disposed && !document.hidden && !frameId) frameId = requestAnimationFrame(frame); };
    resizeRenderer = () => {
      const width = Math.max(1, field.clientWidth), height = Math.max(1, field.clientHeight);
      renderer.setSize(width, height); camera.aspect = width / height;
      const halfAngle = Math.min(THREE.MathUtils.degToRad(21), Math.atan(Math.tan(THREE.MathUtils.degToRad(21)) * camera.aspect));
      camera.position.set(.12, .04, 1).normalize().multiplyScalar(radius / Math.sin(halfAngle) * 1.25);
      camera.near = radius / 100; camera.far = radius * 100;
      camera.lookAt(0, 0, 0); camera.updateProjectionMatrix(); wake();
    };
    warmUntil = performance.now() + 600;
    sizeField();
    console.info('UNIVERSO_PIEZA_READY', JSON.stringify({ source, bytes: bytes.byteLength,
      sha256: Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, '0')).join(''),
      splats: piece.numSplats, prepareMs: Math.round(performance.now() - started), effect: 'Spark disintegrate' }));
  } catch (error) {
    if (error.name !== 'AbortError') console.error('UNIVERSO_PIEZA_ERROR', error);
    cleanup(); // Fail visibly in console, not by silently substituting a CSS fade.
  }
}
function cleanup() {
  if (disposed) return;
  disposed = true; lifetime.abort(); observer.disconnect();
  cancelAnimationFrame(frameId); frameId = 0;
  piece?.dispose(); spark?.dispose(); renderer?.dispose();
  renderer?.domElement.remove();
}
listen(document, 'visibilitychange', () => {
  if (document.hidden) { target(false); cancelAnimationFrame(frameId); frameId = 0; lastTime = 0; }
  else wake();
});
listen(window, 'pagehide', event => {
  if (!event.persisted) cleanup();
  else { cancelAnimationFrame(frameId); frameId = 0; lastTime = 0; }
});
listen(window, 'pageshow', () => wake());
function schedulePreparation() {
  if ('requestIdleCallback' in window) requestIdleCallback(preparePiece, { timeout: 1000 });
  else setTimeout(preparePiece, 0);
}
if (document.readyState === 'complete') schedulePreparation();
else listen(window, 'load', schedulePreparation);
