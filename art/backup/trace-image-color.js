#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const potrace = require('potrace');
const { createCanvas, loadImage } = require('canvas');

// Configuration
const INPUT_PNG = path.join(__dirname, 'image.png');
const OUTPUT_SVG = path.join(__dirname, 'byte-mascot-traced-color.svg');
const COLORS = [
  {
    name: 'navy',
    hex: '#1D2E3B',
    threshold: 55,
    minBrightness: 0,
    maxBrightness: 100,
  },
  {
    name: 'blue',
    hex: '#A4D4E4',
    threshold: 70,
    minBrightness: 120,
    maxBrightness: 210,
  },
];

// Preprocess image for color separation
async function preprocessForColor(inputPath, color) {
  console.log(`Processing image for ${color.name} color...`);
  const canvas = createCanvas(800, 800);
  const ctx = canvas.getContext('2d');
  const image = await loadImage(inputPath);

  // Fill with white background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, 800, 800);

  // Center the image with appropriate scaling
  const targetWidth = 800 * 0.65;
  const scale = targetWidth / image.width;
  const scaledHeight = image.height * scale;
  const x = (800 - targetWidth) / 2;
  const y = (800 - scaledHeight) / 2;

  ctx.drawImage(image, x, y, targetWidth, scaledHeight);

  // Apply image processing based on color
  const imageData = ctx.getImageData(0, 0, 800, 800);
  const data = imageData.data;

  // Calculate RGB values of target color
  const targetR = parseInt(color.hex.substring(1, 3), 16);
  const targetG = parseInt(color.hex.substring(3, 5), 16);
  const targetB = parseInt(color.hex.substring(5, 7), 16);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Skip transparent pixels
    if (data[i + 3] < 200) {
      data[i] = data[i + 1] = data[i + 2] = 255; // White
      continue;
    }

    // Calculate brightness - weighted average based on human perception
    const brightness = r * 0.299 + g * 0.587 + b * 0.114;

    // Special case for white background
    if (r > 240 && g > 240 && b > 240) {
      data[i] = data[i + 1] = data[i + 2] = 255; // White
      continue;
    }

    if (color.name === 'navy') {
      // Advanced navy color detection - optimized for debug-navy.png

      // Check if it's a navy/dark blue pixel
      const isDarkBlue =
        brightness < 110 && // Darker pixels threshold
        b >= Math.max(r, g) && // Blue is the dominant channel
        Math.abs(r - g) < 30; // Red and green are similar (characteristic of blue-grays)

      // Stronger blue dominance check
      const blueDominance = b - (r + g) / 2 > 10;

      // Very dark pixels that are likely part of the navy color
      const isVeryDark = brightness < 60 && Math.max(r, g, b) < 80;

      // Additional check for navy blue tone
      const hasNavyTone = b > 1.2 * r && b > 1.2 * g;

      if ((isDarkBlue && (blueDominance || hasNavyTone)) || isVeryDark) {
        data[i] = data[i + 1] = data[i + 2] = 0; // Black
      } else {
        data[i] = data[i + 1] = data[i + 2] = 255; // White
      }
    } else if (color.name === 'blue') {
      // For light blue, focus on the blue dominance
      // Filter by brightness first
      if (
        brightness < color.minBrightness ||
        brightness > color.maxBrightness
      ) {
        data[i] = data[i + 1] = data[i + 2] = 255; // White
        continue;
      }

      // Calculate color similarity with more focus on blue component
      const blueEmphasis = b > (r + g) / 2 ? 0.8 : 1.2;
      const distance = Math.sqrt(
        Math.pow(r - targetR, 2) * 1.0 +
          Math.pow(g - targetG, 2) * 1.0 +
          Math.pow(b - targetB, 2) * blueEmphasis +
          Math.pow(brightness - 180, 2) * 0.01 // Prefer medium-bright pixels
      );

      // Make black if close to target color, white otherwise
      if (distance < color.threshold) {
        data[i] = data[i + 1] = data[i + 2] = 0; // Black
      } else {
        data[i] = data[i + 1] = data[i + 2] = 255; // White
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);

  // Save the preprocessed image for debugging
  const debugPath = path.join(__dirname, `debug-${color.name}.png`);
  fs.writeFileSync(debugPath, canvas.toBuffer());
  console.log(`Saved debug image to ${debugPath}`);

  // Return buffer instead of saving to file
  return canvas.toBuffer();
}

// Trace image buffer for a specific color
function traceForColor(imageBuffer, color) {
  return new Promise((resolve, reject) => {
    console.log(`Tracing ${color.name} parts...`);

    // Create a temp file for potrace
    const tempFile = path.join(__dirname, `temp-${color.name}.png`);
    fs.writeFileSync(tempFile, imageBuffer);

    const options = {
      turdSize: color.name === 'navy' ? 20 : 5, // Higher for navy to reduce noise, lower for blue for details
      turnPolicy: 'black',
      alphaMax: 1,
      optCurve: true,
      optTolerance: 0.1, // More precise curve optimization
      threshold: 128,
      blackOnWhite: true,
    };

    potrace.trace(tempFile, options, (err, svg) => {
      // Clean up temp file
      fs.unlinkSync(tempFile);

      if (err) return reject(err);

      // Extract just the path data
      const pathMatch = svg.match(/<path[^>]*d="([^"]+)"[^>]*>/);
      if (!pathMatch || !pathMatch[1]) {
        return resolve(''); // No paths found
      }

      // Format the path with color
      const coloredPath = `<path d="${pathMatch[1]}" fill="${color.hex}" />`;
      resolve(coloredPath);
    });
  });
}

