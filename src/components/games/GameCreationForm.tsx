import React, { useMemo, useState } from 'react';
import { Check, Search, Info, Gamepad2, Globe2, Users, Cpu, Wrench, ChevronDown } from 'lucide-react';
import {
  MECHANIC_GROUPS,
  WORLD_THEMES,
  GAME_MODES,
  GAME_ENGINES,
  GAME_PLATFORMS,
  MULTIPLAYER_REQUIREMENTS,
  CUSTOM_THEME_VALUE,
  CUSTOM_MODE_VALUE,
  CUSTOM_ENGINE_VALUE,
  GAME_OTHER_PLATFORM_VALUE,
  resolveGameTargets,
} from '../../services/gameTaxonomy';
import {
  hasNetworkMode,
  toggleValue,
  type GameCreateState,
} from '../../services/gameClassify';
import type { PlatformMode } from '../../services/projectStore';

/** Compact searchable multi-select used for gameplay mechanics. */
const MechanicPicker: React.FC<{
  state: GameCreateState;
  onChange: (patch: Partial<GameCreateState>) => void;
}> = ({ state, onChange }) => {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string | null>(MECHANIC_GROUPS[0].id);
  const q = query.trim().toLowerCase();

  const groups = useMemo(
    () =>
      MECHANIC_GROUPS.map((g) => ({
        ...g,
        options: q ? g.options.filter((o) => o.label.toLowerCase().includes(q)) : g.options,
      })).filter((g) => g.options.length > 0),
    [q]
  );

  return (
    <fieldset className="game-fieldset">
      <legend className="game-legend">
        <Gamepad2 size={14} aria-hidden="true" /> Gameplay mechanics
      </legend>
      <p className="game-hint">
        Select every system the game needs — combinations are expected. {state.mechanics.length} selected.
      </p>
      <div className="class-picker-search game-mechanic-search">
        <Search size={13} className="class-picker-search-icon" aria-hidden="true" />
        <input
          type="text"
          className="class-picker-search-input field-integrated"
          placeholder="Search mechanics across all categories…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search gameplay mechanics"
        />
      </div>
      <div className="game-mechanic-groups">
        {groups.map((g) => {
          const open = q ? true : expanded === g.id;
          const selectedCount = g.options.filter((o) => state.mechanics.includes(o.value)).length;
          return (
            <div key={g.id} className={`game-mechanic-group ${open ? 'open' : ''}`}>
              <button
                type="button"
                className="game-mechanic-group-head"
                aria-expanded={open}
                onClick={() => setExpanded(open ? null : g.id)}
              >
                <ChevronDown size={13} className={`game-group-chevron ${open ? 'open' : ''}`} aria-hidden="true" />
                <span className="game-group-label">{g.label}</span>
                {selectedCount > 0 && <span className="game-group-count">{selectedCount}</span>}
              </button>
              {open && (
                <div className="game-mechanic-group-body">
                  <p className="game-group-summary">{g.summary}</p>
                  <div className="game-chip-grid">
                    {g.options.map((o) => {
                      const active = state.mechanics.includes(o.value);
                      return (
                        <button
                          key={o.value}
                          type="button"
                          aria-pressed={active}
                          className={`domain-chip ${active ? 'active' : ''}`}
                          onClick={() => onChange({ mechanics: toggleValue(state.mechanics, o.value) })}
                        >
                          {active && <Check size={12} aria-hidden="true" />}
                          <span>{o.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {groups.length === 0 && <p className="game-hint">No mechanics match that search.</p>}
      </div>
    </fieldset>
  );
};

export const GameCreationForm: React.FC<{
  state: GameCreateState;
  onChange: (patch: Partial<GameCreateState>) => void;
}> = ({ state, onChange }) => {
  const [advanced, setAdvanced] = useState(false);
  const targets = resolveGameTargets(state.platforms, state.platformMode, state.customPlatform);
  const network = hasNetworkMode(state.modes);

  const chipGroup = (
    key: keyof GameCreateState,
    options: { value: string; label: string }[]
  ) => {
    const selected = state[key] as string[];
    return (
      <div className="game-chip-grid">
        {options.map((o) => {
          const active = selected.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={active}
              className={`domain-chip ${active ? 'active' : ''}`}
              onClick={() => onChange({ [key]: toggleValue(selected, o.value) } as Partial<GameCreateState>)}
            >
              {active && <Check size={12} aria-hidden="true" />}
              <span>{o.label}</span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="game-create-form">
      <div className="form-field">
        <label className="form-label" htmlFor="game-name">
          Game name *
        </label>
        <input
          id="game-name"
          type="text"
          className="form-input"
          placeholder="e.g. Neon Circuit Racers"
          value={state.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor="game-desc">
          Short description / concept *
        </label>
        <textarea
          id="game-desc"
          className="form-textarea"
          rows={2}
          placeholder="One or two lines describing the game and its core hook."
          value={state.description}
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </div>

      <MechanicPicker state={state} onChange={onChange} />

      <fieldset className="game-fieldset">
        <legend className="game-legend">
          <Globe2 size={14} aria-hidden="true" /> World theme &amp; setting *
        </legend>
        <p className="game-hint">Choose all that apply. Custom World is available for your own setting.</p>
        {chipGroup('themes', WORLD_THEMES)}
        {state.themes.includes(CUSTOM_THEME_VALUE) && (
          <input
            type="text"
            className="form-input classify-custom-input"
            placeholder="Describe your custom world…"
            value={state.customTheme}
            onChange={(e) => onChange({ customTheme: e.target.value })}
            aria-label="Custom world theme"
          />
        )}
      </fieldset>

      <fieldset className="game-fieldset">
        <legend className="game-legend">
          <Users size={14} aria-hidden="true" /> Multiplayer &amp; game modes *
        </legend>
        <p className="game-hint">Select every mode the game supports.</p>
        {chipGroup('modes', GAME_MODES)}
        {state.modes.includes(CUSTOM_MODE_VALUE) && (
          <input
            type="text"
            className="form-input classify-custom-input"
            placeholder="Describe your custom game mode…"
            value={state.customMode}
            onChange={(e) => onChange({ customMode: e.target.value })}
            aria-label="Custom game mode"
          />
        )}

        {network && (
          <div className="game-mp-requirements">
            <div className="resolved-targets-head">
              <Info size={12} aria-hidden="true" />
              <span>Multiplayer requirements (project intent, not implemented features)</span>
            </div>
            {MULTIPLAYER_REQUIREMENTS.map((g) => (
              <div key={g.id} className="game-mp-group">
                <span className="game-mp-label">{g.label}</span>
                <div className="game-chip-grid">
                  {g.options.map((o) => {
                    const active = state.multiplayerRequirements.includes(o.value);
                    return (
                      <button
                        key={o.value}
                        type="button"
                        aria-pressed={active}
                        className={`domain-chip ${active ? 'active' : ''}`}
                        onClick={() =>
                          onChange({
                            multiplayerRequirements: toggleValue(state.multiplayerRequirements, o.value),
                          })
                        }
                      >
                        {active && <Check size={12} aria-hidden="true" />}
                        <span>{o.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <p className="game-hint">
              Online multiplayer is only real once networking, servers, authentication and deployment
              exist. ARTI AI has none of those connected, so this records intent only.
            </p>
          </div>
        )}
      </fieldset>

      <fieldset className="game-fieldset">
        <legend className="game-legend">
          <Cpu size={14} aria-hidden="true" /> Engine &amp; technology
        </legend>
        <div className="game-chip-grid">
          {GAME_ENGINES.map((e) => {
            const active = state.engine === e.value;
            return (
              <button
                key={e.value}
                type="button"
                aria-pressed={active}
                className={`domain-chip ${active ? 'active' : ''}`}
                onClick={() => onChange({ engine: e.value })}
              >
                {active && <Check size={12} aria-hidden="true" />}
                <span>{e.label}</span>
              </button>
            );
          })}
        </div>
        <p className="game-hint">{GAME_ENGINES.find((e) => e.value === state.engine)?.capability}</p>
        {state.engine === CUSTOM_ENGINE_VALUE && (
          <input
            type="text"
            className="form-input classify-custom-input"
            placeholder="Describe your custom engine or stack…"
            value={state.customEngine}
            onChange={(e) => onChange({ customEngine: e.target.value })}
            aria-label="Custom engine"
          />
        )}
      </fieldset>

      <fieldset className="game-fieldset">
        <legend className="game-legend">
          <Wrench size={14} aria-hidden="true" /> Target platforms *
        </legend>
        <div className="platform-mode-row" role="radiogroup" aria-label="Target platform mode">
          {(['single', 'cross-platform', 'all-platforms'] as PlatformMode[]).map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={state.platformMode === m}
              className={`platform-mode-btn ${state.platformMode === m ? 'active' : ''}`}
              onClick={() => onChange({ platformMode: m })}
            >
              {m === 'single' ? 'Single platform' : m === 'cross-platform' ? 'Cross-Platform' : 'All Platforms'}
            </button>
          ))}
        </div>

        {state.platformMode === 'all-platforms' ? (
          <p className="game-hint">
            All Platforms plans for every supported target, including consoles and VR. Each still needs
            its own SDK, signing and packaging — one universal binary does not exist.
          </p>
        ) : (
          <div className="game-chip-grid">
            {GAME_PLATFORMS.map((p) => {
              const active = state.platforms.includes(p.value);
              return (
                <button
                  key={p.value}
                  type="button"
                  aria-pressed={active}
                  className={`domain-chip ${active ? 'active' : ''}`}
                  onClick={() => onChange({ platforms: toggleValue(state.platforms, p.value) })}
                >
                  {active && <Check size={12} aria-hidden="true" />}
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {state.platformMode !== 'all-platforms' &&
          state.platforms.includes(GAME_OTHER_PLATFORM_VALUE) && (
            <input
              type="text"
              className="form-input classify-custom-input"
              placeholder="Describe the custom target platform…"
              value={state.customPlatform}
              onChange={(e) => onChange({ customPlatform: e.target.value })}
              aria-label="Custom target platform"
            />
          )}

        <div className="resolved-targets">
          <div className="resolved-targets-head">
            <Info size={12} aria-hidden="true" />
            <span>Resolved target matrix ({targets.length})</span>
          </div>
          {targets.length === 0 ? (
            <p className="game-hint">No target selected yet.</p>
          ) : (
            <ul className="resolved-targets-list">
              {targets.map((t) => (
                <li key={t.value} className="resolved-target-row">
                  <span className="resolved-target-name">{t.label}</span>
                  <span className={`platform-status-badge status-${t.status}`}>
                    {t.status.replace(/-/g, ' ')}
                  </span>
                  <span className="resolved-target-dep">{t.dependencies}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </fieldset>

      <div className="form-field">
        <label className="form-label" htmlFor="game-style">
          Visual style <span className="form-optional">optional</span>
        </label>
        <input
          id="game-style"
          type="text"
          className="form-input"
          placeholder="e.g. Stylized low-poly with neon accents"
          value={state.visualStyle}
          onChange={(e) => onChange({ visualStyle: e.target.value })}
        />
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor="game-instructions">
          Additional instructions <span className="form-optional">optional</span>
        </label>
        <textarea
          id="game-instructions"
          className="form-textarea"
          rows={2}
          placeholder="Anything else ARTI should consider when planning this game."
          value={state.instructions}
          onChange={(e) => onChange({ instructions: e.target.value })}
        />
      </div>

      <button
        type="button"
        className="game-advanced-toggle"
        aria-expanded={advanced}
        onClick={() => setAdvanced((v) => !v)}
      >
        <ChevronDown size={14} className={`game-group-chevron ${advanced ? 'open' : ''}`} aria-hidden="true" />
        <span>{advanced ? 'Hide advanced technical requirements' : 'Show advanced technical requirements'}</span>
      </button>

      {advanced && (
        <div className="game-advanced-panel">
          <p className="game-hint">
            All optional. Leave blank if you are unsure — ARTI can propose a technical plan from the brief.
          </p>
          <div className="game-adv-group">
            <span className="game-adv-label">Programming languages</span>
            {chipGroup('languages', [
              { value: 'cpp', label: 'C++' },
              { value: 'csharp', label: 'C#' },
              { value: 'gdscript', label: 'GDScript' },
              { value: 'typescript', label: 'TypeScript' },
              { value: 'javascript', label: 'JavaScript' },
              { value: 'rust', label: 'Rust' },
              { value: 'python', label: 'Python' },
              { value: 'lua', label: 'Lua' },
            ])}
          </div>
          <div className="game-adv-group">
            <span className="game-adv-label">2D / 3D</span>
            {chipGroup('dimensions', [
              { value: '2d', label: '2D' },
              { value: '3d', label: '3D' },
              { value: '2.5d', label: '2.5D' },
            ])}
          </div>
          <div className="game-adv-group">
            <span className="game-adv-label">Rendering</span>
            {chipGroup('rendering', [
              { value: 'forward', label: 'Forward' },
              { value: 'deferred', label: 'Deferred' },
              { value: 'ray-tracing', label: 'Ray tracing' },
              { value: 'stylized', label: 'Stylized / hand-drawn' },
              { value: 'custom-shaders', label: 'Custom shaders' },
            ])}
          </div>
          <div className="game-adv-group">
            <span className="game-adv-label">Physics</span>
            {chipGroup('physics', [
              { value: 'engine-physics', label: 'Engine built-in physics' },
              { value: 'custom-physics', label: 'Custom physics' },
              { value: 'rigid-body', label: 'Rigid-body dynamics' },
              { value: 'soft-body', label: 'Soft-body / cloth' },
              { value: 'no-physics', label: 'No physics' },
            ])}
          </div>
          <div className="game-adv-group">
            <span className="game-adv-label">AI behaviour</span>
            {chipGroup('ai', [
              { value: 'fsm', label: 'Finite state machines' },
              { value: 'behavior-trees', label: 'Behavior trees' },
              { value: 'navmesh', label: 'Navmesh pathfinding' },
              { value: 'utility-ai', label: 'Utility AI' },
              { value: 'ml-agents', label: 'ML agents' },
            ])}
          </div>
          <div className="game-adv-group">
            <span className="game-adv-label">Procedural generation</span>
            {chipGroup('procedural', [
              { value: 'proc-levels', label: 'Procedural levels' },
              { value: 'proc-terrain', label: 'Procedural terrain' },
              { value: 'proc-dungeons', label: 'Procedural dungeons' },
              { value: 'proc-loot', label: 'Procedural loot' },
              { value: 'no-procgen', label: 'None' },
            ])}
          </div>
          <div className="game-adv-group">
            <span className="game-adv-label">Audio &amp; music</span>
            {chipGroup('audio', [
              { value: 'engine-audio', label: 'Engine audio system' },
              { value: 'audio-middleware', label: 'Audio middleware' },
              { value: 'adaptive-music', label: 'Adaptive music' },
              { value: 'procedural-audio', label: 'Procedural audio' },
              { value: 'voice-acting', label: 'Voice acting' },
            ])}
          </div>
          <div className="game-adv-group">
            <span className="game-adv-label">Animation</span>
            {chipGroup('animation', [
              { value: 'skeletal', label: 'Skeletal animation' },
              { value: 'blend-trees', label: 'Blend trees / IK' },
              { value: 'mocap', label: 'Motion capture' },
              { value: 'sprite-2d', label: '2D sprite animation' },
              { value: 'no-animation', label: 'Minimal' },
            ])}
          </div>
          <div className="game-adv-group">
            <span className="game-adv-label">Input methods</span>
            {chipGroup('input', [
              { value: 'keyboard-mouse', label: 'Keyboard & mouse' },
              { value: 'gamepad', label: 'Gamepad' },
              { value: 'touch', label: 'Touch' },
              { value: 'motion', label: 'Motion / gyro' },
              { value: 'voice', label: 'Voice' },
            ])}
          </div>
          <div className="game-adv-group">
            <span className="game-adv-label">Accessibility</span>
            {chipGroup('accessibility', [
              { value: 'colorblind-modes', label: 'Colour-blind modes' },
              { value: 'subtitles-captions', label: 'Subtitles & captions' },
              { value: 'remappable-controls', label: 'Remappable controls' },
              { value: 'screen-reader', label: 'Screen-reader support' },
              { value: 'difficulty-options', label: 'Difficulty & assist' },
            ])}
          </div>
          <div className="game-adv-group">
            <span className="game-adv-label">Save / load</span>
            {chipGroup('saveLoad', [
              { value: 'local-save', label: 'Local save files' },
              { value: 'cloud-save', label: 'Cloud save' },
              { value: 'save-slots', label: 'Multiple slots' },
              { value: 'autosave', label: 'Autosave' },
            ])}
          </div>
          <div className="game-adv-group">
            <span className="game-adv-label">Performance targets</span>
            {chipGroup('performance', [
              { value: 'target-60fps', label: '60 FPS' },
              { value: 'target-120fps', label: '120 FPS' },
              { value: 'mobile-friendly', label: 'Mobile-friendly budget' },
              { value: 'low-end-support', label: 'Low-end hardware' },
            ])}
          </div>
          <div className="game-adv-group">
            <span className="game-adv-label">Build &amp; packaging</span>
            {chipGroup('buildPackaging', [
              { value: 'web-build', label: 'Web build' },
              { value: 'desktop-build', label: 'Desktop build' },
              { value: 'mobile-build', label: 'Mobile build' },
              { value: 'console-build', label: 'Console build' },
              { value: 'custom-packaging', label: 'Custom packaging' },
            ])}
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="game-hardware">
              Target hardware <span className="form-optional">optional</span>
            </label>
            <input
              id="game-hardware"
              type="text"
              className="form-input"
              placeholder="e.g. Mid-range gaming laptop, 8 GB RAM"
              value={state.targetHardware}
              onChange={(e) => onChange({ targetHardware: e.target.value })}
            />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="game-assets">
              Asset requirements <span className="form-optional">optional</span>
            </label>
            <textarea
              id="game-assets"
              className="form-textarea"
              rows={2}
              placeholder="Original art, licensed packs, audio sourcing, etc."
              value={state.assetRequirements}
              onChange={(e) => onChange({ assetRequirements: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );
};
