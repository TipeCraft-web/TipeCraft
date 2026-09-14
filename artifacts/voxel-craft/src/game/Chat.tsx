import { useState, useRef, useEffect, useCallback } from 'react';

interface Message { text: string; color: string; ts: number; }

interface Props {
  tpRef:       React.MutableRefObject<{ x: number; y: number; z: number } | null>;
  dayTimeRef:  React.MutableRefObject<number>;
  onSetMode?:  (m: 'CREATIVE' | 'SURVIVAL') => void;
  currentMode: 'CREATIVE' | 'SURVIVAL';
}

const HELP = [
  '/tp <x> <y> <z>  — Teleport',
  '/time day         — Tag setzen',
  '/time night       — Nacht setzen',
  '/gamemode c|s     — Modus wechseln',
  '/clear            — Chat leeren',
];

export default function Chat({ tpRef, dayTimeRef, onSetMode, currentMode }: Props) {
  const [open,     setOpen]     = useState(false);
  const [input,    setInput]    = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { text: 'Drücke T um den Chat zu öffnen. /help für Befehle.', color: '#aaa', ts: Date.now() },
  ]);
  const inputRef  = useRef<HTMLInputElement>(null);
  const listRef   = useRef<HTMLDivElement>(null);

  const addMsg = useCallback((text: string, color = '#fff') => {
    setMessages(prev => [...prev.slice(-19), { text, color, ts: Date.now() }]);
  }, []);

  const runCommand = useCallback((raw: string) => {
    const parts = raw.trim().split(/\s+/);
    const cmd   = parts[0].toLowerCase();
    if (cmd === '/tp') {
      const [x, y, z] = [parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])];
      if (isNaN(x) || isNaN(y) || isNaN(z)) { addMsg('Fehler: /tp <x> <y> <z>', '#ff6666'); return; }
      tpRef.current = { x, y, z };
      addMsg(`✓ Teleportiert zu ${x} ${y} ${z}`, '#5cb85c');
    } else if (cmd === '/time') {
      const t = parts[1]?.toLowerCase();
      if (t === 'day' || t === 'tag')         { dayTimeRef.current = 0.5; addMsg('☀ Tag!', '#ffe060'); }
      else if (t === 'night' || t === 'nacht') { dayTimeRef.current = 0.0; addMsg('🌙 Nacht!', '#8888ff'); }
      else addMsg('Fehler: /time day|night', '#ff6666');
    } else if (cmd === '/gamemode' || cmd === '/gm') {
      const m = parts[1]?.toLowerCase();
      if (m === 'c' || m === 'creative') { onSetMode?.('CREATIVE'); addMsg('✓ Creative Mode', '#5cb85c'); }
      else if (m === 's' || m === 'survival') { onSetMode?.('SURVIVAL'); addMsg('✓ Survival Mode', '#e0a020'); }
      else addMsg('Fehler: /gamemode c|s', '#ff6666');
    } else if (cmd === '/help') {
      HELP.forEach(h => addMsg(h, '#aaddff'));
    } else if (cmd === '/clear') {
      setMessages([]);
    } else {
      addMsg(`Unbekannter Befehl: ${cmd} — /help`, '#ff8888');
    }
  }, [tpRef, dayTimeRef, onSetMode, addMsg]);

  const submit = useCallback(() => {
    const txt = input.trim();
    if (!txt) { setOpen(false); setInput(''); return; }
    if (txt.startsWith('/')) {
      runCommand(txt);
    } else {
      addMsg(`> ${txt}`, '#e0e0e0');
    }
    setInput('');
    setOpen(false);
  }, [input, runCommand, addMsg]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      if ((e.key === 't' || e.key === 'T') && !isTyping) {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
        setInput('');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const now = Date.now();
  const visible = open ? messages : messages.filter(m => now - m.ts < 7000);

  return (
    <div data-no-look="1" style={{
      position: 'absolute', bottom: 76, left: 10, zIndex: 20,
      display: 'flex', flexDirection: 'column', gap: 4,
      pointerEvents: open ? 'auto' : 'none',
      fontFamily: '"Courier New", monospace',
      maxWidth: 420,
       filter: 'grayscale(1)',
    }}>
      {/* Message list */}
      <div ref={listRef} style={{
        display: 'flex', flexDirection: 'column', gap: 2,
        maxHeight: open ? 180 : 'auto',
        overflowY: open ? 'auto' : 'hidden',
        pointerEvents: 'none',
      }}>
        {visible.map((m, i) => {
          const age  = (now - m.ts) / 1000;
          const fade = !open && age > 5 ? Math.max(0, 1 - (age - 5) / 2) : 1;
          return (
            <div key={i} style={{
              background: 'rgba(0,0,0,0.55)', padding: '2px 8px', borderRadius: 3,
              fontSize: 12, color: m.color, opacity: fade,
              maxWidth: 400, wordBreak: 'break-word',
              pointerEvents: 'none',
              backdropFilter: 'blur(2px)',
            }}>
              {m.text}
            </div>
          );
        })}
      </div>

      {/* Input */}
      {open && (
        <div style={{ display: 'flex', gap: 4, pointerEvents: 'auto' }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              e.stopPropagation();
              if (e.key === 'Enter') submit();
              if (e.key === 'Escape') { setOpen(false); setInput(''); }
            }}
            placeholder="Befehl eingeben... (/help)"
            style={{
              flex: 1, background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(92,184,92,0.6)',
              color: '#fff', borderRadius: 4, padding: '6px 10px', fontSize: 12,
              fontFamily: '"Courier New", monospace', outline: 'none',
            }}
          />
          <div
            data-touch-btn="1"
            onTouchStart={e => { e.stopPropagation(); e.preventDefault(); submit(); }}
            onClick={submit}
            style={{
              padding: '6px 14px', borderRadius: 4, background: 'rgba(92,184,92,0.3)',
              border: '1px solid #5cb85c', color: '#5cb85c', fontSize: 12,
              cursor: 'pointer', fontFamily: '"Courier New", monospace',
            }}
          >↵</div>
        </div>
      )}
      {!open && (
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', pointerEvents: 'none', marginLeft: 4 }}>
          [T] Chat
        </div>
      )}
    </div>
  );
}
