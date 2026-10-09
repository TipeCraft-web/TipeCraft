interface GameOptionsPanelProps {
  viewDistance: number;
  onViewDistanceChange: (value: number) => void;
  fogEnabled: boolean;
  onFogEnabledChange: (enabled: boolean) => void;
  onBack: () => void;
}

export default function GameOptionsPanel({
  viewDistance,
  onViewDistanceChange,
  fogEnabled,
  onFogEnabledChange,
  onBack,
}: GameOptionsPanelProps) {
  return (
    <div
      data-no-look="1"
      onClick={event => event.stopPropagation()}
      onTouchStart={event => event.stopPropagation()}
      style={{
        width:'min(430px, 92vw)', padding:22, boxSizing:'border-box',
        background:'rgba(30,30,30,0.94)', border:'2px solid #eee',
        boxShadow:'0 4px 0 rgba(0,0,0,0.7)', color:'#fff',
        maxHeight:'calc(100dvh - 36px)', overflowY:'auto',
        touchAction:'manipulation',
      }}
    >
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div style={{ fontSize:22, letterSpacing:2 }}>OPTIONS</div>
        <button
          type="button"
          aria-label="Optionen schließen"
          data-touch-btn="1"
          onClick={onBack}
          onTouchStart={event => { event.stopPropagation(); event.preventDefault(); onBack(); }}
          style={{ background:'transparent', border:0, color:'#fff', fontSize:22, cursor:'pointer' }}
        >✕</button>
      </div>
      <label style={{ display:'block', fontSize:14, marginBottom:10 }}>
        Sichtweite: <b>{viewDistance} Chunks</b>
      </label>
      <input
        aria-label="Sichtweite in Chunks"
        data-touch-btn="1"
        type="range"
        min={5}
        max={32}
        step={1}
        value={viewDistance}
        onChange={event => onViewDistanceChange(Number(event.target.value))}
        onTouchStart={event => event.stopPropagation()}
        style={{ width:'100%', accentColor:'#70d7ff', marginBottom:24, touchAction:'pan-y' }}
      />
      <label style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, fontSize:14, marginBottom:26 }}>
        <span>Nebel</span>
        <button
          type="button"
          role="switch"
          aria-checked={fogEnabled}
          data-touch-btn="1"
          onClick={() => onFogEnabledChange(!fogEnabled)}
          onTouchStart={event => { event.stopPropagation(); event.preventDefault(); onFogEnabledChange(!fogEnabled); }}
          style={{
            width:70, height:32, borderRadius:16,
            border:'2px solid #eee', cursor:'pointer',
            background:fogEnabled ? '#5f9fbd' : '#444',
            color:'#fff', fontFamily:'"Courier New", monospace',
          }}
        >{fogEnabled ? 'AN' : 'AUS'}</button>
      </label>
      <button
        type="button"
        data-touch-btn="1"
        onClick={onBack}
        onTouchStart={event => { event.stopPropagation(); event.preventDefault(); onBack(); }}
        style={{
          width:'100%', background:'#555', border:'2px solid #eee',
          color:'#fff', padding:'10px', fontSize:14, letterSpacing:1,
          fontFamily:'"Courier New", monospace', cursor:'pointer',
        }}
      >ZURÜCK</button>
    </div>
  );
}
