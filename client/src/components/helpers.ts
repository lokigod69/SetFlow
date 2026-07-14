import { useEffect } from 'react';

export function formatDuration(ms: number | null | undefined): string {
  if (!ms || ms < 0) return '—';
  const seconds = Math.round(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export function formatDelta(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

export function strictnessLabel(value: number): string {
  return value < 0.35 ? 'loose' : value < 0.75 ? 'medium' : 'strict';
}

export function useOutsideClose(
  ref: React.RefObject<HTMLElement | null>,
  open: boolean,
  onClose: () => void,
): void {
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose, ref]);
}

export const trackName = (track: { artist: string; title: string; mix: string }) =>
  `${track.artist} — ${track.title}${track.mix ? ` (${track.mix})` : ''}`;
