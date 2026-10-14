/**
 * ARTI AI — Music Studio brief review panel.
 *
 * Shows the settings ARTI extracted from the user's natural-language request,
 * so they can be reviewed and corrected before generating. It also surfaces the
 * provider-capability warnings that matter (undeclared vocal languages, duet
 * support, unknown capability) without ever claiming support it cannot verify.
 */
import React from 'react';
import { Check, AlertCircle, Pencil } from 'lucide-react';
import type { MusicBrief } from '../../services/musicPrompt';
import { briefSummary } from '../../services/musicPrompt';
import { getMode } from '../../services/musicTypes';
import { getLanguage } from '../../services/musicLanguages';
import type { MusicCapabilityProfile } from '../../services/musicProvider';

interface BriefReviewProps {
  brief: MusicBrief;
  interpreterNote: string;
  filled: string[];
  capability: MusicCapabilityProfile;
  onEdit: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export const BriefReview: React.FC<BriefReviewProps> = ({
  brief,
  interpreterNote,
  filled,
  capability,
  onEdit,
  onConfirm,
  onCancel,
}) => {
  const rows = briefSummary(brief);
  const mode = getMode(brief.mode);
  const lang = getLanguage(brief.language);
  const vocalsRequested = !mode.instrumentalOnly && brief.vocalType !== 'instrumental';

  const warnings: string[] = [];
  if (vocalsRequested && Array.isArray(capability.vocalLanguages) && !capability.vocalLanguages.includes(brief.language)) {
    warnings.push(
      `The provider has not declared ${lang?.name ?? brief.language} as a singable language. ARTI will not silently generate a different language.`
    );
  }
  if (vocalsRequested && Array.isArray(capability.vocalLanguages) === false && capability.vocalLanguages === null) {
    warnings.push(
      'The provider has not declared its vocal languages, so the vocal language cannot be verified. You can proceed, or switch to instrumental.'
    );
  }
  if (vocalsRequested && capability.vocals === 'unknown') {
    warnings.push('Vocal configuration (male/female/duet) is unverified for this provider.');
  }

  return (
    <div className="music-brief-review" role="dialog" aria-label="Review extracted music settings">
      <div className="music-brief-review-head">
        <h3 className="music-brief-review-title">Review extracted settings</h3>
        <span className="music-brief-review-interpreter">{interpreterNote}</span>
      </div>

      {filled.length > 0 && (
        <div className="music-brief-filled">
          <span className="music-brief-filled-label">Interpreted fields:</span>
          {filled.map((f) => (
            <span key={f} className="music-tag">
              {f}
            </span>
          ))}
        </div>
      )}

      <dl className="music-brief-rows">
        {rows.map((r) => (
          <div key={r.label} className="music-brief-row">
            <dt>{r.label}</dt>
            <dd>{r.value}</dd>
          </div>
        ))}
      </dl>

      {warnings.length > 0 && (
        <div className="music-brief-warnings">
          {warnings.map((w) => (
            <p key={w} className="music-lang-note" role="note">
              <AlertCircle size={13} aria-hidden="true" />
              {w}
            </p>
          ))}
        </div>
      )}

      <div className="music-brief-actions">
        <button type="button" className="gold-primary-btn" onClick={onConfirm}>
          <Check size={14} aria-hidden="true" />
          <span>Confirm &amp; generate</span>
        </button>
        <button type="button" className="gold-ghost-btn" onClick={onEdit}>
          <Pencil size={14} aria-hidden="true" />
          <span>Correct settings</span>
        </button>
        <button type="button" className="music-chip-clear" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default BriefReview;
