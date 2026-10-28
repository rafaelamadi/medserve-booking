/** Unambiguous alphabet: no 0/O, 1/I/L (PRD §8). */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateReference(centreCode: string, rand: () => number = Math.random): string {
  let tail = "";
  for (let i = 0; i < 6; i++) {
    tail += ALPHABET[Math.floor(rand() * ALPHABET.length)];
  }
  return `MS-${centreCode}-${tail}`;
}
