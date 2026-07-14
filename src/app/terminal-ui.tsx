"use client";

import { useState, useRef, useEffect, FormEvent, KeyboardEvent } from 'react';
import { commandLibraryData } from '@/lib/data/command-library';

type LogEntry = {
  id: string;
  type: 'command' | 'response' | 'error';
  text: string;
  status?: 'pending' | 'success' | 'error';
};

export default function TerminalUI({ initialCommand = '' }: { initialCommand?: string }) {
  const [sessionId, setSessionId] = useState('');
  const [inputValue, setInputValue] = useState(initialCommand);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const endOfLogsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate a random session ID on mount
    setSessionId(Math.random().toString(36).substring(2, 10));
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    // Smooth scroll to bottom when logs change
    endOfLogsRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    // Autocomplete logic
    const val = inputValue.toUpperCase();
    if (val.length === 0) {
      setSuggestion(null);
      return;
    }
    const match = commandLibraryData.find(c => c.command.startsWith(val.split(/[\s0-9]/)[0])); // Simple prefix match on the command token
    if (match && val.length < match.exampleInput.length && match.exampleInput.startsWith(val)) {
      setSuggestion(match.exampleInput);
    } else {
      setSuggestion(null);
    }
  }, [inputValue]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const cmd = inputValue.trim().toUpperCase();
    
    // Add to history
    setCommandHistory(prev => [...prev, cmd]);
    setHistoryIndex(-1);
    
    // Optimistic UI update
    const cmdId = Date.now().toString();
    setLogs(prev => [...prev, { id: cmdId, type: 'command', text: `> ${cmd}` }]);
    
    // Don't clear input immediately so we can preserve it on error, but we'll clear it optimistically for fluid feel.
    // Actually, the requirement says "an invalid command should echo with the error shown below it, without clearing what was typed".
    // We'll store what was typed, clear it to feel fast, and if error, put it back.
    setInputValue('');
    setSuggestion(null);

    const pendingId = cmdId + '-pending';
    setLogs(prev => [...prev, { id: pendingId, type: 'response', text: '', status: 'pending' }]);

    try {
      const res = await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd, sessionId })
      });
      
      const data = await res.json();
      
      setLogs(prev => {
        const filtered = prev.filter(log => log.id !== pendingId);
        let status: 'success' | 'error' | undefined;
        
        if (data.ok) {
          if (data.output.includes('PNR CREATED') || data.output.includes('E-TICKET') || data.output.includes('REFUNDED') || data.output.includes('CANCELLED')) {
            status = 'success';
          }
        } else {
          status = 'error';
        }
        
        return [...filtered, { 
          id: cmdId + '-res', 
          type: data.ok ? 'response' : 'error', 
          text: data.output, 
          status 
        }];
      });

      if (!data.ok) {
        // Put the invalid command back into the input so the user can edit it
        setInputValue(cmd);
      }
      
    } catch (err) {
      setLogs(prev => {
        const filtered = prev.filter(log => log.id !== pendingId);
        return [...filtered, { id: cmdId + '-err', type: 'error', text: 'NETWORK ERROR', status: 'error' }];
      });
      setInputValue(cmd);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setInputValue(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInputValue(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInputValue('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (suggestion) {
        setInputValue(suggestion);
      }
    }
  };

  return (
    <div 
      style={{ 
        height: 'calc(100vh - 60px)', 
        display: 'flex', 
        flexDirection: 'column',
        background: '#0a0a0a',
        color: '#0f0',
        fontFamily: 'monospace',
        padding: '1rem',
        overflow: 'hidden'
      }}
      onClick={() => inputRef.current?.focus()}
    >
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes flashSuccess {
          0% { background-color: #0f0; color: #000; }
          100% { background-color: transparent; color: #0f0; }
        }
        @keyframes flashError {
          0% { background-color: #f00; color: #fff; }
          100% { background-color: transparent; color: #f00; }
        }
        .anim-success { animation: flashSuccess 0.5s ease-out; }
        .anim-error { animation: flashError 0.5s ease-out; color: #f00; }
      `}} />

      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem', paddingRight: '1rem' }}>
        <div style={{ marginBottom: '1rem', color: '#888' }}>
          Amadeus GDS Command Simulator Ready. Type HELP for commands.
        </div>
        
        {logs.map(log => {
          if (log.status === 'pending') {
            return <div key={log.id} style={{ color: '#888' }}>...</div>;
          }
          
          let className = '';
          if (log.status === 'success') className = 'anim-success';
          if (log.type === 'error' || log.status === 'error') className = 'anim-error';
          
          return (
            <div key={log.id} style={{ marginBottom: '0.5rem', whiteSpace: 'pre-wrap' }} className={className}>
              {log.text}
            </div>
          );
        })}
        <div ref={endOfLogsRef} />
      </div>

      <form onSubmit={handleSubmit} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <span style={{ marginRight: '0.5rem' }}>&gt;</span>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#0f0',
              fontFamily: 'monospace',
              fontSize: '1rem',
              textTransform: 'uppercase',
              position: 'relative',
              zIndex: 2
            }}
            data-testid="terminal-input"
            autoComplete="off"
            spellCheck="false"
          />
          {suggestion && suggestion.startsWith(inputValue) && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              color: '#444',
              zIndex: 1,
              pointerEvents: 'none',
              fontFamily: 'monospace',
              fontSize: '1rem',
            }}>
              <span style={{ visibility: 'hidden' }}>{inputValue}</span>
              <span>{suggestion.slice(inputValue.length)}</span>
              <span style={{ marginLeft: '1rem', fontSize: '0.8rem', color: '#666' }}>[Tab to autocomplete]</span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
