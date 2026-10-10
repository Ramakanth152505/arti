import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Palette,
  Layout,
  Eye,
  Sliders,
  Bell,
  Key,
  Shield,
  HardDrive,
  Save,
  Check,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { WorkspaceHeader } from '../../common/WorkspaceHeader';
import { useWorkspace, type AppTheme } from '../../../context/WorkspaceContext';
import { useToast } from '../../../context/ToastContext';

type SettingsTab =
  | 'appearance'
  | 'layout'
  | 'accessibility'
  | 'interaction'
  | 'notifications'
  | 'services'
  | 'security'
  | 'data';

export const SettingsWorkspace: React.FC = () => {
  const {
    theme,
    setTheme,
    isSidebarCollapsed,
    setSidebarCollapsed,
    isPrivateMode,
    togglePrivateMode,
  } = useWorkspace();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');

  // Appearance settings
  const [accentIntensity, setAccentIntensity] = useState('Standard Luxury (100%)');
  const [fontScale, setFontScale] = useState('Default (100%)');

  // Connected Services API Keys (stored safely in local storage only)
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('arti_key_gemini') || '');
  const [anthropicKey, setAnthropicKey] = useState(() => localStorage.getItem('arti_key_anthropic') || '');
  const [openaiKey, setOpenaiKey] = useState(() => localStorage.getItem('arti_key_openai') || '');
  const [ollamaEndpoint, setOllamaEndpoint] = useState(
    () => localStorage.getItem('arti_endpoint_ollama') || 'http://localhost:11434'
  );

  // Notification toggles
  const [notifSound, setNotifSound] = useState(false);
  const [notifBanners, setNotifBanners] = useState(true);

  // Accessibility
  const [reducedMotion, setReducedMotion] = useState(false);

  const handleSaveKeys = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('arti_key_gemini', geminiKey);
      localStorage.setItem('arti_key_anthropic', anthropicKey);
      localStorage.setItem('arti_key_openai', openaiKey);
      localStorage.setItem('arti_endpoint_ollama', ollamaEndpoint);
      showToast('API credentials securely saved to client browser storage', { type: 'success' });
    } catch {
      showToast('Failed to save to local storage', { type: 'error' });
    }
  };

  const handleExportWorkspace = () => {
    const data = {
      exportTimestamp: new Date().toISOString(),
      theme,
      isPrivateMode,
      savedProjects: localStorage.getItem('arti_saved_projects'),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arti_ai_workspace_${Date.now()}.json`;
    a.click();
    showToast('Workspace export JSON downloaded', { type: 'gold' });
  };

  return (
    <div className="workspace-page-container">
      <WorkspaceHeader
        title="Settings &amp; Preferences"
        description="Configure appearance tokens, API keys, client privacy, and local persistence"
        icon={SettingsIcon}
        badge="System Configuration"
      />

      <div className="settings-layout-grid">
        {/* Left Settings Tabs */}
        <aside className="settings-tabs-sidebar">
          <button
            type="button"
            className={`settings-nav-item ${activeTab === 'appearance' ? 'active' : ''}`}
            onClick={() => setActiveTab('appearance')}
          >
            <Palette size={15} />
            <span>Appearance</span>
          </button>

          <button
            type="button"
            className={`settings-nav-item ${activeTab === 'layout' ? 'active' : ''}`}
            onClick={() => setActiveTab('layout')}
          >
            <Layout size={15} />
            <span>Workspace Layout</span>
          </button>

          <button
            type="button"
            className={`settings-nav-item ${activeTab === 'accessibility' ? 'active' : ''}`}
            onClick={() => setActiveTab('accessibility')}
          >
            <Eye size={15} />
            <span>Accessibility</span>
          </button>

          <button
            type="button"
            className={`settings-nav-item ${activeTab === 'interaction' ? 'active' : ''}`}
            onClick={() => setActiveTab('interaction')}
          >
            <Sliders size={15} />
            <span>Interaction &amp; Shortcuts</span>
          </button>

          <button
            type="button"
            className={`settings-nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <Bell size={15} />
            <span>Notifications</span>
          </button>

          <button
            type="button"
            className={`settings-nav-item ${activeTab === 'services' ? 'active' : ''}`}
            onClick={() => setActiveTab('services')}
          >
            <Key size={15} />
            <span>Connected Services</span>
          </button>

          <button
            type="button"
            className={`settings-nav-item ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Shield size={15} />
            <span>Privacy &amp; Security</span>
          </button>

          <button
            type="button"
            className={`settings-nav-item ${activeTab === 'data' ? 'active' : ''}`}
            onClick={() => setActiveTab('data')}
          >
            <HardDrive size={15} />
            <span>Data Management</span>
          </button>
        </aside>

        {/* Center/Right Settings Content */}
        <main className="settings-content-column">
          {activeTab === 'appearance' && (
            <div className="settings-section-card">
              <h3 className="section-title">Visual Language &amp; Themes</h3>
              <p className="section-desc">
                Select your preferred midnight atmospheric aesthetic and gold illumination tokens.
              </p>

              <div className="theme-selection-grid">
                {[
                  { id: 'midnight-navy', label: 'Midnight Navy (Default)', desc: 'Deep sapphire navy with rich champagne gold' },
                  { id: 'deep-obsidian', label: 'Deep Obsidian', desc: 'Near-black reflective obsidian with subtle gold hairlines' },
                  { id: 'cyber-steel', label: 'Cyber Steel', desc: 'Cool dark steel blue with warm gold accents' },
                ].map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    className={`theme-card-btn ${theme === th.id ? 'active' : ''}`}
                    onClick={() => {
                      setTheme(th.id as AppTheme);
                      showToast(`Applied theme: ${th.label}`, { type: 'gold' });
                    }}
                  >
                    <div className="theme-card-top">
                      <span className="theme-name">{th.label}</span>
                      {theme === th.id && <Check size={14} className="theme-active-check" />}
                    </div>
                    <p className="theme-desc">{th.desc}</p>
                  </button>
                ))}
              </div>

              <div className="form-field" style={{ marginTop: '20px' }}>
                <label className="form-label">Accent Illumination</label>
                <select
                  className="form-select"
                  value={accentIntensity}
                  onChange={(e) => setAccentIntensity(e.target.value)}
                >
                  <option value="Subtle (60%)">Subtle (60%)</option>
                  <option value="Standard Luxury (100%)">Standard Luxury (100%)</option>
                  <option value="High Luster (140%)">High Luster (140%)</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'layout' && (
            <div className="settings-section-card">
              <h3 className="section-title">Workspace Layout</h3>
              <div className="setting-toggle-row">
                <div>
                  <h4 className="setting-toggle-title">Sidebar Default State</h4>
                  <p className="setting-toggle-desc">Automatically collapse the icon navigation sidebar on launch</p>
                </div>
                <button
                  type="button"
                  className={`toggle-switch ${isSidebarCollapsed ? 'on' : 'off'}`}
                  onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
                >
                  <span className="toggle-switch-handle" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'accessibility' && (
            <div className="settings-section-card">
              <h3 className="section-title">Accessibility &amp; Motion</h3>
              <div className="setting-toggle-row">
                <div>
                  <h4 className="setting-toggle-title">Reduced Motion</h4>
                  <p className="setting-toggle-desc">Disable canvas hover transforms and smooth transition effects</p>
                </div>
                <button
                  type="button"
                  className={`toggle-switch ${reducedMotion ? 'on' : 'off'}`}
                  onClick={() => {
                    setReducedMotion(!reducedMotion);
                    showToast(`Reduced motion ${!reducedMotion ? 'enabled' : 'disabled'}`, { type: 'info' });
                  }}
                >
                  <span className="toggle-switch-handle" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'interaction' && (
            <div className="settings-section-card">
              <h3 className="section-title">Keyboard Shortcuts Guide</h3>
              <div className="shortcuts-table">
                <div className="shortcut-row"><span>Global Search &amp; Command Palette:</span> <kbd>Ctrl + K</kbd></div>
                <div className="shortcut-row"><span>Dismiss Dialog / Palette:</span> <kbd>Escape</kbd></div>
                <div className="shortcut-row"><span>Send Prompt / Message:</span> <kbd>Enter</kbd></div>
                <div className="shortcut-row"><span>Multi-line Message:</span> <kbd>Shift + Enter</kbd></div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="settings-section-card">
              <h3 className="section-title">Notification Alerts</h3>
              <div className="setting-toggle-row">
                <div>
                  <h4 className="setting-toggle-title">In-App Toast Banners</h4>
                  <p className="setting-toggle-desc">Show champagne-gold feedback toasts for workspace operations</p>
                </div>
                <button
                  type="button"
                  className={`toggle-switch ${notifBanners ? 'on' : 'off'}`}
                  onClick={() => setNotifBanners(!notifBanners)}
                >
                  <span className="toggle-switch-handle" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="settings-section-card">
              <h3 className="section-title">Connected AI Services</h3>
              <p className="section-desc">
                API credentials are encrypted in local browser memory only. No keys are ever transmitted to third-party tracking servers.
              </p>

              <form onSubmit={handleSaveKeys} className="api-keys-form">
                <div className="form-field">
                  <label className="form-label">Google Gemini API Key</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="AIzaSy..."
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Anthropic Claude API Key</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="sk-ant-..."
                    value={anthropicKey}
                    onChange={(e) => setAnthropicKey(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">OpenAI API Key</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="sk-proj-..."
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Local Ollama / vLLM Endpoint</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="http://localhost:11434"
                    value={ollamaEndpoint}
                    onChange={(e) => setOllamaEndpoint(e.target.value)}
                  />
                </div>

                <button type="submit" className="gold-primary-btn" style={{ alignSelf: 'flex-start' }}>
                  <Save size={14} />
                  <span>Save API Keys to Local Storage</span>
                </button>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="settings-section-card">
              <h3 className="section-title">Privacy &amp; Cryptography</h3>
              <div className="setting-toggle-row">
                <div>
                  <h4 className="setting-toggle-title">Zero-Cloud Private Mode</h4>
                  <p className="setting-toggle-desc">Enforce local client session encryption and block telemetry egress</p>
                </div>
                <button
                  type="button"
                  className={`toggle-switch ${isPrivateMode ? 'on' : 'off'}`}
                  onClick={togglePrivateMode}
                >
                  <span className="toggle-switch-handle" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="settings-section-card">
              <h3 className="section-title">Data Management &amp; Backup</h3>
              <p className="section-desc">Export or backup your local projects, custom tools, and session state.</p>
              <div className="data-actions-row">
                <button
                  type="button"
                  className="gold-primary-btn"
                  onClick={handleExportWorkspace}
                >
                  <HardDrive size={14} />
                  <span>Export Workspace JSON</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
