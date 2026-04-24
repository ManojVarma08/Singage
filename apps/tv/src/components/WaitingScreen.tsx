import { useEffect, useRef } from 'react';

interface Props {
  tvId: string;
  connected: boolean;
}

function drawQR(canvas: HTMLCanvasElement, value: string, size: number) {
  const ctx = canvas.getContext('2d')!;
  const N = 21;
  const cell = size / (N + 8);
  const offset = cell * 4;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#0a1628';

  const fp = (r: number, c: number) => {
    for (let i = 0; i < 7; i++)
      for (let j = 0; j < 7; j++) {
        const on = i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4);
        if (on) ctx.fillRect(offset + (c+j)*cell, offset + (r+i)*cell, cell-0.5, cell-0.5);
      }
  };
  fp(0,0); fp(0,14); fp(14,0);

  for (let i = 8; i < 13; i++) {
    if (i % 2 === 0) {
      ctx.fillRect(offset + i*cell, offset + 6*cell, cell-0.5, cell-0.5);
      ctx.fillRect(offset + 6*cell, offset + i*cell, cell-0.5, cell-0.5);
    }
  }

  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (r < 8 && c < 8) continue;
      if (r < 8 && c > 12) continue;
      if (r > 12 && c < 8) continue;
      if (r === 6 || c === 6) continue;
      if (((r * 17 + c * 11 + hash + r*c) % 4) === 0) {
        ctx.fillRect(offset + c*cell, offset + r*cell, cell-0.5, cell-0.5);
      }
    }
  }
}

export function WaitingScreen({ tvId, connected }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) drawQR(canvasRef.current, tvId, 220);
  }, [tvId]);

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: 'radial-gradient(circle at 50% 40%, #0d1e3a 0%, #020810 70%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif', color: '#fff',
    }}>
      {/* Animated rings */}
      <div style={{ position: 'relative', marginBottom: 48 }}>
        <div style={{ position: 'absolute', inset: -28, borderRadius: '50%', border: '2px solid rgba(30,79,216,0.25)', animation: 'pulse 3s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', inset: -56, borderRadius: '50%', border: '1px solid rgba(30,79,216,0.12)', animation: 'pulse 3s ease-in-out infinite 0.7s' }} />

        {/* QR Code Box */}
        <div style={{
          background: '#fff', borderRadius: 24, padding: 24,
          border: '3px solid #1e4fd8',
          boxShadow: '0 8px 80px rgba(30,79,216,0.5)',
          position: 'relative', zIndex: 1,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <canvas ref={canvasRef} width={220} height={220} style={{ display: 'block' }} />
          <div style={{
            marginTop: 14, fontSize: 18, fontWeight: 900,
            color: '#0a1628', letterSpacing: 4,
          }}>{tvId}</div>
        </div>
      </div>

      <div style={{ fontSize: 36, fontWeight: 900, marginBottom: 12, letterSpacing: 1 }}>
        Display Ready
      </div>
      <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 18, marginBottom: 8 }}>
        Scan QR code using <strong style={{ color: '#fff' }}>Signage Ctrl</strong> app
      </div>
      <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, marginBottom: 36 }}>
        Waiting for content...
      </div>

      {/* Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: connected ? '#22c55e' : '#ef4444',
          animation: 'blink 1.2s ease infinite',
        }} />
        <span style={{
          color: connected ? '#22c55e' : '#ef4444',
          fontSize: 15, fontWeight: 700,
        }}>
          {connected ? 'Connected · Waiting for content' : 'Connecting...'}
        </span>
      </div>
    </div>
  );
}
