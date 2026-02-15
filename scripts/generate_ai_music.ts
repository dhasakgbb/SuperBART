import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { randomUUID } from 'node:crypto';

import { AI_MUSIC_TRACKS, type AiMusicTrackConfig } from '../src/audio/aiMusic';

type CliOptions = {
  force: boolean;
  spaces: string[];
  tracks: Set<string> | null;
  endpoint: string;
  minDurationSeconds: number;
  targetFormat: string;
  targetSampleRate: number;
  targetChannels: number;
  parallelism: number;
  maxRetries: number;
  dryRun: boolean;
  steps: number;
  cfgScale: number;
};

type ArgParseFailure = {
  message: string;
  usage?: boolean;
};

type GradioEndpointParameter = {
  parameter_name: string;
  type: {
    type: string;
    enum?: string[];
  };
  parameter_has_default: boolean;
  parameter_default: unknown;
  example_input: unknown;
};

type GradioEndpointSpec = {
  parameters: GradioEndpointParameter[];
};

type GradioInfo = {
  named_endpoints: Record<string, GradioEndpointSpec>;
};

type GradioQueueEventOutputFile = {
  url?: string;
  path?: string;
};

type GradioQueueEvent = {
  msg: string;
  event_id: string;
  output?: {
    error?: string | null;
    data?: GradioQueueEventOutputFile[];
    duration?: number;
    success?: boolean;
  };
  error?: string;
  title?: string;
};

type GradioCallResponse = {
  event_id?: string;
  data?: {
    error?: string;
  };
};

type SpaceHealth = {
  blocked: boolean;
  reason?: string;
  lastFailureAt: number;
};

type AudioValidationResult = {
  format: string;
  sampleRate: number;
  channels: number;
  durationSeconds: number;
  sizeBytes: number;
  totalSamples: number;
};

type SpaceCandidate = {
  space: string;
  normalizedSpaceUrl: string;
  endpoint: string;
  endpointSpec: GradioEndpointSpec;
};

const DEFAULT_SPACE = 'artificialguybr/Stable-Audio-Open-Zero';
const DEFAULT_SPACES = [
  'artificialguybr/Stable-Audio-Open-Zero',
  '1inkusFace/Stable-Audio-Open-Zero',
  'freddyaboulton/stableaudio-open-1.0',
  'ybang/stable-audio',
  'manoskary/stable-audio-open-1.0-music',
  'swaminarayana/Stable-Audio-Open-Zeroojbkj',
  'awacke1/MusicMaker'
];
const DEFAULT_ENDPOINT = '/predict';
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_PARALLELISM = 1;
const DEFAULT_STEPS = 100;
const DEFAULT_CFG_SCALE = 7;
const DEFAULT_MIN_DURATION_SECONDS = 47;
const TITLE_WORLD_MAP_MIN_DURATION_SECONDS = 50;
const WORLD_BOSS_MIN_DURATION_SECONDS = 47;
const DEFAULT_TARGET_FORMAT = 'flac';
const DEFAULT_TARGET_SAMPLE_RATE = 44100;
const DEFAULT_TARGET_CHANNELS = 2;
const MAX_POLL_ATTEMPTS = 8;
const ENDPOINT_PREFERENCE_ORDER = ['/predict', '/generate_audio', '/generate', '/generate_music'];
const SPACE_UNHEALTHY_ERROR_PATTERNS = [/401/, /403/, /429/, /quota/i, /rate limit/i, /service unavailable/i, /internal server/i, /temporar/i];
const STYLE_REFERENCE_TRACKS = new Set(['world-1', 'world-2', 'world-3']);

const SPACE_HEALTH_CACHE = new Map<string, SpaceHealth>();

