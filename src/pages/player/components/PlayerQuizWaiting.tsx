import { colors, ui, spacing, fontSize, radius } from '../../../styles/theme';

interface Props {
  message?: string;
  lookAtScreen?: boolean;
}

export default function PlayerQuizWaiting({
  message = '次の問題を準備中...',
  lookAtScreen = false,
}: Props) {
  if (lookAtScreen) {
    return (
      <div style={styles.container}>
        <div style={styles.lookContent}>
          <div style={styles.arrowWrapper}>
            <div style={styles.arrowUp} />
          </div>
          <div style={styles.monitor}>
            <div style={styles.monitorScreen} />
            <div style={styles.monitorNeck} />
            <div style={styles.monitorBase} />
          </div>
          <p style={styles.lookHeading}>共有画面を見てください</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.spinner} />
        <p style={styles.text}>{message}</p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { ...ui.pageCenterGradient, padding: '0' },

  // --- 通常待機 ---
  content: { textAlign: 'center' },
  spinner: ui.spinnerLarge,
  text: { fontSize: fontSize['2xl'], color: colors.textSecondary },

  // --- 共有画面注目 ---
  lookContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing['4'],
  },
  arrowWrapper: {
    animation: 'arrowBounce 0.9s ease-in-out infinite',
  },
  arrowUp: {
    width: 0,
    height: 0,
    borderLeft: '28px solid transparent',
    borderRight: '28px solid transparent',
    borderBottom: `44px solid ${colors.amber}`,
  },

  // モニターアイコン（CSS描画）
  monitor: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  monitorScreen: {
    width: '88px',
    height: '62px',
    borderRadius: radius.lg,
    border: `5px solid ${colors.amber}`,
    backgroundColor: colors.bgDeep,
    animation: 'screenGlow 1.4s ease-in-out infinite',
  },
  monitorNeck: {
    width: '14px',
    height: '12px',
    backgroundColor: colors.amber,
  },
  monitorBase: {
    width: '52px',
    height: '6px',
    backgroundColor: colors.amber,
    borderRadius: radius.sm,
  },

  lookHeading: {
    fontSize: fontSize['3xl'],
    fontWeight: 800,
    color: colors.amber,
    textAlign: 'center',
    lineHeight: 1.3,
    letterSpacing: '0.02em',
  },
  lookSub: {
    fontSize: fontSize.xl,
    color: colors.textSecondary,
    textAlign: 'center',
  },
};
