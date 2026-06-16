# PokeFont Chrome Extension

PokeFont is a fun Chromium browser extension inspired by the classic Pokémon anime logo styling. Instead of changing the entire webpage's fonts statically (which slows down loading times), this extension turns your cursor into a dynamic Pokéball-styled **Mirror Lens**. 

As you hover over any text on a webpage, only the text directly inside the lens transforms in real-time, displaying in the bold, slanted yellow Pokémon font with a thick blue border outline.

## Features
- **Dynamic Pokéball Lens**: A circular magnifier frame resembling a Pokéball follows your cursor smoothly across the page.
- **Dynamic Text Transformation**: Leverages a high-performance content overlay and CSS `clip-path` masks centered at the cursor coordinates.
- **Bundled Font Asset**: Includes `pokemon-solid.ttf` directly within the extension package to ensure instant, offline-compatible rendering with zero layout shifts.
- **Optimized Performance**: Only clones the single active text block currently under the cursor, keeping memory overhead and layout recalculations extremely lightweight.

## Installation Instructions

1. Download or clone this repository.
2. Open **Google Chrome** and navigate to `chrome://extensions/`.
3. Toggle on **Developer Mode** (switch in the top-right corner).
4. Click **Load unpacked** (top-left button).
5. Select the `pokefont` directory containing the `manifest.json`.
6. Pin the extension if desired, open any webpage (e.g. Wikipedia, a blog, or a documentation page), and hover your cursor over the text to see the Pokéball mirror lens activate!
