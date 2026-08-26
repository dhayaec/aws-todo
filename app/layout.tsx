import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CloudTodo',
  description: 'A production-style Todo app on AWS',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
