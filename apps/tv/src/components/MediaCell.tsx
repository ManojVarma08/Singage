type MediaCellType = {
  mediaUrl?: string | null;
  mediaType?: 'image' | 'video' | string | null;
};

interface Props {
  cell: MediaCellType;
  index: number;
  isPip?: boolean;
}

export function MediaCell({ cell, index, isPip }: Props) {
  const style = isPip
    ? {
        position: 'fixed' as const,
        bottom: 16,
        right: 16,
        width: '28%',
        height: '28%',
        border: '2px solid #1e4fd8',
        overflow: 'hidden' as const,
        zIndex: 10,
        borderRadius: 4,
        background: '#000',
      }
    : {
        overflow: 'hidden' as const,
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
      };

  if (!cell?.mediaUrl) {
    return (
      <div style={style}>
        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 14 }}>
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
          autoPlay
          loop
          muted
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            background: '#000',
          }}
        />
      ) : (
        <img
          src={cell.mediaUrl}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            background: '#000',
          }}
        />
      )}
    </div>
  );
}