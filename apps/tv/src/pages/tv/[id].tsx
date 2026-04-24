import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useTVState } from '../../hooks/useTVState';
import { WaitingScreen } from '../../components/WaitingScreen';
import { MediaGrid } from '../../components/MediaGrid';

function hasMedia(state: any): boolean {
  if (!state) return false;
  return state.cells?.some((c: any) => c?.mediaUrl);
}

export default function TVPage() {
  const router = useRouter();
  const [tvId, setTvId] = useState('TV1');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (router.isReady) {
      if (router.query.id) {
        setTvId(String(router.query.id).toUpperCase());
      }
      setReady(true);
    }
  }, [router.isReady, router.query.id]);

  const { state, connected } = useTVState(tvId);

  if (!ready) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: '#020810', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#627d98', fontSize: 14 }}>Loading...</div>
      </div>
    );
  }

  if (!state || !hasMedia(state)) {
    return <WaitingScreen tvId={tvId} connected={connected} />;
  }

  return <MediaGrid state={state} />;
}