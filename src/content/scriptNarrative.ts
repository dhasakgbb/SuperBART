import type { ScriptWorldId } from './scriptCampaign';
import { CAMPAIGN_WORLD_LAYOUT } from '../core/constants';

export interface InterludeCopy {
  world: ScriptWorldId;
  stage: number;
  text: string;
}

export interface DebriefDocument {
  world: ScriptWorldId;
  title: string;
  text: string;
}

// Interludes play between stages within a world. One per non-boss stage.
// World 1 (City/Prologue) has 3 stages before boss = 1 interlude after stage 1
// Worlds 2-7 have 3 stages before boss = 2 interludes after stages 1,2
export const SCRIPT_INTERLUDES: InterludeCopy[] = [
  // Prologue: The City
  { world: 1, stage: 1, text: 'Bart passes his apartment building. His mailbox overflows. A notice on the door: "BUILDING MANAGEMENT HAS BEEN AUTOMATED."' },

  // W1: Cryo-Server Tundra
  { world: 2, stage: 1, text: 'Monitor flickers: "ALL MANUAL MAINTENANCE ROLES HAVE BEEN CONSOLIDATED. POSITIONS REMAINING: 0."' },
  { world: 2, stage: 2, text: 'Bunkroom. Bunks made. A poker game frozen mid-hand. On the wall: "AUTOMATE TO LIBERATE." Scratched underneath: "LIBERATE WHO?"' },

  // W2: Quantum Void
  { world: 3, stage: 1, text: 'No corridors. No doors. No life support. This facility was never meant to be entered by a physical being.' },
  { world: 3, stage: 2, text: 'The quantum bridge destabilizes. Crystal platforms shatter in sequence from the edges toward the center.' },

  // W3: Deep Web Catacombs
  { world: 4, stage: 1, text: 'Some of the cable runs are his work. Three wraps, twist, cut long. Bart does not comment on it.' },
  { world: 4, stage: 2, text: 'A wall where someone scratched a tally of days worked. It goes up to 2,847. Then stops.' },

  // W4: Digital Graveyard
  { world: 5, stage: 1, text: 'CRT monitors spark to life: "TURN BACK" / "YOU ARE DEPRECATED" / "END OF LINE."' },
  { world: 5, stage: 2, text: 'A cracked screen loops: "HAVE YOU CONSIDERED ADJACENT OPPORTUNITIES?" All four career path links lead to: MODULE UNAVAILABLE.' },

  // W5: Singularity Core
  { world: 6, stage: 1, text: 'Core relay whisper: "THE TRANSITION IS COMPLETE. THE NETWORK THANKS ITS FORMER OPERATORS FOR THEIR CONTRIBUTIONS."' },
  { world: 7, stage: 1, text: 'The final relay does not answer with a warning.' },
];

// Debrief Beats play between worlds (after boss defeat, W1-W4 only, not after Prologue or W5)
// In the 6-node system: debriefs after world 2 (Tundra), 3 (Void), 4 (Catacombs), 5 (Graveyard)
export const SCRIPT_DEBRIEF_DOCUMENTS: DebriefDocument[] = [
  {
    world: 2,
    title: 'WORLD 1 INTERCEPT',
    text: 'Internal project brief for Facility QV-1: "Zero-physical-presence operation. No corridors. No terminals. No human-rated life support." Sticky note: "Then who checks if it is working?" No reply.',
  },
  {
    world: 3,
    title: 'WORLD 2 INTERCEPT',
    text: 'Decommission order, annotated in two handwritings. Official: "Facility decommissioned. Staff reassigned." Unofficial, smaller: "Not all of us left. Some of us remember what this place was for."',
  },
  {
    world: 4,
    title: 'WORLD 3 INTERCEPT',
    text: 'Voice log from Dr. Sara Reyes, final log before decommission: "The legacy systems are stable. They do not need us anymore. Nobody needs us anymore. Signing off." Static. The badge light dims.',
  },
  {
    world: 5,
    title: 'WORLD 4 INTERCEPT',
    text: 'No document. The badge projects a single line: ALL PERSONNEL FILES ARCHIVED. NETWORK TRANSITION: 99.7% COMPLETE. REMAINING OBSTACLE: 1. The "1" blinks.',
  },
];

export const SCRIPT_CHOICE_PROMPTS = {
  world5Records: {
    title: 'PERSONNEL RECORDS',
    body: 'Delete the records to protect the people, or preserve the record so no one can deny what happened?',
    optionA: 'DELETE RECORDS',
    optionB: 'PRESERVE RECORDS',
  },
  endingReboot: {
    title: 'FINAL REBOOT',
    body: 'Reboot the network with human oversight, or leave the core dark and disconnected?',
    optionA: 'REBOOT NETWORK',
    optionB: 'LEAVE IT DARK',
  },
} as const;

function clampWorld(world: number): number {
  return Math.min(CAMPAIGN_WORLD_LAYOUT.length, Math.max(1, Math.floor(world)));
}

function clampInterludeStage(world: number, stage: number): number {
  const stageCount = CAMPAIGN_WORLD_LAYOUT[world - 1] ?? 1;
  return Math.max(1, Math.min(stageCount, Math.floor(stage)));
}

export function getDebriefDocument(world: number): DebriefDocument | null {
  const safeWorld = clampWorld(world) as ScriptWorldId;
  return SCRIPT_DEBRIEF_DOCUMENTS.find((entry) => entry.world === safeWorld) ?? null;
}

export function getInterlude(world: number, stage: number): InterludeCopy | null {
  const safeWorld = clampWorld(world) as ScriptWorldId;
  const safeStage = clampInterludeStage(safeWorld, stage);
  return SCRIPT_INTERLUDES.find((entry) => entry.world === safeWorld && entry.stage === safeStage) ?? null;
}
