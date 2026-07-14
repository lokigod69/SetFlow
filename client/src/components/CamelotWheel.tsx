import { formatCamelot, parseCamelot } from '@setflow/shared';

export function CamelotWheel({ camelot, size = 84 }: { camelot: string; size?: number }) {
  const active = parseCamelot(camelot);
  if (!active) return null;
  const center = size / 2; const outer = size * .47; const inner = size * .25;
  const point = (r: number, angle: number) => [center + r * Math.cos(angle), center + r * Math.sin(angle)];
  const wedge = (ring: 'A' | 'B', index: number) => {
    const start = -Math.PI / 2 + index * Math.PI / 6; const end = start + Math.PI / 6;
    const r1 = ring === 'B' ? outer : inner; const r0 = ring === 'B' ? inner : size * .055;
    const [x1, y1] = point(r0, start); const [x2, y2] = point(r1, start); const [x3, y3] = point(r1, end); const [x4, y4] = point(r0, end);
    return `M ${x1} ${y1} L ${x2} ${y2} A ${r1} ${r1} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${r0} ${r0} 0 0 0 ${x1} ${y1} Z`;
  };
  const isNeighbor = (num: number, letter: 'A' | 'B') => letter === active.letter && (num === active.num || Math.abs(((num - active.num + 12) % 12)) === 1 || Math.abs(((active.num - num + 12) % 12)) === 1) || (num === active.num && letter !== active.letter);
  return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label={`${formatCamelot(active)} key wheel`}><title>{formatCamelot(active)} on the Camelot wheel</title>{(['B', 'A'] as const).flatMap((letter) => Array.from({ length: 12 }, (_, i) => { const num = i + 1; const current = num === active.num && letter === active.letter; const neighbor = !current && isNeighbor(num, letter); return <path key={`${letter}${num}`} d={wedge(letter, i)} fill={current || neighbor ? 'var(--c-accent-soft)' : 'transparent'} fillOpacity={current ? 1 : neighbor ? .42 : 1} stroke={current ? 'var(--c-accent)' : 'var(--c-panel-border)'} />; }))}{Array.from({ length: 12 }, (_, i) => { const [x = 0, y = 0] = point(size * .365, -Math.PI / 2 + (i + .5) * Math.PI / 6); return <text key={i} x={x} y={y + 2.5} textAnchor="middle" fontFamily="var(--f-mono)" fontSize="7" fill="var(--c-text-muted)">{i + 1}</text>; })}</svg>;
}
