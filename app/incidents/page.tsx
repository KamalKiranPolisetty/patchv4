import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import IncidentsClient from './IncidentsClient';

export default async function IncidentsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  return <IncidentsClient username={session.username} />;
}
