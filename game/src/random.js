// A tiny seeded random generator (mulberry32), so a ?seed=N game always deals the same
// tickets in the same order. The seed is only the starting point: play is not scripted.

export function createRandom(seed) {
  let state = seed >>> 0;
  return {
    /** A float in [0, 1). */
    next() {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    /** An integer in [min, max). */
    int(min, max) {
      return min + Math.floor(this.next() * (max - min));
    },
    /** One element of an array, picked uniformly. */
    pick(list) {
      return list[this.int(0, list.length)];
    },
  };
}
