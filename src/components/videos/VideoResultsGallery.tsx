import React from 'react';
import {
  Download,
  RefreshCw,
  Copy,
  Trash2,
  AlertTriangle,
  Film,
  Sparkles,
  Info,
} from 'lucide-react';
import type { VideoResultRecord, GeneratedVideoRecord } from '../../services/chatStore';
import { downloadVideo } from '../../services/videoDownload';
import { formatDuration } from '../../services/videoTypes';

interface VideoResultsGalleryProps {
  results: VideoResultRecord[];
  onRegenerate: (result: VideoResultRecord) => void;
  onReuse: (result: VideoResultRecord) => void;
  onRemove: (resultId: string) => void;
  onNotify: (message: string, type: 'success' | 'warning' | 'error' | 'info' | 'gold') => void;
}

/**
 * Generated-video results.
 *
 * Real engine output only. Each result keeps its relationship to the original
 * prompt, the selected style and the exact requested/effective settings. Every
 * control performs a real operation; nothing is decorative.
 */
export const VideoResultsGallery: React.FC<VideoResultsGalleryProps> = ({
  results,
  onRegenerate,
  onReuse,
  onRemove,
  onNotify,
}) => {
  if (results.length === 0) return null;

  const handleDownload = async (video: GeneratedVideoRecord, result: VideoResultRecord, index: number) => {
    const outcome = await downloadVideo(video.url, result.originalPrompt, video.format, index + 1);
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
    <div className="video-results-stack" aria-label="Generated video results">
      {results.map((result) => (
        <article key={result.id} className={`video-result ${result.status}`}>
          <header className="video-result-head">
            <div className="video-result-heading">
              {result.status === 'failed' ? (
                <AlertTriangle size={14} className="video-result-status-icon failed" aria-hidden="true" />
              ) : result.status === 'blocked' ? (
                <AlertTriangle size={14} className="video-result-status-icon blocked" aria-hidden="true" />
              ) : (
                <Sparkles size={14} className="video-result-status-icon" aria-hidden="true" />
              )}
              <span className="video-result-title">
                {result.status === 'complete'
                  ? `${result.videos.length} clip${result.videos.length === 1 ? '' : 's'} generated`
                  : result.status === 'blocked'
                    ? 'Generation blocked'
                    : 'Generation failed'}
              </span>
              {result.styleName && <span className="video-result-style">{result.styleName}</span>}
              <span className="video-result-time">{result.createdAt}</span>
            </div>
            <button
              type="button"
              className="video-result-remove"
              onClick={() => onRemove(result.id)}
              title="Remove this result from the conversation"
              aria-label="Remove this result from the conversation"
            >
              <Trash2 size={13} aria-hidden="true" />
            </button>
          </header>

          {result.status !== 'complete' ? (
            <div className="video-result-error" role="alert">
              <span>{result.error || 'The video engine did not return a result.'}</span>
              <button type="button" className="gold-ghost-btn small" onClick={() => onRegenerate(result)}>
                <RefreshCw size={12} aria-hidden="true" />
                <span>Retry</span>
              </button>
            </div>
          ) : (
            <div className="video-result-grid">
              {result.videos.map((video, index) => (
                <figure key={video.id} className="video-tile">
                  <div className="video-tile-media">
                    <video
                      src={video.url}
                      poster={video.poster}
                      controls
                      preload="metadata"
                      className="video-tile-player"
                      aria-label={`Generated clip ${index + 1}`}
                    />
                  </div>
                  <figcaption className="video-tile-meta">
                    <span className="video-tile-spec">
                      {video.width && video.height ? `${video.width}×${video.height}` : 'size unknown'} ·{' '}
                      {formatDuration(video.durationSeconds)} · {video.format.toUpperCase()}
                    </span>
                    <span className="video-tile-actions">
                      <button
                        type="button"
                        className="video-tile-action"
                        onClick={() => handleDownload(video, result, index)}
                        title="Download to this device"
                        aria-label={`Download clip ${index + 1}`}
                      >
                        <Download size={13} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="video-tile-action"
                        onClick={() => handleCopyPrompt(result.originalPrompt)}
                        title="Copy the prompt"
                        aria-label="Copy the prompt"
                      >
                        <Copy size={13} aria-hidden="true" />
                      </button>
                    </span>
                    {video.upscaledFrom && (
                      <span className="video-tile-upscaled">
                        <Info size={11} aria-hidden="true" /> Upscaled from {video.upscaledFrom} (not native)
                      </span>
                    )}
                  </figcaption>
                </figure>
              ))}
            </div>
          )}

          {result.videos.length === 0 && result.status === 'complete' && (
            <div className="video-result-empty">
              <Film size={16} aria-hidden="true" />
              <span>The engine returned no clips for this request.</span>
            </div>
          )}

          <div className="video-result-settings">
            <span className="video-result-setting">
              <strong>Model:</strong> {result.settings.model}
            </span>
            <span className="video-result-setting">
              <strong>Requested:</strong> {formatDuration(result.settings.durationSeconds)} ·{' '}
              {result.settings.resolution} · {result.settings.aspectRatio} · {result.settings.fps}fps
            </span>
            {result.effectiveNote && (
              <span className="video-result-setting warning">
                <strong>Engine produced:</strong> {result.effectiveNote}
              </span>
            )}
          </div>

          <details className="video-result-prompt">
            <summary>Prepared prompt</summary>
            <p className="video-result-prompt-text">{result.preparedPrompt}</p>
          </details>

          <div className="video-result-actions">
            <button type="button" className="video-action-btn" onClick={() => onRegenerate(result)}>
              <RefreshCw size={13} aria-hidden="true" />
              <span>Regenerate</span>
            </button>
            <button type="button" className="video-action-btn" onClick={() => onReuse(result)}>
              <Sparkles size={13} aria-hidden="true" />
              <span>Reuse prompt</span>
            </button>
            <button
              type="button"
              className="video-action-btn"
              onClick={() => handleCopyPrompt(result.preparedPrompt)}
            >
              <Copy size={13} aria-hidden="true" />
              <span>Copy prompt</span>
            </button>
          </div>
        </article>
      ))}
    </div>
  );
};
