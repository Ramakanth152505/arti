import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
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
} from 'lucide-react';
import { WorkspaceHeader } from '../../common/WorkspaceHeader';
import { useWorkspace, type AppTheme } from '../../../context/WorkspaceContext';
import { useToast } from '../../../context/ToastContext';
import { DUR, EASE, SPRING } from '../../../motion/tokens';

type SettingsTab =
  | 'appearance'
  | 'layout'
  | 'accessibility'
  | 'interaction'
  | 'notifications'
  | 'services'
  | 'security'
  | 'data';

/** Section order and labels, single-sourced so the rail and content stay in step. */
const SETTINGS_TABS: ReadonlyArray<{
  id: SettingsTab;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}> = [
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'layout', label: 'Workspace Layout', icon: Layout },
  { id: 'accessibility', label: 'Accessibility', icon: Eye },
  { id: 'interaction', label: 'Interaction & Shortcuts', icon: Sliders },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'services', label: 'Connected Services', icon: Key },
  { id: 'security', label: 'Privacy & Security', icon: Shield },
  { id: 'data', label: 'Data Management', icon: HardDrive },
];

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

  // Provider endpoint credentials. These are persisted in this browser's localStorage
  // only, unencrypted, and are never transmitted anywhere by the frontend.
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('arti_key_gemini') || '');
  const [anthropicKey, setAnthropicKey] = useState(() => localStorage.getItem('arti_key_anthropic') || '');
  const [openaiKey, setOpenaiKey] = useState(() => localStorage.getItem('arti_key_openai') || '');
  const [ollamaEndpoint, setOllamaEndpoint] = useState(
    () => localStorage.getItem('arti_endpoint_ollama') || 'http://localhost:11434'
  );

  // Image-generation provider. The Images workspace reads these same keys.
  const [imageProvider, setImageProvider] = useState<'openai' | 'custom-server'>(
    () => (localStorage.getItem('arti_image_provider') === 'custom-server' ? 'custom-server' : 'openai')
  );
  const [imageEndpoint, setImageEndpoint] = useState(
    () => localStorage.getItem('arti_endpoint_image') || ''
  );
  const [imageKey, setImageKey] = useState(() => localStorage.getItem('arti_key_image') || '');
  const [imageModel, setImageModel] = useState(() => localStorage.getItem('arti_image_model') || '');

  // Video-generation provider. The Videos workspace reads these same keys.
  const [videoEndpoint, setVideoEndpoint] = useState(
    () => localStorage.getItem('arti_endpoint_video') || ''
  );
  const [videoKey, setVideoKey] = useState(() => localStorage.getItem('arti_key_video') || '');
  const [videoModel, setVideoModel] = useState(() => localStorage.getItem('arti_video_model') || '');

  // Music-generation provider. The Music Studio reads these same keys. Only the
  // custom bridge is integrated; the real engine credential stays on the
  // owner's server, so no engine key lives in this browser.
  const [musicEndpoint, setMusicEndpoint] = useState(
    () => localStorage.getItem('arti_endpoint_music') || ''
  );
  const [musicKey, setMusicKey] = useState(() => localStorage.getItem('arti_key_music') || '');
  const [musicModel, setMusicModel] = useState(() => localStorage.getItem('arti_music_model') || '');

  // Notification toggles
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
      localStorage.setItem('arti_image_provider', imageProvider);
      localStorage.setItem('arti_endpoint_image', imageEndpoint.trim());
      localStorage.setItem('arti_key_image', imageKey);
      localStorage.setItem('arti_image_model', imageModel.trim());
      localStorage.setItem('arti_endpoint_video', videoEndpoint.trim());
      localStorage.setItem('arti_key_video', videoKey);
      localStorage.setItem('arti_video_model', videoModel.trim());
      localStorage.setItem('arti_endpoint_music', musicEndpoint.trim());
      localStorage.setItem('arti_key_music', musicKey);
      localStorage.setItem('arti_music_model', musicModel.trim());
      showToast('Credentials saved to this browser only', { type: 'success' });
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
          {SETTINGS_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                type="button"
                className={`settings-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                aria-current={isActive ? 'true' : undefined}
                whileTap={{ scale: 0.99 }}
                transition={SPRING.snappy}
              >
                {isActive && (
                  <motion.span
                    layoutId="settings-nav-indicator"
                    className="settings-nav-indicator"
                    transition={SPRING.gentle}
                    aria-hidden="true"
                  />
                )}
                <Icon size={15} />
                <span>{tab.label}</span>
              </motion.button>
            );
          })}
        </aside>

        {/* Center/Right Settings Content */}
        <main className="settings-content-column">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              className="settings-section-swap"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: DUR.base, ease: EASE.enter }}
            >
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
                Provider keys are stored in this browser&rsquo;s local storage on this device, unencrypted.
                Do not use shared or untrusted devices. No key is transmitted anywhere from this build.
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

                <div className="settings-section-divider">
                  <span>Image Generation</span>
                </div>
                <p className="section-desc">
                  The Images workspace generates images through one of these paths. The OpenAI path reuses
                  your OpenAI key above. The custom bridge keeps provider credentials on your own server —
                  recommended for production. Nothing is uploaded to an ARTI server.
                </p>

                <div className="form-field">
                  <label className="form-label">Image provider</label>
                  <select
                    className="form-select"
                    value={imageProvider}
                    onChange={(e) => setImageProvider(e.target.value as 'openai' | 'custom-server')}
                  >
                    <option value="openai">OpenAI Images (uses the OpenAI key above)</option>
                    <option value="custom-server">Custom image bridge (server-side)</option>
                  </select>
                </div>

                {imageProvider === 'custom-server' && (
                  <>
                    <div className="form-field">
                      <label className="form-label">Image bridge endpoint URL</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="https://your-server.example.com/generate"
                        value={imageEndpoint}
                        onChange={(e) => setImageEndpoint(e.target.value)}
                      />
                      <p className="form-hint">
                        ARTI POSTs JSON and expects <code className="settings-code">{'{ images: [{ b64_json | url }] }'}</code>.
                        Only http/https endpoints are accepted.
                      </p>
                    </div>
                    <div className="form-field">
                      <label className="form-label">Image bridge key (optional)</label>
                      <input
                        type="password"
                        className="form-input"
                        placeholder="Bearer token for your bridge"
                        value={imageKey}
                        onChange={(e) => setImageKey(e.target.value)}
                      />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Model id (optional)</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. flux-1.1-pro"
                        value={imageModel}
                        onChange={(e) => setImageModel(e.target.value)}
                      />
                    </div>
                  </>
                )}

                <div className="settings-section-divider">
                  <span>Video Generation</span>
                </div>
                <p className="section-desc">
                  The Videos workspace renders through your own video bridge. The bridge holds the real engine
                  credential on your server, so no engine key lives in this browser. Nothing is uploaded to an
                  ARTI server, and no video is generated until an endpoint is configured here.
                </p>

                <div className="form-field">
                  <label className="form-label">Video bridge endpoint URL</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="https://your-server.example.com/generate-video"
                    value={videoEndpoint}
                    onChange={(e) => setVideoEndpoint(e.target.value)}
                  />
                  <p className="form-hint">
                    ARTI POSTs JSON (prompt, duration, aspect ratio, resolution, fps, optional seed /
                    negative prompt / reference image) and expects{' '}
                    <code className="settings-code">{'{ videos: [{ url | b64_json, width?, height?, duration?, format? }] }'}</code>.
                    Only http/https endpoints are accepted. Asynchronous job responses (a bare{' '}
                    <code className="settings-code">jobId</code>) are reported honestly as not polled here.
                  </p>
                </div>
                <div className="form-field">
                  <label className="form-label">Video bridge key (optional)</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Bearer token for your bridge"
                    value={videoKey}
                    onChange={(e) => setVideoKey(e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Model id (optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. your-engine-model"
                    value={videoModel}
                    onChange={(e) => setVideoModel(e.target.value)}
                  />
                </div>

                <div className="settings-section-divider">
                  <span>Music Generation</span>
                </div>
                <p className="section-desc">
                  The Music Studio generates through your own music bridge. The bridge holds the real engine
                  credential on your server, so no engine key lives in this browser. Lyrics can additionally use the
                  language model configured above. No audio is generated until an endpoint is configured here.
                </p>

                <div className="form-field">
                  <label className="form-label">Music bridge endpoint URL</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="https://your-server.example.com/generate-music"
                    value={musicEndpoint}
                    onChange={(e) => setMusicEndpoint(e.target.value)}
                  />
                  <p className="form-hint">
                    ARTI POSTs JSON (prompt, instrumental, duration, model, and optional lyrics, vocal_type,
                    language, genre, mood, negative_prompt, seed) and expects{' '}
                    <code className="settings-code">{'{ tracks: [{ url | b64_json, duration?, format?, title? }] }'}</code>.
                    Only http/https endpoints are accepted. Asynchronous job responses (a bare{' '}
                    <code className="settings-code">jobId</code>) are reported honestly as not polled here.
                  </p>
                </div>
                <div className="form-field">
                  <label className="form-label">Music bridge key (optional)</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Bearer token for your bridge"
                    value={musicKey}
                    onChange={(e) => setMusicKey(e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Model id (optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. your-music-engine-model"
                    value={musicModel}
                    onChange={(e) => setMusicModel(e.target.value)}
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
              <h3 className="section-title">Privacy</h3>
              <div className="setting-toggle-row">
                <div>
                  <h4 className="setting-toggle-title">Private Mode</h4>
                  <p className="setting-toggle-desc">Keep workspace activity local to this browser. No telemetry is collected in this build.</p>
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
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};
