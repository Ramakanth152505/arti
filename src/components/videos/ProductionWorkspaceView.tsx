import React, { useMemo, useState } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  BookOpen,
  ListChecks,
  Layers,
  Film,
  Download,
  AlertTriangle,
  CheckCircle2,
  Archive,
  Copy,
  ShieldCheck,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import {
  videoProductionStore,
  productionOverview,
  buildManifest,
  collectProductionAssets,
  type Production,
  type Scene,
  type Shot,
} from '../../services/videoProduction';
import { formatDuration } from '../../services/videoTypes';
import { downloadVideo } from '../../services/videoDownload';
import { SceneShotEditor } from './SceneShotEditor';
import { SeriesBiblePanel } from './SeriesBiblePanel';
import { ContinuityPanel } from './ContinuityPanel';

interface ProductionWorkspaceViewProps {
  production: Production;
  onGenerateShot: (production: Production, seasonId: string, episodeId: string, scene: Scene, shot: Shot) => void;
  busy: boolean;
  onBack: () => void;
}

type DetailTab = 'episodes' | 'bible' | 'continuity' | 'assets';

const EPISODES_PAGE_SIZE = 40;

/**
 * Production workspace.
 *
 * Manages the full hierarchy for one series/franchise: seasons, episodes,
 * scenes, shots, the series bible and continuity records. Long lists are
 * paginated so a production with hundreds of episodes never loads everything at
 * once. All counts come from the real persisted records.
 */
