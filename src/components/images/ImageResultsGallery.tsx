import React, { useState } from 'react';
import {
  Download,
  RefreshCw,
  Shuffle,
  Copy,
  Maximize2,
  Trash2,
  AlertTriangle,
  ImageOff,
  X,
  Sparkles,
  Info,
} from 'lucide-react';
import type { ImageResultRecord, GeneratedImage } from '../../services/chatStore';
import { downloadImage } from '../../services/imageDownload';

interface ImageResultsGalleryProps {
  results: ImageResultRecord[];
  onRegenerate: (result: ImageResultRecord) => void;
  onVariation: (result: ImageResultRecord) => void;
  onReuse: (result: ImageResultRecord) => void;
  onRemove: (resultId: string) => void;
  onNotify: (message: string, type: 'success' | 'warning' | 'error' | 'info' | 'gold') => void;
}

/**
 * Generated-image results.
 *
 * Real provider output only. Each result keeps its relationship to the original
 * prompt, clarification answers, selected style and generation settings. Every
 * action here performs a real operation or is not shown — nothing is decorative.
 */
export const ImageResultsGallery: React.FC<ImageResultsGalleryProps> = ({
  results,
  onRegenerate,
  onVariation,
  onReuse,
  onRemove,
  onNotify,
}) => {
  const [lightbox, setLightbox] = useState<{ image: GeneratedImage; prompt: string } | null>(null);

  if (results.length === 0) return null;

  const handleDownload = async (image: GeneratedImage, result: ImageResultRecord, index: number) => {
    const outcome = await downloadImage(image.url, result.originalPrompt, image.format, index + 1);
    if (outcome.ok) {
      onNotify(`Downloaded ${outcome.filename} to this device.`, 'success');
    } else {
      onNotify(outcome.reason, 'error');
    }
  };

  const handleCopyPrompt = async (prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      onNotify('Prompt copied to clipboard', 'info');
    } catch {
      onNotify('Clipboard is unavailable in this browser.', 'warning');
    }
  };

  return (
    <div className="image-results-stack" aria-label="Generated image results">
      {results.map((result) => (
        <article key={result.id} className={`image-result ${result.status}`}>
          <header className="image-result-head">
            <div className="image-result-heading">
              {result.status === 'failed' ? (
                <AlertTriangle size={14} className="image-result-status-icon failed" aria-hidden="true" />
              ) : (
                <Sparkles size={14} className="image-result-status-icon" aria-hidden="true" />
              )}
              <span className="image-result-title">
                {result.status === 'failed' ? 'Generation failed' : `${result.images.length} image${result.images.length === 1 ? '' : 's'} generated`}
              </span>
              {result.styleName && <span className="image-result-style">{result.styleName}</span>}
              <span className="image-result-time">{result.createdAt}</span>
            </div>
            <button
              type="button"
              className="image-result-remove"
              onClick={() => onRemove(result.id)}
              title="Remove this result from the conversation"
              aria-label="Remove this result from the conversation"
            >
              <Trash2 size={13} aria-hidden="true" />
            </button>
          </header>

          {result.status === 'failed' ? (
            <div className="image-result-error" role="alert">
              <span>{result.error || 'The image provider did not return a result.'}</span>
              <button type="button" className="gold-ghost-btn small" onClick={() => onRegenerate(result)}>
                <RefreshCw size={12} aria-hidden="true" />
                <span>Retry</span>
              </button>
            </div>
          ) : (
            <div className="image-result-gallery">
              {result.images.map((image, index) => (
                <figure key={image.id} className="image-tile">
                  <button
                    type="button"
                    className="image-tile-media"
                    onClick={() => setLightbox({ image, prompt: result.originalPrompt })}
                    title="View full size"
                    aria-label={`View generated image ${index + 1} full size`}
                  >
                    <img
                      src={image.url}
                      alt={`Generated result ${index + 1}: ${result.originalPrompt.slice(0, 80)}`}
                      loading="lazy"
                      decoding="async"
                    />
                    <span className="image-tile-zoom" aria-hidden="true">
                      <Maximize2 size={14} />
                    </span>
                  </button>
                  <figcaption className="image-tile-meta">
                    <span className="image-tile-spec">
                      {image.width && image.height ? `${image.width}×${image.height}` : 'size unknown'} ·{' '}
                      {image.format.toUpperCase()}
                    </span>
                    <span className="image-tile-actions">
                      <button
                        type="button"
                        className="image-tile-action"
                        onClick={() => handleDownload(image, result, index)}
                        title="Download to this device"
                        aria-label={`Download image ${index + 1}`}
                      >
                        <Download size={13} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="image-tile-action"
                        onClick={() => handleCopyPrompt(result.originalPrompt)}
                        title="Copy the prompt"
                        aria-label="Copy the prompt"
                      >
                        <Copy size={13} aria-hidden="true" />
                      </button>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          )}

          {result.images.length === 0 && result.status !== 'failed' && (
            <div className="image-result-empty">
              <ImageOff size={16} aria-hidden="true" />
              <span>The provider returned no images for this request.</span>
            </div>
          )}

          <div className="image-result-settings">
            <span className="image-result-setting">
              <strong>Model:</strong> {result.settings.model}
            </span>
            <span className="image-result-setting">
              <strong>Size:</strong> {result.settings.size}
            </span>
            {result.nativeResolution && (
              <span className="image-result-setting">
                <strong>Native:</strong> {result.nativeResolution}
              </span>
            )}
            <span className="image-result-setting">
              <strong>Quality:</strong> {result.settings.quality}
            </span>
            {result.settings.seed && result.settings.seed !== '-1' && (
              <span className="image-result-setting">
                <strong>Seed:</strong> {result.settings.seed}
              </span>
            )}
            {result.upscaledTo && (
              <span className="image-result-setting upscaled">
                <strong>Upscaled to:</strong> {result.upscaledTo}
              </span>
            )}
          </div>

          <details className="image-result-prompt">
            <summary>Prepared prompt</summary>
            <p className="image-result-prompt-text">{result.preparedPrompt}</p>
          </details>

          <div className="image-result-actions">
            <button type="button" className="image-action-btn" onClick={() => onRegenerate(result)}>
              <RefreshCw size={13} aria-hidden="true" />
              <span>Regenerate</span>
            </button>
            <button type="button" className="image-action-btn" onClick={() => onVariation(result)}>
              <Shuffle size={13} aria-hidden="true" />
              <span>Create variation</span>
            </button>
            <button type="button" className="image-action-btn" onClick={() => onReuse(result)}>
              <Sparkles size={13} aria-hidden="true" />
              <span>Reuse prompt</span>
            </button>
            <button
              type="button"
              className="image-action-btn"
              onClick={() => handleCopyPrompt(result.preparedPrompt)}
            >
              <Copy size={13} aria-hidden="true" />
              <span>Copy prompt</span>
            </button>
          </div>
        </article>
      ))}

      {lightbox && (
        <div className="dialog-backdrop image-lightbox-backdrop" onClick={() => setLightbox(null)}>
          <div
            className="image-lightbox"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Full-size image preview"
          >
            <button
              type="button"
              className="image-lightbox-close"
              onClick={() => setLightbox(null)}
              aria-label="Close full-size preview"
            >
              <X size={16} />
            </button>
            <img src={lightbox.image.url} alt={lightbox.prompt} className="image-lightbox-img" />
            <div className="image-lightbox-caption">
              <span>
                <Info size={12} aria-hidden="true" />{' '}
                {lightbox.image.width && lightbox.image.height
                  ? `${lightbox.image.width}×${lightbox.image.height} · ${lightbox.image.format.toUpperCase()}`
                  : lightbox.image.format.toUpperCase()}
              </span>
              {lightbox.image.revisedPrompt && <span>Provider prompt: {lightbox.image.revisedPrompt}</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
