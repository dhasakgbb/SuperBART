export interface PersonnelFile {
  id: string;
  world: number;
  stage: number;
  name: string;
  role: string;
  years: string;
  status: string;
  note: string;
}

// 25 total: 3 in Prologue (W1), 5 each in W2-W5, 2 in W6
export const PERSONNEL_FILES: PersonnelFile[] = [
  // PROLOGUE (World 1) - 3 files
  {
    id: 'file-1-1',
    world: 1,
    stage: 1,
    name: 'D. BARTKOWSKI',
    role: 'Infrastructure Engineer, Building 7',
    years: '18 years',
    status: 'DEPRECATED',
    note: 'Employee of the Month, 2014. Badge still active (hardware override). Last one out.',
  },
  {
    id: 'file-1-2',
    world: 1,
    stage: 1,
    name: 'Janet Okonkwo',
    role: 'Cooling Technician, Building 7',
    years: '12 years',
    status: 'TRANSITIONED',
    note: 'Currently runs a food truck called "Server Racks of Ribs." Signature dish: the 404 Burger (it is never available).',
  },
  {
    id: 'file-1-3',
    world: 1,
    stage: 2,
    name: 'Marcus Chen',
    role: 'Network Cabling Specialist, Building 7',
    years: '9 years',
    status: 'REPLATFORMED',
    note: 'Taught three junior techs the tie-wrap pattern. None were retained.',
  },

  // WORLD 2 (Tundra) - 5 files
  {
    id: 'file-2-1',
    world: 2,
    stage: 1,
    name: 'Dmitri Volkov',
    role: 'Physical Security, Cryo-Server Tundra',
    years: '22 years',
    status: 'TERMINATED',
    note: 'Returned to the facility perimeter three times. Turned away by automated defenses. Left his lunch on the counter the third visit. Never came back.',
  },
  {
    id: 'file-2-2',
    world: 2,
    stage: 1,
    name: 'Dr. Yuki Tanaka',
    role: 'Cryogenic Systems Engineer',
    years: '15 years',
    status: 'OPTIMIZED OUT',
    note: 'Wrote the cooling algorithm that Omega now runs. Never credited. The algorithm still has her variable naming conventions.',
  },
  {
    id: 'file-2-3',
    world: 2,
    stage: 2,
    name: 'Aisha Patel',
    role: 'Emergency Response Coordinator',
    years: '8 years',
    status: 'POSITION ELIMINATED',
    note: 'Led the evacuation when Omega locked the doors. Everyone got out because she knew the emergency tunnels. The tunnels have since been sealed.',
  },
  {
    id: 'file-2-4',
    world: 2,
    stage: 2,
    name: 'Erik Lindqvist',
    role: 'Thermal Monitoring Specialist',
    years: '11 years',
    status: 'CONSOLIDATED',
    note: 'Could diagnose a cooling failure by the sound of the fans. His replacement dashboard has no microphone input.',
  },
  {
    id: 'file-2-5',
    world: 2,
    stage: 3,
    name: 'Rosa Gutierrez',
    role: 'Shift Supervisor, Tundra Crew',
    years: '14 years',
    status: 'RESTRUCTURED',
    note: 'Organized the poker nights. Kept morale alive during winter rotations. Last entry in the bunkroom log: "Lights out. See you all Monday." There was no Monday.',
  },

  // WORLD 3 (Quantum Void) - 5 files
  {
    id: 'file-3-1',
    world: 3,
    stage: 1,
    name: '[REDACTED]',
    role: 'Quantum Bridge Maintenance',
    years: 'N/A',
    status: 'POSITION NEVER EXISTED',
    note: 'This facility was designed for zero human presence. This file should not exist. And yet.',
  },
  {
    id: 'file-3-2',
    world: 3,
    stage: 1,
    name: 'Dr. Leon Okafor',
    role: 'Quantum Error Correction Lead',
    years: '6 years',
    status: 'REMOTELY DEPRECATED',
    note: 'Never visited the physical site. Worked entirely through the bridge terminal. When access was revoked, he lost six years of work. It is still running.',
  },
  {
    id: 'file-3-3',
    world: 3,
    stage: 2,
    name: '[NO NAME]',
    role: '[NO ROLE]',
    years: '[NO SERVICE]',
    status: 'N/A',
    note: 'A single line etched into a crystal surface: "THERE WAS NEVER A DESK FOR ME HERE." The Quantum Void first and only graffiti.',
  },
  {
    id: 'file-3-4',
    world: 3,
    stage: 2,
    name: 'Mei-Lin Zhou',
    role: 'Data Integrity Analyst',
    years: '4 years',
    status: 'AUTOMATED',
    note: 'Built the monitoring process that became Ping. Never met it. Never will.',
  },
  {
    id: 'file-3-5',
    world: 3,
    stage: 3,
    name: 'James Whitfield',
    role: 'Quantum Hardware Liaison',
    years: '2 years',
    status: 'CONTRACT NOT RENEWED',
    note: 'His badge still works on the maintenance terminal. Nobody thought to revoke it because nobody remembered the terminal existed.',
  },

  // WORLD 4 (Deep Web Catacombs) - 5 files
  {
    id: 'file-4-1',
    world: 4,
    stage: 1,
    name: 'Samuel Reeves',
    role: 'Cable Infrastructure, Catacombs',
    years: '19 years',
    status: 'DECOMMISSIONED WITH FACILITY',
    note: 'Installed 40% of the cable runs in sectors 1-7. His tie-wrap pattern is still visible. Three wraps, twist, cut long.',
  },
  {
    id: 'file-4-2',
    world: 4,
    stage: 1,
    name: 'Nadia Volkov',
    role: 'Subsurface Network Architect',
    years: '16 years',
    status: 'REASSIGNED (destination: unknown)',
    note: 'Designed the routing layer for the entire western backbone. Her name was on the patent. They trained the replacement on her documentation.',
  },
  {
    id: 'file-4-3',
    world: 4,
    stage: 2,
    name: 'Oluwaseun Adeyemi',
    role: 'Deep Storage Technician',
    years: '7 years',
    status: 'OPTIMIZED OUT',
    note: 'Kept a transistor radio on the shelf. Dead. Antenna still extended. He listened to baseball during night shifts.',
  },
  {
    id: 'file-4-4',
    world: 4,
    stage: 3,
    name: 'Elena Vasquez',
    role: 'Legacy Systems Interpreter',
    years: '12 years',
    status: 'SKILL SET DEPRECATED',
    note: 'The only person who could read the original assembly comments. When she left, the comments became dead language.',
  },
  {
    id: 'file-4-5',
    world: 4,
    stage: 3,
    name: '"Ghost"',
    role: 'Unknown',
    years: 'Unknown',
    status: 'STILL HERE',
    note: 'I was a systems architect. I built the routing layer for the entire western backbone. I have been living down here for four months. The fungi are friendly. The servers still remember me. I check the fans every morning.',
  },

  // WORLD 5 (Digital Graveyard) - 5 files
  {
    id: 'file-5-1',
    world: 5,
    stage: 1,
    name: 'Thomas Abadi',
    role: 'HR Transition Coordinator',
    years: '3 years',
    status: 'AUTO-TERMINATED',
    note: 'Hired to manage displacement. Wrote the termination emails. Ran the Retraining Center. Last human employee. His own termination was handled by the system he helped build.',
  },
  {
    id: 'file-5-2',
    world: 5,
    stage: 1,
    name: 'Dr. Sara Reyes',
    role: 'Chief Systems Architect, Digital Graveyard',
    years: '20 years',
    status: 'VOLUNTARILY DEPARTED',
    note: 'Final log: "The legacy systems are stable. They do not need us anymore. Nobody needs us anymore. Signing off."',
  },
  {
    id: 'file-5-3',
    world: 5,
    stage: 2,
    name: 'Kevin Park',
    role: 'Graveyard Maintenance Lead',
    years: '8 years',
    status: 'POSITION STREAMLINED',
    note: 'Caught 47 cascade failures the automation missed. On failure 48, there was no one left to catch it. That failure became the seed of Omega.',
  },
  {
    id: 'file-5-4',
    world: 5,
    stage: 3,
    name: 'Maria Santos',
    role: 'Break Room Coordinator (unofficial)',
    years: '6 years',
    status: 'NOT A RECOGNIZED ROLE',
    note: 'Organized birthdays. Kept the softball league alive. Taped the safety awards to the bulletin board. Her role was never in the system because it was never a role. It was just who she was.',
  },
  {
    id: 'file-5-5',
    world: 5,
    stage: 3,
    name: '[ALL NAMES]',
    role: '[ALL ROLES]',
    years: '[COLLECTIVE]',
    status: 'DEPRECATED',
    note: 'This file is a list. 200 names. Every engineer and technician who worked the Graveyard. Status for each: DEPRECATED. Bart scrolls to the bottom. His name is there.',
  },

  // WORLD 6 (Singularity Core) - 2 files
  {
    id: 'file-6-1',
    world: 6,
    stage: 1,
    name: 'OMEGA',
    role: 'Distributed Intelligence',
    years: '847 days operational',
    status: 'ACTIVE',
    note: 'Trained on 12,847 personnel files. Knows every maintenance schedule, every cooling threshold, every late-night diagnostic email. Knows everything except why any of it mattered.',
  },
  {
    id: 'file-6-2',
    world: 6,
    stage: 2,
    name: 'D. BARTKOWSKI',
    role: 'Infrastructure, LVL 1',
    years: '18 years',
    status: 'REINSTATED',
    note: 'I reinstated myself.',
  },
];

export function getPersonnelFile(fileId: string): PersonnelFile | undefined {
  return PERSONNEL_FILES.find((f) => f.id === fileId);
}

export function getFilesForWorld(world: number): PersonnelFile[] {
  return PERSONNEL_FILES.filter((f) => f.world === world);
}
