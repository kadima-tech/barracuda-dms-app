# Byte DeskBuddy Mascot

This directory contains the Byte DeskBuddy mascot in SVG format and tools to compare it with the original PNG.

## Files

- `image.png` - The original PNG image
- `byte-mascot.svg` - SVG recreation of the mascot
- `compare-images.js` - Script to compare the SVG and PNG for similarity
- `diff.png` - Generated image showing the differences (created when running the comparison)

## Setup

Install dependencies:

```bash
npm install
```

## Usage

Run the comparison script:

```bash
npm test
```

This will:

1. Load the PNG and SVG images
2. Render them both to the same dimensions
3. Compare them pixel by pixel
4. Generate a difference visualization
5. Calculate a similarity percentage
6. Pass if similarity is ≥99%, fail otherwise

## Modifying the SVG

If you need to improve the SVG:

1. Edit `byte-mascot.svg` in a text editor or SVG editor
2. Run the test again to check similarity
3. View `diff.png` to see which areas need improvement

The SVG uses standard SVG elements to recreate the mascot:

- `<rect>`, `<circle>`, `<ellipse>`, `<path>` for shapes
- `<text>` for the text elements
- Colors use hex codes (navy blue: `#1A2E3B`, light blue: `#A4D4E4`)
