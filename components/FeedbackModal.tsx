'use client';
import { useState } from 'react';

interface FeedbackModalProps {
  incidentId: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export function FeedbackModal({ incidentId, onClose, onSubmitted }: FeedbackModalProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!rating) return;
    setLoading(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incidentId, rating }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'Unable to save feedback, please try again');
      } else {
        onSubmitted();
      }
    } catch {
      setError('Unable to save feedback, please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="feedback-modal-overlay" className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div data-testid="feedback-modal" className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
        <h3 data-testid="feedback-title" className="text-lg font-semibold text-slate-800 mb-2">How was this response?</h3>
        <p data-testid="feedback-subtitle" className="text-slate-500 text-sm mb-4">Your feedback helps us improve the Patch agent.</p>
        <div data-testid="feedback-stars" className="flex gap-2 mb-4">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              data-testid={`feedback-star-${star}`}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className="text-3xl transition-transform hover:scale-110"
            >
              <span className={(hovered || rating) >= star ? 'text-yellow-400' : 'text-slate-300'}>★</span>
            </button>
          ))}
        </div>
        {error && <p data-testid="feedback-error" className="text-red-600 text-sm mb-3">{error}</p>}
        <div className="flex gap-3">
          <button
            data-testid="feedback-submit-btn"
            onClick={handleSubmit}
            disabled={!rating || loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Submitting...' : 'Submit'}
          </button>
          <button
            data-testid="feedback-close-btn"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 rounded-lg border border-slate-200 transition-colors"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
