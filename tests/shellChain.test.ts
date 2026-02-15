import { describe, expect, test } from 'vitest';
import { collectShellChainKillPairs } from '../src/systems/shellChain';

describe('shell chain kill pairing', () => {
  test('does not create pairs from non-shell sources', () => {
    const pairs = collectShellChainKillPairs([
      { active: true, kind: 'walker', x: 0, y: 0, velocityX: 0 },
      { active: true, kind: 'walker', x: 5, y: 0, velocityX: 0 },
    ]);

    expect(pairs).toEqual([]);
  });

  test('requires moving shells to start a chain', () => {
    const pairs = collectShellChainKillPairs([
      { active: true, kind: 'shell', x: 0, y: 0, velocityX: 80 },
      { active: true, kind: 'walker', x: 10, y: 0, velocityX: 0 },
    ]);

    expect(pairs).toEqual([]);
  });

  test('kills each target at most once per sweep', () => {
    const pairs = collectShellChainKillPairs([
      { active: true, kind: 'shell', x: 0, y: 0, velocityX: 200 },
      { active: true, kind: 'shell', x: 8, y: 0, velocityX: 200 },
      { active: true, kind: 'walker', x: 16, y: 0, velocityX: 0 },
      { active: true, kind: 'walker', x: 17, y: 0, velocityX: 0 },
    ]);

    expect(pairs).toEqual([
      { sourceIndex: 0, targetIndex: 1, shellDirX: 1 },
      { sourceIndex: 0, targetIndex: 2, shellDirX: 1 },
      { sourceIndex: 0, targetIndex: 3, shellDirX: 1 },
    ]);
    expect(new Set(pairs.map((pair) => pair.targetIndex)).size).toBe(3);
  });

  test('limits hostile shell-chain sweeps to one kill per target', () => {
    const pairs = collectShellChainKillPairs([
      { active: true, kind: 'shell', x: 0, y: 0, velocityX: 200 },
      { active: true, kind: 'shell', x: 4, y: 0, velocityX: 200 },
      { active: true, kind: 'walker', x: 8, y: 0, velocityX: 0 },
      { active: true, kind: 'walker', x: 9, y: 0, velocityX: 0 },
      { active: true, kind: 'walker', x: 10, y: 0, velocityX: 0 },
      { active: true, kind: 'shell', x: 14, y: 0, velocityX: 200 },
      { active: true, kind: 'walker', x: 15, y: 0, velocityX: 0 },
      { active: true, kind: 'shell', x: 100, y: 0, velocityX: 120 },
    ]);

    expect(pairs.length).toBeGreaterThan(0);
    expect(pairs.length).toBeLessThanOrEqual(7);

    const touchedTargets = new Set<number>();
    for (const pair of pairs) {
      expect(pair.targetIndex).toBeLessThan(8);
      expect(touchedTargets.has(pair.targetIndex)).toBe(false);
      expect(pair.sourceIndex).toBeLessThan(8);
      touchedTargets.add(pair.targetIndex);
    }
  });

  test('bounds hostile overlap chain from triggering infinite/duplicate chain kills', () => {
    const densePack = [
      { active: true, kind: 'shell', x: 0, y: 0, velocityX: 220 },
      { active: true, kind: 'shell', x: 2, y: 0, velocityX: 250 },
      { active: true, kind: 'shell', x: 4, y: 0, velocityX: 190 },
      { active: true, kind: 'shell', x: 6, y: 0, velocityX: 180 },
      { active: true, kind: 'walker', x: 8, y: 0, velocityX: 0 },
      { active: true, kind: 'walker', x: 10, y: 0, velocityX: 0 },
      { active: true, kind: 'walker', x: 12, y: 0, velocityX: 0 },
      { active: true, kind: 'walker', x: 14, y: 0, velocityX: 0 },
      { active: true, kind: 'walker', x: 16, y: 0, velocityX: 0 },
    ];

    const pairs = collectShellChainKillPairs(densePack);
    const uniqueTargets = new Set(pairs.map((pair) => pair.targetIndex));

    expect(uniqueTargets.size).toBe(pairs.length);
    expect(pairs.length).toBeLessThanOrEqual(densePack.length - 1);
    expect(pairs.length).toBeLessThan(30);
    for (const pair of pairs) {
      expect(pair.sourceIndex).toBeLessThan(densePack.length);
      expect(pair.targetIndex).toBeLessThan(densePack.length);
      expect(pair.targetIndex).not.toBe(pair.sourceIndex);
    }
  });

  test('bounds hostile overlap chain kills deterministically in clustered geometry', () => {
    const densePack = [
      { active: true, kind: 'shell', x: 0, y: 0, velocityX: 240 },
      { active: true, kind: 'shell', x: 4, y: 0, velocityX: 210 },
      { active: true, kind: 'shell', x: 8, y: 0, velocityX: 205 },
      { active: true, kind: 'shell', x: 12, y: 0, velocityX: 180 },
      { active: true, kind: 'shell', x: 16, y: 0, velocityX: 185 },
      { active: true, kind: 'walker', x: 1, y: 0, velocityX: 0 },
      { active: true, kind: 'walker', x: 5, y: 0, velocityX: 0 },
      { active: true, kind: 'walker', x: 9, y: 0, velocityX: 0 },
      { active: true, kind: 'walker', x: 11, y: 0, velocityX: 0 },
      { active: true, kind: 'walker', x: 14, y: 0, velocityX: 0 },
      { active: true, kind: 'walker', x: 22, y: 0, velocityX: 0 },
      { active: true, kind: 'walker', x: 24, y: 0, velocityX: 0 },
      { active: true, kind: 'walker', x: 26, y: 0, velocityX: 0 },
      { active: true, kind: 'walker', x: 28, y: 0, velocityX: 0 },
      { active: true, kind: 'walker', x: 32, y: 0, velocityX: 0 },
    ];

    const pairs = collectShellChainKillPairs(densePack);
    const killedTargets = new Set<number>();

    for (const pair of pairs) {
      expect(pair.sourceIndex).toBeLessThan(densePack.length);
      expect(pair.targetIndex).toBeLessThan(densePack.length);
      expect(pair.targetIndex).not.toBe(pair.sourceIndex);
      expect(killedTargets.has(pair.targetIndex)).toBe(false);
      killedTargets.add(pair.targetIndex);
      expect(densePack[pair.targetIndex]?.kind).toBe('walker');
    }

    expect(pairs.length).toBeLessThanOrEqual(densePack.length - 1);
  });
});