export const ProductionWorkspaceView: React.FC<ProductionWorkspaceViewProps> = ({
  production,
  onGenerateShot,
  busy,
  onBack,
}) => {
  const { showToast } = useToast();
  const [detailTab, setDetailTab] = useState<DetailTab>('episodes');
  const [activeSeasonId, setActiveSeasonId] = useState<string>(production.seasons[0]?.id ?? '');
  const [activeEpisodeId, setActiveEpisodeId] = useState<string>('');
  const [page, setPage] = useState(0);

  const overview = useMemo(() => productionOverview(production), [production]);
  const manifest = useMemo(() => buildManifest(production), [production]);
  const assets = useMemo(() => collectProductionAssets(production), [production]);

  const season = production.seasons.find((s) => s.id === activeSeasonId) ?? production.seasons[0];
  const episode = season?.episodes.find((e) => e.id === activeEpisodeId);

  const pageCount = Math.max(1, Math.ceil(manifest.length / EPISODES_PAGE_SIZE));
  const pageRows = manifest.slice(page * EPISODES_PAGE_SIZE, (page + 1) * EPISODES_PAGE_SIZE);

  const addSeason = () => {
    const s = videoProductionStore.addSeason(production.id, {});
    if (s) {
      setActiveSeasonId(s.id);
      showToast(`Added ${s.title}`, { type: 'gold' });
    }
  };

  const addEpisode = () => {
    if (!season) return;
    const ep = videoProductionStore.addEpisode(production.id, season.id, {});
    if (ep) {
      setActiveEpisodeId(ep.id);
      showToast(`Added ${ep.title} to ${season.title}`, { type: 'gold' });
    }
  };

  const handleDownloadAsset = async (url: string, title: string, format: string) => {
    const outcome = await downloadVideo(url, title, format, 1);
    showToast(outcome.ok ? `Downloaded ${outcome.filename}.` : outcome.reason, { type: outcome.ok ? 'success' : 'error' });
  };

  return (
    <div className="production-workspace">
      <header className="production-workspace-head">
        <button type="button" className="gold-ghost-btn small" onClick={onBack}>
          <ChevronLeft size={13} aria-hidden="true" />
          <span>My Productions</span>
        </button>
        <div className="production-head-title">
          <h2 className="t-h3">{production.title}</h2>
          <div className="production-head-meta">
            <span className="project-type-badge">
              {production.kind === 'franchise' ? 'Franchise / Universe' : production.kind === 'series' ? 'Series' : 'Standalone'}
            </span>
            <span className="project-platform-badge">{production.storyFormat}</span>
            <span className="chat-private-pill">
              <ShieldCheck size={11} aria-hidden="true" /> Local browser only
            </span>
          </div>
          {production.logline && <p className="production-logline">{production.logline}</p>}
        </div>
      </header>

      {/* Overview — real numbers */}
      <div className="production-overview" role="region" aria-label="Production overview">
        <div className="production-overview-stat"><span className="pos-value">{overview.seasons}</span><span className="pos-label">Seasons</span></div>
        <div className="production-overview-stat"><span className="pos-value">{overview.plannedEpisodes.toLocaleString()}</span><span className="pos-label">Planned episodes</span></div>
        <div className="production-overview-stat"><span className="pos-value">{overview.completedEpisodes}</span><span className="pos-label">Completed</span></div>
        <div className="production-overview-stat"><span className="pos-value">{overview.episodesInProgress}</span><span className="pos-label">In progress</span></div>
        <div className="production-overview-stat"><span className="pos-value">{overview.failedTasks}</span><span className="pos-label">Failed / blocked</span></div>
        <div className="production-overview-stat"><span className="pos-value">{overview.missingScenes}</span><span className="pos-label">Missing scenes</span></div>
        <div className="production-overview-stat"><span className="pos-value">{overview.continuityWarnings}</span><span className="pos-label">Continuity warnings</span></div>
        <div className="production-overview-stat"><span className="pos-value">{overview.queuedJobs}</span><span className="pos-label">Queued jobs</span></div>
        <div className="production-overview-stat accent"><span className="pos-value">{overview.totalPlannedRuntime}</span><span className="pos-label">Total planned runtime</span></div>
      </div>

      <div className="production-detail-tabs" role="tablist" aria-label="Production sections">
        {([
          ['episodes', 'Seasons & Episodes', <Layers size={13} key="i" aria-hidden="true" />],
          ['bible', 'Series Bible', <BookOpen size={13} key="i" aria-hidden="true" />],
          ['continuity', 'Continuity', <ListChecks size={13} key="i" aria-hidden="true" />],
          ['assets', 'Assets', <Film size={13} key="i" aria-hidden="true" />],
        ] as Array<[DetailTab, string, React.ReactNode]>).map(([id, label, icon]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={detailTab === id}
            className={`production-detail-tab ${detailTab === id ? 'active' : ''}`}
            onClick={() => setDetailTab(id)}
          >
            {icon}
            <span>{label}</span>
          </button>
        ))}
      </div>

      {detailTab === 'episodes' && (
        <div className="production-episodes-layout">
          {/* Season list */}
          <aside className="season-column" aria-label="Seasons">
            <div className="season-column-head">
              <span>Seasons</span>
              <button type="button" className="gold-ghost-btn tiny" onClick={addSeason} title="Add season">
                <Plus size={12} aria-hidden="true" />
              </button>
            </div>
            {production.seasons.length === 0 ? (
              <p className="season-empty">No seasons yet.</p>
            ) : (
              <ul className="season-list">
                {production.seasons.map((s, i) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      className={`season-item ${s.id === season?.id ? 'active' : ''} ${s.archived ? 'archived' : ''}`}
                      onClick={() => {
                        setActiveSeasonId(s.id);
                        setActiveEpisodeId('');
                      }}
                    >
                      <span className="season-item-num">S{s.number}</span>
                      <span className="season-item-title">{s.title}</span>
                      <span className="season-item-count">{s.episodes.length}</span>
                    </button>
                    <div className="season-item-tools">
                      <button
                        type="button"
                        className="season-tool-btn"
                        title="Move up"
                        aria-label={`Move ${s.title} up`}
                        disabled={i === 0}
                        onClick={() => videoProductionStore.moveSeason(production.id, s.id, -1)}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="season-tool-btn"
                        title="Move down"
                        aria-label={`Move ${s.title} down`}
                        disabled={i === production.seasons.length - 1}
                        onClick={() => videoProductionStore.moveSeason(production.id, s.id, 1)}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="season-tool-btn"
                        title="Duplicate season structure"
                        aria-label={`Duplicate ${s.title}`}
                        onClick={() => videoProductionStore.duplicateSeason(production.id, s.id)}
                      >
                        <Copy size={11} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="season-tool-btn"
                        title={s.archived ? 'Unarchive season' : 'Archive season (keeps history)'}
                        aria-label={`Archive ${s.title}`}
                        onClick={() => videoProductionStore.updateSeason(production.id, s.id, { archived: !s.archived })}
                      >
                        <Archive size={11} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="season-tool-btn danger"
                        title="Delete season"
                        aria-label={`Delete ${s.title}`}
                        onClick={() => {
                          if (window.confirm(`Delete ${s.title} and its ${s.episodes.length} episode(s)? This cannot be undone.`)) {
                            videoProductionStore.removeSeason(production.id, s.id);
                            if (season?.id === s.id) setActiveSeasonId('');
                          }
                        }}
                      >
                        <Trash2 size={11} aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          {/* Episode list + detail */}
          <section className="episode-column" aria-label="Episodes">
            {!season ? (
              <p className="season-empty">Add or select a season to manage its episodes.</p>
            ) : (
              <>
                <div className="episode-column-head">
                  <input
                    type="text"
                    className="season-title-edit"
                    value={season.title}
                    onChange={(e) => videoProductionStore.updateSeason(production.id, season.id, { title: e.target.value })}
                    aria-label="Season title"
                  />
                  <button type="button" className="gold-ghost-btn small" onClick={addEpisode}>
                    <Plus size={12} aria-hidden="true" />
                    <span>Add episode</span>
                  </button>
                </div>

                <div className="settings-field">
                  <label className="settings-label">Season arc / description</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    value={season.arc}
                    placeholder="Season-level story arc."
                    onChange={(e) => videoProductionStore.updateSeason(production.id, season.id, { arc: e.target.value })}
                  />
                </div>

                {season.episodes.length === 0 ? (
                  <p className="season-empty">No episodes in this season yet.</p>
                ) : (
                  <ul className="episode-list">
                    {season.episodes.map((ep, i) => (
                      <li key={ep.id} className={`episode-item ${ep.id === activeEpisodeId ? 'active' : ''}`}>
                        <button
                          type="button"
                          className="episode-item-main"
                          onClick={() => setActiveEpisodeId(ep.id === activeEpisodeId ? '' : ep.id)}
                        >
                          <span className="episode-num">E{ep.number}</span>
                          <span className="episode-title">{ep.title}</span>
                          <span className={`episode-status status-${ep.status}`}>{ep.status}</span>
                          <span className="episode-dur">{formatDuration(ep.durationTargetSeconds)}</span>
                          {ep.scenes.length === 0 ? (
                            <span className="episode-warn" title="No scenes yet">
                              <AlertTriangle size={11} aria-hidden="true" />
                            </span>
                          ) : (
                            <span className="episode-ok" title="Has scenes">
                              <CheckCircle2 size={11} aria-hidden="true" />
                            </span>
                          )}
                        </button>
                        <div className="episode-item-tools">
                          <button type="button" className="season-tool-btn" title="Move up" disabled={i === 0}
                            onClick={() => videoProductionStore.moveEpisode(production.id, season.id, ep.id, -1)}>↑</button>
                          <button type="button" className="season-tool-btn" title="Move down" disabled={i === season.episodes.length - 1}
                            onClick={() => videoProductionStore.moveEpisode(production.id, season.id, ep.id, 1)}>↓</button>
                          <button type="button" className="season-tool-btn" title="Duplicate as alternate version"
                            onClick={() => videoProductionStore.duplicateEpisode(production.id, season.id, ep.id)}>
                            <Copy size={11} aria-hidden="true" />
                          </button>
                          <button type="button" className="season-tool-btn danger" title="Delete episode"
                            onClick={() => {
                              if (window.confirm(`Delete ${ep.title}? This cannot be undone.`)) {
                                videoProductionStore.removeEpisode(production.id, season.id, ep.id);
                                if (activeEpisodeId === ep.id) setActiveEpisodeId('');
                              }
                            }}>
                            <Trash2 size={11} aria-hidden="true" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {episode && (
                  <div className="episode-detail">
                    <div className="settings-field">
                      <label className="settings-label">Episode title</label>
                      <input
                        type="text"
                        className="form-input"
                        value={episode.title}
                        onChange={(e) => videoProductionStore.updateEpisode(production.id, season.id, episode.id, { title: e.target.value })}
                      />
                    </div>
                    <div className="settings-field">
                      <label className="settings-label">Synopsis</label>
                      <textarea
                        className="form-textarea"
                        rows={2}
                        value={episode.synopsis}
                        onChange={(e) => videoProductionStore.updateEpisode(production.id, season.id, episode.id, { synopsis: e.target.value })}
                      />
                    </div>
                    <div className="settings-field">
                      <label className="settings-label">Script / outline</label>
                      <textarea
                        className="form-textarea"
                        rows={4}
                        value={episode.script}
                        placeholder="Script or outline. Editing this episode never changes another episode."
                        onChange={(e) => videoProductionStore.updateEpisode(production.id, season.id, episode.id, { script: e.target.value })}
                      />
                    </div>
                    <div className="episode-detail-row">
                      <div className="settings-field">
                        <label className="settings-label">Status</label>
                        <select
                          className="form-select"
                          value={episode.status}
                          onChange={(e) => videoProductionStore.updateEpisode(production.id, season.id, episode.id, { status: e.target.value as typeof episode.status })}
                        >
                          {['planned', 'outline', 'script', 'storyboard', 'generating', 'generated', 'assembled', 'exported', 'failed', 'blocked'].map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div className="settings-field">
                        <label className="settings-label">Duration target (minutes)</label>
                        <input
                          type="number"
                          min={0.1}
                          step={0.5}
                          className="form-input"
                          value={Math.round((episode.durationTargetSeconds / 60) * 10) / 10}
                          onChange={(e) =>
                            videoProductionStore.updateEpisode(production.id, season.id, episode.id, {
                              durationTargetSeconds: Math.max(6, (parseFloat(e.target.value) || 1) * 60),
                            })
                          }
                        />
                      </div>
                      <div className="settings-field">
                        <label className="settings-label">Captions / subtitles</label>
                        <input
                          type="text"
                          className="form-input"
                          value={episode.captions}
                          placeholder="Caption language / notes"
                          onChange={(e) => videoProductionStore.updateEpisode(production.id, season.id, episode.id, { captions: e.target.value })}
                        />
                      </div>
                    </div>

                    <SceneShotEditor
                      key={episode.id}
                      production={production}
                      seasonId={season.id}
                      episode={episode}
                      busy={busy}
                      onGenerateShot={(scene, shot) => onGenerateShot(production, season.id, episode.id, scene, shot)}
                    />
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      )}

      {detailTab === 'bible' && <SeriesBiblePanel production={production} />}
      {detailTab === 'continuity' && <ContinuityPanel production={production} />}

      {detailTab === 'assets' && (
        <div className="production-assets">
          {assets.length === 0 ? (
            <p className="season-empty">No generated assets yet. Generated shots and episodes appear here.</p>
          ) : (
            <div className="asset-grid">
              {assets.map((a) => (
                <figure key={a.id} className="asset-tile">
                  {a.kind === 'video' ? (
                    <video src={a.url} controls preload="metadata" className="asset-media" />
                  ) : (
                    <img src={a.url} alt="" className="asset-media" loading="lazy" />
                  )}
                  <figcaption className="asset-meta">
                    <span>
                      {a.width && a.height ? `${a.width}×${a.height}` : ''} · {formatDuration(a.durationSeconds)} ·{' '}
                      {a.format.toUpperCase()}
                    </span>
                    <button
                      type="button"
                      className="video-tile-action"
                      onClick={() => handleDownloadAsset(a.url, production.title, a.format)}
                      title="Download to this device"
                      aria-label="Download asset"
                    >
                      <Download size={13} aria-hidden="true" />
                    </button>
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Episode manifest — the season/episode overview. Paginated for large
          productions so hundreds of episodes never render at once. */}
      {detailTab === 'episodes' && manifest.length > 0 && (
        <div className="production-manifest">
          <div className="production-manifest-head">
            <span>Episode manifest ({manifest.length.toLocaleString()} episodes)</span>
            <div className="manifest-pager">
              <button type="button" className="season-tool-btn" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft size={12} aria-hidden="true" />
              </button>
              <span>{page + 1} / {pageCount}</span>
              <button type="button" className="season-tool-btn" disabled={page >= pageCount - 1} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight size={12} aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="manifest-rows">
            {pageRows.map((r) => (
              <div key={r.episodeId} className="manifest-row">
                <span className="manifest-s">S{r.seasonNumber}</span>
                <span className="manifest-e">E{r.episodeNumber}</span>
                <span className="manifest-title">{r.episodeTitle}</span>
                <span className={`episode-status status-${r.status}`}>{r.status}</span>
                <span className="manifest-meta">{formatDuration(r.durationSeconds)} · {r.scenes} scenes · {r.shots} shots</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
