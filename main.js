/* ============================================================
   Premium construction demo
   Three.js hero scene + GSAP ScrollTrigger cinematic zoom
   ============================================================ */

import * as THREE from './vendor/three.module.min.js';

gsap.registerPlugin(ScrollTrigger);

const isMobile = matchMedia('(max-width: 760px)').matches;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduced) document.documentElement.classList.add('reduced');

/* ------------------------------------------------------------
   1. THREE.JS SCENE
   ------------------------------------------------------------ */

const webglRoot = document.getElementById('webgl');
let renderer = null;

try {
  renderer = new THREE.WebGLRenderer({ antialias: !isMobile, powerPreference: 'high-performance' });
} catch (e) {
  renderer = null; // WebGL unavailable — static gradient background remains
}

let scrollProgress = 0;      // target (set by ScrollTrigger)
let smoothProgress = 0;      // damped (used by camera)
const mouse = { x: 0, y: 0, sx: 0, sy: 0 };

if (renderer) {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.6 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  webglRoot.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0c0e10, 0.011);

  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 300);

  /* ---------- lights ---------- */
  scene.add(new THREE.HemisphereLight(0x4a5764, 0x141311, 1.05));

  const key = new THREE.DirectionalLight(0xffe9cf, 1.0);
  key.position.set(18, 32, 14);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0x5a708c, 0.55);
  fill.position.set(-22, 14, -16);
  scene.add(fill);

  const uplight = new THREE.PointLight(0xc9a24b, 7, 30, 1.8);
  uplight.position.set(5, 1.2, 7);
  scene.add(uplight);

  /* ---------- materials (shared) ---------- */
  const matConcrete   = new THREE.MeshStandardMaterial({ color: 0xb6b1a8, roughness: 0.92 });
  const matCore       = new THREE.MeshStandardMaterial({ color: 0x8e8a82, roughness: 0.95 });
  const matDarkMetal  = new THREE.MeshStandardMaterial({ color: 0x3a3f46, roughness: 0.5, metalness: 0.65 });
  const matGlass      = new THREE.MeshPhysicalMaterial({
    color: 0x8fa8ba, roughness: 0.08, metalness: 0.15,
    transparent: true, opacity: 0.34, envMapIntensity: 1.2,
  });
  const matSteelGold  = new THREE.MeshStandardMaterial({ color: 0xc9a24b, roughness: 0.35, metalness: 0.8 });
  const matSafety     = new THREE.MeshStandardMaterial({
    color: 0xff8c3a, emissive: 0xff7a20, emissiveIntensity: 0.9, roughness: 0.6,
  });
  const matNeighbor   = new THREE.MeshStandardMaterial({ color: 0x181b1f, roughness: 0.95 });

  /* ---------- deterministic pseudo-random ---------- */
  let seed = 7;
  const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

  /* ---------- the tower ---------- */
  const tower = new THREE.Group();
  scene.add(tower);

  const FLOORS = 16;
  const BUILT = 12;              // fully-glazed floors; the rest are under construction
  const FH = 1.15;               // floor height
  const W = 10, D = 10;

  const dummy = new THREE.Object3D();

  // Slabs
  const slabGeo = new THREE.BoxGeometry(W + 0.6, 0.26, D + 0.6);
  const slabs = new THREE.InstancedMesh(slabGeo, matConcrete, FLOORS + 1);
  for (let i = 0; i <= FLOORS; i++) {
    dummy.position.set(0, i * FH, 0);
    dummy.updateMatrix();
    slabs.setMatrixAt(i, dummy.matrix);
  }
  tower.add(slabs);

  // Glass curtain wall on completed floors
  const glassGeo = new THREE.BoxGeometry(W - 0.15, FH - 0.26, D - 0.15);
  const glass = new THREE.InstancedMesh(glassGeo, matGlass, BUILT);
  for (let i = 0; i < BUILT; i++) {
    dummy.position.set(0, i * FH + FH / 2, 0);
    dummy.updateMatrix();
    glass.setMatrixAt(i, dummy.matrix);
  }
  tower.add(glass);

  // Vertical mullions around completed floors
  const mullGeo = new THREE.BoxGeometry(0.09, BUILT * FH, 0.09);
  const mullPositions = [];
  for (let x = -W / 2; x <= W / 2 + 0.01; x += 2) {
    mullPositions.push([x, D / 2], [x, -D / 2]);
  }
  for (let z = -D / 2 + 2; z <= D / 2 - 2 + 0.01; z += 2) {
    mullPositions.push([W / 2, z], [-W / 2, z]);
  }
  const mullions = new THREE.InstancedMesh(mullGeo, matDarkMetal, mullPositions.length);
  mullPositions.forEach(([x, z], i) => {
    dummy.position.set(x, (BUILT * FH) / 2, z);
    dummy.updateMatrix();
    mullions.setMatrixAt(i, dummy.matrix);
  });
  tower.add(mullions);

  // Concrete core rising above the top slab
  const core = new THREE.Mesh(new THREE.BoxGeometry(3.4, FLOORS * FH + 2.4, 3.4), matCore);
  core.position.y = (FLOORS * FH + 2.4) / 2;
  tower.add(core);

  // Exposed columns on the floors under construction
  const colGeo = new THREE.CylinderGeometry(0.1, 0.1, FH - 0.26, 8);
  const colSpots = [];
  for (let x = -W / 2 + 1; x <= W / 2 - 1 + 0.01; x += 2.6) {
    colSpots.push([x, D / 2 - 0.6], [x, -D / 2 + 0.6]);
  }
  colSpots.push([W / 2 - 0.6, 0], [-W / 2 + 0.6, 0]);
  const nColFloors = FLOORS - BUILT;
  const columns = new THREE.InstancedMesh(colGeo, matConcrete, colSpots.length * nColFloors);
  let ci = 0;
  for (let f = BUILT; f < FLOORS; f++) {
    for (const [x, z] of colSpots) {
      dummy.position.set(x, f * FH + FH / 2, z);
      dummy.updateMatrix();
      columns.setMatrixAt(ci++, dummy.matrix);
    }
  }
  tower.add(columns);

  // Safety rails (emissive orange) around construction floors
  const railH = 0.05;
  const railGeoX = new THREE.BoxGeometry(W + 0.6, railH, 0.05);
  const railGeoZ = new THREE.BoxGeometry(0.05, railH, D + 0.6);
  const rails = new THREE.Group();
  for (let f = BUILT; f <= FLOORS; f++) {
    const y = f * FH + 0.55;
    const r1 = new THREE.Mesh(railGeoX, matSafety); r1.position.set(0, y, (D + 0.6) / 2);
    const r2 = new THREE.Mesh(railGeoX, matSafety); r2.position.set(0, y, -(D + 0.6) / 2);
    const r3 = new THREE.Mesh(railGeoZ, matSafety); r3.position.set((W + 0.6) / 2, y, 0);
    const r4 = new THREE.Mesh(railGeoZ, matSafety); r4.position.set(-(W + 0.6) / 2, y, 0);
    rails.add(r1, r2, r3, r4);
  }
  tower.add(rails);

  // Lit windows — small emissive panes on the two camera-facing facades
  const paneGeo = new THREE.PlaneGeometry(0.92, 0.42);
  const matPane = new THREE.MeshBasicMaterial({ color: 0xffd9a2, transparent: true, opacity: 0.6 });
  const paneCount = isMobile ? 60 : 110;
  const panes = new THREE.InstancedMesh(paneGeo, matPane, paneCount);
  for (let i = 0; i < paneCount; i++) {
    const f = Math.floor(rand() * BUILT);
    const y = f * FH + FH / 2;
    if (rand() > 0.5) {
      // +Z facade
      dummy.position.set((rand() - 0.5) * (W - 2), y, D / 2 + 0.03);
      dummy.rotation.set(0, 0, 0);
    } else {
      // +X facade
      dummy.position.set(W / 2 + 0.03, y, (rand() - 0.5) * (D - 2));
      dummy.rotation.set(0, Math.PI / 2, 0);
    }
    dummy.updateMatrix();
    panes.setMatrixAt(i, dummy.matrix);
  }
  tower.add(panes);

  // Aviation beacon on the core
  const beacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xff3b30 })
  );
  beacon.position.set(0, FLOORS * FH + 2.6, 0);
  tower.add(beacon);

  /* ---------- tower crane ---------- */
  const crane = new THREE.Group();
  crane.position.set(13.5, 0, -7);
  scene.add(crane);

  const MAST_H = FLOORS * FH + 6;
  // 4 corner posts
  const postGeo = new THREE.BoxGeometry(0.09, MAST_H, 0.09);
  [[0.45, 0.45], [0.45, -0.45], [-0.45, 0.45], [-0.45, -0.45]].forEach(([x, z]) => {
    const p = new THREE.Mesh(postGeo, matSteelGold);
    p.position.set(x, MAST_H / 2, z);
    crane.add(p);
  });
  // Horizontal braces
  const braceGeoX = new THREE.BoxGeometry(0.95, 0.06, 0.06);
  const braceGeoZ = new THREE.BoxGeometry(0.06, 0.06, 0.95);
  const nBraces = Math.floor(MAST_H / 2);
  const bracesX = new THREE.InstancedMesh(braceGeoX, matSteelGold, nBraces * 2);
  const bracesZ = new THREE.InstancedMesh(braceGeoZ, matSteelGold, nBraces * 2);
  for (let i = 0; i < nBraces; i++) {
    const y = i * 2 + 1;
    dummy.rotation.set(0, 0, 0);
    dummy.position.set(0, y, 0.45); dummy.updateMatrix(); bracesX.setMatrixAt(i * 2, dummy.matrix);
    dummy.position.set(0, y, -0.45); dummy.updateMatrix(); bracesX.setMatrixAt(i * 2 + 1, dummy.matrix);
    dummy.position.set(0.45, y, 0); dummy.updateMatrix(); bracesZ.setMatrixAt(i * 2, dummy.matrix);
    dummy.position.set(-0.45, y, 0); dummy.updateMatrix(); bracesZ.setMatrixAt(i * 2 + 1, dummy.matrix);
  }
  crane.add(bracesX, bracesZ);

  // Slewing unit + jib (this group rotates)
  const slew = new THREE.Group();
  slew.position.y = MAST_H;
  crane.add(slew);

  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1, 1.1), matDarkMetal);
  cab.position.y = 0.5;
  slew.add(cab);

  const jib = new THREE.Mesh(new THREE.BoxGeometry(15, 0.32, 0.42), matSteelGold);
  jib.position.set(7.5 - 2.5, 1.15, 0);
  slew.add(jib);

  const counterJib = new THREE.Mesh(new THREE.BoxGeometry(5, 0.32, 0.42), matSteelGold);
  counterJib.position.set(-5, 1.15, 0);
  slew.add(counterJib);

  const counterWeight = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 1), matConcrete);
  counterWeight.position.set(-7, 0.8, 0);
  slew.add(counterWeight);

  const apex = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.4, 0.14), matSteelGold);
  apex.position.set(0, 2.2, 0);
  slew.add(apex);

  // Tie cables
  const cableMat = new THREE.LineBasicMaterial({ color: 0x8b7a4d, transparent: true, opacity: 0.7 });
  const tie = (x1, y1, x2, y2) => {
    const g = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x1, y1, 0), new THREE.Vector3(x2, y2, 0),
    ]);
    slew.add(new THREE.Line(g, cableMat));
  };
  tie(0, 3.4, 11.5, 1.3);
  tie(0, 3.4, -6.8, 1.3);

  // Trolley, hook cable + hook
  const trolley = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.24, 0.5), matDarkMetal);
  trolley.position.set(8, 0.9, 0);
  slew.add(trolley);

  const hookDrop = 9;
  const hookCableGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -hookDrop, 0),
  ]);
  const hookCable = new THREE.Line(hookCableGeo, cableMat);
  trolley.add(hookCable);
  const hook = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.4), matSafety);
  hook.position.y = -hookDrop;
  trolley.add(hook);

  /* ---------- ground & context ---------- */
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(90, 48).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x121518, roughness: 1 })
  );
  scene.add(ground);

  const grid = new THREE.GridHelper(140, 70, 0x272c31, 0x1b1f24);
  grid.position.y = 0.02;
  scene.add(grid);

  // Neighbouring massing blocks
  const neighborSpots = [
    [-22, 5.5, -14, 7, 9], [-17, 3.2, 16, 6, 6], [24, 7.5, -18, 8, 8],
    [28, 4, 8, 7, 10], [-30, 8, 2, 9, 7], [18, 2.6, 20, 8, 6],
    [-12, 4.5, -26, 6, 8], [8, 3.4, -26, 10, 6],
  ];
  neighborSpots.forEach(([x, h, z, w, d]) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h * 2, d), matNeighbor);
    b.position.set(x, h, z);
    scene.add(b);
  });

  // Site clutter near the base — pallets and barriers
  const palletMat = new THREE.MeshStandardMaterial({ color: 0x6b5a3e, roughness: 0.9 });
  [[8.5, 0.35, 3.5], [9.6, 0.35, 4.6], [8.9, 1.0, 4.0]].forEach(([x, y, z]) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 1.2), palletMat);
    p.position.set(x, y, z);
    p.rotation.y = rand() * 0.8;
    scene.add(p);
  });
  for (let i = 0; i < 5; i++) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 0.1), matSafety);
    bar.position.set(-7 + i * 2.6, 0.55, 9.5);
    scene.add(bar);
  }

  /* ---------- dust particles ---------- */
  const pCount = isMobile ? 110 : 240;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount; i++) {
    pPos[i * 3] = (rand() - 0.5) * 46;
    pPos[i * 3 + 1] = rand() * 26;
    pPos[i * 3 + 2] = (rand() - 0.5) * 46;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
    color: 0xc9a24b, size: 0.07, transparent: true, opacity: 0.4,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  scene.add(particles);

  /* ---------- cinematic camera path ---------- */
  const camPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(46, 27, 54),
    new THREE.Vector3(30, 19, 36),
    new THREE.Vector3(14, 11, 19),
    new THREE.Vector3(4.8, 6.6, 9.6),
  ]);
  const lookStart = new THREE.Vector3(0, 11.5, 0);
  const lookEnd = new THREE.Vector3(0, 6.4, 1.6);

  const camPos = new THREE.Vector3();
  const camLook = new THREE.Vector3();
  const smoothstep = (t) => t * t * (3 - 2 * t);

  function updateCamera(t) {
    const e = smoothstep(THREE.MathUtils.clamp(smoothProgress, 0, 1));
    camPath.getPointAt(e, camPos);

    // idle sway + mouse parallax, damped out as we zoom in
    const sway = (1 - e * 0.75);
    camPos.x += Math.sin(t * 0.00021) * 1.4 * sway + mouse.sx * 1.6 * sway;
    camPos.y += Math.cos(t * 0.00017) * 0.7 * sway + mouse.sy * -1.0 * sway;
    camPos.z += Math.cos(t * 0.00019) * 1.2 * sway;

    camLook.lerpVectors(lookStart, lookEnd, e);
    camera.position.copy(camPos);
    camera.lookAt(camLook);
  }

  /* ---------- render loop ---------- */
  let heroActive = true;
  let rafId = null;
  let lastT = 0;

  function frame(t) {
    rafId = requestAnimationFrame(frame);
    const dt = Math.min(t - lastT, 50);
    lastT = t;

    // damp scroll + mouse for a fluid, cinematic feel
    smoothProgress += (scrollProgress - smoothProgress) * (1 - Math.pow(0.0018, dt / 1000));
    mouse.sx += (mouse.x - mouse.sx) * 0.045;
    mouse.sy += (mouse.y - mouse.sy) * 0.045;

    if (!reduced) {
      slew.rotation.y = t * 0.00009;
      const pulse = (Math.sin(t * 0.0035) + 1) / 2;
      beacon.material.color.setRGB(0.35 + 0.65 * pulse, 0.08 * pulse, 0.06 * pulse);

      const pos = particles.geometry.attributes.position;
      for (let i = 0; i < pCount; i++) {
        let y = pos.getY(i) + dt * 0.00035;
        if (y > 27) y = 0;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
    }

    updateCamera(t);
    renderer.render(scene, camera);
  }

  function startLoop() { if (rafId === null) { lastT = performance.now(); rafId = requestAnimationFrame(frame); } }
  function stopLoop() { if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; } }
  startLoop();

  document.addEventListener('visibilitychange', () => {
    document.hidden ? stopLoop() : (heroActive && startLoop());
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  if (!isMobile) {
    window.addEventListener('pointermove', (e) => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    });
  }

  /* ---------- scroll drives the zoom ---------- */
  ScrollTrigger.create({
    trigger: '.hero-track',
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => { scrollProgress = self.progress; },
    onLeave: () => { heroActive = false; stopLoop(); },
    onEnterBack: () => { heroActive = true; startLoop(); },
  });
}

