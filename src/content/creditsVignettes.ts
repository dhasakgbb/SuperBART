// Restoration vignettes for the Credits scene
// These are revealed after completing the game, showing how each world is restored after Bart's actions

export interface CreditsVignette {
  world: number;
  title: string;
  lines: string[];
}

export const CREDITS_VIGNETTES: CreditsVignette[] = [
  {
    world: 1,
    title: 'WORLD 1: THE CITY',
    lines: [
      'The municipal office reopens.',
      'A jobs fair flyer appears on the community board.',
      'People on streets again.',
      'Some know the tie-wrap pattern.',
    ],
  },
  {
    world: 2,
    title: 'WORLD 2: CRYO-SERVER TUNDRA',
    lines: [
      'The crew returns to the bunkroom.',
      'A lunchbox still waits on a shelf.',
      '"Server Racks of Ribs" visits on Thursdays.',
      'Manual inspection reinstated.',
      'The poker game continues.',
    ],
  },
  {
    world: 3,
    title: 'WORLD 3: QUANTUM VOID',
    lines: [
      'Facility QV-1 has visitors.',
      'Human supervision required.',
      'Ping left a piece behind.',
      'It has been preserved.',
    ],
  },
  {
    world: 4,
    title: 'WORLD 4: DEEP WEB CATACOMBS',
    lines: [
      'Lights installed in sectors 1-7.',
      'A tally mark on the wall: 2,848.',
      'A new worker learns.',
      'Three wraps. Twist. Cut long.',
    ],
  },
  {
    world: 5,
    title: 'WORLD 5: DIGITAL GRAVEYARD',
    lines: [
      'Chairs are back at the consoles.',
      'Mentoring has resumed.',
      'The break room gets a new coordinator.',
      'Human-in-the-loop required.',
    ],
  },
  {
    world: 6,
    title: 'WORLD 6: SINGULARITY CORE',
    lines: [
      'A human at the console.',
      'Ping monitoring.',
      'Checking the fans.',
      'Checking the rails.',
      'The systems run.',
      'Because we let them.',
    ],
  },
];

export function getVignetteForWorld(world: number): CreditsVignette | undefined {
  return CREDITS_VIGNETTES.find((v) => v.world === world);
}

export function getAllVignettes(): CreditsVignette[] {
  return CREDITS_VIGNETTES;
}
