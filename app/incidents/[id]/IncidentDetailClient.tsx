'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { NavBar } from '@/components/NavBar';
import { useToast } from '@/components/Toast';
import { FeedbackModal } from '@/components/FeedbackModal';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface Incident {
  _id: string;
  category: string;
  subCategory: string;
  priority: number;
  urgency: number;
  impact: number;
  status: 'Open' | 'In Progress' | 'Resolved';
  lastUpdatedBy: string;
  conversation: ConversationMessage[];
  resolutionDetails: string;
  createdAt: string;
  updatedAt: string;
}

const statusColors = {
  'Open': 'bg-blue-100 text-blue-700 border-blue-200',
  'In Progress': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Resolved': 'bg-green-100 text-green-700 border-green-200',
};

const statusDotColors = {
  'Open': 'bg-blue-500',
  'In Progress': 'bg-yellow-500',
  'Resolved': 'bg-green-500',
};

export default function IncidentDetailClient({ incidentId, username }: { incidentId: string; username: string }) {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { showToast, ToastElement } = useToast();

  useEffect(() => {
    fetch(`/api/incidents/${incidentId}`)
      .then(r => {
        if (r.status === 404 || r.status === 403) { setNotFound(true); return null; }
        return r.json();
      })
      .then(d => { if (d) setIncident(d.incident); })
      .finally(() => setLoading(false));
  }, [incidentId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [incident?.conversation]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || chatLoading || !incident) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    setChatLoading(true);

    setIncident(prev => prev ? {
      ...prev,
      conversation: [...prev.conversation, { role: 'user', content: userMsg, timestamp: new Date().toISOString() }]
    } : prev);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, tileCategory: incident.subCategory, incidentId: incident._id }),
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Failed to get response', 'error');
        return;
      }

      setIncident(prev => prev ? {
        ...prev,
        status: data.status || prev.status,
        conversation: [...prev.conversation, { role: 'assistant', content: data.response, timestamp: new Date().toISOString() }]
      } : prev);

      if (data.endOfFlow) setShowFeedback(true);
    } catch {
      showToast("I'm having trouble connecting. Please try again.", 'error');
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) return (
    <div data-testid="incident-detail-loading" className="min-h-screen flex items-center justify-center">
      <p className="text-slate-500">Loading incident...</p>
    </div>
  );

  if (notFound || !incident) return (
    <div data-testid="incident-not-found" className="min-h-screen flex flex-col items-center justify-center">
      <h1 data-testid="not-found-heading" className="text-2xl font-bold text-slate-800">Incident not found</h1>
      <Link href="/incidents" data-testid="back-to-incidents" className="text-blue-600 hover:underline mt-4">← Back to incidents</Link>
    </div>
  );

  const timelineSteps = [
    { label: 'Open', active: true },
    { label: 'In Progress', active: ['In Progress', 'Resolved'].includes(incident.status) },
    { label: 'Resolved', active: incident.status === 'Resolved' },
  ];

  return (
    <div data-testid="incident-detail-page" className="flex flex-col min-h-screen">
      {ToastElement}
      <NavBar username={username} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 pb-40">
        {/* Header Card */}
        <div data-testid="incident-header-card" className="bg-white rounded-xl border border-slate-200 p-6 mb-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 data-testid="incident-id" className="text-lg font-mono text-slate-500 mb-1">#{incident._id.slice(-8).toUpperCase()}</h1>
              <h2 data-testid="incident-category-title" className="text-2xl font-bold text-slate-800">{incident.category} / {incident.subCategory}</h2>
            </div>
            <span data-testid="incident-status-badge" className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${statusColors[incident.status]}`}>
              {incident.status}
            </span>
          </div>
          <div data-testid="incident-metadata" className="grid grid-cols-3 gap-4 text-sm">
            <div data-testid="incident-priority-cell">
              <p className="text-slate-500 mb-1">Priority</p>
              <p data-testid="incident-priority-value" className="font-semibold text-slate-800">P{incident.priority}</p>
            </div>
            <div data-testid="incident-urgency-cell">
              <p className="text-slate-500 mb-1">Urgency</p>
              <p data-testid="incident-urgency-value" className="font-semibold text-slate-800">{incident.urgency}</p>
            </div>
            <div data-testid="incident-impact-cell">
              <p className="text-slate-500 mb-1">Impact</p>
              <p data-testid="incident-impact-value" className="font-semibold text-slate-800">{incident.impact}</p>
            </div>
          </div>
          {incident.lastUpdatedBy && (
            <p data-testid="incident-resolved-by" className="text-slate-500 text-sm mt-3">
              Handled by: <span className="font-medium text-slate-700">{incident.lastUpdatedBy}</span>
            </p>
          )}
        </div>

        {/* Timeline */}
        <div data-testid="incident-timeline" className="bg-white rounded-xl border border-slate-200 p-6 mb-6 shadow-sm">
          <h3 data-testid="timeline-heading" className="font-semibold text-slate-700 mb-4">Timeline</h3>
          <div className="flex items-center gap-0">
            {timelineSteps.map((step, i) => (
              <div key={step.label} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div data-testid={`timeline-step-${step.label.toLowerCase().replace(' ', '-')}`}
                    className={`w-4 h-4 rounded-full border-2 ${step.active ? `${statusDotColors[step.label as keyof typeof statusDotColors] || 'bg-slate-400'} border-transparent` : 'border-slate-300 bg-white'}`} />
                  <span className={`text-xs mt-1 whitespace-nowrap ${step.active ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>{step.label}</span>
                </div>
                {i < timelineSteps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 mb-4 ${timelineSteps[i + 1].active ? 'bg-green-400' : 'bg-slate-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Conversation */}
        <div data-testid="incident-chat-window" className="space-y-4">
          {incident.conversation.map((msg, i) => (
            <div
              key={i}
              data-testid={`incident-message-${msg.role}`}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-2xl rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm'
              }`}>
                {msg.role === 'assistant' && (
                  <span className="font-semibold text-blue-600 text-xs block mb-1">Patch</span>
                )}
                {msg.content}
              </div>
            </div>
          ))}
          {chatLoading && (
            <div data-testid="incident-chat-loading" className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 text-slate-500 text-sm shadow-sm">
                Patch is thinking...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </main>

      {/* Chat Input */}
      <div data-testid="incident-chat-input-container" className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg px-6 py-4">
        <div className="max-w-4xl mx-auto flex gap-3 items-end">
          {incident.status === 'Resolved' ? (
            <p data-testid="incident-resolved-message" className="flex-1 text-center text-slate-500 text-sm py-3">
              This incident is resolved.
            </p>
          ) : (
            <>
              <textarea
                data-testid="incident-chat-textarea"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
                }}
                placeholder="Continue the conversation..."
                rows={2}
                className="flex-1 resize-none border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                data-testid="incident-send-btn"
                onClick={handleSendMessage}
                disabled={!chatInput.trim() || chatLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-3 rounded-xl font-medium transition-colors"
              >
                Send
              </button>
            </>
          )}
        </div>
      </div>

      {showFeedback && (
        <FeedbackModal
          incidentId={incident._id}
          onClose={() => setShowFeedback(false)}
          onSubmitted={() => setShowFeedback(false)}
        />
      )}
    </div>
  );
}
