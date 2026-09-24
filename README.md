# Graphite (live static build)

A static production build of the **Graphite** open-source 2D vector/raster graphics editor,
deployed as a client-side-only site on GitHub Pages. No server, no keys, no backend — everything
(including the Rust/WebAssembly engine) runs in your browser.

- **Source repo:** [GraphiteEditor/Graphite](https://github.com/GraphiteEditor/Graphite)
- **Upstream commit built:** `ddafaaa7575a1a7f771399a693ab2e53c0900061`
- **Upstream licenses:** MIT **and** Apache-2.0 (dual-licensed; see `LICENSE-MIT` and `LICENSE-APACHE`)
- **Build date:** 2026-09-24
- **Build command:** `cargo build --lib --package graphite-wasm-wrapper --target wasm32-unknown-unknown --release && wasm-bindgen --target web --out-name graphite_wasm_wrapper --out-dir frontend/wrapper/pkg --no-demangle <wasm> && wasm-opt -O3 -g <wasm_bg> -o <wasm_bg> && (cd frontend && npx vite build --base=/graphite-live/)`
  (equivalent to upstream's `cargo run build web`, with Vite's `--base=/graphite-live/` for the
  GitHub Pages subpath; the service worker and a few root-absolute URLs were patched to be
  base-path aware so the app works under `/graphite-live/` instead of a domain root)

## Notes

- **Heavy first load is expected.** The WebAssembly engine binary is tens of megabytes; the
  editor takes a while to download and initialize on first visit, then runs fully locally.
- This is a static mirror of one upstream commit. It is not affiliated with the Graphite project
  beyond building and hosting their open-source code. Report editor bugs upstream.
