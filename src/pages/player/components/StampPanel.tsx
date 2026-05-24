import { useCallback, useEffect, useRef } from 'react';
import { STAMPS } from '../../../stamps';
import { colors, radius } from '../../../styles/theme';
import type { TypedSocket } from '../../../lib/socket';

const PANEL_HEIGHT = 64;
const STATUS_BAR_HEIGHT = 48;
const DRAG_THRESHOLD = 5;

interface Props {
  socket: TypedSocket;
  showAboveStatusBar: boolean;
}

export default function StampPanel({ socket, showAboveStatusBar }: Props) {
  const bottomOffset = showAboveStatusBar ? STATUS_BAR_HEIGHT : 0;
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ startX: 0, scrollStart: 0, moved: false });

  const handleStamp = useCallback((stampId: string) => {
    socket.emit('sendStamp', { stampId });
  }, [socket]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el) return;
    dragRef.current = { startX: e.pageX, scrollStart: el.scrollLeft, moved: false };

    const onMouseMove = (me: MouseEvent) => {
      const dx = me.pageX - dragRef.current.startX;
      if (Math.abs(dx) > DRAG_THRESHOLD) dragRef.current.moved = true;
      el.scrollLeft = dragRef.current.scrollStart - dx;
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, []);

  // ドラッグ後のクリックをキャンセル（capture phaseでボタンのonClickより先に判定）
  const handleClickCapture = useCallback((e: React.MouseEvent) => {
    if (dragRef.current.moved) {
      e.stopPropagation();
      dragRef.current.moved = false;
    }
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  return (
    <div style={{ ...styles.panel, bottom: bottomOffset }}>
      <div
        ref={scrollRef}
        style={styles.scrollArea}
        onMouseDown={handleMouseDown}
        onClickCapture={handleClickCapture}
      >
        {STAMPS.map(stamp => (
          <button
            key={stamp.id}
            onClick={() => handleStamp(stamp.id)}
            style={styles.stampBtn}
            aria-label={stamp.label}
          >
            <img
              src={stamp.src}
              alt={stamp.label}
              style={styles.stampImg}
              draggable={false}
            />
          </button>
        ))}
        <div style={styles.scrollEnd} />
      </div>
    </div>
  );
}

const styles = {
  panel: {
    position: 'fixed' as const,
    left: 0,
    right: 0,
    height: `${PANEL_HEIGHT}px`,
    background: 'rgba(26, 11, 46, 0.92)',
    backdropFilter: 'blur(8px)',
    borderTop: `1px solid ${colors.border}`,
    zIndex: 99,
    display: 'flex',
    flexDirection: 'column' as const,
  },
  scrollArea: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    overflowX: 'auto' as const,
    padding: '6px 8px',
    scrollbarWidth: 'none' as const,
    userSelect: 'none' as const,
    cursor: 'grab',
    WebkitOverflowScrolling: 'touch' as const,
  },
  stampBtn: {
    flexShrink: 0,
    width: '44px',
    height: '44px',
    padding: '2px',
    background: 'rgba(123, 44, 191, 0.3)',
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    cursor: 'pointer',
    transition: 'transform 0.1s, background 0.1s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties,
  stampImg: {
    width: '36px',
    height: '36px',
    objectFit: 'contain' as const,
    pointerEvents: 'none' as const,
  },
  scrollEnd: {
    minWidth: '8px',
    flexShrink: 0,
  },
};
