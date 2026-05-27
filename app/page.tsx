import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import HomeClient from './HomeClient';

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect('/login');

  return <HomeClient username={session.username} userId={session.userId} />;
}
