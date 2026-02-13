#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { captureVisualBaselines } from './capture_visual_baselines';
import { imageDimensions, readPng } from './lib/pixel';
import styleConfig from '../src/style/styleConfig';

type SceneName = 'title' | 'map' | 'play';

type SceneRegressionProfile = {
  perPixelTolerance: number;
  maxMeanAbsPerChannel: number;
  maxDiffPixels: number;
  minCoverageGate?: number;
  maxCoverageDelta?: number;
  minLumaSpread?: number;
  minMeanLuma?: number;
};

interface BaselineMeta {
  scene: SceneName;
  sourceScene: string;
  createdAt: string;
  layoutVersion: string;
  targetFile: string;
  captureHash: string;
  width: number;
  height: number;
}

interface GoldenMetadata {
  schema: string;
  generatedAt: string;
  scenes: BaselineMeta[];
}

type CompareResult = {
  pass: boolean;
  meanAbsPerChannel: number;
  diffPixels: number;
  currentCoverage: number;
  goldenCoverage: number;
  coverageDelta: number;
};

type QualityResult = {
  pass: boolean;
  coverage: number;
  meanLuma: number;
  lumaSpread: number;
  nonTransparentPixels: number;
};

const CONTRACTS: Record<SceneName, SceneRegressionProfile> = {
  title: {
    perPixelTolerance: 16,
    maxMeanAbsPerChannel: 4.5,
    maxDiffPixels: 11000,
    minCoverageGate: 0.12,
    maxCoverageDelta: 0.08,
    minLumaSpread: 2.6,
    minMeanLuma: 2,
  },
  map: {
    perPixelTolerance: 15,
    maxMeanAbsPerChannel: 4.0,
    maxDiffPixels: 9000,
    minCoverageGate: 0.12,
    maxCoverageDelta: 0.1,
    minLumaSpread: 2.4,
    minMeanLuma: 2,
  },
  play: {
    perPixelTolerance: 16,
    maxMeanAbsPerChannel: 4.8,
    maxDiffPixels: 12500,
    minCoverageGate: 0.12,
    maxCoverageDelta: 0.1,
    minLumaSpread: 3.0,
    minMeanLuma: 3,
  },
};

const GOLDENS: Record<SceneName, string> = {
  title: path.resolve('docs/screenshots/golden/title_scene_golden.png'),
  map: path.resolve('docs/screenshots/golden/map_scene_golden.png'),
  play: path.resolve('docs/screenshots/golden/play_scene_golden.png'),
};
const SCENE_SOURCE_BY_NAME: Record<SceneName, string> = {
  title: 'TitleScene',
  map: 'WorldMapScene',
  play: 'PlayScene',
};

const GOLDEN_META_PATH = path.resolve('docs/screenshots/golden/golden_meta.json');

function hashFile(filePath: string): string {
  const data = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(data).digest('hex');
}

