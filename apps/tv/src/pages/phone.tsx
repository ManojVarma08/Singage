import { useState, useRef } from 'react';
 
const TV_LIST = [
  { id: 'TV1',  name: 'TV 1',  location: 'Lobby',      icon: '🏢' },
  { id: 'TV2',  name: 'TV 2',  location: 'Hall A',     icon: '🏛' },
  { id: 'TV3',  name: 'TV 3',  location: 'Hall B',     icon: '🏛' },
  { id: 'TV4',  name: 'TV 4',  location: 'Cafeteria',  icon: '☕' },
  { id: 'TV5',  name: 'TV 5',  location: 'Board Room', icon: '💼' },
  { id: 'TV6',  name: 'TV 6',  location: 'Reception',  icon: '🛎' },
  { id: 'TV7',  name: 'TV 7',  location: 'Corridor 1', icon: '🚶' },
  { id: 'TV8',  name: 'TV 8',  location: 'Corridor 2', icon: '🚶' },
  { id: 'TV9',  name: 'TV 9',  location: 'Gym',        icon: '💪' },
  { id: 'TV10', name: 'TV 10', location: 'Rooftop',    icon: '🌆' },
];
 
const LAYOUTS = [
  { id: 'L1',  name: 'Full Screen', cells: 1, cols: '1fr',         rows: '1fr'         },
  { id: 'L2',  name: 'Split H',     cells: 2, cols: '1fr 1fr',     rows: '1fr'         },
  { id: 'L3',  name: 'Split V',     cells: 2, cols: '1fr',         rows: '1fr 1fr'     },
  { id: 'L4',  name: '2x2 Grid',    cells: 4, cols: '1fr 1fr',     rows: '1fr 1fr'     },
  { id: 'L5',  name: '3 Column',    cells: 3, cols: '1fr 1fr 1fr', rows: '1fr'         },
  { id: 'L6',  name: 'Big Left',    cells: 3, cols: '2fr 1fr',     rows: '1fr 1fr'     },
  { id: 'L7',  name: 'Big Right',   cells: 3, cols: '1fr 2fr',     rows: '1fr 1fr'     },
  { id: 'L8',  name: '4 Zones',     cells: 4, cols: '1fr 1fr',     rows: '1fr 1fr'     },
  { id: 'L9',  name: 'Banner + 2',  cells: 3, cols: '1fr 1fr',     rows: '2fr 1fr'     },
  { id: 'L10', name: 'Triple Row',  cells: 3, cols: '1fr 1fr 1fr', rows: '1fr'         },
  { id: 'L11', name: 'Pic-in-Pic',  cells: 2, cols: '1fr',         rows: '1fr'         },
  { id: 'L12', name: 'Mosaic',      cells: 5, cols: '2fr 1fr',     rows: '1fr 1fr 1fr' },
];
 
const ZONE_COLORS = ['#1e4fd8','#2d5be3','#3b6de8','#5585ee','#7ba3f5'];
 
// In-memory TV state (same server = syncs with TV page via global)
async function pushToTV(tvId: string, layoutId: string, cells: any[]) {
  await fetch('/api/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tvId, layoutId, cells }),
  });
}
 
async function uploadMedia(file: File): Promise<string> {
  // Direct upload using FileReader → base64 data URL (no S3 needed for local testing)
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.readAsDataURL(file);
  });
}
 
