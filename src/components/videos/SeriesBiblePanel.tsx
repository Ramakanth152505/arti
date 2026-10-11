import React, { useState } from 'react';
import { Plus, Trash2, Check, ShieldCheck, BookOpen } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { videoProductionStore, type Production, type Character } from '../../services/videoProduction';

interface SeriesBiblePanelProps {
  production: Production;
}

const TEXT_FIELDS: Array<[keyof Production['bible'], string, string]> = [
  ['locations', 'Locations', 'Recurring locations and their look.'],
  ['worldRules', 'World rules', 'Physical, social and narrative rules of the world.'],
  ['timeline', 'Timeline', 'Chronology of established events.'],
  ['factions', 'Factions & organizations', 'Groups, allegiances and rivalries.'],
  ['props', 'Props & recurring objects', 'Objects that carry meaning across episodes.'],
  ['technology', 'Technology / magic rules', 'How technology or magic works and its limits.'],
  ['palette', 'Visual palette', 'Colour palette and visual identity.'],
  ['cinematography', 'Cinematography rules', 'Camera language and framing conventions.'],
  ['music', 'Music & sound identity', 'Musical themes and sound design.'],
  ['terminology', 'Terminology & pronunciation', 'Invented words and how to say them.'],
];

/**
 * Series bible.
 *
 * The editable canonical reference for a production. Later episodes retrieve
 * relevant canonical context from here rather than resending the entire
 * franchise history. Canonical facts can be approved explicitly; a fact is only
 * treated as canon once the owner approves it.
 */
export const SeriesBiblePanel: React.FC<SeriesBiblePanelProps> = ({ production }) => {
  const { showToast } = useToast();
  const [factText, setFactText] = useState('');
  const bible = production.bible;

  const addFact = () => {
    if (!factText.trim()) return;
    videoProductionStore.addCanonFact(production.id, factText, false);
    setFactText('');
    showToast('Canonical fact added (unapproved)', { type: 'info' });
  };

  return (
    <div className="series-bible">
      <div className="bible-section">
        <div className="bible-section-head">
          <h3 className="bible-section-title">
            <BookOpen size={14} aria-hidden="true" /> Characters
          </h3>
          <button
            type="button"
            className="gold-ghost-btn small"
            onClick={() => videoProductionStore.addCharacter(production.id, {})}
          >
            <Plus size={12} aria-hidden="true" />
            <span>Add character</span>
          </button>
        </div>

        {bible.characters.length === 0 ? (
          <p className="bible-empty">No characters yet. Add a character sheet to keep identity consistent.</p>
        ) : (
          <div className="character-list">
            {bible.characters.map((c) => (
              <CharacterCard key={c.id} productionId={production.id} character={c} />
            ))}
          </div>
        )}
      </div>

      <div className="bible-section">
        <h3 className="bible-section-title">World reference</h3>
        <div className="bible-fields">
          {TEXT_FIELDS.map(([key, label, placeholder]) => (
            <div key={String(key)} className="settings-field">
              <label className="settings-label" htmlFor={`bible-${String(key)}`}>{label}</label>
              <textarea
                id={`bible-${String(key)}`}
                className="form-textarea"
                rows={2}
                value={String(bible[key] ?? '')}
                placeholder={placeholder}
                onChange={(e) => videoProductionStore.updateBible(production.id, { [key]: e.target.value })}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="bible-section">
        <h3 className="bible-section-title">
          <ShieldCheck size={14} aria-hidden="true" /> Canonical facts
        </h3>
        <p className="bible-hint">
          Only approved facts are treated as canon. ARTI never silently rewrites established canon — an
          unapproved fact is a proposal until you approve it.
        </p>
        <div className="bible-fact-add">
          <input
            type="text"
            className="form-input"
            value={factText}
            placeholder="e.g. The kingdom fell in the year 412 of the Third Age."
            onChange={(e) => setFactText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addFact();
              }
            }}
          />
          <button type="button" className="gold-ghost-btn small" onClick={addFact}>
            <Plus size={12} aria-hidden="true" />
            <span>Add</span>
          </button>
        </div>
        {bible.canonFacts.length === 0 ? (
          <p className="bible-empty">No canonical facts yet.</p>
        ) : (
          <ul className="canon-list">
            {bible.canonFacts.map((f) => (
              <li key={f.id} className={`canon-item ${f.approved ? 'approved' : 'proposed'}`}>
                <button
                  type="button"
                  className="canon-approve"
                  onClick={() => videoProductionStore.setCanonApproved(production.id, f.id, !f.approved)}
                  title={f.approved ? 'Revoke approval' : 'Approve as canon'}
                  aria-label={f.approved ? 'Revoke approval' : 'Approve as canon'}
                >
                  <Check size={12} aria-hidden="true" />
                </button>
                <span className="canon-text">{f.text}</span>
                <span className={`canon-badge ${f.approved ? 'approved' : 'proposed'}`}>
                  {f.approved ? 'Canon' : 'Proposed'}
                </span>
                <button
                  type="button"
                  className="canon-del"
                  onClick={() => videoProductionStore.removeCanonFact(production.id, f.id)}
                  title="Remove fact"
                  aria-label="Remove fact"
                >
                  <Trash2 size={12} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const CharacterCard: React.FC<{ productionId: string; character: Character }> = ({ productionId, character }) => {
  const fields: Array<[keyof Character, string]> = [
    ['aliases', 'Aliases'],
    ['description', 'Description'],
    ['ageRange', 'Age / age range'],
    ['appearance', 'Clothing & appearance'],
    ['personality', 'Personality'],
    ['voice', 'Voice characteristics'],
    ['relationships', 'Relationships'],
    ['history', 'Character history'],
  ];
  return (
    <div className="character-card">
      <div className="character-card-head">
        <input
          type="text"
          className="character-name-input"
          value={character.name}
          onChange={(e) => videoProductionStore.updateCharacter(productionId, character.id, { name: e.target.value })}
          aria-label="Character name"
        />
        <button
          type="button"
          className="season-tool-btn danger"
          onClick={() => videoProductionStore.removeCharacter(productionId, character.id)}
          title="Remove character"
          aria-label={`Remove ${character.name}`}
        >
          <Trash2 size={12} aria-hidden="true" />
        </button>
      </div>
      <div className="character-fields">
        {fields.map(([key, label]) => (
          <div key={String(key)} className="settings-field">
            <label className="settings-label">{label}</label>
            <input
              type="text"
              className="form-input"
              value={String(character[key] ?? '')}
              onChange={(e) =>
                videoProductionStore.updateCharacter(productionId, character.id, { [key]: e.target.value })
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
};