function validateGoldenMetadata(): Record<SceneName, BaselineMeta> {
  if (!fs.existsSync(GOLDEN_META_PATH)) {
    throw new Error(`Missing golden metadata at ${GOLDEN_META_PATH}. Run "npm run visual:update-golden" once.`);
  }
  const payload = JSON.parse(fs.readFileSync(GOLDEN_META_PATH, 'utf-8')) as GoldenMetadata;
  const map: Partial<Record<SceneName, BaselineMeta>> = {};
  const expectedLayoutVersion = styleConfig.contractVersion;

  if (!payload || !Array.isArray(payload.scenes)) {
    throw new Error(`Invalid golden metadata format at ${GOLDEN_META_PATH}.`);
  }
  if (payload.schema !== 'visual-regression-v1') {
    throw new Error(`Unexpected visual regression schema at ${GOLDEN_META_PATH}: ${payload.schema ?? 'missing'}.`);
  }
  if (!payload.generatedAt || Number.isNaN(Date.parse(payload.generatedAt))) {
    throw new Error(`Golden metadata has invalid generatedAt: ${payload.generatedAt}`);
  }
  if (!payload.layoutVersion) {
    throw new Error('Golden metadata is missing layoutVersion.');
  }
  if (payload.layoutVersion !== expectedLayoutVersion) {
    throw new Error(
      `Golden metadata layoutVersion ${payload.layoutVersion} does not match active contract ${expectedLayoutVersion}. Re-run baseline capture.`,
    );
  }

  for (const sceneMeta of payload.scenes) {
    if (!sceneMeta || !sceneMeta.scene || !sceneMeta.targetFile) {
      throw new Error('Invalid golden metadata entry; expected scene and targetFile.');
    }
    if (!sceneMeta.captureHash) {
      throw new Error(`Golden metadata entry for ${sceneMeta.scene} is missing captureHash.`);
    }
    if (!Object.prototype.hasOwnProperty.call(GOLDENS, sceneMeta.scene)) {
      throw new Error(`Unknown golden scene in metadata: ${sceneMeta.scene}`);
    }
    if (!sceneMeta.sourceScene?.trim() || !sceneMeta.createdAt?.trim()) {
      throw new Error(`Golden metadata entry for ${sceneMeta.scene} missing sourceScene/createdAt/layoutVersion.`);
    }
    if (!Number.isInteger(sceneMeta.width) || sceneMeta.width <= 0) {
      throw new Error(`Golden metadata entry for ${sceneMeta.scene} has invalid width.`);
    }
    if (!Number.isInteger(sceneMeta.height) || sceneMeta.height <= 0) {
      throw new Error(`Golden metadata entry for ${sceneMeta.scene} has invalid height.`);
    }
    const sceneLayoutVersion = sceneMeta.layoutVersion ?? expectedLayoutVersion;
    if (!sceneMeta.layoutVersion) {
      sceneMeta.layoutVersion = sceneLayoutVersion;
    }
    if (sceneLayoutVersion !== expectedLayoutVersion) {
      throw new Error(`Golden metadata entry for ${sceneMeta.scene} uses layoutVersion ${sceneMeta.layoutVersion}, expected ${expectedLayoutVersion}.`);
    }
    if (Number.isNaN(Date.parse(sceneMeta.createdAt))) {
      throw new Error(`Golden metadata entry for ${sceneMeta.scene} has invalid createdAt: ${sceneMeta.createdAt}`);
    }
    if (map[sceneMeta.scene] != null) {
      throw new Error(`Duplicate golden metadata entry for scene ${sceneMeta.scene}.`);
    }

    map[sceneMeta.scene] = sceneMeta;
  }

  const missing = (['title', 'map', 'play'] as SceneName[]).filter((scene) => !Object.prototype.hasOwnProperty.call(map, scene));
  if (missing.length > 0) {
    throw new Error(`Golden metadata is missing scenes: ${missing.join(', ')}`);
  }

  for (const scene of ['title', 'map', 'play'] as SceneName[]) {
    const meta = map[scene];
    if (!meta) {
      continue;
    }
    const expected = GOLDENS[scene];
    const absoluteExpected = path.isAbsolute(meta.targetFile) ? meta.targetFile : path.resolve(path.dirname(GOLDEN_META_PATH), meta.targetFile);
    if (path.resolve(absoluteExpected) !== path.resolve(expected)) {
      throw new Error(`Golden metadata scene ${scene} points to ${absoluteExpected}, expected ${expected}.`);
    }
    if (meta.scene !== scene) {
      throw new Error(`Golden metadata maps ${meta.scene} to ${scene}.`);
    }
  }

  return map as Record<SceneName, BaselineMeta>;
}

