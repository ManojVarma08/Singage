import { MediaCell } from './MediaCell';

const LAYOUTS: any[] = [
  { id: 'L1',  name: 'Full Screen', cells: 1, cols: '1fr',         rows: '1fr',         pip: false },
  { id: 'L2',  name: 'Split H',     cells: 2, cols: '1fr 1fr',     rows: '1fr',         pip: false },
  { id: 'L3',  name: 'Split V',     cells: 2, cols: '1fr',         rows: '1fr 1fr',     pip: false },
  { id: 'L4',  name: '2x2 Grid',    cells: 4, cols: '1fr 1fr',     rows: '1fr 1fr',     pip: false },
  { id: 'L5',  name: '3 Column',    cells: 3, cols: '1fr 1fr 1fr', rows: '1fr',         pip: false },
  { id: 'L6',  name: 'Big Left',    cells: 3, cols: '2fr 1fr',     rows: '1fr 1fr',     pip: false },
  { id: 'L7',  name: 'Big Right',   cells: 3, cols: '1fr 2fr',     rows: '1fr 1fr',     pip: false },
  { id: 'L8',  name: '4 Zones',     cells: 4, cols: '1fr 1fr',     rows: '1fr 1fr',     pip: false },
  { id: 'L9',  name: 'Banner + 2',  cells: 3, cols: '1fr 1fr',     rows: '2fr 1fr',     pip: false },
  { id: 'L10', name: 'Triple Row',  cells: 3, cols: '1fr 1fr 1fr', rows: '1fr',         pip: false },
  { id: 'L11', name: 'Pic-in-Pic',  cells: 2, cols: '1fr',         rows: '1fr',         pip: true  },
  { id: 'L12', name: 'Mosaic',      cells: 5, cols: '2fr 1fr',     rows: '1fr 1fr 1fr', pip: false },
];

const CELL_SPANS: any = {
  L6:  { 0: { gridRow: '1 / 3' } },
  L7:  { 2: { gridRow: '1 / 3', gridColumn: '2' } },
  L9:  { 0: { gridColumn: '1 / 3' } },
  L12: { 0: { gridRow: '1 / 3' } },
};

interface Props {
  state: any;
}

export function MediaGrid({ state }: Props) {
  // Support both layoutId (old) and layout_id (Supabase)
  const layoutId = state.layout_id || state.layoutId;
  const layout = LAYOUTS.find(l => l.id === layoutId);
  if (!layout) return null;

  const cellSpans = CELL_SPANS[layoutId] || {};
  const isPip = layout.pip;

  return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'grid',
      gridTemplateColumns: layout.cols,
      gridTemplateRows: layout.rows,
      gap: 3,
      background: '#000',
      position: 'relative',
    }}>
      {state.cells.map((cell: any, i: number) => {
        if (isPip && i === 1) return null;
        return (
          <div key={i} style={{ overflow: 'hidden', ...(cellSpans[i] || {}) }}>
            <MediaCell cell={cell} index={i} />
          </div>
        );
      })}
      {isPip && state.cells[1] && (
        <MediaCell cell={state.cells[1]} index={1} isPip />
      )}
      <div style={{
        position: 'fixed', bottom: 14, left: 14,
        background: 'rgba(0,0,0,0.65)', borderRadius: 20,
        padding: '5px 14px', display: 'flex', alignItems: 'center', gap: 7,
        backdropFilter: 'blur(4px)', zIndex: 20,
      }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
        <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{state.tv_id || state.tvId}</span>
      </div>
    </div>
  );
}