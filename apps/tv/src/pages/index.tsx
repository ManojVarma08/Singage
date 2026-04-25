import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wkilfvbytdazmnohksiu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndraWxmdmJ5dGRhem1ub2hrc2l1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNDI1NTgsImV4cCI6MjA5MjYxODU1OH0.3pZ6vHJXFmniWtMQo5KHZkovEwkuC4shaDw6FZOJtVE';
const BUCKET = 'signage-media';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TV_PINS: Record<string, string> = {
  TV1: '1111', TV2: '2222', TV3: '3333', TV4: '4444', TV5: '5555',
  TV6: '6666', TV7: '7777', TV8: '8888', TV9: '9999', TV10: '1010',
};

const TV_LIST = [
  { id: 'TV1', name: 'TV 1', location: 'Lobby' },
  { id: 'TV2', name: 'TV 2', location: 'Hall A' },
  { id: 'TV3', name: 'TV 3', location: 'Hall B' },
  { id: 'TV4', name: 'TV 4', location: 'Cafeteria' },
  { id: 'TV5', name: 'TV 5', location: 'Board Room' },
  { id: 'TV6', name: 'TV 6', location: 'Reception' },
  { id: 'TV7', name: 'TV 7', location: 'Corridor 1' },
  { id: 'TV8', name: 'TV 8', location: 'Corridor 2' },
  { id: 'TV9', name: 'TV 9', location: 'Gym' },
  { id: 'TV10', name: 'TV 10', location: 'Rooftop' },
];

const LAYOUTS = [
  { id: 'L1', name: 'Full Screen', cells: 1, cols: '1fr', rows: '1fr', pip: false },
  { id: 'L2', name: 'Split H', cells: 2, cols: '1fr 1fr', rows: '1fr', pip: false },
  { id: 'L3', name: 'Split V', cells: 2, cols: '1fr', rows: '1fr 1fr', pip: false },
  { id: 'L4', name: '2x2 Grid', cells: 4, cols: '1fr 1fr', rows: '1fr 1fr', pip: false },
  { id: 'L5', name: '3 Column', cells: 3, cols: '1fr 1fr 1fr', rows: '1fr', pip: false },
  { id: 'L6', name: 'Big Left', cells: 3, cols: '2fr 1fr', rows: '1fr 1fr', pip: false },
  { id: 'L7', name: 'Big Right', cells: 3, cols: '1fr 2fr', rows: '1fr 1fr', pip: false },
  { id: 'L8', name: '4 Zones', cells: 4, cols: '1fr 1fr', rows: '1fr 1fr', pip: false },
  { id: 'L9', name: 'Banner + 2', cells: 3, cols: '1fr 1fr', rows: '2fr 1fr', pip: false },
  { id: 'L10', name: 'Triple Row', cells: 3, cols: '1fr 1fr 1fr', rows: '1fr', pip: false },
  { id: 'L11', name: 'Picture in Picture', cells: 2, cols: '1fr', rows: '1fr', pip: true },
  { id: 'L12', name: 'Mosaic', cells: 5, cols: '2fr 1fr', rows: '1fr 1fr 1fr', pip: false },
];

const CELL_SPANS: any = {
  L6: { 0: { gridRow: '1 / 3' } },
  L7: { 2: { gridRow: '1 / 3', gridColumn: '2' } },
  L9: { 0: { gridColumn: '1 / 3' } },
  L12: { 0: { gridRow: '1 / 3' } },
};

const ZONE_COLORS = ['#2563eb', '#38bdf8', '#22c55e', '#a78bfa', '#f59e0b'];

// ── Supabase REST helpers ─────────────────────────────────────
const sbHeaders = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