export default function PhonePage() {
  const [view, setView] = useState<'home' | 'scanner' | 'tv' | 'layout' | 'media'>('home');
  const [selectedTV, setSelectedTV] = useState<any>(null);
  const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(null);
  const [cells, setCells] = useState<any[]>([]);
  const [activeCell, setActiveCell] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [scanInput, setScanInput] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
 
  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };
 
  const handleScan = (code: string) => {
    const tv = TV_LIST.find(t => t.id === code.toUpperCase().trim());
    if (tv) {
      setSelectedTV(tv);
      setView('tv');
      setScanInput('');
    } else {
      notify(`"${code}" is not a valid TV ID`);
    }
  };
 
  const applyLayout = async (layoutId: string) => {
    const layout = LAYOUTS.find(l => l.id === layoutId)!;
    setSelectedLayoutId(layoutId);
    const emptyCells = Array.from({ length: layout.cells }, () => ({ mediaUrl: null, mediaType: null }));
    setCells(emptyCells);
    setActiveCell(0);
    await pushToTV(selectedTV.id, layoutId, emptyCells);
    notify(`Layout "${layout.name}" applied to ${selectedTV.name}`);
    setView('media');
  };
 
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const type = file.type.startsWith('video') ? 'video' : 'image';
    setUploading(true);
    try {
      const url = await uploadMedia(file);
      const newCells = cells.map((c, i) => i === activeCell ? { mediaUrl: url, mediaType: type } : c);
      setCells(newCells);
      await pushToTV(selectedTV.id, selectedLayoutId!, newCells);
      notify(`✅ Media live on ${selectedTV.name} — Zone ${activeCell + 1}`);
    } catch {
      notify('Upload failed');
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };
 
  const selectedLayout = LAYOUTS.find(l => l.id === selectedLayoutId);
 
  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', fontFamily: 'system-ui, sans-serif', maxWidth: 430, margin: '0 auto' }}>
 
      {/* Notification */}
      {notification && (
        <div style={{
          position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
          background: notification.startsWith('✅') ? '#dcfce7' : '#fee2e2',
          color: notification.startsWith('✅') ? '#16a34a' : '#dc2626',
          padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
          zIndex: 1000, whiteSpace: 'nowrap', boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          border: `1px solid ${notification.startsWith('✅') ? '#86efac' : '#fca5a5'}`,
        }}>
          {notification}
        </div>
      )}
 
      {/* ── HOME ── */}
      {view === 'home' && (
        <div>
          <div style={{ background: '#0a1628', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: '#fff', fontSize: 20, fontWeight: 900 }}>📺 Signage Ctrl</div>
              <div style={{ color: '#8bafc9', fontSize: 12, marginTop: 2 }}>Control {TV_LIST.length} displays</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(34,197,94,0.15)', borderRadius: 20, padding: '5px 12px', border: '1px solid rgba(34,197,94,0.3)' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
              <span style={{ color: '#22c55e', fontSize: 12, fontWeight: 700 }}>{TV_LIST.length} Live</span>
            </div>
          </div>
 
          <div style={{ padding: 16 }}>
            {/* Scan button */}
            <button onClick={() => setView('scanner')} style={{
              width: '100%', background: '#1e4fd8', borderRadius: 14, padding: '18px',
              display: 'flex', alignItems: 'center', gap: 14, border: 'none', cursor: 'pointer',
              marginBottom: 20, boxShadow: '0 4px 20px rgba(30,79,216,0.4)',
            }}>
              <span style={{ fontSize: 26 }}>📷</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ color: '#fff', fontSize: 16, fontWeight: 800 }}>Scan TV QR Code</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 }}>Point camera at TV screen</div>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 24, marginLeft: 'auto' }}>›</span>
            </button>
 
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ color: '#627d98', fontSize: 11, fontWeight: 700, letterSpacing: 1.5 }}>ALL DISPLAYS</span>
              <span style={{ color: '#627d98', fontSize: 11 }}>{TV_LIST.length} TVs</span>
            </div>
 
            {TV_LIST.map(tv => (
              <button key={tv.id} onClick={() => { setSelectedTV(tv); setView('tv'); }} style={{
                width: '100%', background: '#fff', borderRadius: 14, padding: 14,
                display: 'flex', alignItems: 'center', gap: 14, border: '1px solid #e2ecf9',
                cursor: 'pointer', marginBottom: 10, boxShadow: '0 2px 8px rgba(10,22,40,0.07)',
              }}>
                <div style={{ width: 68, height: 44, background: '#0d1e3a', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px solid #1e4fd8', flexShrink: 0 }}>
                  <span style={{ fontSize: 14 }}>{tv.icon}</span>
                  <span style={{ color: '#3b6de8', fontSize: 8, fontWeight: 700, marginTop: 2 }}>{tv.id}</span>
                </div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ color: '#0a1628', fontSize: 14, fontWeight: 800 }}>{tv.name}</div>
                  <div style={{ color: '#627d98', fontSize: 11, marginTop: 2 }}>📍 {tv.location}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 5, background: 'rgba(34,197,94,0.1)', borderRadius: 10, padding: '2px 8px', width: 'fit-content' }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e' }} />
                    <span style={{ color: '#22c55e', fontSize: 10, fontWeight: 700 }}>Live</span>
                  </div>
                </div>
                <span style={{ color: '#c9daf8', fontSize: 24 }}>›</span>
              </button>
            ))}
          </div>
        </div>
      )}
 
      {/* ── SCANNER ── */}
      {view === 'scanner' && (
        <div>
          <div style={{ background: '#0a1628', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setView('home')} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13 }}>← Back</button>
            <span style={{ color: '#fff', fontSize: 16, fontWeight: 800 }}>Scan TV QR Code</span>
          </div>
          <div style={{ padding: 16 }}>
            {/* Viewfinder */}
            <div style={{ background: '#0a1628', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ width: 200, height: 200, position: 'relative', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 16 }}>
                {/* Corners */}
                {[{top:0,left:0,borderTop:'3px solid #1e4fd8',borderLeft:'3px solid #1e4fd8'},{top:0,right:0,borderTop:'3px solid #1e4fd8',borderRight:'3px solid #1e4fd8'},{bottom:0,left:0,borderBottom:'3px solid #1e4fd8',borderLeft:'3px solid #1e4fd8'},{bottom:0,right:0,borderBottom:'3px solid #1e4fd8',borderRight:'3px solid #1e4fd8'}].map((cs, i) => (
                  <div key={i} style={{ position: 'absolute', width: 24, height: 24, ...cs } as any} />
                ))}
                <div style={{ position: 'absolute', left: 10, right: 10, height: 2, background: '#1e4fd8', top: '50%' }} />
              </div>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Point camera at TV QR code</span>
            </div>
 
            <div style={{ marginBottom: 20 }}>
              <div style={{ color: '#627d98', fontSize: 11, fontWeight: 700, letterSpacing: 1.5, marginBottom: 10 }}>ENTER TV ID</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={scanInput} onChange={e => setScanInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleScan(scanInput)}
                  placeholder="e.g. TV1, TV5..." style={{ flex: 1, padding: '10px 14px', background: '#fff', border: '1.5px solid #c9daf8', borderRadius: 10, fontSize: 14, outline: 'none', color: '#0a1628' }} />
                <button onClick={() => handleScan(scanInput)} style={{ padding: '10px 20px', background: '#1e4fd8', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700 }}>Go</button>
              </div>
            </div>
 
            <div style={{ color: '#627d98', fontSize: 11, fontWeight: 700, letterSpacing: 1.5, marginBottom: 10 }}>QUICK SELECT</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              {TV_LIST.map(tv => (
                <button key={tv.id} onClick={() => handleScan(tv.id)} style={{ background: 'rgba(30,79,216,0.1)', border: '1px solid rgba(30,79,216,0.3)', borderRadius: 10, padding: '10px 4px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <span style={{ fontSize: 14 }}>{tv.icon}</span>
                  <span style={{ color: '#1e4fd8', fontSize: 9, fontWeight: 700 }}>{tv.id}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
 
      {/* ── TV DETAIL ── */}
      {view === 'tv' && selectedTV && (
        <div>
          <div style={{ background: '#0a1628', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setView('home')} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13 }}>← Back</button>
            <span style={{ color: '#fff', fontSize: 16, fontWeight: 800 }}>{selectedTV.name}</span>
          </div>
          <div style={{ padding: 16 }}>
            <div style={{ background: '#0a1628', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ width: 88, height: 56, background: '#112240', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px solid #1e4fd8', marginBottom: 12 }}>
                <span style={{ fontSize: 24 }}>{selectedTV.icon}</span>
                <span style={{ color: '#3b6de8', fontSize: 10, fontWeight: 700, marginTop: 2 }}>{selectedTV.id}</span>
              </div>
              <div style={{ color: '#fff', fontSize: 20, fontWeight: 900 }}>{selectedTV.name}</div>
              <div style={{ color: '#8bafc9', fontSize: 13, marginTop: 4 }}>📍 {selectedTV.location}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, background: 'rgba(34,197,94,0.15)', borderRadius: 20, padding: '5px 14px' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
                <span style={{ color: '#22c55e', fontSize: 12, fontWeight: 700 }}>Live · Connected</span>
              </div>
            </div>
 
            {[
              { icon: '🗂', title: 'Change Layout', sub: 'Choose from 12 zone layouts', action: () => setView('layout'), bg: '#dbeafe' },
              { icon: '🖼', title: 'Push Media', sub: 'Upload image or video to TV', action: () => selectedLayoutId ? setView('media') : setView('layout'), bg: '#dcfce7' },
            ].map((item, i) => (
              <button key={i} onClick={item.action} style={{ width: '100%', background: '#fff', borderRadius: 14, padding: 16, display: 'flex', alignItems: 'center', gap: 14, border: '1px solid #e2ecf9', cursor: 'pointer', marginBottom: 10, boxShadow: '0 2px 8px rgba(10,22,40,0.06)' }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{item.icon}</div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ color: '#0a1628', fontSize: 14, fontWeight: 800 }}>{item.title}</div>
                  <div style={{ color: '#627d98', fontSize: 11, marginTop: 2 }}>{item.sub}</div>
                </div>
                <span style={{ color: '#c9daf8', fontSize: 24 }}>›</span>
              </button>
            ))}
          </div>
        </div>
      )}
 
      {/* ── LAYOUT ── */}
      {view === 'layout' && selectedTV && (
        <div>
          <div style={{ background: '#0a1628', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setView('tv')} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13 }}>← Back</button>
            <span style={{ color: '#fff', fontSize: 16, fontWeight: 800 }}>Select Layout</span>
          </div>
          <div style={{ padding: 16 }}>
            <div style={{ color: '#627d98', fontSize: 12, marginBottom: 16 }}>Choose how to divide {selectedTV.name} screen into zones</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, paddingBottom: 100 }}>
              {LAYOUTS.map(l => {
                const isSel = selectedLayoutId === l.id;
                return (
                  <button key={l.id} onClick={() => applyLayout(l.id)} style={{ background: isSel ? '#dbeafe' : '#fff', borderRadius: 12, padding: 8, border: `1.5px solid ${isSel ? '#1e4fd8' : '#e2ecf9'}`, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '100%', aspectRatio: '16/9', background: '#0d1e3a', borderRadius: 5, overflow: 'hidden', marginBottom: 6, display: 'flex', flexWrap: 'wrap', padding: 2, gap: 2 }}>
                      {Array.from({ length: l.cells }, (_, i) => (
                        <div key={i} style={{ flex: 1, minWidth: '28%', background: isSel ? ZONE_COLORS[i % ZONE_COLORS.length] : '#1e3a5f', borderRadius: 2 }} />
                      ))}
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 700, color: isSel ? '#1e4fd8' : '#0a1628' }}>{l.name}</span>
                    <span style={{ fontSize: 8, color: '#627d98' }}>{l.cells} zones</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
 
      {/* ── MEDIA ── */}
      {view === 'media' && selectedTV && selectedLayout && (
        <div>
          <div style={{ background: '#0a1628', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setView('tv')} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13 }}>← Back</button>
            <span style={{ color: '#fff', fontSize: 16, fontWeight: 800 }}>Push Media</span>
          </div>
          <div style={{ padding: 16 }}>
            {/* TV bar */}
            <div style={{ background: '#0a1628', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 22 }}>{selectedTV.icon}</span>
              <div>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>{selectedTV.name}</div>
                <div style={{ color: '#8bafc9', fontSize: 11 }}>{selectedLayout.name} · {cells.length} zones</div>
              </div>
            </div>
 
            {/* Zone selector */}
            <div style={{ color: '#627d98', fontSize: 11, fontWeight: 700, letterSpacing: 1.5, marginBottom: 10 }}>SELECT ZONE</div>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, marginBottom: 12 }}>
              {cells.map((cell, i) => (
                <button key={i} onClick={() => setActiveCell(i)} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', border: `1.5px solid ${activeCell === i ? '#1e4fd8' : '#c9daf8'}`, borderRadius: 12, padding: 6, background: activeCell === i ? '#dbeafe' : '#fff', cursor: 'pointer' }}>
                  {cell.mediaUrl ? (
                    cell.mediaType === 'image'
                      ? <img src={cell.mediaUrl} style={{ width: 70, height: 52, borderRadius: 7, objectFit: 'cover' }} alt="" />
                      : <div style={{ width: 70, height: 52, borderRadius: 7, background: '#0d1e3a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🎬</div>
                  ) : (
                    <div style={{ width: 70, height: 52, borderRadius: 7, background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#1e4fd8' }}>+</div>
                  )}
                  <span style={{ fontSize: 10, color: activeCell === i ? '#1e4fd8' : '#627d98', marginTop: 4, fontWeight: activeCell === i ? 800 : 600 }}>Zone {i + 1}</span>
                </button>
              ))}
            </div>
 
            {/* Active banner */}
            <div style={{ background: '#dbeafe', borderRadius: 10, padding: '10px 14px', marginBottom: 16, borderLeft: '3px solid #1e4fd8' }}>
              <span style={{ color: '#334e68', fontSize: 12 }}>Pushing to: <strong style={{ color: '#1e4fd8' }}>{selectedTV.name} — Zone {activeCell + 1}</strong></span>
            </div>
 
            {/* Upload */}
            {uploading ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 14, color: '#1e4fd8', fontWeight: 700 }}>Uploading...</div>
              </div>
            ) : (
              <>
                <div style={{ color: '#627d98', fontSize: 11, fontWeight: 700, letterSpacing: 1.5, marginBottom: 10 }}>PUSH MEDIA TO ZONE {activeCell + 1}</div>
                <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={handleFileUpload} />
 
                {[
                  { icon: '🖼', title: 'Upload Image', sub: 'JPG, PNG → TV instantly' },
                  { icon: '🎬', title: 'Upload Video', sub: 'MP4 → TV instantly' },
                ].map((item, i) => (
                  <button key={i} onClick={() => fileRef.current?.click()} style={{ width: '100%', background: '#fff', borderRadius: 14, padding: 16, display: 'flex', alignItems: 'center', gap: 14, border: '1px solid #e2ecf9', cursor: 'pointer', marginBottom: 10 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: i === 0 ? '#dbeafe' : '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{item.icon}</div>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ color: '#0a1628', fontSize: 14, fontWeight: 800 }}>{item.title}</div>
                      <div style={{ color: '#627d98', fontSize: 11, marginTop: 2 }}>{item.sub}</div>
                    </div>
                    <span style={{ color: '#c9daf8', fontSize: 24 }}>›</span>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}
 
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f0f4f8; }
        button { font-family: inherit; }
      `}</style>
    </div>
  );
}