# Keryx Miner — OPoI Dashboard

[![License](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Rust](https://img.shields.io/badge/rust-1.88.0%2B-orange)](https://www.rust-lang.org/)
[![CUDA](https://img.shields.io/badge/CUDA-12.x-green)](https://developer.nvidia.com/cuda-toolkit)
[![Electron](https://img.shields.io/badge/Electron-28.x-47848F)](https://electronjs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

**Keryx Miner** is a next-generation GPU mining dashboard for the Keryx blockchain, combining traditional Proof‑of‑Work (PoW) mining with **Optimized Proof of Inference (OPoI)** — a novel consensus mechanism that rewards on‑chain AI inference workloads. This Electron‑based desktop application provides a polished, real‑time interface for monitoring and controlling the Keryx mining node and its integrated inference engine.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Build](#installation--build)
- [Configuration](#configuration)
- [Running the Dashboard](#running-the-dashboard)
- [Development](#development)
- [Components](#components)
- [OPoI Inference Mining](#opoi-inference-mining)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)

---

## Overview

Keryx Miner is the official desktop client for the Keryx blockchain network. It provides:

- **GPU‑accelerated mining** using CUDA kernels
- **OPoI (Optimized Proof of Inference)** — mine by performing useful AI inference workloads
- **Real‑time dashboard** with hashrate charts, GPU stats, and block discovery animations
- **Integrated daemon** (`keryxd`) and miner (`keryx-miner`) processes
- **Settings management** with persistent user configuration
- **Web‑based inference window** for submitting AI tasks

The project is a monorepo containing:
- A **Rust workspace** with 50+ crates for the core blockchain and mining logic
- An **Electron shell** that wraps the dashboard UI and spawns child processes
- **CUDA kernels** for high‑performance mining and inference

---

## Key Features

### 🚀 Mining
- **Multi‑GPU support** — leverages all available NVIDIA GPUs
- **Real‑time hashrate** monitoring with sparkline charts
- **GPU telemetry** — temperature, power draw, VRAM usage
- **Automatic block detection** with celebratory visual effects

### 🧠 OPoI Inference Mining
- **On‑chain AI inference** — mine blocks while serving AI models
- **Multiple model tiers** — from 1.7B to 70B parameter models:
  - `very-light`: Qwen3‑1.7B
  - `light`: Gemma‑3‑4B
  - `default`: Dolphin‑3.0‑Llama‑3.1‑8B
  - `high`: Qwen3‑32B
  - `very-high`: Llama‑3.3‑70B
- **Inference request counter** tracks OPoI completions

### 🖥️ Dashboard UI
- **Cyberpunk‑inspired dark theme** with animated backgrounds
- **Live network stats** from the Keryx API (hashrate, blocks, supply, DAA)
- **Interactive 3D visualizations** — rotating K logo, particle systems, shockwave effects
- **Dual log panels** — separate daemon and miner output
- **Settings modal** for configuring binary paths, mining addresses, and model tier

### 🔧 Developer Experience
- **Single‑command build** (`node build.js`) that locates MSVC, Windows SDK, and CUDA
- **Workspace‑aware Cargo** with optimized release profiles
- **Comprehensive logging** with log level parsing
- **IPC bridge** between Electron and renderer processes

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend UI** | HTML5, CSS3, Vanilla JS, Canvas API |
| **Desktop Shell** | Electron 28.x |
| **Backend Runtime** | Rust 1.88.0 (stable) |
| **Blockchain Core** | Keryx workspace (50+ crates) |
| **GPU Acceleration** | CUDA 12.x, NVCC |
| **RPC Framework** | Tonic (gRPC), Prost, Tower |
| **Serialization** | Borsh, Serde, Prost |
| **Crypto** | Secp256k1, SHA‑2/3, Blake2b, Keccak |
| **Database** | RocksDB |
| **Build System** | Cargo, custom `build.js` script |

---

## Project Structure

```
keryx-node/
├── build.js                 # MSVC/CUDA/Windows SDK finder + build orchestrator
├── build.rs                 # Cargo build script (compiles CUDA kernels, protobufs)
├── Cargo.toml               # Workspace definition with 50+ member crates
├── electron/                # Electron application
│   ├── main.js              # Main process — spawns daemon/miner, IPC handlers
│   ├── preload.js           # Secure context bridge between main and renderer
│   ├── renderer.js          # UI logic, event handlers, animations
│   ├── parser.js            # Parses miner stdout into structured events
│   ├── index.html           # Dashboard HTML
│   └── hashrate.html        # Minimalist hash rate monitor (standalone)
├── keryxd/                  # Daemon binary crate
├── miner-node/              # Miner binary crate (used by build.js)
├── core/                    # Core blockchain data structures
├── consensus/               # Consensus engine (PoW + OPoI)
├── crypto/                  # Cryptographic primitives
├── wallet/                  # Wallet implementation (native + WASM)
├── rpc/                     # gRPC and WebRPC services
├── mining/                  # Mining logic and error types
├── protocol/                # P2P networking and flows
├── indexes/                 # UTXO and other blockchain indexes
├── metrics/                 # Performance monitoring
├── inference/               # OPoI inference engine (SlmEngine)
├── cuda/                    # CUDA kernels (pom_mine.cu)
├── proto/                   # Protocol buffer definitions
└── bin/                     # Output directory for compiled executables
```

---

## Prerequisites

### Windows Requirements
- **Visual Studio 2022** (Community/Professional/Enterprise) with C++ workload
- **Windows SDK 10.0.20348.0+**
- **CUDA Toolkit 12.x** (v12.0–12.8 supported)
- **Rust 1.88.0+** (via rustup)
- **Node.js 18+** and npm (for Electron)
- **protoc** (Protocol Buffers compiler) — optional, used for gRPC code generation

### Linux / macOS (limited support)
- The build script is Windows-centric, but the Rust workspace compiles on Linux/macOS with appropriate toolchains.
- For Linux, install `build-essential`, `cmake`, `clang`, and CUDA.

---

## Installation & Build

### 1. Clone the Repository
```bash
git clone https://github.com/Keryx-Labs/keryx-node.git
cd keryx-node
```

### 2. Install Rust Dependencies
```bash
rustup default stable
rustup target add x86_64-pc-windows-msvc  # Windows only
```

### 3. Build the Binaries
The `build.js` script handles everything:
```bash
node build.js
```

This script:
- Locates your MSVC compiler, Windows SDK, and CUDA installation
- Sets the appropriate environment variables (`INCLUDE`, `LIB`, `PATH`, etc.)
- Builds both `keryxd` and `keryx-miner` in release mode
- Copies the executables to the `bin/` folder

### 4. Install Electron Dependencies
```bash
cd electron
npm install
```

---

## Configuration

Keryx Miner stores its configuration in `%APPDATA%/keryx-miner/config.json` (Windows) or `~/.config/keryx-miner/config.json` (Linux/macOS).

### Configuration Fields
```json
{
  "minerPath": "C:/path/to/keryx-miner.exe",
  "miningAddress": "keryx:your_wallet_address_here",
  "keryxdAddress": "127.0.0.1:8080",
  "tier": "default"
}
```

- **`minerPath`** — Absolute path to the `keryx-miner` binary (leave empty for idle mode)
- **`miningAddress`** — Your Keryx wallet address (required for mining)
- **`keryxdAddress`** — Optional daemon address (defaults to `127.0.0.1:8080`)
- **`tier`** — Inference model tier (`very-light`, `light`, `default`, `high`, `very-high`)

### Settings UI
Click the **⚙ settings** button in the dashboard footer to configure these values via a graphical modal.

---

## Running the Dashboard

### Start the Electron App
```bash
cd electron
npm start
```

The application will:
1. Load the `index.html` dashboard
2. Attempt to locate bundled binaries in `resources/bin/` or `electron/bin/`
3. Spawn the daemon (`keryxd.exe`) with a 3‑second startup delay
4. Launch the miner (`keryx-miner.exe`) with the configured arguments
5. Begin streaming logs and mining events to the UI

### Standalone Hashrate Monitor
A minimalistic hashrate monitor is available at `hashrate.html`. This can be opened separately if you prefer a less cluttered view.

---

## Development

### Electron Development
```bash
cd electron
npm run dev   # Opens with dev tools enabled
```

### Rust Development
```bash
# Build individual crates
cargo build -p keryxd
cargo build -p keryx-miner

# Run tests
cargo test -p core
cargo test -p consensus

# Run with GPU debugging
cargo run -p keryx-miner -- --mining-address test_address --debug
```

### CUDA Kernel Development
The `pom_mine.cu` kernel is compiled at build time by `build.rs` using NVCC. To modify it:
1. Edit `cuda/pom_mine.cu`
2. Rebuild with `cargo build` (or `node build.js`)
3. The resulting PTX file is embedded in the binary

### Protocol Buffers
Proto files in `proto/` are compiled to Rust code using `tonic-build`. After modifying a `.proto` file:
```bash
cargo build  # Automatically regenerates code
```

---

## Components

### Electron Main Process (`main.js`)

| Responsibility | Description |
|----------------|-------------|
| **Process Management** | Spawns and kills `keryxd.exe` and `keryx-miner.exe` |
| **IPC Bridge** | Handles `ipcMain` events for config, window control, and inference window |
| **GPU Polling** | Runs `nvidia-smi` every 2 seconds to fetch GPU telemetry |
| **Config Persistence** | Saves/loads `config.json` from `userData` |
| **Log Routing** | Forwards stdout/stderr from child processes to the renderer |

**Key APIs**:
- `ipcMain.handle('get-config', ...)`
- `ipcMain.handle('save-config', ...)`
- `ipcMain.handle('window-min', ...)`
- `ipcMain.handle('open-infer-window', ...)`

### Renderer & UI (`renderer.js` + `index.html`)

The renderer is a single‑page application with:

- **Canvas animations** — rain effect, tech network, particle systems, shockwaves
- **Real‑time data binding** — updates hashrate, GPU stats, block counter, inference requests
- **Event‑driven architecture** — listens to `miner-event` and `miner-status` IPC messages
- **Log management** — two log panels (daemon/miner) with colour‑coded levels
- **Block discovery effects** — screen shake, particle burst, audio feedback, hologram overlay

**Parser (`parser.js`)**:
- Parses miner stdout lines into structured events using regex patterns
- Supports events: `hashrate`, `device-hashrate`, `share-accepted`, `block-found`, `opoi-complete`, `model-loading`, `gpu-ready`, `connected`, etc.

### Backend (Rust Workspace)

The workspace comprises 50+ crates organised by functionality:

| Crate Group | Crates |
|-------------|--------|
| **Core** | `keryx-core`, `keryx-consensus`, `keryx-database` |
| **Crypto** | `keryx-hashes`, `keryx-addresses`, `keryx-merkle`, `keryx-muhash`, `keryx-txscript` |
| **Consensus** | `keryx-consensus`, `keryx-consensus-core`, `keryx-pow` |
| **Mining** | `keryx-mining`, `miner-node`, `keryxd` |
| **Wallet** | `keryx-wallet`, `keryx-bip32`, `keryx-pskt`, `wallet/wasm` |
| **RPC** | `rpc/grpc`, `rpc/wrpc`, `rpc/service` |
| **Protocol** | `protocol/p2p`, `protocol/flows` |
| **Indexes** | `indexes/utxoindex`, `indexes/processor` |
| **Inference** | `keryx-inference` (OPoI engine) |
| **Utils** | `keryx-utils`, `keryx-alloc`, `keryx-metrics` |

### Build Script (`build.js`)

The `build.js` script automates the complex Windows build environment setup:

1. **Locate MSVC** — scans for VS 2022/2019 installations, picks the latest toolchain
2. **Locate Windows SDK** — finds the newest installed SDK version
3. **Locate CUDA** — searches common CUDA installation paths (v11.8–12.8)
4. **Locate protoc** — finds Protocol Buffers compiler (optional)
5. **Build environment** — constructs `INCLUDE`, `LIB`, and `PATH` variables
6. **Build crates** — runs `cargo build --release` for `keryxd` and `keryx-miner`
7. **Copy binaries** — places executables in the `bin/` folder

---

## OPoI Inference Mining

Keryx introduces **Optimized Proof of Inference (OPoI)** — a consensus mechanism where miners earn rewards by performing useful AI inference workloads. The miner:

1. **Loads a model** — based on the configured tier (e.g., Dolphin‑8B)
2. **Serves inference requests** — processes prompts submitted by network users
3. **Submits shares** — proof of completed inference work is submitted to the network
4. **Earns block rewards** — successful submissions count towards block discovery

The dashboard tracks OPoI completions in real‑time via the **inference request counter** (`opoi-complete` event).

---

## Roadmap

- [x] **Initial Release** — Basic mining + OPoI dashboard
- [x] **GPU Telemetry** — Real‑time nvidia‑smi integration
- [x] **Block Discovery Effects** — Audio, visual, and hologram feedback
- [x] **Settings UI** — Persistent configuration with modal
- [ ] **Multi‑GPU Monitoring** — Per‑device hashrate and stats
- [ ] **Mining Pool Support** — Stratum protocol integration
- [ ] **Performance Profiling** — Flamegraph and metrics export
- [ ] **Linux/macOS Native Builds** — Beyond Windows
- [ ] **Dockerized Deployment** — One‑click containerized miner
- [ ] **Mobile Companion App** — Remote monitoring via WebSocket

---

## Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m "Add amazing feature"
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request** against the `main` branch

### Development Guidelines
- **Rust code** — Use `cargo fmt` and `cargo clippy` before committing
- **JavaScript** — Follow ES6 standards; avoid external libraries in the renderer
- **Commit messages** — Use conventional commits (feat:, fix:, docs:, etc.)
- **Testing** — Add unit tests for new Rust code; manual QA for UI changes

---

## License

Distributed under the **ISC License**. See `LICENSE.txt` for more information.

---

## Acknowledgements

- **Keryx Labs** — For the innovative OPoI consensus and blockchain infrastructure
- **Rust Community** — For the ecosystem of crates powering the backend
- **Electron Team** — For making cross‑platform desktop apps accessible
- **NVIDIA** — For CUDA and GPU acceleration
- **Font Awesome** — For the iconography
- **Google Fonts** — For JetBrains Mono and Inter typefaces

---

## Contact

**Project Link:** [https://github.com/Keryx-Labs/keryx-node](https://github.com/Keryx-Labs/keryx-node)

**Keryx Labs:** [https://keryx-labs.com](https://keryx-labs.com)

---

*Built with ❤️ by the Keryx community — mining the future, one block at a time.*