function comparePngs(scene: SceneName, currentPath: string, goldenPath: string): CompareResult {
  const currentDims = imageDimensions(currentPath);
  const goldenDims = imageDimensions(goldenPath);
  if (currentDims.width !== goldenDims.width || currentDims.height !== goldenDims.height) {
    return {
      pass: false,
      meanAbsPerChannel: Number.POSITIVE_INFINITY,
      diffPixels: Number.POSITIVE_INFINITY,
      currentCoverage: 0,
      goldenCoverage: 0,
      coverageDelta: 1,
    };
  }

  const contract = CONTRACTS[scene];
  const current = readPng(currentPath);
  const golden = readPng(goldenPath);

  let sumAbs = 0;
  let diffPixels = 0;
  let visibleCurrentPixels = 0;
  let visibleGoldenPixels = 0;
  const totalPixels = current.width * current.height;
  for (let i = 0; i < current.data.length; i += 4) {
    const cr = current.data[i]!;
    const cg = current.data[i + 1]!;
    const cb = current.data[i + 2]!;
    const ca = current.data[i + 3]!;
    const gr = golden.data[i]!;
    const gg = golden.data[i + 1]!;
    const gb = golden.data[i + 2]!;
    const ga = golden.data[i + 3]!;

    const dr = Math.abs(cr - gr);
    const dg = Math.abs(cg - gg);
    const db = Math.abs(cb - gb);
    const da = Math.abs(ca - ga);
    const maxChannelDiff = Math.max(dr, dg, db, da);
    sumAbs += dr + dg + db + da;
    if (maxChannelDiff > contract.perPixelTolerance) {
      diffPixels += 1;
    }

    if (ca > 8) {
      visibleCurrentPixels += 1;
    }
    if (ga > 8) {
      visibleGoldenPixels += 1;
    }
  }

  const meanAbsPerChannel = sumAbs / (totalPixels * 4);
  const currentCoverage = visibleCurrentPixels / totalPixels;
  const goldenCoverage = visibleGoldenPixels / totalPixels;
  const coverageOk =
    contract.minCoverageGate == null || currentCoverage >= contract.minCoverageGate;
  const deltaOk =
    contract.maxCoverageDelta == null || Math.abs(currentCoverage - goldenCoverage) <= contract.maxCoverageDelta;
  const pass =
    coverageOk &&
    deltaOk &&
    meanAbsPerChannel <= contract.maxMeanAbsPerChannel &&
    diffPixels <= contract.maxDiffPixels;
  return {
    pass,
    meanAbsPerChannel,
    diffPixels,
    currentCoverage,
    goldenCoverage,
    coverageDelta: Math.abs(currentCoverage - goldenCoverage),
  };
}

function analyzeFrameQuality(imagePath: string): Omit<QualityResult, 'pass'> {
  const image = readPng(imagePath);
  const totalPixels = image.width * image.height;
  let nonTransparentPixels = 0;
  let sumLuma = 0;
  let sumLumaSq = 0;

  for (let i = 0; i < image.data.length; i += 4) {
    const r = image.data[i]!;
    const g = image.data[i + 1]!;
    const b = image.data[i + 2]!;
    const a = image.data[i + 3]!;
    if (a > 8) {
      const luma = (r + g + b) / 3;
      nonTransparentPixels += 1;
      sumLuma += luma;
      sumLumaSq += luma * luma;
    }
  }

  const visible = Math.max(1, nonTransparentPixels);
  const meanLuma = sumLuma / visible;
  const meanLumaSq = sumLumaSq / visible;
  const variance = Math.max(0, meanLumaSq - meanLuma * meanLuma);

  return {
    coverage: totalPixels > 0 ? nonTransparentPixels / totalPixels : 0,
    meanLuma,
    lumaSpread: Math.sqrt(variance),
    nonTransparentPixels,
  };
}

function assertRenderQuality(scene: SceneName, imagePath: string): QualityResult {
  const contract = CONTRACTS[scene];
  const quality = analyzeFrameQuality(imagePath);
  const failures: string[] = [];

  if (contract.minCoverageGate != null && quality.coverage < contract.minCoverageGate) {
    failures.push(`coverage ${(quality.coverage * 100).toFixed(2)}% below ${(contract.minCoverageGate * 100).toFixed(1)}%`);
  }
  if (contract.minLumaSpread != null && quality.lumaSpread < contract.minLumaSpread) {
    failures.push(`lumaSpread ${quality.lumaSpread.toFixed(2)} below ${contract.minLumaSpread}`);
  }
  if (contract.minMeanLuma != null && quality.meanLuma < contract.minMeanLuma) {
    failures.push(`meanLuma ${quality.meanLuma.toFixed(2)} below ${contract.minMeanLuma}`);
  }

  if (failures.length > 0) {
    throw new Error(failures.join(', '));
  }

  return { pass: true, ...quality };
}

