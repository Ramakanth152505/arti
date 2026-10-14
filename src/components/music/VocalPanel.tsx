/**
 * ARTI AI — Music Studio vocal configuration panel.
 *
 * Male / female / duet / instrumental, vocal language, delivery, harmony,
 * backing vocals and mix prominence. It shows exactly which vocal configuration
 * will be used before generating, and — when the provider has not declared a
 * capability — it says so instead of promising independent voice control.
 *
 * It never offers cloning or imitation of a real singer; only general vocal
 * characteristics.
 */
import React from 'react';
import { AlertCircle, CheckCircle2, User, Users } from 'lucide-react';
import { VOCAL_TYPES, VOCAL_DELIVERIES, DUET_ARRANGEMENTS, type DuetArrangement, type VocalType } from '../../services/musicTypes';
import type { MusicCapabilityProfile } from '../../services/musicProvider';
import { languageLabel } from '../../services/musicLanguages';

interface VocalPanelProps {
  vocalType: VocalType;
  onVocalType: (v: VocalType) => void;
  language: string;
  delivery: string;
  onDelivery: (v: string) => void;
  duetArrangement: DuetArrangement;
  onDuetArrangement: (d: DuetArrangement) => void;
  harmony: boolean;
  onHarmony: (v: boolean) => void;
  backingVocals: boolean;
  onBackingVocals: (v: boolean) => void;
  prominence: number;
  onProminence: (v: number) => void;
  capability: MusicCapabilityProfile;
}

export const VocalPanel: React.FC<VocalPanelProps> = ({
  vocalType,
  onVocalType,
  language,
  delivery,
  onDelivery,
  duetArrangement,
  onDuetArrangement,
  harmony,
  onHarmony,
  backingVocals,
  onBackingVocals,
  prominence,
  onProminence,
  capability,
}) => {
  const vocalCap = capability.vocals;
  const declared = vocalCap !== 'unknown' ? vocalCap : null;
  const isDuet = vocalType === 'duet';
  const isInstrumental = vocalType === 'instrumental';

  const duetSupported = declared ? declared.duet : null;

  return (
    <div className="music-vocal-panel">
      <div className="music-vocal-types">
        {VOCAL_TYPES.map((v) => (
          <button
            key={v.id}
            type="button"
            className={`music-vocal-tile ${vocalType === v.id ? 'active' : ''}`}
            onClick={() => onVocalType(v.id)}
            aria-pressed={vocalType === v.id}
            title={v.description}
          >
            {v.id === 'duet' ? <Users size={15} aria-hidden="true" /> : <User size={15} aria-hidden="true" />}
            <span>{v.label}</span>
          </button>
        ))}
      </div>

      {declared === null ? (
        <p className="music-lang-note" role="note">
          <AlertCircle size={13} aria-hidden="true" />
          The provider has not declared its vocal capabilities, so ARTI cannot promise male, female or duet
          control. Your choice is still sent; the provider decides what it can deliver.
        </p>
      ) : (
        <p className="music-lang-note ok" role="note">
          <CheckCircle2 size={13} aria-hidden="true" />
          Provider-declared vocals: {declared.male ? 'male ' : ''}
          {declared.female ? 'female ' : ''}
          {declared.duet ? 'duet ' : ''}
          {declared.instrumental ? 'instrumental' : ''}
        </p>
      )}

      {isDuet && duetSupported === false && (
        <p className="music-lang-note" role="note">
          <AlertCircle size={13} aria-hidden="true" />
          The provider has declared that it does <strong>not</strong> support independent duet voices. A duet request
          may be generated as a single voice.
        </p>
      )}

      {!isInstrumental && (
        <>
          <label className="music-field-label">
            Vocal language — {languageLabel(language)}
          </label>
          <p className="music-style-hint">
            The lyrics language and the vocal language must match. If the provider cannot sing this language, ARTI
            reports it rather than generating a different language.
          </p>

          <label className="music-field-label" htmlFor="music-vocal-delivery">
            Emotional delivery
          </label>
          <select
            id="music-vocal-delivery"
            className="form-select"
            value={delivery}
            onChange={(e) => onDelivery(e.target.value)}
          >
            <option value="">Provider default</option>
            {VOCAL_DELIVERIES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {isDuet && (
            <>
              <label className="music-field-label" htmlFor="music-duet-arrangement">
                Duet arrangement
              </label>
              <select
                id="music-duet-arrangement"
                className="form-select"
                value={duetArrangement}
                onChange={(e) => onDuetArrangement(e.target.value as DuetArrangement)}
              >
                {DUET_ARRANGEMENTS.map((d) => (
                  <option key={d.id} value={d.id} title={d.description}>
                    {d.label}
                  </option>
                ))}
              </select>
            </>
          )}

          <div className="music-toggle-row">
            <label className="music-checkbox">
              <input type="checkbox" checked={harmony} onChange={(e) => onHarmony(e.target.checked)} />
              <span>Harmony vocals</span>
            </label>
            <label className="music-checkbox">
              <input type="checkbox" checked={backingVocals} onChange={(e) => onBackingVocals(e.target.checked)} />
              <span>Backing vocals</span>
            </label>
          </div>

          <div className="form-field">
            <label className="form-label">Vocal prominence in the mix: {prominence}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={prominence}
              onChange={(e) => onProminence(parseInt(e.target.value, 10))}
              className="range-input"
            />
          </div>
        </>
      )}

      <p className="music-style-hint">
        ARTI offers general vocal characteristics only. It does not clone or imitate a named singer's voice.
      </p>
    </div>
  );
};

export default VocalPanel;