async function getTVState(userId: string, tvId: string) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/tv_states?user_id=eq.${userId}&tv_id=eq.${tvId}&select=*`,
    { headers: sbHeaders }
  );
  const data = await res.json();
  return data?.[0] || null;
}

async function saveTVState(userId: string, tvId: string, layoutId: string, cells: any[]) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/tv_states?on_conflict=user_id,tv_id`, {
    method: 'POST',
    headers: {
      ...sbHeaders,
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      user_id: userId,
      tv_id: tvId,
      layout_id: layoutId,
      cells,
      updated_at: Date.now(),
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Save TV state failed: ${errText}`);
  }
}

async function uploadToSupabase(file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'bin';
  const cleanExt = ext.toLowerCase().replace(/[^a-z0-9]/g, '');
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${cleanExt}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || 'application/octet-stream',
    });

  if (error) {
    throw new Error(error.message || 'Upload failed');
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}

// ── TV Icon ───────────────────────────────────────────────────
function TVIcon({ active = false, live = false, size = 'sm' }: { active?: boolean; live?: boolean; size?: 'sm' | 'md' | 'lg' }) {
  const dimensions = size === 'lg' ? { w: 92, h: 58, standW: 34 } : size === 'md' ? { w: 64, h: 42, standW: 26 } : { w: 44, h: 30, standW: 20 };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
      <div style={{ width: dimensions.w, height: dimensions.h, borderRadius: size === 'lg' ? 12 : 8, background: active ? 'linear-gradient(135deg, #2563eb, #38bdf8)' : 'linear-gradient(135deg, #e5eefb, #f8fafc)', border: active ? '2px solid #1d4ed8' : '1px solid #cbd5e1', boxShadow: active ? '0 10px 24px rgba(37,99,235,0.25)' : '0 4px 12px rgba(15,23,42,0.08)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 5, borderRadius: size === 'lg' ? 8 : 5, background: active ? 'linear-gradient(135deg, rgba(255,255,255,0.35), rgba(255,255,255,0.08))' : '#ffffff' }} />
        {live && <div style={{ position: 'absolute', top: 5, right: 5, width: 7, height: 7, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 0 3px rgba(34,197,94,0.18)' }} />}
      </div>
      <div style={{ width: dimensions.standW, height: 4, borderRadius: 999, background: active ? '#1d4ed8' : '#94a3b8', opacity: 0.8 }} />
    </div>
  );
}

// ── Auth Screen: Sign Up + Login ──────────────────────────────
function AuthScreen({ onAuthSuccess }: { onAuthSuccess: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleAuth = async () => {
    setMsg('');

    if (!email || !password) {
      setMsg('Email and password required');
      return;
    }

    if (password.length < 6) {
      setMsg('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
          setMsg(error.message);
          return;
        }
        setMsg('Account created. Confirmation email sent. Please check your inbox, confirm your email, then login.');
        setMode('login');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setMsg(error.message);
          return;
        }
        onAuthSuccess();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100vw', minHeight: '100vh', background: 'linear-gradient(135deg, #f8fbff, #eef5ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 430, background: '#ffffff', border: '1px solid #dbeafe', borderRadius: 28, padding: 30, boxShadow: '0 24px 70px rgba(15,23,42,0.12)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
          <TVIcon size="lg" active live />
        </div>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ color: '#0f172a', fontSize: 28, fontWeight: 900 }}>{mode === 'login' ? 'Login' : 'Create Account'}</div>
          <div style={{ color: '#64748b', fontSize: 14, marginTop: 6 }}>
            {mode === 'login' ? 'Login to control your signage TVs' : 'Sign up first, then login'}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '14px 16px', borderRadius: 14, border: '1.5px solid #dbeafe', fontSize: 15, outline: 'none' }} />
          <input type="password" placeholder="Password minimum 6 characters" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: '14px 16px', borderRadius: 14, border: '1.5px solid #dbeafe', fontSize: 15, outline: 'none' }} />

          {msg && (
            <div style={{ background: (msg.includes('created') || msg.includes('Confirmation email sent')) ? '#ecfdf5' : '#fef2f2', color: (msg.includes('created') || msg.includes('Confirmation email sent')) ? '#16a34a' : '#dc2626', border: `1px solid ${(msg.includes('created') || msg.includes('Confirmation email sent')) ? '#bbf7d0' : '#fecaca'}`, borderRadius: 12, padding: '10px 12px', fontSize: 13, fontWeight: 800 }}>
              {msg}
            </div>
          )}

          <button onClick={handleAuth} disabled={loading} style={{ width: '100%', padding: 16, borderRadius: 16, border: 'none', background: 'linear-gradient(135deg, #2563eb, #38bdf8)', color: '#ffffff', fontSize: 16, fontWeight: 900, cursor: 'pointer', marginTop: 4 }}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Sign Up'}
          </button>

          <button onClick={() => { setMsg(''); setMode(mode === 'login' ? 'signup' : 'login'); }} style={{ width: '100%', padding: 13, borderRadius: 16, border: '1px solid #dbeafe', background: '#ffffff', color: '#2563eb', fontSize: 14, fontWeight: 900, cursor: 'pointer' }}>
            {mode === 'login' ? 'New user? Create account' : 'Already have account? Login'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Role Selection Screen ─────────────────────────────────────
function RoleSelectScreen({ onSelect }: { onSelect: (role: 'tv' | 'controller') => void }) {
  return (
    <div style={{ width: '100vw', minHeight: '100vh', background: 'linear-gradient(135deg, #f8fbff, #eef5ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 430, background: '#ffffff', border: '1px solid #dbeafe', borderRadius: 28, padding: 30, boxShadow: '0 24px 70px rgba(15,23,42,0.12)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
          <TVIcon size="lg" active live />
        </div>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 30, fontWeight: 900, color: '#0f172a' }}>Signage Control</div>
          <div style={{ color: '#64748b', marginTop: 8 }}>Choose how you want to use this device</div>
        </div>

        <button onClick={() => onSelect('tv')} style={{ width: '100%', padding: 20, borderRadius: 18, border: 'none', background: 'linear-gradient(135deg, #2563eb, #38bdf8)', color: '#ffffff', fontSize: 18, fontWeight: 900, cursor: 'pointer', marginBottom: 14 }}>
          📺 TV User
        </button>

        <button onClick={() => onSelect('controller')} style={{ width: '100%', padding: 20, borderRadius: 18, border: '1px solid #dbeafe', background: '#ffffff', color: '#0f172a', fontSize: 18, fontWeight: 900, cursor: 'pointer' }}>
          📱 Controller
        </button>
      </div>
    </div>
  );
}

// ── PIN Screen ────────────────────────────────────────────────
function PINScreen({ onLogin, title, subtitle }: { onLogin: (tvId: string) => void; title: string; subtitle: string }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const handleKey = (k: string) => {
    if (pin.length >= 4) return;
    const newPin = pin + k;
    setPin(newPin);
    setError('');
    if (newPin.length === 4) setTimeout(() => checkPin(newPin), 200);
  };

  const checkPin = (p: string) => {
    const tv = TV_LIST.find(t => TV_PINS[t.id] === p);
    if (tv) {
      onLogin(tv.id);
    } else {
      setShake(true);
      setError('Wrong PIN. Please try again.');
      setTimeout(() => { setPin(''); setShake(false); setError(''); }, 1200);
    }
  };

  return (
    <div style={{ width: '100vw', minHeight: '100vh', background: 'linear-gradient(135deg, #f8fbff 0%, #eef5ff 50%, #ffffff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 430, background: 'rgba(255,255,255,0.92)', border: '1px solid #dbeafe', borderRadius: 28, boxShadow: '0 24px 70px rgba(15,23,42,0.12)', padding: 30 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}><TVIcon size="lg" active /></div>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ color: '#0f172a', fontSize: 28, fontWeight: 900, letterSpacing: -0.5 }}>{title}</div>
          <div style={{ color: '#64748b', fontSize: 14, marginTop: 6 }}>{subtitle}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginBottom: 12, animation: shake ? 'shake 0.4s ease' : 'none' }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ width: 16, height: 16, borderRadius: '50%', background: i < pin.length ? '#2563eb' : '#e2e8f0', border: `2px solid ${i < pin.length ? '#2563eb' : '#cbd5e1'}`, transition: 'all 0.15s ease' }} />
          ))}
        </div>
        <div style={{ height: 24, textAlign: 'center', marginBottom: 14 }}>
          {error && <span style={{ color: '#ef4444', fontSize: 13, fontWeight: 700 }}>{error}</span>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {['1','2','3','4','5','6','7','8','9'].map(k => <button key={k} onClick={() => handleKey(k)} className="key-btn">{k}</button>)}
          <div />
          <button onClick={() => handleKey('0')} className="key-btn">0</button>
          <button onClick={() => setPin(p => p.slice(0,-1))} className="key-btn muted">⌫</button>
        </div>
        <div style={{ marginTop: 24, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 18, padding: 16 }}>
          <div style={{ color: '#64748b', fontSize: 11, fontWeight: 900, letterSpacing: 1.4, marginBottom: 12 }}>TV PIN DIRECTORY</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
            {TV_LIST.map(tv => (
              <div key={tv.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '8px 4px', textAlign: 'center' }}>
                <TVIcon />
                <div style={{ color: '#334155', fontSize: 10, fontWeight: 800, marginTop: 4 }}>{tv.id}</div>
                <div style={{ color: '#2563eb', fontSize: 11, fontWeight: 900 }}>{TV_PINS[tv.id]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        .key-btn { height: 66px; border-radius: 18px; background: #ffffff; border: 1px solid #dbeafe; color: #0f172a; font-size: 24px; font-weight: 800; cursor: pointer; box-shadow: 0 6px 14px rgba(15,23,42,0.06); transition: all 0.12s ease; font-family: inherit; }
        .key-btn:hover { transform: translateY(-1px); border-color: #93c5fd; }
        .key-btn:active { transform: scale(0.97); background: #eff6ff; }
        .key-btn.muted { color: #64748b; background: #f8fafc; }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-10px)} 40%{transform:translateX(10px)} 60%{transform:translateX(-8px)} 80%{transform:translateX(8px)} }
      `}</style>
    </div>
  );
}

