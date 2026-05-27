'use client';
import { useState, useRef, useEffect } from 'react';
import { NavBar } from '@/components/NavBar';
import { useToast } from '@/components/Toast';
import { FeedbackModal } from '@/components/FeedbackModal';

type Category = 'VDI' | 'Printer' | 'Scanner';

interface UploadState {
  fileName: string | null;
  uploading: boolean;
  done: boolean;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const CATEGORIES: { key: Category; label: string; description: string; icon: string }[] = [
  { key: 'VDI', label: 'VDI', description: 'Virtual Desktop Infrastructure', icon: '🖥️' },
  { key: 'Printer', label: 'Printer', description: 'Printing & Print Management', icon: '🖨️' },
  { key: 'Scanner', label: 'Scanner', description: 'Scanning Equipment', icon: '📄' },
];

export default function HomeClient({ username, userId }: { username: string; userId: string }) {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [uploads, setUploads] = useState<Record<Category, UploadState>>({
    VDI: { fileName: null, uploading: false, done: false },
    Printer: { fileName: null, uploading: false, done: false },
    Scanner: { fileName: null, uploading: false, done: false },
  });
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [incidentId, setIncidentId] = useState<string | null>(null);
  const [incidentStatus, setIncidentStatus] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { showToast, ToastElement } = useToast();

  // Suppress unused variable warning
  void userId;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleUpload = async (category: Category, file: File) => {
    if (file.type !== 'application/pdf') {
      showToast('Only PDF files are allowed', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('File too large (max 10MB)', 'error');
      return;
    }

    setUploads(prev => ({ ...prev, [category]: { fileName: file.name, uploading: true, done: false } }));

    const formData = new FormData();
    formData.append('file', file);
    formData.append('tileCategory', category);

    try {
      const res = await fetch('/api/documents/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to upload document', 'error');
        setUploads(prev => ({ ...prev, [category]: { fileName: null, uploading: false, done: false } }));
      } else {
        setUploads(prev => ({ ...prev, [category]: { fileName: file.name, uploading: false, done: true } }));
      }
    } catch {
      showToast('Failed to upload document', 'error');
      setUploads(prev => ({ ...prev, [category]: { fileName: null, uploading: false, done: false } }));
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    if (!selectedCategory) {
      showToast('Please select a category first', 'info');
      return;
    }
    if (incidentStatus === 'Resolved') return;

    const userMsg = chatInput.trim();
    setChatInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, tileCategory: selectedCategory, incidentId }),
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Failed to get response', 'error');
        setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting. Please try again." }]);
        return;
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      if (data.incidentId) setIncidentId(data.incidentId);
      if (data.status) setIncidentStatus(data.status);
      if (data.endOfFlow) setShowFeedback(true);
    } catch {
      showToast("I'm having trouble connecting. Please try again.", 'error');
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div data-testid="home-page" className="flex flex-col min-h-screen">
      {ToastElement}
      <NavBar username={username} />

      <main className="flex-1 flex flex-col pb-40">
        <div className="max-w-5xl mx-auto w-full px-6 py-8">
          <h2 data-testid="home-heading" className="text-2xl font-bold text-slate-800 mb-2">How can Patch help you today?</h2>
          <p data-testid="home-subheading" className="text-slate-500 mb-8">Select a category and start chatting. Upload relevant documents for better support.</p>

          <section data-testid="category-grid" className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            {CATEGORIES.map(cat => (
              <div
                key={cat.key}
                data-testid={`category-tile-${cat.key.toLowerCase()}`}
                onClick={() => setSelectedCategory(cat.key)}
                className={`rounded-xl border-2 cursor-pointer transition-all p-5 bg-white shadow-sm hover:shadow-md ${
                  selectedCategory === cat.key ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{cat.icon}</span>
                  <div>
                    <h3 data-testid={`category-label-${cat.key.toLowerCase()}`} className="text-lg font-semibold text-slate-800">{cat.label}</h3>
                    <p className="text-slate-500 text-sm">{cat.description}</p>
                  </div>
                </div>

                <div
                  data-testid={`upload-area-${cat.key.toLowerCase()}`}
                  className="mt-2"
                  onClick={e => e.stopPropagation()}
                >
                  <label
                    data-testid={`upload-label-${cat.key.toLowerCase()}`}
                    htmlFor={`upload-${cat.key}`}
                    className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-3 cursor-pointer transition-colors text-sm ${
                      uploads[cat.key].done
                        ? 'border-green-400 bg-green-50 text-green-700'
                        : 'border-slate-300 hover:border-blue-400 text-slate-500 hover:text-blue-600'
                    }`}
                  >
                    {uploads[cat.key].uploading ? (
                      <span data-testid={`upload-progress-${cat.key.toLowerCase()}`}>Extracting text...</span>
                    ) : uploads[cat.key].done ? (
                      <>
                        <span>✓ {uploads[cat.key].fileName}</span>
                        <span className="text-xs mt-1">Click to replace</span>
                      </>
                    ) : (
                      <>
                        <span>📎 Upload PDF</span>
                        <span className="text-xs mt-1">Max 10MB</span>
                      </>
                    )}
                  </label>
                  <input
                    data-testid={`upload-input-${cat.key.toLowerCase()}`}
                    id={`upload-${cat.key}`}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(cat.key, file);
                      e.target.value = '';
                    }}
                  />
                </div>
              </div>
            ))}
          </section>

          {messages.length > 0 && (
            <section data-testid="chat-messages" className="mb-4 space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  data-testid={`chat-message-${msg.role}`}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-2xl rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <span className="font-semibold text-blue-600 text-xs block mb-1">Patch</span>
                    )}
                    {msg.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div data-testid="chat-loading" className="flex justify-start">
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 text-slate-500 text-sm shadow-sm">
                    Patch is thinking...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </section>
          )}

          {incidentId && (
            <div data-testid="incident-link-banner" className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
              Incident created.{' '}
              <a href={`/incidents/${incidentId}`} data-testid="incident-link" className="underline font-medium hover:text-blue-900">
                View incident →
              </a>
            </div>
          )}
        </div>
      </main>

      <div data-testid="chat-input-container" className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg px-6 py-4">
        <div className="max-w-5xl mx-auto flex gap-3 items-end">
          {selectedCategory && (
            <span data-testid="chat-category-badge" className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium whitespace-nowrap self-center">
              {selectedCategory}
            </span>
          )}
          <textarea
            data-testid="chat-textarea"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={selectedCategory ? `Describe your ${selectedCategory} issue...` : 'Select a category above to start chatting'}
            disabled={incidentStatus === 'Resolved'}
            rows={2}
            className="flex-1 resize-none border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-slate-50"
          />
          <button
            data-testid="chat-send-btn"
            onClick={handleSendMessage}
            disabled={!chatInput.trim() || chatLoading || !selectedCategory || incidentStatus === 'Resolved'}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-3 rounded-xl font-medium transition-colors"
          >
            Send
          </button>
        </div>
        {incidentStatus === 'Resolved' && (
          <p data-testid="resolved-message" className="text-center text-slate-500 text-sm mt-2">This incident is resolved.</p>
        )}
      </div>

      {showFeedback && incidentId && (
        <FeedbackModal
          incidentId={incidentId}
          onClose={() => setShowFeedback(false)}
          onSubmitted={() => setShowFeedback(false)}
        />
      )}
    </div>
  );
}
