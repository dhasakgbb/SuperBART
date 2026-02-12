export interface Rng {
  next(): number;
  nextInt(min: number, max: number): number;
  chance(p: number): boolean;
  pick<T>(arr: T[]): T;
}

export function createRng(seed: number): Rng {
  let s = seed >>> 0;
  const next = (): number => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 0xffffffff;
  };

  return {
    next,
    nextInt(min: number, max: number) {
      return Math.floor(next() * (max - min + 1)) + min;
    },
    chance(p: number) {
      return next() < p;
    },
    pick<T>(arr: T[]) {
      return arr[Math.floor(next() * arr.length)]!;
    }
  };
}
