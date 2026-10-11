import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCcw,
  Trash2,
  Terminal,
} from 'lucide-react';
import { WorkspaceHeader } from '../../common/WorkspaceHeader';
import { useToast } from '../../../context/ToastContext';

interface ServiceHealthRow {
  name: string;
  category: string;
  status: 'Available' | 'Not Configured' | 'Unavailable';
  latency: string;
  detail: string;
}

function probeStorage(): boolean {
  try {
    const probeKey = '__arti_probe__';
    window.localStorage.setItem(probeKey, '1');
    window.localStorage.removeItem(probeKey);
    return true;
  } catch {
    return false;
  }
}

export const SystemStatusWorkspace: React.FC = () => {
  const { showToast } = useToast();

  const storageAvailable = React.useMemo(() => probeStorage(), []);

  const healthMatrix: ServiceHealthRow[] = React.useMemo(
    () => [
      {
        name: 'Frontend Client Shell',
        category: 'Runtime Core',
        status: 'Available',
        latency: 'N/A',
        detail: 'This React + TypeScript bundle is rendering. No performance telemetry is collected.',
      },
      {
        name: 'Browser Local Storage',
        category: 'Persistence',
        status: storageAvailable ? 'Available' : 'Unavailable',
        latency: 'N/A',
        detail: storageAvailable
          ? 'localStorage is writable. Workspace records persist on this browser only.'
          : 'localStorage is blocked or unavailable in this browser session.',
      },
      {
        name: 'Client-Side Encryption',
        category: 'Security',
        status: 'Not Configured',
        latency: 'N/A',
        detail: 'No encryption layer is implemented. Data is stored in plain browser storage.',
      },
      {
        name: 'AI Model Inference Engine',
        category: 'Intelligence',
        status: 'Not Configured',
        latency: 'N/A',
        detail: 'No model provider endpoint is connected. Configure one in Settings.',
      },
      {
        name: 'Media Rendering Service',
        category: 'Media Engine',
        status: 'Not Configured',
        latency: 'N/A',
        detail: 'No image or video generation backend is connected.',
      },
      {
        name: 'Remote Vector / Cloud Services',
        category: 'Cloud Services',
        status: 'Not Configured',
        latency: 'N/A',
        detail: 'No remote service endpoints are configured. No data is transmitted.',
      },
    ],
    [storageAvailable]
  );

  const [logs, setLogs] = useState<string[]>(() => [
    `[${new Date().toLocaleTimeString()}] ARTI client runtime mounted.`,
    `[${new Date().toLocaleTimeString()}] Local storage probe: ${storageAvailable ? 'writable' : 'unavailable'}.`,
    `[${new Date().toLocaleTimeString()}] Model inference: no provider configured.`,
    `[${new Date().toLocaleTimeString()}] Manual diagnostics have not been run.`,
  ]);

  const [lastDiagnostic, setLastDiagnostic] = useState<string | null>(null);

  const handleRunDiagnostic = () => {
    const storage = probeStorage();
    const configured = 0;
    const total = healthMatrix.length;
    const line = `[${new Date().toLocaleTimeString()}] Diagnostic: storage ${
      storage ? 'writable' : 'unavailable'
    }; ${total - 1} of ${total} subsystems require provider configuration (${configured} connected).`;
    setLogs((prev) => [...prev, line]);
    setLastDiagnostic(line);
    showToast('Diagnostic completed. See event stream for details.', { type: 'info' });
  };

  const handleClearCache = () => {
    if (window.confirm('Clear ARTI workspace data stored in this browser? This cannot be undone.')) {
      try {
        const keys = Object.keys(window.localStorage).filter((k) => k.startsWith('arti_'));
        keys.forEach((k) => window.localStorage.removeItem(k));
        setLogs((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] Cleared ${keys.length} ARTI local storage key(s).`,
        ]);
        showToast('ARTI local data cleared', { type: 'gold' });
      } catch {
        showToast('Could not clear local storage in this browser.', { type: 'warning' });
      }
    }
  };

  const getStatusIcon = (status: ServiceHealthRow['status']) => {
    switch (status) {
      case 'Available':
        return <CheckCircle2 size={14} className="status-ico ok" />;
      case 'Not Configured':
        return <AlertTriangle size={14} className="status-ico warn" />;
      case 'Unavailable':
      default:
        return <XCircle size={14} className="status-ico err" />;
    }
  };

  return (
    <div className="workspace-page-container">
      <WorkspaceHeader
        title="System Status &amp; Telemetry"
        description="Honest runtime status: only data actually available to this client is shown"
        icon={Activity}
        badge="Live Health Reporting"
        actions={
          <div className="header-action-cluster">
            <button
              type="button"
              className="gold-ghost-btn"
              onClick={handleClearCache}
              title="Clear ARTI data stored in this browser"
            >
              <Trash2 size={14} />
              <span>Clear Local Data</span>
            </button>
            <button
              type="button"
              className="gold-primary-btn"
              onClick={handleRunDiagnostic}
              title="Run client-side self-check"
            >
              <RotateCcw size={14} />
              <span>Run Diagnostic</span>
            </button>
          </div>
        }
      />

      <div className="system-status-grid">
        {/* Metric Cards Summary */}
        <div className="status-metrics-row">
          <div className="metric-card">
            <span className="metric-label">Frontend Client</span>
            <strong className="metric-val">Running</strong>
            <span className="metric-sub">This bundle is mounted</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Model Connectivity</span>
            <strong className="metric-val standby">Not Configured</strong>
            <span className="metric-sub">Configure in Settings</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Client Encryption</span>
            <strong className="metric-val standby">Not Implemented</strong>
            <span className="metric-sub">Plain browser storage</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Persistence</span>
            <strong className="metric-val">{storageAvailable ? 'localStorage' : 'Unavailable'}</strong>
            <span className="metric-sub">Browser-only</span>
          </div>
        </div>

        {/* Honest Subsystems Table */}
        <div className="subsystems-table-card">
          <div className="subsystems-header-row">
            <span className="col-sub-name">Subsystem</span>
            <span className="col-sub-cat">Category</span>
            <span className="col-sub-status">Status</span>
            <span className="col-sub-lat">Latency</span>
            <span className="col-sub-detail">Notes</span>
          </div>

          <div className="subsystems-body">
            {healthMatrix.map((row) => (
              <div key={row.name} className="subsystem-row">
                <span className="col-sub-name">{row.name}</span>
                <span className="col-sub-cat">{row.category}</span>
                <span className="col-sub-status">
                  {getStatusIcon(row.status)}
                  <span className={`status-text ${row.status.toLowerCase().replace(/[^a-z]+/g, '-')}`}>
                    {row.status}
                  </span>
                </span>
                <span className="col-sub-lat">{row.latency}</span>
                <span className="col-sub-detail">{row.detail}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Diagnostics Log Stream */}
        <div className="system-log-stream-card">
          <div className="log-stream-header">
            <Terminal size={14} />
            <span>Diagnostics Event Stream</span>
          </div>
          <div className="stream-box">
            {logs.map((line, i) => (
              <div key={i} className="stream-line">
                {line}
              </div>
            ))}
            {lastDiagnostic === null && (
              <div className="stream-line muted">
                No manual diagnostic run yet. These entries reflect real client events only.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
