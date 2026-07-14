import type { TransitionNote } from '@setflow/shared';
import { formatDelta } from './helpers';

export function TransitionChip({ transition, onFix }: { transition: TransitionNote; onFix?: () => void }) {
  const danger = transition.warnings.some((warning) => warning.severity === 'red');
  const warning = transition.warnings[0];
  const blend = transition.blend.replace('-', ' ');
  const arrow = transition.energyStep > 0 ? '↑' : transition.energyStep < 0 ? '↓' : '→';
  return <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 0 5px 34px', minWidth: 0, color: warning ? (danger ? 'var(--c-danger)' : 'var(--c-warn)') : 'var(--c-text-muted)', fontSize: 11 }}><span className="mono">{transition.camelotPath}</span><span className="mono">{formatDelta(transition.bpmDeltaPercent)}{transition.bpmRead !== 'straight' ? ` · ${transition.bpmRead}` : ''}</span><span>{arrow}</span><span>{blend}</span><span title={transition.note} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{warning?.message ?? transition.note}</span>{warning && onFix && <button className="btn quiet" style={{ padding: '2px 5px', fontSize: 11 }} onClick={onFix}>fix</button>}</div>;
}
