import Link from 'next/link';
import './globals.css';

export const metadata = {
  title: 'Amadeus Simulator',
  description: 'GDS Command Simulator',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: '#111', color: '#0f0', fontFamily: 'monospace', margin: 0 }}>
        <nav style={{ padding: '1rem', borderBottom: '1px solid #333', display: 'flex', gap: '1rem' }}>
          <Link href="/" style={{ color: '#0f0', textDecoration: 'none' }}>[Terminal]</Link>
          <Link href="/library" style={{ color: '#0f0', textDecoration: 'none' }}>[Command Library]</Link>
        </nav>
        {children}
      </body>
    </html>
  )
}