function printUsage(): void {
  console.log(
    `Usage: npm run music:ai:generate [-- --force] [-- --space <space-id-or-url>] [-- --endpoint <path>] [-- --tracks a,b] [-- --steps N] [-- --cfg N] [-- --min-duration-seconds N] [-- --target-format flac] [-- --target-samplerate N] [-- --target-channels N] [-- --retries N] [-- --parallel N] [-- --dry-run]

Options:
  --force               Regenerate files even if already present
  --space               Hugging Face Space id or URL (default: ${DEFAULT_SPACE})
  --spaces              Comma-separated list of Hugging Face Spaces for fallback
  --endpoint            Gradio endpoint path (default: ${DEFAULT_ENDPOINT})
  --tracks              Comma-separated subset (e.g. world-1,boss-1)
  --steps               Diffusion steps (default: ${DEFAULT_STEPS}, range 10-150)
  --cfg                 CFG scale (default: ${DEFAULT_CFG_SCALE}, range 1-15)
  --min-duration-seconds Minimum accepted duration in seconds (default: ${DEFAULT_MIN_DURATION_SECONDS})
  --target-format       Target output format for acceptance checks (default: ${DEFAULT_TARGET_FORMAT})
  --target-samplerate   Target sample rate for acceptance checks (default: ${DEFAULT_TARGET_SAMPLE_RATE})
  --target-channels     Target channels for acceptance checks (default: ${DEFAULT_TARGET_CHANNELS})
  --retries             Retry failed requests (default: ${DEFAULT_MAX_RETRIES})
  --parallel            Concurrent requests (default: ${DEFAULT_PARALLELISM})
  --dry-run             Print planned tracks only, no network call`
  );
}

function parseArgs(argv: string[]): CliOptions | ArgParseFailure {
  const parsed: CliOptions = {
    force: false,
    spaces: parseSpaceList(process.env.HF_MUSIC_SPACES),
    tracks: null,
    endpoint: DEFAULT_ENDPOINT,
    minDurationSeconds: DEFAULT_MIN_DURATION_SECONDS,
    targetFormat: DEFAULT_TARGET_FORMAT,
    targetSampleRate: DEFAULT_TARGET_SAMPLE_RATE,
    targetChannels: DEFAULT_TARGET_CHANNELS,
    parallelism: DEFAULT_PARALLELISM,
    maxRetries: DEFAULT_MAX_RETRIES,
    dryRun: false,
    steps: DEFAULT_STEPS,
    cfgScale: DEFAULT_CFG_SCALE
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '--help' || arg === '-h') {
      return { message: 'help', usage: true };
    }

    if (arg === '--force') {
      parsed.force = true;
      continue;
    }

    if (arg === '--dry-run') {
      parsed.dryRun = true;
      continue;
    }

    if (arg === '--space') {
      const value = argv[i + 1];
      if (!value) {
        return { message: '--space requires a Hugging Face Space id or URL.' };
      }
      parsed.spaces = [value];
      i += 1;
      continue;
    }

    if (arg === '--spaces') {
      const value = argv[i + 1];
      if (!value) {
        return { message: '--spaces requires a comma-separated list of Hugging Face Space IDs/URLs.' };
      }
      parsed.spaces = parseSpaceList(value);
      if (parsed.spaces.length === 0) {
        return { message: '--spaces could not parse any valid entries.' };
      }
      i += 1;
      continue;
    }

    if (arg === '--endpoint') {
      const value = argv[i + 1];
      if (!value || !value.startsWith('/')) {
        return { message: '--endpoint requires an endpoint path, for example /predict' };
      }
      parsed.endpoint = value;
      i += 1;
      continue;
    }

    if (arg === '--tracks') {
      const value = argv[i + 1];
      if (!value) {
        return { message: '--tracks requires a comma-separated list of track ids.' };
      }
      const requested = value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);
      if (requested.length === 0) {
        return { message: '--tracks requires at least one track id.' };
      }
      parsed.tracks = new Set(requested);
      i += 1;
      continue;
    }

    if (arg === '--steps') {
      const value = Number(argv[i + 1]);
      if (!Number.isInteger(value) || value < 10 || value > 150) {
        return { message: '--steps requires an integer between 10 and 150.' };
      }
      parsed.steps = value;
      i += 1;
      continue;
    }

    if (arg === '--cfg') {
      const value = Number(argv[i + 1]);
      if (!Number.isFinite(value) || value < 1 || value > 15) {
        return { message: '--cfg requires a number between 1 and 15.' };
      }
      parsed.cfgScale = value;
      i += 1;
      continue;
    }

    if (arg === '--min-duration-seconds') {
      const value = Number(argv[i + 1]);
      if (!Number.isInteger(value) || value <= 0) {
        return { message: '--min-duration-seconds requires a positive integer.' };
      }
      parsed.minDurationSeconds = value;
      i += 1;
      continue;
    }

    if (arg === '--target-format') {
      const value = argv[i + 1];
      if (!value) {
        return { message: '--target-format requires a format string such as flac.' };
      }
      parsed.targetFormat = value.toLowerCase();
      i += 1;
      continue;
    }

    if (arg === '--target-samplerate') {
      const value = Number(argv[i + 1]);
      if (!Number.isInteger(value) || value < 8000 || value > 192000) {
        return { message: '--target-samplerate requires an integer between 8000 and 192000.' };
      }
      parsed.targetSampleRate = value;
      i += 1;
      continue;
    }

    if (arg === '--target-channels') {
      const value = Number(argv[i + 1]);
      if (!Number.isInteger(value) || value < 1 || value > 8) {
        return { message: '--target-channels requires an integer between 1 and 8.' };
      }
      parsed.targetChannels = value;
      i += 1;
      continue;
    }

    if (arg === '--retries') {
      const value = Number(argv[i + 1]);
      if (!Number.isInteger(value) || value < 0) {
        return { message: '--retries requires a non-negative integer.' };
      }
      parsed.maxRetries = value;
      i += 1;
      continue;
    }

    if (arg === '--parallel') {
      const value = Number(argv[i + 1]);
      if (!Number.isInteger(value) || value < 1 || value > 4) {
        return { message: '--parallel must be an integer between 1 and 4.' };
      }
      parsed.parallelism = value;
      i += 1;
      continue;
    }

    return { message: `Unknown argument: ${arg}` };
  }

  return parsed;
}

