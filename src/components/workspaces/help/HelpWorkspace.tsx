import React, { useState } from 'react';
import {
  HelpCircle,
  Search,
  Navigation,
  ChevronDown,
  ChevronUp,
  Download,
} from 'lucide-react';
import { WorkspaceHeader } from '../../common/WorkspaceHeader';
import { ALL_NAV_ITEMS } from '../../../types/navigation';
import { useToast } from '../../../context/ToastContext';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQ_LIST: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'What is ARTI AI?',
    answer:
      'ARTI AI is a premium universal workspace front end. This build provides navigation, module landing interfaces, and a graphical Magic Mode canvas. AI generation and agent execution backends are not connected in this phase.',
    category: 'Architecture',
  },
  {
    id: 'faq-2',
    question: 'Where is my data stored?',
    answer:
      'Records you create (projects, documents, chats, knowledge references) are saved in your browser\u2019s localStorage on this device. They persist across reloads in this browser only. No data is sent to a server, and no encryption layer is applied.',
    category: 'Privacy',
  },
  {
    id: 'faq-3',
    question: 'How do I connect a model provider?',
    answer:
      'Open Settings and use the Connected Services section to store a provider key. Stored keys are kept in this browser only. Wiring a key to live inference is a future integration and is not active in this build.',
    category: 'Setup',
  },
  {
    id: 'faq-4',
    question: 'What is Magic Mode?',
    answer:
      'Magic Mode is ARTI\u2019s graphical orchestration canvas. It visualises how a goal would be decomposed into workflow nodes, agent lanes, tools, and verification stages. Until the orchestration engine is connected, it shows a designed initial state and does not run tasks.',
    category: 'Magic Mode',
  },
];

export const HelpWorkspace: React.FC = () => {
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>('faq-1');

  const filteredFaqs = FAQ_LIST.filter(
    (f) =>
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase())
  );

  const handleExportDiagnostics = () => {
    let storageWritable = false;
    try {
      const probe = '__arti_probe__';
      window.localStorage.setItem(probe, '1');
      window.localStorage.removeItem(probe);
      storageWritable = true;
    } catch {
      storageWritable = false;
    }
    const report = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      localStorageWritable: storageWritable,
      modelProviderConfigured: false,
      encryptionImplemented: false,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arti_diagnostics_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Diagnostic report exported', { type: 'gold' });
  };

  return (
    <div className="workspace-page-container">
      <WorkspaceHeader
        title="Help &amp; Documentation"
        description="Getting started guides, complete workspace directory manual, and system troubleshooting"
        icon={HelpCircle}
        badge="Documentation"
        actions={
          <div className="header-action-cluster">
            <button
              type="button"
              className="gold-ghost-btn"
              onClick={handleExportDiagnostics}
              title="Download offline diagnostic report"
            >
              <Download size={14} />
              <span>Export Diagnostics</span>
            </button>
          </div>
        }
      />

      <div className="help-studio-grid">
        {/* Left Column: FAQ & Search */}
        <main className="help-main-column">
          <div className="help-search-box">
            <Search size={15} className="help-search-icon" />
            <input
              type="text"
              className="help-search-input"
              placeholder="Search help articles, troubleshooting guides, or commands..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="faq-list">
            <h3 className="section-title">Frequently Asked Questions</h3>
            {filteredFaqs.map((faq) => {
              const isExpanded = expandedFaqId === faq.id;
              return (
                <div key={faq.id} className="faq-card">
                  <button
                    type="button"
                    className="faq-question-btn"
                    onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                  >
                    <span className="faq-q-text">{faq.question}</span>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {isExpanded && <div className="faq-answer-body">{faq.answer}</div>}
                </div>
              );
            })}
          </div>
        </main>

        {/* Right Column: Navigation Sitemap Guide */}
        <aside className="help-sidebar-column">
          <div className="spec-card">
            <div className="spec-card-header-row">
              <Navigation size={14} />
              <h3 className="spec-card-heading">Workspace Map (22 Destinations)</h3>
            </div>
            <div className="sitemap-list">
              {ALL_NAV_ITEMS.map((item, idx) => (
                <div key={item.id} className="sitemap-row">
                  <span className="sitemap-num">{idx + 1}.</span>
                  <div className="sitemap-info">
                    <strong className="sitemap-label">{item.label}</strong>
                    <span className="sitemap-desc">{item.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
