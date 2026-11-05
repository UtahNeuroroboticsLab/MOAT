# Moat App

## Experimental generated scan

In Export, use **Download generated scan PDF** to transcribe the current assessment into the original 15-page assessment packet. The export circles the visit, affected hand, applicable MyoPro condition, and printed response options. The optional assessor name applies only to this export.

The PDF contains rasterized grayscale pages at 144 dpi, including the landscape COPM reassessment page. Each page identifies itself as an experimental generated scan. Generation runs locally and downloads a PDF; it does not upload data or change the assessment.

Blank responses remain blank. Existing default values are included. Sections marked not recorded are not filled. FMA and CAHAI totals require complete scores; COPM averages use the populated top-five problems only when all corresponding ratings are present. Notes, stored SIS domains absent from the packet, and text too long for a cell are retained in supplemental pages. Values that cannot be circled on a printed scale are retained there as well, including NASA TLX values outside 0-20.

The page backgrounds in `public/assessment-packet/` are generated from `.ref/Assessment Master Packet.pdf`. Rebuild them with `python scripts/prepare_scan_template.py` after installing PyMuPDF in a development environment. Python is not required by the app. The manifest records the source hash and page dimensions. The coordinates in `src/utils/scanPacketLayout.ts` are specific to this packet; replacing the template requires reviewing those coordinates and rendering the output again.

For browser regression checks, start Vite on port 1421, open an isolated Playwright CLI session at `/MOAT/`, create `output/playwright/`, and run `playwright-cli run-code --filename scripts/verify_scan_export.js` in that session. The script checks the download, failure recovery, visit mapping, blank and zero values, skipped sections, and supplemental data. It saves QA PDFs and a UI screenshot in the ignored output directory.

This template should help get you started developing with Tauri, React and Typescript in Vite.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## Prerequisites

Before you begin, ensure you have the following installed:

### Node.js
- Install Node.js (v18 or higher recommended)
- Verify installation:
  ```bash
  node --version
  npm --version




### Rust Install

Install Rust using rustup:

```
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

## Building

### Build single executable

```bash
bun run tauri build --bundles nsis
```

### Build installer

```bash
bun run tauri build
```
