import React, { useMemo, useState } from 'react';
import { Search, Download, Film, AlertTriangle, Filter, Play } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useChatStore } from '../../services/chatStore';
import { useVideoProductions } from '../../services/videoProduction';
import { downloadVideo } from '../../services/videoDownload';
import { formatDuration } from '../../services/videoTypes';

interface VideoLibraryProps {
  /** Open the conversation that produced an asset. */
  onOpenConversation: (chatId: string) => void;
  /** Open the linked production workspace, when the asset belongs to one. */
  onOpenProduction: (productionId: string) => void;
}

interface LibraryRow {
  id: string;
  chatId: string;
  title: string;
  url: string;
  poster?: string;
  format: string;
  durationSeconds: number;
  width: number;
  height: number;
  resolution: string;
  createdAt: string;
  category: string;
  status: string;
  productionId?: string;
  productionTitle?: string;
  upscaledFrom?: string;
}

type KindFilter = 'all' | 'standalone' | 'films' | 'series' | 'trailers';

/**
 * Previous Videos / production library.
 *
 * Shows real generated video assets only — actual provider output, never a
 * fabricated thumbnail. Filters by kind, category and status, and each row can
 * be downloaded to this device or reopened at its conversation or production.
 */
export const VideoLibrary: React.FC<VideoLibraryProps> = ({ onOpenConversation, onOpenProduction }) => {
  const { showToast } = useToast();
  const chatState = useChatStore();
  const prodState = useVideoProductions();
  const [query, setQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<KindFilter>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'complete' | 'failed' | 'blocked'>('all');

  const rows = useMemo<LibraryRow[]>(() => {
    const out: LibraryRow[] = [];
    const byId = new Map(prodState.productions.map((p) => [p.id, p]));
    const videoChats = chatState.conversations.filter((c) => c.workspace === 'videos' && !c.archived);

    for (const conv of videoChats) {
      const meta = conv.videoMeta;
      const production = meta?.productionId ? byId.get(meta.productionId) : undefined;
      for (const result of meta?.results ?? []) {
        for (const v of result.videos) {
          out.push({
            id: v.id,
            chatId: conv.id,
            title: result.originalPrompt.slice(0, 80) || conv.title,
            url: v.url,
            poster: v.poster,
            format: v.format,
            durationSeconds: v.durationSeconds,
            width: v.width,
            height: v.height,
            resolution: v.width && v.height ? `${v.width}×${v.height}` : 'unknown',
            createdAt: result.createdAt,
            category: conv.category ?? 'standalone',
            status: result.status,
            productionId: production?.id,
            productionTitle: production?.title,
            upscaledFrom: v.upscaledFrom,
          });
        }
      }
    }
    return out;
  }, [chatState.conversations, prodState.productions]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (q && !`${r.title} ${r.category} ${r.productionTitle ?? ''}`.toLowerCase().includes(q)) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (kindFilter === 'standalone' && r.category !== 'standalone') return false;
      if (kindFilter === 'films' && !['feature-films', 'short-films'].includes(r.category)) return false;
      if (kindFilter === 'series' && !['tv-web-series', 'animated-series', 'anime-series', 'documentary-series', 'multi-season-series', 'educational-series', 'social-media-series'].includes(r.category)) return false;
      if (kindFilter === 'trailers' && r.category !== 'trailers-teasers') return false;
      return true;
    });
  }, [rows, query, kindFilter, statusFilter]);

  const handleDownload = async (row: LibraryRow) => {
    const outcome = await downloadVideo(row.url, row.title, row.format, 1);
    showToast(outcome.ok ? `Downloaded ${outcome.filename}.` : outcome.reason, { type: outcome.ok ? 'success' : 'error' });
  };

  return (
    <div className="video-library">
      <div className="video-library-toolbar">
        <div className="style-picker-search video-library-search">
          <Search size={14} className="style-picker-search-icon" aria-hidden="true" />
          <input
            type="text"
            className="style-picker-search-input field-integrated"
            placeholder="Search previous videos…"
            aria-label="Search previous videos"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="video-library-filters">
          <Filter size={13} aria-hidden="true" />
          <select
            className="form-select"
            value={kindFilter}
            onChange={(e) => setKindFilter(e.target.value as KindFilter)}
            aria-label="Filter by kind"
          >
            <option value="all">All kinds</option>
            <option value="standalone">Standalone videos</option>
            <option value="films">Films</option>
            <option value="series">Series</option>
            <option value="trailers">Trailers</option>
          </select>
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            <option value="complete">Complete</option>
            <option value="failed">Failed</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="video-library-empty">
          <Film size={26} aria-hidden="true" />
          <h3>No previous videos</h3>
          <p>
            Generated clips appear here once a video bridge is connected and a real render completes. ARTI
            never shows a fabricated placeholder as real output.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="video-library-empty">
          <AlertTriangle size={22} aria-hidden="true" />
          <p>No videos match the current filters.</p>
        </div>
      ) : (
        <div className="video-library-grid">
          {filtered.map((row) => (
            <article key={row.id} className="library-card">
              <div className="library-card-media">
                <video src={row.url} poster={row.poster} controls preload="metadata" className="library-card-player" />
              </div>
              <div className="library-card-body">
                <h3 className="library-card-title">{row.title}</h3>
                <div className="library-card-meta">
                  <span>{row.resolution}</span>
                  <span>{formatDuration(row.durationSeconds)}</span>
                  <span>{row.format.toUpperCase()}</span>
                  <span>{row.createdAt}</span>
                </div>
                {row.upscaledFrom && (
                  <p className="library-card-note">
                    <AlertTriangle size={11} aria-hidden="true" /> Upscaled from {row.upscaledFrom} — not native.
                  </p>
                )}
                {row.productionTitle && (
                  <button
                    type="button"
                    className="chat-link-btn library-prod-link"
                    onClick={() => row.productionId && onOpenProduction(row.productionId)}
                  >
                    {row.productionTitle} ›
                  </button>
                )}
                <div className="library-card-actions">
                  <button type="button" className="video-action-btn" onClick={() => onOpenConversation(row.chatId)}>
                    <Play size={12} aria-hidden="true" />
                    <span>Open chat</span>
                  </button>
                  <button type="button" className="video-action-btn" onClick={() => handleDownload(row)}>
                    <Download size={12} aria-hidden="true" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

/** Export for tests: a stable label for the library empty state. */
export const LIBRARY_EMPTY_TEXT = 'No previous videos';
