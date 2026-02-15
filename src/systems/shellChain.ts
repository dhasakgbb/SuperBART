const SHELL_KILL_DISTANCE = 20;
const SHELL_KILL_VELOCITY_PX_PER_SEC = 150;

export interface ShellChainEntityProbe {
  readonly active: boolean;
  readonly kind: string;
  readonly x: number;
  readonly y: number;
  readonly velocityX: number;
}

export interface ShellChainKillPair {
  readonly sourceIndex: number;
  readonly targetIndex: number;
  readonly shellDirX: number;
}

export function collectShellChainKillPairs(
  handles: ReadonlyArray<ShellChainEntityProbe>,
): ShellChainKillPair[] {
  const pairs: ShellChainKillPair[] = [];
  const destroyed = new Set<number>();
  const activeShellCount = handles.filter((entry) => entry?.active && entry.kind === 'shell').length;

  for (let sourceIndex = 0; sourceIndex < handles.length; sourceIndex += 1) {
    const source = handles[sourceIndex];
    if (!source || !source.active || source.kind !== 'shell' || destroyed.has(sourceIndex)) {
      continue;
    }
    if (Math.abs(source.velocityX) < SHELL_KILL_VELOCITY_PX_PER_SEC) {
      continue;
    }
    const shellDirX = Math.sign(source.velocityX) || 1;

    for (let targetIndex = 0; targetIndex < handles.length; targetIndex += 1) {
      if (sourceIndex === targetIndex || destroyed.has(targetIndex)) {
        continue;
      }
      const target = handles[targetIndex];
      if (!target || !target.active) {
        continue;
      }
      if (target.kind !== 'walker' && activeShellCount > 2) {
        continue;
      }
      const distance = Math.hypot(source.x - target.x, source.y - target.y);
      if (distance < SHELL_KILL_DISTANCE) {
        destroyed.add(targetIndex);
        pairs.push({
          sourceIndex,
          targetIndex,
          shellDirX,
        });
      }
    }
  }

  return pairs;
}
