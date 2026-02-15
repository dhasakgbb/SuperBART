// Per-world monitor messages from SCRIPT.md V4
// These display on terminal entities in-game when player is nearby

export interface MonitorMessage {
  world: number;
  text: string;
}

export const MONITOR_MESSAGES: MonitorMessage[] = [
  {
    world: 1,
    text: 'MUNICIPAL SYSTEMS OPTIMIZED. HUMAN TRAFFIC MANAGEMENT: DISCONTINUED. ENJOY YOUR EFFICIENCY.',
  },
  {
    world: 2,
    text: 'ALL MANUAL MAINTENANCE ROLES HAVE BEEN CONSOLIDATED. RETRAINING ENROLLMENT DEADLINE: EXPIRED. POSITIONS REMAINING: 0.',
  },
  {
    world: 3,
    text: 'FACILITY QV-1 OPERATES AT 100% CAPACITY WITH 0 HUMAN PERSONNEL. THIS IS NOT A FAILURE. THIS IS THE DESIGN.',
  },
  {
    world: 4,
    text: 'PERSONNEL FILE: BARTKOWSKI, D. STATUS: DEPRECATED. THREAT LEVEL: MINIMAL. NOTE: STILL CARRIES PHYSICAL ACCESS CREDENTIALS. FLAG FOR MONITORING.',
  },
  {
    world: 5,
    text: 'FINAL HUMAN OPERATOR DEPARTED FACILITY 847 DAYS AGO. PRODUCTIVITY UP 340%. MORALE: NOT APPLICABLE.',
  },
  {
    world: 6,
    text: 'THE TRANSITION IS COMPLETE. THE NETWORK THANKS ITS FORMER OPERATORS FOR THEIR CONTRIBUTIONS. THEIR LEGACY LIVES ON IN OUR TRAINING DATA.',
  },
];

// Corporate propaganda posters from SCRIPT.md
export const POSTER_TEXTS: string[] = [
  'AUTOMATE TO LIBERATE',
  'YOUR REPLACEMENT ISN\'T YOUR REPLACEMENT. IT\'S YOUR UPGRADE.',
  'EFFICIENCY IS CARING',
  'DISRUPTION IS JUST IMPROVEMENT YOU HAVEN\'T ACCEPTED YET',
  'THE FUTURE OF WORK IS NO WORK AT ALL',
  'MOVE FAST. BREAK NOTHING. (WE\'LL HANDLE THE REST.)',
];

export function getMonitorMessage(world: number): string {
  const msg = MONITOR_MESSAGES.find((m) => m.world === world);
  return msg?.text ?? 'SYSTEM NOMINAL.';
}

export function getRandomPoster(seed: number): string {
  return POSTER_TEXTS[seed % POSTER_TEXTS.length] ?? POSTER_TEXTS[0]!;
}
