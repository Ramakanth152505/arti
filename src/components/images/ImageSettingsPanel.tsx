import React, { useMemo } from 'react';
import { Sliders, AlertCircle, Check, Minus } from 'lucide-react';
import {
  getProviderCapability,
  getModelCapability,
  getSelectedImageProvider,
  resolveSize,
  type ImageProviderId,
} from '../../services/imageService';
import { ASPECT_RATIOS, getAspectRatio } from '../../services/imageClarify';
import type { ImageGenerationSettings } from '../../services/chatStore';

interface ImageSettingsPanelProps {
  settings: ImageGenerationSettings;
  onChange: (patch: Partial<ImageGenerationSettings>) => void;
  onClose: () => void;
}

/**
 * Generation settings.
 *
 * Only provider-supported controls are rendered as functional. When the
 * selected model does not support a parameter it is shown explicitly as
 * "Not supported by this model" rather than being offered as a working toggle —
 * so a control's presence always reflects real capability.
 */
export const ImageSettingsPanel: React.FC<ImageSettingsPanelProps> = ({ settings, onChange, onClose }) => {
  const providerId = getSelectedImageProvider() as ImageProviderId;
  const provider = getProviderCapability(providerId);
  const model = useMemo(
    () => getModelCapability(providerId, settings.model) ?? provider.models[0],
    [providerId, settings.model, provider]
  );

  const ratio = getAspectRatio(settings.aspectRatio);
  const custom =
    settings.aspectRatio === 'custom' && settings.size.match(/^(\d+)x(\d+)$/)
      ? { width: parseInt(settings.size.split('x')[0], 10), height: parseInt(settings.size.split('x')[1], 10) }
      : undefined;
  const resolved = resolveSize(ratio.ratio, model, custom);

  const applyRatio = (value: string) => {
    const next = getAspectRatio(value);
    const size =
      value === 'custom'
        ? settings.size.match(/^\d+x\d+$/)
          ? settings.size
          : '1024x1024'
        : resolveSize(next.ratio, model).token;
    onChange({ aspectRatio: value, size });
  };

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="dialog-container image-settings-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="image-settings-title"
      >
        <div className="dialog-header">
          <div>
            <h2 id="image-settings-title" className="dialog-title">
              <Sliders size={16} aria-hidden="true" /> Generation settings
            </h2>
            <p className="dialog-description">
              {provider.label}. Controls appear only when the selected model genuinely supports them.
            </p>
          </div>
          <button type="button" className="dialog-close-btn" onClick={onClose} aria-label="Close settings">
            <AlertCircle size={16} />
          </button>
        </div>

        <div className="dialog-body image-settings-body">
          <div className="settings-field">
            <label className="settings-label" htmlFor="img-model">Model</label>
            <select
              id="img-model"
              className="form-select"
              value={settings.model}
              onChange={(e) => {
                const next = getModelCapability(providerId, e.target.value);
                if (!next) return;
                const size = resolveSize(ratio.ratio, next).token;
                onChange({ model: next.id, size, quality: next.qualities[0] });
              }}
            >
              {provider.models.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
            <p className="settings-hint">{model.note}</p>
          </div>

          <div className="settings-field">
            <span className="settings-label">Aspect ratio</span>
            <div className="settings-ratio-grid">
              {ASPECT_RATIOS.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  className={`settings-ratio-chip ${settings.aspectRatio === a.value ? 'active' : ''}`}
                  onClick={() => applyRatio(a.value)}
                  aria-pressed={settings.aspectRatio === a.value}
                >
                  {a.label}
                </button>
              ))}
            </div>
            {settings.aspectRatio === 'custom' && (
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 1200x1600"
                aria-label="Custom dimensions in pixels"
                value={settings.size}
                onChange={(e) => onChange({ size: e.target.value.trim() })}
              />
            )}
            <p className="settings-hint">
              Provider size token: <code className="settings-code">{resolved.token}</code>
              {resolved.width && resolved.height ? ` (${resolved.width}×${resolved.height} px)` : ''}
              {resolved.note ? ` — ${resolved.note}` : ''}
            </p>
          </div>

          <div className="settings-field">
            <label className="settings-label" htmlFor="img-quality">Quality / fidelity</label>
            <select
              id="img-quality"
              className="form-select"
              value={settings.quality}
              onChange={(e) => onChange({ quality: e.target.value })}
            >
              {model.qualities.map((q) => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>
          </div>

          <div className="settings-field">
            <span className="settings-label">Number of images</span>
            <div className="settings-count-row">
              {[1, 2, 4, 8].filter((n) => n <= model.maxCount).map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`settings-count-chip ${settings.count === n ? 'active' : ''}`}
                  onClick={() => onChange({ count: n })}
                  aria-pressed={settings.count === n}
                >
                  {n}
                </button>
              ))}
              <span className="settings-hint inline">max {model.maxCount} per request</span>
            </div>
          </div>

          <div className="settings-capability-list" aria-label="Model capability">
            <CapabilityRow supported={model.supportsSeed} label="Seed / reproducibility" />
            <CapabilityRow supported={model.supportsNegativePrompt} label="Negative prompt" />
            <CapabilityRow supported={model.supportsStyleStrength} label="Style strength" />
            <CapabilityRow supported={model.supportsTransparentBackground} label="Transparent background" />
            <CapabilityRow supported={model.customSize} label="Custom dimensions" />
          </div>

          {model.supportsSeed && (
            <div className="settings-field">
              <label className="settings-label" htmlFor="img-seed">Seed (-1 for random)</label>
              <input
                id="img-seed"
                type="text"
                className="form-input"
                value={settings.seed}
                onChange={(e) => onChange({ seed: e.target.value })}
              />
            </div>
          )}

          {model.supportsNegativePrompt && (
            <div className="settings-field">
              <label className="settings-label" htmlFor="img-negative">Negative prompt</label>
              <input
                id="img-negative"
                type="text"
                className="form-input"
                placeholder="ugly, deformed, blurry, low quality"
                value={settings.negativePrompt}
                onChange={(e) => onChange({ negativePrompt: e.target.value })}
              />
            </div>
          )}

          {model.supportsStyleStrength && (
            <div className="settings-field">
              <label className="settings-label" htmlFor="img-strength">
                Style strength: {settings.styleStrength}%
              </label>
              <input
                id="img-strength"
                type="range"
                min="0"
                max="100"
                step="5"
                value={settings.styleStrength}
                onChange={(e) => onChange({ styleStrength: parseInt(e.target.value, 10) })}
                className="range-input"
              />
            </div>
          )}

          <div className="image-resolution-notice" role="note">
            <AlertCircle size={13} aria-hidden="true" />
            <span>{provider.resolutionNote}</span>
          </div>
        </div>

        <div className="dialog-footer">
          <button type="button" className="gold-primary-btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

const CapabilityRow: React.FC<{ supported: boolean; label: string }> = ({ supported, label }) => (
  <span className={`settings-capability ${supported ? 'supported' : 'unsupported'}`}>
    {supported ? <Check size={12} aria-hidden="true" /> : <Minus size={12} aria-hidden="true" />}
    {label}
    <em>{supported ? 'supported' : 'not supported by this model'}</em>
  </span>
);
