'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface NavBarProps {
  username: string;
}

export function NavBar({ username }: NavBarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <nav data-testid="navbar" className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
      <Link href="/" data-testid="nav-logo-link" className="flex items-center gap-2">
        <div data-testid="nav-logo" className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">P</div>
        <span data-testid="nav-brand" className="text-xl font-bold text-slate-800">Patch</span>
      </Link>
      <div className="flex items-center gap-6">
        <span data-testid="nav-welcome" className="text-slate-600">Welcome, <strong>{username}</strong></span>
        <Link href="/incidents" data-testid="nav-incidents-link" className="text-blue-600 hover:text-blue-800 font-medium transition-colors">
          Incidents
        </Link>
        <button
          data-testid="nav-logout-btn"
          onClick={handleLogout}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
