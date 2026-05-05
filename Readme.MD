# 🌿 Firefly Synchronization

A real-time 3D simulation of spontaneous synchronization in fireflies, built on the **Kuramoto model**. Watch hundreds of fireflies emerge from chaos into perfect unison — no conductor, no leader, just local coupling.

![Three.js](https://img.shields.io/badge/Three.js-r164-black?logo=three.js) ![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite) ![License](https://img.shields.io/badge/license-MIT-green)

---

## What is this?

Certain species of fireflies (*Photinus carolinus*, native to the Great Smoky Mountains) synchronize their flashes spontaneously. Each firefly has its own internal rhythm, but by nudging its timing based on neighbors it can see, the whole swarm locks into phase — a phenomenon described mathematically by the **Kuramoto model** (1975).

This project simulates that process in 3D, running entirely in the browser. Adjust coupling strength, neighbor radius, and frequency disorder in real time and watch the **order parameter r(t)** climb from chaos (r ≈ 0) toward perfect synchrony (r ≈ 1).

---

## Live Demo

👉 **[firefly-sync.vercel.app](https://firefly-sync.vercel.app)**

---

## The Science

Each firefly `i` has a phase `θᵢ` that evolves as:

```
dθᵢ/dt = ωᵢ + (K / Nᵢ) × Σⱼ∈neighbors sin(θⱼ - θᵢ)
```

| Symbol | Meaning |
|---|---|
| `ωᵢ` | Natural frequency of firefly i (randomly assigned) |
| `K` | Coupling strength — how hard each firefly tries to sync |
| `Nᵢ` | Number of visible neighbors within radius |
| `sin(θⱼ − θᵢ)` | Phase correction — pulls i toward j |

The **order parameter** `r ∈ [0, 1]` measures global synchrony:

- `r ≈ 0` → all fireflies out of phase (chaos)
- `r ≈ 1` → perfect synchronization

---

## Running Locally

```bash
bun install       # or: npm install
bun run dev       # or: npm run dev
```

Open **http://localhost:5173** — no backend, no environment variables needed.

---

## UI Controls

| Control | Effect |
|---|---|
| **Coupling K** | Core sync force. Increase to push fireflies into phase |
| **Neighbor radius** | How far each firefly sees. Larger = faster sync |
| **Frequency spread σ** | Individual variation. Wider = harder to synchronize |
| **Firefly count** | Number of agents (applied on Reset) |
| **Pause / Resume** | Freeze the simulation |
| **Reset** | Start fresh with current parameters |
| **Auto-rotate** | Toggle camera orbit |
| Drag | Orbit camera |
| Scroll | Zoom in / out |

---

## Experiments to Try

**Watch the phase transition**
Start with K = 0.2 (no sync), slowly increase K until r suddenly jumps. This is the **Kuramoto critical coupling threshold**.

**Local vs global coupling**
Set neighbor radius to 0.05 — sync spreads slowly like a wave. Set it to 1.0 — sync happens globally and instantly. Real fireflies use local coupling.

**Frequency disorder**
Set σ = 0.01 (near-identical fireflies) → sync is easy. Set σ = 1.5 → sync is hard even at high K.

---

## Stack

- **[Three.js](https://threejs.org/)** — 3D rendering with custom GLSL shaders
- **[Vite](https://vitejs.dev/)** — build tooling
- **Kuramoto model** — implemented in vanilla JS, runs at 30 ticks/sec in the browser

---

## Further Reading

- Kuramoto, Y. (1975). *Self-entrainment of a population of coupled non-linear oscillators.*
- Strogatz, S. (2003). *Sync: How Order Emerges from Chaos in the Universe, Nature, and Daily Life.*
- Buck, J. (1988). *Synchronous rhythmic flashing of fireflies.* The Quarterly Review of Biology.

---

## License

MIT — free to use, modify, and share.