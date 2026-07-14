"use client";

import { useState } from 'react';
import Link from 'next/link';
import { commandLibraryData, CommandCategory } from '@/lib/data/command-library';

export default function CommandLibraryPage() {
  const [activeCategory, setActiveCategory] = useState<CommandCategory | 'All'>('All');

  const categories: (CommandCategory | 'All')[] = [
    'All',
    'System',
    'Availability',
    'PNR',
    'Fare/Pricing',
    'Ticketing',
    'Cancellation/Refund'
  ];

  const filteredCommands = activeCategory === 'All'
    ? commandLibraryData
    : commandLibraryData.filter(c => c.category === activeCategory);

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Command Library</h1>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              background: activeCategory === cat ? '#0f0' : '#333',
              color: activeCategory === cat ? '#000' : '#0f0',
              border: '1px solid #0f0',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              fontFamily: 'monospace'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
        {filteredCommands.map((entry) => (
          <div key={entry.id} style={{ border: '1px solid #333', padding: '1rem', background: '#0a0a0a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, color: '#0f0' }}>{entry.command}</h2>
              <span style={{ fontSize: '0.8rem', background: '#222', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                {entry.category}
              </span>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <strong>Syntax: </strong>
              <code style={{ background: '#222', padding: '0.2rem 0.4rem' }}>{entry.syntax}</code>
            </div>
            
            <p style={{ color: '#ccc', marginBottom: '1rem' }}>{entry.description}</p>
            
            <div style={{ marginBottom: '1rem', background: '#000', padding: '1rem', border: '1px solid #222' }}>
              <div style={{ color: '#888', marginBottom: '0.5rem' }}>Example:</div>
              <div style={{ color: '#fff', marginBottom: '0.5rem' }}>&gt; {entry.exampleInput}</div>
              <pre style={{ margin: 0, color: '#aaa', whiteSpace: 'pre-wrap' }}>{entry.expectedOutput}</pre>
            </div>

            <Link
              href={`/?cmd=${encodeURIComponent(entry.exampleInput)}`}
              style={{
                display: 'inline-block',
                background: '#0f0',
                color: '#000',
                padding: '0.5rem 1rem',
                textDecoration: 'none',
                fontWeight: 'bold',
                textAlign: 'center',
                width: '100%'
              }}
            >
              Try it
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}
