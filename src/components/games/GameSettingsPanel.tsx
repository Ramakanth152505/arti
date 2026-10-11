import React, { useState } from 'react';
import {
  Play,
  CheckCircle2,
  AlertTriangle,
  Ban,
  Loader2,
  FlaskConical,
  Boxes,
  Rocket,
} from 'lucide-react';
import { Dialog } from '../common/Dialog';
import {
  projectStore,
  type Project,
  type TestConfig,
  type TestRun,
  type TestStatus,
} from '../../services/projectStore';
import { performTests, hasTestConfig, EMPTY_TEST_CONFIG } from '../../services/testRunner';
import {
  engineLabel,
  mechanicLabel,
  modeLabel,
  resolveGameTargets,
  themeLabel,
} from '../../services/gameTaxonomy';

const statusIcon = (status: TestStatus) => {
  switch (status) {
    case 'passed':
      return <CheckCircle2 size={14} aria-hidden="true" />;
    case 'failed':
      return <AlertTriangle size={14} aria-hidden="true" />;
    default:
      return <Ban size={14} aria-hidden="true" />;
  }
};

/**
 * Honest development-lifecycle status. ARTI AI runs entirely in the browser:
 * it can capture and plan a game, but there is no engine, source-generation
 * provider, asset pipeline, compiler or execution environment connected, so
 * every code/asset/build/release stage is reported as blocked rather than
 * faked.
 */
type StageStatus = 'planning' | 'blocked';
const LIFECYCLE: { label: string; status: StageStatus; note: string }[] = [
  { label: 'Concept & requirements', status: 'planning', note: 'Captured in this project and discussed in chat.' },
  { label: 'Game design document', status: 'planning', note: 'Can be drafted in chat with the connected model.' },
  { label: 'Gameplay systems', status: 'planning', note: 'Design/planning only; no engine implementation.' },
  { label: 'Architecture', status: 'planning', note: 'Planning only; no engine project is generated.' },
  { label: 'Source code', status: 'blocked', note: 'No source-generation or engine toolchain is connected.' },
  { label: 'Art & asset pipeline', status: 'blocked', note: 'No asset-generation service is connected.' },
  { label: 'Audio pipeline', status: 'blocked', note: 'No audio provider is connected.' },
  { label: 'Level & world creation', status: 'planning', note: 'Planning only; no editor or runtime exists.' },
  { label: 'Build configuration', status: 'blocked', note: 'No engine/compiler is installed.' },
  { label: 'Testing', status: 'blocked', note: 'No execution environment can run game tests here.' },
  { label: 'Performance optimization', status: 'blocked', note: 'Needs a running build to profile.' },
  { label: 'Packaging', status: 'blocked', note: 'No packaging or signing toolchain is connected.' },
  { label: 'Deployment & release', status: 'blocked', note: 'No store or distribution pipeline is connected.' },
];

