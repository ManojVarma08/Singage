import type { MediaCell as MediaCellType } from '../../../../packages/shared/src/types';

interface Props {
  cell: MediaCellType;
  index: number;
  isPip?: boolean;
}

export function MediaCell({ cell, index, isPip }: Props) {
  const style: React.CSSProperties = isPip ? {
    position: 'fixed', bottom: 16, right: 16,
    width: '28%', height: '28%',
    border: '2px solid #1e4fd8', overflow: 'hidden',
    zIndex: 10, borderRadius: 4,
  } : {
    overflow: 'hidden', background: '#0d1e3a',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '100%', height: '100%',
  };

  if (!cell?.mediaUrl) {
    return (
      <div style={style}>
        <span style={{ color: 'rgba(255,255,255,0.08)', fontSize: 14 }}>
          Zone {index + 1}
        </span>
      </div>
    );
  }

  return (
    <div style={style}>
      {cell.mediaType === 'video' ? (
        <video
          src={cell.mediaUrl}
          autoPlay loop muted playsInline
          style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
        />
      ) : (
        <img
          src={cell.mediaUrl}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
        />
      )}
    </div>
  );
}
