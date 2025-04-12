#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const potrace = require('potrace');
const { createCanvas, loadImage } = require('canvas');

// Configuration
const INPUT_PNG = path.join(__dirname, 'image.png');
const OUTPUT_SVG = path.join(__dirname, 'byte-mascot-traced.svg');
const TMP_PNG = path.join(__dirname, 'preprocessed.png');

// Options for tracing
const TRACE_OPTIONS = {
  turdSize: 10, // Suppress speckles of this size (default: 2)
  turnPolicy: 'black', // How to resolve ambiguous pixels (default: 'minority')
  alphaMax: 1, // Corner threshold parameter (default: 1)
  optCurve: true, // Optimize curves (default: true)
  optTolerance: 0.2, // Curve optimization tolerance (default: 0.2)
  threshold: 128, // Threshold for converting to black/white (default: 128)
  blackOnWhite: true, // Background color (default: true)
  background: '#FFFFFF', // Background color (default: '#FFFFFF')
};

// Preprocess image to improve tracing results
async function preprocessImage(inputPath, outputPath) {
  console.log('Preprocessing image...');
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

  // Enhance contrast to improve tracing
  const imageData = ctx.getImageData(0, 0, 800, 800);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    // Enhance contrast - make dark pixels darker and light pixels lighter
    if (data[i] < 200 || data[i + 1] < 200 || data[i + 2] < 200) {
      data[i] = Math.max(0, data[i] - 40);
      data[i + 1] = Math.max(0, data[i + 1] - 40);
      data[i + 2] = Math.max(0, data[i + 2] - 40);
    } else {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  fs.writeFileSync(outputPath, canvas.toBuffer());
  console.log(`Preprocessed image saved to ${outputPath}`);
}

// Trace image to SVG
function traceImage(inputPath, outputPath, options) {
  return new Promise((resolve, reject) => {
    console.log('Tracing image...');

    potrace.trace(inputPath, options, (err, svg) => {
      if (err) return reject(err);

      // Post-process the SVG to add appropriate viewBox and styling
      const svgWithStyles = svg
        .replace('<svg', '<svg viewBox="0 0 800 800"')
        .replace(
          '</svg>',
          `
  <style>
    path { fill: #1A2E3B; }
  </style>
</svg>`
        );

      fs.writeFileSync(outputPath, svgWithStyles);
      console.log(`Traced SVG saved to ${outputPath}`);
      resolve();
    });
  });
}

// Main process
async function main() {
  try {
    // Step 1: Preprocess the image
    await preprocessImage(INPUT_PNG, TMP_PNG);

    // Step 2: Trace the preprocessed image
    await traceImage(TMP_PNG, OUTPUT_SVG, TRACE_OPTIONS);

    // Step 3: Clean up temporary file
    fs.unlinkSync(TMP_PNG);

    console.log('✅ Image tracing completed successfully!');
  } catch (error) {
    console.error('Error during image tracing:', error);
    process.exit(1);
  }
}

main();
