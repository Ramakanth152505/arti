import React, { useState } from 'react';
import { Play, SlidersHorizontal, CheckCircle2, AlertTriangle, Ban, Loader2, FlaskConical } from 'lucide-react';
import { Dialog } from '../common/Dialog';
import {
  projectStore,
  CORE_CATEGORIES,
  DOMAIN_CATEGORIES,
  resolveTargets,
  type Project,
  type TestConfig,
  type TestRun,
  type TestStatus,
} from '../../services/projectStore';
import { performTests, hasTestConfig, EMPTY_TEST_CONFIG } from '../../services/testRunner';

const statusIcon = (status: TestStatus) => {
  switch (status) {
    case 'passed':
      return <CheckCircle2 size={14} aria-hidden="true" />;
    case 'failed':
      return <AlertTriangle size={14} aria-hidden="true" />;
    case 'blocked':
    case 'not-configured':
    case 'skipped':
    default:
      return <Ban size={14} aria-hidden="true" />;
  }
};

const labelFor = (value: string) =>
  CORE_CATEGORIES.find((c) => c.value === value)?.label ??
  DOMAIN_CATEGORIES.find((c) => c.value === value)?.label ??
  value;

/**
 * Project Settings — software metadata plus a real Perform Tests workflow.
 *
 * The Perform Tests action reads the project's stored test configuration,
 * attempts to run it, and reports the actual outcome. Because no execution
 * environment is connected, a configured project resolves to `blocked` and an
 * unconfigured one to `not-configured` — never a fabricated pass.
 */
export const ProjectSettingsPanel: React.FC<{
  project: Project;
  onClose: () => void;
  onSaved?: () => void;
}> = ({ project, onClose, onSaved }) => {
  const [config, setConfig] = useState<TestConfig>(project.testConfig ?? EMPTY_TEST_CONFIG);
  const [run, setRun] = useState<TestRun | undefined>(project.lastTestRun);
  const [running, setRunning] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const targets = resolveTargets(project.platforms ?? [], project.platformMode ?? 'single', project.customPlatform);

  const saveConfig = () => {
    projectStore.setTestConfig(project.id, config);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1600);
    onSaved?.();
  };

  const handlePerformTests = async () => {
    setRunning(true);
    projectStore.setTestConfig(project.id, config);
    const latest = projectStore.getProject(project.id) ?? project;
    const result = await performTests({ ...latest, testConfig: config });
    projectStore.saveTestRun(project.id, result);
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
    { key: 'includeBuild', label: 'Production build verification' },
  ];

  return (
    <Dialog
      isOpen
      onClose={onClose}
      title="Project Settings"
      description={`Software metadata and testing for "${project.name}"`}
    >
      <div className="project-settings-body">
        {/* Classification summary */}
        <section className="settings-section">
          <h3 className="settings-section-title">
            <SlidersHorizontal size={14} aria-hidden="true" /> Software configuration
          </h3>
          {project.isSoftware ? (
            <ul className="settings-meta-list">
              <li>
                <span>Core classification</span>
                <strong>
                  {project.coreClassification
                    ? project.coreClassification === 'custom-other' && project.coreCustom
                      ? project.coreCustom
                      : labelFor(project.coreClassification)
                    : 'Not set'}
                </strong>
              </li>
              <li>
                <span>Technology / domain</span>
                <strong>
                  {project.domains && project.domains.length > 0
                    ? project.domains
                        .map((d) =>
                          d === 'custom-other' && project.domainCustom ? project.domainCustom : labelFor(d)
                        )
                        .join(', ')
                    : 'Not set'}
                </strong>
              </li>
              <li>
                <span>Platform mode</span>
                <strong>
                  {project.platformMode === 'all-platforms'
                    ? 'All Platforms'
                    : project.platformMode === 'cross-platform'
                      ? 'Cross-Platform'
                      : 'Single platform'}
                </strong>
              </li>
              <li>
                <span>Preferred stack</span>
                <strong>{project.stackPreference || project.techStack || 'Not set'}</strong>
              </li>
            </ul>
          ) : (
            <p className="settings-note">
              This project was created as a general project, not a software project. It has no software
              classification metadata.
            </p>
          )}

          <div className="resolved-targets">
            <div className="resolved-targets-head">
              <FlaskConical size={12} aria-hidden="true" />
              <span>Target matrix ({targets.length})</span>
            </div>
            {targets.length === 0 ? (
              <p className="classify-hint">No target platforms configured.</p>
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

        {/* Test configuration */}
        <section className="settings-section">
          <h3 className="settings-section-title">
            <FlaskConical size={14} aria-hidden="true" /> Test configuration
          </h3>
          <div className="form-field">
            <label className="form-label" htmlFor="test-framework">
              Test framework
            </label>
            <input
              id="test-framework"
              type="text"
              className="form-input"
              placeholder="e.g. Vitest, Jest, Playwright"
              value={config.framework}
              onChange={(e) => setConfig({ ...config, framework: e.target.value })}
            />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="test-command">
              Test command
            </label>
            <input
              id="test-command"
              type="text"
              className="form-input mono-input"
              placeholder="e.g. npm test"
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
              {hasTestConfig(project.testConfig)
                ? 'No run yet. Choose Perform Tests to execute the configured checks.'
                : 'Not configured — this project has no test framework, command, or selected categories yet.'}
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
                  <span>Project</span>
                  <strong>{project.name}</strong>
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
