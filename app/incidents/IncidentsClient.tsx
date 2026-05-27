'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { NavBar } from '@/components/NavBar';

interface Incident {
  _id: string;
  category: string;
  subCategory: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  priority: number;
  createdAt: string;
}

const statusColors = {
  'Open': 'bg-blue-100 text-blue-700',
  'In Progress': 'bg-yellow-100 text-yellow-700',
  'Resolved': 'bg-green-100 text-green-700',
};

export default function IncidentsClient({ username }: { username: string }) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/incidents')
      .then(r => r.json())
      .then(d => setIncidents(d.incidents || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div data-testid="incidents-page" className="flex flex-col min-h-screen">
      <NavBar username={username} />
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        <h1 data-testid="incidents-heading" className="text-2xl font-bold text-slate-800 mb-6">Your Incidents</h1>

        {loading ? (
          <p data-testid="incidents-loading" className="text-slate-500">Loading...</p>
        ) : incidents.length === 0 ? (
          <div data-testid="incidents-empty" className="text-center py-16 text-slate-500">
            <p className="text-lg">No incidents yet.</p>
            <Link href="/" data-testid="incidents-start-link" className="text-blue-600 hover:underline mt-2 inline-block">Start a conversation →</Link>
          </div>
        ) : (
          <ul data-testid="incidents-list" className="space-y-4">
            {incidents.map(inc => (
              <li key={inc._id} data-testid="incident-list-item">
                <Link
                  href={`/incidents/${inc._id}`}
                  data-testid={`incident-link-${inc._id}`}
                  className="block bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p data-testid="incident-category" className="font-semibold text-slate-800">{inc.category} / {inc.subCategory}</p>
                      <p data-testid="incident-date" className="text-slate-500 text-sm mt-1">{new Date(inc.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span data-testid="incident-priority" className="text-slate-500 text-sm">P{inc.priority}</span>
                      <span data-testid="incident-status" className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[inc.status]}`}>
                        {inc.status}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
