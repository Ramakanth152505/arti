import React, { useMemo, useState } from 'react';
import { Layers, Film, AlertTriangle, Info, Check, Sparkles } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { videoProductionStore } from '../../services/videoProduction';
import { VIDEO_STYLES } from '../../services/videoStyles';
import { ASPECT_RATIOS, RESOLUTION_PRESETS } from '../../services/videoPrompt';
import { formatDuration, parseDuration } from '../../services/videoTypes';
import { chatStore, type VideoChatCategoryId } from '../../services/chatStore';

interface SeriesCreationFormProps {
  /** Called after a production is created, with its id and the linked chat id. */
  onCreated: (productionId: string, chatId: string) => void;
  onCancel?: () => void;
}

const LARGE_EPISODE_THRESHOLD = 60;

/** Map a chosen type/format to the video-chat category. */
function categoryForKind(kind: 'standalone' | 'series' | 'franchise'): VideoChatCategoryId {
  if (kind === 'franchise') return 'cinematic-universes';
  if (kind === 'series') return 'multi-season-series';
  return 'standalone';
}

/**
 * Series & Franchise Studio creation wizard.
 *
 * Collects only what the user already knows (partial input is allowed), shows
 * the real aggregate runtime, and — for a large production — asks for explicit
 * approval of the production plan before creating hundreds of records. It then
 * creates the real production hierarchy (seasons → episodes) and a linked
 * planning conversation. Nothing is generated or rendered here.
 */