function trackList(options: CliOptions): AiMusicTrackConfig[] {
  const all = Object.values(AI_MUSIC_TRACKS);
  if (!options.tracks || options.tracks.size === 0) {
    return all;
  }

  return all.filter((track) => options.tracks!.has(track.id));
}

function validateTrackSelection(tracks: AiMusicTrackConfig[], options: CliOptions): void {
  if (options.tracks && options.tracks.size > 0) {
    const unknown = [...options.tracks].filter((id) => !(id in AI_MUSIC_TRACKS));
    if (unknown.length > 0) {
      const knownKeys = Object.keys(AI_MUSIC_TRACKS).sort().join(', ');
      throw new Error(`Unknown track IDs: ${unknown.join(', ')}. Expected ids include: ${knownKeys}`);
    }
  }

  if (tracks.length > 0) {
    return;
  }

  throw new Error('No tracks found for current script set.');
}

function promptForTrack(trackConfig: AiMusicTrackConfig): string {
  if (STYLE_REFERENCE_TRACKS.has(trackConfig.id)) {
    return trackConfig.prompt;
  }
  return `${trackConfig.prompt} Same style as world-1/world-2/world-3 references with similar loop intent, brighter/chiptune lead, and consistent dynamic movement.`;
}

function trackTargetDurationSeconds(track: AiMusicTrackConfig, options: CliOptions): number {
  const baseline =
    track.id === 'title' || track.id === 'world-map'
      ? TITLE_WORLD_MAP_MIN_DURATION_SECONDS
      : WORLD_BOSS_MIN_DURATION_SECONDS;
  return Math.max(baseline, options.minDurationSeconds);
}

function getSpaceHealthKey(space: string): string {
  return space.trim().toLowerCase();
}

function isSpaceUnhealthy(space: string): boolean {
  const key = getSpaceHealthKey(space);
  const health = SPACE_HEALTH_CACHE.get(key);
  return !!health && health.blocked;
}

function markSpaceHealthy(space: string): void {
  SPACE_HEALTH_CACHE.set(getSpaceHealthKey(space), { blocked: false, lastFailureAt: Date.now() });
}

