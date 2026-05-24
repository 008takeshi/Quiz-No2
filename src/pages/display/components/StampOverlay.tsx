import { STAMP_MAP } from '../../../stamps';
import { colors, fontSize } from '../../../styles/theme';

export interface ActiveStamp {
  id: string;
  stampId: string;
  playerName: string;
  x: number;   // 画面左端からの割合 (5〜80)
  y: number;   // 画面下端からの割合 (3〜25)
}

interface Props {
  stamps: ActiveStamp[];
}

const STAMP_SIZE = 80;
const ANIM_DURATION_MS = 2800;

export default function StampOverlay({ stamps }: Props) {
  if (stamps.length === 0) return null;

  return (
    <div style={styles.overlay}>
      {stamps.map(stamp => (
        <StampItem key={stamp.id} stamp={stamp} />
      ))}
    </div>
  );
}

function StampItem({ stamp }: { stamp: ActiveStamp }) {
  const def = STAMP_MAP.get(stamp.stampId);
  if (!def) return null;

  return (
    <div
      style={{
        ...styles.stampWrapper,
        left: `${stamp.x}%`,
        bottom: `${stamp.y}%`,
        animation: `stampFloat ${ANIM_DURATION_MS}ms linear forwards`,
      }}
    >
      <img
        src={def.src}
        alt={def.label}
        style={styles.stampImg}
        draggable={false}
      />
      <div style={styles.playerName}>{stamp.playerName}</div>
    </div>
  );
}

/** DisplayApp の useRef カウンターを受け取り、横レーン位置（%）を返す純粋関数 */
export function getStampX(laneIndex: number): number {
  const lanes = [8, 18, 30, 42, 54, 66, 76];
  return lanes[laneIndex % lanes.length];
}

/** 出現高さをランダムに返す（画面下端からの %） */
export function getStampY(): number {
  return Math.floor(Math.random() * 40) + 5; // 5〜45%（画面下半分の中でばらつき）
}

export const STAMP_DISPLAY_DURATION_MS = ANIM_DURATION_MS;

const styles = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    pointerEvents: 'none' as const,
    zIndex: 200,
    overflow: 'hidden',
  },
  stampWrapper: {
    position: 'absolute' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px',
  },
  stampImg: {
    width: `${STAMP_SIZE}px`,
    height: `${STAMP_SIZE}px`,
    objectFit: 'contain' as const,
    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.6))',
  },
  playerName: {
    fontSize: fontSize.sm,
    fontWeight: 700,
    color: colors.textSecondary,
    textShadow: '0 1px 4px rgba(0,0,0,0.8)',
    whiteSpace: 'nowrap' as const,
    maxWidth: '120px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    textAlign: 'center' as const,
  },
};
