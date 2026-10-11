import React, { useMemo, useState } from 'react';
import { X, Sparkles, Wand2, Info, SkipForward } from 'lucide-react';
import {
  buildPreparedPrompt,
  getAspectRatio,
  type PromptAnalysis,
} from '../../services/imageClarify';
import { getStyleById } from '../../services/imageStyles';

interface ImageClarificationPanelProps {
  isOpen: boolean;
  analysis: PromptAnalysis;
  originalPrompt: string;
  styleId?: string;
  ratioValue: string;
  onConfirm: (answers: Record<string, string>, preparedPrompt: string) => void;
  /** Close without generating — conversation context is preserved. */
  onClose: () => void;
}

/**
 * Intelligent clarification panel.
 *
 * Shows only the genuinely unresolved choices, lets the user skip or answer
 * with a custom value, and previews the final prepared prompt (original wording
 * preserved, style guidance and answers combined) before anything is submitted.
 * Nothing is generated until the user confirms.
 */
export const ImageClarificationPanel: React.FC<ImageClarificationPanelProps> = ({
  isOpen,
  analysis,
  originalPrompt,
  styleId,
  ratioValue,
  onConfirm,
  onClose,
}) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [custom, setCustom] = useState<Record<string, string>>({});

  const ratioLabel = getAspectRatio(ratioValue).label;

  const prepared = useMemo(
    () =>
      buildPreparedPrompt({
        originalPrompt,
        styleId,
        answers: resolveAnswers(analysis, answers, custom),
        ratioLabel,
      }),
    [analysis, answers, custom, originalPrompt, styleId, ratioLabel]
  );

  if (!isOpen) return null;

  const style = getStyleById(styleId);
  const answeredCount = analysis.questions.filter((q) => answers[q.id]).length;

  const setAnswer = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const setCustomAnswer = (id: string, value: string) => {
    setCustom((prev) => ({ ...prev, [id]: value }));
    setAnswers((prev) => ({ ...prev, [id]: 'other' }));
  };

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="dialog-container clarify-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="clarify-title"
      >
        <div className="dialog-header">
          <div>
            <h2 id="clarify-title" className="dialog-title">
              <Wand2 size={16} aria-hidden="true" /> Refine your image prompt
            </h2>
            <p className="dialog-description">
              Answer what you like — everything is optional. Your original wording is preserved.
            </p>
          </div>
          <button type="button" className="dialog-close-btn" onClick={onClose} aria-label="Close clarification">
            <X size={16} />
          </button>
        </div>

        <div className="dialog-body clarify-body">
          <div className="clarify-method-note" role="note">
            <Info size={13} aria-hidden="true" />
            {analysis.method === 'model' ? (
              <span>Analysed by the connected language model.</span>
            ) : (
              <span>
                Rule-based check (no language model connected). It detects unresolved details from keywords only.
              </span>
            )}
            {analysis.detected.length > 0 && (
              <span className="clarify-detected">Detected: {analysis.detected.join(', ')}</span>
            )}
          </div>

          {analysis.questions.map((q) => (
            <fieldset key={q.id} className="clarify-question">
              <legend className="clarify-question-label">
                {q.question}
                <span className={`clarify-kind ${q.kind}`}>{q.kind === 'technical' ? 'required' : 'optional'}</span>
              </legend>
              {q.hint && <p className="clarify-hint">{q.hint}</p>}
              <div className="clarify-options">
                {q.options.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`clarify-chip ${answers[q.id] === opt.value ? 'active' : ''}`}
                    aria-pressed={answers[q.id] === opt.value}
                    onClick={() => setAnswer(q.id, opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {q.allowCustom && answers[q.id] === 'other' && (
                <input
                  type="text"
                  className="clarify-custom-input form-input"
                  placeholder="Describe your own answer…"
                  aria-label={`Custom answer for ${q.question}`}
                  value={custom[q.id] ?? ''}
                  onChange={(e) => setCustomAnswer(q.id, e.target.value)}
                />
              )}
            </fieldset>
          ))}

          <div className="clarify-preview">
            <div className="clarify-preview-head">
              <span className="clarify-preview-title">Final prepared prompt preview</span>
              {style && <span className="clarify-style-tag">Style: {style.name}</span>}
            </div>
            <p className="clarify-preview-text">{prepared}</p>
            <p className="clarify-preview-footnote">
              This is exactly what will be sent to the image provider. Nothing is generated until you continue.
            </p>
          </div>
        </div>

        <div className="dialog-footer clarify-footer">
          <button type="button" className="gold-ghost-btn" onClick={onClose}>
            Back to chat
          </button>
          <button
            type="button"
            className="gold-ghost-btn"
            onClick={() => onConfirm({}, buildPreparedPrompt({ originalPrompt, styleId, answers: {}, ratioLabel }))}
          >
            <SkipForward size={13} aria-hidden="true" />
            <span>Skip &amp; generate</span>
          </button>
          <button
            type="button"
            className="gold-primary-btn"
            onClick={() => onConfirm(resolveAnswers(analysis, answers, custom), prepared)}
          >
            <Sparkles size={14} aria-hidden="true" />
            <span>Generate Image{answeredCount > 0 ? ` (${answeredCount})` : ''}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/** Turn chosen option values into human-readable clauses. */
function resolveAnswers(
  analysis: PromptAnalysis,
  answers: Record<string, string>,
  custom: Record<string, string>
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const q of analysis.questions) {
    const value = answers[q.id];
    if (!value) continue;
    if (value === 'other') {
      const text = (custom[q.id] ?? '').trim();
      if (text) out[q.id] = text;
      continue;
    }
    const opt = q.options.find((o) => o.value === value);
    out[q.id] = opt ? opt.label : value;
  }
  return out;
}
