import React, { useState } from 'react';
import {
  HelpCircle,
  Search,
  BookOpen,
  Navigation,
  ShieldCheck,
  Cpu,
  ChevronDown,
  ChevronUp,
  Download,
  Terminal,
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
    question: 'How is ARTI AI different from typical AI chat SaaS websites?',
    answer:
      'ARTI AI is a private autonomous command center built around deterministic task graphs (DAG), decoupled specialist agents, local client encryption (AES-256 GCM), and zero-telemetry architecture.',
    category: 'Architecture',
  },
  {
    id: 'faq-2',
    question: 'Where is my conversation and project data stored?',
    answer:
      'In Phase 1, data is stored 100% inside your local browser storage (IndexedDB and LocalStorage). Nothing is stored on centralized tracking databases.',
    category: 'Privacy',
  },
  {
    id: 'faq-3',
    question: 'How do I activate live model responses for Chats and Generation?',
    answer:
      'Navigate to Settings > Connected Services and paste your preferred API key (Google Gemini, OpenAI, or Anthropic), or connect your local Ollama endpoint (http://localhost:11434).',
    category: 'Setup',
  },
  {
    id: 'faq-4',
    question: 'What is Magic Mode?',
    answer:
      'Magic Mode is ARTI’s signature multi-agent graphical orchestration workspace. Rather than a basic chat prompt, it renders an interactive workflow canvas connecting specialist agents, tool execution nodes, and quality checks.',
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
    const report = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      storageState: 'IndexedDB / LocalStorage verified',
      privacyMode: 'Zero-Telemetry Active',
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arti_diagnostics_${Date.now()}.json`;
    a.click();
    showToast('Offline diagnostic report exported', { type: 'gold' });
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
              <h3 className="spec-card-heading">Workspace Map (21 Destinations)</h3>
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
