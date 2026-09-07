/** Crown-to-apex connectivity, not root count or patient-specific geometry. */
export const CANAL_PATTERNS = [
  { type: "I", stages: [1, 1], description: "一条根管从髓室延续至根尖。" },
  { type: "II", stages: [2, 1], description: "两条根管在根内汇合，以一条根管到达根尖。" },
  { type: "III", stages: [1, 2, 1], description: "一条根管分为两条，随后重新汇合。" },
  { type: "IV", stages: [2, 2], description: "两条根管相互独立地延续至根尖。" },
  { type: "V", stages: [1, 2], description: "一条根管在根内分为两条，分别到达根尖。" },
  { type: "VI", stages: [2, 1, 2], description: "两条根管先汇合，再分为两条到达根尖。" },
  { type: "VII", stages: [1, 2, 1, 2], description: "一条根管依次经历分叉、汇合和再次分叉。" },
  { type: "VIII", stages: [3, 3], description: "三条根管相互独立地延续至根尖。" },
] as const;

export function canalLanes(count: number): number[] {
  return Array.from({ length: count }, (_, i) => 150 + (i - (count - 1) / 2) * 58);
}
export function canalPaths(stages: readonly number[]): string[] {
  const paths: string[] = [];
  const y = (i: number) => 65 + i * 290 / (stages.length - 1);
  stages.forEach((count, i) => {
    for (const x of canalLanes(count)) paths.push(`M ${x} ${y(i)-18} V ${y(i)+18}`);
    if (i === stages.length - 1) return;
    const from = canalLanes(count), to = canalLanes(stages[i+1]);
    for (let j = 0; j < Math.max(from.length, to.length); j++) {
      const a = from[j % from.length], b = to[j % to.length];
      const mid = (y(i) + y(i+1)) / 2;
      paths.push(`M ${a} ${y(i)+18} C ${a} ${mid}, ${b} ${mid}, ${b} ${y(i+1)-18}`);
    }
  });
  return paths;
}
