import { CAMPAIGN_WORLD_LAYOUT } from '../core/constants';
import { SCRIPT_WORLD_DEFINITIONS, type ScriptWorldDefinition, type ScriptWorldId, getScriptStage } from '../content/scriptCampaign';
import { type MusicPresetKey } from './musicPresets';

export type AiMusicTrackKey = `world-${ScriptWorldId}` | `boss-${ScriptWorldId}` | 'title' | 'world-map';

export interface AiMusicTrackConfig {
  id: AiMusicTrackKey;
  fileName: string;
  url: string;
  prompt: string;
  durationSeconds: number;
}

export const AI_MUSIC_ENABLED_DEFAULT = true;

type GeneratedTrackConfig = Omit<AiMusicTrackConfig, 'url'>;

const WORLD_TRACK_DURATION_SECONDS = 68;
const BOSS_TRACK_DURATION_SECONDS = 62;
const TITLE_TRACK_DURATION_SECONDS = 46;
const WORLD_MAP_TRACK_DURATION_SECONDS = 58;
const AI_MUSIC_WORLD_FILE_COUNT = 7;

function worldTrackId(worldId: ScriptWorldId): AiMusicTrackKey {
  return `world-${worldId}` as AiMusicTrackKey;
}

function bossTrackId(worldId: ScriptWorldId): AiMusicTrackKey {
  return `boss-${worldId}` as AiMusicTrackKey;
}

function resolveTrackedWorld(worldId: number): ScriptWorldId {
  return Math.min(worldId, AI_MUSIC_WORLD_FILE_COUNT) as ScriptWorldId;
}

function worldTrackPrompt(world: ScriptWorldDefinition): string {
  return `Retro platformer AI soundtrack inspired by ${world.displayName}. Biome: ${world.biome}. ${world.subtitle} with bright chiptune leads, syncopated percussion, gliding arpeggios, and cinematic 8-bit textures. Keep it loopable, atmospheric, and no vocals.`;
}

function bossTrackPrompt(world: ScriptWorldDefinition, bossTitle: string): string {
  return `Intense boss encounter theme for ${world.displayName}. Major encounter: ${bossTitle}. Dark, dramatic, fast-paced retro chiptune with punchy bass, rising lead motifs, call-and-response synths, and decisive drums. Keep it epic but playful, no vocals, loop-ready.`;
}

function titleTrackPrompt(): string {
  return 'Opening title screen theme for a futuristic cyberpunk platformer called Super BART. Heroic chiptune lead line, warm analog pad wash, confident groove, and a sense of anticipation. No vocals, cinematic progression, loop-ready.';
}

function worldMapTrackPrompt(): string {
  return 'World map interface theme for a strategic cyberpunk platformer campaign screen. Upbeat but reflective retro chiptune with subtle 8-bit brass stabs, soft vinyl hiss, and evolving melodic hooks. Keep it loopable, atmospheric, and no vocals.';
}

const worldTracks: GeneratedTrackConfig[] = SCRIPT_WORLD_DEFINITIONS.map((world) => ({
  id: worldTrackId(world.id),
  fileName: `${worldTrackId(resolveTrackedWorld(world.id))}.flac`,
  durationSeconds: WORLD_TRACK_DURATION_SECONDS,
  prompt: worldTrackPrompt(world)
}));

const bossTracks: GeneratedTrackConfig[] = SCRIPT_WORLD_DEFINITIONS.map((world) => {
  const bossStage = getScriptStage(world.id, CAMPAIGN_WORLD_LAYOUT[world.id - 1] ?? 4);
  return {
    id: bossTrackId(world.id),
    fileName: `${bossTrackId(resolveTrackedWorld(world.id))}.flac`,
    durationSeconds: BOSS_TRACK_DURATION_SECONDS,
    prompt: bossTrackPrompt(world, bossStage.title)
  };
});

const specialTracks: GeneratedTrackConfig[] = [
  {
    id: 'title',
    fileName: 'title.flac',
    durationSeconds: TITLE_TRACK_DURATION_SECONDS,
    prompt: titleTrackPrompt()
  },
  {
    id: 'world-map',
    fileName: 'world-map.flac',
    durationSeconds: WORLD_MAP_TRACK_DURATION_SECONDS,
    prompt: worldMapTrackPrompt()
  }
];

const allTracks = [...worldTracks, ...bossTracks, ...specialTracks];

export const AI_MUSIC_TRACKS = Object.fromEntries(
  allTracks.map((track) => [
    track.id,
    {
      ...track,
      url: `/music/ai/${track.fileName}`
    } satisfies AiMusicTrackConfig
  ])
) as Record<AiMusicTrackKey, AiMusicTrackConfig>;

const LEGACY_PRESET_TO_AI_TRACK: Partial<Record<MusicPresetKey, AiMusicTrackKey>> = {
  azure: worldTrackId(1),
  pipeline: worldTrackId(2),
  enterprise: worldTrackId(3),
  gpu: worldTrackId(4),
  benchmark: worldTrackId(5),
};

export function getAiMusicTrack(track: MusicPresetKey | AiMusicTrackKey): AiMusicTrackConfig | null {
  const direct = AI_MUSIC_TRACKS[track as AiMusicTrackKey];
  if (direct) {
    return direct;
  }

  const legacyTrack = LEGACY_PRESET_TO_AI_TRACK[track as MusicPresetKey];
  if (!legacyTrack) {
    return null;
  }

  return AI_MUSIC_TRACKS[legacyTrack] ?? null;
}
