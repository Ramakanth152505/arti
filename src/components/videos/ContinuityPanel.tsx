import React, { useState } from 'react';
import { Plus, Trash2, Check, AlertTriangle, Info } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import {
  videoProductionStore,
  type Production,
  type ContinuityRecord,
} from '../../services/videoProduction';

interface ContinuityPanelProps {
  production: Production;
}

const KINDS: Array<[ContinuityRecord['kind'], string]> = [
  ['character', 'Character'],
  ['prop', 'Prop'],
  ['location', 'Location'],
  ['costume', 'Costume'],
  ['timeline', 'Timeline'],
  ['knowledge', 'Character knowledge'],
  ['other', 'Other'],
];

/**
 * Continuity & consistency manager.
 *
 * Tracks the facts a long-running series must not contradict — character
 * presence, injuries, costume changes, locations, timeline, objects and
 * unresolved mysteries. Warnings are surfaced before large jobs where practical;
 * ARTI never silently rewrites established story canon.
 */
export const ContinuityPanel: React.FC<ContinuityPanelProps> = ({ production }) => {
  const { showToast } = useToast();
  const [kind, setKind] = useState<ContinuityRecord['kind']>('character');
  const [text, setText] = useState('');

  const open = production.continuity.filter((c) => !c.resolved);
  const resolved = production.continuity.filter((c) => c.resolved);

  const add = () => {
    if (!text.trim()) return;
    videoProductionStore.addContinuity(production.id, kind, text);
    setText('');
    showToast('Continuity note added', { type: 'info' });
  };

  const renderList = (records: ContinuityRecord[], label: string) => (
    <div className="continuity-group">
      <h4 className="continuity-group-title">{label} ({records.length})</h4>
      {records.length === 0 ? (
        <p className="bible-empty">None.</p>
      ) : (
        <ul className="continuity-list">
          {records.map((r) => (
            <li key={r.id} className={`continuity-item ${r.resolved ? 'resolved' : 'open'}`}>
              <span className="continuity-kind">{KINDS.find(([k]) => k === r.kind)?.[1] ?? r.kind}</span>
              <span className="continuity-text">{r.text}</span>
              <button
                type="button"
                className="continuity-resolve"
                onClick={() => videoProductionStore.setContinuityResolved(production.id, r.id, !r.resolved)}
                title={r.resolved ? 'Reopen' : 'Mark resolved'}
                aria-label={r.resolved ? 'Reopen' : 'Mark resolved'}
              >
                <Check size={12} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="canon-del"
                onClick={() => videoProductionStore.removeContinuity(production.id, r.id)}
                title="Remove"
                aria-label="Remove continuity note"
              >
                <Trash2 size={12} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="continuity-panel">
      <div className="video-honesty-note info" role="note">
        <Info size={13} aria-hidden="true" />
        <span>
          ARTI tracks these records and surfaces open warnings, but it cannot guarantee perfect character
          consistency unless the connected engine genuinely supports identity controls. Where it does not,
          it says so rather than claiming consistency.
        </span>
      </div>

      {open.length > 0 && (
        <div className="video-honesty-note warning" role="note">
          <AlertTriangle size={13} aria-hidden="true" />
          <span>{open.length} open continuity note{open.length === 1 ? '' : 's'} to resolve before large jobs.</span>
        </div>
      )}

      <div className="continuity-add">
        <select
          className="form-select"
          value={kind}
          onChange={(e) => setKind(e.target.value as ContinuityRecord['kind'])}
          aria-label="Continuity kind"
        >
          {KINDS.map(([k, label]) => (
            <option key={k} value={k}>{label}</option>
          ))}
        </select>
        <input
          type="text"
          className="form-input"
          value={text}
          placeholder="e.g. Kael is injured in the left arm from episode 3 onward."
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
        />
        <button type="button" className="gold-ghost-btn small" onClick={add}>
          <Plus size={12} aria-hidden="true" />
          <span>Add note</span>
        </button>
      </div>

      {renderList(open, 'Open')}
      {renderList(resolved, 'Resolved')}
    </div>
  );
};