async function main(): Promise<number> {
  const baseline = validateGoldenMetadata();
  for (const goldenPath of Object.values(GOLDENS)) {
    if (!path.isAbsolute(goldenPath)) {
      throw new Error(`Golden path must be absolute: ${goldenPath}`);
    }
    if (!fs.existsSync(goldenPath)) {
      throw new Error(`Missing golden screenshot: ${goldenPath}. Run "npm run visual:update-golden".`);
    }
  }

  for (const scene of Object.values(baseline) as BaselineMeta[]) {
    const dims = imageDimensions(scene.targetFile);
    if (dims.width !== scene.width || dims.height !== scene.height) {
      throw new Error(
        `Golden metadata dimensions mismatch for ${scene.scene}: metadata ${scene.width}x${scene.height}, file ${dims.width}x${dims.height}.`,
      );
    }
  }

  for (const scene of Object.values(baseline)) {
    const expected = GOLDENS[scene.scene];
    const onDiskHash = hashFile(expected);
    if (scene.captureHash !== onDiskHash) {
      throw new Error(
        `Golden metadata hash mismatch for ${scene.scene}. Metadata was for ${scene.captureHash}, file on disk is ${onDiskHash}. Re-run --update-golden.`,
      );
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
    const baselineMeta = baseline[scene];
    if (!baselineMeta) {
      console.error(`Missing baseline metadata for scene ${scene}.`);
      pass = false;
      continue;
    }
    if (baselineMeta.sourceScene !== SCENE_SOURCE_BY_NAME[scene]) {
      console.error(`Baseline sourceScene mapping is unexpected for ${scene}: ${baselineMeta.sourceScene}`);
      pass = false;
    }
    if (!baselineMeta.layoutVersion || !baselineMeta.createdAt) {
      console.error(`Baseline metadata for ${scene} missing layoutVersion/createdAt.`);
      pass = false;
    }
    if (baselineMeta.layoutVersion !== styleConfig.contractVersion) {
      console.error(
        `Baseline layoutVersion mismatch for ${scene}: ${baselineMeta.layoutVersion} vs ${styleConfig.contractVersion}.`,
      );
      pass = false;
    }

    let quality: QualityResult = {
      pass: false,
      coverage: 0,
      meanLuma: 0,
      lumaSpread: 0,
      nonTransparentPixels: 0,
    };
    try {
      quality = assertRenderQuality(scene, currents[scene]);
    } catch (error) {
      pass = false;
      quality.pass = false;
      console.error(`Render quality failed for ${scene}.`);
      console.error(`- ${error instanceof Error ? error.message : String(error)}`);
      console.error(`- file=${path.relative(process.cwd(), currents[scene])}`);
    }

    const result = comparePngs(scene, currents[scene], GOLDENS[scene]);
    if (!quality.pass || !result.pass) {
      pass = false;
      console.error(`Visual regression failed for ${scene}.`);
      if (!quality.pass) {
        console.error(`- quality coverage=${(quality.coverage * 100).toFixed(2)}%`);
        console.error(`- quality meanLuma=${quality.meanLuma.toFixed(4)}`);
        console.error(`- quality lumaSpread=${quality.lumaSpread.toFixed(4)}`);
        console.error(`- quality nonTransparentPixels=${quality.nonTransparentPixels}`);
      }
      console.error(
        `- meanAbsPerChannel=${result.meanAbsPerChannel.toFixed(4)} (limit ${CONTRACTS[scene].maxMeanAbsPerChannel.toFixed(4)})`,
      );
      console.error(`- diffPixels=${result.diffPixels} (limit ${CONTRACTS[scene].maxDiffPixels})`);
      console.error(`- visibleCoverage=${(result.currentCoverage * 100).toFixed(2)}%`);
      console.error(`- goldenCoverage=${(result.goldenCoverage * 100).toFixed(2)}%`);
      console.error(
        `- coverageDelta=${(result.coverageDelta * 100).toFixed(2)}% (limit ${(CONTRACTS[scene].maxCoverageDelta ?? 0).toFixed(2)})`,
      );
      console.error(`- current=${path.relative(process.cwd(), currents[scene])}`);
      console.error(`- golden=${path.relative(process.cwd(), GOLDENS[scene])}`);
    } else {
      console.log(
        `Visual regression passed for ${scene}: meanAbsPerChannel=${result.meanAbsPerChannel.toFixed(4)} diffPixels=${result.diffPixels} ` +
          `visibleCoverage=${(result.currentCoverage * 100).toFixed(2)}% goldenCoverage=${(result.goldenCoverage * 100).toFixed(
            2,
          )}% coverageDelta=${(result.coverageDelta * 100).toFixed(2)}%`,
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