// Main process
async function main() {
  try {
    console.log('Starting color-separated tracing process...');

    // Prepare all color paths
    const colorPaths = [];

    // For navy, use the debug png directly since it's perfect
    const debugNavyPath = path.join(__dirname, 'debug-navy.png');
    if (fs.existsSync(debugNavyPath)) {
      console.log('Using existing debug-navy.png directly...');
      const navyPath = await traceForColor(
        fs.readFileSync(debugNavyPath),
        COLORS.find((c) => c.name === 'navy')
      );
      if (navyPath) colorPaths.push(navyPath);
    } else {
      // Fallback to regular preprocessing
      const preprocessed = await preprocessForColor(
        INPUT_PNG,
        COLORS.find((c) => c.name === 'navy')
      );
      const path = await traceForColor(
        preprocessed,
        COLORS.find((c) => c.name === 'navy')
      );
      if (path) colorPaths.push(path);
    }

    // For blue, still use the regular process
    const blueColor = COLORS.find((c) => c.name === 'blue');
    const bluePreprocessed = await preprocessForColor(INPUT_PNG, blueColor);
    const bluePath = await traceForColor(bluePreprocessed, blueColor);
    if (bluePath) colorPaths.push(bluePath);

    // Create the final SVG with standard viewBox
    const svgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="800" height="800" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="800" height="800" fill="white"/>
  
  <!-- Traced paths -->
  ${colorPaths.join('\n  ')}
</svg>`;

    // Save first version
    const standardFile = path.join(
      __dirname,
      'byte-mascot-traced-color-standard.svg'
    );
    fs.writeFileSync(standardFile, svgContent);
    console.log(`✅ Standard SVG saved to ${standardFile}`);

    // Create properly positioned SVG for comparison
    const viewBoxSvgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="800" height="800" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="800" height="800" fill="white"/>
  
  <!-- Traced paths centered in viewBox to match PNG rendering -->
  <g transform="translate(140, 140) scale(0.65, 0.65)">
    ${colorPaths.join('\n    ')}
  </g>
</svg>`;

    fs.writeFileSync(OUTPUT_SVG, viewBoxSvgContent);
    console.log(`✅ Positioned SVG saved to ${OUTPUT_SVG}`);
  } catch (error) {
    console.error('Error during image tracing:', error);
    process.exit(1);
  }
}

main();