export const GameSettingsPanel: React.FC<{
  game: Project;
  onClose: () => void;
  onSaved?: () => void;
}> = ({ game, onClose, onSaved }) => {
  const meta = game.game;
  const [config, setConfig] = useState<TestConfig>(game.testConfig ?? EMPTY_TEST_CONFIG);
  const [run, setRun] = useState<TestRun | undefined>(game.lastTestRun);
  const [running, setRunning] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const targets = resolveGameTargets(
    meta?.platforms ?? [],
    meta?.platformMode ?? 'single',
    meta?.customPlatform
  );

  const saveConfig = () => {
    projectStore.setTestConfig(game.id, config);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1600);
    onSaved?.();
  };

  const handlePerformTests = async () => {
    setRunning(true);
    projectStore.setTestConfig(game.id, config);
    const latest = projectStore.getProject(game.id) ?? game;
    const result = await performTests({ ...latest, testConfig: config });
    projectStore.saveTestRun(game.id, result);
    setRun(result);
    setRunning(false);
    onSaved?.();
  };

  const categories: { key: keyof TestConfig; label: string }[] = [
    { key: 'includeLint', label: 'Linting' },
    { key: 'includeTypeCheck', label: 'Type checking' },
    { key: 'includeUnit', label: 'Unit tests' },
    { key: 'includeIntegration', label: 'Integration tests' },
    { key: 'includeE2e', label: 'End-to-end tests' },
    { key: 'includeBuild', label: 'Build verification' },
  ];

  return (
    <Dialog
      isOpen
      onClose={onClose}
      title="Game Settings"
      description={`Engine, targets, build &amp; test status for "${game.name}"`}
      maxWidth="620px"
    >
      <div className="project-settings-body">
        {/* Game configuration summary */}
        <section className="settings-section">
          <h3 className="settings-section-title">
            <Boxes size={14} aria-hidden="true" /> Game configuration
          </h3>
          <ul className="settings-meta-list">
            <li>
              <span>Preferred engine</span>
              <strong>
                {meta?.engine === 'custom-engine' && meta?.customEngine
                  ? meta.customEngine
                  : engineLabel(meta?.engine ?? 'not-decided')}
              </strong>
            </li>
            <li>
              <span>Platform mode</span>
              <strong>
                {meta?.platformMode === 'all-platforms'
                  ? 'All Platforms'
                  : meta?.platformMode === 'cross-platform'
                    ? 'Cross-Platform'
                    : 'Single platform'}
              </strong>
            </li>
            <li>
              <span>Gameplay mechanics</span>
              <strong>
                {meta?.mechanics && meta.mechanics.length > 0
                  ? meta.mechanics.map(mechanicLabel).join(', ')
                  : 'Not set'}
              </strong>
            </li>
            <li>
              <span>World themes</span>
              <strong>
                {meta?.themes && meta.themes.length > 0
                  ? meta.themes
                      .map((t) => (t === 'custom-world' && meta.customTheme ? meta.customTheme : themeLabel(t)))
                      .join(', ')
                  : 'Not set'}
              </strong>
            </li>
            <li>
              <span>Game modes</span>
              <strong>
                {meta?.modes && meta.modes.length > 0
                  ? meta.modes
                      .map((m) => (m === 'custom-game-mode' && meta.customMode ? meta.customMode : modeLabel(m)))
                      .join(', ')
                  : 'Not set'}
              </strong>
            </li>
            {meta?.multiplayerRequirements && meta.multiplayerRequirements.length > 0 && (
              <li>
                <span>Multiplayer requirements</span>
                <strong>{meta.multiplayerRequirements.join(', ')}</strong>
              </li>
            )}
          </ul>

          <div className="resolved-targets">
            <div className="resolved-targets-head">
              <FlaskConical size={12} aria-hidden="true" />
              <span>Target matrix ({targets.length})</span>
            </div>
            {targets.length === 0 ? (
              <p className="game-hint">No target platforms configured.</p>
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
        </section>

        {/* Development lifecycle honesty */}
        <section className="settings-section">
          <h3 className="settings-section-title">
            <Rocket size={14} aria-hidden="true" /> Development lifecycle
          </h3>
          <p className="settings-note">
            ARTI AI can plan a game here, but no engine, code generator, asset pipeline or execution
            environment is connected — so the stages below are honestly marked.
          </p>
          <ul className="game-lifecycle-list">
            {LIFECYCLE.map((s) => (
              <li key={s.label} className="game-lifecycle-row">
                <span className={`platform-status-badge status-${s.status === 'blocked' ? 'blocked' : 'architecture-supported'}`}>
                  {s.status === 'blocked' ? 'blocked' : 'planning available'}
                </span>
                <span className="game-lifecycle-name">{s.label}</span>
                <span className="game-lifecycle-note">{s.note}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Test configuration */}
        <section className="settings-section">
          <h3 className="settings-section-title">
            <FlaskConical size={14} aria-hidden="true" /> Test configuration
          </h3>
          <div className="form-field">
            <label className="form-label" htmlFor="game-test-framework">
              Test framework
            </label>
            <input
              id="game-test-framework"
              type="text"
              className="form-input"
              placeholder="e.g. Unreal Automation, Unity Test Framework"
              value={config.framework}
              onChange={(e) => setConfig({ ...config, framework: e.target.value })}
            />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="game-test-command">
              Test command
            </label>
            <input
              id="game-test-command"
              type="text"
              className="form-input mono-input"
              placeholder="e.g. ./RunTests.sh"
              value={config.command}
              onChange={(e) => setConfig({ ...config, command: e.target.value })}
            />
          </div>
          <div className="settings-checkbox-grid">
            {categories.map((c) => (
              <label key={c.key} className="settings-checkbox">
                <input
                  type="checkbox"
                  checked={Boolean(config[c.key])}
                  onChange={(e) => setConfig({ ...config, [c.key]: e.target.checked } as TestConfig)}
                />
                <span>{c.label}</span>
              </label>
            ))}
          </div>
          <div className="form-actions-row">
            <button type="button" className="gold-ghost-btn" onClick={saveConfig}>
              Save configuration
            </button>
            <button
              type="button"
              className="gold-primary-btn"
              onClick={handlePerformTests}
              disabled={running}
              title="Run the configured checks"
            >
              {running ? <Loader2 size={14} className="spin" aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
              <span>{running ? 'Running…' : 'Perform Tests'}</span>
            </button>
          </div>
          {savedFlash && <p className="settings-saved-flash">Configuration saved.</p>}
        </section>

        {/* Test report */}
        <section className="settings-section">
          <h3 className="settings-section-title">Test report</h3>
          {!run ? (
            <p className="settings-note">
              {hasTestConfig(game.testConfig)
                ? 'No run yet. Choose Perform Tests to execute the configured checks.'
                : 'Not configured — this game has no test framework, command, or selected categories yet.'}
            </p>
          ) : (
            <div className="test-report">
              <div className="test-report-head">
                <span className={`test-status-badge status-${run.status}`}>
                  {statusIcon(run.status)} {run.status.replace(/-/g, ' ')}
                </span>
                <span className="test-report-id">{run.id}</span>
                <span className="test-report-time">{new Date(run.createdAt).toLocaleString()}</span>
              </div>
              <ul className="settings-meta-list compact">
                <li>
                  <span>Game</span>
                  <strong>{game.name}</strong>
                </li>
                <li>
                  <span>Command</span>
                  <strong className="mono">{run.command || '—'}</strong>
                </li>
                <li>
                  <span>Framework</span>
                  <strong>{run.framework || '—'}</strong>
                </li>
                <li>
                  <span>Exit status</span>
                  <strong className="mono">{run.exitStatus}</strong>
                </li>
              </ul>
              <ul className="test-suite-list">
                {run.suites.map((s, i) => (
                  <li key={i} className="test-suite-row">
                    <span className={`test-suite-status status-${s.status}`}>{s.status.replace(/-/g, ' ')}</span>
                    <span className="test-suite-name">{s.name}</span>
                    <span className="test-suite-detail">{s.detail}</span>
                  </li>
                ))}
              </ul>
              <p className="test-report-message">{run.message}</p>
            </div>
          )}
        </section>
      </div>
    </Dialog>
  );
};
