/* Burger Mafia — procedural 3D burger.
   No external model files: every layer is built from geometry at runtime,
   so there is nothing to download, and colours come straight from the brand palette.
   Loaded on demand by index.html, and only on devices that pass the capability gate. */

export async function mountBurger(canvas, opts) {
  const THREE = await import('three');
  const onReady = (opts && opts.onReady) || function () {};

  /* ---------- renderer ---------- */
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
  if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 1.0, 7.4);
  camera.lookAt(0, 0.75, 0);

  /* ---------- lighting: warm key, flame rim, cool fill ---------- */
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  scene.add(new THREE.HemisphereLight(0xfff0d8, 0x2a1008, 1.15));

  const key = new THREE.DirectionalLight(0xffe0a8, 2.5);
  key.position.set(4, 7, 5);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0xe8321e, 3.2);
  rim.position.set(-5, 2, -4);
  scene.add(rim);

  const gold = new THREE.PointLight(0xf5c451, 22, 16);
  gold.position.set(-2.5, 3.5, 3);
  scene.add(gold);

  const under = new THREE.PointLight(0xff6b35, 9, 12);
  under.position.set(0, -2.2, 2);
  scene.add(under);

  /* ---------- materials ---------- */
  const M = (color, roughness, metalness) => new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness: roughness === undefined ? 0.75 : roughness,
    metalness: metalness === undefined ? 0.02 : metalness
  });

  const lathe = (pts, seg) => new THREE.LatheGeometry(
    pts.map(p => new THREE.Vector2(p[0], p[1])), seg || 64
  );

  /* ---------- layers, bottom to top ---------- */
  const group = new THREE.Group();
  const layers = [];

  function addLayer(mesh, restY, spread, spin) {
    mesh.position.y = restY;
    mesh.userData.restY = restY;
    mesh.userData.spread = spread;
    mesh.userData.spin = spin || 0;
    group.add(mesh);
    layers.push(mesh);
    return mesh;
  }

  /* bottom bun */
  addLayer(new THREE.Mesh(lathe([
    [0.02, 0], [0.34, 0.002], [0.62, 0.008], [0.83, 0.026], [0.96, 0.062], [1.05, 0.115],
    [1.10, 0.185], [1.115, 0.26], [1.10, 0.335], [1.045, 0.395], [0.95, 0.435],
    [0.72, 0.452], [0.40, 0.458], [0.02, 0.46]
  ]), M(0xd89a4e, 0.82)), 0, 0, 0);

  /* patty */
  const patty = new THREE.Mesh(lathe([
    [0.02, 0], [0.5, 0.004], [0.82, 0.012], [0.98, 0.038], [1.055, 0.085],
    [1.072, 0.145], [1.055, 0.205], [0.98, 0.245], [0.8, 0.263], [0.45, 0.271], [0.02, 0.274]
  ]), M(0x4a2c1c, 0.94));
  addLayer(patty, 0.46, 1.0, 0.5);

  /* cheese — thin square slice, corners hanging over the patty */
  const cheeseGeo = new THREE.BoxGeometry(1.94, 0.045, 1.94, 10, 1, 10);
  const cp = cheeseGeo.attributes.position;
  for (let i = 0; i < cp.count; i++) {
    const x = cp.getX(i), z = cp.getZ(i);
    /* the further from the centre, the more it melts over the edge */
    const d = Math.min(1, Math.hypot(x, z) / 1.05);
    cp.setY(i, cp.getY(i) - Math.pow(d, 2.8) * 0.2);
  }
  cheeseGeo.computeVertexNormals();
  const cheese = new THREE.Mesh(cheeseGeo, M(0xf5a623, 0.38, 0.04));
  cheese.rotation.y = Math.PI / 4;
  addLayer(cheese, 0.82, 1.7, -0.7);

  /* lettuce — torus pushed into a ruffle */
  const lettuceGeo = new THREE.TorusGeometry(0.82, 0.21, 12, 60);
  const lp = lettuceGeo.attributes.position;
  for (let i = 0; i < lp.count; i++) {
    const x = lp.getX(i), y = lp.getY(i), z = lp.getZ(i);
    const a = Math.atan2(y, x);
    const ruffle = Math.sin(a * 9) * 0.1 + Math.sin(a * 5) * 0.05;
    lp.setXYZ(i, x * (1 + ruffle * 0.3), y * (1 + ruffle * 0.3), z + ruffle);
  }
  lettuceGeo.computeVertexNormals();
  const lettuce = new THREE.Mesh(lettuceGeo, M(0x5aa83c, 0.7));
  lettuce.rotation.x = Math.PI / 2;
  addLayer(lettuce, 0.95, 2.4, 0.9);

  /* tomato */
  addLayer(new THREE.Mesh(lathe([
    [0.02, 0], [0.86, 0.005], [0.95, 0.04], [0.9, 0.1], [0.02, 0.11]
  ]), M(0xc4372a, 0.6)), 1.06, 3.1, -0.45);

  /* top bun dome + sesame */
  const topBun = new THREE.Group();
  topBun.add(new THREE.Mesh(lathe([
    [0.02, 0], [0.42, 0.002], [0.72, 0.008], [0.92, 0.03], [1.045, 0.075],
    [1.105, 0.15], [1.12, 0.245], [1.085, 0.345], [1.00, 0.45], [0.885, 0.545],
    [0.73, 0.635], [0.55, 0.705], [0.34, 0.755], [0.02, 0.782]
  ]), M(0xe0a458, 0.78)));

  const seedGeo = new THREE.SphereGeometry(0.035, 8, 6);
  const seeds = new THREE.InstancedMesh(seedGeo, M(0xf6e7c4, 0.55), 46);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 46; i++) {
    /* even-ish spread over the dome using a golden-angle spiral */
    const t = i / 46;
    const phi = Math.acos(1 - 1.35 * t);
    const theta = i * 2.39996;
    const r = 1.03;
    dummy.position.set(
      Math.sin(phi) * Math.cos(theta) * r,
      0.78 - Math.cos(phi) * 0.0 + Math.cos(phi) * 0.62 - 0.08,
      Math.sin(phi) * Math.sin(theta) * r
    );
    dummy.position.y = 0.2 + Math.cos(phi) * 0.56;
    dummy.scale.setScalar(0.8 + Math.random() * 0.5);
    dummy.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    dummy.updateMatrix();
    seeds.setMatrixAt(i, dummy.matrix);
  }
  topBun.add(seeds);
  addLayer(topBun, 1.18, 4.0, 1.3);

  group.position.y = -0.75;
  scene.add(group);

  /* ---------- sizing ---------- */
  function resize() {
    const r = canvas.getBoundingClientRect();
    const w = Math.max(1, r.width), h = Math.max(1, r.height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    /* pull the camera back on narrow screens so the stack always fits */
    camera.position.z = w / h < 0.85 ? 9.6 : 7.4;
    camera.updateProjectionMatrix();
  }
  resize();
  addEventListener('resize', resize, { passive: true });

  /* ---------- state driven from scroll ---------- */
  const state = { build: 0, spin: 0, tiltX: 0, tiltY: 0 };
  let pointerX = 0, pointerY = 0;

  function onPointer(e) {
    pointerX = (e.clientX / innerWidth - 0.5) * 2;
    pointerY = (e.clientY / innerHeight - 0.5) * 2;
  }
  if (matchMedia('(hover:hover)').matches) addEventListener('pointermove', onPointer, { passive: true });

  /* ---------- render loop, paused when off screen ---------- */
  let visible = false, raf = 0, t0 = performance.now();

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - t0) / 1000); t0 = now;

    /* build: 0 = ingredients scattered and spinning, 1 = assembled */
    const b = state.build;
    const ease = b * b * (3 - 2 * b);

    for (let i = 0; i < layers.length; i++) {
      const m = layers[i];
      m.position.y = m.userData.restY + m.userData.spread * (1 - ease);
      m.rotation.y = m.userData.spin * (1 - ease) * 4;
      const drift = (1 - ease) * 0.55;
      m.position.x = Math.sin(i * 2.1) * drift;
      m.position.z = Math.cos(i * 1.7) * drift;
      m.rotation.z = Math.sin(i * 1.3) * (1 - ease) * 0.45;
    }

    state.tiltX += (pointerY * 0.16 - state.tiltX) * Math.min(1, dt * 4);
    state.tiltY += (pointerX * 0.28 - state.tiltY) * Math.min(1, dt * 4);

    group.rotation.y = state.spin + state.tiltY;
    group.rotation.x = state.tiltX * 0.5;
    group.position.y = -0.75 + Math.sin(now / 1400) * 0.05;

    renderer.render(scene, camera);
  }

  const io = new IntersectionObserver(entries => {
    const on = entries[0].isIntersecting;
    if (on === visible) return;
    visible = on;
    if (on) { t0 = performance.now(); raf = requestAnimationFrame(frame); }
    else cancelAnimationFrame(raf);
  }, { rootMargin: '150px' });
  io.observe(canvas);

  onReady();

  return {
    set(build, spin) {
      state.build = build;
      state.spin = spin;
    },
    destroy() {
      cancelAnimationFrame(raf);
      io.disconnect();
      removeEventListener('resize', resize);
      removeEventListener('pointermove', onPointer);
      scene.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose());
      });
      renderer.dispose();
    }
  };
}