/* ------------------------------------------------------------
   2. HERO CAPTION CHOREOGRAPHY (scrubbed to the same track)
   ------------------------------------------------------------ */

const captionTl = gsap.timeline({
  scrollTrigger: {
    trigger: '.hero-track',
    start: 'top top',
    end: 'bottom bottom',
    scrub: 0.6,
  },
});

captionTl
  .to('.caption-1', { opacity: 0, y: -70, ease: 'power2.in', duration: 0.16 }, 0.05)
  .to('.scroll-hint', { opacity: 0, duration: 0.08 }, 0.02)
  .fromTo('.caption-2', { opacity: 0, y: 60 }, { opacity: 1, y: 0, ease: 'power2.out', duration: 0.12 }, 0.3)
  .to('.caption-2', { opacity: 0, y: -70, ease: 'power2.in', duration: 0.12 }, 0.52)
  .fromTo('.caption-3', { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, ease: 'power2.out', duration: 0.12 }, 0.68)
  .to('.caption-3', { opacity: 0, ease: 'power2.in', duration: 0.1 }, 0.88);

// entrance animation on load
gsap.fromTo('.caption-1 > *',
  { opacity: 0, y: 46 },
  { opacity: 1, y: 0, duration: 1.2, stagger: 0.14, ease: 'power3.out', delay: 0.25 }
);
gsap.fromTo('.site-header', { opacity: 0 }, { opacity: 1, duration: 1, delay: 0.9 });

