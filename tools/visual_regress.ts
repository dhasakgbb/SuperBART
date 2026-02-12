#!/usr/bin/env node
import path from 'node:path';
import fs from 'node:fs';
import { captureVisualBaselines } from './capture_visual_baselines';
import { imageDimensions, readPng } from './lib/pixel';

type SceneName = 'title' | 'map' | 'play';

interface Contract {
  perPixelTolerance: number;
  maxMeanAbsPerChannel: number;
  maxDiffPixels: number;
}

const CONTRACTS: Record<SceneName, Contract> = {
  title: {
    perPixelTolerance: 18,
    maxMeanAbsPerChannel: 4.8,
    maxDiffPixels: 12000,
  },
  map: {
    perPixelTolerance: 16,
    maxMeanAbsPerChannel: 4.2,
    maxDiffPixels: 10000,
  },
  play: {
    perPixelTolerance: 20,
    maxMeanAbsPerChannel: 5.6,
    maxDiffPixels: 16000,
  },
};

const GOLDENS: Record<SceneName, string> = {
  title: path.resolve('docs/screenshots/golden/title_scene_golden.png'),
  map: path.resolve('docs/screenshots/golden/map_scene_golden.png'),
  play: path.resolve('docs/screenshots/golden/play_scene_golden.png'),
};

function comparePngs(scene: SceneName, currentPath: string, goldenPath: string): { pass: boolean; meanAbsPerChannel: number; diffPixels: number } {
  const currentDims = imageDimensions(currentPath);
  const goldenDims = imageDimensions(goldenPath);
  if (currentDims.width !== goldenDims.width || currentDims.height !== goldenDims.height) {
    return { pass: false, meanAbsPerChannel: Number.POSITIVE_INFINITY, diffPixels: Number.POSITIVE_INFINITY };
  }

  const contract = CONTRACTS[scene];
  const current = readPng(currentPath);
  const golden = readPng(goldenPath);

  let sumAbs = 0;
  let diffPixels = 0;
  const totalPixels = current.width * current.height;
  for (let i = 0; i < current.data.length; i += 4) {
    const dr = Math.abs(current.data[i] - golden.data[i]);
    const dg = Math.abs(current.data[i + 1] - golden.data[i + 1]);
    const db = Math.abs(current.data[i + 2] - golden.data[i + 2]);
    const da = Math.abs(current.data[i + 3] - golden.data[i + 3]);
    const maxChannelDiff = Math.max(dr, dg, db, da);
    sumAbs += dr + dg + db + da;
    if (maxChannelDiff > contract.perPixelTolerance) {
      diffPixels += 1;
    }
  }

  const meanAbsPerChannel = sumAbs / (totalPixels * 4);
  const pass = meanAbsPerChannel <= contract.maxMeanAbsPerChannel && diffPixels <= contract.maxDiffPixels;
  return { pass, meanAbsPerChannel, diffPixels };
}

async function main(): Promise<number> {
  for (const goldenPath of Object.values(GOLDENS)) {
    if (!path.isAbsolute(goldenPath)) {
      throw new Error(`Golden path must be absolute: ${goldenPath}`);
    }
    if (!fs.existsSync(goldenPath)) {
      throw new Error(`Missing golden screenshot: ${goldenPath}. Run "npm run visual:update-golden".`);
    }
  }

  const captures = await captureVisualBaselines(path.resolve('docs/screenshots/current'));
  const currents: Record<SceneName, string> = {
    title: captures.title,
    map: captures.map,
    play: captures.play,
  };

  let pass = true;
  for (const scene of Object.keys(currents) as SceneName[]) {
    const result = comparePngs(scene, currents[scene], GOLDENS[scene]);
    if (!result.pass) {
      pass = false;
      console.error(`Visual regression failed for ${scene}.`);
      console.error(
        `- meanAbsPerChannel=${result.meanAbsPerChannel.toFixed(4)} (limit ${CONTRACTS[scene].maxMeanAbsPerChannel.toFixed(4)})`,
      );
      console.error(`- diffPixels=${result.diffPixels} (limit ${CONTRACTS[scene].maxDiffPixels})`);
      console.error(`- current=${path.relative(process.cwd(), currents[scene])}`);
      console.error(`- golden=${path.relative(process.cwd(), GOLDENS[scene])}`);
    } else {
      console.log(
        `Visual regression passed for ${scene}: meanAbsPerChannel=${result.meanAbsPerChannel.toFixed(4)} diffPixels=${result.diffPixels}`,
      );
    }
  }

  return pass ? 0 : 1;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
