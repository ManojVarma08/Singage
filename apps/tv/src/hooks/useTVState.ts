import { useState, useEffect } from 'react';

const SUPABASE_URL = 'https://wkilfvbytdazmnohksiu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndraWxmdmJ5dGRhem1ub2hrc2l1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNDI1NTgsImV4cCI6MjA5MjYxODU1OH0.3pZ6vHJXFmniWtMQo5KHZkovEwkuC4shaDw6FZOJtVE';

export function useTVState(tvId: string) {
  const [state, setState] = useState<any>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!tvId) return;

    const poll = async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/tv_states?tv_id=eq.${tvId}&select=*`,
          {
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
            },
          }
        );
        if (res.ok) {
          const data = await res.json();
          if (data?.[0]) setState(data[0]);
          setConnected(true);
        }
      } catch {
        setConnected(false);
      }
    };

    poll();
    const t = setInterval(poll, 2000);
    return () => clearInterval(t);
  }, [tvId]);

  return { state, connected };
}