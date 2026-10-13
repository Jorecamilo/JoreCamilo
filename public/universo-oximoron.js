// Uses the existing WebGLRenderer; a separate scene isolates mesh lighting from Spark.
export function createOximoron(THREE, renderer, wake, signal) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0);
  const camera = new THREE.PerspectiveCamera(42, 1, .01, 100);
  const pivot = new THREE.Group();
  scene.add(pivot, new THREE.HemisphereLight(0xffffff, 0x606878, 2));
  const key = new THREE.DirectionalLight(0xffffff, 3);
  key.position.set(3, 4, 5); scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 1.5);
  fill.position.set(-3, 1, -4); scene.add(fill);
  let requested = false, loading = null, loaded = false, disposed = false;
  let decoder, model, angle = 0, radius = 1, loads = 0;
  function release(object) {
    const geometries = new Set(), materials = new Set(), textures = new Set();
    object?.traverse(node => {
      if (node.geometry) geometries.add(node.geometry);
      for (const material of [].concat(node.material || [])) {
        materials.add(material);
        for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
      }
    });
    textures.forEach(x => x.dispose()); materials.forEach(x => x.dispose());
    geometries.forEach(x => x.dispose());
  }
  function resize() {
    camera.aspect = renderer.domElement.clientWidth / Math.max(1, renderer.domElement.clientHeight);
    const halfAngle = Math.min(THREE.MathUtils.degToRad(21), Math.atan(Math.tan(THREE.MathUtils.degToRad(21)) * camera.aspect));
    camera.position.set(0, 0, radius / Math.sin(halfAngle) * 1.18);
    camera.lookAt(0, 0, 0); camera.updateProjectionMatrix();
  }
  async function load() {
    const [{ GLTFLoader }, { DRACOLoader }] = await Promise.all([
      import('three/addons/loaders/GLTFLoader.js'), import('three/addons/loaders/DRACOLoader.js')
    ]);
    if (disposed) return;
    decoder = new DRACOLoader().setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/libs/draco/gltf/');
    decoder.setWorkerLimit(2);
    const loader = new GLTFLoader().setDRACOLoader(decoder);
    loads++;
    const response = await fetch('./PIEZAS/OXIMORON_WEB.glb', { signal });
    if (!response.ok) throw new Error(`OXIMORON GLB HTTP ${response.status}`);
    const gltf = await loader.parseAsync(await response.arrayBuffer(), '');
    if (disposed) { release(gltf.scene); return; }
    model = gltf.scene;
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    if (box.isEmpty() || !Number.isFinite(size.length()) || size.length() === 0) throw new Error('OXIMORON sin dimensiones válidas');
    // Center all original node transforms, then scale uniformly; never deform meshes.
    const centered = new THREE.Group(); centered.add(model);
    model.position.sub(box.getCenter(new THREE.Vector3()));
    centered.scale.setScalar(2 / Math.max(size.x, size.y, size.z));
    pivot.add(centered);
    radius = new THREE.Box3().setFromObject(pivot).getBoundingSphere(new THREE.Sphere()).radius;
    loaded = true; resize(); decoder.dispose(); decoder = null;
    console.info('OXIMORON_READY', JSON.stringify({ bytes: response.headers.get('content-length'), dimensions: size.toArray(), nodes: model.getObjectsByProperty('isMesh', true).length }));
    wake();
  }
  return {
    setActive(value) {
      requested = value;
      if (value && !loaded && !loading && !disposed) {
        loading = load().catch(error => {
          if (error.name !== 'AbortError') console.error('OXIMORON_ERROR', error);
          decoder?.dispose(); decoder = null; loading = null; wake();
        });
      }
      wake();
    },
    render(dt) {
      if (loaded && requested) { angle = (angle + dt * Math.PI / 6) % (2 * Math.PI); pivot.rotation.y = angle; }
      pivot.visible = loaded && requested;
      renderer.render(scene, camera);
    },
    resize,
    get animating() { return requested && loaded; },
    get state() { return { requested, loaded, loads, angle, visible: pivot.visible && requested }; },
    dispose() { disposed = true; requested = false; decoder?.dispose(); release(model); }
  };
}
