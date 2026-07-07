# Keryx Miner — OPoI Dashboard

[![License](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Rust](https://img.shields.io/badge/rust-1.88.0%2B-orange)](https://www.rust-lang.org/)
[![CUDA](https://img.shields.io/badge/CUDA-12.x-green)](https://developer.nvidia.com/cuda-toolkit)
[![Electron](https://img.shields.io/badge/Electron-28.x-47848F)](https://electronjs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

**Keryx Miner** is a next-generation GPU mining dashboard for the Keryx blockchain, combining traditional Proof-of-Work (PoW) mining with **Optimized Proof of Inference (OPoI)** — a novel consensus mechanism that rewards on-chain AI inference workloads. This Electron-based desktop application provides a polished, real-time interface for monitoring and controlling the Keryx mining node and its integrated inference engine.

---

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