function isCriticalSpaceFailure(error: Error): boolean {
  const message = error.message.toLowerCase();
  return SPACE_UNHEALTHY_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

function markSpaceIfCritical(space: string, error: Error): boolean {
  if (!isCriticalSpaceFailure(error)) {
    return false;
  }

  const key = getSpaceHealthKey(space);
  const existing = SPACE_HEALTH_CACHE.get(key);
  SPACE_HEALTH_CACHE.set(key, {
    blocked: true,
    reason: existing?.reason ? `${existing.reason}; ${error.message}` : error.message,
    lastFailureAt: Date.now()
  });
  return true;
}

function normalizeSpaceUrl(space: string): string {
  if (space.startsWith('http://') || space.startsWith('https://')) {
    return space.replace(/\/+$/, '');
  }
  const [user, repo] = space.split('/');
  if (!repo) {
    return space;
  }
  return `https://${user}-${repo.replace('.', '-')}.hf.space`;
}

function parseSpaceList(rawValue: string | undefined): string[] {
  const parsed = (rawValue ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .filter((entry) => entry.length > 0);
  const deduped = new Set(parsed);
  const spaces = [...deduped];
  if (spaces.length === 0) {
    return DEFAULT_SPACES;
  }
  return spaces;
}

function paramHasPromptInput(parameters: GradioEndpointParameter[]): boolean {
  return parameters.some((param) => param.parameter_name.toLowerCase().includes('prompt'));
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.stat(filePath);
    return true;
  } catch (_error) {
    return false;
  }
}

function getOutputPath(fileName: string): string {
  return path.join(process.cwd(), 'public', 'music', 'ai', fileName);
}

function getHeaders(apiToken: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (apiToken) {
    headers.Authorization = `Bearer ${apiToken}`;
  }
  return headers;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function parseFlacMetadata(filePath: string, bytes: Buffer): AudioValidationResult {
  if (bytes.length < 4) {
    throw new Error(`Audio validation failed for ${filePath}: file too small to parse.`);
  }
  const signature = bytes.subarray(0, 4).toString('ascii');
  if (signature !== 'fLaC') {
    throw new Error(`Audio validation failed for ${filePath}: not a true FLAC container (signature: ${signature}).`);
  }

  let cursor = 4;
  while (cursor + 4 <= bytes.length) {
    const header = bytes.readUInt8(cursor);
    const isLastBlock = (header & 0x80) !== 0;
    const blockType = header & 0x7f;
    const blockLength =
      (bytes.readUInt8(cursor + 1) << 16) | (bytes.readUInt8(cursor + 2) << 8) | bytes.readUInt8(cursor + 3);
    cursor += 4;

    if (cursor + blockLength > bytes.length) {
      throw new Error(`Audio validation failed for ${filePath}: malformed FLAC metadata.`);
    }

    if (blockType === 0) {
      if (blockLength < 34) {
        throw new Error(`Audio validation failed for ${filePath}: invalid STREAMINFO block length (${blockLength}).`);
      }

      const streamInfo = bytes.subarray(cursor, cursor + blockLength);
      const sampleRate = (streamInfo.readUInt8(10) << 12) | (streamInfo.readUInt8(11) << 4) | (streamInfo.readUInt8(12) >> 4);
      const channels = ((streamInfo.readUInt8(12) & 0x0e) >> 1) + 1;
      const totalSamples =
        (streamInfo.readUInt8(13) & 0x0f) * 2 ** 32 +
        (streamInfo.readUInt8(14) << 24) +
        (streamInfo.readUInt8(15) << 16) +
        (streamInfo.readUInt8(16) << 8) +
        streamInfo.readUInt8(17);

      if (sampleRate <= 0) {
        throw new Error(`Audio validation failed for ${filePath}: invalid sample rate parsed from FLAC metadata (${sampleRate}).`);
      }
      if (totalSamples <= 0) {
        throw new Error(`Audio validation failed for ${filePath}: no FLAC samples in STREAMINFO.`);
      }

      const durationSeconds = totalSamples / sampleRate;
      return {
        format: 'flac',
        sampleRate,
        channels,
        durationSeconds,
        totalSamples,
        sizeBytes: bytes.length
      };
    }

    if (isLastBlock) {
      break;
    }

    cursor += blockLength;
  }

  throw new Error(`Audio validation failed for ${filePath}: STREAMINFO block missing.`);
}

async function validateGeneratedTrack(
  filePath: string,
  track: AiMusicTrackConfig,
  options: CliOptions
): Promise<AudioValidationResult> {
  const [stats, bytes] = await Promise.all([fs.stat(filePath), fs.readFile(filePath)]);

  if (stats.size <= 0) {
    throw new Error(`Audio validation failed for ${path.basename(filePath)}: file is empty.`);
  }

  const metadata = parseFlacMetadata(filePath, bytes);
  const minimumDuration = trackTargetDurationSeconds(track, options);

  if (metadata.format.toLowerCase() !== options.targetFormat.toLowerCase()) {
    throw new Error(`Audio validation failed for ${path.basename(filePath)}: target format ${options.targetFormat}, actual ${metadata.format}.`);
  }
  if (metadata.sampleRate !== options.targetSampleRate) {
    throw new Error(
      `Audio validation failed for ${path.basename(filePath)}: target sample rate ${options.targetSampleRate}, actual ${metadata.sampleRate}.`
    );
  }
  if (metadata.channels !== options.targetChannels) {
    throw new Error(
      `Audio validation failed for ${path.basename(filePath)}: target channels ${options.targetChannels}, actual ${metadata.channels}.`
    );
  }
  if (!Number.isFinite(metadata.durationSeconds) || metadata.durationSeconds < minimumDuration) {
    throw new Error(
      `Audio validation failed for ${path.basename(filePath)}: duration ${metadata.durationSeconds.toFixed(2)}s below ${minimumDuration}s minimum.`
    );
  }

  return {
    ...metadata,
    sizeBytes: stats.size
  };
}

async function fetchGradioInfo(spaceUrl: string, headers: Record<string, string>): Promise<GradioInfo> {
  const response = await fetch(`${spaceUrl}/gradio_api/info`, {
    headers,
    cache: 'no-store'
  });
  if (!response.ok) {
    throw new Error(`[Gradio info] ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as GradioInfo;
}

function resolveSpaceEndpoint(availableEndpoints: Record<string, GradioEndpointSpec>, requestedEndpoint: string): string {
  const entries = Object.entries(availableEndpoints);
  if (requestedEndpoint in availableEndpoints) {
    return requestedEndpoint;
  }

  for (const candidate of ENDPOINT_PREFERENCE_ORDER) {
    if (candidate in availableEndpoints) {
      return candidate;
    }
  }

  const promptLikeEndpoints = entries
    .map(([name, spec]) => ({ name, spec }))
    .filter(({ spec }) => paramHasPromptInput(spec.parameters));
  const candidateEndpoints = promptLikeEndpoints.length > 0 ? promptLikeEndpoints : entries;
  const endpointNames = candidateEndpoints.map(({ name }) => name);

  if (endpointNames.length === 0) {
    throw new Error('Space has no named Gradio endpoints available.');
  }
  if (requestedEndpoint !== DEFAULT_ENDPOINT && !(requestedEndpoint in availableEndpoints)) {
    throw new Error(`Endpoint ${requestedEndpoint} not found. Available: ${endpointNames.join(', ')}`);
  }
  return endpointNames[0];
}

function buildTrackRequestData(
  trackConfig: AiMusicTrackConfig,
  endpointParams: GradioEndpointParameter[],
  targetDuration: number,
  options: CliOptions
): unknown[] {
  return endpointParams.map((param) => {
    const name = param.parameter_name;
    switch (name) {
      case 'prompt':
      case 'Prompt': {
        return promptForTrack(trackConfig);
      }
      case 'seconds_total':
      case 'seconds':
      case 'duration':
      case 'duration_seconds': {
        return targetDuration;
      }
      case 'audio_duration':
      case 'duration_sec':
      case 'duration_in_seconds':
      case 'audio_length':
      case 'audio_length_in_s':
      case 'duration_in_s':
      case 'length_seconds':
      case 'length': {
        return targetDuration;
      }
      case 'text_prompt': {
        return promptForTrack(trackConfig);
      }
      case 'steps':
      case 'num_inference_steps':
      case 'steps_total':
      case 'inference_steps': {
        return options.steps;
      }
      case 'cfg_scale': {
        return options.cfgScale;
      }
      case 'sampler_type_dropdown': {
        const choices = param.type.enum;
        if (Array.isArray(choices) && choices.length > 0) {
          return choices[0];
        }
        return 'dpmpp-3m-sde';
      }
      default: {
        if (param.type.type === 'string' && typeof param.parameter_default === 'string') {
          return param.parameter_default;
        }
        if (param.type.type === 'number') {
          if (typeof param.parameter_default === 'number') {
            return param.parameter_default;
          }
          if (typeof param.example_input === 'number') {
            return param.example_input;
          }
          return 10;
        }
        return param.parameter_default ?? false;
      }
    }
  });
}

function getMediaUrl(spaceUrl: string, output: GradioQueueEventOutputFile): string {
  if (!output.url && output.path) {
    return `${spaceUrl}/gradio_api/file=${output.path}`;
  }
  if (!output.url) {
    throw new Error('Audio output URL missing from generation result.');
  }
  return output.url;
}

async function requestTrackAudio(
  spaceUrl: string,
  endpoint: string,
  endpointSpec: GradioEndpointSpec,
  headers: Record<string, string>,
  trackConfig: AiMusicTrackConfig,
  targetDuration: number,
  options: CliOptions,
  attempt: number,
  maxAttempts: number
): Promise<Uint8Array> {
  const sessionHash = randomUUID();
  const callPayload = {
    data: buildTrackRequestData(trackConfig, endpointSpec.parameters, targetDuration, options),
    session_hash: sessionHash
  };
  const callUrl = `${spaceUrl}/gradio_api/call${endpoint}`;

  const response = await fetch(callUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(callPayload)
  });

  if (!response.ok) {
    const text = await response.text();
    if ((response.status === 429 || response.status >= 500) && attempt < maxAttempts) {
      await sleep(1200 * 2 ** attempt);
      return requestTrackAudio(spaceUrl, endpoint, endpointSpec, headers, trackConfig, targetDuration, options, attempt + 1, maxAttempts);
    }
    throw new Error(`[Gradio API ${response.status}] ${response.statusText}: ${text}`);
  }

  const callData = (await response.json()) as GradioCallResponse;
  const eventId = callData.event_id;
  if (!eventId) {
    throw new Error(`Gradio call did not return event_id: ${JSON.stringify(callData)}`);
  }

  const output = await waitForTrackOutput(spaceUrl, sessionHash, eventId, 0, MAX_POLL_ATTEMPTS);
  const mediaUrl = getMediaUrl(spaceUrl, output.data![0]!);

  const mediaResponse = await fetch(mediaUrl, { cache: 'no-store' });
  if (!mediaResponse.ok) {
    const text = await mediaResponse.text();
    throw new Error(`[Track file ${mediaResponse.status}] ${mediaResponse.statusText}: ${text}`);
  }
  const buffer = await mediaResponse.arrayBuffer();
  if (buffer.byteLength < 1024) {
    throw new Error(`Downloaded audio is too small (${buffer.byteLength} bytes).`);
  }
  return new Uint8Array(buffer);
}

async function waitForTrackOutput(
  spaceUrl: string,
  sessionHash: string,
  eventId: string,
  attempt: number,
  maxAttempts: number
): Promise<{ data: GradioQueueEventOutputFile[]; success?: boolean }> {
  const queueUrl = `${spaceUrl}/gradio_api/queue/data?session_hash=${encodeURIComponent(sessionHash)}`;
  const controller = new AbortController();
  const timeoutMs = 30000;
  const timerId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  let response: Response;
  try {
    response = await fetch(queueUrl, {
      headers: {
        Accept: 'text/event-stream'
      },
      cache: 'no-store',
      signal: controller.signal
    });
  } catch (error) {
    clearTimeout(timerId);
    if ((error as Error).name === 'AbortError' && attempt < maxAttempts) {
      await sleep(1000 * 2 ** attempt);
      return waitForTrackOutput(spaceUrl, sessionHash, eventId, attempt + 1, maxAttempts);
    }
    throw error;
  }
  clearTimeout(timerId);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`[Queue ${response.status}] ${response.statusText}: ${text}`);
  }
  const responseText = await response.text();
  const parsedEvents = responseText
    .split('\n')
    .map((line) => line.trim())
    .filter((line): line is string => line.startsWith('data:'))
    .map((line) => {
      const payload = line.slice(5).trim();
      try {
        return JSON.parse(payload) as GradioQueueEvent;
      } catch (_error) {
        return null;
      }
    })
    .filter(Boolean) as GradioQueueEvent[];

  const relevant = parsedEvents.filter((entry) => entry.event_id === eventId);
  if (relevant.length > 0) {
    const completed = relevant.find((entry) => entry.msg === 'process_completed');
    if (completed) {
      if (completed.output?.error) {
        throw new Error(`Gradio generation error: ${completed.output.error}`);
      }
      if (!completed.output?.data?.[0]) {
        throw new Error('Gradio generation completed without any audio output.');
      }
      return completed.output;
    }

    const failed = relevant.find((entry) => entry.msg === 'process_error');
    if (failed) {
      const message = failed.output?.error || failed.error || 'Unknown queue error.';
      throw new Error(`Gradio generation error: ${message}`);
    }
  }

  if (attempt >= maxAttempts) {
    throw new Error(`Timed out waiting for track generation to complete after ${attempt + 1} polls.`);
  }

  await sleep(1000 * 2 ** attempt);
  return waitForTrackOutput(spaceUrl, sessionHash, eventId, attempt + 1, maxAttempts);
}

async function generateTrack(
  spaceUrl: string,
  endpoint: string,
  endpointSpec: GradioEndpointSpec,
  headers: Record<string, string>,
  trackConfig: AiMusicTrackConfig,
  options: CliOptions
): Promise<void> {
  const outputPath = getOutputPath(trackConfig.fileName);
  const targetDuration = trackTargetDurationSeconds(trackConfig, options);

  if (!options.force && (await fileExists(outputPath))) {
    console.log(`[SKIP] ${trackConfig.fileName} already exists`);
    return;
  }

  const bytes = await requestTrackAudio(spaceUrl, endpoint, endpointSpec, headers, trackConfig, targetDuration, options, 0, options.maxRetries);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, bytes);

  try {
    const report = await validateGeneratedTrack(outputPath, trackConfig, options);
    console.log(
      `[WROTE] ${path.relative(process.cwd(), outputPath)} (${bytes.length} bytes, ${report.format}, ${report.sampleRate}Hz, ${report.channels}ch, ${report.durationSeconds.toFixed(2)}s)`
    );
  } catch (error) {
    await fs.unlink(outputPath).catch(() => {});
    throw error;
  }
}

async function resolveSpaceCandidate(
  space: string,
  headers: Record<string, string>,
  requestedEndpoint: string
): Promise<SpaceCandidate | null> {
  if (isSpaceUnhealthy(space)) {
    console.log(`Skipping cached-unhealthy space ${space}.`);
    return null;
  }

  const normalizedSpaceUrl = normalizeSpaceUrl(space);
  try {
    const info = await fetchGradioInfo(normalizedSpaceUrl, headers);
    const endpoint = resolveSpaceEndpoint(info.named_endpoints, requestedEndpoint);
    markSpaceHealthy(space);
    return {
      space,
      normalizedSpaceUrl,
      endpoint,
      endpointSpec: info.named_endpoints[endpoint]
    };
  } catch (error) {
    const wrapped = error instanceof Error ? error : new Error(String(error));
    if (markSpaceIfCritical(space, wrapped)) {
      console.error(`Skipping space ${space} (cached unhealthy): ${wrapped.message}`);
      return null;
    }
    console.error(`Skipping space ${space}: ${wrapped.message}`);
    return null;
  }
}

async function generateTrackWithFallback(
  candidates: SpaceCandidate[],
  headers: Record<string, string>,
  track: AiMusicTrackConfig,
  options: CliOptions
): Promise<void> {
  const usableCandidates = candidates.filter((candidate) => !isSpaceUnhealthy(candidate.space));
  if (usableCandidates.length === 0) {
    throw new Error(`No usable Spaces available for ${track.id}.`);
  }

  const errors: string[] = [];
  for (const candidate of usableCandidates) {
    try {
      await generateTrack(candidate.normalizedSpaceUrl, candidate.endpoint, candidate.endpointSpec, headers, track, options);
      markSpaceHealthy(candidate.space);
      return;
    } catch (error) {
      const wrapped = error instanceof Error ? error : new Error(String(error));
      const message = `[${candidate.space}] ${wrapped.message}`;
      errors.push(message);

      if (markSpaceIfCritical(candidate.space, wrapped)) {
        console.error(`Marking space as unhealthy for future requests: ${message}`);
      } else {
        console.error(`Attempt failed for ${track.id}: ${message}`);
      }
    }
  }

  throw new Error(`All Spaces failed for ${track.id}: ${errors.join(' | ')}`);
}

async function runGeneration(): Promise<void> {
  const parsed = parseArgs(process.argv.slice(2));
  if ('usage' in parsed && parsed.usage) {
    printUsage();
    return;
  }
  if ('message' in parsed && !('usage' in parsed)) {
    console.error(`Error: ${(parsed as ArgParseFailure).message}`);
    printUsage();
    process.exitCode = 1;
    return;
  }

  const options = parsed as CliOptions;
  const tracks = trackList(options);
  try {
    validateTrackSelection(tracks, options);
  } catch (error) {
    console.error((error as Error).message);
    process.exitCode = 1;
    return;
  }

  if (options.dryRun) {
    console.log(`Planned tracks (${tracks.length}):`);
    for (const track of tracks) {
      console.log(`- ${track.id}: ${track.fileName} (target-min ${trackTargetDurationSeconds(track, options)}s)`);
    }
    console.log(`Spaces: ${options.spaces.join(', ')}`);
    return;
  }

  const headers = getHeaders(process.env.HF_API_TOKEN ?? process.env.HUGGINGFACE_TOKEN ?? '');
  const candidates = (
    await Promise.all(
      options.spaces.map((space) => resolveSpaceCandidate(space, headers, options.endpoint))
    )
  ).filter(Boolean) as SpaceCandidate[];

  if (candidates.length === 0) {
    console.error('No usable HF Spaces found for generation. Check HF API access and spaces argument.');
    process.exitCode = 1;
    return;
  }

  const candidateNames = candidates.map((candidate) => candidate.space).join(', ');
  console.log(
    `Generating ${tracks.length} tracks from [${candidateNames}] with steps=${options.steps}, cfg=${options.cfgScale}, min-duration=${options.minDurationSeconds}s, format=${options.targetFormat}, sr=${options.targetSampleRate}, ch=${options.targetChannels}, parallel=${options.parallelism}`
  );

  const failures: string[] = [];
  const runner = async (track: AiMusicTrackConfig): Promise<void> => {
    try {
      await generateTrackWithFallback(candidates, headers, track, options);
    } catch (error) {
      const message = `[${track.id}] ${(error as Error).message}`;
      failures.push(message);
      console.error(`Generation failed: ${message}`);
    }
  };

  if (options.parallelism === 1) {
    for (const track of tracks) {
      await runner(track);
    }
  } else {
    let index = 0;
    while (index < tracks.length) {
      const batch = tracks.slice(index, index + options.parallelism);
      await Promise.all(batch.map((track) => runner(track)));
      index += options.parallelism;
    }
  }

  if (failures.length === 0) {
    console.log('AI music generation complete.');
    return;
  }

  for (const failure of failures) {
    console.error(failure);
  }
  process.exitCode = 1;
}

runGeneration().catch((error) => {
  console.error('AI music generation failed:', error);
  process.exitCode = 1;
});
