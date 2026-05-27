import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Patch - IT Support Chatbot',
  description: 'Patch AI-powered IT support assistant',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