/* ------------------------------------------------------------
   3. SCROLL-TRIGGERED SECTION REVEALS
   ------------------------------------------------------------ */

if (!reduced) {
  document.querySelectorAll('[data-reveal]').forEach((el) => {
    const targets = el.hasAttribute('data-stagger') ? el.children : el;
    gsap.set(el, { opacity: 1, y: 0 }); // container itself visible; animate targets
    gsap.fromTo(targets,
      { opacity: 0, y: 44 },
      {
        opacity: 1, y: 0, duration: 1, ease: 'power3.out',
        stagger: el.hasAttribute('data-stagger') ? 0.09 : 0,
        scrollTrigger: { trigger: el, start: 'top 84%', once: true },
      }
    );
  });
} else {
  gsap.set('[data-reveal]', { opacity: 1, y: 0 });
}

/* ---------- animated counters ---------- */
document.querySelectorAll('[data-count]').forEach((el) => {
  const end = parseInt(el.dataset.count, 10);
  ScrollTrigger.create({
    trigger: el, start: 'top 88%', once: true,
    onEnter: () => {
      gsap.fromTo(el, { innerText: 0 }, {
        innerText: end, duration: 1.6, ease: 'power2.out',
        snap: { innerText: 1 },
      });
    },
  });
});

/* ------------------------------------------------------------
   4. UI — header, nav, FAQ, form
   ------------------------------------------------------------ */

const header = document.getElementById('siteHeader');
const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
navToggle.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', open);
});
navLinks.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
  navLinks.classList.remove('open');
  navToggle.setAttribute('aria-expanded', 'false');
}));

// FAQ accordion
document.querySelectorAll('.faq-item').forEach((item) => {
  const q = item.querySelector('.faq-q');
  const a = item.querySelector('.faq-a');
  q.addEventListener('click', () => {
    const open = item.classList.toggle('open');
    q.setAttribute('aria-expanded', open);
    a.style.maxHeight = open ? a.scrollHeight + 'px' : '0px';
  });
});

// Demo contact form
document.getElementById('contactForm').addEventListener('submit', (e) => {
  e.preventDefault();
  document.getElementById('formNote').hidden = false;
  e.target.querySelectorAll('input, textarea').forEach((f) => (f.value = ''));
});

document.getElementById('year').textContent = new Date().getFullYear();
