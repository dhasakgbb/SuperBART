#!/usr/bin/env node
import path from 'node:path';
import { imageDimensions, readPng } from './lib/pixel';

const TARGET_PATH = path.resolve('public/assets/target_look.png');
const GOLDEN_PATH = path.resolve('docs/screenshots/golden/title_scene_golden.png');

const CONTRACT = {
  maxMeanAbsPerChannel: 0.0,
  maxDiffPixels: 0,
  perPixelTolerance: 0
} as const;

function main(): number {
  const targetDims = imageDimensions(TARGET_PATH);
  const goldenDims = imageDimensions(GOLDEN_PATH);

  if (targetDims.width !== goldenDims.width || targetDims.height !== goldenDims.height) {
    console.error(
      `Visual regression failed: dimensions mismatch target=${targetDims.width}x${targetDims.height} golden=${goldenDims.width}x${goldenDims.height}`
    );
    return 1;
  }

  const target = readPng(TARGET_PATH);
  const golden = readPng(GOLDEN_PATH);

  let sumAbs = 0;
  let diffPixels = 0;
  const totalPixels = target.width * target.height;

  for (let i = 0; i < target.data.length; i += 4) {
    const dr = Math.abs(target.data[i] - golden.data[i]);
    const dg = Math.abs(target.data[i + 1] - golden.data[i + 1]);
    const db = Math.abs(target.data[i + 2] - golden.data[i + 2]);
    const da = Math.abs(target.data[i + 3] - golden.data[i + 3]);

    const pxDiff = dr + dg + db + da;
    sumAbs += pxDiff;
    if (pxDiff > CONTRACT.perPixelTolerance) {
      diffPixels += 1;
    }
  }

  const meanAbsPerChannel = sumAbs / (totalPixels * 4);
  const pass =
    meanAbsPerChannel <= CONTRACT.maxMeanAbsPerChannel &&
    diffPixels <= CONTRACT.maxDiffPixels;

  if (!pass) {
    console.error('Visual regression failed.');
    console.error(
      `- meanAbsPerChannel=${meanAbsPerChannel.toFixed(4)} (limit ${CONTRACT.maxMeanAbsPerChannel.toFixed(4)})`
    );
    console.error(`- diffPixels=${diffPixels} (limit ${CONTRACT.maxDiffPixels})`);
    console.error(`- target=${TARGET_PATH}`);
    console.error(`- golden=${GOLDEN_PATH}`);
    return 1;
  }

  console.log('Visual regression passed.');
  console.log(
    `meanAbsPerChannel=${meanAbsPerChannel.toFixed(4)} diffPixels=${diffPixels} target=${path.relative(process.cwd(), TARGET_PATH)}`
  );
  return 0;
}

process.exitCode = main();