// ── TV Screen ─────────────────────────────────────────────────
function TVScreen({ tvId, tvState }: { tvId: string; tvState: any }) {
  const layout = LAYOUTS.find(l => l.id === tvState?.layout_id);
  const hasMedia = tvState?.cells?.some((c: any) => c?.mediaUrl);

  if (!hasMedia || !layout) {
    return (
      <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #f8fbff 0%, #eef5ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 30 }}>
        <div style={{ width: '100%', maxWidth: 520, background: '#ffffff', border: '1px solid #dbeafe', borderRadius: 28, padding: 42, textAlign: 'center', boxShadow: '0 24px 70px rgba(15,23,42,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 22 }}><TVIcon size="lg" /></div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>{tvId} is waiting</div>
          <div style={{ color: '#64748b', fontSize: 15 }}>Open Controller with the same account and same TV PIN, then upload media to display it here.</div>
          <div style={{ marginTop: 24, display: 'inline-flex', alignItems: 'center', gap: 8, background: '#ecfdf5', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 999, padding: '8px 14px', fontSize: 13, fontWeight: 800 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', animation: 'blink 1.2s ease infinite', display: 'inline-block' }} />
            Ready
          </div>
        </div>
      </div>
    );
  }

  const spans = CELL_SPANS[tvState.layout_id] || {};
  return (
    <div style={{ width: '100%', height: '100%', display: 'grid', gridTemplateColumns: layout.cols, gridTemplateRows: layout.rows, gap: 4, background: '#0f172a', position: 'relative', padding: 4 }}>
      {tvState.cells.map((cell: any, i: number) => {
        if (layout.pip && i === 1) return null;
        return (
          <div key={i} style={{ overflow: 'hidden', background: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, ...(spans[i] || {}) }}>
            {cell?.mediaUrl ? (
              cell.mediaType === 'video' ? (
                <video src={cell.mediaUrl} autoPlay loop playsInline controls style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000000' }} />
              ) : (
                <img src={cell.mediaUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000000' }} />
              )
            ) : (
              <span style={{ color: '#94a3b8', fontSize: 14, fontWeight: 700 }}>Zone {i + 1}</span>
            )}
          </div>
        );
      })}
      {layout.pip && tvState.cells[1]?.mediaUrl && (
        <div style={{ position: 'absolute', bottom: 20, right: 20, width: '28%', height: '28%', border: '3px solid #2563eb', borderRadius: 14, overflow: 'hidden', zIndex: 10, boxShadow: '0 18px 40px rgba(0,0,0,0.3)', background: '#000000' }}>
          {tvState.cells[1].mediaType === 'video' ? (
            <video src={tvState.cells[1].mediaUrl} autoPlay loop playsInline controls style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000000' }} />
          ) : (
            <img src={tvState.cells[1].mediaUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000000' }} />
          )}
        </div>
      )}
      <div style={{ position: 'absolute', bottom: 18, left: 18, background: 'rgba(255,255,255,0.92)', borderRadius: 999, padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 8, zIndex: 20, boxShadow: '0 10px 30px rgba(0,0,0,0.18)' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
        <span style={{ color: '#0f172a', fontSize: 12, fontWeight: 900 }}>{tvId}</span>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────
export default function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [appRole, setAppRole] = useState<'choose' | 'tv' | 'controller'>('choose');
  const [loggedInTVId, setLoggedInTVId] = useState<string | null>(null);
  const [sideTab, setSideTab] = useState<'tv' | 'phone'>('tv');
  const [activeTVId, setActiveTVId] = useState('TV1');
  const [tvStates, setTvStates] = useState<Record<string, any>>({});
  const [phoneView, setPhoneView] = useState<'home' | 'layout' | 'media' | 'switchTv' | 'tvs'>('home');
  const [connectedTV, setConnectedTV] = useState<any>(null);
  const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(null);
  const [cells, setCells] = useState<any[]>([]);
  const [activeCell, setActiveCell] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [notif, setNotif] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsAuthed(!!data.session);
      setAuthUserId(data.session?.user?.id || null);
      setAuthChecked(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(!!session);
      setAuthUserId(session?.user?.id || null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const savedRole = localStorage.getItem('signage_app_role') as 'tv' | 'controller' | null;
    const savedTV = localStorage.getItem('signage_tv_id');

    if (savedRole) setAppRole(savedRole);

    if (savedTV && TV_LIST.find(t => t.id === savedTV)) {
      setLoggedInTVId(savedTV);
      setActiveTVId(savedTV);
      setConnectedTV(TV_LIST.find(t => t.id === savedTV));
      if (savedRole === 'controller') setSideTab('phone');
      if (savedRole === 'tv') setSideTab('tv');
    }
  }, []);

  useEffect(() => {
    if (!loggedInTVId || !authUserId) return;

    const poll = async () => {
      try {
        const data = await getTVState(authUserId, activeTVId);

        if (data) {
          setTvStates(p => ({ ...p, [activeTVId]: data }));

          if (appRole === 'controller' && loggedInTVId === activeTVId) {
            setSelectedLayoutId(data.layout_id || null);
            setCells(data.cells || []);
          }
        } else {
          setTvStates(p => ({ ...p, [activeTVId]: null }));

          if (appRole === 'controller' && loggedInTVId === activeTVId) {
            setSelectedLayoutId(null);
            setCells([]);
          }
        }
      } catch {}
    };

    poll();
    const t = setInterval(poll, 2000);
    return () => clearInterval(t);
  }, [activeTVId, loggedInTVId, authUserId, appRole]);

  const selectRole = (role: 'tv' | 'controller') => {
    setAppRole(role);
    localStorage.setItem('signage_app_role', role);
    if (role === 'tv') setSideTab('tv');
    if (role === 'controller') setSideTab('phone');
  };

  const handleTVLogin = (tvId: string) => {
    const tv = TV_LIST.find(t => t.id === tvId)!;
    setLoggedInTVId(tvId);
    setActiveTVId(tvId);
    setConnectedTV(tv);
    setSideTab('tv');
    localStorage.setItem('signage_tv_id', tvId);
    localStorage.setItem('signage_app_role', 'tv');
  };

  const handleControllerLogin = async (tvId: string) => {
    const tv = TV_LIST.find(t => t.id === tvId)!;

    setLoggedInTVId(tvId);
    setActiveTVId(tvId);
    setConnectedTV(tv);
    setSideTab('phone');
    setPhoneView('home');
    setActiveCell(0);

    localStorage.setItem('signage_tv_id', tvId);
    localStorage.setItem('signage_app_role', 'controller');

    if (authUserId) {
      try {
        const savedState = await getTVState(authUserId, tvId);

        if (savedState) {
          setTvStates(p => ({ ...p, [tvId]: savedState }));
          setSelectedLayoutId(savedState.layout_id || null);
          setCells(savedState.cells || []);
        } else {
          setSelectedLayoutId(null);
          setCells([]);
        }
      } catch {
        setSelectedLayoutId(null);
        setCells([]);
      }
    }
  };

  const handleLogout = () => {
    supabase.auth.signOut();
    setIsAuthed(false);
    setAuthUserId(null);
    setLoggedInTVId(null);
    setAppRole('choose');
    localStorage.removeItem('signage_tv_id');
    localStorage.removeItem('signage_app_role');
    setPhoneView('home');
    setConnectedTV(null);
    setSelectedLayoutId(null);
    setCells([]);
  };

  const toast = (msg: string) => { setNotif(msg); setTimeout(() => setNotif(null), 3000); };

  const updateTV = async (tvId: string, layoutId: string, newCells: any[]) => {
    if (!authUserId) {
      toast('Please login again');
      return;
    }

    setTvStates(p => ({
      ...p,
      [tvId]: {
        user_id: authUserId,
        tv_id: tvId,
        layout_id: layoutId,
        cells: newCells,
      },
    }));

    await saveTVState(authUserId, tvId, layoutId, newCells);
  };

  const applyLayout = async (layoutId: string) => {
    const layout = LAYOUTS.find(l => l.id === layoutId)!;
    const targetTV = connectedTV || TV_LIST.find(t => t.id === loggedInTVId);
    if (!targetTV) return;

    setSelectedLayoutId(layoutId);
    const empty = Array.from({ length: layout.cells }, () => ({ mediaUrl: null, mediaType: null }));
    setCells(empty);
    setActiveCell(0);
    await updateTV(targetTV.id, layoutId, empty);
    toast(`Layout "${layout.name}" applied`);
    setPhoneView('media');
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !connectedTV || !selectedLayoutId) return;

    const type = file.type.startsWith('video') ? 'video' : 'image';
    setUploading(true);

    try {
      setUploadStatus(type === 'video' ? 'Uploading video. Large videos can take a few minutes...' : 'Uploading image...');
      const publicUrl = await uploadToSupabase(file);

      setUploadStatus('Publishing to TV...');
      const nextCells = cells.map((c, i) => i === activeCell ? { mediaUrl: publicUrl, mediaType: type } : c);
      setCells(nextCells);
      await updateTV(connectedTV.id, selectedLayoutId, nextCells);
      setActiveTVId(connectedTV.id);
      toast(`Live on ${connectedTV.name} — Zone ${activeCell + 1}`);
    } catch (err) {
      toast('Upload failed. Please try again.');
      console.error(err);
    } finally {
      setUploading(false);
      setUploadStatus('');
      if (e.target) e.target.value = '';
    }
  };

  if (!authChecked) {
    return <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 900, color: '#2563eb' }}>Loading...</div>;
  }

  if (!isAuthed) {
    return <AuthScreen onAuthSuccess={() => setIsAuthed(true)} />;
  }

  if (appRole === 'choose') {
    return <RoleSelectScreen onSelect={selectRole} />;
  }

  if (appRole === 'tv' && !loggedInTVId) {
    return <PINScreen onLogin={handleTVLogin} title="TV User Login" subtitle="Enter TV PIN to open this TV screen" />;
  }

  if (appRole === 'controller' && !loggedInTVId) {
    return <PINScreen onLogin={handleControllerLogin} title="Controller Login" subtitle="Enter same TV PIN to control that TV" />;
  }

  const selectedLayout = LAYOUTS.find(l => l.id === selectedLayoutId);
  const activeTVInfo = TV_LIST.find(t => t.id === activeTVId)!;
  const loggedInTV = TV_LIST.find(t => t.id === loggedInTVId)!;

  if (appRole === 'tv') {
    return (
      <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#000000', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <TVScreen tvId={activeTVId} tvState={tvStates[activeTVId]} />
        <button
          onClick={handleLogout}
          style={{
            position: 'fixed',
            top: 14,
            right: 14,
            zIndex: 999,
            background: 'rgba(255,255,255,0.9)',
            border: '1px solid #e2e8f0',
            borderRadius: 999,
            padding: '8px 14px',
            color: '#ef4444',
            fontSize: 12,
            fontWeight: 900,
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          }}
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="app-shell" style={{ display: 'flex', height: '100vh', width: '100vw', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden', background: '#f8fbff', color: '#0f172a' }}>
      <aside className="app-sidebar" style={{ width: 108, background: '#ffffff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '18px 10px', flexShrink: 0, overflowY: 'auto', boxShadow: '6px 0 24px rgba(15,23,42,0.04)' }}>
        <div style={{ marginBottom: 20 }}><TVIcon size="md" active /></div>

        <button onClick={() => { setSideTab('tv'); }} className={`nav-btn ${sideTab === 'tv' ? 'active' : ''}`}>
          <span className="nav-icon">▣</span><span>Preview</span>
        </button>

        {appRole === 'controller' && (
          <>
            <button onClick={() => { setSideTab('phone'); setPhoneView('home'); }} className={`nav-btn ${sideTab === 'phone' && phoneView !== 'tvs' ? 'active' : ''}`}>
              <span className="nav-icon">▤</span><span>Control</span>
            </button>
            <button onClick={() => { setSideTab('phone'); setPhoneView('tvs'); }} className={`nav-btn ${sideTab === 'phone' && phoneView === 'tvs' ? 'active' : ''}`}>
              <span className="nav-icon">▦</span><span>TVs</span>
            </button>
          </>
        )}

        <div style={{ width: 54, height: 1, background: '#e2e8f0', margin: '16px 0' }} />

        {appRole === 'controller' && TV_LIST.map(tv => {
          const active = activeTVId === tv.id && sideTab === 'tv';
          const live = tvStates[tv.id]?.cells?.some((c: any) => c?.mediaUrl);
          return (
            <button key={tv.id} onClick={() => { setActiveTVId(tv.id); setSideTab('tv'); }} title={tv.name} className={`tv-side-btn ${active ? 'active' : ''}`}>
              <TVIcon active={active} live={live} /><span>{tv.id}</span>
            </button>
          );
        })}

        <div style={{ marginTop: 'auto', paddingTop: 16 }}>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </aside>

      <main className="app-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header className="app-header" style={{ height: 74, background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(14px)', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
          <TVIcon size="sm" active={sideTab === 'tv'} live={sideTab === 'tv'} />
          <div>
            <div style={{ color: '#0f172a', fontWeight: 900, fontSize: 16 }}>{sideTab === 'tv' ? activeTVInfo?.name : 'Phone Control'}</div>
            <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{sideTab === 'tv' ? `${activeTVInfo?.location} display` : `Connected to ${loggedInTV.name}`}</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="top-pill blue"><span>{loggedInTV.name}</span><strong>PIN {TV_PINS[loggedInTVId]}</strong></div>
            <div className="top-pill green"><span className="dot" /><strong>Controller</strong></div>
          </div>
        </header>

        {sideTab === 'tv' && (
          <section style={{ flex: 1, overflow: 'hidden' }}>
            <TVScreen tvId={activeTVId} tvState={tvStates[activeTVId]} />
          </section>
        )}

        {sideTab === 'phone' && appRole === 'controller' && (
          <section style={{ flex: 1, overflowY: 'auto', background: '#f8fbff' }}>
            <div className="phone-container" style={{ maxWidth: 620, margin: '0 auto', padding: 24 }}>
              {notif && (
                <div style={{ background: notif.includes('failed') ? '#fef2f2' : '#ecfdf5', color: notif.includes('failed') ? '#dc2626' : '#16a34a', padding: '12px 16px', borderRadius: 14, fontSize: 13, fontWeight: 800, marginBottom: 18, border: `1px solid ${notif.includes('failed') ? '#fecaca' : '#bbf7d0'}` }}>
                  {notif}
                </div>
              )}

              {phoneView === 'switchTv' && (
                <PINScreen
                  onLogin={handleControllerLogin}
                  title="Change TV"
                  subtitle="Enter another TV PIN to switch controller"
                />
              )}

              {phoneView === 'tvs' && (
                <div>
                  <div className="ios-title-card">
                    <div>
                      <div className="ios-kicker">All Displays</div>
                      <div className="ios-title">Choose a TV</div>
                      <div className="ios-subtitle">All 10 TVs under the same account. Select a TV to switch the controller to that display.</div>
                    </div>
                    <button onClick={handleLogout} className="ios-logout">Logout</button>
                  </div>

                  <div className="tv-list-grid">
                    {TV_LIST.map(tv => {
                      const isCurrent = loggedInTVId === tv.id;
                      const live = tvStates[tv.id]?.cells?.some((c: any) => c?.mediaUrl);
                      return (
                        <button
                          key={tv.id}
                          onClick={() => handleControllerLogin(tv.id)}
                          className={`ios-tv-card ${isCurrent ? 'selected' : ''}`}
                        >
                          <div className="ios-tv-left">
                            <TVIcon active={isCurrent} live={live} size="sm" />
                            <div>
                              <div className="ios-tv-name">{tv.name}</div>
                              <div className="ios-tv-location">{tv.location}</div>
                            </div>
                          </div>
                          <div className="ios-tv-right">
                            <span className="ios-pin">PIN {TV_PINS[tv.id]}</span>
                            <span className={isCurrent ? 'ios-status active' : 'ios-status'}>{isCurrent ? 'Selected' : live ? 'Live' : 'Ready'}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {phoneView === 'home' && (
                <div>
                  <div className="hero-card ios-home-hero">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <TVIcon size="lg" active live />
                      <div>
                        <div style={{ color: '#0f172a', fontWeight: 900, fontSize: 20 }}>Connected to {loggedInTV.name}</div>
                        <div style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>{loggedInTV.location} · Same account + same PIN</div>
                      </div>
                    </div>
                    <button onClick={handleLogout} className="ios-logout hero-logout">Logout</button>
                  </div>

                  <button onClick={() => { setConnectedTV(loggedInTV); setPhoneView('layout'); }} className="primary-action">
                    <div className="action-icon">▦</div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 16, fontWeight: 900 }}>Select Layout</div>
                      <div style={{ fontSize: 13, opacity: 0.78, marginTop: 3 }}>Choose how to divide {loggedInTV.name} screen</div>
                    </div>
                    <span style={{ marginLeft: 'auto', fontSize: 26 }}>›</span>
                  </button>

                  {selectedLayoutId && (
                    <button onClick={() => setPhoneView('media')} className="secondary-action">
                      <div className="action-icon light">□</div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ color: '#0f172a', fontSize: 16, fontWeight: 900 }}>Push Media</div>
                        <div style={{ color: '#64748b', fontSize: 13, marginTop: 3 }}>Upload image or video to selected zones</div>
                      </div>
                      <span style={{ marginLeft: 'auto', fontSize: 26, color: '#94a3b8' }}>›</span>
                    </button>
                  )}
                </div>
              )}

              {phoneView === 'layout' && connectedTV && (
                <div>
                  <button onClick={() => setPhoneView('home')} className="back-btn">← Back</button>
                  <div className="panel-header">
                    <TVIcon size="md" active live />
                    <div>
                      <div style={{ color: '#0f172a', fontWeight: 900, fontSize: 18 }}>{connectedTV.name}</div>
                      <div style={{ color: '#64748b', fontSize: 13 }}>Select a screen layout</div>
                    </div>
                  </div>
                  <div className="layout-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    {LAYOUTS.map(l => {
                      const sel = selectedLayoutId === l.id;
                      return (
                        <button key={l.id} onClick={() => applyLayout(l.id)} className={`layout-card ${sel ? 'selected' : ''}`}>
                          <div style={{ width: '100%', aspectRatio: '16/9', background: '#f1f5f9', borderRadius: 10, overflow: 'hidden', marginBottom: 10, display: 'grid', gridTemplateColumns: l.cols, gridTemplateRows: l.rows, gap: 3, padding: 4, border: '1px solid #e2e8f0' }}>
                            {Array.from({ length: l.cells }, (_, i) => <div key={i} style={{ background: sel ? ZONE_COLORS[i % ZONE_COLORS.length] : '#cbd5e1', borderRadius: 5, ...(CELL_SPANS[l.id]?.[i] || {}) }} />)}
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 900, color: sel ? '#2563eb' : '#0f172a' }}>{l.name}</span>
                          <span style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>{l.cells} zones</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {phoneView === 'media' && connectedTV && selectedLayout && (
                <div>
                  <div className="media-top-actions" style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
                    <button onClick={() => setPhoneView('layout')} className="back-btn">← Layout</button>
                    <button onClick={() => setPhoneView('home')} className="back-btn">Home</button>
                    <button onClick={() => { setActiveTVId(connectedTV.id); setSideTab('tv'); }} className="view-tv-btn">View TV →</button>
                  </div>
                  <div className="panel-header">
                    <TVIcon size="md" active live />
                    <div>
                      <div style={{ color: '#0f172a', fontWeight: 900, fontSize: 18 }}>{connectedTV.name}</div>
                      <div style={{ color: '#64748b', fontSize: 13 }}>{selectedLayout.name} · {cells.length} zones</div>
                    </div>
                  </div>
                  <div className="section-label">Select Zone</div>
                  <div className="zone-scroll" style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, marginBottom: 18 }}>
                    {cells.map((cell, i) => (
                      <button key={i} onClick={() => setActiveCell(i)} className={`zone-card ${activeCell === i ? 'active' : ''}`}>
                        {cell.mediaUrl ? (
                          cell.mediaType === 'image' ? <img src={cell.mediaUrl} style={{ width: 84, height: 58, borderRadius: 10, objectFit: 'cover' }} alt="" /> : <div className="video-thumb">Video</div>
                        ) : <div className="empty-zone">+</div>}
                        <span>Zone {i + 1}</span>
                      </button>
                    ))}
                  </div>
                  <div className="push-info">Publishing to <strong>{connectedTV.name} · Zone {activeCell + 1}</strong></div>
                  {uploading ? (
                    <div className="upload-box">
                      <div style={{ fontSize: 16, color: '#2563eb', fontWeight: 900 }}>{uploadStatus}</div>
                      <div style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>Please wait...</div>
                    </div>
                  ) : (
                    <>
                      <div className="section-label">Push Media to Zone {activeCell + 1}</div>
                      <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={handleFile} />
                      {[
                        { title: 'Upload Image', sub: 'JPG or PNG → TV display', label: 'Image' },
                        { title: 'Upload Video', sub: 'MP4 video → TV display. Large videos may take a few minutes.', label: 'Video' },
                      ].map(item => (
                        <button key={item.title} onClick={() => fileRef.current?.click()} className="media-action">
                          <div className="media-badge">{item.label}</div>
                          <div style={{ flex: 1, textAlign: 'left' }}>
                            <div style={{ color: '#0f172a', fontSize: 15, fontWeight: 900 }}>{item.title}</div>
                            <div style={{ color: '#64748b', fontSize: 13, marginTop: 3 }}>{item.sub}</div>
                          </div>
                          <span style={{ color: '#94a3b8', fontSize: 24 }}>›</span>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #__next { width: 100%; min-height: 100%; }
        body { overflow: hidden; -webkit-font-smoothing: antialiased; }
        button { font-family: inherit; }
        .nav-btn { width: 82px; padding: 12px 0; border-radius: 16px; border: 1px solid transparent; background: transparent; color: #64748b; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 5px; margin-bottom: 8px; font-size: 11px; font-weight: 900; transition: all 0.15s ease; }
        .nav-btn:hover { background: #f1f5f9; }
        .nav-btn.active { background: #eff6ff; border-color: #bfdbfe; color: #2563eb; }
        .nav-icon { font-size: 18px; line-height: 1; }
        .tv-side-btn { width: 82px; border-radius: 16px; border: 1px solid transparent; background: transparent; padding: 8px 4px; margin-bottom: 6px; cursor: pointer; color: #64748b; font-size: 10px; font-weight: 900; transition: all 0.15s ease; }
        .tv-side-btn:hover { background: #f8fafc; }
        .tv-side-btn.active { background: #eff6ff; border-color: #bfdbfe; color: #2563eb; }
        .logout-btn { width: 44px; height: 44px; border: 1px solid #fecaca; background: #fff7f7; color: #ef4444; border-radius: 14px; padding: 0; cursor: pointer; font-size: 0; font-weight: 900; display: inline-flex; align-items: center; justify-content: center; }
        .logout-btn::before { content: ''; width: 26px; height: 26px; display: block; background: #ef4444; -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4'/%3E%3Cpath d='M16 17l5-5-5-5'/%3E%3Cpath d='M21 12H9'/%3E%3C/svg%3E") center / contain no-repeat; mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4'/%3E%3Cpath d='M16 17l5-5-5-5'/%3E%3Cpath d='M21 12H9'/%3E%3C/svg%3E") center / contain no-repeat; transform: none; }
        .ios-logout { font-size: 0 !important; width: 40px; height: 40px; padding: 0 !important; display: inline-flex; align-items: center; justify-content: center; border-color: #fecaca !important; background: #fff7f7 !important; color: #ef4444 !important; }
        .ios-logout::before { content: ''; width: 24px; height: 24px; display: block; background: #ef4444; -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4'/%3E%3Cpath d='M16 17l5-5-5-5'/%3E%3Cpath d='M21 12H9'/%3E%3C/svg%3E") center / contain no-repeat; mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4'/%3E%3Cpath d='M16 17l5-5-5-5'/%3E%3Cpath d='M21 12H9'/%3E%3C/svg%3E") center / contain no-repeat; transform: none; }
        .top-pill { border-radius: 999px; padding: 7px 12px; display: flex; align-items: center; gap: 8px; font-size: 12px; border: 1px solid; }
        .top-pill.blue { background: #eff6ff; color: #2563eb; border-color: #bfdbfe; }
        .top-pill.green { background: #ecfdf5; color: #16a34a; border-color: #bbf7d0; }
        .dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; display: inline-block; }
        .hero-card { background: linear-gradient(135deg, #ffffff, #eff6ff); border: 1px solid #dbeafe; border-radius: 24px; padding: 22px; margin-bottom: 18px; box-shadow: 0 18px 50px rgba(15,23,42,0.07); }
        .primary-action { width: 100%; background: linear-gradient(135deg, #2563eb, #38bdf8); color: #ffffff; border-radius: 20px; padding: 18px; display: flex; align-items: center; gap: 16px; border: none; cursor: pointer; margin-bottom: 14px; box-shadow: 0 16px 36px rgba(37,99,235,0.25); transition: all 0.15s ease; }
        .primary-action:hover { transform: translateY(-1px); }
        .secondary-action { width: 100%; background: #ffffff; border-radius: 20px; padding: 18px; display: flex; align-items: center; gap: 16px; border: 1px solid #dbeafe; cursor: pointer; margin-bottom: 18px; box-shadow: 0 10px 28px rgba(15,23,42,0.05); }
        .action-icon { width: 52px; height: 52px; border-radius: 16px; background: rgba(255,255,255,0.18); display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 900; }
        .action-icon.light { background: #eff6ff; color: #2563eb; }
        .section-label { color: #64748b; font-size: 11px; font-weight: 900; letter-spacing: 1.6px; text-transform: uppercase; margin: 20px 0 12px; }
        .back-btn { background: #ffffff; border: 1px solid #dbeafe; border-radius: 12px; padding: 9px 14px; cursor: pointer; font-size: 13px; font-weight: 900; color: #334155; }
        .view-tv-btn { margin-left: auto; background: #2563eb; border: none; border-radius: 12px; padding: 9px 14px; cursor: pointer; font-size: 13px; font-weight: 900; color: #ffffff; }
        .panel-header { background: #ffffff; border: 1px solid #dbeafe; border-radius: 22px; padding: 18px; display: flex; align-items: center; gap: 16px; margin-bottom: 18px; box-shadow: 0 12px 34px rgba(15,23,42,0.06); }
        .layout-card { background: #ffffff; border-radius: 18px; padding: 12px; border: 1px solid #e2e8f0; cursor: pointer; display: flex; flex-direction: column; align-items: center; box-shadow: 0 8px 24px rgba(15,23,42,0.04); transition: all 0.15s ease; }
        .layout-card:hover { transform: translateY(-2px); border-color: #bfdbfe; }
        .layout-card.selected { background: #eff6ff; border-color: #2563eb; box-shadow: 0 16px 34px rgba(37,99,235,0.18); }
        .zone-card { flex-shrink: 0; display: flex; flex-direction: column; align-items: center; border: 1px solid #e2e8f0; border-radius: 18px; padding: 8px; background: #ffffff; cursor: pointer; transition: all 0.15s ease; }
        .zone-card.active { border-color: #2563eb; background: #eff6ff; }
        .zone-card span { font-size: 11px; color: #64748b; margin-top: 6px; font-weight: 900; }
        .zone-card.active span { color: #2563eb; }
        .empty-zone { width: 84px; height: 58px; border-radius: 10px; background: #f1f5f9; border: 1px dashed #94a3b8; display: flex; align-items: center; justify-content: center; font-size: 26px; color: #2563eb; font-weight: 800; }
        .video-thumb { width: 84px; height: 58px; border-radius: 10px; background: linear-gradient(135deg, #0f172a, #334155); display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 12px; font-weight: 900; }
        .push-info { background: #eff6ff; border: 1px solid #bfdbfe; border-left: 4px solid #2563eb; color: #334155; border-radius: 16px; padding: 13px 16px; margin-bottom: 18px; font-size: 14px; }
        .push-info strong { color: #2563eb; }
        .upload-box { background: #ffffff; border: 1px solid #dbeafe; border-radius: 22px; padding: 48px 20px; text-align: center; }
        .media-action { width: 100%; background: #ffffff; border-radius: 18px; padding: 16px; display: flex; align-items: center; gap: 14px; border: 1px solid #e2e8f0; cursor: pointer; margin-bottom: 12px; transition: all 0.15s ease; }
        .media-action:hover { transform: translateY(-1px); border-color: #bfdbfe; }
        .media-badge { min-width: 62px; height: 46px; border-radius: 14px; background: #eff6ff; color: #2563eb; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 900; border: 1px solid #bfdbfe; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.25} }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }
        .ios-title-card { background: rgba(255,255,255,0.86); border: 1px solid rgba(226,232,240,0.95); border-radius: 28px; padding: 20px; margin-bottom: 16px; display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; box-shadow: 0 18px 50px rgba(15,23,42,0.07); backdrop-filter: blur(18px); }
        .ios-kicker { color: #2563eb; font-size: 11px; font-weight: 900; letter-spacing: 1.6px; text-transform: uppercase; margin-bottom: 5px; }
        .ios-title { color: #0f172a; font-size: 28px; font-weight: 950; letter-spacing: -0.8px; }
        .ios-subtitle { color: #64748b; font-size: 13px; line-height: 1.5; margin-top: 6px; }
        .ios-logout { border: 1px solid #fecaca; background: #fff7f7; color: #ef4444; border-radius: 999px; padding: 8px 14px; font-size: 12px; font-weight: 900; cursor: pointer; white-space: nowrap; }
        .ios-home-hero { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .hero-logout { flex-shrink: 0; }
        .tv-list-grid { display: grid; gap: 12px; }
        .ios-tv-card { width: 100%; border: 1px solid #e2e8f0; background: rgba(255,255,255,0.9); border-radius: 24px; padding: 14px; display: flex; align-items: center; justify-content: space-between; gap: 12px; cursor: pointer; box-shadow: 0 10px 30px rgba(15,23,42,0.05); transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease; text-align: left; }
        .ios-tv-card:hover { transform: translateY(-1px); border-color: #bfdbfe; box-shadow: 0 16px 34px rgba(37,99,235,0.12); }
        .ios-tv-card.selected { border-color: #2563eb; background: linear-gradient(135deg, #ffffff, #eff6ff); box-shadow: 0 18px 44px rgba(37,99,235,0.18); }
        .ios-tv-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .ios-tv-name { color: #0f172a; font-size: 15px; font-weight: 950; }
        .ios-tv-location { color: #64748b; font-size: 12px; margin-top: 2px; }
        .ios-tv-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; }
        .ios-pin { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; border-radius: 999px; padding: 5px 9px; font-size: 11px; font-weight: 900; }
        .ios-status { background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; border-radius: 999px; padding: 5px 9px; font-size: 10px; font-weight: 900; }
        .ios-status.active { background: #ecfdf5; color: #16a34a; border-color: #bbf7d0; }

        @media (max-width: 768px) {
          body { overflow: auto; }
          .app-shell {
            flex-direction: column !important;
            min-height: 100dvh !important;
            height: 100dvh !important;
            overflow: hidden !important;
          }
          .app-sidebar {
            order: 2 !important;
            width: 100% !important;
            height: 76px !important;
            min-height: 76px !important;
            border-right: none !important;
            border-top: 1px solid #e2e8f0 !important;
            flex-direction: row !important;
            justify-content: space-between !important;
            align-items: center !important;
            gap: 6px !important;
            padding: 8px 10px calc(8px + env(safe-area-inset-bottom)) !important;
            overflow: visible !important;
            box-shadow: 0 -8px 24px rgba(15,23,42,0.06) !important;
          }
          .app-sidebar > div:first-child,
          .app-sidebar > div[style*="width: 54"],
          .tv-side-btn {
            display: none !important;
          }
          .logout-btn {
            width: 46px !important;
            min-width: 46px !important;
            height: 46px !important;
            margin: 0 !important;
            padding: 0 !important;
            border-radius: 16px !important;
            flex: 0 0 52px !important;
            font-size: 0 !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          .logout-btn::before {
            width: 24px !important;
            height: 24px !important;
          }
          .nav-btn {
            width: auto !important;
            min-width: 0 !important;
            flex: 1 1 0 !important;
            max-width: 92px !important;
            height: 52px !important;
            flex-direction: column !important;
            justify-content: center !important;
            padding: 4px 6px !important;
            margin: 0 !important;
            border-radius: 16px !important;
            font-size: 10px !important;
            gap: 3px !important;
          }
          .nav-icon {
            font-size: 17px !important;
          }
          .app-main {
            order: 1 !important;
            height: calc(100dvh - 76px) !important;
            min-height: 0 !important;
            overflow: hidden !important;
          }
          .app-header {
            height: auto !important;
            min-height: 64px !important;
            padding: 10px 12px !important;
            gap: 10px !important;
            flex-wrap: wrap !important;
          }
          .app-header > div:nth-child(2) {
            min-width: 0 !important;
            flex: 1 !important;
          }
          .app-header > div:nth-child(2) div:first-child {
            font-size: 14px !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          }
          .app-header > div:last-child {
            width: 100% !important;
            margin-left: 0 !important;
            justify-content: space-between !important;
            gap: 8px !important;
          }
          .top-pill {
            padding: 6px 10px !important;
            font-size: 11px !important;
            max-width: 48% !important;
            overflow: hidden !important;
            white-space: nowrap !important;
          }
          .phone-container {
            width: 100% !important;
            max-width: 100% !important;
            padding: 14px 12px 22px !important;
          }
          .hero-card, .panel-header {
            border-radius: 18px !important;
            padding: 14px !important;
            margin-bottom: 14px !important;
          }
          .hero-card > div, .panel-header {
            gap: 12px !important;
          }
          .primary-action, .secondary-action, .media-action {
            border-radius: 16px !important;
            padding: 14px !important;
            margin-bottom: 12px !important;
            gap: 12px !important;
          }
          .action-icon {
            width: 44px !important;
            height: 44px !important;
            min-width: 44px !important;
            border-radius: 14px !important;
            font-size: 20px !important;
          }
          .layout-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 10px !important;
          }
          .layout-card {
            padding: 10px !important;
            border-radius: 16px !important;
          }
          .zone-scroll {
            gap: 10px !important;
            margin-left: -2px !important;
            padding-left: 2px !important;
          }
          .zone-card {
            border-radius: 16px !important;
            padding: 7px !important;
          }
          .empty-zone,
          .video-thumb,
          .zone-card img {
            width: 72px !important;
            height: 50px !important;
          }
          .push-info {
            border-radius: 14px !important;
            padding: 12px 14px !important;
            font-size: 13px !important;
          }
          .media-top-actions {
            flex-wrap: wrap !important;
            gap: 8px !important;
          }
          .back-btn, .view-tv-btn {
            flex: 1 !important;
            padding: 10px 12px !important;
            font-size: 12px !important;
            text-align: center !important;
            margin-left: 0 !important;
          }
          .section-label {
            font-size: 10px !important;
            margin: 16px 0 10px !important;
          }
          .upload-box {
            border-radius: 18px !important;
            padding: 34px 16px !important;
          }
        }

        @media (max-width: 420px) {
          .layout-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .primary-action div[style*="font-size: 16"],
          .secondary-action div[style*="font-size: 16"] {
            font-size: 14px !important;
          }
          .media-badge {
            min-width: 52px !important;
            height: 42px !important;
            font-size: 12px !important;
          }
        }
      `}</style>
    </div>
  );
}
