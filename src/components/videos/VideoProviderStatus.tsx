import React from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle2, Clock, XCircle, Info } from 'lucide-react';
import {
  VIDEO_PROVIDERS,
  BRIDGE_CAPABILITY,
  getVideoConnection,
  sixteenKStatement,
  type VideoProviderState,
  type CapabilityValue,
} from '../../services/videoProvider';

interface VideoProviderStatusProps {
  onClose: () => void;
}

const STATE_META: Record<VideoProviderState, { label: string; icon: React.ReactNode; cls: string }> = {
  PLANNED: { label: 'Planned', icon: <Clock size={12} />, cls: 'state-planned' },
  RESEARCHING: { label: 'Researching', icon: <Clock size={12} />, cls: 'state-researching' },
  READY_TO_INTEGRATE: { label: 'Ready to integrate', icon: <Info size={12} />, cls: 'state-ready' },
  INTEGRATED: { label: 'Integrated', icon: <CheckCircle2 size={12} />, cls: 'state-integrated' },
  VERIFIED: { label: 'Verified', icon: <ShieldCheck size={12} />, cls: 'state-verified' },
  BLOCKED: { label: 'Blocked', icon: <XCircle size={12} />, cls: 'state-blocked' },
};

function cap(value: CapabilityValue): { text: string; cls: string } {
  if (value === true) return { text: 'Yes', cls: 'cap-yes' };
  if (value === false) return { text: 'No', cls: 'cap-no' };
  return { text: 'Unknown', cls: 'cap-unknown' };
}

/**
 * Provider & capability status.
 *
 * The honest registry: each provider is shown with its real integration state,
 * the credential a real integration would need, and a capability table where an
 * unverified field is reported as `Unknown` rather than invented. Only the
 * custom bridge is actually wired up in this build.
 */
export const VideoProviderStatus: React.FC<VideoProviderStatusProps> = ({ onClose }) => {
  const connection = getVideoConnection();
  const profile = BRIDGE_CAPABILITY;

  const rows: Array<[string, CapabilityValue | string]> = [
    ['Text-to-video', profile.textToVideo],
    ['Image-to-video', profile.imageToVideo],
    ['Video-to-video', profile.videoToVideo],
    ['Max single-clip duration', profile.maxClipSeconds === null ? 'Not declared' : `${profile.maxClipSeconds}s`],
    ['Native 16K output', profile.native16k],
    ['Upscaling', profile.upscaling],
    ['Audio generation', profile.audioGeneration],
    ['Dialogue', profile.dialogue],
    ['Lip synchronisation', profile.lipSync],
    ['Reference image', profile.referenceImage],
    ['Character consistency', profile.characterConsistency],
    ['Start / end frame control', profile.startEndFrame],
    ['Seed control', profile.seedControl],
    ['Batch generation', profile.batchGeneration],
    ['Long-form generation', profile.longForm],
    ['Video extension', profile.videoExtension],
    ['Commercial use', profile.commercialUse],
  ];

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="dialog-container video-provider-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="video-provider-title"
      >
        <div className="dialog-header">
          <div>
            <h2 id="video-provider-title" className="dialog-title">
              <ShieldCheck size={16} aria-hidden="true" /> Provider &amp; capability status
            </h2>
            <p className="dialog-description">
              What is genuinely connected in this build — and what would be required to connect more.
            </p>
          </div>
          <button type="button" className="dialog-close-btn" onClick={onClose} aria-label="Close provider status">
            <XCircle size={16} />
          </button>
        </div>

        <div className="dialog-body video-provider-body">
          <div className={`video-provider-connection ${connection ? 'connected' : 'disconnected'}`}>
            {connection ? <CheckCircle2 size={14} aria-hidden="true" /> : <AlertTriangle size={14} aria-hidden="true" />}
            <span>
              {connection
                ? 'A custom video bridge is configured. Requests are sent to your bridge; nothing is stored on an ARTI server.'
                : 'No video bridge is configured. Real generation is unavailable until one is set in Settings > Connected Services.'}
            </span>
          </div>

          <h3 className="video-provider-section-title">Providers</h3>
          <ul className="video-provider-list">
            {VIDEO_PROVIDERS.map((p) => {
              const meta = STATE_META[p.state];
              return (
                <li key={p.id} className="video-provider-item">
                  <div className="video-provider-item-head">
                    <span className="video-provider-name">{p.label}</span>
                    <span className={`video-provider-state ${meta.cls}`}>
                      {meta.icon}
                      {meta.label}
                    </span>
                  </div>
                  <p className="video-provider-note">{p.note}</p>
                  <p className="video-provider-credential">
                    <strong>Credential:</strong> {p.credential}
                  </p>
                  {p.operational && (
                    <p className="video-provider-credential">
                      <strong>Operations:</strong> {p.operational}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>

          <h3 className="video-provider-section-title">Custom bridge capability</h3>
          <p className="video-provider-capnote">
            These are declared by your bridge. Fields your server has not declared are shown as
            <strong> Unknown</strong> — ARTI never invents a capability.
          </p>
          <div className="video-cap-table" role="table" aria-label="Bridge capability">
            {rows.map(([label, value]) => {
              const isCap = typeof value === 'boolean' || value === 'unknown';
              const meta = isCap ? cap(value as CapabilityValue) : { text: String(value), cls: 'cap-value' };
              return (
                <div key={label} className="video-cap-row" role="row">
                  <span className="video-cap-label" role="cell">{label}</span>
                  <span className={`video-cap-value ${meta.cls}`} role="cell">{meta.text}</span>
                </div>
              );
            })}
          </div>

          <div className="video-honesty-note warning" role="note">
            <AlertTriangle size={13} aria-hidden="true" />
            <span>{sixteenKStatement(profile)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
