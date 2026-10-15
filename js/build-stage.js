/**
 * ETERNAL STUDIO — STAGE BUILD SEQUENCE
 * After the visitor steps through the portal, they build an event stage:
 * ground plan → deck → truss → LED wall → light & sound → showtime.
 * Scrolling drives the build (it also drifts forward on its own). The LED wall plays
 * the real hero video, and the camera finishes by filling the screen with that wall
 * exactly as the hero video covers the viewport, so the hand-off is seamless.
 */

import * as THREE from './vendor/three.module.min.js';

const BRAND = 0xED632E;
const TAU = Math.PI * 2;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const seg = (p, a, b) => clamp01((p - a) / (b - a));
const smooth = (t) => t * t * (3 - 2 * t);
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeOutBack = (t) => {
  const c1 = 1.4;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const lerp = (a, b, t) => a + (b - a) * t;

export const CHAPTERS = [
  { at: 0, title: 'Ground plan', desc: 'Marking out the venue floor.' },
  { at: 0.1, title: 'Stage deck', desc: 'Modular decks locked into place.' },
  { at: 0.26, title: 'Truss & rigging', desc: 'Towers raised, the roof flown in.' },
  { at: 0.46, title: 'LED wall', desc: 'Panel by panel, the canvas goes up.' },
  { at: 0.62, title: 'Light & sound', desc: 'Fixtures hung, line arrays flown.' },
  { at: 0.78, title: 'Showtime', desc: 'Power on. The room comes alive.' }
];

// Stage dimensions in metres
const DECK = { cols: 6, rows: 3, size: 2, h: 1.2 };
const WALL = { w: 12, h: 6.75, cols: 8, rows: 5, z: -2.6, bottom: 1.6 };
const WALL_CENTER_Y = WALL.bottom + WALL.h / 2;
const TRUSS = { x: 7.4, zBack: -2.6, zFront: 1.6, height: 9 };

const AUTO_SPEED = 0.04;    // progress per second while the visitor just watches
const MAX_SPEED = 0.24;     // progress per second, however hard they scroll

/**
 * @returns {{ start: Function, destroy: Function }}
 * Throws if WebGL is unavailable.
 */
export function createBuildStage({ canvas, root, hud, onComplete }) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050505);
  scene.fog = new THREE.FogExp2(0x050505, 0.02);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 220);

  const disposables = [];
  const track = (thing) => {
    disposables.push(thing);
    return thing;
  };

  // ------------------------------------------------------------------ lights
  const hemi = new THREE.HemisphereLight(0x9aa4b5, 0x0a0a0a, 1.1);
  const key = new THREE.DirectionalLight(0xe6ecff, 3.4);
  key.position.set(10, 18, 14);
  const fill = new THREE.DirectionalLight(0xffffff, 1.0);
  fill.position.set(-12, 10, 6);
  const wash = new THREE.PointLight(BRAND, 0, 0, 2);
  wash.position.set(0, 6.5, 4);
  const glow = new THREE.PointLight(0xffd9c4, 0, 0, 2);
  glow.position.set(0, 4, -0.8);
  scene.add(hemi, key, fill, wash, glow);

  // ------------------------------------------------------------------ floor + ground plan
  const floor = new THREE.Mesh(
    track(new THREE.PlaneGeometry(140, 140)),
    track(new THREE.MeshStandardMaterial({ color: 0x0c0c0d, roughness: 0.92, metalness: 0.05 }))
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const grid = new THREE.GridHelper(44, 44, BRAND, 0x3a2219);
  grid.material.transparent = true;
  grid.material.opacity = 0;
  grid.position.y = 0.01;
  track(grid.geometry);
  track(grid.material);
  scene.add(grid);

  const planMaterial = track(new THREE.LineBasicMaterial({ color: BRAND, transparent: true, opacity: 0.95 }));
  function outline(x0, z0, x1, z1) {
    const pts = [
      new THREE.Vector3(x0, 0.02, z0), new THREE.Vector3(x1, 0.02, z0),
      new THREE.Vector3(x1, 0.02, z1), new THREE.Vector3(x0, 0.02, z1),
      new THREE.Vector3(x0, 0.02, z0)
    ];
    const line = new THREE.Line(track(new THREE.BufferGeometry().setFromPoints(pts)), planMaterial);
    line.geometry.setDrawRange(0, 0);
    scene.add(line);
    return line;
  }
  const planLines = [
    outline(-6, -3, 6, 3),
    outline(-TRUSS.x - 0.4, TRUSS.zBack - 0.4, TRUSS.x + 0.4, TRUSS.zFront + 0.4)
  ];

  // ------------------------------------------------------------------ stage deck
  const deckSide = track(new THREE.MeshStandardMaterial({ color: 0x1d1d21, roughness: 0.75, metalness: 0.1 }));
  const deckTop = track(new THREE.MeshStandardMaterial({ color: 0x3a3a40, roughness: 0.55, metalness: 0.15 }));
  const deckGeo = track(new THREE.BoxGeometry(DECK.size - 0.02, DECK.h, DECK.size - 0.02));
  const deckMats = [deckSide, deckSide, deckTop, deckSide, deckSide, deckSide];
  const decks = [];
  for (let r = DECK.rows - 1; r >= 0; r -= 1) {
    for (let c = 0; c < DECK.cols; c += 1) {
      const mesh = new THREE.Mesh(deckGeo, deckMats);
      const target = new THREE.Vector3(-5 + c * DECK.size, DECK.h / 2, -2 + r * DECK.size);
      mesh.position.copy(target);
      mesh.visible = false;
      scene.add(mesh);
      decks.push({ mesh, target, spin: (Math.random() - 0.5) * 0.6 });
    }
  }
  const stripMat = track(new THREE.MeshStandardMaterial({ color: 0x1a1a1a, emissive: BRAND, emissiveIntensity: 0 }));
  const strip = new THREE.Mesh(track(new THREE.BoxGeometry(12, 0.06, 0.06)), stripMat);
  strip.position.set(0, DECK.h, 3.02);
  strip.visible = false;
  scene.add(strip);

  // ------------------------------------------------------------------ truss
  const trussMat = track(new THREE.MeshStandardMaterial({ color: 0xa9a9b0, roughness: 0.38, metalness: 0.55 }));
  const strutGeo = track(new THREE.CylinderGeometry(0.03, 0.03, 1, 6));

  function makeTruss(length) {
    const segments = Math.max(1, Math.round(length / 0.5));
    const step = length / segments;
    const perSeg = 8;
    const mesh = new THREE.InstancedMesh(strutGeo, trussMat, segments * perSeg);
    const half = 0.2;
    const corners = [[-half, -half], [half, -half], [half, half], [-half, half]];
    const up = new THREE.Vector3(0, 1, 0);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const mid = new THREE.Vector3();
    const dir = new THREE.Vector3();
    const scale = new THREE.Vector3();
    let index = 0;
    const place = (a, b, radius) => {
      dir.subVectors(b, a);
      const len = dir.length();
      q.setFromUnitVectors(up, dir.normalize());
      mid.addVectors(a, b).multiplyScalar(0.5);
      scale.set(radius, len, radius);
      m.compose(mid, q, scale);
      mesh.setMatrixAt(index, m);
      index += 1;
    };
    for (let i = 0; i < segments; i += 1) {
      const y0 = i * step;
      const y1 = y0 + step;
      corners.forEach(([x, z]) => place(new THREE.Vector3(x, y0, z), new THREE.Vector3(x, y1, z), 1.4));
      for (let f = 0; f < 4; f += 1) {
        const [x0, z0] = corners[f];
        const [x1, z1] = corners[(f + 1) % 4];
        const flip = (i + f) % 2 === 0;
        place(new THREE.Vector3(x0, flip ? y0 : y1, z0), new THREE.Vector3(x1, flip ? y1 : y0, z1), 0.8);
      }
    }
    mesh.userData.total = segments * perSeg;
    mesh.userData.perSeg = perSeg;
    return mesh;
  }

  const towers = [];
  [[-TRUSS.x, TRUSS.zBack], [TRUSS.x, TRUSS.zBack], [-TRUSS.x, TRUSS.zFront], [TRUSS.x, TRUSS.zFront]].forEach(([x, z], i) => {
    const mesh = makeTruss(TRUSS.height);
    mesh.position.set(x, 0, z);
    mesh.count = 0;
    scene.add(mesh);
    const plate = new THREE.Mesh(track(new THREE.BoxGeometry(0.9, 0.05, 0.9)), trussMat);
    plate.position.set(x, 0.025, z);
    plate.visible = false;
    scene.add(plate);
    towers.push({ mesh, plate, start: i < 2 ? 0.26 : 0.29 });
  });

  function makeSpan(length, axis) {
    const group = new THREE.Group();
    const mesh = makeTruss(length);
    if (axis === 'x') {
      mesh.rotation.z = -Math.PI / 2;
      mesh.position.x = -length / 2;
    } else {
      mesh.rotation.x = Math.PI / 2;
      mesh.position.z = -length / 2;
    }
    group.add(mesh);
    group.visible = false;
    scene.add(group);
    return group;
  }
  const spanLenX = TRUSS.x * 2;
  const spanLenZ = TRUSS.zFront - TRUSS.zBack;
  const spans = [
    { group: makeSpan(spanLenX, 'x'), pos: new THREE.Vector3(0, TRUSS.height, TRUSS.zBack), start: 0.34 },
    { group: makeSpan(spanLenX, 'x'), pos: new THREE.Vector3(0, TRUSS.height, TRUSS.zFront), start: 0.37 },
    { group: makeSpan(spanLenZ, 'z'), pos: new THREE.Vector3(-TRUSS.x, TRUSS.height, (TRUSS.zBack + TRUSS.zFront) / 2), start: 0.405 },
    { group: makeSpan(spanLenZ, 'z'), pos: new THREE.Vector3(TRUSS.x, TRUSS.height, (TRUSS.zBack + TRUSS.zFront) / 2), start: 0.42 }
  ];

  // ------------------------------------------------------------------ LED wall
  const placeholder = track(new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1));
  placeholder.needsUpdate = true;

  const logoCanvas = document.createElement('canvas');
  logoCanvas.width = 1920;
  logoCanvas.height = 1080;
  const logoTexture = track(new THREE.CanvasTexture(logoCanvas));
  logoTexture.colorSpace = THREE.SRGBColorSpace;
  drawIdent(logoCanvas, null);
  const logoImage = new Image();
  logoImage.onload = () => {
    drawIdent(logoCanvas, logoImage);
    logoTexture.needsUpdate = true;
  };
  logoImage.src = 'assets/images/logo/eternal-events-dark.png';

  const tileVertex = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`;
  const tileFragment = `
    uniform sampler2D tLogo;
    uniform sampler2D tVideo;
    uniform float uMix;
    uniform float uPower;
    uniform float uGain;
    varying vec2 vUv;
    void main() {
      vec3 logo = texture2D(tLogo, vUv).rgb;
      vec3 vid = texture2D(tVideo, vUv).rgb;
      vec3 c = mix(logo, vid, uMix) * uGain;
      gl_FragColor = vec4(mix(vec3(0.006), c, uPower), 1.0);
      #include <colorspace_fragment>
    }`;

  const tileW = WALL.w / WALL.cols;
  const tileH = WALL.h / WALL.rows;
  const frameGeo = track(new THREE.BoxGeometry(tileW * 0.985, tileH * 0.985, 0.09));
  const frameMat = track(new THREE.MeshStandardMaterial({ color: 0x101012, roughness: 0.5, metalness: 0.4 }));
  const tiles = [];
  for (let r = 0; r < WALL.rows; r += 1) {
    for (let c = 0; c < WALL.cols; c += 1) {
      const geo = track(new THREE.PlaneGeometry(tileW, tileH));
      const uv = geo.attributes.uv;
      for (let i = 0; i < uv.count; i += 1) {
        uv.setXY(i, (c + uv.getX(i)) / WALL.cols, (WALL.rows - 1 - r + uv.getY(i)) / WALL.rows);
      }
      const material = track(new THREE.ShaderMaterial({
        uniforms: {
          tLogo: { value: logoTexture },
          tVideo: { value: placeholder },
          uMix: { value: 0 },
          uPower: { value: 0 },
          uGain: { value: 1 }
        },
        vertexShader: tileVertex,
        fragmentShader: tileFragment,
        toneMapped: false
      }));
      const group = new THREE.Group();
      const frame = new THREE.Mesh(frameGeo, frameMat);
      frame.position.z = -0.05;
      const face = new THREE.Mesh(geo, material);
      face.position.z = 0.001;
      group.add(frame, face);
      group.visible = false;
      scene.add(group);

      const target = new THREE.Vector3(
        -WALL.w / 2 + tileW * (c + 0.5),
        WALL.bottom + WALL.h - tileH * (r + 0.5),
        WALL.z
      );
      const nx = (c + 0.5) / WALL.cols - 0.5;
      const ny = (r + 0.5) / WALL.rows - 0.5;
      tiles.push({
        group,
        face,
        material,
        target,
        index: r * WALL.cols + c,
        gapX: (c - (WALL.cols - 1) / 2) * 0.03,
        gapY: ((WALL.rows - 1) / 2 - r) * 0.03,
        powerDelay: Math.hypot(nx, ny * 0.8) * 0.06
      });
    }
  }

  // ------------------------------------------------------------------ fixtures + beams
  const fixtureMat = track(new THREE.MeshStandardMaterial({ color: 0x1b1b1d, roughness: 0.45, metalness: 0.5 }));
  const lensMat = track(new THREE.MeshBasicMaterial({ color: 0x222222 }));
  const clampGeo = track(new THREE.BoxGeometry(0.34, 0.16, 0.34));
  const headGeo = track(new THREE.CylinderGeometry(0.17, 0.22, 0.42, 14));
  const lensGeo = track(new THREE.CircleGeometry(0.15, 18));

  const beamGeo = track(new THREE.ConeGeometry(1.25, 10, 28, 1, true));
  beamGeo.translate(0, -5, 0);
  const beamVertex = `
    varying float vT;
    varying vec3 vN;
    varying vec3 vView;
    void main() {
      vT = -position.y / 10.0;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vView = normalize(-mv.xyz);
      vN = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * mv;
    }`;
  const beamFragment = `
    uniform vec3 uColor;
    uniform float uIntensity;
    varying float vT;
    varying vec3 vN;
    varying vec3 vView;
    void main() {
      float edge = pow(abs(dot(vN, vView)), 2.0);
      float a = smoothstep(0.0, 0.08, vT) * (1.0 - vT) * edge * uIntensity;
      gl_FragColor = vec4(uColor, a);
      #include <colorspace_fragment>
    }`;
  const beamUniforms = { uColor: { value: new THREE.Color(0xffe2cc) }, uIntensity: { value: 0 } };
  const beamMat = track(new THREE.ShaderMaterial({
    uniforms: beamUniforms,
    vertexShader: beamVertex,
    fragmentShader: beamFragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    toneMapped: false
  }));

  const fixtures = [];
  const fixtureCount = 8;
  for (let i = 0; i < fixtureCount; i += 1) {
    const x = -6.3 + (12.6 * i) / (fixtureCount - 1);
    const rig = new THREE.Group();
    const clampMesh = new THREE.Mesh(clampGeo, fixtureMat);
    const head = new THREE.Group();
    head.position.y = -0.38;
    const body = new THREE.Mesh(headGeo, fixtureMat);
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.rotation.x = Math.PI / 2;
    lens.position.y = -0.215;
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = -0.2;
    head.add(body, lens, beam);
    rig.add(clampMesh, head);
    rig.visible = false;
    scene.add(rig);
    fixtures.push({
      rig,
      head,
      target: new THREE.Vector3(x, TRUSS.height - 0.32, TRUSS.zFront),
      start: 0.62 + i * 0.008,
      phase: i * 0.9
    });
  }

  // ------------------------------------------------------------------ sound
  const speakerMat = track(new THREE.MeshStandardMaterial({ color: 0x111113, roughness: 0.7, metalness: 0.2 }));
  const grilleMat = track(new THREE.MeshStandardMaterial({ color: 0x1f1f22, roughness: 0.9, metalness: 0.1 }));
  const boxMats = [speakerMat, speakerMat, speakerMat, speakerMat, grilleMat, speakerMat];
  const arrayGeo = track(new THREE.BoxGeometry(1.1, 0.32, 0.65));
  const subGeo = track(new THREE.BoxGeometry(1.15, 0.62, 0.9));
  const speakers = [];
  [-1, 1].forEach((side) => {
    for (let k = 0; k < 8; k += 1) {
      const mesh = new THREE.Mesh(arrayGeo, boxMats);
      const target = new THREE.Vector3(side * 8.7, 8.1 - k * 0.335, TRUSS.zFront + k * 0.03);
      mesh.rotation.x = k * 0.035;
      mesh.visible = false;
      scene.add(mesh);
      speakers.push({ mesh, target, from: new THREE.Vector3(target.x, target.y + 5, target.z), start: 0.66 + k * 0.007 + (side > 0 ? 0.004 : 0), dur: 0.035 });
    }
    for (let k = 0; k < 3; k += 1) {
      const mesh = new THREE.Mesh(subGeo, boxMats);
      const target = new THREE.Vector3(side * (3.6 + k * 1.2), 0.31, 3.75);
      mesh.visible = false;
      scene.add(mesh);
      speakers.push({ mesh, target, from: new THREE.Vector3(side * 20, 0.31, 3.75), start: 0.71 + k * 0.01, dur: 0.05 });
    }
  });

  // ------------------------------------------------------------------ crowd + atmosphere
  const narrow = window.innerWidth < 768;
  const crowdCount = narrow ? 260 : 520;
  const crowdGeo = track(new THREE.CapsuleGeometry(0.22, 0.95, 4, 8));
  const crowdMat = track(new THREE.MeshStandardMaterial({ color: 0x070707, roughness: 1, metalness: 0 }));
  const crowd = new THREE.InstancedMesh(crowdGeo, crowdMat, crowdCount);
  const crowdData = [];
  for (let i = 0; i < crowdCount; i += 1) {
    const z = 4.8 + Math.random() * 13;
    const spread = 7 + (z - 4.8) * 0.45;
    crowdData.push({
      x: (Math.random() * 2 - 1) * spread,
      z,
      s: 0.88 + Math.random() * 0.22,
      delay: ((z - 4.8) / 13) * 0.6 + Math.random() * 0.4,
      bob: Math.random() * TAU
    });
  }
  crowd.visible = false;
  scene.add(crowd);

  const phoneCount = narrow ? 40 : 80;
  const phonePositions = new Float32Array(phoneCount * 3);
  for (let i = 0; i < phoneCount; i += 1) {
    const d = crowdData[Math.floor(Math.random() * crowdCount)];
    phonePositions.set([d.x + 0.15, 1.95 + Math.random() * 0.3, d.z], i * 3);
  }
  const phoneGeo = track(new THREE.BufferGeometry());
  phoneGeo.setAttribute('position', new THREE.BufferAttribute(phonePositions, 3));
  const phoneMat = track(new THREE.PointsMaterial({ color: 0xfff1e6, size: 0.07, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(new THREE.Points(phoneGeo, phoneMat));

  // Brand dust drifting through the beams (same tones as the portal particles)
  const dustCount = narrow ? 260 : 520;
  const dustPositions = new Float32Array(dustCount * 3);
  const dustColors = new Float32Array(dustCount * 3);
  const tones = [new THREE.Color(0xffffff), new THREE.Color(0xffd9c4), new THREE.Color(BRAND)];
  for (let i = 0; i < dustCount; i += 1) {
    dustPositions.set([(Math.random() * 2 - 1) * 9, 0.5 + Math.random() * 9, -2.4 + Math.random() * 7], i * 3);
    const tone = tones[i % 3];
    dustColors.set([tone.r, tone.g, tone.b], i * 3);
  }
  const dustGeo = track(new THREE.BufferGeometry());
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  dustGeo.setAttribute('color', new THREE.BufferAttribute(dustColors, 3));
  const dustMat = track(new THREE.PointsMaterial({ size: 0.055, vertexColors: true, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  const dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);

  const hazeTexture = track(makeHazeTexture());
  const hazeSprites = [];
  for (let i = 0; i < 9; i += 1) {
    const mat = track(new THREE.SpriteMaterial({
      map: hazeTexture,
      color: i % 3 === 0 ? BRAND : 0xffd9c4,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    const sprite = new THREE.Sprite(mat);
    sprite.position.set(-8 + (16 * i) / 8, 3 + Math.random() * 3.5, -1 + Math.random() * 4);
    sprite.scale.setScalar(10 + Math.random() * 6);
    scene.add(sprite);
    hazeSprites.push({ sprite, mat, peak: 0.05 + Math.random() * 0.05, phase: Math.random() * TAU });
  }

  // ------------------------------------------------------------------ camera path
  const look = new THREE.Vector3();
  const pos = new THREE.Vector3();
  let keyframes = [];
  let posCurve = null;
  let lookCurve = null;

  function buildPath(aspect) {
    const portrait = aspect < 1;
    camera.fov = portrait ? 42 + (1 - aspect) * 37 : 42;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();

    // Final frame: the wall covers the viewport exactly like the hero video (object-fit: cover)
    const visibleH = Math.min(WALL.h, WALL.w / aspect);
    const fillDistance = visibleH / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    const wallCenter = new THREE.Vector3(0, WALL_CENTER_Y, WALL.z);
    const widen = portrait ? 1 + (1 - aspect) * 0.6 : 1;

    const raw = [
      { p: 0, pos: [0, 30, 24], look: [0, 0, 0] },
      { p: 0.1, pos: [14, 14, 20], look: [0, 0.5, -1] },
      { p: 0.26, pos: [18, 8, 15], look: [0, 2, -1.5] },
      { p: 0.46, pos: [-17, 9, 17], look: [0, 5, -2] },
      { p: 0.62, pos: [-5, 4.5, 19], look: [0, 5, -2.5] },
      { p: 0.78, pos: [10, 3, 17], look: [0, 5.2, -2.5] },
      { p: 0.88, pos: [0, 3.4, 24], look: [0, WALL_CENTER_Y, WALL.z] }
    ];
    keyframes = raw.map((k) => {
      const l = new THREE.Vector3(...k.look);
      const p = new THREE.Vector3(...k.pos).sub(l).multiplyScalar(widen).add(l);
      return { p: k.p, pos: p, look: l };
    });
    keyframes.push({ p: 1, pos: new THREE.Vector3(0, WALL_CENTER_Y, WALL.z + fillDistance), look: wallCenter });

    posCurve = new THREE.CatmullRomCurve3(keyframes.map((k) => k.pos), false, 'centripetal');
    lookCurve = new THREE.CatmullRomCurve3(keyframes.map((k) => k.look), false, 'centripetal');
  }

  function cameraAt(p, time) {
    const n = keyframes.length;
    let i = 0;
    while (i < n - 2 && p > keyframes[i + 1].p) i += 1;
    const local = seg(p, keyframes[i].p, keyframes[i + 1].p);
    const u = (i + (local * 0.35 + smooth(local) * 0.65)) / (n - 1);
    posCurve.getPoint(u, pos);
    lookCurve.getPoint(u, look);

    // Subtle hand-held drift that settles before the hand-off
    const drift = 1 - seg(p, 0.86, 0.96);
    pos.x += Math.sin(time * 0.37) * 0.18 * drift;
    pos.y += Math.sin(time * 0.53) * 0.12 * drift;
    camera.position.copy(pos);
    camera.lookAt(look);
  }

  // ------------------------------------------------------------------ resize
  // Adaptive resolution: lowered at runtime if the device can't keep the frame rate up
  let qualityScale = 1;
  function applyPixelRatio() {
    const w = window.innerWidth;
    const base = Math.min(window.devicePixelRatio || 1, w < 768 ? 1.5 : 1.75);
    renderer.setPixelRatio(Math.max(0.6, base * qualityScale));
  }

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    applyPixelRatio();
    renderer.setSize(w, h, false);
    buildPath(w / h);
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  // ------------------------------------------------------------------ video
  const video = document.querySelector('.hero-video');
  let videoTexture = null;
  function ensureVideo() {
    if (!video || !video.isConnected) return;
    if (video.paused) {
      const attempt = video.play();
      if (attempt) attempt.catch(() => {});
    }
    if (!videoTexture && video.readyState >= 2) {
      videoTexture = track(new THREE.VideoTexture(video));
      videoTexture.colorSpace = THREE.SRGBColorSpace;
      tiles.forEach((t) => { t.material.uniforms.tVideo.value = videoTexture; });
    }
  }

  // ------------------------------------------------------------------ update
  const tmpMatrix = new THREE.Matrix4();
  const tmpQuat = new THREE.Quaternion();
  const tmpPos = new THREE.Vector3();
  const tmpScale = new THREE.Vector3();
  const identityQuat = new THREE.Quaternion();
  const flatQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));

  function update(p, time) {
    // 1. Ground plan
    const gridIn = seg(p, 0, 0.06) * (1 - seg(p, 0.78, 0.86));
    grid.material.opacity = 0.32 * gridIn;
    planMaterial.opacity = 0.95 * (1 - seg(p, 0.78, 0.86));
    planLines.forEach((line, i) => line.geometry.setDrawRange(0, Math.floor(seg(p, 0.015 + i * 0.03, 0.06 + i * 0.03) * 5)));

    // 2. Deck modules drop in and lock
    decks.forEach((d, i) => {
      const start = 0.1 + i * (0.13 / decks.length);
      const t = seg(p, start, start + 0.045);
      d.mesh.visible = t > 0;
      if (!d.mesh.visible) return;
      const e = easeOutBack(t);
      d.mesh.position.set(d.target.x, d.target.y + (1 - e) * 6, d.target.z);
      d.mesh.rotation.set(0, (1 - easeOutCubic(t)) * d.spin, (1 - easeOutCubic(t)) * d.spin * 0.4);
    });
    strip.visible = p > 0.24;

    // 3. Towers build segment by segment, then the roof is flown in
    towers.forEach((tw) => {
      const t = seg(p, tw.start, tw.start + 0.07);
      const { total, perSeg } = tw.mesh.userData;
      tw.mesh.count = Math.floor((t * total) / perSeg) * perSeg;
      tw.plate.visible = t > 0;
    });
    spans.forEach((sp) => {
      const t = seg(p, sp.start, sp.start + 0.06);
      sp.group.visible = t > 0;
      if (!sp.group.visible) return;
      const e = easeOutCubic(t);
      sp.group.position.set(sp.pos.x, sp.pos.y + (1 - e) * 9, sp.pos.z);
      sp.group.rotation.z = Math.sin(t * Math.PI * 3) * (1 - t) * 0.05;
    });

    // 4. LED panels hoisted from the deck, top row first
    const power = seg(p, 0.78, 0.86);
    tiles.forEach((tile) => {
      const start = 0.46 + tile.index * (0.13 / tiles.length);
      const t = seg(p, start, start + 0.035);
      tile.group.visible = t > 0;
      if (!tile.group.visible) return;
      const e = easeOutCubic(t);
      const gap = 1 - power;
      const tx = tile.target.x + tile.gapX * gap;
      const ty = tile.target.y + tile.gapY * gap;
      tile.group.position.set(
        lerp(tx, tx * 0.9, 1 - e),
        lerp(DECK.h + 0.2, ty, e) + Math.sin(e * Math.PI) * 0.9,
        lerp(WALL.z + 2.2, tile.target.z, e)
      );
      tile.group.quaternion.slerpQuaternions(flatQuat, identityQuat, e);
      // Once powered, faces overlap a hair so no cabinet seams survive into the hand-off
      tile.face.scale.set(1 + 0.012 * power, 1 + 0.012 * power, 1);

      // Power on from the centre outwards, with a little flicker
      let pw = seg(p, 0.79 + tile.powerDelay, 0.81 + tile.powerDelay);
      if (pw > 0 && pw < 1) pw *= 0.55 + Math.random() * 0.45;
      const u = tile.material.uniforms;
      u.uPower.value = pw;
      u.uMix.value = videoTexture ? seg(p, 0.85, 0.9) : 0;
      u.uGain.value = lerp(1, 0.8, seg(p, 0.9, 1));
    });

    // 5. Fixtures clamp onto the front truss; line arrays and subs fly in
    const live = seg(p, 0.79, 0.86);
    const beamsOut = seg(p, 0.9, 0.97);
    fixtures.forEach((f, i) => {
      const t = seg(p, f.start, f.start + 0.05);
      f.rig.visible = t > 0;
      if (!f.rig.visible) return;
      const e = easeOutBack(t);
      f.rig.position.set(f.target.x, f.target.y + (1 - e) * 6, f.target.z);
      f.head.rotation.z = Math.sin(time * 0.6 + f.phase) * 0.35 * live;
      f.head.rotation.x = (0.25 + Math.sin(time * 0.45 + i) * 0.15) * live;
    });
    beamUniforms.uIntensity.value = live * 0.55 * (1 - beamsOut);
    lensMat.color.setScalar(0.13 + live * 0.87);

    speakers.forEach((s) => {
      const t = seg(p, s.start, s.start + s.dur);
      s.mesh.visible = t > 0;
      if (!s.mesh.visible) return;
      s.mesh.position.lerpVectors(s.from, s.target, easeOutCubic(t));
    });

    // 6. Showtime: work lights down, show lights up, crowd in, then push into the wall
    hemi.intensity = lerp(1.1, 0.12, live);
    key.intensity = lerp(3.4, 0.3, live);
    fill.intensity = lerp(1.0, 0.1, live);
    wash.intensity = live * 140;
    glow.intensity = live * 60;
    stripMat.emissiveIntensity = live * 2.2;

    const crowdIn = seg(p, 0.82, 0.92);
    crowd.visible = crowdIn > 0;
    if (crowd.visible) {
      crowdData.forEach((d, i) => {
        const t = clamp01(crowdIn * 1.6 - d.delay * 0.6);
        const s = d.s * Math.max(0.001, easeOutCubic(t));
        const bob = Math.sin(time * 2.2 + d.bob) * 0.04 * live;
        tmpPos.set(d.x, 0.7 * s + bob, d.z);
        tmpScale.set(d.s, s, d.s);
        tmpMatrix.compose(tmpPos, tmpQuat.identity(), tmpScale);
        crowd.setMatrixAt(i, tmpMatrix);
      });
      crowd.instanceMatrix.needsUpdate = true;
    }

    const atmosphere = live * (1 - beamsOut);
    phoneMat.opacity = seg(p, 0.86, 0.9) * (1 - beamsOut) * (0.7 + Math.sin(time * 3) * 0.3);
    dustMat.opacity = atmosphere * 0.85;
    const dp = dustGeo.attributes.position;
    for (let i = 0; i < dp.count; i += 1) {
      let y = dp.getY(i) + 0.003 + Math.sin(time + i) * 0.001;
      if (y > 9.5) y = 0.5;
      dp.setY(i, y);
    }
    dp.needsUpdate = true;
    hazeSprites.forEach((h) => {
      h.mat.opacity = h.peak * atmosphere * (0.8 + Math.sin(time * 0.4 + h.phase) * 0.2);
    });

    if (p > 0.77) ensureVideo();
    cameraAt(p, time);
  }

  // ------------------------------------------------------------------ input (virtual scroll)
  let target = 0;
  let progress = 0;
  let lastInput = 0;
  let touchY = null;
  let rafId = null;
  let running = false;
  let finished = false;
  let startTime = 0;
  let shownChapter = -1;

  const hint = hud.querySelector('.build-hint');
  const chapterNum = hud.querySelector('.build-chapter-num');
  const chapterTitle = hud.querySelector('.build-chapter-title');
  const chapterDesc = hud.querySelector('.build-chapter-desc');
  const chapterBox = hud.querySelector('.build-chapter');
  const fillBar = hud.querySelector('.build-progress-fill');
  const vignette = root.querySelector('.build-vignette');

  function nudge(amount) {
    // Scrolling can only run a little ahead of the build, so a hard fling doesn't skip chapters
    target = clamp01(Math.max(progress - 0.08, Math.min(progress + 0.1, target + amount)));
    lastInput = performance.now();
    if (hint) hint.classList.add('is-hidden');
  }

  function onWheel(e) {
    e.preventDefault();
    const unit = e.deltaMode === 1 ? 0.012 : 0.00032;
    nudge(e.deltaY * unit);
  }
  function onTouchStart(e) {
    touchY = e.touches[0].clientY;
  }
  function onTouchMove(e) {
    if (touchY === null) return;
    e.preventDefault();
    const y = e.touches[0].clientY;
    nudge(((touchY - y) / window.innerHeight) * 0.22);
    touchY = y;
  }
  function onTouchEnd() {
    touchY = null;
  }
  function onKey(e) {
    if (['ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) {
      e.preventDefault();
      nudge(0.06);
    } else if (['ArrowUp', 'PageUp'].includes(e.key)) {
      e.preventDefault();
      nudge(-0.06);
    }
  }

  function updateHud(p, time) {
    let index = 0;
    CHAPTERS.forEach((c, i) => {
      if (p >= c.at) index = i;
    });
    if (index !== shownChapter && chapterBox) {
      shownChapter = index;
      chapterNum.textContent = `${String(index + 1).padStart(2, '0')} / ${String(CHAPTERS.length).padStart(2, '0')}`;
      chapterTitle.textContent = CHAPTERS[index].title;
      chapterDesc.textContent = CHAPTERS[index].desc;
      chapterBox.classList.remove('is-changing');
      void chapterBox.offsetWidth;
      chapterBox.classList.add('is-changing');
    }
    if (fillBar) fillBar.style.transform = `scaleX(${p.toFixed(4)})`;
    if (vignette) vignette.style.opacity = seg(p, 0.9, 1).toFixed(3);
    hud.style.opacity = Math.min(seg(time, 0.9, 1.9), 1 - seg(p, 0.9, 0.96)).toFixed(3);
  }

  let last = 0;
  let sampleTime = 0;
  let sampleFrames = 0;
  function frame(now) {
    const rawDt = (now - last) / 1000;
    const dt = Math.min(0.05, rawDt);
    last = now;

    sampleTime += rawDt;
    sampleFrames += 1;
    if (sampleTime > 1) {
      const avg = sampleTime / sampleFrames;
      if (avg > 1 / 40 && qualityScale > 0.5) {
        qualityScale *= 0.82;
        applyPixelRatio();
        renderer.setSize(window.innerWidth, window.innerHeight, false);
      }
      sampleTime = 0;
      sampleFrames = 0;
    }
    const time = (now - startTime) / 1000;

    // Opening beat plays by itself; afterwards drift forward whenever the visitor pauses
    if (time < 3.2) target = Math.max(target, seg(time, 0.3, 3.2) * 0.1);
    else if (now - lastInput > 1400) target = Math.min(1, target + AUTO_SPEED * dt);

    const step = (target - progress) * (1 - Math.exp(-dt * 2.6));
    progress = clamp01(progress + Math.max(-MAX_SPEED * dt, Math.min(MAX_SPEED * dt, step)));

    update(progress, time);
    updateHud(progress, time);
    renderer.render(scene, camera);

    if (!finished && progress >= 0.998 && target >= 1) {
      finished = true;
      onComplete();
    }
    if (running) rafId = requestAnimationFrame(frame);
  }

  // Compile shaders and upload geometry up front so the first frame doesn't stutter
  update(0, 0);
  renderer.compile(scene, camera);

  return {
    start() {
      if (running) return;
      running = true;
      startTime = performance.now();
      last = startTime;
      lastInput = startTime;
      window.addEventListener('wheel', onWheel, { passive: false });
      root.addEventListener('touchstart', onTouchStart, { passive: true });
      root.addEventListener('touchmove', onTouchMove, { passive: false });
      root.addEventListener('touchend', onTouchEnd, { passive: true });
      document.addEventListener('keydown', onKey);
      rafId = requestAnimationFrame(frame);
    },
    destroy() {
      running = false;
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('wheel', onWheel);
      root.removeEventListener('touchstart', onTouchStart);
      root.removeEventListener('touchmove', onTouchMove);
      root.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('keydown', onKey);
      crowd.dispose();
      towers.forEach((t) => t.mesh.dispose());
      spans.forEach((s) => s.group.children[0].dispose());
      disposables.forEach((d) => d.dispose && d.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
    }
  };
}

/** LED ident shown when the wall first powers on: brand logo on a test-pattern grid. */
function drawIdent(canvas, logo) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  ctx.fillStyle = '#080808';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(237, 99, 46, 0.18)';
  ctx.lineWidth = 2;
  for (let x = 0; x <= w; x += w / 16) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y += h / 9) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  const glow = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, h * 0.7);
  glow.addColorStop(0, 'rgba(237, 99, 46, 0.35)');
  glow.addColorStop(1, 'rgba(237, 99, 46, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  if (logo) {
    const lw = w * 0.42;
    const lh = (logo.height / logo.width) * lw;
    ctx.drawImage(logo, (w - lw) / 2, (h - lh) / 2, lw, lh);
  }
}

function makeHazeTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
  g.addColorStop(0.45, 'rgba(255, 255, 255, 0.18)');
  g.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
