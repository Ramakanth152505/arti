import React, { useMemo, useState } from 'react';
import { Search, Check, Layers, Boxes, MonitorSmartphone, Info } from 'lucide-react';
import {
  CORE_CATEGORIES,
  DOMAIN_CATEGORIES,
  PLATFORMS,
  CUSTOM_CLASS_VALUE,
  OTHER_PLATFORM_VALUE,
  resolveTargets,
  type ClassOption,
  type PlatformMode,
} from '../../services/projectStore';
import { type SoftwareClassifyState } from '../../services/softwareClassify';

/** Searchable single-select list used for the two classification categories. */
const ClassPicker: React.FC<{
  id: string;
  options: ClassOption[];
  value: string;
  onChange: (value: string) => void;
  searchPlaceholder: string;
}> = ({ id, options, value, onChange, searchPlaceholder }) => {
  const [query, setQuery] = useState('');
  const filtered = useMemo(
    () => options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase())),
    [options, query]
  );
  return (
    <div className="class-picker">
      <div className="class-picker-search">
        <Search size={13} className="class-picker-search-icon" aria-hidden="true" />
        <input
          type="text"
          className="class-picker-search-input field-integrated"
          placeholder={searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={searchPlaceholder}
        />
      </div>
      <ul className="class-picker-list" role="listbox" aria-label={id}>
        {filtered.length === 0 ? (
          <li className="class-picker-empty">No matching categories.</li>
        ) : (
          filtered.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                role="option"
                aria-selected={value === o.value}
                className={`class-picker-option ${value === o.value ? 'active' : ''}`}
                onClick={() => onChange(o.value)}
              >
                <span className="class-picker-label">{o.label}</span>
                {value === o.value && <Check size={13} aria-hidden="true" />}
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};


export const SoftwareClassificationForm: React.FC<{
  state: SoftwareClassifyState;
  onChange: (patch: Partial<SoftwareClassifyState>) => void;
  showRequirements?: boolean;
}> = ({ state, onChange, showRequirements = true }) => {
  const targets = resolveTargets(state.platforms, state.platformMode, state.customPlatform);

  const toggleDomain = (value: string) => {
    const next = state.domains.includes(value)
      ? state.domains.filter((d) => d !== value)
      : [...state.domains, value];
    onChange({ domains: next });
  };

  const togglePlatform = (value: string) => {
    const next = state.platforms.includes(value)
      ? state.platforms.filter((p) => p !== value)
      : [...state.platforms, value];
    onChange({ platforms: next });
  };

  return (
    <div className="software-classify-form">
      <div className="form-field">
        <label className="form-label" htmlFor="swc-name">
          Software name
        </label>
        <input
          id="swc-name"
          type="text"
          className="form-input"
          placeholder="e.g. Fleet Telemetry Console"
          value={state.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </div>

      <fieldset className="classify-fieldset">
        <legend className="classify-legend">
          <Boxes size={14} aria-hidden="true" /> 1. Core Functional Classification
        </legend>
        <p className="classify-hint">What kind of software is it? Choose one.</p>
        <ClassPicker
          id="core-classification"
          options={CORE_CATEGORIES}
          value={state.core}
          onChange={(v) => onChange({ core: v })}
          searchPlaceholder="Search core categories…"
        />
        {state.core === CUSTOM_CLASS_VALUE && (
          <input
            type="text"
            className="form-input classify-custom-input"
            placeholder="Describe the custom software type…"
            value={state.coreCustom}
            onChange={(e) => onChange({ coreCustom: e.target.value })}
            aria-label="Custom core classification"
          />
        )}
      </fieldset>

      <fieldset className="classify-fieldset">
        <legend className="classify-legend">
          <Layers size={14} aria-hidden="true" /> 2. Technology &amp; Application Domain
        </legend>
        <p className="classify-hint">
          Where is it applied? Select all that apply — separate from the core classification.
        </p>
        <div className="domain-chip-grid">
          {DOMAIN_CATEGORIES.map((o) => {
            const active = state.domains.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                aria-pressed={active}
                className={`domain-chip ${active ? 'active' : ''}`}
                onClick={() => toggleDomain(o.value)}
              >
                {active && <Check size={12} aria-hidden="true" />}
                <span>{o.label}</span>
              </button>
            );
          })}
        </div>
        {state.domains.includes(CUSTOM_CLASS_VALUE) && (
          <input
            type="text"
            className="form-input classify-custom-input"
            placeholder="Describe the custom domain…"
            value={state.domainCustom}
            onChange={(e) => onChange({ domainCustom: e.target.value })}
            aria-label="Custom domain"
          />
        )}
      </fieldset>

      <fieldset className="classify-fieldset">
        <legend className="classify-legend">
          <MonitorSmartphone size={14} aria-hidden="true" /> Target Platforms
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
          <p className="classify-hint">
            All Platforms designs for the widest supported target set. Each target still needs its own
            binaries, SDKs, signing and packaging — one binary cannot run natively everywhere.
          </p>
        ) : (
          <div className="platform-chip-grid">
            {PLATFORMS.map((p) => {
              const active = state.platforms.includes(p.value);
              return (
                <button
                  key={p.value}
                  type="button"
                  aria-pressed={active}
                  className={`platform-chip ${active ? 'active' : ''}`}
                  onClick={() => togglePlatform(p.value)}
                >
                  {active && <Check size={12} aria-hidden="true" />}
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {state.platformMode !== 'all-platforms' &&
          state.platforms.includes(OTHER_PLATFORM_VALUE) && (
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
            <p className="classify-hint">No target selected yet.</p>
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
        <label className="form-label" htmlFor="swc-desc">
          Description <span className="form-optional">optional</span>
        </label>
        <input
          id="swc-desc"
          type="text"
          className="form-input"
          placeholder="One-line summary"
          value={state.description}
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </div>

      {showRequirements && (
        <div className="form-field">
          <label className="form-label" htmlFor="swc-req">
            Requirements / project brief <span className="form-optional">optional</span>
          </label>
          <textarea
            id="swc-req"
            className="form-textarea"
            rows={4}
            placeholder="Purpose, key features, constraints…"
            value={state.requirements}
            onChange={(e) => onChange({ requirements: e.target.value })}
          />
        </div>
      )}

      <div className="form-field">
        <label className="form-label" htmlFor="swc-stack">
          Preferred technology stack <span className="form-optional">optional</span>
        </label>
        <input
          id="swc-stack"
          type="text"
          className="form-input"
          placeholder="e.g. TypeScript, Rust, PostgreSQL"
          value={state.stack}
          onChange={(e) => onChange({ stack: e.target.value })}
        />
      </div>
    </div>
  );
};
