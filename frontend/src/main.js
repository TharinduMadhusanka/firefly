/**
 * Firefly Sync — Fully Static Edition
 * Kuramoto model runs entirely in the browser.
 * No backend, no WebSocket — deploy anywhere.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ─────────────────────────────────────────────
// Kuramoto Simulation (JS port of Python backend)
// ─────────────────────────────────────────────
const SPACE = 10.0;
const SPEED = 0.04;
const DT = 0.05;

class FireflySimulation {
  constructor({ n = 200, K = 1.5, radius = 0.35, freqSpread = 0.3 } = {}) {
    this.n = n;
    this.K = K;
    this.radius = radius * SPACE;
    this.freqSpread = freqSpread;
    this.t = 0;
    this.paused = false;
    this._init();
  }

  _init() {
    const n = this.n;
    this.px = new Float64Array(n).map(() => (Math.random() - 0.5) * SPACE);
    this.py = new Float64Array(n).map(() => (Math.random() - 0.5) * SPACE);
    this.pz = new Float64Array(n).map(() => (Math.random() - 0.5) * SPACE);
    this.vx = new Float64Array(n);
    this.vy = new Float64Array(n);
    this.vz = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const az = Math.random() * Math.PI * 2;
      const el = (Math.random() - 0.5) * Math.PI;
      this.vx[i] = Math.cos(az) * Math.cos(el) * SPEED;
      this.vy[i] = Math.sin(az) * Math.cos(el) * SPEED;
      this.vz[i] = Math.sin(el) * SPEED;
    }
    this.omega = new Float64Array(n).map(() => this._randn(1.0, this.freqSpread));
    this.phase = new Float64Array(n).map(() => Math.random() * Math.PI * 2);
    this.t = 0;
  }

  _randn(mean, std) {
    const u = 1 - Math.random(), v = Math.random();
    return mean + std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  orderParameter() {
    let re = 0, im = 0;
    for (let i = 0; i < this.n; i++) {
      re += Math.cos(this.phase[i]);
      im += Math.sin(this.phase[i]);
    }
    return Math.sqrt(re * re + im * im) / this.n;
  }

  step() {
    if (this.paused) return;
    const n = this.n;
    const half = SPACE / 2;
    const r2 = this.radius * this.radius;
    const dp = new Float64Array(n);

    for (let i = 0; i < n; i++) {
      let coupling = 0, neighbors = 0;
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const dx = this.px[j] - this.px[i];
        const dy = this.py[j] - this.py[i];
        const dz = this.pz[j] - this.pz[i];
        if (dx * dx + dy * dy + dz * dz < r2) {
          coupling += Math.sin(this.phase[j] - this.phase[i]);
          neighbors++;
        }
      }
      dp[i] = this.omega[i] + (this.K / (neighbors || 1)) * coupling;
    }

    const TWO_PI = Math.PI * 2;
    for (let i = 0; i < n; i++) {
      this.phase[i] = (this.phase[i] + dp[i] * DT) % TWO_PI;
      this.px[i] += this.vx[i];
      this.py[i] += this.vy[i];
      this.pz[i] += this.vz[i];
      if (this.px[i] > half) { this.px[i] = half; this.vx[i] *= -1; }
      if (this.px[i] < -half) { this.px[i] = -half; this.vx[i] *= -1; }
      if (this.py[i] > half) { this.py[i] = half; this.vy[i] *= -1; }
      if (this.py[i] < -half) { this.py[i] = -half; this.vy[i] *= -1; }
      if (this.pz[i] > half) { this.pz[i] = half; this.vz[i] *= -1; }
      if (this.pz[i] < -half) { this.pz[i] = -half; this.vz[i] *= -1; }
    }
    this.t += DT;
  }

  intensity(i) {
    const c = Math.cos(this.phase[i]);
    return c > 0.6 ? c : 0;
  }

  reset(params = {}) {
    this.n = params.n ?? this.n;
    this.K = params.K ?? this.K;
    this.freqSpread = params.freqSpread ?? this.freqSpread;
    this.radius = (params.radius ?? (this.radius / SPACE)) * SPACE;
    this._init();
  }
}

// ─────────────────────────────────────────────
// Three.js Scene
// ─────────────────────────────────────────────
const container = document.getElementById('canvas-container');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020905);
scene.fog = new THREE.FogExp2(0x020905, 0.038);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 4, 18);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 4;
controls.maxDistance = 40;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.4;

// Stars
(() => {
  const pos = new Float32Array(1800 * 3).map(() => (Math.random() - 0.5) * 160);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(geo,
    new THREE.PointsMaterial({ color: 0x8fbfa0, size: 0.08, transparent: true, opacity: 0.5 })));
})();

scene.add(new THREE.AmbientLight(0x061208, 2));
const dirLight = new THREE.DirectionalLight(0x40ff60, 0.4);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(60, 60),
  new THREE.MeshStandardMaterial({ color: 0x020a04, roughness: 1 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -6;
scene.add(ground);

// ─────────────────────────────────────────────
// Firefly Points — custom shader
// ─────────────────────────────────────────────
const MAX_N = 500;
const posArr = new Float32Array(MAX_N * 3);
const intensityArr = new Float32Array(MAX_N);
const phaseArr = new Float32Array(MAX_N);

const ffGeo = new THREE.BufferGeometry();
const posBuf = new THREE.BufferAttribute(posArr, 3);
const intBuf = new THREE.BufferAttribute(intensityArr, 1);
ffGeo.setAttribute('position', posBuf);
ffGeo.setAttribute('intensity', intBuf);
ffGeo.setAttribute('phase', new THREE.BufferAttribute(phaseArr, 1));
posBuf.setUsage(THREE.DynamicDrawUsage);
intBuf.setUsage(THREE.DynamicDrawUsage);

const fireflyMat = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uPixelRatio: { value: renderer.getPixelRatio() },
  },
  vertexShader: `
    attribute float intensity;
    uniform float uPixelRatio;
    varying float vIntensity;
    void main() {
      vIntensity = intensity;
      vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
      float flash = intensity * intensity;
      gl_PointSize = (2.5 + flash * 12.0) * uPixelRatio * (200.0 / -mvPos.z);
      gl_Position  = projectionMatrix * mvPos;
    }
  `,
  fragmentShader: `
    varying float vIntensity;
    void main() {
      vec2  uv = gl_PointCoord - 0.5;
      float d  = length(uv);
      if (d > 0.5) discard;
      float core = 1.0 - smoothstep(0.0, 0.10, d);
      float halo = pow(1.0 - smoothstep(0.0, 0.38, d), 4.5);
      vec3 col   = mix(vec3(0.1, 0.55, 0.15), vec3(0.85, 1.0, 0.3), vIntensity);
      float alpha = (core * 1.0 + halo * 0.2) * (0.12 + vIntensity * 0.88);
      gl_FragColor = vec4(col, alpha);
    }
  `,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});

scene.add(new THREE.Points(ffGeo, fireflyMat));

// ─────────────────────────────────────────────
// Simulation
// ─────────────────────────────────────────────
let sim = new FireflySimulation();
ffGeo.setDrawRange(0, sim.n);

function syncBuffers() {
  const n = sim.n;
  ffGeo.setDrawRange(0, n);
  for (let i = 0; i < n; i++) {
    posArr[i * 3] = sim.px[i];
    posArr[i * 3 + 1] = sim.py[i];
    posArr[i * 3 + 2] = sim.pz[i];
    intensityArr[i] = sim.intensity(i);
  }
  posBuf.needsUpdate = true;
  intBuf.needsUpdate = true;
}

// ─────────────────────────────────────────────
// Chart
// ─────────────────────────────────────────────
const chartCanvas = document.getElementById('r-chart');
const chartCtx = chartCanvas.getContext('2d');
const rHistory = [];

function drawChart(r) {
  rHistory.push(r);
  if (rHistory.length > 200) rHistory.shift();
  const w = chartCanvas.offsetWidth, h = chartCanvas.offsetHeight;
  chartCanvas.width = w; chartCanvas.height = h;
  chartCtx.clearRect(0, 0, w, h);
  chartCtx.strokeStyle = 'rgba(120,220,100,0.08)';
  chartCtx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = h - (i / 4) * h;
    chartCtx.beginPath(); chartCtx.moveTo(0, y); chartCtx.lineTo(w, y); chartCtx.stroke();
  }
  if (rHistory.length < 2) return;
  chartCtx.beginPath();
  chartCtx.strokeStyle = '#7dff6b';
  chartCtx.lineWidth = 1.5;
  chartCtx.shadowColor = '#7dff6b';
  chartCtx.shadowBlur = 6;
  rHistory.forEach((v, i) => {
    const x = (i / (rHistory.length - 1)) * w, y = h - v * h;
    i === 0 ? chartCtx.moveTo(x, y) : chartCtx.lineTo(x, y);
  });
  chartCtx.stroke();
  chartCtx.lineTo(w, h); chartCtx.lineTo(0, h); chartCtx.closePath();
  chartCtx.fillStyle = 'rgba(100,255,80,0.06)'; chartCtx.fill();
}

// ─────────────────────────────────────────────
// Arc gauge
// ─────────────────────────────────────────────
const arcFill = document.getElementById('arc-fill');
const arcLen = Math.PI * 40;
arcFill.setAttribute('stroke-dasharray', `0 ${arcLen}`);

function updateArc(r) {
  arcFill.setAttribute('stroke-dasharray', `${r * arcLen} ${arcLen}`);
  document.getElementById('r-value').textContent = r.toFixed(2);
  const g = Math.floor(180 + r * 75), rb = Math.floor(80 + r * 120);
  arcFill.setAttribute('stroke', `rgb(${rb},${g},50)`);
}

// ─────────────────────────────────────────────
// Status — static "local" since no WS needed
// ─────────────────────────────────────────────
document.getElementById('conn-dot').className = 'dot connected';
document.getElementById('conn-label').textContent = 'local';

// ─────────────────────────────────────────────
// UI Controls
// ─────────────────────────────────────────────
function bindSlider(id, lblId, onChange) {
  const sl = document.getElementById(id);
  const lb = document.getElementById(lblId);
  sl.addEventListener('input', () => {
    lb.textContent = parseFloat(sl.value).toFixed(2);
    onChange(parseFloat(sl.value));
  });
}

bindSlider('sl-K', 'lbl-K', v => { sim.K = v; });
bindSlider('sl-radius', 'lbl-radius', v => { sim.radius = v * SPACE; });
bindSlider('sl-freq', 'lbl-freq', v => {
  sim.freqSpread = v;
  sim.omega = new Float64Array(sim.n).map(() => sim._randn(1.0, v));
});

const slN = document.getElementById('sl-n');
slN.addEventListener('input', () => { document.getElementById('lbl-n').textContent = slN.value; });

let paused = false;
document.getElementById('btn-pause').addEventListener('click', e => {
  paused = sim.paused = !paused;
  e.target.textContent = paused ? 'Resume' : 'Pause';
  e.target.classList.toggle('active', paused);
});

document.getElementById('btn-reset').addEventListener('click', () => {
  sim.reset({
    n: parseInt(slN.value),
    K: parseFloat(document.getElementById('sl-K').value),
    radius: parseFloat(document.getElementById('sl-radius').value),
    freqSpread: parseFloat(document.getElementById('sl-freq').value),
  });
  ffGeo.setDrawRange(0, sim.n);
  rHistory.length = 0;
});

const rotBtn = document.getElementById('btn-rotate');
rotBtn.classList.add('active');
rotBtn.addEventListener('click', () => {
  controls.autoRotate = !controls.autoRotate;
  rotBtn.classList.toggle('active', controls.autoRotate);
  rotBtn.textContent = controls.autoRotate ? 'Auto-rotate' : 'Rotate off';
});

document.getElementById('toggle-panel').addEventListener('click', () => {
  const panel = document.getElementById('panel');
  const btn = document.getElementById('toggle-panel');
  panel.classList.toggle('hidden');
  const hidden = panel.classList.contains('hidden');
  btn.style.right = hidden ? '0' : '290px';
  btn.style.borderRight = hidden ? '1px solid var(--border)' : 'none';
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  fireflyMat.uniforms.uPixelRatio.value = renderer.getPixelRatio();
});

// ─────────────────────────────────────────────
// Animation Loop
// ─────────────────────────────────────────────
let lastFpsTime = performance.now();
let frameCount = 0;
let lastSimTime = 0;
const SIM_HZ = 1000 / 30;

function animate(now) {
  requestAnimationFrame(animate);

  frameCount++;
  if (now - lastFpsTime >= 1000) {
    document.getElementById('stat-fps').textContent = frameCount;
    frameCount = 0; lastFpsTime = now;
  }

  if (now - lastSimTime >= SIM_HZ) {
    sim.step();
    lastSimTime = now;
    const r = sim.orderParameter();
    syncBuffers();
    updateArc(r);
    drawChart(r);
    document.getElementById('stat-n').textContent = sim.n;
    document.getElementById('stat-t').textContent = sim.t.toFixed(1) + 's';
  }

  fireflyMat.uniforms.uTime.value = now * 0.001;
  controls.update();
  renderer.render(scene, camera);
}

animate(performance.now());