import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import IncidentDetailClient from './IncidentDetailClient';

export default async function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { id } = await params;
  return <IncidentDetailClient incidentId={id} username={session.username} />;
}