export const SeriesCreationForm: React.FC<SeriesCreationFormProps> = ({ onCreated, onCancel }) => {
  const { showToast } = useToast();

  const [kind, setKind] = useState<'series' | 'franchise'>('series');
  const [title, setTitle] = useState('');
  const [logline, setLogline] = useState('');
  const [genre, setGenre] = useState('');
  const [styleId, setStyleId] = useState<string>('');
  const [audience, setAudience] = useState('');
  const [language, setLanguage] = useState('English');
  const [storyFormat, setStoryFormat] = useState<'episodic' | 'serialized' | 'anthology' | 'hybrid'>('serialized');
  const [seasonCount, setSeasonCount] = useState(3);
  const [episodesPerSeason, setEpisodesPerSeason] = useState(5);
  const [durationInput, setDurationInput] = useState('45 minutes');
  const [resolution, setResolution] = useState('1080p');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [planApproved, setPlanApproved] = useState(false);

  const episodeSeconds = parseDuration(durationInput)?.seconds ?? 2700;
  const totalEpisodes = Math.max(0, seasonCount) * Math.max(0, episodesPerSeason);
  const totalSeconds = totalEpisodes * episodeSeconds;
  const isLarge = totalEpisodes >= LARGE_EPISODE_THRESHOLD;

  const styleName = useMemo(() => VIDEO_STYLES.find((s) => s.id === styleId)?.name, [styleId]);

  const handleCreate = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      showToast('Enter a series title first', { type: 'warning' });
      return;
    }
    if (seasonCount < 1 || episodesPerSeason < 1) {
      showToast('A series needs at least one season and one episode per season', { type: 'warning' });
      return;
    }
    if (isLarge && !planApproved) {
      showToast('Review and approve the production plan before creating this many episodes', { type: 'warning' });
      return;
    }

    const production = videoProductionStore.createProduction({
      kind,
      title: trimmed,
      logline,
      genre,
      styleId: styleId || undefined,
      audience,
      language,
      storyFormat,
      targetResolution: resolution,
      aspectRatio,
      episodeDurationSeconds: episodeSeconds,
    });

    // Build the real season/episode manifest.
    for (let s = 1; s <= seasonCount; s += 1) {
      const season = videoProductionStore.addSeason(production.id, {
        number: s,
        title: `Season ${s}`,
        description: '',
        arc: '',
      });
      if (!season) continue;
      for (let e = 1; e <= episodesPerSeason; e += 1) {
        videoProductionStore.addEpisode(production.id, season.id, {
          number: e,
          title: `Episode ${e}`,
          synopsis: '',
          durationTargetSeconds: episodeSeconds,
        });
      }
    }

    const chat = chatStore.createVideoConversation(
      categoryForKind(kind),
      `${trimmed} — Series Planning`,
      {
        category: categoryForKind(kind),
        videoType: kind === 'franchise' ? 'cinematic-universe' : 'multi-season-series',
        styleId: styleId || undefined,
        settings: {
          resolution,
          aspectRatio,
          durationSeconds: episodeSeconds,
          language,
        },
        results: [],
        pendingGeneration: false,
        productionId: production.id,
      },
      production.id
    );
    videoProductionStore.linkChat(production.id, chat.id);
    chatStore.appendAssistantMessage(
      chat.id,
      `Created the production "${trimmed}" with ${seasonCount} season${seasonCount === 1 ? '' : 's'} and ` +
        `${totalEpisodes} planned episode${totalEpisodes === 1 ? '' : 's'} (${formatDuration(totalSeconds)} total planned runtime). ` +
        `Open My Productions to manage seasons, episodes, scenes and the series bible. ` +
        `No episode has been generated — generation needs a connected video bridge.`
    );

    showToast(
      `Created ${trimmed}: ${seasonCount} season(s), ${totalEpisodes} episodes`,
      { type: 'gold' }
    );
    onCreated(production.id, chat.id);
  };

  return (
    <div className="series-wizard" role="region" aria-label="Create series or franchise">
      <div className="series-wizard-head">
        <div className="series-wizard-heading">
          <Layers size={18} aria-hidden="true" />
          <div>
            <h2 className="series-wizard-title">Create a Series or Franchise</h2>
            <p className="series-wizard-sub">
              A series has seasons and episodes. A franchise can contain several connected series and films.
              Their combined runtime can exceed 1,000 hours without being one continuous file.
            </p>
          </div>
        </div>
      </div>

      <div className="series-wizard-grid">
        <div className="settings-field series-span-2">
          <label className="settings-label" htmlFor="sw-kind">Production kind</label>
          <div className="series-kind-toggle" role="tablist" aria-label="Production kind">
            <button
              type="button"
              role="tab"
              aria-selected={kind === 'series'}
              className={`series-kind-btn ${kind === 'series' ? 'active' : ''}`}
              onClick={() => setKind('series')}
            >
              <Film size={13} aria-hidden="true" /> Series
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={kind === 'franchise'}
              className={`series-kind-btn ${kind === 'franchise' ? 'active' : ''}`}
              onClick={() => setKind('franchise')}
            >
              <Layers size={13} aria-hidden="true" /> Cinematic universe / franchise
            </button>
          </div>
        </div>

        <div className="settings-field series-span-2">
          <label className="settings-label" htmlFor="sw-title">Title *</label>
          <input
            id="sw-title"
            type="text"
            className="form-input"
            value={title}
            placeholder="e.g. Kingdom of the Last Sun"
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="settings-field series-span-2">
          <label className="settings-label" htmlFor="sw-logline">Logline / central idea</label>
          <textarea
            id="sw-logline"
            className="form-textarea"
            rows={2}
            value={logline}
            placeholder="One or two sentences describing the series."
            onChange={(e) => setLogline(e.target.value)}
          />
        </div>

        <div className="settings-field">
          <label className="settings-label" htmlFor="sw-genre">Genre</label>
          <input id="sw-genre" type="text" className="form-input" value={genre} onChange={(e) => setGenre(e.target.value)} />
        </div>

        <div className="settings-field">
          <label className="settings-label" htmlFor="sw-style">Visual style</label>
          <select id="sw-style" className="form-select" value={styleId} onChange={(e) => setStyleId(e.target.value)}>
            <option value="">Default / decide later</option>
            {VIDEO_STYLES.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="settings-field">
          <label className="settings-label" htmlFor="sw-audience">Intended audience</label>
          <input id="sw-audience" type="text" className="form-input" value={audience} onChange={(e) => setAudience(e.target.value)} />
        </div>

        <div className="settings-field">
          <label className="settings-label" htmlFor="sw-lang">Language</label>
          <input id="sw-lang" type="text" className="form-input" value={language} onChange={(e) => setLanguage(e.target.value)} />
        </div>

        <div className="settings-field">
          <label className="settings-label" htmlFor="sw-format">Story format</label>
          <select
            id="sw-format"
            className="form-select"
            value={storyFormat}
            onChange={(e) => setStoryFormat(e.target.value as typeof storyFormat)}
          >
            <option value="episodic">Episodic</option>
            <option value="serialized">Serialized</option>
            <option value="anthology">Anthology</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>

        <div className="settings-field">
          <label className="settings-label" htmlFor="sw-seasons">Seasons</label>
          <input
            id="sw-seasons"
            type="number"
            min={1}
            max={200}
            className="form-input"
            value={seasonCount}
            onChange={(e) => setSeasonCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
          />
        </div>

        <div className="settings-field">
          <label className="settings-label" htmlFor="sw-episodes">Episodes per season</label>
          <input
            id="sw-episodes"
            type="number"
            min={1}
            max={500}
            className="form-input"
            value={episodesPerSeason}
            onChange={(e) => setEpisodesPerSeason(Math.max(1, parseInt(e.target.value, 10) || 1))}
          />
        </div>

        <div className="settings-field">
          <label className="settings-label" htmlFor="sw-duration">Approx. episode duration</label>
          <input
            id="sw-duration"
            type="text"
            className="form-input"
            value={durationInput}
            placeholder="e.g. 45 minutes"
            onChange={(e) => setDurationInput(e.target.value)}
          />
        </div>

        <div className="settings-field">
          <label className="settings-label" htmlFor="sw-res">Target resolution</label>
          <select id="sw-res" className="form-select" value={resolution} onChange={(e) => setResolution(e.target.value)}>
            {RESOLUTION_PRESETS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        <div className="settings-field">
          <label className="settings-label" htmlFor="sw-aspect">Aspect ratio</label>
          <select id="sw-aspect" className="form-select" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}>
            {ASPECT_RATIOS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Plan preview — real aggregate numbers */}
      <div className="series-plan-preview" role="status">
        <div className="series-plan-stat">
          <span className="series-plan-stat-value">{seasonCount}</span>
          <span className="series-plan-stat-label">seasons</span>
        </div>
        <div className="series-plan-stat">
          <span className="series-plan-stat-value">{totalEpisodes.toLocaleString()}</span>
          <span className="series-plan-stat-label">episodes</span>
        </div>
        <div className="series-plan-stat">
          <span className="series-plan-stat-value">{formatDuration(episodeSeconds)}</span>
          <span className="series-plan-stat-label">per episode</span>
        </div>
        <div className="series-plan-stat accent">
          <span className="series-plan-stat-value">{formatDuration(totalSeconds)}</span>
          <span className="series-plan-stat-label">total planned runtime</span>
        </div>
      </div>

      <div className="video-honesty-note info" role="note">
        <Info size={13} aria-hidden="true" />
        <span>
          This is a production hierarchy: each episode is its own record with its own file. The total
          runtime is the sum of all episodes — not one continuous video.
          {styleName ? ` Visual style: ${styleName}.` : ''}
        </span>
      </div>

      {isLarge && (
        <label className="series-plan-approve">
          <input type="checkbox" checked={planApproved} onChange={(e) => setPlanApproved(e.target.checked)} />
          <span>
            <AlertTriangle size={13} aria-hidden="true" /> I approve creating {totalEpisodes.toLocaleString()} episode
            records and a {formatDuration(totalSeconds)} production plan. Work proceeds incrementally.
          </span>
        </label>
      )}

      <div className="series-wizard-actions">
        {onCancel && (
          <button type="button" className="gold-ghost-btn" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="button" className="gold-primary-btn" onClick={handleCreate}>
          <Sparkles size={14} aria-hidden="true" />
          <span>Create {kind === 'franchise' ? 'Franchise' : 'Series'}</span>
          <Check size={13} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
